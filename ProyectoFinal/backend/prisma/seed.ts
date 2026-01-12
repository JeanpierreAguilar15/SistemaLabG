import { PrismaClient, Rol, TipoCancha } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Crear usuario admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@centrodeportivo.com' },
    update: {},
    create: {
      email: 'admin@centrodeportivo.com',
      password: adminPassword,
      nombre: 'Admin',
      apellido: 'Sistema',
      telefono: '+591 70000000',
      rol: Rol.ADMIN,
    },
  });
  console.log('✅ Usuario admin creado:', admin.email);

  // Crear usuario cliente de prueba
  const clientePassword = await bcrypt.hash('cliente123', 10);
  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@test.com' },
    update: {},
    create: {
      email: 'cliente@test.com',
      password: clientePassword,
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '+591 71111111',
      rol: Rol.CLIENTE,
    },
  });
  console.log('✅ Usuario cliente creado:', cliente.email);

  // Crear canchas
  const canchas = [
    {
      nombre: 'Cancha de Fútbol 1',
      tipo: TipoCancha.FUTBOL,
      descripcion: 'Cancha de césped sintético con iluminación',
      precioPorHora: 100,
    },
    {
      nombre: 'Cancha de Fútbol 2',
      tipo: TipoCancha.FUTBOL,
      descripcion: 'Cancha de césped sintético',
      precioPorHora: 80,
    },
    {
      nombre: 'Cancha de Tenis A',
      tipo: TipoCancha.TENIS,
      descripcion: 'Cancha de arcilla profesional',
      precioPorHora: 60,
    },
    {
      nombre: 'Cancha de Tenis B',
      tipo: TipoCancha.TENIS,
      descripcion: 'Cancha dura con iluminación',
      precioPorHora: 50,
    },
    {
      nombre: 'Cancha de Básquet',
      tipo: TipoCancha.BASQUET,
      descripcion: 'Cancha techada profesional',
      precioPorHora: 70,
    },
  ];

  for (const canchaData of canchas) {
    const cancha = await prisma.cancha.create({
      data: canchaData,
    });

    // Crear horarios para cada día de la semana (Lunes a Domingo)
    for (let dia = 0; dia <= 6; dia++) {
      await prisma.horarioCancha.create({
        data: {
          canchaId: cancha.id,
          diaSemana: dia,
          horaInicio: '08:00',
          horaFin: '22:00',
          disponible: dia !== 0, // Cerrado los domingos
        },
      });
    }

    console.log('✅ Cancha creada:', cancha.nombre);
  }

  console.log('');
  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('📋 Credenciales de prueba:');
  console.log('   Admin: admin@centrodeportivo.com / admin123');
  console.log('   Cliente: cliente@test.com / cliente123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
