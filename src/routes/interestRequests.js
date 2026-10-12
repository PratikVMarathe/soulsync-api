import { Router } from 'express';
import admin, { firestoreDb } from '../config/firebaseAdmin.js';
import brevoEmailService from '../services/brevoEmailService.js';

const router = Router();

const INTEREST_REQUESTS_COLLECTION = 'interestRequests';

/**
 * Normalizes phone number to 10-digit format if valid
 */
function normalizePhone(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(2, 12);
  if (digits.length > 10 && digits.startsWith('0')) return digits.slice(1, 11);
  return digits;
}

/**
 * Persists the interest request in Firestore
 */
async function saveInterestRequest(data) {
  const collectionRef = firestoreDb.collection(INTEREST_REQUESTS_COLLECTION);
  const docRef = data.requestId ? collectionRef.doc(data.requestId) : collectionRef.doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const docPayload = {
    userId: data.userId || null,
    satsangCentralId: data.satsangCentralId || '',
    opportunityTitle: data.opportunityTitle || 'Bhagavad Gita Class',
    category: data.category || 'CLASS',
    name: data.name,
    email: data.email || '',
    phoneNumber: data.phoneNumber,
    age: data.age,
    passion: data.passion,
    institutionName: data.institutionName,
    mode: data.mode,
    language: data.language,
    preferredDay: data.preferredDay,
    description: data.description || '',
    status: 'NEW',
    requestedAt: now,
    updatedAt: now,
  };

  // Wrap in a 4-second timeout so Firestore Admin never hangs or causes client AbortController to cancel
  await Promise.race([
    docRef.set(docPayload, { merge: true }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('FIRESTORE_WRITE_TIMEOUT')), 4000)),
  ]);

  return docRef.id;
}

/**
 * POST /api/interest-requests
 * Handles Gita Class interest submissions, saving to Firestore
 * and dispatching transactional email to admin via Brevo.
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      age,
      passion,
      institutionName,
      mode,
      language,
      preferredDay,
      description,
      opportunityTitle,
      satsangCentralId,
      userId,
      requestId,
      category,
    } = req.body || {};

    // 1. Validation
    const cleanName = (name || '').trim();
    if (!cleanName) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name is required.' },
      });
    }

    const cleanPhone = normalizePhone(phoneNumber);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid 10-digit phone number is required.' },
      });
    }

    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid positive age is required.' },
      });
    }

    const cleanInstitution = (institutionName || '').trim();
    if (!cleanInstitution) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Institution / Organization name is required.' },
      });
    }

    const cleanDay = (preferredDay || '').trim();
    if (!cleanDay) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Preferred day is required.' },
      });
    }

    const payload = {
      age: parsedAge,
      category: category || 'CLASS',
      description: (description || '').trim(),
      email: (email || '').trim().toLowerCase(),
      institutionName: cleanInstitution,
      language: (language || 'ENGLISH').trim(),
      mode: (mode || 'ONLINE').trim(),
      name: cleanName,
      opportunityTitle: opportunityTitle || 'Bhagavad Gita Class',
      passion: (passion || 'STUDENT').trim().toUpperCase(),
      phoneNumber: cleanPhone,
      preferredDay: cleanDay,
      requestId: requestId || undefined,
      satsangCentralId: satsangCentralId || '',
      userId: userId || null,
    };

    // 2. Save to Firestore (source of truth)
    let savedId = requestId;
    try {
      savedId = await saveInterestRequest(payload);
    } catch (firestoreError) {
      console.warn('[InterestRequests] Could not persist/merge in Firestore via admin SDK:', firestoreError.message);
      // If requestId was not provided (direct API invocation), failure to persist is a fatal DATABASE_ERROR
      // If requestId was already provided (client already saved to Firestore), proceed to Brevo notification!
      if (!requestId) {
        return res.status(500).json({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to record your interest request. Please try again.' },
        });
      }
    }

    // 3. Dispatch transactional email via Brevo
    // Critical Failure Behavior: Brevo failure must NEVER fail the user request!
    let emailStatus = { sent: false, warning: null };
    try {
      const emailResult = await brevoEmailService.sendGitaInterestNotification({
        ...payload,
        requestId: savedId,
      });
      emailStatus = { sent: Boolean(emailResult?.success), warning: emailResult?.reason || null };
    } catch (emailError) {
      emailStatus = { sent: false, warning: emailError.message };
      // Log Brevo failure, but proceed with successful response
      console.error('[InterestRequests] Brevo notification delivery failed:', emailError.message);
    }

    // 4. Always return success if Firestore recorded the request
    return res.status(200).json({
      success: true,
      requestId: savedId,
      emailSent: emailStatus.sent,
      ...(emailStatus.warning ? { emailWarning: emailStatus.warning } : {}),
      message: 'Interest request recorded successfully.',
    });
  } catch (error) {
    console.error('[InterestRequests] Unexpected handler error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred.' },
    });
  }
});

export default router;
