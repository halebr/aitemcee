const SUNO_BASE = 'https://api.sunoapi.org';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
  };
}

export async function generate({ title, lyrics, style }: { title: string; lyrics: string; style: string }) {
  const res = await fetch(`${SUNO_BASE}/api/v1/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      prompt: lyrics,
      style,
      title,
      model: 'V4_5',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Suno generate failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(`Suno generate error: ${data.msg}`);
  }
  return { taskId: data.data.taskId };
}

export async function getStatus(taskId: string) {
  const res = await fetch(`${SUNO_BASE}/api/v1/query?taskId=${encodeURIComponent(taskId)}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Suno poll failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data;
}

export async function pollUntilComplete(
  taskId: string,
  onUpdate: (status: string) => void,
  intervalMs = 5000,
  maxAttempts = 60
) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const result = await getStatus(taskId);

    if (result.code === 200 && result.data) {
      const songs = Array.isArray(result.data) ? result.data : [result.data];
      const firstSong = songs[0];

      if (firstSong?.audio_url) {
        onUpdate('complete');
        return {
          status: 'complete',
          audioUrl: firstSong.audio_url,
          imageUrl: firstSong.image_url || null,
        };
      }

      if (firstSong?.status === 'failed') {
        onUpdate('error');
        throw new Error('Suno generation failed');
      }
    }

    onUpdate('polling');
  }

  throw new Error('Suno generation timed out');
}
