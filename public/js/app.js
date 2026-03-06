document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentStep = 1;
  let sessionData = loadSession();

  // Elements
  const abstractInput = document.getElementById('abstract-input');
  const bioInput = document.getElementById('bio-input');
  const songInput = document.getElementById('song-input');
  const artistInput = document.getElementById('artist-input');
  const titleInput = document.getElementById('title-input');
  const styleInput = document.getElementById('style-input');
  const lyricsInput = document.getElementById('lyrics-input');

  const generateStyleBtn = document.getElementById('generate-style-btn');
  const generateLyricsBtn = document.getElementById('generate-lyrics-btn');
  const generateSongBtn = document.getElementById('generate-song-btn');
  const startOverBtn = document.getElementById('start-over-btn');

  // Toggle buttons for text/upload
  document.querySelectorAll('.input-toggle').forEach((toggle) => {
    toggle.querySelectorAll('.toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.form-group');
        parent.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('active'));
        parent.querySelectorAll('.input-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.add('active');
      });
    });
  });

  // File upload handlers
  setupFileUpload('abstract-file-input', 'abstract-input', 'abstract-file-status');
  setupFileUpload('bio-file-input', 'bio-input', 'bio-file-status');

  function setupFileUpload(fileInputId, textareaId, statusId) {
    document.getElementById(fileInputId).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const statusEl = document.getElementById(statusId);
      statusEl.textContent = 'Parsing...';
      statusEl.className = 'file-status';

      try {
        const text = await DocumentParser.parseFile(file);
        document.getElementById(textareaId).value = text;
        statusEl.textContent = `Extracted ${text.length} characters from ${file.name}`;
        validateStep1();
      } catch (err) {
        statusEl.textContent = err.message;
        statusEl.className = 'file-status error';
      }
    });
  }

  // Validation
  function validateStep1() {
    const abstract = abstractInput.value.trim();
    const bio = bioInput.value.trim();
    const song = songInput.value.trim();
    const artist = artistInput.value.trim();
    generateStyleBtn.disabled = !(abstract && bio && song && artist);
  }

  [abstractInput, bioInput, songInput, artistInput].forEach((el) => {
    el.addEventListener('input', validateStep1);
  });

  // Step 1: Generate Style
  generateStyleBtn.addEventListener('click', async () => {
    UI.clearError(1);
    UI.showLoading('Generating style description...');

    try {
      const result = await API.postStyle({
        abstract: abstractInput.value.trim(),
        bio: bioInput.value.trim(),
        guiltyPleasureSong: songInput.value.trim(),
        guiltyPleasureArtist: artistInput.value.trim(),
      });

      titleInput.value = result.title;
      styleInput.value = result.style;

      sessionData.abstract = abstractInput.value.trim();
      sessionData.bio = bioInput.value.trim();
      sessionData.guiltyPleasureSong = songInput.value.trim();
      sessionData.guiltyPleasureArtist = artistInput.value.trim();
      sessionData.title = result.title;
      sessionData.style = result.style;
      sessionData.step = 2;
      saveSession();

      UI.hideLoading();
      UI.showStep(2);
    } catch (err) {
      UI.hideLoading();
      UI.showError(1, err.message || 'Failed to generate style. Please try again.');
    }
  });

  // Step 2: Generate Lyrics
  generateLyricsBtn.addEventListener('click', async () => {
    UI.clearError(2);
    UI.showLoading('Generating lyrics...');

    try {
      const result = await API.postLyrics({
        style: styleInput.value.trim(),
        title: titleInput.value.trim(),
        abstract: sessionData.abstract,
        bio: sessionData.bio,
      });

      lyricsInput.value = result.lyrics;

      sessionData.title = titleInput.value.trim();
      sessionData.style = styleInput.value.trim();
      sessionData.lyrics = result.lyrics;
      sessionData.step = 3;
      saveSession();

      UI.hideLoading();
      UI.showStep(3);
    } catch (err) {
      UI.hideLoading();
      UI.showError(2, err.message || 'Failed to generate lyrics. Please try again.');
    }
  });

  // Step 3: Generate Song
  generateSongBtn.addEventListener('click', async () => {
    UI.clearError(3);
    UI.showStep(4);
    UI.showProgress('Starting song generation...');

    try {
      const result = await API.postSong({
        title: sessionData.title,
        lyrics: lyricsInput.value.trim(),
        style: sessionData.style,
      });

      sessionData.songId = result.songId;
      sessionData.lyrics = lyricsInput.value.trim();
      sessionData.step = 4;
      saveSession();

      UI.addToHistory({ songId: result.songId, title: sessionData.title, status: 'generating' });
      startPolling(result.songId);
    } catch (err) {
      UI.showError(4, err.message || 'Failed to start song generation.');
    }
  });

  // Polling
  let pollInterval = null;

  function startPolling(songId) {
    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
      try {
        const status = await API.getSongStatus(songId);
        UI.showProgress(`Status: ${status.status}...`);
        UI.updateHistoryItem(songId, status.status, status.audioUrl);

        if (status.status === 'complete' && status.audioUrl) {
          clearInterval(pollInterval);
          pollInterval = null;

          sessionData.audioUrl = status.audioUrl;
          saveSession();

          UI.showAudioResult(sessionData.title, status.audioUrl);
          UI.updateHistoryItem(songId, 'complete', status.audioUrl);
        }

        if (status.status === 'error') {
          clearInterval(pollInterval);
          pollInterval = null;
          UI.showError(4, status.error || 'Song generation failed.');
          UI.showProgress('Generation failed');
        }
      } catch (err) {
        // Keep polling on transient errors
        console.error('Poll error:', err);
      }
    }, 3000);
  }

  // Navigation
  document.getElementById('back-to-step1').addEventListener('click', () => UI.showStep(1));
  document.getElementById('back-to-step2').addEventListener('click', () => UI.showStep(2));

  startOverBtn.addEventListener('click', () => {
    if (pollInterval) clearInterval(pollInterval);
    sessionData = { step: 1 };
    saveSession();
    abstractInput.value = '';
    bioInput.value = '';
    songInput.value = '';
    artistInput.value = '';
    titleInput.value = '';
    styleInput.value = '';
    lyricsInput.value = '';
    generateStyleBtn.disabled = true;
    UI.clearAllErrors();
    UI.showStep(1);
  });

  // History play buttons
  document.getElementById('history-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.history-play-btn');
    if (!btn || btn.disabled) return;
    const audioUrl = btn.dataset.audioUrl;
    if (audioUrl) {
      const player = document.getElementById('audio-player');
      player.src = audioUrl;
      player.play();
    }
  });

  // Session persistence
  function saveSession() {
    sessionStorage.setItem('aitemcee_session', JSON.stringify(sessionData));
  }

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem('aitemcee_session')) || { step: 1 };
    } catch {
      return { step: 1 };
    }
  }

  // Restore session on load
  function restoreSession() {
    if (sessionData.step >= 2 && sessionData.title) {
      abstractInput.value = sessionData.abstract || '';
      bioInput.value = sessionData.bio || '';
      songInput.value = sessionData.guiltyPleasureSong || '';
      artistInput.value = sessionData.guiltyPleasureArtist || '';
      titleInput.value = sessionData.title || '';
      styleInput.value = sessionData.style || '';
      validateStep1();
    }

    if (sessionData.step >= 3 && sessionData.lyrics) {
      lyricsInput.value = sessionData.lyrics;
    }

    if (sessionData.step === 4 && sessionData.songId) {
      UI.showStep(4);

      if (sessionData.audioUrl) {
        UI.showAudioResult(sessionData.title, sessionData.audioUrl);
      } else {
        UI.showProgress('Resuming... checking song status');
        startPolling(sessionData.songId);
      }

      UI.addToHistory({
        songId: sessionData.songId,
        title: sessionData.title,
        status: sessionData.audioUrl ? 'complete' : 'generating',
        audioUrl: sessionData.audioUrl,
      });
    } else if (sessionData.step > 1) {
      UI.showStep(sessionData.step);
    }
  }

  restoreSession();
});
