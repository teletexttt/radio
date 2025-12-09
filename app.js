// === TELEtext Radio - Versión con display de tiempo ===

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio;
let playlistLoaded = false;
let isFirstPlay = true;

// Elementos de la interfaz
let playPauseBtn;
let timeDisplay;

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
  
  if (!audio) {
    audio = new Audio();
    audio.crossOrigin = "anonymous";
    // Configurar eventos de tiempo
    audio.ontimeupdate = updateTimeDisplay;
  }
  
  audio.pause();
  audio.src = fullPath;
  audio.volume = 1;
  
  // Inicio aleatorio solo en primera canción
  audio.onloadedmetadata = () => {
    if (isFirstPlay && audio.duration > 60) {
      audio.currentTime = Math.random() * (audio.duration - 60);
      isFirstPlay = false;
    } else {
      audio.currentTime = 0;
    }
    updateTimeDisplay(); // Actualizar display con los nuevos tiempos
  };
  
  audio.onended = () => {
    setTimeout(playNextTrack, 500);
  };
  
  audio.onerror = () => {
    setTimeout(playNextTrack, 2000);
  };
}

function updateTimeDisplay() {
  if (!timeDisplay || !audio) return;
  
  const current = formatTime(audio.currentTime);
  const total = formatTime(audio.duration || 0);
  timeDisplay.textContent = `${current}/${total}`;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
        playPauseBtn.textContent = "⏸️";
      }).catch(() => playNextTrack());
    }
  }, 50);
}

// === Inicializar controles ===
document.addEventListener('DOMContentLoaded', () => {
  playPauseBtn = document.getElementById('playPauseBtn');
  timeDisplay = document.getElementById('timeDisplay');
  
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
  }
});

function togglePlayPause() {
  if (!audio) return;
  
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = "▶️";
  } else {
    if (audio.src) {
      audio.play().then(() => {
        isPlaying = true;
        playPauseBtn.textContent = "⏸️";
      });
    } else if (playlistLoaded) {
      loadTrack(currentIndex);
      audio.play().then(() => {
        isPlaying = true;
        playPauseBtn.textContent = "⏸️";
      });
    }
  }
}

// === Iniciar con clic en página ===
document.addEventListener('click', () => {
  if (!isPlaying && playlistLoaded) {
    if (!audio || !audio.src) loadTrack(currentIndex);
    audio.play().then(() => {
      isPlaying = true;
      playPauseBtn.textContent = "⏸️";
    });
  }
}, { once: true });

// === Monitoreo automático ===
setInterval(() => {
  if (isPlaying && audio && audio.paused && !audio.ended) {
    audio.play().catch(() => playNextTrack());
  }
}, 3000);

