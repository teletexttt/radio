// === TELEtext Radio - Radio en vivo 24hs ===

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = document.getElementById('radioPlayer');
let playlistLoaded = false;
let isFirstPlay = true;

// === Cargar playlist ===
fetch("playlist.json")
  .then(response => response.json())
  .then(data => {
    playlist = data.tracks || ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    shufflePlaylist();
    loadTrack(0);
  })
  .catch(() => {
    playlist = ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    shufflePlaylist();
    loadTrack(0);
  });

function shufflePlaylist() {
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
}

function loadTrack(index) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  const fullPath = track.startsWith('music/') ? track : 'music/' + track;
  
  audio.pause();
  audio.src = fullPath;
  audio.volume = 1;
  
  // SOLO inicio aleatorio si NO hay estado guardado
  audio.onloadedmetadata = () => {
    const saved = localStorage.getItem('radio_state');
    
    if (saved) {
      // Ya tenemos tiempo guardado, mantenerlo
      localStorage.removeItem('radio_state');
    } else if (isFirstPlay && audio.duration > 60) {
      audio.currentTime = Math.random() * (audio.duration - 60);
      isFirstPlay = false;
    } else {
      audio.currentTime = 0;
    }
  };
  
  audio.onended = () => setTimeout(playNextTrack, 500);
  audio.onerror = () => setTimeout(playNextTrack, 2000);
}

function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  
  // Fade out simple
  const fadeOut = setInterval(() => {
    if (audio.volume > 0.1) {
      audio.volume -= 0.1;
    } else {
      clearInterval(fadeOut);
      loadTrack(nextIndex);
      audio.play().then(() => {
        isPlaying = true;
      }).catch(() => playNextTrack());
    }
  }, 50);
}

// === Iniciar con clic en cualquier parte ===
document.addEventListener('click', () => {
  if (!isPlaying && playlistLoaded) {
    if (!audio.src) loadTrack(currentIndex);
    audio.play().then(() => isPlaying = true);
  }
}, { once: true });

// === Monitoreo automático ===
setInterval(() => {
  if (isPlaying && audio.paused && !audio.ended) {
    audio.play().catch(() => playNextTrack());
  }
}, 3000);



