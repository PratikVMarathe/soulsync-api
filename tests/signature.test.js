import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { firebaseAuth, firestoreDb } from '../src/config/firebaseAdmin.js';

vi.mock('../src/config/firebaseAdmin.js', () => {
  const verifyIdTokenMock = vi.fn();
  const getDocMock = vi.fn();

  return {
    firebaseAuth: {
      verifyIdToken: verifyIdTokenMock,
    },
    firestoreDb: {
      collection: () => ({
        doc: () => ({
          get: getDocMock,
        }),
      }),
    },
    default: {},
  };
});

describe('POST /api/cloudinary/signature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
    process.env.CLOUDINARY_API_KEY = 'test_key';
    process.env.CLOUDINARY_API_SECRET = 'secret_test_secret_12345';
    process.env.CLOUDINARY_UPLOAD_PRESET = 'soulsync_images';
    process.env.MAX_IMAGE_SIZE_KB = '500';
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/cloudinary/signature')
      .send({ folder: 'QUIZ' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid Firebase tokens with 401', async () => {
    firebaseAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer invalid_token')
      .send({ folder: 'QUIZ' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects USER role with 403', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'user_123' });
    firestoreDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        role: 'USER',
        status: 'ACTIVE',
      }),
    });

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer valid_user_token')
      .send({ folder: 'QUIZ' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects blocked ADMIN with 403', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'admin_blocked' });
    firestoreDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        role: 'ADMIN',
        status: 'BLOCKED',
      }),
    });

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer valid_blocked_token')
      .send({ folder: 'QUIZ' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/blocked/i);
  });

  it('rejects deleted ADMIN with 403', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'admin_deleted' });
    firestoreDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        role: 'ADMIN',
        status: 'ACTIVE',
        isDeleted: true,
      }),
    });

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer valid_deleted_token')
      .send({ folder: 'QUIZ' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows ADMIN and returns signature with correct QUIZ folder', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'admin_123', email: 'admin@soulsync.org' });
    firestoreDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        role: 'ADMIN',
        status: 'ACTIVE',
      }),
    });

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer valid_admin_token')
      .send({ folder: 'QUIZ' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.folder).toBe('soulsync/quiz-images');
    expect(res.body.uploadPreset).toBe('soulsync_images');
    expect(res.body.cloudName).toBe('test_cloud');
    expect(res.body.apiKey).toBe('test_key');
    expect(res.body.signature).toBeDefined();
    expect(typeof res.body.signature).toBe('string');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.maxImageSizeKb).toBe(500);

    // CRITICAL: Ensure secret is NEVER present
    expect(res.body.apiSecret).toBeUndefined();
    expect(res.body.CLOUDINARY_API_SECRET).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('secret_test_secret_12345');
  });

  it('allows SUPER_ADMIN and returns signature with correct MANDALA folder', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'superadmin_123', email: 'super@soulsync.org' });
    firestoreDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      }),
    });

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer valid_superadmin_token')
      .send({ folder: 'MANDALA' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.folder).toBe('soulsync/mandala-images');
    expect(res.body.uploadPreset).toBe('soulsync_images');
    expect(res.body.maxImageSizeKb).toBe(500);
  });

  it('rejects invalid folder destination with 400', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'admin_123' });
    firestoreDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        role: 'ADMIN',
        status: 'ACTIVE',
      }),
    });

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer valid_admin_token')
      .send({ folder: 'arbitrary/untrusted/path' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_FOLDER');
  });

  it('rejects image exceeding 500 KB limit with 400', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'admin_123' });
    firestoreDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        role: 'ADMIN',
        status: 'ACTIVE',
      }),
    });

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer valid_admin_token')
      .send({
        folder: 'QUIZ',
        fileSize: 600 * 1024, // 600 KB > 500 KB
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('allows image within 500 KB limit', async () => {
    firebaseAuth.verifyIdToken.mockResolvedValue({ uid: 'admin_123' });
    firestoreDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({
        role: 'ADMIN',
        status: 'ACTIVE',
      }),
    });

    const res = await request(app)
      .post('/api/cloudinary/signature')
      .set('Authorization', 'Bearer valid_admin_token')
      .send({
        folder: 'QUIZ',
        fileSize: 400 * 1024, // 400 KB <= 500 KB
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
