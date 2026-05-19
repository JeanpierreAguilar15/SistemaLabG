const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions extends RequestInit {
  token?: string
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
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

  // Password Recovery
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyRecoveryCode: (email: string, codigo: string) =>
    request<{ message: string; valid: boolean }>('/auth/verify-recovery-code', {
      method: 'POST',
      body: JSON.stringify({ email, codigo }),
    }),

  resetPassword: (email: string, codigo: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, codigo, newPassword }),
    }),
}

// Users
export const usersApi = {
  getProfile: (token: string) => request('/users/profile', { token }),
}

// Results (resultados)
export const resultsApi = {
  // Paciente endpoints
  getMyResults: (token: string) => request('/resultados/my', { token }),

  downloadResult: (token: string, codigo_resultado: number) => {
    const url = `${API_URL}/resultados/${codigo_resultado}/descargar`
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      if (!response.ok) {
        throw new ApiError(response.status, 'Error al descargar el resultado')
      }
      return response.blob()
    })
  },

  // Admin endpoints
  getAllResults: (token: string, filters?: {
    codigo_paciente?: number
    codigo_examen?: number
    estado?: string
    fecha_desde?: string
    fecha_hasta?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.codigo_paciente) params.append('codigo_paciente', filters.codigo_paciente.toString())
    if (filters?.codigo_examen) params.append('codigo_examen', filters.codigo_examen.toString())
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
    const query = params.toString() ? `?${params}` : ''
    return request(`/resultados/admin/all${query}`, { token })
  },

  createResult: (token: string, data: {
    codigo_muestra: number
    codigo_examen: number
    valor_numerico?: number
    valor_texto?: string
    unidad_medida?: string
    valor_referencia_min?: number
    valor_referencia_max?: number
    valores_referencia_texto?: string
    observaciones_tecnicas?: string
    nivel?: string
  }) => request('/resultados', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  }),

  updateResult: (token: string, codigo_resultado: number, data: {
    estado?: string
    observaciones_tecnicas?: string
  }) => request(`/resultados/admin/${codigo_resultado}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  }),

  validateResult: (token: string, codigo_resultado: number) =>
    request(`/resultados/${codigo_resultado}/validar`, {
      method: 'PUT',
      token,
    }),

  uploadPdf: async (token: string, codigo_resultado: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/resultados/${codigo_resultado}/upload-pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(response.status, data.message || 'Error al subir el PDF')
    }

    return data
  },

  // Muestras endpoints
  getMuestras: (token: string, filters?: {
    codigo_paciente?: number
    estado?: string
    fecha_desde?: string
    fecha_hasta?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.codigo_paciente) params.append('codigo_paciente', filters.codigo_paciente.toString())
    if (filters?.estado) params.append('estado', filters.estado)
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
    const query = params.toString() ? `?${params}` : ''
    return request(`/resultados/muestras${query}`, { token })
  },

  createMuestra: (token: string, data: {
    codigo_paciente: number
    id_muestra: string
    tipo_muestra?: string
    fecha_toma?: string
    observaciones?: string
  }) => request('/resultados/muestras', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  }),

  getEstadisticas: (token: string, filters?: {
    fecha_desde?: string
    fecha_hasta?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
    if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
    const query = params.toString() ? `?${params}` : ''
    return request(`/resultados/admin/estadisticas${query}`, { token })
  },
}

// Catalog (exámenes)
export const catalogApi = {
  getExams: (token: string, categoria_id?: number) => {
    const params = new URLSearchParams()
    if (categoria_id) params.append('categoria_id', categoria_id.toString())
    const query = params.toString() ? `?${params}` : ''
    return request(`/examenes/catalogo${query}`, { token })
  },

  getCategories: (token: string) => request('/examenes/categorias', { token }),
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, data: any, options?: RequestOptions) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(data), ...options }),
  put: <T>(endpoint: string, data: any, options?: RequestOptions) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data), ...options }),
  delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { method: 'DELETE', ...options }),
};
