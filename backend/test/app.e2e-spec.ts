/**
 * AbogadoVirtual — E2E Tests (~55 test cases)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

const UNIQUE_EMAIL = `test+${Date.now()}@abogadovirtual.test`;
const UNIQUE_EMAIL_2 = `test2+${Date.now()}@abogadovirtual.test`;
let authToken: string;
let tenantId: string;
let userId: string;
let contractId: string;
let conversationId: string;
let analysisId: string;
let complianceId: string;

describe('AbogadoVirtual E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => await app.close());

  // ============================================================
  // HEALTH
  // ============================================================
  describe('Health', () => {
    it('GET /api/health → 200 ok', async () => {
      const { body } = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(body.data.status).toBe('ok');
    });
  });

  // ============================================================
  // AUTH
  // ============================================================
  describe('Auth', () => {
    it('POST /api/auth/register → creates account', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ fullName: 'Test User', email: UNIQUE_EMAIL, password: 'Password123!', country: 'AR' })
        .expect(201);

      expect(body.data.token).toBeDefined();
      expect(body.data.tenant.plan).toBe('start');
      authToken = body.data.token;
      tenantId = body.data.tenant.id;
      userId = body.data.user.id;
    });

    it('POST /api/auth/register → duplicate email → 409', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ fullName: 'Test User', email: UNIQUE_EMAIL, password: 'Password123!' })
        .expect(409);
    });

    it('POST /api/auth/register → missing fields → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'bad-email', password: 'short' })
        .expect(400);
    });

    it('POST /api/auth/login → success', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: UNIQUE_EMAIL, password: 'Password123!' })
        .expect(201);
      expect(body.data.token).toBeDefined();
    });

    it('POST /api/auth/login → wrong password → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: UNIQUE_EMAIL, password: 'WrongPass!' })
        .expect(401);
    });

    it('GET /api/auth/profile → returns user + tenant', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.user.email).toBe(UNIQUE_EMAIL);
      expect(body.data.tenant.creditBalance).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/auth/profile → no token → 401', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('PATCH /api/auth/profile → updates name', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fullName: 'Test Updated' })
        .expect(200);
      expect(body.data.fullName).toBe('Test Updated');
    });
  });

  // ============================================================
  // AI — ADVISORS
  // ============================================================
  describe('AI — Advisors', () => {
    it('GET /api/ai/advisors → returns 5 advisors with required fields', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/ai/advisors')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data).toHaveLength(5);
      expect(body.data.map((a: any) => a.id)).toEqual(
        expect.arrayContaining(['legal', 'health', 'finance', 'psychology', 'home']),
      );
      body.data.forEach((a: any) => {
        expect(a.id).toBeDefined();
        expect(a.name).toBeDefined();
        expect(a.icon).toBeDefined();
        expect(a.color).toBeDefined();
        expect(typeof a.available).toBe('boolean');
      });
    });

    it('GET /api/ai/advisors/legal → advisor detail', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/ai/advisors/legal')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.id).toBe('legal');
      expect(body.data.quick_actions).toBeDefined();
    });

    it('GET /api/ai/advisors/health → advisor detail', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/ai/advisors/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.id).toBe('health');
      expect(body.data.name).toBeDefined();
      expect(body.data.icon).toBeDefined();
      expect(body.data.color).toBeDefined();
    });

    it('GET /api/ai/advisors/invalid → 404', async () => {
      await request(app.getHttpServer())
        .get('/api/ai/advisors/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('POST /api/ai/conversation → creates conversation for legal (camelCase)', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/ai/conversation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ advisorId: 'legal', type: 'chat' })
        .expect(201);
      expect(body.data.advisor_id).toBe('legal');
      expect(body.data.advisor).toBeDefined();
      expect(body.data.welcomeMessage).toBeDefined();
      conversationId = body.data.id;
    });

    it('POST /api/ai/conversation → creates for health (snake_case advisor_id)', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/ai/conversation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ advisor_id: 'health' })
        .expect(201);
      expect(body.data.advisor_id).toBe('health');
      expect(body.data.advisor.icon).toBeDefined();
      expect(body.data.welcomeMessage).toBeDefined();
    });

    it('POST /api/ai/conversation → defaults to legal when no advisor_id', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/ai/conversation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'chat' })
        .expect(201);
      expect(body.data.advisor_id).toBe('legal');
    });

    it('POST /api/ai/conversation/:id/message → sends message and gets response', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/api/ai/conversation/${conversationId}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '¿Qué necesito para un contrato de alquiler en Argentina?' })
        .expect(201);
      expect(body.data.content).toBeDefined();
      expect(body.data.content.length).toBeGreaterThan(0);
    });

    it('GET /api/ai/conversation/:id → history with messages', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/ai/conversation/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.messages.length).toBeGreaterThan(0);
    });

    it('GET /api/ai/conversations → paginated list', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.conversations).toBeDefined();
      expect(body.data.total).toBeGreaterThan(0);
    });

    it('POST /api/ai/analyze → document analysis with risk score', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Contrato de Prueba',
          content: `CONTRATO DE LOCACIÓN. Entre el señor Juan Pérez (locador) y María García (locataria).
          CLÁUSULA PRIMERA: El locador podrá rescindir el contrato sin previo aviso ni indemnización en cualquier momento.
          CLÁUSULA SEGUNDA: La locataria renuncia a todos sus derechos establecidos en la Ley 27.551.
          CLÁUSULA TERCERA: El canon locativo se actualizará según decisión unilateral del locador.
          CLÁUSULA CUARTA: En caso de conflicto, la locataria deberá pagar todos los costos judiciales.`,
          country: 'AR',
        })
        .expect(201);
      expect(body.data.overallRisk).toBeDefined();
      expect(VALID_RISKS).toContain(body.data.overallRisk);
      expect(body.data.riskScore).toBeGreaterThanOrEqual(0);
      expect(body.data.riskScore).toBeLessThanOrEqual(100);
      analysisId = body.data.assessmentId;
    }, 30000);
  });

  const VALID_RISKS = ['low', 'medium', 'high', 'critical'];

  // ============================================================
  // CONTRACTS
  // ============================================================
  describe('Contracts', () => {
    it('POST /api/contracts → creates contract', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Contrato de Prueba E2E',
          type: 'servicios',
          jurisdiction: 'argentina',
          parties: [{ name: 'Empresa X', role: 'cliente' }],
          contentHtml: '<h1>Contrato de Servicios</h1><p>Cláusula 1: Prestación de servicios.</p>',
          contentPlain: 'Contrato de Servicios. Cláusula 1: Prestación de servicios.',
        })
        .expect(201);
      expect(body.data.type).toBe('servicios');
      contractId = body.data.id;
    });

    it('POST /api/contracts → XSS sanitization', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'XSS Test',
          type: 'nda',
          contentHtml: '<p>Safe</p><script>alert("xss")</script>',
        })
        .expect(201);
      expect(body.data.content_html).not.toContain('<script>');
    });

    it('GET /api/contracts → list with pagination', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.contracts).toBeDefined();
      expect(body.data.total).toBeGreaterThan(0);
    });

    it('GET /api/contracts → filter by type', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/contracts?type=servicios')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      body.data.contracts.forEach((c: any) => expect(c.type).toBe('servicios'));
    });

    it('GET /api/contracts → search by title', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/contracts?search=Prueba')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.contracts.length).toBeGreaterThan(0);
    });

    it('GET /api/contracts/:id → contract detail', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/contracts/${contractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.id).toBe(contractId);
    });

    it('PUT /api/contracts/:id → update and auto-version', async () => {
      const { body } = await request(app.getHttpServer())
        .put(`/api/contracts/${contractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ contentHtml: '<p>Versión 2 del contrato</p>', status: 'review' })
        .expect(200);
      expect(body.data.version).toBe(2);
      expect(body.data.status).toBe('review');
    });

    it('GET /api/contracts/:id/versions → versioning history', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/contracts/${contractId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/contracts/:id/pdf → PDF buffer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/contracts/${contractId}/pdf`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.headers['content-type']).toContain('application/pdf');
    });
  });

  // ============================================================
  // ANALYSIS
  // ============================================================
  describe('Analysis', () => {
    it('GET /api/analysis → list assessments', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.assessments).toBeDefined();
    });

    it('GET /api/analysis/overview → risk distribution', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/analysis/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.riskDistribution).toBeDefined();
    });

    it('GET /api/analysis/:id → detail with findings', async () => {
      if (!analysisId) return;
      const { body } = await request(app.getHttpServer())
        .get(`/api/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.findings).toBeDefined();
    });
  });

  // ============================================================
  // BILLING
  // ============================================================
  describe('Billing', () => {
    it('GET /api/billing/wallet → credit balance', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/billing/wallet')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(typeof body.data.balance).toBe('number');
    });

    it('GET /api/billing/transactions → ledger', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/billing/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.transactions).toBeDefined();
    });

    it('POST /api/billing/credits/buy → invalid pack → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/billing/credits/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pack: 'invalid_pack' })
        .expect(400);
    });
  });

  // ============================================================
  // COMPLIANCE
  // ============================================================
  describe('Compliance', () => {
    it('POST /api/compliance → create item', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const { body } = await request(app.getHttpServer())
        .post('/api/compliance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Renovar contrato',
          description: 'Revisar términos y condiciones',
          dueDate: dueDate.toISOString(),
        })
        .expect(201);
      expect(body.data.status).toBe('pending');
      complianceId = body.data.id;
    });

    it('GET /api/compliance → list items', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/compliance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.items.length).toBeGreaterThan(0);
    });

    it('PATCH /api/compliance/:id → mark completed', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/api/compliance/${complianceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed', notes: 'Revisado y actualizado' })
        .expect(200);
      expect(body.data.status).toBe('completed');
    });

    it('GET /api/compliance/upcoming → items in next 30 days', async () => {
      await request(app.getHttpServer())
        .get('/api/compliance/upcoming?days=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('DELETE /api/compliance/:id → removes item', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/api/compliance/${complianceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.deleted).toBe(true);
    });
  });

  // ============================================================
  // ALERTS
  // ============================================================
  describe('Alerts', () => {
    it('GET /api/alerts → list alerts', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.alerts).toBeDefined();
    });

    it('GET /api/alerts/unread-count → count', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/alerts/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(typeof body.data).toBe('number');
    });
  });

  // ============================================================
  // PLATFORM — TENANTS
  // ============================================================
  describe('Tenants', () => {
    it('GET /api/tenants/me → tenant info', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/tenants/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.id).toBe(tenantId);
    });

    it('GET /api/tenants/me/stats → dashboard stats', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/tenants/me/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.total_contracts).toBeDefined();
    });

    it('GET /api/tenants/me/usage → plan usage', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/tenants/me/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(body.data.plan).toBe('start');
    });
  });
});
