import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import styleRouter from './routes/style.js';
import lyricsRouter from './routes/lyrics.js';
import songsRouter from './routes/songs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/style', styleRouter);
app.use('/api/lyrics', lyricsRouter);
app.use('/api/songs', songsRouter);

app.use(errorHandler as any);

app.listen(PORT, () => {
  console.log(`aitemcee server listening on http://localhost:${PORT}`);
});
