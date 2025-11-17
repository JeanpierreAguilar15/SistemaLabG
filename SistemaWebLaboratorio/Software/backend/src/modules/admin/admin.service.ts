import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.rol.create({
      data,
    });
  }

  async updateRole(codigo_rol: number, data: Prisma.RolUpdateInput) {
    const role = await this.prisma.rol.findUnique({
      where: { codigo_rol },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return this.prisma.rol.update({
      where: { codigo_rol },
      data,
    });
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

    return this.prisma.rol.delete({
      where: { codigo_rol },
    });
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
    return this.prisma.servicio.create({
      data,
    });
  }

  async updateService(codigo_servicio: number, data: Prisma.ServicioUpdateInput) {
    const service = await this.prisma.servicio.findUnique({
      where: { codigo_servicio },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return this.prisma.servicio.update({
      where: { codigo_servicio },
      data,
    });
  }

  async deleteService(codigo_servicio: number) {
    const service = await this.prisma.servicio.findUnique({
      where: { codigo_servicio },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    // Desactivar en lugar de eliminar
    return this.prisma.servicio.update({
      where: { codigo_servicio },
      data: { activo: false },
    });
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
    return this.prisma.sede.create({
      data,
    });
  }

  async updateLocation(codigo_sede: number, data: Prisma.SedeUpdateInput) {
    const location = await this.prisma.sede.findUnique({
      where: { codigo_sede },
    });

    if (!location) {
      throw new NotFoundException('Sede no encontrada');
    }

    return this.prisma.sede.update({
      where: { codigo_sede },
      data,
    });
  }

  async deleteLocation(codigo_sede: number) {
    const location = await this.prisma.sede.findUnique({
      where: { codigo_sede },
    });

    if (!location) {
      throw new NotFoundException('Sede no encontrada');
    }

    // Desactivar en lugar de eliminar
    return this.prisma.sede.update({
      where: { codigo_sede },
      data: { activo: false },
    });
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

    return this.prisma.examen.create({
      data,
      include: {
        categoria: true,
      },
    });
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

    return this.prisma.examen.update({
      where: { codigo_examen },
      data,
      include: {
        categoria: true,
      },
    });
  }

  async deleteExam(codigo_examen: number) {
    const exam = await this.prisma.examen.findUnique({
      where: { codigo_examen },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    // Desactivar en lugar de eliminar
    return this.prisma.examen.update({
      where: { codigo_examen },
      data: { activo: false },
    });
  }

  // ==================== PRECIOS ====================

  async createPrice(data: Prisma.PrecioCreateInput) {
    return this.prisma.precio.create({
      data,
      include: {
        examen: true,
      },
    });
  }

  async updatePrice(codigo_precio: number, data: Prisma.PrecioUpdateInput) {
    const price = await this.prisma.precio.findUnique({
      where: { codigo_precio },
    });

    if (!price) {
      throw new NotFoundException('Precio no encontrado');
    }

    return this.prisma.precio.update({
      where: { codigo_precio },
      data,
      include: {
        examen: true,
      },
    });
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
    return this.prisma.categoriaExamen.create({
      data,
    });
  }

  async updateExamCategory(codigo_categoria: number, data: Prisma.CategoriaExamenUpdateInput) {
    const category = await this.prisma.categoriaExamen.findUnique({
      where: { codigo_categoria },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.categoriaExamen.update({
      where: { codigo_categoria },
      data,
    });
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

    return this.prisma.categoriaExamen.delete({
      where: { codigo_categoria },
    });
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

    return this.prisma.paquete.create({
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

    return this.prisma.paquete.update({
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
  }

  async deletePackage(codigo_paquete: number) {
    const package_ = await this.prisma.paquete.findUnique({
      where: { codigo_paquete },
    });

    if (!package_) {
      throw new NotFoundException('Paquete no encontrado');
    }

    // Desactivar en lugar de eliminar
    return this.prisma.paquete.update({
      where: { codigo_paquete },
      data: { activo: false },
    });
  }

  // ==================== INVENTARIO ====================

  async getAllInventoryItems(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;

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

    if (filters?.stock_bajo) {
      where.stock_actual = { lte: this.prisma.item.fields.stock_minimo };
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

    return this.prisma.item.create({
      data,
      include: {
        categoria: true,
      },
    });
  }

  async updateInventoryItem(codigo_item: number, data: any) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    return this.prisma.item.update({
      where: { codigo_item },
      data,
      include: {
        categoria: true,
      },
    });
  }

  async deleteInventoryItem(codigo_item: number) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    // Desactivar en lugar de eliminar
    return this.prisma.item.update({
      where: { codigo_item },
      data: { activo: false },
    });
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
    // Verificar que el RUC no exista
    const existingSupplier = await this.prisma.proveedor.findUnique({
      where: { ruc: data.ruc },
    });

    if (existingSupplier) {
      throw new BadRequestException('El RUC ya existe');
    }

    return this.prisma.proveedor.create({
      data,
    });
  }

  async updateSupplier(codigo_proveedor: number, data: Prisma.ProveedorUpdateInput) {
    const supplier = await this.prisma.proveedor.findUnique({
      where: { codigo_proveedor },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return this.prisma.proveedor.update({
      where: { codigo_proveedor },
      data,
    });
  }

  async deleteSupplier(codigo_proveedor: number) {
    const supplier = await this.prisma.proveedor.findUnique({
      where: { codigo_proveedor },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Desactivar en lugar de eliminar
    return this.prisma.proveedor.update({
      where: { codigo_proveedor },
      data: { activo: false },
    });
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
      this.prisma.item.count({
        where: {
          stock_actual: {
            lte: this.prisma.item.fields.stock_minimo,
          },
        },
      }),
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
