const UI = {
  showStep(n) {
    document.querySelectorAll('.step').forEach((el) => el.classList.remove('active'));
    const step = document.getElementById(`step-${n}`);
    if (step) step.classList.add('active');
  },

  showLoading(message) {
    document.getElementById('loading-message').textContent = message;
    document.getElementById('loading-overlay').classList.remove('hidden');
  },

  hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
  },

  showError(stepNum, message) {
    const el = document.getElementById(`step${stepNum}-error`);
    if (el) el.textContent = message;
  },

  clearError(stepNum) {
    const el = document.getElementById(`step${stepNum}-error`);
    if (el) el.textContent = '';
  },

  clearAllErrors() {
    document.querySelectorAll('.error-message').forEach((el) => (el.textContent = ''));
  },

  showProgress(message) {
    document.getElementById('generation-progress').style.display = 'block';
    document.getElementById('progress-message').textContent = message;
    document.getElementById('audio-result').classList.add('hidden');
  },

  showAudioResult(title, audioUrl) {
    document.getElementById('generation-progress').style.display = 'none';
    document.getElementById('audio-result').classList.remove('hidden');
    document.getElementById('song-title-display').textContent = title;

    const player = document.getElementById('audio-player');
    player.src = audioUrl;

    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.href = audioUrl;
    downloadBtn.download = `${title}.mp3`;
  },

  addToHistory(song) {
    const section = document.getElementById('song-history');
    section.classList.remove('hidden');

    const list = document.getElementById('history-list');
    const li = document.createElement('li');
    li.id = `history-${song.songId}`;

    const isReady = song.status === 'complete' && song.audioUrl;

    li.innerHTML = `
      <button class="history-play-btn ${isReady ? 'ready' : ''}"
              data-song-id="${song.songId}"
              data-audio-url="${song.audioUrl || ''}"
              ${!isReady ? 'disabled' : ''}>
        ${isReady ? '\u25B6' : '\u25CB'}
      </button>
      <span class="history-title">${song.title || 'Untitled'}</span>
      <span class="history-status ${song.status === 'complete' ? 'complete' : ''}">${song.status}</span>
    `;

    list.prepend(li);
  },

  updateHistoryItem(songId, status, audioUrl) {
    const li = document.getElementById(`history-${songId}`);
    if (!li) return;

    const btn = li.querySelector('.history-play-btn');
    const statusEl = li.querySelector('.history-status');

    statusEl.textContent = status;
    if (status === 'complete') {
      statusEl.classList.add('complete');
      btn.classList.add('ready');
      btn.disabled = false;
      btn.textContent = '\u25B6';
      btn.dataset.audioUrl = audioUrl || '';
    }
  },
};
