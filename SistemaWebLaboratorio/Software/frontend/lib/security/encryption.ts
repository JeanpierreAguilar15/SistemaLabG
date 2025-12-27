/**
 * Utilidades de cifrado para protección de datos en localStorage
 * Implementa SC-28 (Protection of Information at Rest)
 * Basado en ISO/IEC 27002:2022 - Control 8.24
 */

import CryptoJS from 'crypto-js'

// Clave de cifrado - En producción, considerar usar una clave derivada del usuario
// o almacenada en variables de entorno
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'LAB-FRANZ-2025-SECURE-KEY-v1'

/**
 * Cifra un objeto usando AES-256
 * @param data - Datos a cifrar
 * @returns String cifrado en Base64
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data)
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('Error cifrando datos:', error)
    return ''
  }
}

/**
 * Descifra un string cifrado con AES-256
 * @param encryptedData - String cifrado en Base64
 * @returns Objeto descifrado
 */
export function decryptData<T = any>(encryptedData: string): T | null {
  try {
    if (!encryptedData) return null

    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8)

    if (!jsonString) return null

    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('Error descifrando datos:', error)
    return null
  }
}

/**
 * Storage personalizado con cifrado automático para Zustand
 */
export const encryptedStorage = {
  getItem: (name: string): string | null => {
    try {
      const encryptedValue = localStorage.getItem(name)
      if (!encryptedValue) return null

      const decrypted = decryptData(encryptedValue)
      if (!decrypted) return null

      // Zustand espera un string JSON
      return JSON.stringify(decrypted)
    } catch (error) {
      console.error('Error obteniendo item cifrado:', error)
      return null
    }
  },

  setItem: (name: string, value: string): void => {
    try {
      // value viene como string JSON de Zustand
      const parsedValue = JSON.parse(value)
      const encrypted = encryptData(parsedValue)
      localStorage.setItem(name, encrypted)
    } catch (error) {
      console.error('Error guardando item cifrado:', error)
    }
  },

  removeItem: (name: string): void => {
    localStorage.removeItem(name)
  },
}

/**
 * Valida la integridad de los datos cifrados
 * @param encryptedData - Datos cifrados a validar
 * @returns true si los datos son válidos
 */
export function validateEncryptedData(encryptedData: string): boolean {
  try {
    const decrypted = decryptData(encryptedData)
    return decrypted !== null
  } catch {
    return false
  }
}
