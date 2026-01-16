const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  logout() {
    this.clearToken();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Error en la petición');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { email: string; password: string; nombre: string; apellido: string; telefono?: string }) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string) {
    return this.request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<any>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Usuarios
  async getPerfil() {
    return this.request<any>('/usuarios/perfil');
  }

  async updatePerfil(data: any) {
    return this.request<any>('/usuarios/perfil', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Canchas
  async getCanchas(tipo?: string, includeInactive = false) {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (includeInactive) params.append('includeInactive', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/canchas${query}`);
  }

  async getCancha(id: string) {
    return this.request<any>(`/canchas/${id}`);
  }

  async getDisponibilidad(canchaId: string, fecha: string) {
    return this.request<any>(`/canchas/${canchaId}/disponibilidad?fecha=${fecha}`);
  }

  // Admin - Canchas
  async createCancha(data: { nombre: string; tipo: string; descripcion: string; precioPorHora: number }) {
    return this.request<any>('/canchas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCancha(id: string, data: Partial<{ nombre: string; tipo: string; descripcion: string; precioPorHora: number; activa: boolean }>) {
    return this.request<any>(`/canchas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCancha(id: string) {
    return this.request<any>(`/canchas/${id}`, {
      method: 'DELETE',
    });
  }

  async getHorarios(canchaId: string) {
    return this.request<any[]>(`/canchas/${canchaId}/horarios`);
  }

  async updateHorarios(canchaId: string, horarios: any[]) {
    return this.request<any>(`/canchas/${canchaId}/horarios`, {
      method: 'PATCH',
      body: JSON.stringify(horarios),
    });
  }

  // Reservas
  async crearReserva(data: { canchaId: string; fecha: string; horaInicio: string; horaFin: string; notas?: string }) {
    return this.request<any>('/reservas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMisReservas() {
    return this.request<any[]>('/reservas/mis-reservas');
  }

  async getReserva(id: string) {
    return this.request<any>(`/reservas/${id}`);
  }

  async cancelarReserva(id: string) {
    return this.request<any>(`/reservas/${id}/cancelar`, {
      method: 'PATCH',
    });
  }

  // Pagos
  async procesarPago(data: { reservaId: string; metodo: string }) {
    return this.request<any>('/pagos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMisPagos() {
    return this.request<any[]>('/pagos/mis-pagos');
  }

  // Admin - Dashboard
  async getDashboardStats() {
    return this.request<any>('/reservas/admin/dashboard');
  }

  // Admin - Reservas
  async getAllReservas(estado?: string, fecha?: string) {
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (fecha) params.append('fecha', fecha);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/reservas/admin/all${query}`);
  }

  async confirmarReserva(id: string) {
    return this.request<any>(`/reservas/admin/${id}/confirmar`, {
      method: 'PATCH',
    });
  }

  async cancelarReservaAdmin(id: string) {
    return this.request<any>(`/reservas/admin/${id}/cancelar`, {
      method: 'PATCH',
    });
  }

  // Admin - Usuarios
  async getAllUsuarios(rol?: string) {
    const params = new URLSearchParams();
    if (rol) params.append('rol', rol);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/usuarios/admin/all${query}`);
  }

  async toggleUsuarioActivo(id: string) {
    return this.request<any>(`/usuarios/admin/${id}/toggle-activo`, {
      method: 'PATCH',
    });
  }

  // Admin - Pagos
  async getAllPagos(estado?: string) {
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/pagos/admin/all${query}`);
  }

  async aprobarPago(id: string) {
    return this.request<any>(`/pagos/admin/${id}/aprobar`, {
      method: 'PATCH',
    });
  }

  async rechazarPago(id: string, motivo?: string) {
    return this.request<any>(`/pagos/admin/${id}/rechazar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo }),
    });
  }
}

export const api = new ApiClient();
