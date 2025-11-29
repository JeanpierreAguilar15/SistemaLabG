import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateMovimientoDto,
  FilterMovimientosDto,
  ValidateRucEcuador,
  TipoMovimiento,
} from './dto';

@Injectable()
export class InventarioService {
  private readonly logger = new Logger(InventarioService.name);

  constructor(private prisma: PrismaService) { }

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

    if (filters?.tipo) {
      // where.tipo = filters.tipo; // 'tipo' no existe en el modelo Item, tal vez es categoria?
      // Revisando schema: Item tiene codigo_categoria. No tiene campo 'tipo'.
      // Ignoramos filtro tipo por ahora o lo mapeamos a categoria si aplica.
    }

    if (filters?.activo !== undefined) {
      where.activo = filters.activo === 'true';
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip,
        take: limit,
        include: { categoria: true },
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
      include: { categoria: true },
    });

    if (!item) {
      throw new NotFoundException('Ítem de inventario no encontrado');
    }

    return item;
  }

  async createInventoryItem(data: CreateInventoryItemDto, adminId: number) {
    // Verificar código interno único
    const existing = await this.prisma.item.findUnique({
      where: { codigo_interno: data.codigo_interno },
    });

    if (existing) {
      throw new BadRequestException(`El código interno ${data.codigo_interno} ya está en uso`);
    }

    return this.prisma.item.create({
      data: {
        ...data,
        stock_actual: data.stock_actual || 0,
        activo: true,
      },
    });
  }

  async updateInventoryItem(codigo_item: number, data: UpdateInventoryItemDto, adminId: number) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Ítem no encontrado');
    }

    if (data.codigo_interno && data.codigo_interno !== item.codigo_interno) {
      const existing = await this.prisma.item.findUnique({
        where: { codigo_interno: data.codigo_interno },
      });

      if (existing) {
        throw new BadRequestException(`El código interno ${data.codigo_interno} ya está en uso`);
      }
    }

    return this.prisma.item.update({
      where: { codigo_item },
      data,
    });
  }

  async deleteInventoryItem(codigo_item: number, adminId: number) {
    // Verificar si tiene movimientos
    const movimientos = await this.prisma.movimiento.count({
      where: { codigo_item },
    });

    if (movimientos > 0) {
      // Soft delete
      return this.prisma.item.update({
        where: { codigo_item },
        data: { activo: false },
      });
    }

    return this.prisma.item.delete({
      where: { codigo_item },
    });
  }

  async getKardexReport() {
    return this.prisma.item.findMany({
      where: { activo: true },
      select: {
        codigo_interno: true,
        nombre: true,
        stock_actual: true,
        unidad_medida: true,
        costo_unitario: true,
      },
    });
  }

  async toggleInventoryItemStatus(codigo_item: number, adminId: number) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Ítem no encontrado');
    }

    return this.prisma.item.update({
      where: { codigo_item },
      data: { activo: !item.activo },
    });
  }

  // ==================== MOVIMIENTOS DE STOCK ====================

  async createMovimiento(data: CreateMovimientoDto, adminId: number) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item: data.codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Ítem no encontrado');
    }

    // Calcular nuevo stock
    let nuevoStock = item.stock_actual;
    if (data.tipo_movimiento === 'ENTRADA' || data.tipo_movimiento === 'AJUSTE_POSITIVO') {
      nuevoStock += data.cantidad;
    } else if (data.tipo_movimiento === 'SALIDA' || data.tipo_movimiento === 'AJUSTE_NEGATIVO') {
      if (item.stock_actual < data.cantidad) {
        throw new BadRequestException('Stock insuficiente');
      }
      nuevoStock -= data.cantidad;
    }

    // Transacción para asegurar consistencia
    return this.prisma.$transaction(async (prisma) => {
      const movimiento = await prisma.movimiento.create({
        data: {
          codigo_item: data.codigo_item,
          tipo_movimiento: data.tipo_movimiento,
          cantidad: data.cantidad,
          motivo: data.motivo,
          fecha_movimiento: new Date(),
          realizado_por: adminId,
          stock_anterior: item.stock_actual,
          stock_nuevo: nuevoStock,
        },
      });

      await prisma.item.update({
        where: { codigo_item: data.codigo_item },
        data: {
          stock_actual: nuevoStock,
          // costo_unitario no se actualiza aquí porque no viene en el DTO
        },
      });

      return movimiento;
    });
  }

  async getAllMovimientos(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;
    const where: Prisma.MovimientoWhereInput = {};

    if (filters?.codigo_item) {
      where.codigo_item = parseInt(filters.codigo_item);
    }

    if (filters?.tipo_movimiento) {
      where.tipo_movimiento = filters.tipo_movimiento;
    }

    if (filters?.fecha_desde && filters?.fecha_hasta) {
      where.fecha_movimiento = {
        gte: new Date(filters.fecha_desde),
        lte: new Date(filters.fecha_hasta),
      };
    }

    const [movimientos, total] = await Promise.all([
      this.prisma.movimiento.findMany({
        where,
        include: {
          item: { select: { nombre: true, codigo_interno: true } },
          usuario: { select: { nombres: true, apellidos: true } },
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

  async getKardexByItem(itemId: number, fecha_desde?: string, fecha_hasta?: string) {
    const where: Prisma.MovimientoWhereInput = {
      codigo_item: itemId,
    };

    if (fecha_desde && fecha_hasta) {
      where.fecha_movimiento = {
        gte: new Date(fecha_desde),
        lte: new Date(fecha_hasta),
      };
    }

    const movimientos = await this.prisma.movimiento.findMany({
      where,
      orderBy: { fecha_movimiento: 'asc' },
      include: {
        usuario: { select: { nombres: true, apellidos: true } },
      },
    });

    const item = await this.prisma.item.findUnique({
      where: { codigo_item: itemId },
    });

    return {
      item,
      movimientos,
    };
  }

  // ==================== ALERTAS DE STOCK ====================

  async getAlertasStock(filters: any) {
    const where: Prisma.ItemWhereInput = {
      activo: true,
    };

    const items = await this.prisma.item.findMany({
      where,
    });

    const alertas = items.filter((item) => {
      if (filters.tipo === 'BAJO_STOCK') {
        return item.stock_actual <= item.stock_minimo;
      }
      if (filters.tipo === 'SOBRE_STOCK') {
        return item.stock_actual >= (item.stock_maximo || 999999);
      }
      return item.stock_actual <= item.stock_minimo;
    });

    return alertas;
  }

  async getEstadisticasAlertas() {
    const items = await this.prisma.item.findMany({
      where: { activo: true },
    });

    let bajoStock = 0;
    let sobreStock = 0;
    let stockOptimo = 0;

    items.forEach((item) => {
      if (item.stock_actual <= item.stock_minimo) bajoStock++;
      else if (item.stock_actual >= (item.stock_maximo || 999999)) sobreStock++;
      else stockOptimo++;
    });

    return {
      bajoStock,
      sobreStock,
      stockOptimo,
      totalItems: items.length,
    };
  }

  // ==================== PROVEEDORES ====================

  async getAllSuppliers() {
    return this.prisma.proveedor.findMany({
      where: { activo: true },
      orderBy: { nombre_comercial: 'asc' },
    });
  }

  async getSupplierById(codigo_proveedor: number) {
    const supplier = await this.prisma.proveedor.findUnique({
      where: { codigo_proveedor },
    });

    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return supplier;
  }

  async createSupplier(data: CreateSupplierDto, adminId: number) {
    if (!ValidateRucEcuador(data.ruc)) {
      throw new BadRequestException('RUC inválido');
    }

    const existing = await this.prisma.proveedor.findUnique({
      where: { ruc: data.ruc },
    });

    if (existing) {
      throw new BadRequestException('Ya existe un proveedor con este RUC');
    }

    return this.prisma.proveedor.create({
      data: {
        ...data,
        activo: true,
      },
    });
  }

  async updateSupplier(codigo_proveedor: number, data: UpdateSupplierDto, adminId: number) {
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

  async deleteSupplier(codigo_proveedor: number, adminId: number) {
    return this.prisma.proveedor.update({
      where: { codigo_proveedor },
      data: { activo: false },
    });
  }

  // ==================== EXAMEN-INSUMO (KARDEX) ====================

  async createExamenInsumo(data: any, adminId: number) {
    const examen = await this.prisma.examen.findUnique({
      where: { codigo_examen: data.codigo_examen },
    });

    if (!examen) {
      throw new NotFoundException('Examen no encontrado');
    }

    const item = await this.prisma.item.findUnique({
      where: { codigo_item: data.codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Ítem de inventario no encontrado');
    }

    const existingRelation = await this.prisma.examenInsumo.findFirst({
      where: {
        codigo_examen: data.codigo_examen,
        codigo_item: data.codigo_item,
      },
    });

    if (existingRelation) {
      throw new BadRequestException('Este insumo ya está asignado al examen');
    }

    return this.prisma.examenInsumo.create({
      data: {
        codigo_examen: data.codigo_examen,
        codigo_item: data.codigo_item,
        cantidad_requerida: data.cantidad_requerida,
        activo: data.activo !== undefined ? data.activo : true,
      },
      include: {
        examen: { select: { codigo_examen: true, nombre: true } },
        item: { select: { codigo_item: true, nombre: true, unidad_medida: true } },
      },
    });
  }

  async getExamenInsumos(codigo_examen: number) {
    return this.prisma.examenInsumo.findMany({
      where: { codigo_examen },
      include: {
        item: true,
      },
    });
  }

  async updateExamenInsumo(id: number, data: any, adminId: number) {
    return this.prisma.examenInsumo.update({
      where: { codigo_examen_insumo: id },
      data,
    });
  }

  async deleteExamenInsumo(id: number, adminId: number) {
    return this.prisma.examenInsumo.delete({
      where: { codigo_examen_insumo: id },
    });
  }

  async getKardexByExamen(codigo_examen: number) {
    const examen = await this.prisma.examen.findUnique({
      where: { codigo_examen },
    });

    if (!examen) {
      throw new NotFoundException('Examen no encontrado');
    }

    const insumos = await this.getExamenInsumos(codigo_examen);

    return {
      examen,
      insumos,
    };
  }

  // ==================== ÓRDENES DE COMPRA ====================

  async createOrdenCompra(data: any, adminId: number) {
    return this.prisma.ordenCompra.create({
      data: {
        codigo_proveedor: data.codigo_proveedor,
        numero_orden: `OC-${Date.now()}`, // Generar número único
        creado_por: adminId,
        fecha_orden: new Date(),
        estado: 'BORRADOR',
        total: 0,
        subtotal: 0,
        iva: 0,
        detalles: {
          create:
            data.detalles?.map((d) => ({
              codigo_item: d.codigo_item,
              cantidad: d.cantidad,
              precio_unitario: d.precio_unitario,
              subtotal: d.cantidad * d.precio_unitario,
            })) || [],
        },
      },
    });
  }

  async getAllOrdenesCompra(page: number, limit: number, filters: any) {
    const skip = (page - 1) * limit;
    return this.prisma.ordenCompra.findMany({
      skip,
      take: limit,
      include: { proveedor: true, creador: true },
      orderBy: { fecha_orden: 'desc' },
    });
  }

  async getOrdenCompraById(id: number) {
    return this.prisma.ordenCompra.findUnique({
      where: { codigo_orden_compra: id },
      include: { proveedor: true, detalles: { include: { item: true } } },
    });
  }

  async updateOrdenCompra(id: number, data: any, adminId: number) {
    return this.prisma.ordenCompra.update({
      where: { codigo_orden_compra: id },
      data,
    });
  }

  async deleteOrdenCompra(id: number, adminId: number) {
    return this.prisma.ordenCompra.delete({ where: { codigo_orden_compra: id } });
  }

  async emitirOrdenCompra(id: number, adminId: number) {
    return this.prisma.ordenCompra.update({
      where: { codigo_orden_compra: id },
      // fecha_emision no existe en schema, solo fecha_orden y fecha_entrega...
      // Asumimos cambio de estado
      data: { estado: 'EMITIDA' },
    });
  }

  async recibirOrdenCompra(id: number, data: any, adminId: number) {
    return this.prisma.ordenCompra.update({
      where: { codigo_orden_compra: id },
      data: { estado: 'RECIBIDA', fecha_entrega_real: new Date() },
    });
  }

  async cancelarOrdenCompra(id: number, adminId: number) {
    return this.prisma.ordenCompra.update({
      where: { codigo_orden_compra: id },
      data: { estado: 'CANCELADA' },
    });
  }

  // ==================== DESCUENTO AUTOMÁTICO POR CITA ====================

  /**
   * Descuenta automáticamente el inventario cuando se completa una cita
   * basándose en los exámenes de la cotización asociada
   */
  async descontarInventarioPorCita(
    codigoCita: number,
    codigoCotizacion: number,
    adminId: number,
  ) {
    this.logger.log(`Descontando inventario para cita ${codigoCita} | Cotización ${codigoCotizacion}`);

    // Obtener los exámenes de la cotización
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { codigo_cotizacion: codigoCotizacion },
      include: {
        detalles: {
          include: {
            examen: {
              select: {
                codigo_examen: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    if (!cotizacion) {
      this.logger.warn(`Cotización ${codigoCotizacion} no encontrada`);
      return { success: false, message: 'Cotización no encontrada' };
    }

    const resultados = [];

    // Para cada examen en la cotización, obtener los insumos requeridos
    for (const detalle of cotizacion.detalles) {
      const insumos = await this.prisma.examenInsumo.findMany({
        where: {
          codigo_examen: detalle.codigo_examen,
          activo: true,
        },
        include: {
          item: true,
        },
      });

      // Descontar cada insumo
      for (const insumo of insumos) {
        // Convertir Decimal a number
        const cantidadRequerida = Number(insumo.cantidad_requerida);
        const cantidadTotal = cantidadRequerida * detalle.cantidad;

        try {
          // Verificar stock disponible
          if (insumo.item.stock_actual < cantidadTotal) {
            this.logger.warn(
              `Stock insuficiente para ${insumo.item.nombre}: ` +
              `requerido ${cantidadTotal}, disponible ${insumo.item.stock_actual}`
            );
            resultados.push({
              item: insumo.item.nombre,
              success: false,
              message: `Stock insuficiente (requerido: ${cantidadTotal}, disponible: ${insumo.item.stock_actual})`,
            });
            continue;
          }

          // Crear movimiento de salida
          const movimiento = await this.createMovimiento(
            {
              codigo_item: insumo.codigo_item,
              tipo_movimiento: TipoMovimiento.SALIDA,
              cantidad: cantidadTotal,
              motivo: `Uso en cita #${codigoCita} - Examen: ${detalle.examen.nombre}`,
            },
            adminId,
          );

          resultados.push({
            item: insumo.item.nombre,
            cantidad: cantidadTotal,
            success: true,
            movimiento_id: movimiento.codigo_movimiento,
          });

          this.logger.log(
            `Descontado ${cantidadTotal} de ${insumo.item.nombre} ` +
            `para examen ${detalle.examen.nombre}`
          );
        } catch (error) {
          this.logger.error(`Error al descontar ${insumo.item.nombre}:`, error);
          resultados.push({
            item: insumo.item.nombre,
            success: false,
            message: error.message,
          });
        }
      }
    }

    // Registrar en auditoría
    await this.prisma.logActividad.create({
      data: {
        codigo_usuario: adminId,
        accion: 'DESCUENTO_INVENTARIO_AUTOMATICO',
        entidad: 'Cita',
        codigo_entidad: codigoCita,
        descripcion: `Descuento automático de inventario por cita completada`,
        datos_nuevos: {
          cotizacion: codigoCotizacion,
          resultados,
        },
      },
    });

    return {
      success: true,
      resultados,
      total_items: resultados.length,
      items_descontados: resultados.filter(r => r.success).length,
    };
  }

  /**
   * Verifica disponibilidad de inventario para una cotización
   */
  async verificarDisponibilidadInventario(codigoCotizacion: number) {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { codigo_cotizacion: codigoCotizacion },
      include: {
        detalles: {
          include: {
            examen: true,
          },
        },
      },
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const disponibilidad = [];

    for (const detalle of cotizacion.detalles) {
      const insumos = await this.prisma.examenInsumo.findMany({
        where: {
          codigo_examen: detalle.codigo_examen,
          activo: true,
        },
        include: {
          item: true,
        },
      });

      for (const insumo of insumos) {
        // Convertir Decimal a number
        const cantidadPorExamen = Number(insumo.cantidad_requerida);
        const cantidadRequerida = cantidadPorExamen * detalle.cantidad;
        const disponible = insumo.item.stock_actual >= cantidadRequerida;

        disponibilidad.push({
          examen: detalle.examen.nombre,
          item: insumo.item.nombre,
          cantidad_requerida: cantidadRequerida,
          stock_actual: insumo.item.stock_actual,
          disponible,
        });
      }
    }

    const todoDisponible = disponibilidad.every(d => d.disponible);

    return {
      cotizacion: cotizacion.numero_cotizacion,
      disponibilidad,
      todo_disponible: todoDisponible,
      items_faltantes: disponibilidad.filter(d => !d.disponible),
    };
  }
}
