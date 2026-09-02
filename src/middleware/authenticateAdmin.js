import { firebaseAuth, firestoreDb } from '../config/firebaseAdmin.js';

export async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing or malformed authorization header.',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid Firebase authentication token.',
        },
      });
    }

    // Query Firestore for the user's profile to verify trusted role
    const userDoc = await firestoreDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No admin profile found for this authenticated user.',
        },
      });
    }

    const userData = userDoc.data();
    const role = (userData?.role || '').toUpperCase();
    const status = (userData?.status || '').toUpperCase();
    const isDeleted = Boolean(userData?.isDeleted);

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin or Super Admin access required.',
        },
      });
    }

    if (status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'This admin account has been blocked.',
        },
      });
    }

    if (status === 'SOFT_DELETED' || isDeleted) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'This admin account has been deactivated or removed.',
        },
      });
    }

    req.user = {
      uid,
      email: decodedToken.email || userData.email || '',
      role,
      status,
      name: userData.name || '',
    };

    return next();
  } catch (error) {
    if (
      error.code === 'auth/id-token-expired'
      || error.code === 'auth/id-token-revoked'
      || error.code === 'auth/invalid-id-token'
      || error.code === 'auth/argument-error'
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired Firebase ID token.',
        },
      });
    }

    console.error('Authentication middleware error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed.',
      },
    });
  }
}
