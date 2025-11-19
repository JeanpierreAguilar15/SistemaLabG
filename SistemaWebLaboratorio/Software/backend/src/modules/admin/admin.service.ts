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

  async createUser(data: any, adminId?: number) {
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
      adminId || 0,
      { rol: user.rol.nombre, email: user.email, nombres: user.nombres },
    );

    const { password_hash: _, salt: __, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async updateUser(codigo_usuario: number, data: any, adminId?: number) {
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
      adminId || 0,
      { changedFields: Object.keys(data) },
    );

    const { password_hash, salt, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }

  async deleteUser(codigo_usuario: number, adminId?: number) {
    // Verificar que el usuario existe y obtener sus relaciones activas
    const user = await this.prisma.usuario.findUnique({
      where: { codigo_usuario },
      include: {
        citas_como_paciente: {
          where: {
            estado: {
              in: ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO'],
            },
          },
        },
        cotizaciones: {
          where: {
            estado: {
              in: ['PENDIENTE', 'APROBADA'],
            },
          },
        },
        _count: {
          select: {
            citas_como_paciente: true,
            cotizaciones: true,
            resultados_procesados: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si tiene citas activas (pendientes, confirmadas o en proceso)
    if (user.citas_como_paciente.length > 0) {
      throw new BadRequestException(
        `No se puede desactivar el usuario porque tiene ${user.citas_como_paciente.length} cita(s) activa(s). ` +
        'Por favor, cancele o complete las citas primero.'
      );
    }

    // Verificar si tiene cotizaciones pendientes o aprobadas
    if (user.cotizaciones.length > 0) {
      throw new BadRequestException(
        `No se puede desactivar el usuario porque tiene ${user.cotizaciones.length} cotización(es) pendiente(s). ` +
        'Por favor, complete o cancele las cotizaciones primero.'
      );
    }

    // Generar advertencias sobre historial (permitir desactivación pero informar)
    const warnings = [];
    if (user._count.citas_como_paciente > 0) {
      warnings.push(`${user._count.citas_como_paciente} cita(s) en historial`);
    }
    if (user._count.cotizaciones > 0) {
      warnings.push(`${user._count.cotizaciones} cotización(es) en historial`);
    }
    if (user._count.resultados_procesados > 0) {
      warnings.push(`${user._count.resultados_procesados} resultado(s) procesado(s)`);
    }

    // En lugar de eliminar, desactivar el usuario (soft delete)
    const updatedUser = await this.prisma.usuario.update({
      where: { codigo_usuario },
      data: { activo: false },
    });

    // Emitir evento de eliminación (soft delete)
    this.eventsService.emitUserDeleted(codigo_usuario, adminId);

    const { password_hash, salt, ...sanitizedUser } = updatedUser;

    // Retornar con advertencias si las hay
    return {
      ...sanitizedUser,
      ...(warnings.length > 0 && {
        warnings,
        message: `Usuario desactivado. Mantiene historial: ${warnings.join(', ')}`
      }),
    };
  }

  async toggleUserStatus(codigo_usuario: number, adminId?: number) {
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
        userId: adminId || 0,
        data: { activo: updatedUser.activo },
        timestamp: new Date(),
      },
    );

    const { password_hash, salt, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }

  async resetUserPassword(codigo_usuario: number, newPassword: string, adminId?: number) {
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
      adminId || 0,
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

  async createRole(data: Prisma.RolCreateInput, adminId: number) {
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

  async updateRole(codigo_rol: number, data: Prisma.RolUpdateInput, adminId: number) {
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

  async deleteRole(codigo_rol: number, adminId: number) {
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
    this.eventsService.emitRoleDeleted(codigo_rol, adminId);

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

  async createService(data: Prisma.ServicioCreateInput, adminId: number) {
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

  async updateService(codigo_servicio: number, data: Prisma.ServicioUpdateInput, adminId: number) {
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

  async deleteService(codigo_servicio: number, adminId: number) {
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
    this.eventsService.emitServiceDeleted(codigo_servicio, adminId);

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

  async createLocation(data: Prisma.SedeCreateInput, adminId: number) {
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

  async updateLocation(codigo_sede: number, data: Prisma.SedeUpdateInput, adminId: number) {
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

  async deleteLocation(codigo_sede: number, adminId: number) {
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
    this.eventsService.emitLocationDeleted(codigo_sede, adminId);

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

  async createExam(data: any, adminId: number) {
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

  async updateExam(codigo_examen: number, data: any, adminId: number) {
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

  async deleteExam(codigo_examen: number, adminId: number) {
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
    this.eventsService.emitExamDeleted(codigo_examen, adminId);

    return result;
  }

  // ==================== PRECIOS ====================

  async createPrice(data: any, adminId: number) {
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

  async updatePrice(codigo_precio: number, data: any, adminId: number) {
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

  async createExamCategory(data: Prisma.CategoriaExamenCreateInput, adminId: number) {
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

  async updateExamCategory(codigo_categoria: number, data: Prisma.CategoriaExamenUpdateInput, adminId: number) {
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

  async deleteExamCategory(codigo_categoria: number, adminId: number) {
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
    this.eventsService.emitCategoryDeleted(codigo_categoria, adminId);

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

  async createPackage(data: any, adminId: number) {
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
      { nombre: package_.nombre, precio_paquete: package_.precio_paquete, examenesCount: examenes?.length || 0 },
    );

    return package_;
  }

  async updatePackage(codigo_paquete: number, data: any, adminId: number) {
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

  async deletePackage(codigo_paquete: number, adminId: number) {
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
    this.eventsService.emitPackageDeleted(codigo_paquete, adminId);

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

  async createInventoryItem(data: any, adminId: number) {
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

  async updateInventoryItem(codigo_item: number, data: any, adminId: number) {
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

  async deleteInventoryItem(codigo_item: number, adminId: number) {
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
    this.eventsService.emitInventoryItemDeleted(codigo_item, adminId);

    return result;
  }

  // ==================== MOVIMIENTOS DE STOCK ====================

  /**
   * Registrar movimiento de stock (ENTRADA, SALIDA, AJUSTE)
   * Actualiza automáticamente el stock_actual del item
   */
  async createMovimiento(data: any, adminId: number) {
    const { codigo_item, codigo_lote, tipo_movimiento, cantidad, motivo } = data;

    // Validar que el item existe
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    // Validar que el item esté activo
    if (!item.activo) {
      throw new BadRequestException('No se pueden registrar movimientos en items inactivos');
    }

    // Validar que el lote existe (si se especificó)
    if (codigo_lote) {
      const lote = await this.prisma.lote.findUnique({
        where: { codigo_lote },
      });

      if (!lote) {
        throw new NotFoundException('Lote no encontrado');
      }

      if (lote.codigo_item !== codigo_item) {
        throw new BadRequestException('El lote no pertenece a este item');
      }
    }

    // Calcular nuevo stock según tipo de movimiento
    let stock_nuevo = item.stock_actual;
    const stock_anterior = item.stock_actual;

    switch (tipo_movimiento) {
      case 'ENTRADA':
      case 'AJUSTE_POSITIVO':
        stock_nuevo = stock_anterior + cantidad;
        break;

      case 'SALIDA':
      case 'AJUSTE_NEGATIVO':
        stock_nuevo = stock_anterior - cantidad;
        break;

      case 'TRANSFERENCIA':
        // Para transferencias, se puede implementar lógica adicional
        stock_nuevo = stock_anterior - cantidad;
        break;

      default:
        throw new BadRequestException('Tipo de movimiento no válido');
    }

    // Validar que el stock no quede negativo
    if (stock_nuevo < 0) {
      throw new BadRequestException(
        `Stock insuficiente. Stock actual: ${stock_anterior}, Cantidad solicitada: ${cantidad}`,
      );
    }

    // Usar transacción para garantizar consistencia
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Crear el movimiento
      const movimiento = await tx.movimiento.create({
        data: {
          codigo_item,
          codigo_lote,
          tipo_movimiento,
          cantidad,
          motivo: motivo || null,
          stock_anterior,
          stock_nuevo,
          realizado_por: adminId,
        },
        include: {
          item: {
            select: {
              codigo_interno: true,
              nombre: true,
              unidad_medida: true,
            },
          },
          usuario: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          lote: {
            select: {
              numero_lote: true,
            },
          },
        },
      });

      // 2. Actualizar el stock del item
      await tx.item.update({
        where: { codigo_item },
        data: { stock_actual: stock_nuevo },
      });

      // 3. Si hay lote, actualizar cantidad_actual del lote
      if (codigo_lote) {
        const lote = await tx.lote.findUnique({
          where: { codigo_lote },
        });

        let cantidad_nueva_lote = lote.cantidad_actual;

        if (tipo_movimiento === 'ENTRADA' || tipo_movimiento === 'AJUSTE_POSITIVO') {
          cantidad_nueva_lote += cantidad;
        } else {
          cantidad_nueva_lote -= cantidad;
        }

        if (cantidad_nueva_lote < 0) {
          throw new BadRequestException(
            `Stock insuficiente en lote ${lote.numero_lote}`,
          );
        }

        await tx.lote.update({
          where: { codigo_lote },
          data: { cantidad_actual: cantidad_nueva_lote },
        });
      }

      return movimiento;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    // Emitir evento de movimiento creado
    this.eventsService.emitStockMovementCreated(result, adminId);

    return result;
  }

  /**
   * Obtener todos los movimientos con filtros
   */
  async getAllMovimientos(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;

    const where: Prisma.MovimientoWhereInput = {};

    // Filtrar por item
    if (filters?.codigo_item) {
      where.codigo_item = parseInt(filters.codigo_item);
    }

    // Filtrar por tipo de movimiento
    if (filters?.tipo_movimiento) {
      where.tipo_movimiento = filters.tipo_movimiento;
    }

    // Filtrar por rango de fechas
    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.fecha_movimiento = {};

      if (filters.fecha_desde) {
        where.fecha_movimiento.gte = new Date(filters.fecha_desde);
      }

      if (filters.fecha_hasta) {
        const fechaHasta = new Date(filters.fecha_hasta);
        fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
        where.fecha_movimiento.lte = fechaHasta;
      }
    }

    // Filtrar por usuario que realizó el movimiento
    if (filters?.realizado_por) {
      where.realizado_por = parseInt(filters.realizado_por);
    }

    const [movimientos, total] = await Promise.all([
      this.prisma.movimiento.findMany({
        where,
        include: {
          item: {
            select: {
              codigo_interno: true,
              nombre: true,
              unidad_medida: true,
            },
          },
          usuario: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          lote: {
            select: {
              numero_lote: true,
              fecha_vencimiento: true,
            },
          },
        },
        orderBy: { fecha_movimiento: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.movimiento.count({ where }),
    ]);

    return {
      data: movimientos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener kardex (historial de movimientos) de un item específico
   */
  async getKardexByItem(codigo_item: number, fecha_desde?: string, fecha_hasta?: string) {
    // Verificar que el item existe
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
      select: {
        codigo_item: true,
        codigo_interno: true,
        nombre: true,
        unidad_medida: true,
        stock_actual: true,
        stock_minimo: true,
        stock_maximo: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    // Construir filtros de fecha
    const where: Prisma.MovimientoWhereInput = {
      codigo_item,
    };

    if (fecha_desde || fecha_hasta) {
      where.fecha_movimiento = {};

      if (fecha_desde) {
        where.fecha_movimiento.gte = new Date(fecha_desde);
      }

      if (fecha_hasta) {
        const fechaHasta = new Date(fecha_hasta);
        fechaHasta.setHours(23, 59, 59, 999);
        where.fecha_movimiento.lte = fechaHasta;
      }
    }

    // Obtener movimientos
    const movimientos = await this.prisma.movimiento.findMany({
      where,
      include: {
        usuario: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        lote: {
          select: {
            numero_lote: true,
          },
        },
      },
      orderBy: { fecha_movimiento: 'asc' },
    });

    // Calcular totales
    const totales = {
      total_entradas: 0,
      total_salidas: 0,
      total_ajustes_positivos: 0,
      total_ajustes_negativos: 0,
    };

    movimientos.forEach((mov) => {
      switch (mov.tipo_movimiento) {
        case 'ENTRADA':
          totales.total_entradas += mov.cantidad;
          break;
        case 'SALIDA':
          totales.total_salidas += mov.cantidad;
          break;
        case 'AJUSTE_POSITIVO':
          totales.total_ajustes_positivos += mov.cantidad;
          break;
        case 'AJUSTE_NEGATIVO':
          totales.total_ajustes_negativos += mov.cantidad;
          break;
      }
    });

    return {
      item,
      movimientos,
      totales,
    };
  }

  // ==================== ALERTAS DE STOCK ====================

  /**
   * Obtener todas las alertas de stock activas
   * Incluye: stock bajo, stock crítico, próximos a vencer, vencidos
   */
  async getAlertasStock(filters?: {
    tipo?: string;
    codigo_item?: number;
    activo?: string;
  }) {
    const alertas: any[] = [];

    // Condiciones de filtro
    const whereItem: any = {};
    if (filters?.codigo_item) {
      whereItem.codigo_item = filters.codigo_item;
    }
    if (filters?.activo !== undefined) {
      whereItem.activo = filters.activo === 'true';
    }

    // 1. ALERTAS DE STOCK BAJO Y CRÍTICO
    if (
      !filters?.tipo ||
      filters.tipo === 'STOCK_BAJO' ||
      filters.tipo === 'STOCK_CRITICO'
    ) {
      const items = await this.prisma.item.findMany({
        where: {
          ...whereItem,
          activo: true,
        },
        select: {
          codigo_item: true,
          codigo_interno: true,
          nombre: true,
          stock_actual: true,
          stock_minimo: true,
          stock_maximo: true,
          unidad_medida: true,
        },
      });

      items.forEach((item) => {
        // Stock crítico (0)
        if (item.stock_actual === 0) {
          alertas.push({
            codigo_item: item.codigo_item,
            codigo_interno: item.codigo_interno,
            nombre: item.nombre,
            stock_actual: item.stock_actual,
            stock_minimo: item.stock_minimo,
            stock_maximo: item.stock_maximo,
            unidad_medida: item.unidad_medida,
            tipo_alerta: 'STOCK_CRITICO',
            mensaje: `Sin stock disponible`,
            prioridad: 'CRITICA',
          });
        }
        // Stock bajo (menor al mínimo pero no 0)
        else if (item.stock_actual <= item.stock_minimo) {
          const diferencia = item.stock_minimo - item.stock_actual;
          alertas.push({
            codigo_item: item.codigo_item,
            codigo_interno: item.codigo_interno,
            nombre: item.nombre,
            stock_actual: item.stock_actual,
            stock_minimo: item.stock_minimo,
            stock_maximo: item.stock_maximo,
            unidad_medida: item.unidad_medida,
            tipo_alerta: 'STOCK_BAJO',
            mensaje: `Stock bajo: ${item.stock_actual} ${item.unidad_medida} (mínimo: ${item.stock_minimo})`,
            prioridad: diferencia >= 50 ? 'ALTA' : 'MEDIA',
          });
        }
      });
    }

    // 2. ALERTAS DE PRODUCTOS PRÓXIMOS A VENCER O VENCIDOS
    if (
      !filters?.tipo ||
      filters.tipo === 'PROXIMO_VENCER' ||
      filters.tipo === 'VENCIDO'
    ) {
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(en30Dias.getDate() + 30);

      const whereLote: any = {
        cantidad_actual: { gt: 0 }, // Solo lotes con stock
      };

      if (filters?.codigo_item) {
        whereLote.codigo_item = filters.codigo_item;
      }

      const lotes = await this.prisma.lote.findMany({
        where: whereLote,
        include: {
          item: {
            select: {
              codigo_item: true,
              codigo_interno: true,
              nombre: true,
              stock_actual: true,
              stock_minimo: true,
              stock_maximo: true,
              unidad_medida: true,
              activo: true,
            },
          },
        },
      });

      lotes.forEach((lote) => {
        if (!lote.item.activo) return; // Skip inactive items

        if (lote.fecha_vencimiento) {
          const fechaVencimiento = new Date(lote.fecha_vencimiento);
          const diasHastaVencimiento = Math.ceil(
            (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
          );

          // Vencido
          if (fechaVencimiento < hoy) {
            alertas.push({
              codigo_item: lote.item.codigo_item,
              codigo_interno: lote.item.codigo_interno,
              nombre: lote.item.nombre,
              stock_actual: lote.cantidad_actual,
              stock_minimo: lote.item.stock_minimo,
              stock_maximo: lote.item.stock_maximo,
              unidad_medida: lote.item.unidad_medida,
              tipo_alerta: 'VENCIDO',
              mensaje: `Lote ${lote.numero_lote} vencido hace ${Math.abs(diasHastaVencimiento)} días`,
              prioridad: 'CRITICA',
              codigo_lote: lote.codigo_lote,
              numero_lote: lote.numero_lote,
              fecha_vencimiento: lote.fecha_vencimiento,
              dias_hasta_vencimiento: diasHastaVencimiento,
            });
          }
          // Próximo a vencer (30 días)
          else if (fechaVencimiento <= en30Dias) {
            alertas.push({
              codigo_item: lote.item.codigo_item,
              codigo_interno: lote.item.codigo_interno,
              nombre: lote.item.nombre,
              stock_actual: lote.cantidad_actual,
              stock_minimo: lote.item.stock_minimo,
              stock_maximo: lote.item.stock_maximo,
              unidad_medida: lote.item.unidad_medida,
              tipo_alerta: 'PROXIMO_VENCER',
              mensaje: `Lote ${lote.numero_lote} vence en ${diasHastaVencimiento} días`,
              prioridad: diasHastaVencimiento <= 7 ? 'ALTA' : diasHastaVencimiento <= 15 ? 'MEDIA' : 'BAJA',
              codigo_lote: lote.codigo_lote,
              numero_lote: lote.numero_lote,
              fecha_vencimiento: lote.fecha_vencimiento,
              dias_hasta_vencimiento: diasHastaVencimiento,
            });
          }
        }
      });
    }

    // Ordenar por prioridad y luego por nombre
    const prioridadOrden = {
      CRITICA: 1,
      ALTA: 2,
      MEDIA: 3,
      BAJA: 4,
    };

    alertas.sort((a, b) => {
      if (prioridadOrden[a.prioridad] !== prioridadOrden[b.prioridad]) {
        return prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad];
      }
      return a.nombre.localeCompare(b.nombre);
    });

    return alertas;
  }

  /**
   * Obtener estadísticas de alertas
   */
  async getEstadisticasAlertas() {
    const alertas = await this.getAlertasStock();

    const stats = {
      total: alertas.length,
      criticas: alertas.filter((a) => a.prioridad === 'CRITICA').length,
      altas: alertas.filter((a) => a.prioridad === 'ALTA').length,
      medias: alertas.filter((a) => a.prioridad === 'MEDIA').length,
      bajas: alertas.filter((a) => a.prioridad === 'BAJA').length,
      por_tipo: {
        stock_critico: alertas.filter((a) => a.tipo_alerta === 'STOCK_CRITICO')
          .length,
        stock_bajo: alertas.filter((a) => a.tipo_alerta === 'STOCK_BAJO')
          .length,
        vencidos: alertas.filter((a) => a.tipo_alerta === 'VENCIDO').length,
        proximos_vencer: alertas.filter(
          (a) => a.tipo_alerta === 'PROXIMO_VENCER',
        ).length,
      },
    };

    return stats;
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

  async createSupplier(data: Prisma.ProveedorCreateInput, adminId: number) {
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

  async updateSupplier(codigo_proveedor: number, data: Prisma.ProveedorUpdateInput, adminId: number) {
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

  async deleteSupplier(codigo_proveedor: number, adminId: number) {
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
    this.eventsService.emitSupplierDeleted(codigo_proveedor, adminId);

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

  /**
   * Generar PDF de auditoría con filtros
   */
  async generateAuditPdf(filters?: any): Promise<Buffer> {
    try {
      // Importación dinámica de PDFKit
      const PDFKit = await import('pdfkit');
      const PDFDocument = (PDFKit.default as any) || PDFKit;

      // Construir filtros para query
      const where: Prisma.LogActividadWhereInput = {};

      if (filters?.search) {
        where.OR = [
          { accion: { contains: filters.search, mode: 'insensitive' } },
          { entidad: { contains: filters.search, mode: 'insensitive' } },
          { descripcion: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.entidad) {
        where.entidad = filters.entidad;
      }

      if (filters?.fecha_desde || filters?.fecha_hasta) {
        where.fecha_accion = {};

        if (filters.fecha_desde) {
          where.fecha_accion.gte = new Date(filters.fecha_desde);
        }

        if (filters.fecha_hasta) {
          const fechaHasta = new Date(filters.fecha_hasta);
          fechaHasta.setHours(23, 59, 59, 999);
          where.fecha_accion.lte = fechaHasta;
        }
      }

      // Obtener logs con límite
      const limit = filters?.limit ? parseInt(filters.limit) : 50;
      const logs = await this.prisma.logActividad.findMany({
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
        take: limit,
      });

      // Crear PDF en memoria
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({
            size: 'LETTER',
            margins: {
              top: 50,
              bottom: 50,
              left: 50,
              right: 50,
            },
            info: {
              Title: 'Reporte de Auditoría',
              Author: 'Laboratorio Clínico Franz',
              Subject: 'Registro de Actividades del Sistema',
              Creator: 'Sistema de Gestión Laboratorio Franz',
            },
          });

          const chunks: Buffer[] = [];

          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);

          // Header
          doc
            .fontSize(20)
            .fillColor('#2563EB')
            .font('Helvetica-Bold')
            .text('LABORATORIO CLÍNICO FRANZ', { align: 'center' });

          doc
            .fontSize(10)
            .fillColor('#666666')
            .font('Helvetica')
            .text('Sistema de Auditoría', { align: 'center' })
            .moveDown(0.5);

          // Línea separadora
          doc
            .strokeColor('#2563EB')
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(562, doc.y)
            .stroke()
            .moveDown(1);

          // Título del documento
          doc
            .fontSize(16)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('REPORTE DE AUDITORÍA', { align: 'center' })
            .moveDown(1);

          // Información del reporte
          const now = new Date();
          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#333333')
            .text(`Fecha de generación: ${this.formatDate(now)}`, { align: 'left' })
            .text(`Hora: ${this.formatTime(now)}`, { align: 'left' });

          // Filtros aplicados
          if (filters?.fecha_desde || filters?.fecha_hasta || filters?.entidad) {
            doc.moveDown(0.5).font('Helvetica-Bold').text('Filtros aplicados:', { align: 'left' });
            doc.font('Helvetica');

            if (filters.fecha_desde) {
              doc.text(`  • Desde: ${filters.fecha_desde}`, { align: 'left' });
            }
            if (filters.fecha_hasta) {
              doc.text(`  • Hasta: ${filters.fecha_hasta}`, { align: 'left' });
            }
            if (filters.entidad) {
              doc.text(`  • Entidad: ${filters.entidad}`, { align: 'left' });
            }
          }

          doc.moveDown(0.5).text(`Total de registros: ${logs.length}`, { align: 'left' }).moveDown(1);

          // Tabla de logs
          const tableTop = doc.y;
          const colWidths = {
            fecha: 90,
            usuario: 120,
            accion: 120,
            entidad: 80,
            ip: 80,
          };

          // Headers de tabla
          doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF');

          // Fondo de headers
          doc
            .rect(50, doc.y, 512, 20)
            .fill('#2563EB');

          let currentY = doc.y + 5;
          doc
            .fillColor('#FFFFFF')
            .text('Fecha/Hora', 55, currentY, { width: colWidths.fecha })
            .text('Usuario', 145, currentY, { width: colWidths.usuario })
            .text('Acción', 265, currentY, { width: colWidths.accion })
            .text('Entidad', 385, currentY, { width: colWidths.entidad })
            .text('IP', 465, currentY, { width: colWidths.ip });

          doc.moveDown(1.5);

          // Contenido de tabla
          doc.fontSize(8).font('Helvetica').fillColor('#333333');

          for (const log of logs) {
            // Verificar si necesitamos nueva página
            if (doc.y > 700) {
              doc.addPage();
              currentY = 50;
              doc.y = currentY;
            } else {
              currentY = doc.y;
            }

            const fecha = new Date(log.fecha_accion);
            const fechaStr = `${this.formatDate(fecha)}\n${this.formatTime(fecha)}`;
            const usuarioStr = log.usuario
              ? `${log.usuario.nombres} ${log.usuario.apellidos}\n${log.usuario.email}`
              : 'Sistema';
            const accionStr = log.accion || '-';
            const entidadStr = log.entidad || '-';
            const ipStr = log.ip_address || '-';

            // Calcular altura de la fila
            const rowHeight = Math.max(
              this.calculateTextHeight(doc, fechaStr, colWidths.fecha),
              this.calculateTextHeight(doc, usuarioStr, colWidths.usuario),
              this.calculateTextHeight(doc, accionStr, colWidths.accion),
              this.calculateTextHeight(doc, entidadStr, colWidths.entidad),
              this.calculateTextHeight(doc, ipStr, colWidths.ip)
            ) + 10;

            // Fondo alternado
            if (logs.indexOf(log) % 2 === 0) {
              doc.rect(50, currentY, 512, rowHeight).fill('#F3F4F6');
            }

            doc.fillColor('#333333');
            doc.text(fechaStr, 55, currentY + 5, { width: colWidths.fecha });
            doc.text(usuarioStr, 145, currentY + 5, { width: colWidths.usuario });
            doc.text(accionStr, 265, currentY + 5, { width: colWidths.accion });
            doc.text(entidadStr, 385, currentY + 5, { width: colWidths.entidad });
            doc.text(ipStr, 465, currentY + 5, { width: colWidths.ip });

            doc.y = currentY + rowHeight;
          }

          // Footer
          doc.moveDown(2);
          doc
            .fontSize(8)
            .fillColor('#999999')
            .text(
              '─────────────────────────────────────────────────────────────────────────',
              { align: 'center' }
            )
            .text('Documento generado automáticamente por el Sistema de Gestión Laboratorio Franz', {
              align: 'center',
            })
            .text(`Página generada el ${this.formatDate(now)} a las ${this.formatTime(now)}`, {
              align: 'center',
            });

          doc.end();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw new Error(`Error al generar PDF de auditoría: ${error.message}`);
    }
  }

  /**
   * Formatear fecha en español
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Formatear hora
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Calcular altura de texto para tabla
   */
  private calculateTextHeight(doc: any, text: string, width: number): number {
    const fontSize = doc._fontSize || 8;
    const lineHeight = fontSize * 1.2;
    const lines = text.split('\n').length;
    return lines * lineHeight;
  }

  // ==================== ESTADÍSTICAS ====================

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [
      userStats,
      totalExams,
      appointmentStats,
      pendingResults,
      lowStockItems,
      revenueStats,
      quotationStats,
      recentExams,
    ] = await Promise.all([
      // Usuarios (combinado en 1 query)
      this.prisma.$queryRaw<[{ total: number; active: number }]>`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE activo = true)::int as active
        FROM usuarios.usuario
      `.then(result => result[0] || { total: 0, active: 0 }),

      // Exámenes activos
      this.prisma.examen.count({ where: { activo: true } }),

      // Citas (combinado en 1 query)
      this.prisma.$queryRaw<[{ total: number; today: number; completed: number }]>`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE s.fecha >= ${startOfDay} AND s.fecha < ${endOfDay})::int as today,
          COUNT(*) FILTER (WHERE c.estado = 'COMPLETADA')::int as completed
        FROM agenda.cita c
        LEFT JOIN agenda.slot s ON c.codigo_slot = s.codigo_slot
      `.then(result => result[0] || { total: 0, today: 0, completed: 0 }),

      // Resultados pendientes
      this.prisma.resultado.count({
        where: { estado: 'EN_PROCESO' },
      }),

      // Inventario bajo stock
      this.prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM inventario.item
        WHERE stock_actual <= stock_minimo AND activo = true
      `.then(result => result[0]?.count || 0),

      // Ingresos (combinado en 1 query)
      this.prisma.$queryRaw<[{ monthly: string; total: string }]>`
        SELECT
          COALESCE(SUM(monto) FILTER (WHERE fecha_pago >= ${startOfMonth}), 0)::numeric as monthly,
          COALESCE(SUM(monto), 0)::numeric as total
        FROM pagos.pago
        WHERE estado = 'COMPLETADO'
      `.then(result => ({
        monthly: Number(result[0]?.monthly || 0),
        total: Number(result[0]?.total || 0),
      })),

      // Estadísticas de cotizaciones (combinado en 1 query)
      this.prisma.$queryRaw<[{ total: number; approved: number; pending: number }]>`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE estado = 'APROBADA')::int as approved,
          COUNT(*) FILTER (WHERE estado = 'PENDIENTE')::int as pending
        FROM pagos.cotizacion
      `.then(result => {
        const r = result[0] || { total: 0, approved: 0, pending: 0 };
        return {
          total: r.total,
          approved: r.approved,
          pending: r.pending,
          conversionRate: r.total > 0 ? Math.round((r.approved / r.total) * 100) : 0,
        };
      }),

      // Últimos 5 exámenes creados (más simple y rápido)
      this.prisma.examen.findMany({
        where: { activo: true },
        select: {
          codigo_examen: true,
          nombre: true,
          codigo_interno: true,
          fecha_creacion: true,
        },
        orderBy: { fecha_creacion: 'desc' },
        take: 5,
      }),
    ]);

    return {
      users: {
        total: userStats.total,
        active: userStats.active,
      },
      exams: {
        total: totalExams,
      },
      appointments: {
        total: appointmentStats.total,
        today: appointmentStats.today,
        completed: appointmentStats.completed,
        completionRate: appointmentStats.total > 0
          ? Math.round((appointmentStats.completed / appointmentStats.total) * 100)
          : 0,
      },
      results: {
        pending: pendingResults,
      },
      inventory: {
        lowStock: lowStockItems,
      },
      revenue: {
        monthly: revenueStats.monthly,
        total: revenueStats.total,
      },
      quotations: quotationStats,
      recentExams: recentExams.map(exam => ({
        code: exam.codigo_interno,
        name: exam.nombre,
        date: exam.fecha_creacion,
      })),
    };
  }

  // =====================================================
  // ÓRDENES DE COMPRA
  // =====================================================

  /**
   * Generar número de orden único
   */
  private async generarNumeroOrden(): Promise<string> {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');

    // Contar órdenes del mes actual
    const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59);

    const count = await this.prisma.ordenCompra.count({
      where: {
        fecha_orden: {
          gte: inicioMes,
          lte: finMes,
        },
      },
    });

    const secuencial = String(count + 1).padStart(4, '0');
    return `OC-${año}${mes}-${secuencial}`;
  }

  /**
   * Crear orden de compra
   */
  async createOrdenCompra(data: any, creado_por: number) {
    // Validar que el proveedor exista y esté activo
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { codigo_proveedor: data.codigo_proveedor },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    if (!proveedor.activo) {
      throw new BadRequestException('El proveedor está inactivo');
    }

    // Validar que todos los items existan
    for (const item of data.items) {
      const itemDb = await this.prisma.item.findUnique({
        where: { codigo_item: item.codigo_item },
      });

      if (!itemDb) {
        throw new NotFoundException(`Item con código ${item.codigo_item} no encontrado`);
      }

      if (!itemDb.activo) {
        throw new BadRequestException(`El item ${itemDb.nombre} está inactivo`);
      }
    }

    // Calcular totales
    let subtotal = 0;
    const detalles = data.items.map((item: any) => {
      const total_linea = item.cantidad * item.precio_unitario;
      subtotal += total_linea;
      return {
        codigo_item: item.codigo_item,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        total_linea,
      };
    });

    const iva = subtotal * 0.15; // 15% IVA Ecuador
    const total = subtotal + iva;

    // Generar número de orden
    const numero_orden = await this.generarNumeroOrden();

    // Crear orden de compra con detalles
    const ordenCompra = await this.prisma.ordenCompra.create({
      data: {
        numero_orden,
        codigo_proveedor: data.codigo_proveedor,
        subtotal,
        iva,
        total,
        estado: 'BORRADOR',
        observaciones: data.observaciones,
        creado_por,
        detalles: {
          create: detalles,
        },
      },
      include: {
        proveedor: true,
        creador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        detalles: {
          include: {
            item: true,
          },
        },
      },
    });

    // Emitir evento
    this.eventsService.emitPurchaseOrderCreated(
      ordenCompra.codigo_orden_compra,
      creado_por,
      ordenCompra,
    );

    return ordenCompra;
  }

  /**
   * Obtener todas las órdenes de compra con filtros y paginación
   */
  async getAllOrdenesCompra(
    page: number = 1,
    limit: number = 50,
    filters?: any,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.codigo_proveedor) {
      where.codigo_proveedor = parseInt(filters.codigo_proveedor);
    }

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.fecha_orden = {};
      if (filters.fecha_desde) {
        where.fecha_orden.gte = new Date(filters.fecha_desde);
      }
      if (filters.fecha_hasta) {
        where.fecha_orden.lte = new Date(filters.fecha_hasta);
      }
    }

    if (filters?.creado_por) {
      where.creado_por = parseInt(filters.creado_por);
    }

    const [ordenes, total] = await Promise.all([
      this.prisma.ordenCompra.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_orden: 'desc' },
        include: {
          proveedor: true,
          creador: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          detalles: {
            include: {
              item: {
                select: {
                  codigo_interno: true,
                  nombre: true,
                  unidad_medida: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.ordenCompra.count({ where }),
    ]);

    return {
      data: ordenes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener orden de compra por ID
   */
  async getOrdenCompraById(codigo_orden_compra: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { codigo_orden_compra },
      include: {
        proveedor: true,
        creador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        detalles: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    return orden;
  }

  /**
   * Actualizar orden de compra (solo si está en BORRADOR)
   */
  async updateOrdenCompra(
    codigo_orden_compra: number,
    data: any,
    usuario_id: number,
  ) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { codigo_orden_compra },
    });

    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (orden.estado !== 'BORRADOR') {
      throw new BadRequestException(
        'Solo se pueden editar órdenes en estado BORRADOR',
      );
    }

    // Si se actualizan los items, recalcular totales
    if (data.items) {
      let subtotal = 0;
      const nuevosDetalles = data.items.map((item: any) => {
        const total_linea = item.cantidad * item.precio_unitario;
        subtotal += total_linea;
        return {
          codigo_item: item.codigo_item,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          total_linea,
        };
      });

      const iva = subtotal * 0.15;
      const total = subtotal + iva;

      // Actualizar orden con nuevos detalles
      const ordenActualizada = await this.prisma.ordenCompra.update({
        where: { codigo_orden_compra },
        data: {
          codigo_proveedor: data.codigo_proveedor || orden.codigo_proveedor,
          observaciones: data.observaciones ?? orden.observaciones,
          subtotal,
          iva,
          total,
          detalles: {
            deleteMany: {},
            create: nuevosDetalles,
          },
        },
        include: {
          proveedor: true,
          creador: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          detalles: {
            include: {
              item: true,
            },
          },
        },
      });

      this.eventsService.emitPurchaseOrderUpdated(
        ordenActualizada.codigo_orden_compra,
        usuario_id,
        ordenActualizada,
      );

      return ordenActualizada;
    }

    // Si solo se actualiza información básica
    const ordenActualizada = await this.prisma.ordenCompra.update({
      where: { codigo_orden_compra },
      data: {
        codigo_proveedor: data.codigo_proveedor,
        observaciones: data.observaciones,
      },
      include: {
        proveedor: true,
        creador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        detalles: {
          include: {
            item: true,
          },
        },
      },
    });

    this.eventsService.emitPurchaseOrderUpdated(
      ordenActualizada.codigo_orden_compra,
      usuario_id,
      ordenActualizada,
    );

    return ordenActualizada;
  }

  /**
   * Eliminar orden de compra (solo si está en BORRADOR)
   */
  async deleteOrdenCompra(codigo_orden_compra: number, usuario_id: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { codigo_orden_compra },
    });

    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (orden.estado !== 'BORRADOR') {
      throw new BadRequestException(
        'Solo se pueden eliminar órdenes en estado BORRADOR',
      );
    }

    await this.prisma.ordenCompra.delete({
      where: { codigo_orden_compra },
    });

    this.eventsService.emitPurchaseOrderDeleted(
      codigo_orden_compra,
      usuario_id,
      { numero_orden: orden.numero_orden },
    );

    return { message: 'Orden de compra eliminada correctamente' };
  }

  /**
   * Emitir orden de compra (cambiar de BORRADOR a EMITIDA)
   */
  async emitirOrdenCompra(codigo_orden_compra: number, usuario_id: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { codigo_orden_compra },
      include: {
        proveedor: true,
        detalles: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (orden.estado !== 'BORRADOR') {
      throw new BadRequestException(
        'Solo se pueden emitir órdenes en estado BORRADOR',
      );
    }

    const ordenEmitida = await this.prisma.ordenCompra.update({
      where: { codigo_orden_compra },
      data: {
        estado: 'EMITIDA',
      },
      include: {
        proveedor: true,
        creador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        detalles: {
          include: {
            item: true,
          },
        },
      },
    });

    this.eventsService.emitPurchaseOrderEmitted(
      codigo_orden_compra,
      usuario_id,
      ordenEmitida,
    );

    return ordenEmitida;
  }

  /**
   * Recibir orden de compra (cambiar a RECIBIDA y crear movimientos de entrada)
   */
  async recibirOrdenCompra(
    codigo_orden_compra: number,
    data: any,
    usuario_id: number,
  ) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { codigo_orden_compra },
      include: {
        proveedor: true,
        detalles: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (orden.estado !== 'EMITIDA') {
      throw new BadRequestException(
        'Solo se pueden recibir órdenes en estado EMITIDA',
      );
    }

    return await this.prisma.$transaction(async (prisma) => {
      // Actualizar estado de la orden
      const ordenRecibida = await prisma.ordenCompra.update({
        where: { codigo_orden_compra },
        data: {
          estado: 'RECIBIDA',
          fecha_entrega_real: new Date(),
        },
        include: {
          proveedor: true,
          creador: {
            select: {
              nombres: true,
              apellidos: true,
            },
          },
          detalles: {
            include: {
              item: true,
            },
          },
        },
      });

      // Crear movimientos de entrada para cada item
      const items_recibidos = data.items_recibidos || orden.detalles;

      for (const itemRecibido of items_recibidos) {
        const detalle = orden.detalles.find(
          (d) => d.codigo_item === itemRecibido.codigo_item,
        );

        if (!detalle) continue;

        const cantidad_recibida =
          itemRecibido.cantidad_recibida || detalle.cantidad;

        // Actualizar stock del item
        await prisma.item.update({
          where: { codigo_item: detalle.codigo_item },
          data: {
            stock_actual: {
              increment: cantidad_recibida,
            },
          },
        });

        const item = await prisma.item.findUnique({
          where: { codigo_item: detalle.codigo_item },
        });

        // Crear movimiento de entrada
        await prisma.movimiento.create({
          data: {
            codigo_item: detalle.codigo_item,
            tipo_movimiento: 'ENTRADA',
            cantidad: cantidad_recibida,
            stock_anterior: item.stock_actual - cantidad_recibida,
            stock_nuevo: item.stock_actual,
            motivo: `Recepción de orden de compra ${orden.numero_orden}`,
            realizado_por: usuario_id,
          },
        });

        // Si se proporcionó información de lote, crear el lote
        if (itemRecibido.numero_lote) {
          await prisma.lote.create({
            data: {
              codigo_item: detalle.codigo_item,
              numero_lote: itemRecibido.numero_lote,
              cantidad_inicial: cantidad_recibida,
              cantidad_actual: cantidad_recibida,
              fecha_vencimiento: itemRecibido.fecha_vencimiento
                ? new Date(itemRecibido.fecha_vencimiento)
                : null,
            },
          });
        }
      }

      // Emitir evento
      this.eventsService.emitPurchaseOrderReceived(
        codigo_orden_compra,
        usuario_id,
        ordenRecibida,
      );

      return ordenRecibida;
    });
  }

  /**
   * Cancelar orden de compra
   */
  async cancelarOrdenCompra(codigo_orden_compra: number, usuario_id: number) {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { codigo_orden_compra },
    });

    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    if (orden.estado === 'RECIBIDA') {
      throw new BadRequestException(
        'No se puede cancelar una orden que ya fue recibida',
      );
    }

    if (orden.estado === 'CANCELADA') {
      throw new BadRequestException('La orden ya está cancelada');
    }

    const ordenCancelada = await this.prisma.ordenCompra.update({
      where: { codigo_orden_compra },
      data: {
        estado: 'CANCELADA',
      },
      include: {
        proveedor: true,
        creador: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
        detalles: {
          include: {
            item: true,
          },
        },
      },
    });

    this.eventsService.emitPurchaseOrderCancelled(
      codigo_orden_compra,
      usuario_id,
      ordenCancelada,
    );

    return ordenCancelada;
  }
}
