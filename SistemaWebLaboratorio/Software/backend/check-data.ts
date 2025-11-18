import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('\n=== VERIFICANDO DATOS EN BD ===\n');

  // Paquetes
  const paquetes = await prisma.paquete.findMany({
    include: {
      _count: {
        select: { examenes: true }
      }
    }
  });
  console.log('PAQUETES:', paquetes.length);
  paquetes.forEach(p => {
    console.log(`  - ${p.nombre} (${p._count.examenes} exámenes) - $${p.precio_paquete}`);
  });

  // Proveedores
  const proveedores = await prisma.proveedor.findMany();
  console.log('\nPROVEEDORES:', proveedores.length);
  proveedores.forEach(p => {
    console.log(`  - ${p.razon_social} (RUC: ${p.ruc})`);
  });

  // Items de inventario
  const items = await prisma.item.findMany({
    include: {
      categoria: true
    }
  });
  console.log('\nITEMS INVENTARIO:', items.length);
  items.forEach(i => {
    console.log(`  - ${i.nombre} (Stock: ${i.stock_actual}) - ${i.categoria ? i.categoria.nombre : 'Sin categoría'}`);
  });

  await prisma.$disconnect();
}

checkData().catch(console.error);
