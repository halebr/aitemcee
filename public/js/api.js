const API = {
  async postStyle(data) {
    return this._post('/api/style', data);
  },

  async postLyrics(data) {
    return this._post('/api/lyrics', data);
  },

  async postSong(data) {
    return this._post('/api/songs', data);
  },

  async getSongStatus(songId) {
    const res = await fetch(`/api/songs/${songId}`);
    const json = await res.json();
    if (!res.ok) throw json.error || { message: 'Request failed' };
    return json;
  },

  async _post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw json.error || { message: 'Request failed' };
    return json;
  },
};
