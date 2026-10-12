import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import brevoEmailService from '../src/services/brevoEmailService.js';
import { firestoreDb } from '../src/config/firebaseAdmin.js';

describe('POST /api/interest-requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validPayload = {
    name: 'Avishkar Shinde',
    age: 19,
    passion: 'STUDENT',
    institutionName: 'Jscoe Hadapsar',
    mode: 'ONLINE',
    language: 'ENGLISH',
    preferredDay: 'SATURDAY',
    email: 'avishkar2007@gmail.com',
    phoneNumber: '9022073536',
    description: 'Looking forward to the Gita class.',
    opportunityTitle: 'Bhagavad Gita Wisdom Class',
  };

  it('validates required fields and returns 400 for invalid requests', async () => {
    // Missing name
    const res1 = await request(app)
      .post('/api/interest-requests')
      .send({ ...validPayload, name: '' });
    expect(res1.status).toBe(400);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');

    // Invalid phone number
    const res2 = await request(app)
      .post('/api/interest-requests')
      .send({ ...validPayload, phoneNumber: '123' });
    expect(res2.status).toBe(400);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');

    // Invalid age
    const res3 = await request(app)
      .post('/api/interest-requests')
      .send({ ...validPayload, age: -5 });
    expect(res3.status).toBe(400);
    expect(res3.body.error.code).toBe('VALIDATION_ERROR');

    // Missing institution
    const res4 = await request(app)
      .post('/api/interest-requests')
      .send({ ...validPayload, institutionName: '' });
    expect(res4.status).toBe(400);
    expect(res4.body.error.code).toBe('VALIDATION_ERROR');

    // Missing preferredDay
    const res5 = await request(app)
      .post('/api/interest-requests')
      .send({ ...validPayload, preferredDay: '' });
    expect(res5.status).toBe(400);
    expect(res5.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('records interest request in Firestore and triggers Brevo notification', async () => {
    const mockSet = vi.fn().mockResolvedValue();
    const mockDoc = vi.fn(() => ({ id: 'mock-interest-doc-id', set: mockSet }));
    vi.spyOn(firestoreDb, 'collection').mockReturnValue({ doc: mockDoc });

    const brevoSpy = vi.spyOn(brevoEmailService, 'sendGitaInterestNotification').mockResolvedValue({
      success: true,
      messageId: '<brevo-msg-id>',
    });

    const res = await request(app)
      .post('/api/interest-requests')
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.requestId).toBe('mock-interest-doc-id');
    expect(brevoSpy).toHaveBeenCalledTimes(1);
    expect(brevoSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Avishkar Shinde',
      phoneNumber: '9022073536',
      passion: 'STUDENT',
      institutionName: 'Jscoe Hadapsar',
      requestId: 'mock-interest-doc-id',
    }));
  });

  it('Phase 10 — returns SUCCESS even when Brevo email delivery fails', async () => {
    const mockSet = vi.fn().mockResolvedValue();
    const mockDoc = vi.fn(() => ({ id: 'mock-interest-doc-id', set: mockSet }));
    vi.spyOn(firestoreDb, 'collection').mockReturnValue({ doc: mockDoc });

    // Simulate Brevo outage / failure
    vi.spyOn(brevoEmailService, 'sendGitaInterestNotification').mockRejectedValue(
      new Error('Brevo service unavailable: 503')
    );

    const res = await request(app)
      .post('/api/interest-requests')
      .send(validPayload);

    // Form submission MUST still return success to the user
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.requestId).toBe('mock-interest-doc-id');
  });
});
