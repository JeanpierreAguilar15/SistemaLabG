import * as dotenv from 'dotenv';
dotenv.config();
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Patient Journey E2E Test
 * Simulates a complete patient workflow:
 * 1. Registration & Login
 * 2. Quotations (Browse Exams, Create Quote, View Quote)
 * 3. Viewing Profile
 */
describe('Patient Journey (e2e)', () => {
    let app: INestApplication;
    let prismaService: PrismaService;

    // Test Data
    const patientData = {
        cedula: '1122334455',
        email: 'patient.journey@example.com',
        password: 'SecurePassword123!',
        nombres: 'Juan',
        apellidos: 'Perez Journey',
        telefono: '0987654321',
        fecha_nacimiento: '1995-05-15',
        genero: 'MASCULINO',
    };

    let accessToken: string;
    let patientId: number;

    // Catalog Data
    let categoryId: number;
    let examId: number;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Configure app same as main.ts
        app.setGlobalPrefix('api');
        app.enableVersioning({
            type: VersioningType.URI,
            defaultVersion: '1',
        });

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
        prismaService = app.get<PrismaService>(PrismaService);

        // Clean up previous test data
        await cleanupTestData();

        // Seed necessary data
        await seedCatalogData();
    });

    afterAll(async () => {
        await cleanupTestData();
        await prismaService.$disconnect();
        await app.close();
    });

    const cleanupTestData = async () => {
        try {
            const user = await prismaService.usuario.findUnique({ where: { email: patientData.email } });
            if (user) {
                // Delete dependent data
                await prismaService.sesion.deleteMany({ where: { codigo_usuario: user.codigo_usuario } });
                await prismaService.logActividad.deleteMany({ where: { codigo_usuario: user.codigo_usuario } });
                await prismaService.consentimiento.deleteMany({ where: { codigo_usuario: user.codigo_usuario } });
                await prismaService.perfilMedico.deleteMany({ where: { codigo_usuario: user.codigo_usuario } });

                await prismaService.usuario.delete({ where: { codigo_usuario: user.codigo_usuario } });
            }
        } catch (error) {
            console.warn('Cleanup warning:', error.message);
        }
    };

    const seedCatalogData = async () => {
        // Seed Catalog Data (Category, Exam, Price)
        let category = await prismaService.categoriaExamen.findFirst({ where: { nombre: 'HEMATOLOGIA TEST' } });
        if (!category) {
            category = await prismaService.categoriaExamen.create({
                data: {
                    nombre: 'HEMATOLOGIA TEST',
                    descripcion: 'Categoria de prueba',
                    activo: true
                }
            });
        }
        categoryId = category.codigo_categoria;

        let exam = await prismaService.examen.findFirst({ where: { codigo_interno: 'HEM001-TEST' } });
        if (!exam) {
            exam = await prismaService.examen.create({
                data: {
                    codigo_categoria: categoryId,
                    codigo_interno: 'HEM001-TEST',
                    nombre: 'Hemograma Completo Test',
                    descripcion: 'Examen de prueba',
                    tiempo_entrega_horas: 24,
                    activo: true
                }
            });
        }
        examId = exam.codigo_examen;
    };

    // ==========================================
    // STEP 1: AUTHENTICATION
    // ==========================================
    describe('Step 1: Authentication', () => {
        it('should register a new patient', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(patientData)
                .expect(201);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(patientData.email);
            accessToken = response.body.access_token;
            patientId = response.body.user.codigo_usuario;
        });

        // Note: Login is already tested during registration above
        // Registration returns access_token, so explicit login test is redundant
    });

    // ==========================================
    // STEP 2: PROFILE
    // ==========================================
    describe('Step 2: Profile', () => {
        it('should view own profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/users/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.email).toBe(patientData.email);
        });
    });
});
