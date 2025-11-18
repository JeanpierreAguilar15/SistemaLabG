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

  // 2.1. Create test users (different roles)
  console.log('Creating test users...');
  const pacienteRole = roles.find((r) => r.nombre === 'PACIENTE');
  const recepcionRole = roles.find((r) => r.nombre === 'RECEPCION');
  const personalLabRole = roles.find((r) => r.nombre === 'PERSONAL_LAB');

  // Helper function to create users
  async function createUserIfNotExists(userData: any) {
    const existing = await prisma.usuario.findFirst({
      where: {
        OR: [{ cedula: userData.cedula }, { email: userData.email }],
      },
    });

    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(userData.password, salt);
      const { password, ...userDataWithoutPassword } = userData;

      return await prisma.usuario.create({
        data: {
          ...userDataWithoutPassword,
          password_hash,
          salt,
        },
      });
    }
    return existing;
  }

  // Create pacientes de prueba
  const pacientes = [
    {
      codigo_rol: pacienteRole.codigo_rol,
      cedula: '1721456789',
      nombres: 'María José',
      apellidos: 'González Pérez',
      email: 'maria.gonzalez@example.com',
      telefono: '0987654321',
      fecha_nacimiento: new Date('1990-05-15'),
      genero: 'Femenino',
      direccion: 'Av. 6 de Diciembre N34-123, Quito',
      password: 'Paciente123!',
      email_verificado: true,
      activo: true,
    },
    {
      codigo_rol: pacienteRole.codigo_rol,
      cedula: '1712345678',
      nombres: 'Juan Carlos',
      apellidos: 'Morales Sánchez',
      email: 'juan.morales@example.com',
      telefono: '0998765432',
      fecha_nacimiento: new Date('1985-08-22'),
      genero: 'Masculino',
      direccion: 'Av. América N45-678, Quito',
      password: 'Paciente123!',
      email_verificado: true,
      activo: true,
    },
    {
      codigo_rol: pacienteRole.codigo_rol,
      cedula: '1723456789',
      nombres: 'Ana Patricia',
      apellidos: 'Rodríguez López',
      email: 'ana.rodriguez@example.com',
      telefono: '0976543210',
      fecha_nacimiento: new Date('1995-12-10'),
      genero: 'Femenino',
      direccion: 'Calle Los Pinos 123, Quito',
      password: 'Paciente123!',
      email_verificado: true,
      activo: true,
    },
  ];

  for (const pacienteData of pacientes) {
    const paciente = await createUserIfNotExists(pacienteData);

    // Create perfil médico for each paciente
    const existingPerfil = await prisma.perfilMedico.findUnique({
      where: { codigo_usuario: paciente.codigo_usuario },
    });

    if (!existingPerfil) {
      await prisma.perfilMedico.create({
        data: {
          codigo_usuario: paciente.codigo_usuario,
          tipo_sangre: paciente.nombres === 'María José' ? 'O+' : paciente.nombres === 'Juan Carlos' ? 'A+' : 'B+',
          alergias: paciente.nombres === 'María José' ? 'Penicilina, Polen' : null,
          condiciones_cronicas: paciente.nombres === 'Juan Carlos' ? 'Hipertensión' : null,
          medicamentos_actuales: paciente.nombres === 'Juan Carlos' ? 'Losartán 50mg' : null,
        },
      });
    }

    console.log(`✅ Created paciente: ${paciente.email}`);
  }

  // Create recepcionista
  const recepcionista = await createUserIfNotExists({
    codigo_rol: recepcionRole.codigo_rol,
    cedula: '1734567890',
    nombres: 'Laura',
    apellidos: 'Martínez Vega',
    email: 'recepcion@lab.com',
    telefono: '0987123456',
    fecha_nacimiento: new Date('1992-03-18'),
    genero: 'Femenino',
    direccion: 'Av. Shyris N35-456, Quito',
    password: 'Recepcion123!',
    email_verificado: true,
    activo: true,
  });
  console.log(`✅ Created recepcionista: ${recepcionista.email}`);

  // Create personal de laboratorio
  const personalLab = await createUserIfNotExists({
    codigo_rol: personalLabRole.codigo_rol,
    cedula: '1745678901',
    nombres: 'Carlos Alberto',
    apellidos: 'Ramírez Torres',
    email: 'laboratorio@lab.com',
    telefono: '0976543219',
    fecha_nacimiento: new Date('1988-07-25'),
    genero: 'Masculino',
    direccion: 'Av. República N23-789, Quito',
    password: 'Personal123!',
    email_verificado: true,
    activo: true,
  });
  console.log(`✅ Created personal de laboratorio: ${personalLab.email}`);

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

  // 8. Create paquetes de exámenes
  console.log('Creating paquetes de exámenes...');
  const examenesCreados = await prisma.examen.findMany({
    orderBy: { codigo_examen: 'asc' },
    take: 5,
  });

  const paquetes = [
    {
      nombre: 'Paquete Básico de Salud',
      descripcion: 'Incluye hemograma completo y glucosa en ayunas',
      precio_paquete: 18.0, // Descuento del 10% sobre precio individual
      descuento: 10.0,
      examenes: [examenesCreados[0].codigo_examen, examenesCreados[1].codigo_examen], // Hemograma + Glucosa
    },
    {
      nombre: 'Paquete Chequeo Completo',
      descripcion: 'Hemograma, glucosa, perfil lipídico y creatinina',
      precio_paquete: 48.0, // Descuento del 15% sobre precio individual
      descuento: 15.0,
      examenes: [
        examenesCreados[0].codigo_examen,
        examenesCreados[1].codigo_examen,
        examenesCreados[2].codigo_examen,
        examenesCreados[4].codigo_examen,
      ], // Hemograma + Glucosa + Perfil Lipídico + Creatinina
    },
    {
      nombre: 'Paquete Pre-Operatorio',
      descripcion: 'Exámenes requeridos antes de cirugía',
      precio_paquete: 45.0, // Descuento del 12% sobre precio individual
      descuento: 12.0,
      examenes: [
        examenesCreados[0].codigo_examen,
        examenesCreados[1].codigo_examen,
        examenesCreados[3].codigo_examen,
        examenesCreados[4].codigo_examen,
      ], // Hemograma + Glucosa + Orina + Creatinina
    },
  ];

  for (const paqueteData of paquetes) {
    const { examenes: examenesIds, ...paqueteInfo } = paqueteData;
    const paquete = await prisma.paquete.upsert({
      where: { codigo_paquete: paquetes.indexOf(paqueteData) + 1 },
      update: {},
      create: paqueteInfo,
    });

    // Relacionar exámenes con el paquete
    for (const codigo_examen of examenesIds) {
      await prisma.paqueteExamen.upsert({
        where: {
          codigo_paquete_examen: paquete.codigo_paquete * 100 + codigo_examen,
        },
        update: {},
        create: {
          codigo_paquete: paquete.codigo_paquete,
          codigo_examen: codigo_examen,
        },
      });
    }
  }
  console.log(`✅ Created ${paquetes.length} paquetes de exámenes`);

  // 9. Create proveedores
  console.log('Creating proveedores...');
  const proveedores = [
    {
      ruc: '1790123456001',
      razon_social: 'BioLab Ecuador S.A.',
      nombre_comercial: 'BioLab',
      telefono: '0223456789',
      email: 'ventas@biolab.com.ec',
      direccion: 'Av. De la República N45-123, Quito',
      activo: true,
    },
    {
      ruc: '1790234567001',
      razon_social: 'MedSupply Distribuciones Cia. Ltda.',
      nombre_comercial: 'MedSupply',
      telefono: '0223456790',
      email: 'contacto@medsupply.com.ec',
      direccion: 'Av. 10 de Agosto N34-567, Quito',
      activo: true,
    },
    {
      ruc: '1790345678001',
      razon_social: 'Reactivos y Equipos del Ecuador',
      nombre_comercial: 'Reactivos Ecuador',
      telefono: '0223456791',
      email: 'info@reactivosecuador.com',
      direccion: 'Av. Amazonas N23-890, Quito',
      activo: true,
    },
  ];

  for (const proveedorData of proveedores) {
    await prisma.proveedor.upsert({
      where: { ruc: proveedorData.ruc },
      update: {},
      create: proveedorData,
    });
  }
  console.log(`✅ Created ${proveedores.length} proveedores`);

  // 10. Create items de inventario
  console.log('Creating items de inventario...');
  const categoriaReactivos = await prisma.categoriaItem.findUnique({
    where: { nombre: 'Reactivos' },
  });
  const categoriaInsumos = await prisma.categoriaItem.findUnique({
    where: { nombre: 'Insumos' },
  });

  const items = [
    {
      codigo_interno: 'REAC-001',
      nombre: 'Reactivo para Glucosa (500ml)',
      descripcion: 'Reactivo enzimático para determinación de glucosa',
      unidad_medida: 'Frasco',
      stock_actual: 15,
      stock_minimo: 5,
      stock_maximo: 30,
      costo_unitario: 45.0,
      precio_venta: 60.0,
      codigo_categoria: categoriaReactivos.codigo_categoria,
      activo: true,
    },
    {
      codigo_interno: 'REAC-002',
      nombre: 'Kit Hemograma Automatizado',
      descripcion: 'Kit de 100 determinaciones para hemograma',
      unidad_medida: 'Kit',
      stock_actual: 8,
      stock_minimo: 3,
      stock_maximo: 15,
      costo_unitario: 120.0,
      precio_venta: 150.0,
      codigo_categoria: categoriaReactivos.codigo_categoria,
      activo: true,
    },
    {
      codigo_interno: 'INSU-001',
      nombre: 'Tubos Vacutainer EDTA (100 unidades)',
      descripcion: 'Tubos con anticoagulante EDTA para hematología',
      unidad_medida: 'Caja',
      stock_actual: 25,
      stock_minimo: 10,
      stock_maximo: 50,
      costo_unitario: 15.0,
      precio_venta: 20.0,
      codigo_categoria: categoriaInsumos.codigo_categoria,
      activo: true,
    },
    {
      codigo_interno: 'INSU-002',
      nombre: 'Agujas Vacutainer 21G (100 unidades)',
      descripcion: 'Agujas estériles para extracción de sangre',
      unidad_medida: 'Caja',
      stock_actual: 30,
      stock_minimo: 15,
      stock_maximo: 60,
      costo_unitario: 8.0,
      precio_venta: 12.0,
      codigo_categoria: categoriaInsumos.codigo_categoria,
      activo: true,
    },
    {
      codigo_interno: 'INSU-003',
      nombre: 'Recipientes para Orina (50 unidades)',
      descripcion: 'Recipientes estériles para recolección de orina',
      unidad_medida: 'Caja',
      stock_actual: 20,
      stock_minimo: 8,
      stock_maximo: 40,
      costo_unitario: 5.0,
      precio_venta: 8.0,
      codigo_categoria: categoriaInsumos.codigo_categoria,
      activo: true,
    },
  ];

  for (const itemData of items) {
    await prisma.item.upsert({
      where: { codigo_interno: itemData.codigo_interno },
      update: {},
      create: itemData,
    });
  }
  console.log(`✅ Created ${items.length} items de inventario`);

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
