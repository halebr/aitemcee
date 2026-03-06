import { Router, Request, Response, NextFunction } from 'express';
import * as songStore from '../services/songStore.js';
import * as suno from '../services/suno.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, lyrics, style } = req.body;

    if (!lyrics || !style) {
      throw createError('lyrics and style are required', {
        type: 'OUTPUT_VALIDATION_ERROR',
        step: 'music',
        status: 400,
        retryable: false,
      });
    }

    const entry = songStore.create({ style, lyrics, title: title || 'Untitled' });

    // Fire off Suno generation asynchronously
    (async () => {
      try {
        songStore.update(entry.songId, { status: 'generating' });
        const { taskId } = await suno.generate({ title: entry.title, lyrics, style });
        songStore.update(entry.songId, { taskId, status: 'polling' });

        const result = await suno.pollUntilComplete(taskId, (status) => {
          songStore.update(entry.songId, { status });
        });

        songStore.update(entry.songId, {
          status: 'complete',
          audioUrl: result.audioUrl,
        });
      } catch (err: any) {
        console.error(`Song generation failed for ${entry.songId}:`, err.message);
        songStore.update(entry.songId, {
          status: 'error',
          error: err.message,
        });
      }
    })();

    res.json({ songId: entry.songId, status: entry.status });
  } catch (err: any) {
    if (err.type) return next(err);
    next(createError(err.message || 'Failed to start song generation', { type: 'PROVIDER_ERROR', step: 'music' }));
  }
});

router.get('/:songId', (req: Request, res: Response, next: NextFunction) => {
  const entry = songStore.get(req.params.songId);
  if (!entry) {
    return next(createError('Song not found', { type: 'OUTPUT_VALIDATION_ERROR', step: 'poll', status: 404, retryable: false }));
  }

  const response: any = { songId: entry.songId, status: entry.status };
  if (entry.audioUrl) response.audioUrl = entry.audioUrl;
  if (entry.error) response.error = entry.error;
  res.json(response);
});

router.get('/:songId/audio', (req: Request, res: Response, next: NextFunction) => {
  const entry = songStore.get(req.params.songId);
  if (!entry) {
    return next(createError('Song not found', { type: 'OUTPUT_VALIDATION_ERROR', step: 'audio', status: 404, retryable: false }));
  }
  if (!entry.audioUrl) {
    return next(createError('Audio not yet available', { type: 'PROVIDER_ERROR', step: 'audio', status: 404, retryable: true }));
  }
  res.redirect(302, entry.audioUrl);
});

export default router;
