import { Router, Request, Response, NextFunction } from 'express';
import { generateStyle } from '../services/baml.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { abstract, bio, guiltyPleasureSong, guiltyPleasureArtist } = req.body;

    if (!abstract || !bio || !guiltyPleasureSong || !guiltyPleasureArtist) {
      throw createError('All fields are required: abstract, bio, guiltyPleasureSong, guiltyPleasureArtist', {
        type: 'OUTPUT_VALIDATION_ERROR',
        step: 'style',
        status: 400,
        retryable: false,
      });
    }

    const result = await generateStyle(abstract, bio, guiltyPleasureSong, guiltyPleasureArtist);
    res.json(result);
  } catch (err: any) {
    if (err.type) return next(err);
    next(createError(err.message || 'Failed to generate style', { type: 'BAML_ERROR', step: 'style' }));
  }
});

export default router;
