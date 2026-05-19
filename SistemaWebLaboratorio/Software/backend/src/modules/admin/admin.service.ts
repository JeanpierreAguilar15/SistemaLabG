import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

import { AdminEventsService, AdminEventType } from './admin-events.service';
import { APP_ROLES, isAdminRoleName, normalizeRoleName } from '../auth/constants/roles.constants';
import { CANONICAL_ROLE_NAMES, getAccessLevelForRole, isValidRoleName } from './constants/role-permissions';
import {
  formatAuditActivityLog,
  formatAuditErrorLog,
} from '../auditoria/utils/audit-formatting';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private eventsService: AdminEventsService,
  ) { }

  // ==================== USUARIOS ====================
  // Logic moved to UsersService


  // ==================== ROLES ====================

  async getAllRoles() {
    return this.prisma.rol.findMany({
      where: {
        OR: [
          ...CANONICAL_ROLE_NAMES.map((nombre) => ({ nombre })),
          { nombre: 'ADMIN' },
          { nombre: 'PERSONAL_LAB' },
          { nombre: 'PACIENTE' },
        ],
      },
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
    if (!isValidRoleName(data.nombre)) {
      throw new BadRequestException('Solo se permiten los roles Administrador, Personal_Laboratorio y Paciente');
    }
    const normalizedName = normalizeRoleName(data.nombre);

    const existingRole = await this.prisma.rol.findUnique({
      where: { nombre: normalizedName },
    });

    if (existingRole) {
      throw new BadRequestException(`El rol ${normalizedName} ya existe`);
    }

    const role = await this.prisma.rol.create({
      data: {
        ...data,
        nombre: normalizedName,
        nivel_acceso: getAccessLevelForRole(normalizedName),
      },
    });

    // Emitir evento de creación de rol
    this.eventsService.emitRoleCreated(
      role.codigo_rol,
      adminId,
      { nombre: role.nombre, nivel_acceso: role.nivel_acceso },
    );

    return role;
  }

  async updateRole(codigo_rol: number, data: Prisma.RolUpdateInput, adminId: number, force: boolean = false) {
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

    const isCanonicalRole = this.isCanonicalRole(role);

    if (data.nombre) {
      if (!isValidRoleName(data.nombre as string)) {
        throw new BadRequestException('Solo se permiten los roles Administrador, Personal_Laboratorio y Paciente');
      }
      const normalizedName = normalizeRoleName(data.nombre as string);
      if (isCanonicalRole && normalizedName !== normalizeRoleName(role.nombre)) {
        throw new BadRequestException('No se puede cambiar el nombre de un rol del sistema');
      }
      data.nombre = normalizedName;
      data.nivel_acceso = getAccessLevelForRole(normalizedName);
    }

    if (isCanonicalRole) {
      if (data.activo === false) {
        throw new BadRequestException('No se puede desactivar un rol del sistema');
      }

      if (
        data.nivel_acceso !== undefined &&
        Number(data.nivel_acceso) !== getAccessLevelForRole(role.nombre)
      ) {
        throw new BadRequestException('No se puede cambiar el nivel operativo de un rol del sistema');
      }
    }

    // Proteger rol de administrador del sistema.
    const isSystemAdmin = this.isSystemAdminRole(role);

    if (isSystemAdmin) {
      // No permitir desactivar el rol de administrador
      if (data.activo === false) {
        throw new BadRequestException(
          'No se puede desactivar el rol de administrador del sistema. ' +
          'Este rol es necesario para el funcionamiento del sistema.'
        );
      }

      // No permitir cambiar el nombre del rol de administrador (ni siquiera mayusculas/minusculas)
      if (data.nombre && !isAdminRoleName(data.nombre as string)) {
        throw new BadRequestException(
          'No se puede cambiar el nombre del rol de administrador del sistema. ' +
          'El rol debe permanecer como "Administrador".'
        );
      }

      // No permitir bajar el nivel operativo del administrador
      if (data.nivel_acceso && (data.nivel_acceso as number) < getAccessLevelForRole(APP_ROLES.ADMINISTRADOR)) {
        throw new BadRequestException(
          'No se puede reducir el nivel de acceso del rol de administrador del sistema. ' +
          'El rol Administrador es requerido para el funcionamiento del sistema.'
        );
      }
    }

    // Si se va a DESACTIVAR el rol, verificar que no tenga usuarios asignados
    if (data.activo === false && role.activo && role._count.usuarios > 0 && !force) {
      throw new BadRequestException(
        `No se puede desactivar: el rol tiene ${role._count.usuarios} usuario(s) asignado(s). ` +
        `Reasigne los usuarios a otro rol primero o use force=true para desactivar de todos modos.`
      );
    }

    const updatedRole = await this.prisma.rol.update({
      where: { codigo_rol },
      data,
    });

    // Emitir evento de actualización de rol
    this.eventsService.emitRoleUpdated(
      codigo_rol,
      adminId,
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

    if (this.isCanonicalRole(role)) {
      throw new BadRequestException(
        'No se puede eliminar un rol del sistema. ' +
        'Los roles Administrador, Personal_Laboratorio y Paciente son requeridos.'
      );
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

  private isSystemAdminRole(role: { nombre?: string | null; nivel_acceso?: number | null }) {
    return isAdminRoleName(role.nombre) || role.nivel_acceso === 10;
  }

  private isCanonicalRole(role: { nombre?: string | null }) {
    return CANONICAL_ROLE_NAMES.includes(normalizeRoleName(role.nombre) as any);
  }

  private normalizeExamPayload(data: any) {
    const payload = { ...data };

    if (payload.codigo_interno !== undefined) {
      payload.codigo_interno = String(payload.codigo_interno).trim();
    }
    if (payload.nombre !== undefined) {
      payload.nombre = String(payload.nombre).trim();
    }

    for (const key of [
      'descripcion',
      'instrucciones_preparacion',
      'tipo_muestra',
      'unidad_medida',
      'valores_referencia_texto',
    ]) {
      if (payload[key] !== undefined) {
        const value = typeof payload[key] === 'string' ? payload[key].trim() : payload[key];
        payload[key] = value || null;
      }
    }

    if (payload.codigo_categoria === '' || payload.codigo_categoria === undefined) {
      delete payload.codigo_categoria;
    } else if (payload.codigo_categoria !== null) {
      payload.codigo_categoria = Number(payload.codigo_categoria);
    }

    if (payload.tiempo_entrega_horas !== undefined) {
      payload.tiempo_entrega_horas = Number(payload.tiempo_entrega_horas);
      if (!Number.isInteger(payload.tiempo_entrega_horas) || payload.tiempo_entrega_horas < 1) {
        throw new BadRequestException('El tiempo de entrega debe ser un entero mayor a 0 horas.');
      }
    }

    if (payload.requiere_ayuno === false) {
      payload.horas_ayuno = null;
    } else if (payload.horas_ayuno !== undefined && payload.horas_ayuno !== null && payload.horas_ayuno !== '') {
      payload.horas_ayuno = Number(payload.horas_ayuno);
      if (!Number.isInteger(payload.horas_ayuno) || payload.horas_ayuno < 1 || payload.horas_ayuno > 24) {
        throw new BadRequestException('Las horas de ayuno deben estar entre 1 y 24.');
      }
    } else if (payload.horas_ayuno === '') {
      payload.horas_ayuno = null;
    }

    if (payload.valor_referencia_min !== undefined && payload.valor_referencia_min !== null && payload.valor_referencia_min !== '') {
      payload.valor_referencia_min = Number(payload.valor_referencia_min);
    } else if (payload.valor_referencia_min === '') {
      payload.valor_referencia_min = null;
    }

    if (payload.valor_referencia_max !== undefined && payload.valor_referencia_max !== null && payload.valor_referencia_max !== '') {
      payload.valor_referencia_max = Number(payload.valor_referencia_max);
    } else if (payload.valor_referencia_max === '') {
      payload.valor_referencia_max = null;
    }

    const min = payload.valor_referencia_min;
    const max = payload.valor_referencia_max;
    if (min !== undefined && min !== null && !Number.isFinite(min)) {
      throw new BadRequestException('El valor minimo de referencia no es valido.');
    }
    if (max !== undefined && max !== null && !Number.isFinite(max)) {
      throw new BadRequestException('El valor maximo de referencia no es valido.');
    }
    if (min !== undefined && min !== null && max !== undefined && max !== null && min >= max) {
      throw new BadRequestException('El rango de referencia debe tener un valor minimo menor al maximo.');
    }
    if ((min !== undefined && min !== null || max !== undefined && max !== null) && !payload.unidad_medida) {
      throw new BadRequestException('La unidad de medida es obligatoria cuando se define un rango de referencia.');
    }

    return payload;
  }

  private async ensureActiveExamCategory(codigo_categoria?: number | null) {
    if (codigo_categoria === undefined || codigo_categoria === null) {
      return;
    }

    if (!Number.isInteger(codigo_categoria)) {
      throw new BadRequestException('La categoria del examen no es valida.');
    }

    const category = await this.prisma.categoriaExamen.findUnique({
      where: { codigo_categoria },
    });

    if (!category || !category.activo) {
      throw new BadRequestException('Debe seleccionar una categoria activa para el examen.');
    }
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
      },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    return exam;
  }

  async createExam(data: any, adminId: number) {
    const payload = this.normalizeExamPayload(data);

    // Verificar que el codigo_interno no exista
    const existingByCode = await this.prisma.examen.findUnique({
      where: { codigo_interno: payload.codigo_interno },
    });

    if (existingByCode) {
      throw new BadRequestException(
        `Ya existe un examen con el codigo interno "${payload.codigo_interno}".`
      );
    }

    // Validar nombre único (case insensitive)
    const existingByName = await this.prisma.examen.findFirst({
      where: {
        nombre: { equals: payload.nombre, mode: 'insensitive' },
      },
    });

    if (existingByName) {
      throw new BadRequestException(
        `Ya existe un examen con el nombre "${existingByName.nombre}". ` +
        'Los nombres de examenes deben ser unicos.'
      );
    }

    await this.ensureActiveExamCategory(payload.codigo_categoria);

    const exam = await this.prisma.examen.create({
      data: payload,
      include: {
        categoria: true,
      },
    });

    // Emitir evento de creación de examen
    this.eventsService.emitExamCreated(
      exam.codigo_examen,
      adminId,
      { nombre: exam.nombre, codigo_interno: exam.codigo_interno, activo: exam.activo },
    );

    return exam;
  }

  async updateExam(codigo_examen: number, data: any, adminId: number) {
    const payload = this.normalizeExamPayload(data);

    const exam = await this.prisma.examen.findUnique({
      where: { codigo_examen },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    // Si se está actualizando el codigo_interno, validar que no exista
    if (payload.codigo_interno && payload.codigo_interno !== exam.codigo_interno) {
      const existingByCode = await this.prisma.examen.findUnique({
        where: { codigo_interno: payload.codigo_interno },
      });

      if (existingByCode) {
        throw new BadRequestException(
          `Ya existe un examen con el codigo interno "${payload.codigo_interno}".`
        );
      }
    }

    // Validar nombre único si se está actualizando (case insensitive)
    if (payload.nombre && payload.nombre !== exam.nombre) {
      const existingByName = await this.prisma.examen.findFirst({
        where: {
          nombre: { equals: payload.nombre, mode: 'insensitive' },
          codigo_examen: { not: codigo_examen },
        },
      });

      if (existingByName) {
        throw new BadRequestException(
          `Ya existe un examen con el nombre "${existingByName.nombre}". ` +
          'Los nombres de examenes deben ser unicos.'
        );
      }
    }

    await this.ensureActiveExamCategory(payload.codigo_categoria);

    const updatedExam = await this.prisma.examen.update({
      where: { codigo_examen },
      data: payload,
      include: {
        categoria: true,
      },
    });

    // Emitir evento de actualización de examen
    this.eventsService.emitExamUpdated(
      codigo_examen,
      adminId,
      { changedFields: Object.keys(payload) },
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

    // Verificar si tiene resultados pendientes
    const resultadosPendientes = await this.prisma.resultado.count({
      where: {
        codigo_examen,
        estado: 'EN_PROCESO',
      },
    });

    if (resultadosPendientes > 0) {
      throw new BadRequestException(
        `No se puede desactivar: el examen tiene ${resultadosPendientes} resultado(s) pendiente(s) de procesar. ` +
        'Complete o cancele los resultados primero.'
      );
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
      adminId,
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
      adminId,
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

  // ==================== INVENTARIO ====================
  // Logic moved to InventarioService


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
      data: logs.map((log) => formatAuditActivityLog(log as any)),
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
      data: logs.map((log) => formatAuditErrorLog(log as any)),
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
      const logs = (await this.prisma.logActividad.findMany({
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
      })).map((log) => formatAuditActivityLog(log as any));

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
            accion: 105,
            resumen: 150,
            entidad: 80,
            ip: 47,
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
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        activeUsers,
        totalExams,
        pendingResults,
        lowStockItems,
        recentExams,
      ] = await Promise.all([
        // Usuarios
        this.prisma.usuario.count(),
        this.prisma.usuario.count({ where: { activo: true } }),

        // Exámenes
        this.prisma.examen.count({ where: { activo: true } }),

        // Resultados pendientes
        this.prisma.resultado.count({
          where: { estado: 'EN_PROCESO' },
        }),

        // Inventario bajo stock (usando raw query porque necesitamos comparar columnas)
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::int as count
          FROM inventario.item
          WHERE activo = true AND stock_actual <= stock_minimo
        `,

        // Últimos exámenes
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
          total: totalUsers,
          active: activeUsers,
        },
        exams: {
          total: totalExams,
        },
        results: {
          pending: pendingResults,
        },
        inventory: {
          lowStock: Number(lowStockItems[0]?.count || 0),
        },
        recentExams: recentExams.map(exam => ({
          code: exam.codigo_interno,
          name: exam.nombre,
          date: exam.fecha_creacion,
        })),
      };
    } catch (error) {
      this.logger.error('Error getting dashboard stats:', error);
      // Retornar estructura vacía en caso de error
      throw error;
    }
  }

  // ==================== ÓRDENES DE COMPRA ====================
  // Logic moved to InventarioService

  // ==================== CONFIGURACIÓN DEL SISTEMA ====================

  /**
   * Obtiene todas las configuraciones del sistema agrupadas
   */
  async getSystemConfig(grupo?: string) {
    const where: any = {};
    if (grupo) {
      where.grupo = grupo;
    }

    const configs = await this.prisma.configuracionSistema.findMany({
      where,
      orderBy: [{ grupo: 'asc' }, { clave: 'asc' }],
    });

    return configs.map((config) => ({
      codigo_config: config.codigo_config,
      clave: config.clave,
      valor: config.valor,
      descripcion: config.descripcion,
      grupo: config.grupo,
      tipo_dato: config.tipo_dato,
      es_publico: config.es_publico,
      fecha_creacion: config.fecha_creacion,
      fecha_actualizacion: config.fecha_actualizacion,
    }));
  }

  /**
   * Obtiene la configuración de seguridad de login
   */
  async getSecurityConfig() {
    const configs = await this.prisma.configuracionSistema.findMany({
      where: { grupo: 'SEGURIDAD' },
    });

    // Valores por defecto
    let maxIntentos = 5;
    let minutosBloqueo = 5;

    configs.forEach(config => {
      if (config.clave === 'LOGIN_MAX_INTENTOS') {
        maxIntentos = parseInt(config.valor) || 5;
      }
      if (config.clave === 'LOGIN_MINUTOS_BLOQUEO') {
        minutosBloqueo = parseInt(config.valor) || 5;
      }
    });

    return {
      maxIntentos,
      minutosBloqueo,
      configs: configs.map(c => ({
        codigo: c.codigo_config,
        clave: c.clave,
        valor: c.valor,
        descripcion: c.descripcion,
      })),
    };
  }

  /**
   * Actualiza una configuración del sistema
   */
  async updateSystemConfig(clave: string, valor: string, adminId: number) {
    const config = await this.prisma.configuracionSistema.findUnique({
      where: { clave },
    });

    if (!config) {
      throw new NotFoundException(`Configuración '${clave}' no encontrada`);
    }

    const tipoDato = config.tipo_dato.toUpperCase();
    if (tipoDato === 'INTEGER' || tipoDato === 'NUMBER') {
      const numValue = parseInt(valor, 10);
      if (isNaN(numValue) || numValue < 1) {
        throw new BadRequestException('El valor debe ser un numero entero positivo');
      }

      const maxByKey: Record<string, number> = {
        LOGIN_MAX_INTENTOS: 20,
        LOGIN_MINUTOS_BLOQUEO: 720,
        ALERTAS_DIAS_VENCIMIENTO: 365,
        ALERTAS_DIAS_SIN_MOVIMIENTO: 365,
        ALERTAS_STOCK_CRITICO_PORCENTAJE: 100,
      };
      const maxValue = maxByKey[clave];
      if (maxValue && numValue > maxValue) {
        throw new BadRequestException(`El valor maximo permitido para ${clave} es ${maxValue}`);
      }
    }

    if (tipoDato === 'BOOLEAN' && !['true', 'false'].includes(valor.toLowerCase())) {
      throw new BadRequestException('El valor debe ser true o false');
    }

    const updated = await this.prisma.configuracionSistema.update({
      where: { clave },
      data: { valor },
    });

    this.eventsService.emitEvent(AdminEventType.CONFIG_UPDATED, {
      entityType: 'system_config',
      entityId: updated.codigo_config,
      action: 'updated',
      userId: adminId,
      data: { clave, valor_anterior: config.valor, valor_nuevo: valor },
      timestamp: new Date(),
    });

    this.logger.log(`Config '${clave}' actualizada a '${valor}' por admin ${adminId}`);

    return {
      codigo_config: updated.codigo_config,
      clave: updated.clave,
      valor: updated.valor,
      descripcion: updated.descripcion,
      grupo: updated.grupo,
      tipo_dato: updated.tipo_dato,
      es_publico: updated.es_publico,
    };
  }

  /**
   * Inicializa las configuraciones de seguridad si no existen
   */
  async ensureSecurityConfigs() {
    const defaultConfigs = [
      {
        clave: 'LOGIN_MAX_INTENTOS',
        valor: '5',
        descripcion: 'Número máximo de intentos de login fallidos antes de bloquear la cuenta temporalmente',
        grupo: 'SEGURIDAD',
        tipo_dato: 'INTEGER',
      },
      {
        clave: 'LOGIN_MINUTOS_BLOQUEO',
        valor: '5',
        descripcion: 'Minutos de bloqueo temporal después de exceder los intentos máximos',
        grupo: 'SEGURIDAD',
        tipo_dato: 'INTEGER',
      },
    ];

    for (const config of defaultConfigs) {
      await this.prisma.configuracionSistema.upsert({
        where: { clave: config.clave },
        update: {},
        create: config,
      });
    }

    return { message: 'Configuraciones de seguridad inicializadas' };
  }

  /**
   * Desbloquea una cuenta de usuario manualmente
   */
  async unlockUserAccount(codigoUsuario: number, adminId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { codigo_usuario: codigoUsuario },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.usuario.update({
      where: { codigo_usuario: codigoUsuario },
      data: {
        cuenta_bloqueada: false,
        intentos_fallidos: 0,
        fecha_bloqueo: null,
      },
    });

    this.logger.log(`Cuenta ${codigoUsuario} desbloqueada por admin ${adminId}`);

    return { message: 'Cuenta desbloqueada exitosamente' };
  }

  /**
   * Obtiene usuarios con cuentas bloqueadas
   */
  async getBlockedUsers() {
    return this.prisma.usuario.findMany({
      where: { cuenta_bloqueada: true },
      select: {
        codigo_usuario: true,
        cedula: true,
        email: true,
        nombres: true,
        apellidos: true,
        intentos_fallidos: true,
        fecha_bloqueo: true,
      },
      orderBy: { fecha_bloqueo: 'desc' },
    });
  }
}
