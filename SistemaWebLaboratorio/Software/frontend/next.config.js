/** @type {import('next').NextConfig} */
const WebpackObfuscator = require('webpack-obfuscator')

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },

  // Configuración de webpack personalizada
  webpack: (config, { dev, isServer }) => {
    // Solo ofuscar en producción y solo en el cliente
    if (!dev && !isServer) {
      config.plugins.push(
        new WebpackObfuscator(
          {
            // Configuración de ofuscación (SA-15(10))
            // Basado en NIST SP 800-53 Rev 5
            rotateStringArray: true,
            stringArray: true,
            stringArrayThreshold: 0.75,
            stringArrayEncoding: ['base64'],
            identifierNamesGenerator: 'hexadecimal',
            renameGlobals: false, // No renombrar globales para evitar romper dependencias
            selfDefending: true, // Auto-defensa contra beautification
            compact: true, // Código compacto sin espacios
            controlFlowFlattening: true, // Dificultar análisis de flujo
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true, // Inyectar código muerto
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false, // Desactivar para evitar bloqueos
            disableConsoleOutput: true, // Deshabilitar console.* en producción
            transformObjectKeys: true, // Transformar claves de objetos
            unicodeEscapeSequence: false, // No usar unicode para mejor rendimiento
          },
          [
            // Excluir archivos que no deben ofuscarse
            'node_modules/**',
          ]
        )
      )
    }

    return config
  },

  // Optimizaciones adicionales para producción
  compiler: {
    // Remover console.* en producción (excepto console.error)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'],
    } : false,
  },

  // Comprimir respuestas
  compress: true,

  // Desactivar x-powered-by header por seguridad
  poweredByHeader: false,

  // Política de seguridad estricta
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
