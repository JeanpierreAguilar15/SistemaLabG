const path = require('path');
const dotenv = require('dotenv');

// Carga variables desde el .env de la raíz del monorepo
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Expone variables necesarias al cliente (solo las que comienzan con NEXT_PUBLIC_)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_LOGO_SRC: process.env.NEXT_PUBLIC_LOGO_SRC || '/logo_lab.png',
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME || 'Laboratorio Franz',
  },
};

module.exports = nextConfig;
