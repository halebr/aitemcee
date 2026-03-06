import { b } from '../../baml_client';

export async function generateStyle(
  abstract: string,
  bio: string,
  guiltyPleasureSong: string,
  guiltyPleasureArtist: string
) {
  const result = await b.GenerateStyle(abstract, bio, guiltyPleasureSong, guiltyPleasureArtist);
  return { style: result.style, title: result.title };
}

export async function generateLyrics(
  style: string,
  title: string,
  abstract: string,
  bio: string
) {
  const result = await b.GenerateLyrics(style, title, abstract, bio);
  return { lyrics: result.lyrics };
}
