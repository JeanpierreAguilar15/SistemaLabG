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
    // 1. Validar duplicados por nombre + unidad_medida + categoria
    const duplicado = await this.prisma.item.findFirst({
      where: {
        nombre: { equals: data.nombre, mode: 'insensitive' },
        unidad_medida: { equals: data.unidad_medida, mode: 'insensitive' },
        codigo_categoria: data.codigo_categoria || null,
      },
    });

    if (duplicado) {
      throw new BadRequestException(
        `Ya existe un ítem con el mismo nombre, unidad de medida y categoría: ${duplicado.codigo_interno}`
      );
    }

    // 2. Auto-generar código interno si no se proporciona
    let codigoInterno = data.codigo_interno;
    if (!codigoInterno) {
      codigoInterno = await this.generarCodigoInterno(data.codigo_categoria);
    } else {
      // Verificar que el código proporcionado no exista
      const existingCode = await this.prisma.item.findUnique({
        where: { codigo_interno: codigoInterno },
      });
      if (existingCode) {
        throw new BadRequestException(`El código interno ${codigoInterno} ya está en uso`);
      }
    }

    // 3. Crear el ítem
    const item = await this.prisma.item.create({
      data: {
        ...data,
        codigo_interno: codigoInterno,
        stock_actual: data.stock_actual || 0,
        activo: true,
      },
      include: { categoria: true },
    });

    // 4. Registrar en auditoría
    await this.registrarAuditoria(
      adminId,
      'CREAR_ITEM',
      'Item',
      item.codigo_item,
      null,
      item,
      `Creación de ítem: ${item.nombre} (${item.codigo_interno})`
    );

    this.logger.log(`Ítem creado: ${item.codigo_interno} - ${item.nombre} por usuario ${adminId}`);
    return item;
  }

  /**
   * Genera un código interno automático basado en la categoría
   * Formato: XXX-0001 (prefijo de categoría + secuencial)
   */
  private async generarCodigoInterno(codigoCategoria?: number): Promise<string> {
    let prefijo = 'ITM'; // Default prefix

    if (codigoCategoria) {
      const categoria = await this.prisma.categoriaItem.findUnique({
        where: { codigo_categoria: codigoCategoria },
      });
      if (categoria) {
        // Tomar las primeras 3 letras del nombre de categoría
        prefijo = categoria.nombre
          .substring(0, 3)
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
      }
    }

    // Buscar el último código con este prefijo
    const ultimoItem = await this.prisma.item.findFirst({
      where: {
        codigo_interno: { startsWith: prefijo },
      },
      orderBy: { codigo_interno: 'desc' },
    });

    let secuencial = 1;
    if (ultimoItem) {
      const match = ultimoItem.codigo_interno.match(/-(\d+)$/);
      if (match) {
        secuencial = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefijo}-${secuencial.toString().padStart(4, '0')}`;
  }

  /**
   * Registra una acción en el log de auditoría
   */
  private async registrarAuditoria(
    usuarioId: number,
    accion: string,
    entidad: string,
    entidadId?: number,
    valorAnterior?: any,
    valorNuevo?: any,
    descripcion?: string
  ) {
    try {
      await this.prisma.logActividad.create({
        data: {
          codigo_usuario: usuarioId,
          accion,
          entidad,
          descripcion: descripcion || `${accion} en ${entidad}`,
          ip_address: null,
          user_agent: null,
          fecha_accion: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(`Error al registrar auditoría: ${error.message}`);
    }
  }

  async updateInventoryItem(codigo_item: number, data: UpdateInventoryItemDto, adminId: number) {
    const itemAnterior = await this.prisma.item.findUnique({
      where: { codigo_item },
      include: { categoria: true },
    });

    if (!itemAnterior) {
      throw new NotFoundException('Ítem no encontrado');
    }

    // Validar código interno único si se cambia
    if (data.codigo_interno && data.codigo_interno !== itemAnterior.codigo_interno) {
      const existing = await this.prisma.item.findUnique({
        where: { codigo_interno: data.codigo_interno },
      });

      if (existing) {
        throw new BadRequestException(`El código interno ${data.codigo_interno} ya está en uso`);
      }
    }

    // Validar duplicados si cambia nombre, unidad o categoría
    if (data.nombre || data.unidad_medida || data.codigo_categoria !== undefined) {
      const duplicado = await this.prisma.item.findFirst({
        where: {
          codigo_item: { not: codigo_item },
          nombre: { equals: data.nombre || itemAnterior.nombre, mode: 'insensitive' },
          unidad_medida: { equals: data.unidad_medida || itemAnterior.unidad_medida, mode: 'insensitive' },
          codigo_categoria: data.codigo_categoria !== undefined ? data.codigo_categoria : itemAnterior.codigo_categoria,
        },
      });

      if (duplicado) {
        throw new BadRequestException(
          `Ya existe un ítem con el mismo nombre, unidad de medida y categoría: ${duplicado.codigo_interno}`
        );
      }
    }

    // Actualizar el ítem
    const itemActualizado = await this.prisma.item.update({
      where: { codigo_item },
      data,
      include: { categoria: true },
    });

    // Registrar cambios en auditoría
    const cambios = this.detectarCambios(itemAnterior, itemActualizado);
    if (cambios.length > 0) {
      await this.registrarAuditoria(
        adminId,
        'ACTUALIZAR_ITEM',
        'Item',
        codigo_item,
        itemAnterior,
        itemActualizado,
        `Actualización de ítem ${itemAnterior.codigo_interno}: ${cambios.join(', ')}`
      );
    }

    this.logger.log(`Ítem actualizado: ${itemActualizado.codigo_interno} por usuario ${adminId}`);
    return itemActualizado;
  }

  /**
   * Detecta los campos que cambiaron entre dos objetos
   */
  private detectarCambios(anterior: any, nuevo: any): string[] {
    const cambios: string[] = [];
    const camposRelevantes = ['nombre', 'descripcion', 'unidad_medida', 'stock_minimo', 'stock_maximo', 'costo_unitario', 'precio_venta', 'activo', 'codigo_categoria'];

    for (const campo of camposRelevantes) {
      if (anterior[campo] !== nuevo[campo]) {
        cambios.push(`${campo}: "${anterior[campo]}" → "${nuevo[campo]}"`);
      }
    }

    return cambios;
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

  /**
   * Kardex Global - Resumen de todos los items con sus movimientos
   * OPTIMIZADO: Usa consultas batch en lugar de N+1
   * - Total de entradas y salidas por item
   * - Stock actual y valor
   * - Último movimiento
   * - Estado del stock (normal, bajo, crítico)
   */
  async getKardexGlobal(filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    categoria?: number;
  }) {
    // 1. Obtener todos los items activos con su categoría (1 query)
    const items = await this.prisma.item.findMany({
      where: {
        activo: true,
        ...(filters?.categoria && { codigo_categoria: filters.categoria }),
      },
      include: {
        categoria: { select: { nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    if (items.length === 0) {
      return {
        resumen: {
          total_items: 0,
          items_criticos: 0,
          items_bajos: 0,
          items_agotados: 0,
          valor_total_inventario: 0,
          total_entradas: 0,
          total_salidas: 0,
        },
        items: [],
      };
    }

    const itemIds = items.map(i => i.codigo_item);

    // Construir filtro de fechas para movimientos
    const whereMovimiento: any = {
      codigo_item: { in: itemIds },
    };
    if (filters?.fecha_desde) {
      whereMovimiento.fecha_movimiento = {
        ...whereMovimiento.fecha_movimiento,
        gte: new Date(filters.fecha_desde),
      };
    }
    if (filters?.fecha_hasta) {
      whereMovimiento.fecha_movimiento = {
        ...whereMovimiento.fecha_movimiento,
        lte: new Date(filters.fecha_hasta),
      };
    }

    // 2. Obtener TODOS los totales de movimientos en UNA sola query
    const allTotales = await this.prisma.movimiento.groupBy({
      by: ['codigo_item', 'tipo_movimiento'],
      where: whereMovimiento,
      _sum: { cantidad: true },
      _count: true,
    });

    // 3. Obtener último movimiento por item usando raw query para eficiencia
    // Usamos una subquery con DISTINCT ON (PostgreSQL)
    const ultimosMovimientos = await this.prisma.$queryRaw<Array<{
      codigo_item: number;
      fecha_movimiento: Date;
      tipo_movimiento: string;
      cantidad: number;
    }>>`
      SELECT DISTINCT ON (codigo_item)
        codigo_item, fecha_movimiento, tipo_movimiento, cantidad
      FROM inventario.movimiento
      WHERE codigo_item = ANY(${itemIds})
      ${filters?.fecha_desde ? Prisma.sql`AND fecha_movimiento >= ${new Date(filters.fecha_desde)}` : Prisma.empty}
      ${filters?.fecha_hasta ? Prisma.sql`AND fecha_movimiento <= ${new Date(filters.fecha_hasta)}` : Prisma.empty}
      ORDER BY codigo_item, fecha_movimiento DESC
    `;

    // Crear mapas para acceso O(1)
    const totalesMap = new Map<number, { entradas: number; salidas: number; total: number }>();
    for (const t of allTotales) {
      const current = totalesMap.get(t.codigo_item) || { entradas: 0, salidas: 0, total: 0 };

      if (['ENTRADA', 'AJUSTE_POSITIVO', 'COMPRA'].includes(t.tipo_movimiento)) {
        current.entradas += t._sum.cantidad || 0;
      } else if (['SALIDA', 'AJUSTE_NEGATIVO', 'USO_EXAMEN', 'VENCIMIENTO'].includes(t.tipo_movimiento)) {
        current.salidas += t._sum.cantidad || 0;
      }
      current.total += t._count;

      totalesMap.set(t.codigo_item, current);
    }

    const ultimoMovMap = new Map(
      ultimosMovimientos.map(m => [m.codigo_item, m])
    );

    // 4. Construir resultado final (sin queries adicionales)
    const kardexItems = items.map(item => {
      const totales = totalesMap.get(item.codigo_item) || { entradas: 0, salidas: 0, total: 0 };
      const ultimoMov = ultimoMovMap.get(item.codigo_item);

      // Determinar estado del stock
      let estadoStock: 'NORMAL' | 'BAJO' | 'CRITICO' | 'AGOTADO' = 'NORMAL';
      if (item.stock_actual <= 0) {
        estadoStock = 'AGOTADO';
      } else if (item.stock_actual <= item.stock_minimo) {
        estadoStock = 'CRITICO';
      } else if (item.stock_actual <= item.stock_minimo * 1.5) {
        estadoStock = 'BAJO';
      }

      return {
        codigo_item: item.codigo_item,
        codigo_interno: item.codigo_interno,
        nombre: item.nombre,
        categoria: item.categoria?.nombre || 'Sin categoría',
        unidad_medida: item.unidad_medida,
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo,
        costo_unitario: item.costo_unitario,
        valor_inventario: item.stock_actual * (item.costo_unitario ? parseFloat(item.costo_unitario.toString()) : 0),
        total_entradas: totales.entradas,
        total_salidas: totales.salidas,
        total_movimientos: totales.total,
        ultimo_movimiento: ultimoMov ? {
          fecha_movimiento: ultimoMov.fecha_movimiento,
          tipo_movimiento: ultimoMov.tipo_movimiento,
          cantidad: ultimoMov.cantidad,
        } : null,
        estado_stock: estadoStock,
      };
    });

    // Calcular totales generales
    const totalesGenerales = {
      total_items: kardexItems.length,
      items_criticos: kardexItems.filter(i => i.estado_stock === 'CRITICO').length,
      items_bajos: kardexItems.filter(i => i.estado_stock === 'BAJO').length,
      items_agotados: kardexItems.filter(i => i.estado_stock === 'AGOTADO').length,
      valor_total_inventario: kardexItems.reduce((sum, i) => sum + i.valor_inventario, 0),
      total_entradas: kardexItems.reduce((sum, i) => sum + i.total_entradas, 0),
      total_salidas: kardexItems.reduce((sum, i) => sum + i.total_salidas, 0),
    };

    return {
      resumen: totalesGenerales,
      items: kardexItems,
    };
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

  /**
   * Obtiene alertas de stock con estructura completa
   * Incluye alertas por stock bajo, stock crítico y lotes próximos a vencer
   */
  async getAlertasStock(filters: any) {
    const alertas: any[] = [];

    // Obtener items con stock bajo o crítico
    const items = await this.prisma.item.findMany({
      where: { activo: true },
      include: { categoria: true },
    });

    // Alertas de stock
    for (const item of items) {
      // Stock crítico (sin stock)
      if (item.stock_actual === 0) {
        if (!filters.tipo || filters.tipo === 'STOCK_CRITICO') {
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
            prioridad: 'CRITICA' as const,
          });
        }
      }
      // Stock bajo (por debajo del mínimo)
      else if (item.stock_actual <= item.stock_minimo) {
        if (!filters.tipo || filters.tipo === 'STOCK_BAJO' || filters.tipo === 'BAJO_STOCK') {
          alertas.push({
            codigo_item: item.codigo_item,
            codigo_interno: item.codigo_interno,
            nombre: item.nombre,
            stock_actual: item.stock_actual,
            stock_minimo: item.stock_minimo,
            stock_maximo: item.stock_maximo,
            unidad_medida: item.unidad_medida,
            tipo_alerta: 'STOCK_BAJO',
            mensaje: `Stock actual (${item.stock_actual}) por debajo del mínimo (${item.stock_minimo})`,
            prioridad: 'ALTA' as const,
          });
        }
      }
    }

    // Obtener lotes próximos a vencer o vencidos
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    const lotesConVencimiento = await this.prisma.lote.findMany({
      where: {
        fecha_vencimiento: { not: null },
        cantidad_actual: { gt: 0 },
      },
      include: {
        item: true,
      },
    });

    for (const lote of lotesConVencimiento) {
      if (!lote.fecha_vencimiento) continue;

      const fechaVenc = new Date(lote.fecha_vencimiento);
      const diasHastaVenc = Math.floor((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      // Vencido
      if (fechaVenc < hoy) {
        if (!filters.tipo || filters.tipo === 'VENCIDO') {
          alertas.push({
            codigo_item: lote.item.codigo_item,
            codigo_interno: lote.item.codigo_interno,
            nombre: lote.item.nombre,
            stock_actual: lote.cantidad_actual,
            stock_minimo: lote.item.stock_minimo,
            stock_maximo: lote.item.stock_maximo,
            unidad_medida: lote.item.unidad_medida,
            tipo_alerta: 'VENCIDO',
            mensaje: `Lote ${lote.numero_lote} vencido`,
            prioridad: 'CRITICA' as const,
            codigo_lote: lote.codigo_lote,
            numero_lote: lote.numero_lote,
            fecha_vencimiento: lote.fecha_vencimiento,
            dias_hasta_vencimiento: diasHastaVenc,
          });
        }
      }
      // Próximo a vencer (30 días o menos)
      else if (fechaVenc <= en30Dias) {
        if (!filters.tipo || filters.tipo === 'PROXIMO_VENCER') {
          alertas.push({
            codigo_item: lote.item.codigo_item,
            codigo_interno: lote.item.codigo_interno,
            nombre: lote.item.nombre,
            stock_actual: lote.cantidad_actual,
            stock_minimo: lote.item.stock_minimo,
            stock_maximo: lote.item.stock_maximo,
            unidad_medida: lote.item.unidad_medida,
            tipo_alerta: 'PROXIMO_VENCER',
            mensaje: `Lote ${lote.numero_lote} vence en ${diasHastaVenc} días`,
            prioridad: diasHastaVenc <= 7 ? 'ALTA' as const : 'MEDIA' as const,
            codigo_lote: lote.codigo_lote,
            numero_lote: lote.numero_lote,
            fecha_vencimiento: lote.fecha_vencimiento,
            dias_hasta_vencimiento: diasHastaVenc,
          });
        }
      }
    }

    // Ordenar por prioridad
    const prioridadOrden = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
    alertas.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);

    return alertas;
  }

  /**
   * Obtiene estadísticas de alertas compatible con el frontend
   */
  async getEstadisticasAlertas() {
    const alertas = await this.getAlertasStock({});

    let criticas = 0;
    let altas = 0;
    let medias = 0;
    let bajas = 0;

    const por_tipo = {
      stock_critico: 0,
      stock_bajo: 0,
      vencidos: 0,
      proximos_vencer: 0,
    };

    for (const alerta of alertas) {
      // Contar por prioridad
      switch (alerta.prioridad) {
        case 'CRITICA': criticas++; break;
        case 'ALTA': altas++; break;
        case 'MEDIA': medias++; break;
        case 'BAJA': bajas++; break;
      }

      // Contar por tipo
      switch (alerta.tipo_alerta) {
        case 'STOCK_CRITICO': por_tipo.stock_critico++; break;
        case 'STOCK_BAJO': por_tipo.stock_bajo++; break;
        case 'VENCIDO': por_tipo.vencidos++; break;
        case 'PROXIMO_VENCER': por_tipo.proximos_vencer++; break;
      }
    }

    return {
      total: alertas.length,
      criticas,
      altas,
      medias,
      bajas,
      por_tipo,
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

  // ==================== CATEGORÍAS DE ITEMS ====================

  async getAllCategories() {
    return this.prisma.categoriaItem.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async getCategoryById(codigo_categoria: number) {
    const category = await this.prisma.categoriaItem.findUnique({
      where: { codigo_categoria },
      include: {
        items: {
          where: { activo: true },
          select: {
            codigo_item: true,
            codigo_interno: true,
            nombre: true,
            stock_actual: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async createCategory(data: { nombre: string; descripcion?: string }, adminId: number) {
    const existing = await this.prisma.categoriaItem.findUnique({
      where: { nombre: data.nombre },
    });

    if (existing) {
      throw new BadRequestException('Ya existe una categoría con este nombre');
    }

    return this.prisma.categoriaItem.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        activo: true,
      },
    });
  }

  async updateCategory(codigo_categoria: number, data: { nombre?: string; descripcion?: string }, adminId: number) {
    const category = await this.prisma.categoriaItem.findUnique({
      where: { codigo_categoria },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (data.nombre && data.nombre !== category.nombre) {
      const existing = await this.prisma.categoriaItem.findUnique({
        where: { nombre: data.nombre },
      });

      if (existing) {
        throw new BadRequestException('Ya existe una categoría con este nombre');
      }
    }

    return this.prisma.categoriaItem.update({
      where: { codigo_categoria },
      data,
    });
  }

  async deleteCategory(codigo_categoria: number, adminId: number) {
    const category = await this.prisma.categoriaItem.findUnique({
      where: { codigo_categoria },
      include: { _count: { select: { items: true } } },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category._count.items > 0) {
      // Soft delete si tiene items
      return this.prisma.categoriaItem.update({
        where: { codigo_categoria },
        data: { activo: false },
      });
    }

    return this.prisma.categoriaItem.delete({
      where: { codigo_categoria },
    });
  }

  // ==================== LOTES ====================

  async getAllLotes(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;
    const where: Prisma.LoteWhereInput = {};

    if (filters?.codigo_item) {
      where.codigo_item = parseInt(filters.codigo_item);
    }

    if (filters?.activo === 'true') {
      where.cantidad_actual = { gt: 0 };
    }

    if (filters?.vencidos === 'true') {
      where.fecha_vencimiento = { lt: new Date() };
    }

    if (filters?.proximos_vencer === 'true') {
      const en30Dias = new Date();
      en30Dias.setDate(en30Dias.getDate() + 30);
      where.fecha_vencimiento = {
        gte: new Date(),
        lte: en30Dias,
      };
    }

    const [lotes, total] = await Promise.all([
      this.prisma.lote.findMany({
        where,
        include: {
          item: {
            select: {
              codigo_interno: true,
              nombre: true,
              unidad_medida: true,
            },
          },
        },
        orderBy: { fecha_vencimiento: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.lote.count({ where }),
    ]);

    return {
      data: lotes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLoteById(codigo_lote: number) {
    const lote = await this.prisma.lote.findUnique({
      where: { codigo_lote },
      include: {
        item: true,
        movimientos: {
          orderBy: { fecha_movimiento: 'desc' },
          take: 10,
          include: {
            usuario: { select: { nombres: true, apellidos: true } },
          },
        },
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote no encontrado');
    }

    return lote;
  }

  async createLote(data: {
    codigo_item: number;
    numero_lote: string;
    fecha_fabricacion?: Date;
    fecha_vencimiento?: Date;
    cantidad_inicial: number;
    proveedor?: string;
  }, adminId: number) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item: data.codigo_item },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    // Crear lote y actualizar stock en transacción
    return this.prisma.$transaction(async (prisma) => {
      const lote = await prisma.lote.create({
        data: {
          codigo_item: data.codigo_item,
          numero_lote: data.numero_lote,
          fecha_fabricacion: data.fecha_fabricacion || null,
          fecha_vencimiento: data.fecha_vencimiento || null,
          cantidad_inicial: data.cantidad_inicial,
          cantidad_actual: data.cantidad_inicial,
          proveedor: data.proveedor || null,
        },
        include: { item: true },
      });

      // Registrar movimiento de entrada
      await prisma.movimiento.create({
        data: {
          codigo_item: data.codigo_item,
          codigo_lote: lote.codigo_lote,
          tipo_movimiento: 'ENTRADA',
          cantidad: data.cantidad_inicial,
          motivo: `Ingreso de lote ${data.numero_lote}`,
          stock_anterior: item.stock_actual,
          stock_nuevo: item.stock_actual + data.cantidad_inicial,
          realizado_por: adminId,
        },
      });

      // Actualizar stock del item
      await prisma.item.update({
        where: { codigo_item: data.codigo_item },
        data: { stock_actual: { increment: data.cantidad_inicial } },
      });

      return lote;
    });
  }

  async updateLote(codigo_lote: number, data: {
    numero_lote?: string;
    fecha_fabricacion?: Date;
    fecha_vencimiento?: Date;
    proveedor?: string;
  }, adminId: number) {
    const lote = await this.prisma.lote.findUnique({
      where: { codigo_lote },
    });

    if (!lote) {
      throw new NotFoundException('Lote no encontrado');
    }

    return this.prisma.lote.update({
      where: { codigo_lote },
      data: {
        numero_lote: data.numero_lote,
        fecha_fabricacion: data.fecha_fabricacion,
        fecha_vencimiento: data.fecha_vencimiento,
        proveedor: data.proveedor,
      },
    });
  }

  async getLotesByItem(codigo_item: number) {
    return this.prisma.lote.findMany({
      where: {
        codigo_item,
        cantidad_actual: { gt: 0 },
      },
      orderBy: { fecha_vencimiento: 'asc' },
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

  /**
   * Verifica si hay stock suficiente para realizar un examen
   * @returns objeto con disponibilidad y detalles de insumos faltantes
   */
  async verificarStockExamen(codigo_examen: number): Promise<{
    disponible: boolean;
    insumosFaltantes: { item: string; requerido: number; disponible: number }[];
  }> {
    const insumos = await this.prisma.examenInsumo.findMany({
      where: { codigo_examen, activo: true },
      include: { item: true },
    });

    const insumosFaltantes: { item: string; requerido: number; disponible: number }[] = [];

    for (const insumo of insumos) {
      const cantidadRequerida = Number(insumo.cantidad_requerida);
      if (insumo.item.stock_actual < cantidadRequerida) {
        insumosFaltantes.push({
          item: insumo.item.nombre,
          requerido: cantidadRequerida,
          disponible: insumo.item.stock_actual,
        });
      }
    }

    return {
      disponible: insumosFaltantes.length === 0,
      insumosFaltantes,
    };
  }

  /**
   * Verifica stock para múltiples exámenes (ej: cotización con varios exámenes)
   */
  async verificarStockExamenes(codigos_examenes: number[]): Promise<{
    disponible: boolean;
    detalles: { codigo_examen: number; disponible: boolean; faltantes: any[] }[];
  }> {
    const detalles: { codigo_examen: number; disponible: boolean; faltantes: any[] }[] = [];

    for (const codigo_examen of codigos_examenes) {
      const resultado = await this.verificarStockExamen(codigo_examen);
      detalles.push({
        codigo_examen,
        disponible: resultado.disponible,
        faltantes: resultado.insumosFaltantes,
      });
    }

    return {
      disponible: detalles.every(d => d.disponible),
      detalles,
    };
  }

  /**
   * Descuenta los insumos del inventario al completar un examen
   * Registra movimientos en el Kardex con trazabilidad
   */
  async descontarInsumosExamen(
    codigo_examen: number,
    codigo_cita: number,
    userId: number,
  ): Promise<{
    success: boolean;
    movimientos: any[];
    mensaje: string;
  }> {
    // Obtener insumos requeridos para el examen
    const insumos = await this.prisma.examenInsumo.findMany({
      where: { codigo_examen, activo: true },
      include: {
        item: true,
        examen: { select: { nombre: true } },
      },
    });

    if (insumos.length === 0) {
      return {
        success: true,
        movimientos: [],
        mensaje: 'Este examen no tiene insumos configurados',
      };
    }

    // Verificar stock antes de descontar
    const verificacion = await this.verificarStockExamen(codigo_examen);
    if (!verificacion.disponible) {
      const faltantes = verificacion.insumosFaltantes
        .map(f => `${f.item} (requiere: ${f.requerido}, disponible: ${f.disponible})`)
        .join(', ');
      throw new BadRequestException(
        `Stock insuficiente para completar el examen. Faltantes: ${faltantes}`,
      );
    }

    // Ejecutar descuento en transacción
    const movimientos: any[] = [];

    await this.prisma.$transaction(async (prisma) => {
      for (const insumo of insumos) {
        const cantidadRequerida = Number(insumo.cantidad_requerida);
        const item = insumo.item;

        // Crear movimiento de salida
        const movimiento = await prisma.movimiento.create({
          data: {
            codigo_item: item.codigo_item,
            tipo_movimiento: 'SALIDA',
            cantidad: cantidadRequerida,
            motivo: `Uso en examen: ${insumo.examen.nombre} - Cita #${codigo_cita}`,
            stock_anterior: item.stock_actual,
            stock_nuevo: item.stock_actual - cantidadRequerida,
            realizado_por: userId,
          },
        });

        // Actualizar stock del item
        await prisma.item.update({
          where: { codigo_item: item.codigo_item },
          data: { stock_actual: { decrement: cantidadRequerida } },
        });

        // Descontar de lotes (FIFO - primero los más próximos a vencer)
        let cantidadPendiente = cantidadRequerida;
        const lotes = await prisma.lote.findMany({
          where: {
            codigo_item: item.codigo_item,
            cantidad_actual: { gt: 0 },
          },
          orderBy: { fecha_vencimiento: 'asc' },
        });

        for (const lote of lotes) {
          if (cantidadPendiente <= 0) break;

          const cantidadADescontar = Math.min(cantidadPendiente, lote.cantidad_actual);
          await prisma.lote.update({
            where: { codigo_lote: lote.codigo_lote },
            data: { cantidad_actual: { decrement: cantidadADescontar } },
          });

          cantidadPendiente -= cantidadADescontar;
        }

        movimientos.push({
          codigo_movimiento: movimiento.codigo_movimiento,
          item: item.nombre,
          cantidad: cantidadRequerida,
          stock_anterior: item.stock_actual,
          stock_nuevo: item.stock_actual - cantidadRequerida,
        });
      }
    });

    this.logger.log(
      `Insumos descontados para examen ${codigo_examen}, cita ${codigo_cita}. ${movimientos.length} items afectados.`,
    );

    return {
      success: true,
      movimientos,
      mensaje: `Se descontaron ${movimientos.length} insumos del inventario`,
    };
  }

  /**
   * Descuenta insumos para múltiples exámenes (cotización completa)
   */
  async descontarInsumosMultiplesExamenes(
    codigos_examenes: number[],
    codigo_cita: number,
    userId: number,
  ): Promise<{
    success: boolean;
    resultados: any[];
    totalMovimientos: number;
  }> {
    const resultados: any[] = [];
    let totalMovimientos = 0;

    for (const codigo_examen of codigos_examenes) {
      try {
        const resultado = await this.descontarInsumosExamen(
          codigo_examen,
          codigo_cita,
          userId,
        );
        resultados.push({
          codigo_examen,
          ...resultado,
        });
        totalMovimientos += resultado.movimientos.length;
      } catch (error) {
        resultados.push({
          codigo_examen,
          success: false,
          mensaje: error.message,
        });
      }
    }

    return {
      success: resultados.every(r => r.success),
      resultados,
      totalMovimientos,
    };
  }

  /**
   * Obtiene el kardex completo de un item (historial de movimientos)
   */
  async getKardexCompletoItem(codigo_item: number, filters?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo_movimiento?: string;
  }) {
    const item = await this.prisma.item.findUnique({
      where: { codigo_item },
      include: { categoria: true },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    const where: any = { codigo_item };

    if (filters?.fecha_desde) {
      where.fecha_movimiento = { ...where.fecha_movimiento, gte: new Date(filters.fecha_desde) };
    }
    if (filters?.fecha_hasta) {
      where.fecha_movimiento = { ...where.fecha_movimiento, lte: new Date(filters.fecha_hasta) };
    }
    if (filters?.tipo_movimiento) {
      where.tipo_movimiento = filters.tipo_movimiento;
    }

    const movimientos = await this.prisma.movimiento.findMany({
      where,
      include: {
        lote: { select: { numero_lote: true, fecha_vencimiento: true } },
        usuario: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { fecha_movimiento: 'desc' },
    });

    // Calcular totales
    const totales = {
      entradas: 0,
      salidas: 0,
      ajustes_positivos: 0,
      ajustes_negativos: 0,
    };

    for (const mov of movimientos) {
      switch (mov.tipo_movimiento) {
        case 'ENTRADA': totales.entradas += mov.cantidad; break;
        case 'SALIDA': totales.salidas += mov.cantidad; break;
        case 'AJUSTE_POSITIVO': totales.ajustes_positivos += mov.cantidad; break;
        case 'AJUSTE_NEGATIVO': totales.ajustes_negativos += mov.cantidad; break;
      }
    }

    return {
      item,
      stock_actual: item.stock_actual,
      movimientos,
      totales,
      resumen: {
        total_movimientos: movimientos.length,
        balance: totales.entradas + totales.ajustes_positivos - totales.salidas - totales.ajustes_negativos,
      },
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
}
