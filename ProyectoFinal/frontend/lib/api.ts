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
  async getCanchas(tipo?: string) {
    const query = tipo ? `?tipo=${tipo}` : '';
    return this.request<any[]>(`/canchas${query}`);
  }

  async getCancha(id: string) {
    return this.request<any>(`/canchas/${id}`);
  }

  async getDisponibilidad(canchaId: string, fecha: string) {
    return this.request<any>(`/canchas/${canchaId}/disponibilidad?fecha=${fecha}`);
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
}

export const api = new ApiClient();
