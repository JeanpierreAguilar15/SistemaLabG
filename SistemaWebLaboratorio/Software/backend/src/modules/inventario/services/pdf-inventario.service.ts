import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class PdfInventarioService {
  private readonly logger = new Logger(PdfInventarioService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Genera PDF de una Orden de Compra
   */
  async generateOrdenCompraPdf(codigoOrden: number, res: Response): Promise<void> {
    const orden = await this.prisma.ordenCompra.findUnique({
      where: { codigo_orden_compra: codigoOrden },
      include: {
        proveedor: true,
        creador: {
          select: { nombres: true, apellidos: true },
        },
        detalles: {
          include: {
            item: {
              include: { categoria: true },
            },
          },
        },
      },
    });

    if (!orden) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    // Crear documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Orden de Compra ${orden.numero_orden}`,
        Author: 'Sistema Laboratorio Franz',
      },
    });

    // Configurar headers de respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=OC-${orden.numero_orden}.pdf`,
    );

    // Pipe al response
    doc.pipe(res);

    // === ENCABEZADO ===
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('LABORATORIO CLÍNICO FRANZ', { align: 'center' });

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('ORDEN DE COMPRA', { align: 'center' });

    doc.moveDown();

    // Información de la orden
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`N° Orden: ${orden.numero_orden}`, { continued: true })
      .font('Helvetica')
      .text(`    Estado: ${this.getEstadoLabel(orden.estado)}`, { align: 'right' });

    doc
      .font('Helvetica')
      .text(`Fecha: ${this.formatDate(orden.fecha_orden)}`, { continued: true });

    if (orden.fecha_entrega_estimada) {
      doc.text(`    Entrega estimada: ${this.formatDate(orden.fecha_entrega_estimada)}`, { align: 'right' });
    } else {
      doc.text('');
    }

    doc.moveDown();

    // === DATOS DEL PROVEEDOR ===
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DATOS DEL PROVEEDOR');

    doc.rect(50, doc.y, 495, 60).stroke();

    const provY = doc.y + 10;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('RUC:', 60, provY, { continued: true })
      .font('Helvetica')
      .text(` ${orden.proveedor.ruc}`);

    doc
      .font('Helvetica-Bold')
      .text('Razón Social:', 60, { continued: true })
      .font('Helvetica')
      .text(` ${orden.proveedor.razon_social}`);

    if (orden.proveedor.telefono) {
      doc
        .font('Helvetica-Bold')
        .text('Teléfono:', 60, { continued: true })
        .font('Helvetica')
        .text(` ${orden.proveedor.telefono}`, { continued: true });
    }

    if (orden.proveedor.email) {
      doc
        .font('Helvetica-Bold')
        .text('    Email:', { continued: true })
        .font('Helvetica')
        .text(` ${orden.proveedor.email}`);
    } else {
      doc.text('');
    }

    doc.y = provY + 65;
    doc.moveDown();

    // === DETALLE DE ÍTEMS ===
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('DETALLE DE ÍTEMS');

    // Headers de tabla
    const tableTop = doc.y + 5;
    const tableHeaders = ['#', 'Código', 'Descripción', 'Cantidad', 'P. Unit.', 'Total'];
    const colWidths = [30, 60, 195, 60, 70, 80];
    let xPos = 50;

    // Dibujar headers
    doc.rect(50, tableTop, 495, 20).fill('#f0f0f0');
    doc.fillColor('#000000');

    doc.fontSize(9).font('Helvetica-Bold');
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos + 5, tableTop + 5, {
        width: colWidths[i] - 10,
        align: i >= 3 ? 'right' : 'left',
      });
      xPos += colWidths[i];
    });

    // Filas de datos
    let rowY = tableTop + 20;
    doc.font('Helvetica').fontSize(9);

    orden.detalles.forEach((detalle, index) => {
      xPos = 50;
      const rowHeight = 20;

      // Alternar color de fondo
      if (index % 2 === 1) {
        doc.rect(50, rowY, 495, rowHeight).fill('#fafafa');
        doc.fillColor('#000000');
      }

      // Contenido de la fila
      const rowData = [
        (index + 1).toString(),
        detalle.item.codigo_interno,
        detalle.item.nombre,
        detalle.cantidad.toString(),
        `$${Number(detalle.precio_unitario).toFixed(2)}`,
        `$${Number(detalle.total_linea).toFixed(2)}`,
      ];

      rowData.forEach((cell, i) => {
        doc.text(cell, xPos + 5, rowY + 5, {
          width: colWidths[i] - 10,
          align: i >= 3 ? 'right' : 'left',
        });
        xPos += colWidths[i];
      });

      rowY += rowHeight;
    });

    // Borde de la tabla
    doc.rect(50, tableTop, 495, rowY - tableTop).stroke();

    // Líneas verticales
    xPos = 50;
    colWidths.forEach((width) => {
      doc.moveTo(xPos, tableTop).lineTo(xPos, rowY).stroke();
      xPos += width;
    });
    doc.moveTo(545, tableTop).lineTo(545, rowY).stroke();

    // Línea horizontal del header
    doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).stroke();

    doc.y = rowY + 20;

    // === TOTALES ===
    const totalsX = 380;
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Subtotal:', totalsX, doc.y, { continued: true, width: 80, align: 'right' })
      .text(`$${Number(orden.subtotal).toFixed(2)}`, { align: 'right' });

    doc
      .text('IVA (12%):', totalsX, doc.y, { continued: true, width: 80, align: 'right' })
      .text(`$${Number(orden.iva).toFixed(2)}`, { align: 'right' });

    doc
      .font('Helvetica-Bold')
      .text('TOTAL:', totalsX, doc.y, { continued: true, width: 80, align: 'right' })
      .text(`$${Number(orden.total).toFixed(2)}`, { align: 'right' });

    doc.moveDown(2);

    // === OBSERVACIONES ===
    if (orden.observaciones) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('OBSERVACIONES:');

      doc
        .font('Helvetica')
        .text(orden.observaciones, { width: 495 });
    }

    // === PIE DE PÁGINA ===
    doc.moveDown(3);
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        `Documento generado el ${this.formatDateTime(new Date())} por Sistema Laboratorio Franz`,
        { align: 'center' },
      );

    if (orden.creador) {
      doc.text(
        `Creado por: ${orden.creador.nombres} ${orden.creador.apellidos}`,
        { align: 'center' },
      );
    }

    // Finalizar documento
    doc.end();
  }

  /**
   * Genera PDF del reporte Kardex
   */
  async generateKardexPdf(
    data: any,
    res: Response,
    titulo: string = 'Reporte Kardex de Inventario',
  ): Promise<void> {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      info: {
        Title: titulo,
        Author: 'Sistema Laboratorio Franz',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=kardex-${Date.now()}.pdf`,
    );

    doc.pipe(res);

    // === ENCABEZADO ===
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('LABORATORIO CLÍNICO FRANZ', { align: 'center' });

    doc
      .fontSize(14)
      .text(titulo.toUpperCase(), { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Período: ${data.periodo.desde} al ${data.periodo.hasta}`, { align: 'center' });

    doc.moveDown();

    // === RESUMEN ===
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('RESUMEN GENERAL');

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total ítems: ${data.resumen.total_items}`, { continued: true })
      .text(`    Total entradas: ${data.resumen.total_entradas}`, { continued: true })
      .text(`    Total salidas: ${data.resumen.total_salidas}`, { continued: true })
      .text(`    Valor inventario: $${data.resumen.valor_total_inventario.toFixed(2)}`);

    doc.moveDown();

    // === TABLA DE ÍTEMS ===
    const tableTop = doc.y;
    const headers = [
      'Código',
      'Nombre',
      'Categoría',
      'U.M.',
      'Saldo Ini.',
      'Entradas',
      'Salidas',
      'Saldo Fin.',
      'Costo U.',
      'Valor Inv.',
    ];
    const colWidths = [55, 130, 80, 40, 55, 55, 55, 55, 55, 65];
    let xPos = 40;

    // Header
    doc.rect(40, tableTop, 712, 18).fill('#e0e0e0');
    doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold');

    headers.forEach((header, i) => {
      doc.text(header, xPos + 2, tableTop + 4, {
        width: colWidths[i] - 4,
        align: i >= 4 ? 'right' : 'left',
      });
      xPos += colWidths[i];
    });

    // Filas
    let rowY = tableTop + 18;
    doc.font('Helvetica').fontSize(8);

    const maxItemsPerPage = 25;
    let itemCount = 0;

    for (const item of data.items) {
      if (itemCount > 0 && itemCount % maxItemsPerPage === 0) {
        doc.addPage();
        rowY = 40;
      }

      xPos = 40;
      if (itemCount % 2 === 1) {
        doc.rect(40, rowY, 712, 16).fill('#f8f8f8');
        doc.fillColor('#000000');
      }

      const rowData = [
        item.codigo_interno,
        item.nombre.substring(0, 30),
        item.categoria.substring(0, 18),
        item.unidad_medida,
        item.saldo_inicial.toString(),
        item.total_entradas.toString(),
        item.total_salidas.toString(),
        item.saldo_final.toString(),
        `$${item.costo_unitario.toFixed(2)}`,
        `$${item.valor_inventario.toFixed(2)}`,
      ];

      rowData.forEach((cell, i) => {
        doc.text(cell, xPos + 2, rowY + 3, {
          width: colWidths[i] - 4,
          align: i >= 4 ? 'right' : 'left',
        });
        xPos += colWidths[i];
      });

      rowY += 16;
      itemCount++;
    }

    // Pie de página
    doc
      .fontSize(7)
      .fillColor('#666666')
      .text(
        `Generado: ${this.formatDateTime(new Date())} | Sistema Laboratorio Franz`,
        40,
        doc.page.height - 30,
      );

    doc.end();
  }

  /**
   * Genera PDF del reporte de compras por proveedor
   */
  async generateComprasProveedorPdf(data: any, res: Response): Promise<void> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Reporte de Compras por Proveedor',
        Author: 'Sistema Laboratorio Franz',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=compras-proveedor-${Date.now()}.pdf`,
    );

    doc.pipe(res);

    // Encabezado
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('LABORATORIO CLÍNICO FRANZ', { align: 'center' });

    doc
      .fontSize(14)
      .text('REPORTE DE COMPRAS POR PROVEEDOR', { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Período: ${data.periodo.desde} al ${data.periodo.hasta}`, { align: 'center' });

    doc.moveDown();

    // Resumen
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('RESUMEN');

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total proveedores: ${data.resumen.total_proveedores}`)
      .text(`Total órdenes: ${data.resumen.total_ordenes}`)
      .text(`Monto total: $${data.resumen.monto_total.toFixed(2)}`);

    doc.moveDown();

    // Detalle por proveedor
    for (const prov of data.proveedores) {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text(`${prov.razon_social} (RUC: ${prov.ruc})`);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`Órdenes: ${prov.total_ordenes} | Recibidas: ${prov.ordenes_recibidas} | Pendientes: ${prov.ordenes_pendientes}`)
        .text(`Monto total: $${prov.monto_total.toFixed(2)}`);

      // Items comprados
      if (prov.items_comprados.length > 0) {
        doc.fontSize(8).text('  Ítems comprados:');
        prov.items_comprados.slice(0, 5).forEach((item: any) => {
          doc.text(`    - ${item.nombre}: ${item.cantidad_total} unid. ($${item.monto_total.toFixed(2)})`);
        });
        if (prov.items_comprados.length > 5) {
          doc.text(`    ... y ${prov.items_comprados.length - 5} más`);
        }
      }

      doc.moveDown(0.5);
    }

    // Pie
    doc
      .fontSize(7)
      .fillColor('#666666')
      .text(
        `Generado: ${this.formatDateTime(new Date())} | Sistema Laboratorio Franz`,
        50,
        doc.page.height - 30,
      );

    doc.end();
  }

  /**
   * Genera PDF del reporte de consumo por servicio
   */
  async generateConsumoPdf(data: any, res: Response): Promise<void> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Reporte de Consumo por Servicio',
        Author: 'Sistema Laboratorio Franz',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=consumo-servicio-${Date.now()}.pdf`,
    );

    doc.pipe(res);

    // Encabezado
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('LABORATORIO CLÍNICO FRANZ', { align: 'center' });

    doc
      .fontSize(14)
      .text('REPORTE DE CONSUMO POR SERVICIO/EXAMEN', { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Período: ${data.periodo.desde} al ${data.periodo.hasta}`, { align: 'center' });

    doc.moveDown();

    // Resumen
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('RESUMEN');

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Total exámenes realizados: ${data.resumen.total_examenes_realizados}`)
      .text(`Total ítems consumidos: ${data.resumen.total_items_consumidos}`)
      .text(`Cantidad total consumida: ${data.resumen.cantidad_total_consumida}`)
      .text(`Costo total: $${data.resumen.costo_total.toFixed(2)}`);

    doc.moveDown();

    // Tabla de consumo
    const tableTop = doc.y;
    const headers = ['Código', 'Ítem', 'Categoría', 'Cantidad', 'Costo U.', 'Total'];
    const colWidths = [60, 160, 90, 60, 60, 65];
    let xPos = 50;

    // Header
    doc.rect(50, tableTop, 495, 18).fill('#e0e0e0');
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');

    headers.forEach((header, i) => {
      doc.text(header, xPos + 3, tableTop + 4, {
        width: colWidths[i] - 6,
        align: i >= 3 ? 'right' : 'left',
      });
      xPos += colWidths[i];
    });

    // Filas
    let rowY = tableTop + 18;
    doc.font('Helvetica').fontSize(8);

    data.items.forEach((item: any, index: number) => {
      if (rowY > doc.page.height - 80) {
        doc.addPage();
        rowY = 50;
      }

      xPos = 50;
      if (index % 2 === 1) {
        doc.rect(50, rowY, 495, 16).fill('#f8f8f8');
        doc.fillColor('#000000');
      }

      const rowData = [
        item.codigo_interno,
        item.nombre.substring(0, 35),
        item.categoria.substring(0, 18),
        item.cantidad_consumida.toFixed(2),
        `$${item.costo_unitario.toFixed(2)}`,
        `$${item.costo_total.toFixed(2)}`,
      ];

      rowData.forEach((cell, i) => {
        doc.text(cell, xPos + 3, rowY + 3, {
          width: colWidths[i] - 6,
          align: i >= 3 ? 'right' : 'left',
        });
        xPos += colWidths[i];
      });

      rowY += 16;
    });

    // Pie
    doc
      .fontSize(7)
      .fillColor('#666666')
      .text(
        `Generado: ${this.formatDateTime(new Date())} | Sistema Laboratorio Franz`,
        50,
        doc.page.height - 30,
      );

    doc.end();
  }

  // === UTILIDADES ===

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getEstadoLabel(estado: string): string {
    const estados: Record<string, string> = {
      BORRADOR: 'Borrador',
      EMITIDA: 'Emitida',
      RECIBIDA: 'Recibida',
      CANCELADA: 'Cancelada',
    };
    return estados[estado] || estado;
  }
}
