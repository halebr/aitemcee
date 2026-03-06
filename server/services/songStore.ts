import { v4 as uuidv4 } from 'uuid';

export interface SongEntry {
  songId: string;
  taskId: string | null;
  status: string;
  style: string;
  lyrics: string;
  title: string;
  audioUrl: string | null;
  error: string | null;
  createdAt: number;
}

const songs = new Map<string, SongEntry>();

export function create({ style, lyrics, title }: { style: string; lyrics: string; title: string }): SongEntry {
  const songId = uuidv4();
  const entry: SongEntry = {
    songId,
    taskId: null,
    status: 'pending',
    style,
    lyrics,
    title,
    audioUrl: null,
    error: null,
    createdAt: Date.now(),
  };
  songs.set(songId, entry);
  return entry;
}

export function get(songId: string): SongEntry | null {
  return songs.get(songId) || null;
}

export function update(songId: string, fields: Partial<SongEntry>): SongEntry | null {
  const entry = songs.get(songId);
  if (!entry) return null;
  Object.assign(entry, fields);
  return entry;
}
