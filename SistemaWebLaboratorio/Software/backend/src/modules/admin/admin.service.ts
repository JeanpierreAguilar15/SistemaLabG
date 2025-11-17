import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ValidateCedulaEcuatoriana } from './dto/user.dto';
import { ValidateRucEcuador } from './dto/supplier.dto';
import { AdminEventsService } from './admin-events.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private eventsService: AdminEventsService,
  ) {}

  // ==================== USUARIOS ====================

  async getAllUsers(page: number = 1, limit: number = 20, filters?: any) {
    const skip = (page - 1) * limit;

    const where: Prisma.UsuarioWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { nombres: { contains: filters.search, mode: 'insensitive' } },
        { apellidos: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { cedula: { contains: filters.search } },
      ];
    }

    if (filters?.codigo_rol) {
      where.codigo_rol = parseInt(filters.codigo_rol);
    }

    if (filters?.activo !== undefined) {
      where.activo = filters.activo === 'true';
    }

    const [users, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        include: {
          rol: true,
        },
        orderBy: { fecha_creacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    // Remover información sensible
    const sanitizedUsers = users.map(({ password_hash, salt, ...user }) => user);

    return {
      data: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(codigo_usuario: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { codigo_usuario },
      include: {
        rol: true,
        perfil_medico: true,
        sesiones: {
          where: { activo: true },
          orderBy: { fecha_creacion: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { password_hash, salt, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async createUser(data: any) {
    // Validar formato de cédula ecuatoriana
    if (!ValidateCedulaEcuatoriana(data.cedula)) {
      throw new BadRequestException('La cédula ecuatoriana no es válida');
    }

    // Validar que el email y cedula no existan
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: data.email },
          { cedula: data.cedula },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException('El email o cédula ya están registrados');
    }

    // Generar salt y hash de password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const { password, ...userData } = data;

    const user = await this.prisma.usuario.create({
      data: {
        ...userData,
        password_hash,
        salt,
      },
      include: {
        rol: true,
      },
    });

    // Emitir evento de creación de usuario
    this.eventsService.emitUserCreated(
      user.codigo_usuario,
      0, // TODO: Obtener del contexto de autenticación
      { rol: user.rol.nombre, email: user.email, nombres: user.nombres },
    );

    const { password_hash: _, salt: __, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async updateUser(codigo_usuario: number, data: any) {
    const user = await this.prisma.usuario.findUnique({
      where: { codigo_usuario },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar formato de cédula si se está actualizando
    if (data.cedula && !ValidateCedulaEcuatoriana(data.cedula)) {
      throw new BadRequestException('La cédula ecuatoriana no es válida');
    }

    // Si se está actualizando email o cedula, validar que no existan
    if (data.email || data.cedula) {
      const existingUser = await this.prisma.usuario.findFirst({
        where: {
          AND: [
            { codigo_usuario: { not: codigo_usuario } },
            {
              OR: [
                ...(data.email ? [{ email: data.email }] : []),
                ...(data.cedula ? [{ cedula: data.cedula }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        throw new BadRequestException('El email o cédula ya están registrados');
      }
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { codigo_usuario },
      data,
      include: {
        rol: true,
      },
    });

    // Emitir evento de actualización de usuario
    this.eventsService.emitUserUpdated(
      codigo_usuario,
      0, // TODO: Obtener del contexto de autenticación
      { changedFields: Object.keys(data) },
    );

    const { password_hash, salt, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }

  async deleteUser(codigo_usuario: number) {
    // Verificar que el usuario existe
    const user = await this.prisma.usuario.findUnique({
      where: { codigo_usuario },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // En lugar de eliminar, desactivar el usuario
    const updatedUser = await this.prisma.usuario.update({
      where: { codigo_usuario },
      data: { activo: false },
    });

    // Emitir evento de eliminación (soft delete)
    this.eventsService.emitUserDeleted(codigo_usuario, 0);

    const { password_hash, salt, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }

  async toggleUserStatus(codigo_usuario: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { codigo_usuario },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updatedUser = await this.prisma.usuario.update({
      where: { codigo_usuario },
      data: { activo: !user.activo },
    });

    // Emitir evento de cambio de estado
    this.eventsService.emitEvent(
      'admin.user.status_changed' as any,
      {
        entityType: 'user',
        entityId: codigo_usuario,
        action: 'updated',
        userId: 0,
        data: { activo: updatedUser.activo },
        timestamp: new Date(),
      },
    );

    const { password_hash, salt, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }

  async resetUserPassword(codigo_usuario: number, newPassword: string) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await this.prisma.usuario.update({
      where: { codigo_usuario },
      data: {
        password_hash,
        salt,
        intentos_fallidos: 0,
        cuenta_bloqueada: false,
        fecha_bloqueo: null,
      },
    });

    // Emitir evento de actualización de usuario (password reset)
    this.eventsService.emitUserUpdated(
      codigo_usuario,
      0, // TODO: Obtener del contexto de autenticación
      { action: 'password_reset', cuenta_desbloqueada: true },
    );

    return { message: 'Contraseña restablecida exitosamente' };
  }

  // ==================== ROLES ====================

  async getAllRoles() {
    return this.prisma.rol.findMany({
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
      orderBy: { nivel_acceso: 'desc' },
    });
  }

  async getRoleById(codigo_rol: number) {
    const role = await this.prisma.rol.findUnique({
      where: { codigo_rol },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return role;
  }

  async createRole(data: Prisma.RolCreateInput) {
    const role = await this.prisma.rol.create({
      data,
    });

    // Emitir evento de creación de rol
    this.eventsService.emitRoleCreated(
      role.codigo_rol,
      0, // TODO: Obtener del contexto de autenticación
      { nombre: role.nombre, nivel_acceso: role.nivel_acceso },
    );

    return role;
  }

  async updateRole(codigo_rol: number, data: Prisma.RolUpdateInput) {
    const role = await this.prisma.rol.findUnique({
      where: { codigo_rol },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    const updatedRole = await this.prisma.rol.update({
      where: { codigo_rol },
      data,
    });

    // Emitir evento de actualización de rol
    this.eventsService.emitRoleUpdated(
      codigo_rol,
      0, // TODO: Obtener del contexto de autenticación
      { changedFields: Object.keys(data) },
    );

    return updatedRole;
  }

  async deleteRole(codigo_rol: number) {
    const role = await this.prisma.rol.findUnique({
      where: { codigo_rol },
      include: {
        _count: {
          select: { usuarios: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (role._count.usuarios > 0) {
      throw new BadRequestException('No se puede eliminar un rol con usuarios asignados');
    }

    const deletedRole = await this.prisma.rol.delete({
      where: { codigo_rol },
    });

    // Emitir evento de eliminación de rol
    this.eventsService.emitRoleDeleted(codigo_rol, 0);

    return deletedRole;
  }

  // ==================== SERVICIOS ====================

  async getAllServices() {
    return this.prisma.servicio.findMany({
      include: {
        _count: {
          select: { slots: true, horarios: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getServiceById(codigo_servicio: number) {
    const service = await this.prisma.servicio.findUnique({
      where: { codigo_servicio },
      include: {
        horarios: {
          include: {
            sede: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return service;
  }

  async createService(data: Prisma.ServicioCreateInput) {
    const service = await this.prisma.servicio.create({
      data,
    });

    // Emitir evento de creación de servicio
    this.eventsService.emitServiceCreated(
      service.codigo_servicio,
      0, // TODO: Obtener del contexto de autenticación
      { nombre: service.nombre, activo: service.activo },
    );

    return service;
  }

  async updateService(codigo_servicio: number, data: Prisma.ServicioUpdateInput) {
    const service = await this.prisma.servicio.findUnique({
      where: { codigo_servicio },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const updatedService = await this.prisma.servicio.update({
      where: { codigo_servicio },
      data,
    });

    // Emitir evento de actualización de servicio
    this.eventsService.emitServiceUpdated(
      codigo_servicio,
      0, // TODO: Obtener del contexto de autenticación
      { changedFields: Object.keys(data) },
    );

    return updatedService;
  }

  async deleteService(codigo_servicio: number) {
    const service = await this.prisma.servicio.findUnique({
      where: { codigo_servicio },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    // Desactivar en lugar de eliminar
    const result = await this.prisma.servicio.update({
      where: { codigo_servicio },
      data: { activo: false },
    });

    // Emitir evento de eliminación de servicio (soft delete)
    this.eventsService.emitServiceDeleted(codigo_servicio, 0);

    return result;
  }

  // ==================== SEDES ====================

  async getAllLocations() {
    return this.prisma.sede.findMany({
      include: {
        _count: {
          select: { slots: true, horarios: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getLocationById(codigo_sede: number) {
    const location = await this.prisma.sede.findUnique({
      where: { codigo_sede },
      include: {
        horarios: {
          include: {
            servicio: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException('Sede no encontrada');
    }

    return location;
  }

  async createLocation(data: Prisma.SedeCreateInput) {
    const location = await this.prisma.sede.create({
      data,
    });

    // Emitir evento de creación de sede
    this.eventsService.emitLocationCreated(
      location.codigo_sede,
      0, // TODO: Obtener del contexto de autenticación
      { nombre: location.nombre, direccion: location.direccion, activo: location.activo },
    );

    return location;
  }

  async updateLocation(codigo_sede: number, data: Prisma.SedeUpdateInput) {
    const location = await this.prisma.sede.findUnique({
      where: { codigo_sede },
    });

    if (!location) {
      throw new NotFoundException('Sede no encontrada');
    }

    const updatedLocation = await this.prisma.sede.update({
      where: { codigo_sede },
      data,
    });

    // Emitir evento de actualización de sede
    this.eventsService.emitLocationUpdated(
      codigo_sede,
      0, // TODO: Obtener del contexto de autenticación
      { changedFields: Object.keys(data) },
    );

    return updatedLocation;
  }

  async deleteLocation(codigo_sede: number) {
    const location = await this.prisma.sede.findUnique({
      where: { codigo_sede },
    });

    if (!location) {
      throw new NotFoundException('Sede no encontrada');
    }

    // Desactivar en lugar de eliminar
    const result = await this.prisma.sede.update({
      where: { codigo_sede },
      data: { activo: false },
    });

    // Emitir evento de eliminación de sede (soft delete)
    this.eventsService.emitLocationDeleted(codigo_sede, 0);

    return result;
  }

  // ==================== EXAMENES ====================

  async getAllExams(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;

    const where: Prisma.ExamenWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { codigo_interno: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.codigo_categoria) {
      where.codigo_categoria = parseInt(filters.codigo_categoria);
    }

    if (filters?.activo !== undefined) {
      where.activo = filters.activo === 'true';
    }

    const [exams, total] = await Promise.all([
      this.prisma.examen.findMany({
        where,
        include: {
          categoria: true,
          precios: {
            where: { activo: true },
            orderBy: { fecha_inicio: 'desc' },
            take: 1,
          },
        },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.examen.count({ where }),
    ]);

    return {
      data: exams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getExamById(codigo_examen: number) {
    const exam = await this.prisma.examen.findUnique({
      where: { codigo_examen },
      include: {
        categoria: true,
        precios: {
          orderBy: { fecha_inicio: 'desc' },
        },
        examenes_en_paquetes: {
          include: {
            paquete: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    return exam;
  }

  async createExam(data: any) {
    // Verificar que el codigo_interno no exista
    const existingExam = await this.prisma.examen.findUnique({
      where: { codigo_interno: data.codigo_interno },
    });

    if (existingExam) {
      throw new BadRequestException('El código interno ya existe');
    }

    const exam = await this.prisma.examen.create({
      data,
      include: {
        categoria: true,
      },
    });

    // Emitir evento de creación de examen
    this.eventsService.emitExamCreated(
      exam.codigo_examen,
      0,
      { nombre: exam.nombre, codigo_interno: exam.codigo_interno, activo: exam.activo },
    );

    return exam;
  }

  async updateExam(codigo_examen: number, data: any) {
    const exam = await this.prisma.examen.findUnique({
      where: { codigo_examen },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    // Si se está actualizando el codigo_interno, validar que no exista
    if (data.codigo_interno && data.codigo_interno !== exam.codigo_interno) {
      const existingExam = await this.prisma.examen.findUnique({
        where: { codigo_interno: data.codigo_interno },
      });

      if (existingExam) {
        throw new BadRequestException('El código interno ya existe');
      }
    }

    const updatedExam = await this.prisma.examen.update({
      where: { codigo_examen },
      data,
      include: {
        categoria: true,
      },
    });

    // Emitir evento de actualización de examen
    this.eventsService.emitExamUpdated(
      codigo_examen,
      0,
      { changedFields: Object.keys(data) },
    );

    return updatedExam;
  }

  async deleteExam(codigo_examen: number) {
    const exam = await this.prisma.examen.findUnique({
      where: { codigo_examen },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    // Desactivar en lugar de eliminar
    const result = await this.prisma.examen.update({
      where: { codigo_examen },
      data: { activo: false },
    });

    // Emitir evento de eliminación de examen
    this.eventsService.emitExamDeleted(codigo_examen, 0);

    return result;
  }

  // ==================== PRECIOS ====================

  async createPrice(data: any) {
    const price = await this.prisma.precio.create({
      data: {
        precio: data.precio,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        activo: data.activo !== undefined ? data.activo : true,
        examen: {
          connect: { codigo_examen: data.codigo_examen },
        },
      },
      include: {
        examen: true,
      },
    });

    // Emitir evento de creación de precio
    this.eventsService.emitPriceCreated(
      price.codigo_precio,
      data.codigo_examen,
      0,
      { precio: price.precio, fecha_inicio: price.fecha_inicio },
    );

    return price;
  }

  async updatePrice(codigo_precio: number, data: any) {
    const price = await this.prisma.precio.findUnique({
      where: { codigo_precio },
    });

    if (!price) {
      throw new NotFoundException('Precio no encontrado');
    }

    const updateData: any = {};
    if (data.precio !== undefined) updateData.precio = data.precio;
    if (data.fecha_inicio !== undefined) updateData.fecha_inicio = data.fecha_inicio;
    if (data.fecha_fin !== undefined) updateData.fecha_fin = data.fecha_fin;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const updatedPrice = await this.prisma.precio.update({
      where: { codigo_precio },
      data: updateData,
      include: {
        examen: true,
      },
    });

    // Emitir evento de actualización de precio
    this.eventsService.emitPriceUpdated(
      codigo_precio,
      price.codigo_examen,
      0,
      { changedFields: Object.keys(updateData) },
    );

    return updatedPrice;
  }

  // ==================== CATEGORIAS ====================

  async getAllExamCategories() {
    return this.prisma.categoriaExamen.findMany({
      include: {
        _count: {
          select: { examenes: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async createExamCategory(data: Prisma.CategoriaExamenCreateInput) {
    const category = await this.prisma.categoriaExamen.create({
      data,
    });

    // Emitir evento de creación de categoría
    this.eventsService.emitCategoryCreated(
      category.codigo_categoria,
      0, // TODO: Obtener del contexto de autenticación
      { nombre: category.nombre, descripcion: category.descripcion },
    );

    return category;
  }

  async updateExamCategory(codigo_categoria: number, data: Prisma.CategoriaExamenUpdateInput) {
    const category = await this.prisma.categoriaExamen.findUnique({
      where: { codigo_categoria },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const updatedCategory = await this.prisma.categoriaExamen.update({
      where: { codigo_categoria },
      data,
    });

    // Emitir evento de actualización de categoría
    this.eventsService.emitCategoryUpdated(
      codigo_categoria,
      0, // TODO: Obtener del contexto de autenticación
      { changedFields: Object.keys(data) },
    );

    return updatedCategory;
  }

  async deleteExamCategory(codigo_categoria: number) {
    const category = await this.prisma.categoriaExamen.findUnique({
      where: { codigo_categoria },
      include: {
        _count: {
          select: { examenes: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category._count.examenes > 0) {
      throw new BadRequestException('No se puede eliminar una categoría con exámenes asignados');
    }

    const deletedCategory = await this.prisma.categoriaExamen.delete({
      where: { codigo_categoria },
    });

    // Emitir evento de eliminación de categoría
    this.eventsService.emitCategoryDeleted(codigo_categoria, 0);

    return deletedCategory;
  }

  // ==================== PAQUETES ====================

  async getAllPackages() {
    return this.prisma.paquete.findMany({
      include: {
        examenes: {
          include: {
            examen: true,
          },
        },
        _count: {
          select: { examenes: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getPackageById(codigo_paquete: number) {
    const package_ = await this.prisma.paquete.findUnique({
      where: { codigo_paquete },
      include: {
        examenes: {
          include: {
            examen: {
              include: {
                categoria: true,
              },
            },
          },
        },
      },
    });

    if (!package_) {
      throw new NotFoundException('Paquete no encontrado');
    }

    return package_;
  }

  async createPackage(data: any) {
    const { examenes, ...packageData } = data;

    const package_ = await this.prisma.paquete.create({
      data: {
        ...packageData,
        examenes: examenes
          ? {
              create: examenes.map((examen_id: number) => ({
                codigo_examen: examen_id,
              })),
            }
          : undefined,
      },
      include: {
        examenes: {
          include: {
            examen: true,
          },
        },
      },
    });

    // Emitir evento de creación de paquete
    this.eventsService.emitPackageCreated(
      package_.codigo_paquete,
      0, // TODO: Obtener del contexto de autenticación
      { nombre: package_.nombre, precio: package_.precio, examenesCount: examenes?.length || 0 },
    );

    return package_;
  }

  async updatePackage(codigo_paquete: number, data: any) {
    const package_ = await this.prisma.paquete.findUnique({
      where: { codigo_paquete },
    });

    if (!package_) {
      throw new NotFoundException('Paquete no encontrado');
    }

    const { examenes, ...packageData } = data;

    // Si se proporcionan exámenes, actualizar la relación
    if (examenes !== undefined) {
      // Eliminar exámenes existentes y crear nuevos
      await this.prisma.paqueteExamen.deleteMany({
        where: { codigo_paquete },
      });

      await this.prisma.paqueteExamen.createMany({
        data: examenes.map((examen_id: number) => ({
          codigo_paquete,
          codigo_examen: examen_id,
        })),
      });
    }

    const updatedPackage = await this.prisma.paquete.update({
      where: { codigo_paquete },
      data: packageData,
      include: {
        examenes: {
          include: {
            examen: true,
          },
        },
      },
    });

    // Emitir evento de actualización de paquete
    this.eventsService.emitPackageUpdated(
      codigo_paquete,
      0, // TODO: Obtener del contexto de autenticación
      { changedFields: Object.keys(data), examenesUpdated: examenes !== undefined },
    );

    return updatedPackage;
  }

  async deletePackage(codigo_paquete: number) {
    const package_ = await this.prisma.paquete.findUnique({
      where: { codigo_paquete },
    });

    if (!package_) {
      throw new NotFoundException('Paquete no encontrado');
    }

    // Desactivar en lugar de eliminar
    const result = await this.prisma.paquete.update({
      where: { codigo_paquete },
      data: { activo: false },
    });

    // Emitir evento de eliminación de paquete (soft delete)
    this.eventsService.emitPackageDeleted(codigo_paquete, 0);

    return result;
  }

  // ==================== INVENTARIO ====================

  async getAllInventoryItems(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;

    // Si se requiere filtro de stock bajo, usar consulta SQL cruda
    if (filters?.stock_bajo === 'true' || filters?.stock_bajo === true) {
      const items = await this.prisma.$queryRaw<any[]>`
        SELECT i.*, c.nombre as categoria_nombre, c.descripcion as categoria_descripcion,
               c.fecha_creacion as categoria_fecha_creacion
        FROM inventario.item i
        LEFT JOIN inventario.categoria_item c ON i.codigo_categoria = c.codigo_categoria
        WHERE i.stock_actual <= i.stock_minimo
        ${filters?.search ? Prisma.sql`AND (i.nombre ILIKE ${`%${filters.search}%`} OR i.codigo_interno ILIKE ${`%${filters.search}%`})` : Prisma.empty}
        ${filters?.codigo_categoria ? Prisma.sql`AND i.codigo_categoria = ${parseInt(filters.codigo_categoria)}` : Prisma.empty}
        ORDER BY i.nombre ASC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const totalResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::int as count
        FROM inventario.item i
        WHERE i.stock_actual <= i.stock_minimo
        ${filters?.search ? Prisma.sql`AND (i.nombre ILIKE ${`%${filters.search}%`} OR i.codigo_interno ILIKE ${`%${filters.search}%`})` : Prisma.empty}
        ${filters?.codigo_categoria ? Prisma.sql`AND i.codigo_categoria = ${parseInt(filters.codigo_categoria)}` : Prisma.empty}
      `;

      const total = Number(totalResult[0].count);

      // Transformar resultados para que tengan la estructura esperada con categoria
      const itemsWithCategory = items.map((item: any) => ({
        ...item,
        categoria: item.codigo_categoria ? {
          codigo_categoria: item.codigo_categoria,
          nombre: item.categoria_nombre,
          descripcion: item.categoria_descripcion,
          fecha_creacion: item.categoria_fecha_creacion,
        } : null,
      }));

      // Eliminar campos de categoria redundantes
      itemsWithCategory.forEach((item: any) => {
        delete item.categoria_nombre;
        delete item.categoria_descripcion;
        delete item.categoria_fecha_creacion;
      });

      return {
        data: itemsWithCategory,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Consulta normal sin filtro de stock bajo
    const where: Prisma.ItemWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { codigo_interno: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.codigo_categoria) {
      where.codigo_categoria = parseInt(filters.codigo_categoria);
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        include: {
          categoria: true,
        },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInventoryItemById(codigo_item: number) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
      include: {
        categoria: true,
        lotes: {
          orderBy: { fecha_vencimiento: 'asc' },
        },
        movimientos: {
          orderBy: { fecha_movimiento: 'desc' },
          take: 20,
          include: {
            usuario: {
              select: {
                nombres: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    return item;
  }

  async createInventoryItem(data: any) {
    // Verificar que el codigo_interno no exista
    const existingItem = await this.prisma.item.findUnique({
      where: { codigo_interno: data.codigo_interno },
    });

    if (existingItem) {
      throw new BadRequestException('El código interno ya existe');
    }

    const item = await this.prisma.item.create({
      data,
      include: {
        categoria: true,
      },
    });

    // Emitir evento de creación de item de inventario
    this.eventsService.emitInventoryItemCreated(
      item.codigo_item,
      0, // TODO: Obtener del contexto de autenticación
      { nombre: item.nombre, codigo_interno: item.codigo_interno, stock_actual: item.stock_actual },
    );

    return item;
  }

  async updateInventoryItem(codigo_item: number, data: any) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    const updatedItem = await this.prisma.item.update({
      where: { codigo_item },
      data,
      include: {
        categoria: true,
      },
    });

    // Emitir evento de actualización de item de inventario
    this.eventsService.emitInventoryItemUpdated(
      codigo_item,
      0, // TODO: Obtener del contexto de autenticación
      { changedFields: Object.keys(data) },
    );

    return updatedItem;
  }

  async deleteInventoryItem(codigo_item: number) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    // Desactivar en lugar de eliminar
    const result = await this.prisma.item.update({
      where: { codigo_item },
      data: { activo: false },
    });

    // Emitir evento de eliminación de item de inventario (soft delete)
    this.eventsService.emitInventoryItemDeleted(codigo_item, 0);

    return result;
  }

  // ==================== PROVEEDORES ====================

  async getAllSuppliers() {
    return this.prisma.proveedor.findMany({
      include: {
        _count: {
          select: { ordenes_compra: true },
        },
      },
      orderBy: { razon_social: 'asc' },
    });
  }

  async getSupplierById(codigo_proveedor: number) {
    const supplier = await this.prisma.proveedor.findUnique({
      where: { codigo_proveedor },
      include: {
        ordenes_compra: {
          orderBy: { fecha_orden: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  async createSupplier(data: Prisma.ProveedorCreateInput) {
    // Validar formato de RUC ecuatoriano
    if (!ValidateRucEcuador(data.ruc)) {
      throw new BadRequestException('El RUC ecuatoriano no es válido');
    }

    // Verificar que el RUC no exista
    const existingSupplier = await this.prisma.proveedor.findUnique({
      where: { ruc: data.ruc },
    });

    if (existingSupplier) {
      throw new BadRequestException('El RUC ya existe');
    }

    const supplier = await this.prisma.proveedor.create({
      data,
    });

    // Emitir evento de creación de proveedor
    this.eventsService.emitSupplierCreated(
      supplier.codigo_proveedor,
      0, // TODO: Obtener del contexto de autenticación
      { razon_social: supplier.razon_social, ruc: supplier.ruc },
    );

    return supplier;
  }

  async updateSupplier(codigo_proveedor: number, data: Prisma.ProveedorUpdateInput) {
    const supplier = await this.prisma.proveedor.findUnique({
      where: { codigo_proveedor },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Validar formato de RUC si se está actualizando
    if (data.ruc && typeof data.ruc === 'string' && !ValidateRucEcuador(data.ruc)) {
      throw new BadRequestException('El RUC ecuatoriano no es válido');
    }

    // Si se está actualizando el RUC, validar que no exista
    if (data.ruc && data.ruc !== supplier.ruc) {
      const existingSupplier = await this.prisma.proveedor.findUnique({
        where: { ruc: data.ruc as string },
      });

      if (existingSupplier) {
        throw new BadRequestException('El RUC ya existe');
      }
    }

    const updatedSupplier = await this.prisma.proveedor.update({
      where: { codigo_proveedor },
      data,
    });

    // Emitir evento de actualización de proveedor
    this.eventsService.emitSupplierUpdated(
      codigo_proveedor,
      0, // TODO: Obtener del contexto de autenticación
      { changedFields: Object.keys(data) },
    );

    return updatedSupplier;
  }

  async deleteSupplier(codigo_proveedor: number) {
    const supplier = await this.prisma.proveedor.findUnique({
      where: { codigo_proveedor },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Desactivar en lugar de eliminar
    const result = await this.prisma.proveedor.update({
      where: { codigo_proveedor },
      data: { activo: false },
    });

    // Emitir evento de eliminación de proveedor (soft delete)
    this.eventsService.emitSupplierDeleted(codigo_proveedor, 0);

    return result;
  }

  // ==================== AUDITORIA ====================

  async getActivityLogs(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;

    const where: Prisma.LogActividadWhereInput = {};

    if (filters?.codigo_usuario) {
      where.codigo_usuario = parseInt(filters.codigo_usuario);
    }

    if (filters?.accion) {
      where.accion = { contains: filters.accion, mode: 'insensitive' };
    }

    if (filters?.entidad) {
      where.entidad = filters.entidad;
    }

    if (filters?.fecha_inicio && filters?.fecha_fin) {
      where.fecha_accion = {
        gte: new Date(filters.fecha_inicio),
        lte: new Date(filters.fecha_fin),
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.logActividad.findMany({
        where,
        include: {
          usuario: {
            select: {
              nombres: true,
              apellidos: true,
              email: true,
            },
          },
        },
        orderBy: { fecha_accion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.logActividad.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getErrorLogs(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;

    const where: Prisma.LogErrorWhereInput = {};

    if (filters?.nivel) {
      where.nivel = filters.nivel;
    }

    if (filters?.fecha_inicio && filters?.fecha_fin) {
      where.fecha_error = {
        gte: new Date(filters.fecha_inicio),
        lte: new Date(filters.fecha_fin),
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.logError.findMany({
        where,
        include: {
          usuario: {
            select: {
              nombres: true,
              apellidos: true,
              email: true,
            },
          },
        },
        orderBy: { fecha_error: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.logError.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== ESTADÍSTICAS ====================

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalExams,
      totalAppointments,
      todayAppointments,
      pendingResults,
      lowStockItems,
      recentActivities,
    ] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.usuario.count({ where: { activo: true } }),
      this.prisma.examen.count({ where: { activo: true } }),
      this.prisma.cita.count(),
      this.prisma.cita.count({
        where: {
          slot: {
            fecha: new Date(),
          },
        },
      }),
      this.prisma.resultado.count({
        where: { estado: 'EN_PROCESO' },
      }),
      // Usar consulta SQL cruda para comparar columnas
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::int as count
        FROM inventario.item
        WHERE stock_actual <= stock_minimo
      `.then(result => Number(result[0].count)),
      this.prisma.logActividad.findMany({
        take: 10,
        orderBy: { fecha_accion: 'desc' },
        include: {
          usuario: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      exams: {
        total: totalExams,
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
      },
      results: {
        pending: pendingResults,
      },
      inventory: {
        lowStock: lowStockItems,
      },
      recentActivities,
    };
  }
}
