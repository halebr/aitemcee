import { Router, Request, Response, NextFunction } from 'express';
import { generateLyrics } from '../services/baml.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { style, title, abstract, bio } = req.body;

    if (!style || !title || !abstract || !bio) {
      throw createError('All fields are required: style, title, abstract, bio', {
        type: 'OUTPUT_VALIDATION_ERROR',
        step: 'lyrics',
        status: 400,
        retryable: false,
      });
    }

    const result = await generateLyrics(style, title, abstract, bio);
    res.json(result);
  } catch (err: any) {
    if (err.type) return next(err);
    next(createError(err.message || 'Failed to generate lyrics', { type: 'BAML_ERROR', step: 'lyrics' }));
  }
});

export default router;
