import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-primary-600 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Centro Deportivo</h1>
          <nav className="space-x-4">
            <Link href="/auth/login" className="hover:underline">
              Iniciar Sesión
            </Link>
            <Link href="/auth/register" className="btn-secondary text-gray-800">
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Reserva tu Cancha Deportiva
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Fútbol, Tenis o Básquet. Reserva en línea de forma rápida y sencilla.
            Paga en línea y recibe confirmación inmediata.
          </p>
          <Link href="/canchas" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
            Ver Canchas Disponibles
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">¿Por qué elegirnos?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Reserva 24/7</h4>
              <p className="text-gray-600">Reserva en cualquier momento desde tu computadora o celular.</p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Pago Seguro</h4>
              <p className="text-gray-600">Múltiples métodos de pago con total seguridad.</p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Notificaciones</h4>
              <p className="text-gray-600">Recibe confirmación y recordatorios por email.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Canchas Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Nuestras Canchas</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="h-48 bg-green-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-6xl">⚽</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Fútbol</h4>
              <p className="text-gray-600 mb-4">Canchas de césped sintético de alta calidad.</p>
              <p className="text-primary-600 font-bold">Desde Bs. 80/hora</p>
            </div>
            <div className="card">
              <div className="h-48 bg-yellow-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-6xl">🎾</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Tenis</h4>
              <p className="text-gray-600 mb-4">Canchas de arcilla y dura profesionales.</p>
              <p className="text-primary-600 font-bold">Desde Bs. 50/hora</p>
            </div>
            <div className="card">
              <div className="h-48 bg-orange-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-6xl">🏀</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Básquet</h4>
              <p className="text-gray-600 mb-4">Cancha techada con tableros profesionales.</p>
              <p className="text-primary-600 font-bold">Desde Bs. 70/hora</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Centro Deportivo. Todos los derechos reservados.</p>
          <p className="text-gray-400 mt-2">Proyecto Final - Sistema de Reservas</p>
        </div>
      </footer>
    </main>
  )
}
