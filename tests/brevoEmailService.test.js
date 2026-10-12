import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendGitaInterestNotification } from '../src/services/brevoEmailService.js';

describe('brevoEmailService', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('skips dispatch safely when BREVO_API_KEY is not configured', async () => {
    delete process.env.BREVO_API_KEY;

    const result = await sendGitaInterestNotification({
      name: 'Test User',
      age: 22,
      passion: 'STUDENT',
      institutionName: 'Test College',
      mode: 'ONLINE',
      language: 'ENGLISH',
      preferredDay: 'SATURDAY',
      email: 'test@example.com',
      phoneNumber: '9876543210',
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('MISSING_API_KEY');
  });

  it('successfully sends email via Brevo REST API when credentials are set', async () => {
    process.env.BREVO_API_KEY = 'test-brevo-key-123';
    process.env.BREVO_SENDER_EMAIL = 'noreply@soulsync.com';
    process.env.BREVO_SENDER_NAME = 'SoulSync';
    process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@soulsync.com';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: '<test-message-id-999@brevo.com>' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendGitaInterestNotification({
      name: 'Avishkar Shinde',
      age: 19,
      passion: 'STUDENT',
      institutionName: 'Jscoe Hadapsar',
      mode: 'ONLINE',
      language: 'ENGLISH',
      preferredDay: 'SATURDAY',
      email: 'avishkar2007@gmail.com',
      phoneNumber: '9022073536',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(options.method).toBe('POST');
    expect(options.headers['api-key']).toBe('test-brevo-key-123');

    const body = JSON.parse(options.body);
    expect(body.sender.email).toBe('noreply@soulsync.com');
    expect(body.to).toEqual([{ email: 'admin@soulsync.com' }]);
    expect(body.subject).toBe('New Gita Class Interest — Avishkar Shinde');
    expect(body.htmlContent).toContain('AVISHKAR SHINDE');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('<test-message-id-999@brevo.com>');
  });

  it('throws descriptive error when Brevo API responds with non-2xx status', async () => {
    process.env.BREVO_API_KEY = 'invalid-key';
    process.env.BREVO_SENDER_EMAIL = 'noreply@soulsync.com';
    process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@soulsync.com';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Key not found' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(sendGitaInterestNotification({
      name: 'Avishkar Shinde',
      phoneNumber: '9022073536',
    })).rejects.toThrow('Brevo API error 401: {"message":"Key not found"}');
  });
});
