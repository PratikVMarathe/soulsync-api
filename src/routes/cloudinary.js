import { Router } from 'express';
import { authenticateAdmin } from '../middleware/authenticateAdmin.js';
import { generateUploadSignature } from '../services/cloudinaryService.js';

const router = Router();

router.post('/signature', authenticateAdmin, (req, res) => {
  try {
    const { fileSize, folder, folderType } = req.body || {};
    const requestedFolder = folder || folderType;

    const signatureData = generateUploadSignature({
      fileSize,
      folderKey: requestedFolder,
    });

    return res.status(200).json({
      success: true,
      ...signatureData,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'INTERNAL_ERROR';
    const message = error.message || 'Failed to generate upload signature.';

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message,
      },
    });
  }
});

export default router;
