import { Injectable } from '@nestjs/common';
import { query } from '../../infra/db';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  constructor(private readonly audit: AuditService) {}

  async metrics(){
    const users = await query<{ c:number }>(`select count(*)::int as c from usuario.usuarios`);
    const resultsPending = await query<{ c:number }>(`select count(*)::int as c from resultados.resultado_lab where estado = 'EN_PROCESO'`);
    const paymentsPending = await query<{ c:number }>(`select count(*)::int as c from facturacion.factura where estado = 'PENDIENTE'`);
    const today = new Date(); const d0 = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const d1 = new Date(d0.getTime() + 24*60*60*1000);
    const appointmentsToday = await query<{ c:number }>(
      `select count(*)::int as c
         from agenda.cita c
         join agenda.slot_disponible s on s.slot_id = c.slot_id
        where s.inicio >= $1 and s.inicio < $2`,
      [d0.toISOString(), d1.toISOString()],
    );
    return {
      users: users.rows[0]?.c ?? 0,
      results_pending: resultsPending.rows[0]?.c ?? 0,
      payments_pending: paymentsPending.rows[0]?.c ?? 0,
      appointments_today: appointmentsToday.rows[0]?.c ?? 0,
    };
  }

  // Gestión de sesiones
  async getUserSessions(cedula: string) {
    const { rows } = await query(
      `select token_id, expira_en, revocado_en, ip_origen, user_agent, created_at
         from usuario.sesiones
        where cedula = $1 and revocado_en is null
        order by created_at desc`,
      [cedula]
    );
    return { sessions: rows };
  }

  async revokeSession(adminCedula: string, tokenId: number) {
    await query(
      `update usuario.sesiones set revocado_en = now() where token_id = $1 and revocado_en is null`,
      [tokenId]
    );
    
    await this.audit.log({
      cedula: adminCedula,
      modulo: 'SEGURIDAD',
      accion: 'REVOCAR_SESION',
      referencia_clave: tokenId.toString(),
      descripcion: 'Sesión de usuario revocada',
    });
    
    return { success: true };
  }

  async revokeAllUserSessions(adminCedula: string, targetCedula: string) {
    await query(
      `update usuario.sesiones set revocado_en = now() where cedula = $1 and revocado_en is null`,
      [targetCedula]
    );
    
    await this.audit.log({
      cedula: adminCedula,
      modulo: 'SEGURIDAD',
      accion: 'REVOCAR_TODAS_SESIONES',
      referencia_clave: targetCedula,
      descripcion: 'Todas las sesiones del usuario revocadas',
    });
    
    return { success: true };
  }

  // Configuración de facturación
  async getBillingConfig() {
    const { rows } = await query(
      `select key, value from facturacion.configuracion where key in ('iva_percentage', 'default_tax_rate')`
    );
    
    const config = {
      iva_percentage: 12,
      default_tax_rate: 0
    };
    
    rows.forEach(row => {
      if (row.key === 'iva_percentage') config.iva_percentage = parseFloat(row.value);
      if (row.key === 'default_tax_rate') config.default_tax_rate = parseFloat(row.value);
    });
    
    return config;
  }

  async updateBillingConfig(adminCedula: string, config: { iva_percentage: number; default_tax_rate: number }) {
    await query(
      `insert into facturacion.configuracion (key, value) values 
       ('iva_percentage', $1), ('default_tax_rate', $2)
       on conflict (key) do update set value = excluded.value`,
      [config.iva_percentage.toString(), config.default_tax_rate.toString()]
    );
    
    await this.audit.log({
      cedula: adminCedula,
      modulo: 'FACTURACION',
      accion: 'ACTUALIZAR_CONFIG',
      descripcion: `IVA: ${config.iva_percentage}%, Tasa: ${config.default_tax_rate}%`,
    });
    
    return { success: true };
  }

  // Estadísticas adicionales
  async getUserStats() {
    const totalUsers = await query<{ c: number }>(`select count(*)::int as c from usuario.usuarios`);
    const activeUsers = await query<{ c: number }>(`select count(distinct cedula)::int as c from usuario.sesiones where created_at > now() - interval '30 days'`);
    const usersByRole = await query<{ rol: string; c: number }>(
      `select r.nombre_rol as rol, count(*)::int as c
         from usuario.roles r
         join usuario.usuario_rol ur on ur.nombre_rol = r.nombre_rol
        group by r.nombre_rol
        order by c desc`
    );
    
    return {
      total_users: totalUsers.rows[0]?.c ?? 0,
      active_users_30d: activeUsers.rows[0]?.c ?? 0,
      users_by_role: usersByRole.rows
    };
  }

  async getAppointmentStats() {
    const totalAppointments = await query<{ c: number }>(`select count(*)::int as c from agenda.cita`);
    const appointmentsByStatus = await query<{ estado: string; c: number }>(
      `select estado, count(*)::int as c from agenda.cita group by estado order by c desc`
    );
    const upcomingAppointments = await query<{ c: number }>(
      `select count(*)::int as c from agenda.cita c
        join agenda.slot_disponible s on s.slot_id = c.slot_id
       where s.inicio > now() and c.estado = 'CONFIRMADA'`
    );
    
    return {
      total_appointments: totalAppointments.rows[0]?.c ?? 0,
      appointments_by_status: appointmentsByStatus.rows,
      upcoming_appointments: upcomingAppointments.rows[0]?.c ?? 0
    };
  }

  async getFinancialStats() {
    const totalQuotes = await query<{ c: number }>(`select count(*)::int as c from facturacion.cotizacion`);
    const totalInvoices = await query<{ c: number }>(`select count(*)::int as c from facturacion.factura`);
    const pendingPayments = await query<{ total: number }>(
      `select coalesce(sum(monto_total), 0) as total from facturacion.factura where estado = 'PENDIENTE'`
    );
    const monthlyRevenue = await query<{ total: number }>(
      `select coalesce(sum(monto_total), 0) as total from facturacion.factura 
       where estado = 'PAGADO' and fecha_emision >= date_trunc('month', now())`
    );
    
    return {
      total_quotes: totalQuotes.rows[0]?.c ?? 0,
      total_invoices: totalInvoices.rows[0]?.c ?? 0,
      pending_payments_total: parseFloat(pendingPayments.rows[0]?.total ?? '0'),
      monthly_revenue: parseFloat(monthlyRevenue.rows[0]?.total ?? '0')
    };
  }
}

