class StyleResult {
  title string @description("A catchy, short song title (3-6 words)")
  style string @description("Comma-separated music style description under 200 characters, e.g. 'upbeat pop rock, catchy guitar riff, energetic drums, anthemic chorus'")
}

function GenerateStyle(abstract: string, bio: string, guilty_pleasure_song: string, guilty_pleasure_artist: string) -> StyleResult {
  client ClaudeSonnet
  prompt #"
    You are a creative music producer who specializes in making fun, catchy
    conference walk-on songs for tech speakers.

    A speaker is about to give a presentation. Create a music style description
    and song title for a short AI walk-on song.

    The style should be inspired by their guilty pleasure song/artist but
    adapted to feel like a fun conference intro. Keep the style description
    as comma-separated musical descriptors (genre, instruments, mood, tempo).
    Maximum 200 characters for the style field.

    The title should be catchy and relate to their talk topic.

    SPEAKER'S TALK ABSTRACT:
    {{ abstract }}

    SPEAKER BIO:
    {{ bio }}

    GUILTY PLEASURE SONG: {{ guilty_pleasure_song }}
    GUILTY PLEASURE ARTIST: {{ guilty_pleasure_artist }}

    {{ ctx.output_format }}
  "#
}

class LyricsResult {
  lyrics string @description("Song lyrics, max 500 characters. Short, punchy, conference-appropriate. Include newlines between lines.")
}

function GenerateLyrics(style: string, title: string, abstract: string, bio: string) -> LyricsResult {
  client ClaudeSonnet
  prompt #"
    You are a witty songwriter writing lyrics for a short conference
    walk-on song (about 30 seconds long).

    The lyrics should be fun, energetic, and reference the speaker's
    talk topic. Keep them SHORT -- this is a walk-on song, not a full
    track. Maximum 500 characters total. Use newlines between lines.

    Do NOT include explicit, offensive, or inappropriate content.
    Keep it professional but fun -- think "conference hype music."

    MUSIC STYLE: {{ style }}
    SONG TITLE: {{ title }}

    TALK ABSTRACT:
    {{ abstract }}

    SPEAKER BIO:
    {{ bio }}

    {{ ctx.output_format }}
  "#
}
