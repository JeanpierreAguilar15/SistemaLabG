'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Blue Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900"></div>

        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 border-2 border-white rounded-full"></div>
          <div className="absolute top-60 right-40 w-24 h-24 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-40 left-40 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-white rounded-full"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center pt-20">
          <div className="inline-flex items-center space-x-2 bg-blue-500/30 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm mb-8 border border-blue-400/30">
            <span className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></span>
            <span>Reservas disponibles 24/7</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Tu Cancha Perfecta
            <br />
            <span className="text-blue-200">
              Te Espera
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Futbol, Tenis o Basquet. Reserva en linea, paga seguro y juega cuando quieras.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/canchas"
              className="group inline-flex items-center justify-center space-x-2 bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              <span>Ver Canchas</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center space-x-2 bg-blue-500/30 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-500/40 transition-all duration-300 border border-blue-400/40"
            >
              <span>Crear Cuenta Gratis</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center bg-blue-500/20 rounded-2xl p-6 border border-blue-400/20">
              <p className="text-4xl font-bold text-white">5+</p>
              <p className="text-blue-200 text-sm">Canchas</p>
            </div>
            <div className="text-center bg-blue-500/20 rounded-2xl p-6 border border-blue-400/20">
              <p className="text-4xl font-bold text-white">500+</p>
              <p className="text-blue-200 text-sm">Reservas</p>
            </div>
            <div className="text-center bg-blue-500/20 rounded-2xl p-6 border border-blue-400/20">
              <p className="text-4xl font-bold text-white">4.9</p>
              <p className="text-blue-200 text-sm">Rating</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
              Por que elegirnos
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              La Mejor Experiencia Deportiva
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas para disfrutar del deporte que amas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Reserva 24/7</h3>
              <p className="text-gray-600">Reserva en cualquier momento desde tu computadora o celular. Sin llamadas, sin esperas.</p>
            </div>

            <div className="group card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pago Seguro</h3>
              <p className="text-gray-600">Multiples metodos de pago con total seguridad. Efectivo, tarjeta o transferencia.</p>
            </div>

            <div className="group card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Notificaciones</h3>
              <p className="text-gray-600">Recibe confirmacion y recordatorios por email automaticamente.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Canchas Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-green-100 text-green-600 rounded-full text-sm font-semibold mb-4">
              Nuestras Instalaciones
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Canchas de Primera Calidad
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Instalaciones profesionales para que disfrutes al maximo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Futbol Card */}
            <div className="group card-hover overflow-hidden">
              <div className="relative h-56 sport-gradient-futbol rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 pattern-dots opacity-30"></div>
                <div className="relative sport-icon bg-white/20 backdrop-blur-sm">
                  <span className="text-5xl">⚽</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Futbol</h3>
              <p className="text-gray-600 mb-4">Canchas de cesped sintetico de alta calidad con iluminacion LED.</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-green-600">Desde $10/hora</p>
                <Link href="/canchas" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 group">
                  <span>Ver mas</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Tenis Card */}
            <div className="group card-hover overflow-hidden">
              <div className="relative h-56 sport-gradient-tenis rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 pattern-dots opacity-30"></div>
                <div className="relative sport-icon bg-white/20 backdrop-blur-sm">
                  <span className="text-5xl">🎾</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Tenis</h3>
              <p className="text-gray-600 mb-4">Canchas de arcilla y dura profesionales con equipamiento incluido.</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-yellow-600">Desde $7/hora</p>
                <Link href="/canchas" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 group">
                  <span>Ver mas</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Basquet Card */}
            <div className="group card-hover overflow-hidden">
              <div className="relative h-56 sport-gradient-basquet rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 pattern-dots opacity-30"></div>
                <div className="relative sport-icon bg-white/20 backdrop-blur-sm">
                  <span className="text-5xl">🏀</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Basquet</h3>
              <p className="text-gray-600 mb-4">Cancha techada con tableros profesionales y piso de madera.</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-orange-600">Desde $9/hora</p>
                <Link href="/canchas" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1 group">
                  <span>Ver mas</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/canchas"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>Ver Todas las Canchas</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900"></div>
        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-32 h-32 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-20 w-24 h-24 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 border-2 border-white rounded-full"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Listo para Jugar?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Unete a nuestra comunidad y disfruta de las mejores canchas deportivas de la ciudad.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center space-x-2 bg-white text-blue-700 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:shadow-2xl hover:scale-105"
          >
            <span>Comenzar Ahora - Es Gratis</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">SportCenter</span>
              </div>
              <p className="text-gray-400">Tu destino deportivo favorito para reservar canchas de calidad.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Enlaces Rapidos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/canchas" className="hover:text-white transition-colors">Canchas</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Iniciar Sesion</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Deportes</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/canchas" className="hover:text-white transition-colors">Futbol</Link></li>
                <li><Link href="/canchas" className="hover:text-white transition-colors">Tenis</Link></li>
                <li><Link href="/canchas" className="hover:text-white transition-colors">Basquet</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>info@sportcenter.com</li>
                <li>+1 234 567 890</li>
                <li>Av. Principal #123</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SportCenter. Todos los derechos reservados.</p>
            <p className="text-sm mt-2">Proyecto Final - Sistema de Reservas de Canchas</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
