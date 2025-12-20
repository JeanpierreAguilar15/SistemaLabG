import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { WhatsAppService } from '../../comunicaciones/whatsapp.service';

export interface AbrirLoteDto {
  codigo_lote: number;
}

export interface RegistrarPruebasDto {
  codigo_lote: number;
  cantidad_pruebas: number;
  observacion?: string;
}

export interface DescartarLoteDto {
  codigo_lote: number;
  motivo: 'VENCIDO_APERTURA' | 'VENCIDO_LOTE' | 'AGOTADO' | 'DANADO' | 'MANUAL';
  observacion?: string;
}

export interface LoteAbierto {
  codigo_lote: number;
  numero_lote: string;
  item_nombre: string;
  fecha_apertura: Date;
  fecha_vencimiento_abierto: Date;
  dias_restantes: number;
  horas_restantes: number;
  pruebas_realizadas: number;
  capacidad_pruebas: number;
  pruebas_restantes: number;
  porcentaje_uso: number;
  estado: string;
}

@Injectable()
export class ReactivosService {
  private readonly logger = new Logger(ReactivosService.name);

  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
  ) {}

  /**
   * Abre un lote de reactivo - inicia el contador de vida util
   */
  async abrirLote(dto: AbrirLoteDto, usuarioId?: number): Promise<any> {
    const lote = await this.prisma.lote.findUnique({
      where: { codigo_lote: dto.codigo_lote },
      include: { item: true },
    });

    if (!lote) {
      throw new NotFoundException('Lote no encontrado');
    }

    if (lote.estado_lote !== 'CERRADO') {
      throw new BadRequestException(`El lote ya esta ${lote.estado_lote.toLowerCase()}`);
    }

    if (lote.cantidad_actual <= 0) {
      throw new BadRequestException('El lote no tiene stock disponible');
    }

    // Verificar si el item es un reactivo
    if (!lote.item.es_reactivo) {
      throw new BadRequestException('Este item no esta configurado como reactivo');
    }

    const ahora = new Date();
    let fechaVencimientoAbierto: Date | null = null;

    // Calcular fecha de vencimiento por apertura
    if (lote.item.vida_util_dias_abierto) {
      fechaVencimientoAbierto = new Date(ahora);
      fechaVencimientoAbierto.setDate(fechaVencimientoAbierto.getDate() + lote.item.vida_util_dias_abierto);

      // Si el vencimiento por apertura es despues del vencimiento del lote, usar el del lote
      if (lote.fecha_vencimiento && fechaVencimientoAbierto > lote.fecha_vencimiento) {
        fechaVencimientoAbierto = lote.fecha_vencimiento;
      }
    }

    const loteActualizado = await this.prisma.lote.update({
      where: { codigo_lote: dto.codigo_lote },
      data: {
        estado_lote: 'ABIERTO',
        fecha_apertura: ahora,
        fecha_vencimiento_abierto: fechaVencimientoAbierto,
      },
      include: { item: true },
    });

    // Registrar movimiento
    await this.prisma.movimiento.create({
      data: {
        codigo_item: lote.codigo_item,
        codigo_lote: dto.codigo_lote,
        tipo_movimiento: 'APERTURA_REACTIVO',
        cantidad: 0,
        motivo: `Apertura de lote ${lote.numero_lote}. Vence: ${fechaVencimientoAbierto?.toLocaleDateString('es-EC') || 'N/A'}`,
        stock_anterior: lote.item.stock_actual,
        stock_nuevo: lote.item.stock_actual,
        realizado_por: usuarioId,
      },
    });

    this.logger.log(`Lote ${lote.numero_lote} abierto. Vence en ${lote.item.vida_util_dias_abierto} dias`);

    return {
      success: true,
      lote: loteActualizado,
      mensaje: `Lote abierto. ${lote.item.vida_util_dias_abierto ? `Tiene ${lote.item.vida_util_dias_abierto} dias de vida util` : 'Sin limite de tiempo'}`,
      fecha_vencimiento_abierto: fechaVencimientoAbierto,
    };
  }

  /**
   * Registra pruebas realizadas con un lote abierto
   */
  async registrarPruebas(dto: RegistrarPruebasDto, usuarioId?: number): Promise<any> {
    const lote = await this.prisma.lote.findUnique({
      where: { codigo_lote: dto.codigo_lote },
      include: { item: true },
    });

    if (!lote) {
      throw new NotFoundException('Lote no encontrado');
    }

    if (lote.estado_lote !== 'ABIERTO') {
      throw new BadRequestException(`El lote no esta abierto (estado: ${lote.estado_lote})`);
    }

    // Verificar si ya vencio por apertura
    if (lote.fecha_vencimiento_abierto && new Date() > lote.fecha_vencimiento_abierto) {
      throw new BadRequestException('El lote ya vencio por tiempo de apertura. Debe descartarlo.');
    }

    const nuevasPruebas = lote.pruebas_realizadas + dto.cantidad_pruebas;
    const capacidad = lote.item.capacidad_pruebas || 999999;

    if (nuevasPruebas > capacidad) {
      throw new BadRequestException(`Excede la capacidad del lote. Pruebas restantes: ${capacidad - lote.pruebas_realizadas}`);
    }

    let nuevoEstado = 'ABIERTO';
    let motivoDescarte: string | null = null;

    // Si se agotaron las pruebas
    if (nuevasPruebas >= capacidad) {
      nuevoEstado = 'AGOTADO';
      motivoDescarte = 'AGOTADO';
    }

    const loteActualizado = await this.prisma.lote.update({
      where: { codigo_lote: dto.codigo_lote },
      data: {
        pruebas_realizadas: nuevasPruebas,
        estado_lote: nuevoEstado,
        motivo_descarte: motivoDescarte,
        fecha_descarte: nuevoEstado === 'AGOTADO' ? new Date() : null,
      },
      include: { item: true },
    });

    // Registrar movimiento
    await this.prisma.movimiento.create({
      data: {
        codigo_item: lote.codigo_item,
        codigo_lote: dto.codigo_lote,
        tipo_movimiento: 'USO_REACTIVO',
        cantidad: dto.cantidad_pruebas,
        motivo: dto.observacion || `${dto.cantidad_pruebas} prueba(s) realizada(s)`,
        stock_anterior: lote.item.stock_actual,
        stock_nuevo: lote.item.stock_actual,
        realizado_por: usuarioId,
      },
    });

    return {
      success: true,
      lote: loteActualizado,
      pruebas_realizadas: nuevasPruebas,
      pruebas_restantes: capacidad - nuevasPruebas,
      estado: nuevoEstado,
    };
  }

  /**
   * Descarta un lote (por vencimiento, dano, etc)
   */
  async descartarLote(dto: DescartarLoteDto, usuarioId?: number): Promise<any> {
    const lote = await this.prisma.lote.findUnique({
      where: { codigo_lote: dto.codigo_lote },
      include: { item: true },
    });

    if (!lote) {
      throw new NotFoundException('Lote no encontrado');
    }

    if (lote.estado_lote === 'DESCARTADO') {
      throw new BadRequestException('El lote ya fue descartado');
    }

    const pruebasNoUsadas = (lote.item.capacidad_pruebas || 0) - lote.pruebas_realizadas;

    const loteActualizado = await this.prisma.lote.update({
      where: { codigo_lote: dto.codigo_lote },
      data: {
        estado_lote: 'DESCARTADO',
        motivo_descarte: dto.motivo,
        fecha_descarte: new Date(),
        cantidad_actual: 0,
      },
      include: { item: true },
    });

    // Actualizar stock del item
    await this.prisma.item.update({
      where: { codigo_item: lote.codigo_item },
      data: {
        stock_actual: {
          decrement: lote.cantidad_actual,
        },
      },
    });

    // Registrar movimiento de salida
    const stockAnterior = lote.item.stock_actual;
    await this.prisma.movimiento.create({
      data: {
        codigo_item: lote.codigo_item,
        codigo_lote: dto.codigo_lote,
        tipo_movimiento: 'DESCARTE_REACTIVO',
        cantidad: lote.cantidad_actual,
        motivo: `Descarte: ${dto.motivo}. ${dto.observacion || ''}. Pruebas no usadas: ${pruebasNoUsadas}`,
        stock_anterior: stockAnterior,
        stock_nuevo: stockAnterior - lote.cantidad_actual,
        realizado_por: usuarioId,
      },
    });

    this.logger.warn(`Lote ${lote.numero_lote} descartado. Motivo: ${dto.motivo}. Pruebas desperdiciadas: ${pruebasNoUsadas}`);

    return {
      success: true,
      lote: loteActualizado,
      pruebas_desperdiciadas: pruebasNoUsadas,
      mensaje: `Lote descartado. ${pruebasNoUsadas} pruebas no utilizadas.`,
    };
  }

  /**
   * Obtiene todos los lotes abiertos con su estado
   */
  async getLotesAbiertos(): Promise<LoteAbierto[]> {
    const lotes = await this.prisma.lote.findMany({
      where: {
        estado_lote: 'ABIERTO',
      },
      include: {
        item: true,
      },
      orderBy: {
        fecha_vencimiento_abierto: 'asc',
      },
    });

    const ahora = new Date();

    return lotes.map(lote => {
      const fechaVenc = lote.fecha_vencimiento_abierto || lote.fecha_vencimiento;
      const diasRestantes = fechaVenc
        ? Math.ceil((fechaVenc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const horasRestantes = fechaVenc
        ? Math.ceil((fechaVenc.getTime() - ahora.getTime()) / (1000 * 60 * 60))
        : 999;

      const capacidad = lote.item.capacidad_pruebas || 0;
      const pruebasRestantes = capacidad - lote.pruebas_realizadas;
      const porcentajeUso = capacidad > 0 ? Math.round((lote.pruebas_realizadas / capacidad) * 100) : 0;

      return {
        codigo_lote: lote.codigo_lote,
        numero_lote: lote.numero_lote,
        item_nombre: lote.item.nombre,
        codigo_item: lote.codigo_item,
        fecha_apertura: lote.fecha_apertura!,
        fecha_vencimiento_abierto: fechaVenc!,
        dias_restantes: diasRestantes,
        horas_restantes: horasRestantes,
        pruebas_realizadas: lote.pruebas_realizadas,
        capacidad_pruebas: capacidad,
        pruebas_restantes: pruebasRestantes,
        porcentaje_uso: porcentajeUso,
        estado: diasRestantes <= 0 ? 'VENCIDO' : diasRestantes <= 1 ? 'CRITICO' : 'ACTIVO',
      };
    });
  }

  /**
   * Obtiene lotes proximos a vencer por apertura
   */
  async getLotesProximosVencerApertura(horas: number = 24): Promise<any[]> {
    const ahora = new Date();
    const limite = new Date(ahora.getTime() + horas * 60 * 60 * 1000);

    const lotes = await this.prisma.lote.findMany({
      where: {
        estado_lote: 'ABIERTO',
        fecha_vencimiento_abierto: {
          lte: limite,
          gte: ahora,
        },
      },
      include: {
        item: true,
      },
      orderBy: {
        fecha_vencimiento_abierto: 'asc',
      },
    });

    return lotes.map(lote => ({
      ...lote,
      horas_restantes: Math.ceil(
        (lote.fecha_vencimiento_abierto!.getTime() - ahora.getTime()) / (1000 * 60 * 60)
      ),
      pruebas_sin_usar: (lote.item.capacidad_pruebas || 0) - lote.pruebas_realizadas,
    }));
  }

  /**
   * Verifica y notifica lotes abiertos proximos a vencer
   */
  async verificarYNotificarVencimientos(): Promise<void> {
    const lotesProximos = await this.getLotesProximosVencerApertura(24);

    if (lotesProximos.length === 0) {
      this.logger.log('No hay lotes abiertos proximos a vencer');
      return;
    }

    let mensaje = '*ALERTA: REACTIVOS ABIERTOS POR VENCER*\n';
    mensaje += '------------------------\n';
    mensaje += `Fecha: ${new Date().toLocaleDateString('es-EC')}\n\n`;

    for (const lote of lotesProximos.slice(0, 10)) {
      mensaje += `[${lote.horas_restantes}h] *${lote.item.nombre}*\n`;
      mensaje += `   Lote: ${lote.numero_lote}\n`;
      mensaje += `   Pruebas sin usar: ${lote.pruebas_sin_usar}\n\n`;
    }

    mensaje += '------------------------\n';
    mensaje += 'Use estos reactivos antes de que venzan';

    await this.whatsAppService.sendMessage({
      to: '',
      message: mensaje,
      tipo: 'ALERTA_VENCIMIENTO',
    });

    this.logger.warn(`Notificacion enviada: ${lotesProximos.length} lotes por vencer`);
  }
}
