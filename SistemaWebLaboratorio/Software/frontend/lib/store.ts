import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { encryptedStorage } from './security/encryption'

interface User {
  codigo_usuario: number
  cedula: string
  nombres: string
  apellidos: string
  email: string
  rol: string
  nivel_acceso: number
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  updateAccessToken: (accessToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      // SC-28: Uso de storage cifrado para proteger datos en reposo
      storage: createJSONStorage(() => encryptedStorage),
    }
  )
)
