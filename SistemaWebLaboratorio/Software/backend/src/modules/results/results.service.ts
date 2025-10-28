import { Injectable } from '@nestjs/common';
import { query } from '../../infra/db';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ResultsService {
  constructor(private readonly audit: AuditService) {}

  async listMine(cedula: string, estado?: string) {
    const { rows } = await query(
      `select codigo_resultado, codigo_prueba, id_muestra, estado, fecha_resultado, pdf_url
         from resultados.resultado_lab
        where cedula = $1 and ($2::text is null or estado = $2)
        order by coalesce(fecha_resultado, now()) desc
        limit 200`,
      [cedula, estado ?? null],
    );
    return { items: rows };
  }

  async signPdfUrl(cedula: string, codigo_resultado: number, ip?: string, user_agent?: string) {
    const { rows } = await query<{ cedula: string; pdf_url: string | null }>(
      `select cedula, pdf_url from resultados.resultado_lab where codigo_resultado = $1`,
      [codigo_resultado],
    );
    const r = rows[0];
    if (!r || r.cedula !== cedula) {
      // no filtrar información
      throw new Error('no autorizado');
    }
    // TODO: integrar firma URL S3 real
    const signed = r.pdf_url ? `${r.pdf_url}?signed=1&exp=${Date.now() + 5 * 60 * 1000}` : null;
    await this.audit.log({
      cedula,
      modulo: 'RESULTADOS',
      accion: 'DESCARGAR_PDF',
      referencia_clave: String(codigo_resultado),
      metadata: { ip, user_agent },
    });
    return { url: signed };
  }
}

