import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { nombre: 'ADMIN' },
      update: {},
      create: {
        nombre: 'ADMIN',
        descripcion: 'Administrador del sistema con acceso total',
        nivel_acceso: 10,
        activo: true,
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'PERSONAL_LAB' },
      update: {},
      create: {
        nombre: 'PERSONAL_LAB',
        descripcion: 'Personal del laboratorio (técnicos, bioquímicos)',
        nivel_acceso: 7,
        activo: true,
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'MEDICO' },
      update: {},
      create: {
        nombre: 'MEDICO',
        descripcion: 'Médico con acceso a resultados de pacientes',
        nivel_acceso: 5,
        activo: true,
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'RECEPCION' },
      update: {},
      create: {
        nombre: 'RECEPCION',
        descripcion: 'Personal de recepción',
        nivel_acceso: 3,
        activo: true,
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'PACIENTE' },
      update: {},
      create: {
        nombre: 'PACIENTE',
        descripcion: 'Paciente del laboratorio',
        nivel_acceso: 1,
        activo: true,
      },
    }),
  ]);

  console.log(`✅ Created ${roles.length} roles`);

  // 2. Create admin user
  console.log('Creating admin user...');
  const adminCedula = process.env.ADMIN_CEDULA || '1710034065';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lab.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const adminRole = roles.find((r) => r.nombre === 'ADMIN');

  const existingAdmin = await prisma.usuario.findFirst({
    where: {
      OR: [{ cedula: adminCedula }, { email: adminEmail }],
    },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminPassword, salt);

    const admin = await prisma.usuario.create({
      data: {
        codigo_rol: adminRole.codigo_rol,
        cedula: adminCedula,
        nombres: 'Administrador',
        apellidos: 'Sistema',
        email: adminEmail,
        password_hash,
        salt,
        email_verificado: true,
        activo: true,
      },
    });

    console.log(`✅ Created admin user: ${admin.email}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // 3. Create sede (location)
  console.log('Creating sede...');
  const sede = await prisma.sede.upsert({
    where: { codigo_sede: 1 },
    update: {},
    create: {
      nombre: 'Laboratorio Franz - Sede Principal',
      direccion: 'Av. Principal #123, Quito, Ecuador',
      telefono: '0234567890',
      email: 'info@laboratorifranz.com',
      activo: true,
    },
  });
  console.log(`✅ Created sede: ${sede.nombre}`);

  // 4. Create servicios
  console.log('Creating servicios...');
  const servicios = await Promise.all([
    prisma.servicio.upsert({
      where: { codigo_servicio: 1 },
      update: {},
      create: {
        nombre: 'Toma de Muestras',
        descripcion: 'Servicio de toma de muestras de sangre, orina, etc.',
        activo: true,
      },
    }),
    prisma.servicio.upsert({
      where: { codigo_servicio: 2 },
      update: {},
      create: {
        nombre: 'Entrega de Resultados',
        descripcion: 'Servicio de entrega de resultados',
        activo: true,
      },
    }),
  ]);
  console.log(`✅ Created ${servicios.length} servicios`);

  // 5. Create categorias de examenes
  console.log('Creating categorías de exámenes...');
  const categorias = await Promise.all([
    prisma.categoriaExamen.upsert({
      where: { nombre: 'Hematología' },
      update: {},
      create: {
        nombre: 'Hematología',
        descripcion: 'Exámenes relacionados con la sangre',
        activo: true,
      },
    }),
    prisma.categoriaExamen.upsert({
      where: { nombre: 'Bioquímica' },
      update: {},
      create: {
        nombre: 'Bioquímica',
        descripcion: 'Exámenes bioquímicos',
        activo: true,
      },
    }),
    prisma.categoriaExamen.upsert({
      where: { nombre: 'Urianálisis' },
      update: {},
      create: {
        nombre: 'Urianálisis',
        descripcion: 'Exámenes de orina',
        activo: true,
      },
    }),
    prisma.categoriaExamen.upsert({
      where: { nombre: 'Inmunología' },
      update: {},
      create: {
        nombre: 'Inmunología',
        descripcion: 'Pruebas inmunológicas',
        activo: true,
      },
    }),
  ]);
  console.log(`✅ Created ${categorias.length} categorías`);

  // 6. Create examenes
  console.log('Creating exámenes...');
  const hematologia = categorias.find((c) => c.nombre === 'Hematología');
  const bioquimica = categorias.find((c) => c.nombre === 'Bioquímica');
  const urianalisis = categorias.find((c) => c.nombre === 'Urianálisis');

  const examenes = [
    {
      codigo_interno: 'HCTO-001',
      nombre: 'Hemograma Completo',
      codigo_categoria: hematologia.codigo_categoria,
      descripcion: 'Análisis completo de células sanguíneas',
      requiere_ayuno: false,
      tiempo_entrega_horas: 24,
      tipo_muestra: 'Sangre',
      precio: 15.0,
    },
    {
      codigo_interno: 'BIOQ-001',
      nombre: 'Glucosa en Ayunas',
      codigo_categoria: bioquimica.codigo_categoria,
      descripcion: 'Medición de glucosa en sangre',
      requiere_ayuno: true,
      horas_ayuno: 8,
      instrucciones_preparacion: 'Ayuno de 8-12 horas. Solo puede tomar agua.',
      tiempo_entrega_horas: 4,
      tipo_muestra: 'Sangre',
      valor_referencia_min: 70,
      valor_referencia_max: 100,
      unidad_medida: 'mg/dL',
      precio: 5.0,
    },
    {
      codigo_interno: 'BIOQ-002',
      nombre: 'Perfil Lipídico',
      codigo_categoria: bioquimica.codigo_categoria,
      descripcion: 'Colesterol total, HDL, LDL, Triglicéridos',
      requiere_ayuno: true,
      horas_ayuno: 12,
      instrucciones_preparacion: 'Ayuno de 12 horas. Solo puede tomar agua.',
      tiempo_entrega_horas: 24,
      tipo_muestra: 'Sangre',
      precio: 25.0,
    },
    {
      codigo_interno: 'URIN-001',
      nombre: 'Examen General de Orina',
      codigo_categoria: urianalisis.codigo_categoria,
      descripcion: 'Análisis físico, químico y microscópico de orina',
      requiere_ayuno: false,
      instrucciones_preparacion: 'Primera orina de la mañana preferiblemente',
      tiempo_entrega_horas: 4,
      tipo_muestra: 'Orina',
      precio: 8.0,
    },
    {
      codigo_interno: 'BIOQ-003',
      nombre: 'Creatinina',
      codigo_categoria: bioquimica.codigo_categoria,
      descripcion: 'Evaluación de función renal',
      requiere_ayuno: false,
      tiempo_entrega_horas: 24,
      tipo_muestra: 'Sangre',
      valor_referencia_min: 0.6,
      valor_referencia_max: 1.2,
      unidad_medida: 'mg/dL',
      precio: 8.0,
    },
  ];

  for (const examen of examenes) {
    const { precio, ...examenData } = examen;
    const examenCreado = await prisma.examen.upsert({
      where: { codigo_interno: examen.codigo_interno },
      update: {},
      create: examenData,
    });

    // Create precio for examen
    await prisma.precio.upsert({
      where: { codigo_precio: examenCreado.codigo_examen },
      update: {},
      create: {
        codigo_examen: examenCreado.codigo_examen,
        precio,
        activo: true,
      },
    });
  }
  console.log(`✅ Created ${examenes.length} exámenes with prices`);

  // 7. Create categorias de inventario
  console.log('Creating categorías de inventario...');
  await Promise.all([
    prisma.categoriaItem.upsert({
      where: { nombre: 'Reactivos' },
      update: {},
      create: {
        nombre: 'Reactivos',
        descripcion: 'Reactivos químicos para análisis',
        activo: true,
      },
    }),
    prisma.categoriaItem.upsert({
      where: { nombre: 'Insumos' },
      update: {},
      create: {
        nombre: 'Insumos',
        descripcion: 'Insumos consumibles (tubos, agujas, etc.)',
        activo: true,
      },
    }),
    prisma.categoriaItem.upsert({
      where: { nombre: 'Equipamiento' },
      update: {},
      create: {
        nombre: 'Equipamiento',
        descripcion: 'Equipos de laboratorio',
        activo: true,
      },
    }),
  ]);

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
