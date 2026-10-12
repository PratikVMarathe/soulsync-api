import { describe, expect, it } from 'vitest';
import { generateGitaInterestEmail } from '../src/templates/gitaInterestEmail.js';

describe('gitaInterestEmail Template', () => {
  it('generates compliant HTML with all required fields', () => {
    const html = generateGitaInterestEmail({
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

    expect(html).toContain('AVISHKAR SHINDE');
    expect(html).toContain('19 yrs');
    expect(html).toContain('STUDENT:');
    expect(html).toContain('Jscoe Hadapsar');
    expect(html).toContain('ONLINE');
    expect(html).toContain('ENGLISH');
    expect(html).toContain('Day: SATURDAY');
    expect(html).toContain('avishkar2007@gmail.com');
    expect(html).toContain('9022073536');
    expect(html).toContain('View All Interested Users');
    expect(html).toContain('https://soulsync-dev-host.web.app/admin/mandala');
  });

  it('handles PROFESSIONAL passion correctly', () => {
    const html = generateGitaInterestEmail({
      name: 'Rohan Sharma',
      age: 28,
      passion: 'PROFESSIONAL',
      institutionName: 'Infosys Pune',
      mode: 'OFFLINE',
      language: 'HINDI',
      preferredDay: 'SUNDAY',
      email: 'rohan@example.com',
      phoneNumber: '9876543210',
    });

    expect(html).toContain('ROHAN SHARMA');
    expect(html).toContain('28 yrs');
    expect(html).toContain('PROFESSIONAL:');
    expect(html).toContain('Infosys Pune');
    expect(html).toContain('OFFLINE');
    expect(html).toContain('HINDI');
    expect(html).toContain('Day: SUNDAY');
  });

  it('handles OTHER passion and optional description', () => {
    const html = generateGitaInterestEmail({
      name: 'Anita Verma',
      age: 45,
      passion: 'OTHER',
      institutionName: 'Homemaker and yoga practitioner',
      mode: 'ONLINE',
      language: 'ENGLISH',
      preferredDay: 'WEEKEND',
      phoneNumber: '9123456780',
      description: 'Looking forward to the philosophy discourse.',
    });

    expect(html).toContain('ANITA VERMA');
    expect(html).toContain('45 yrs');
    expect(html).toContain('OTHER:');
    expect(html).toContain('Homemaker and yoga practitioner');
    expect(html).toContain('Looking forward to the philosophy discourse.');
    expect(html).toContain('Not provided'); // for email
  });
});
