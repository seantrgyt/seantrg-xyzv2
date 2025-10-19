// nowplaying.js
// Drop this file in the site root and add <script src="nowplaying.js"></script> before </body>

(function () {
  const LASTFM_USERNAME = 'seantrg';
  const API_KEY = '353376c2e5b54458820bdf63ece2a289';
  const POLL_INTERVAL_MS = 15000; // 15s

  const artEl = document.getElementById('now-playing-art');
  const titleEl = document.getElementById('now-playing-title');
  const artistEl = document.getElementById('now-playing-artist');
  const linkEl = document.getElementById('now-playing-link');
  const container = document.getElementById('now-playing');

  if (!artEl || !titleEl || !artistEl || !linkEl || !container) {
    // Elements not found; nothing to do
    return;
  }

  function setIdle() {
    container.classList.add('now-playing--idle');
    artEl.src = '';
    artEl.alt = 'No track';
    titleEl.textContent = 'Not playing';
    artistEl.textContent = '';
    linkEl.href = '#';
  }

  function setTrack(track) {
    container.classList.remove('now-playing--idle');
    const image = track.image || '';
    artEl.src = image || '';
    artEl.alt = track.name || 'Album art';
    titleEl.textContent = track.name || 'Unknown title';
    artistEl.textContent = track.artist || 'Unknown artist';
    linkEl.href = track.url || '#';
  }

  async function fetchNowPlaying() {
    try {
      const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(LASTFM_USERNAME)}&api_key=${encodeURIComponent(API_KEY)}&format=json&limit=1`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Network error');
      }
      const data = await res.json();
      const tracks = data?.recenttracks?.track;
      if (!tracks || tracks.length === 0) {
        setIdle();
        return;
      }
      const track = Array.isArray(tracks) ? tracks[0] : tracks;
      // Last.fm uses '#text' fields for some nested properties
      const name = track.name || '';
      const artist = track.artist?.['#text'] || track.artist || '';
      // pick a medium image: sizes array usually has multiple; fallback logic:
      let imageUrl = '';
      if (Array.isArray(track.image)) {
        // prefer 'medium' or 'extralarge' if available; otherwise pick last non-empty
        for (let i = 0; i < track.image.length; i++) {
          const img = track.image[i]['#text'] || '';
          if (img) imageUrl = img;
        }
      } else if (track.image && typeof track.image === 'string') {
        imageUrl = track.image;
      }
      const urlTrack = track.url || '#';
      // Determine now playing attr
      const nowPlaying = !!(track['@attr'] && track['@attr'].nowplaying === 'true');

      setTrack({
        name,
        artist,
        image: imageUrl,
        url: urlTrack,
        nowPlaying
      });
    } catch (err) {
      console.warn('NowPlaying error:', err);
      setIdle();
    }
  }

  // initial fetch + polling
  fetchNowPlaying();
  setInterval(fetchNowPlaying, POLL_INTERVAL_MS);
})();
