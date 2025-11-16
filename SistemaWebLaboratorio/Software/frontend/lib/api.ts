const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3105/api/v1'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions extends RequestInit {
  token?: string
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, data.message || 'Error en la solicitud')
  }

  return data
}

// Auth
export const authApi = {
  register: (data: {
    cedula: string
    nombres: string
    apellidos: string
    email: string
    telefono?: string
    fecha_nacimiento?: string
    genero?: string
    password: string
  }) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (identifier: string, password: string) =>
    request<{
      user: {
        codigo_usuario: number
        cedula: string
        nombres: string
        apellidos: string
        email: string
        rol: string
        nivel_acceso: number
      }
      access_token: string
      refresh_token: string
      expires_in: number
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  refresh: (refresh_token: string) =>
    request<{ access_token: string; refresh_token: string; expires_in: number }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token }),
      }
    ),

  logout: (token: string, refresh_token?: string) =>
    request('/auth/logout', {
      method: 'POST',
      token,
      body: JSON.stringify({ refresh_token }),
    }),

  me: (token: string) =>
    request<{ user: any }>('/auth/me', { token }),
}

// Users
export const usersApi = {
  getProfile: (token: string) => request('/users/profile', { token }),
}

// Appointments (citas)
export const appointmentsApi = {
  getAvailableSlots: (token: string, servicio_id?: number, fecha?: string) => {
    const params = new URLSearchParams()
    if (servicio_id) params.append('servicio_id', servicio_id.toString())
    if (fecha) params.append('fecha', fecha)
    const query = params.toString() ? `?${params}` : ''
    return request(`/appointments/slots${query}`, { token })
  },

  createAppointment: (token: string, data: { codigo_slot: number; observaciones?: string }) =>
    request('/appointments', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  getMyAppointments: (token: string) => request('/appointments/my', { token }),

  cancelAppointment: (token: string, codigo_cita: number, motivo?: string) =>
    request(`/appointments/${codigo_cita}/cancel`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ motivo }),
    }),
}

// Results (resultados)
export const resultsApi = {
  getMyResults: (token: string) => request('/results/my', { token }),

  downloadResult: (token: string, codigo_resultado: number) =>
    request(`/results/${codigo_resultado}/download`, { token }),
}

// Catalog (exámenes)
export const catalogApi = {
  getExams: (categoria_id?: number) => {
    const params = new URLSearchParams()
    if (categoria_id) params.append('categoria_id', categoria_id.toString())
    const query = params.toString() ? `?${params}` : ''
    return request(`/catalog/exams${query}`)
  },

  getCategories: () => request('/catalog/categories'),
}

// Quotations (cotizaciones)
export const quotationsApi = {
  create: (token: string, data: { exams: { codigo_examen: number; cantidad: number }[] }) =>
    request('/quotations', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  getMy: (token: string) => request('/quotations/my', { token }),
}
