import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Chatbot interpretacion de resultados (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  const testUser = {
    cedula: '1700000099',
    email: 'chatbot-e2e@example.com',
    password: 'Password123!',
    nombres: 'Chatbot',
    apellidos: 'E2E',
    telefono: '0999999999',
    fecha_nacimiento: '1990-01-01',
    genero: 'MASCULINO',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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

    prisma = app.get<PrismaService>(PrismaService);

    await cleanupTestData();
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);
    accessToken = response.body.access_token;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
    await app.close();
  });

  async function cleanupTestData() {
    await prisma.mensajeChatbot.deleteMany({
      where: {
        conversacion: {
          session_id: {
            contains: 'chatbot-e2e',
          },
        },
      },
    });
    await prisma.conversacionChatbot.deleteMany({
      where: {
        OR: [
          { session_id: { contains: 'chatbot-e2e' } },
          { paciente: { email: testUser.email } },
        ],
      },
    });
    await prisma.logActividad.deleteMany({ where: { usuario: { email: testUser.email } } });
    await prisma.sesion.deleteMany({ where: { usuario: { email: testUser.email } } });
    await prisma.consentimiento.deleteMany({ where: { usuario: { email: testUser.email } } });
    await prisma.perfilMedico.deleteMany({ where: { usuario: { email: testUser.email } } });
    await prisma.usuario.deleteMany({ where: { email: testUser.email } });
  }

  it('should reject interpreter status without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/chatbot/interpret-results/status')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });

  it('should report interpreter status for authenticated users', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/chatbot/interpret-results/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('available');
    expect(response.body).toHaveProperty('message');
  });

  it('should reject PDF interpretation without authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/chatbot/interpret-results')
      .send({})
      .expect(401);
  });

  it('should validate required PDF payload for authenticated users', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/chatbot/interpret-results')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);
  });

  it('should return authenticated chat history for a session', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/chatbot/history?sessionId=chatbot-e2e-session')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      sessionId: 'chatbot-e2e-session',
      messages: [],
    });
  });
});
