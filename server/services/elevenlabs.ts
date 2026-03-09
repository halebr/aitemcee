import { writeFile } from 'fs/promises';
import path from 'path';

const ELEVENLABS_BASE = 'https://api.elevenlabs.io';

const AUDIO_DIR = path.resolve('public/audio');

export async function generate({
  songId,
  title,
  lyrics,
  style,
}: {
  songId: string;
  title: string;
  lyrics: string;
  style: string;
}) {
  const prompt = `Style: ${style}, prominent lead vocals, vocals forward in mix\nTitle: ${title}\n\n[Verse - start vocals immediately, no instrumental intro, vocals loud and clear]\n${lyrics}`;

  const res = await fetch(`${ELEVENLABS_BASE}/v1/music`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
    },
    body: JSON.stringify({
      prompt,
      duration_ms: 30000,
      model: 'eleven_music',
      output_format: 'mp3_44100_128',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs generate failed (${res.status}): ${text}`);
  }

  // API returns MP3 audio directly as binary
  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = `${songId}.mp3`;
  await writeFile(path.join(AUDIO_DIR, filename), buffer);

  return { audioUrl: `/audio/${filename}` };
}
