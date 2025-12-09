// === TELEtext Radio ===
// Simula radio en vivo, sin mostrar números de canciones

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = new Audio(); // Solo un reproductor
let playlistLoaded = false;
let isFirstPlay = true;

// Elementos de UI
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const statusIndicator = document.getElementById('statusIndicator');

// === Cargar playlist ===
fetch("playlist.json")
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    if (!data.tracks || !Array.isArray(data.tracks)) {
      throw new Error("Formato inválido de playlist.json");
    }
    
    playlist = data.tracks;
    console.log("Playlist cargada:", playlist.length, "canciones");
    playlistLoaded = true;
    
    // Mezclar aleatoriamente
    shufflePlaylist();
    
    // Cargar primera canción (pero no reproducir aún)
    if (playlist.length > 0) {
      loadTrack(currentIndex);
    }
  })
  .catch(error => {
    console.error("Error cargando playlist:", error);
    // Playlist por defecto
    playlist = ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    shufflePlaylist();
    if (playlist.length > 0) {
      loadTrack(currentIndex);
    }
  });

// === Mezclar playlist ===
function shufflePlaylist() {
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
  console.log("Playlist mezclada");
}

// === Cargar canción (sin reproducir) ===
function loadTrack(index) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  const fullPath = track.startsWith('music/') ? track : 'music/' + track;
  
  console.log(`Cargando pista ${index + 1}`);
  
  // Configurar audio
  audio.src = fullPath;
  audio.volume = 1;
  audio.crossOrigin = "anonymous";
  
  // Remover listeners previos para evitar duplicados
  audio.removeEventListener('ended', handleTrackEnd);
  audio.removeEventListener('error', handleAudioError);
  
  // Configurar listeners
  audio.addEventListener('ended', handleTrackEnd);
  audio.addEventListener('error', handleAudioError);
  
  // Inicio aleatorio solo en la primera canción al reproducir
  if (isFirstPlay) {
    audio.addEventListener('loadedmetadata', function onLoaded() {
      audio.removeEventListener('loadedmetadata', onLoaded);
      if (audio.duration > 60) {
        const randomStart = Math.random() * (audio.duration - 60);
        audio.currentTime = randomStart;
        console.log(`Inicio aleatorio: ${Math.round(randomStart)}s`);
      }
    }, { once: true });
  }
}

// === Manejar fin de canción ===
function handleTrackEnd() {
  console.log("Canción terminada, pasando a la siguiente");
  playNextTrack();
}

// === Manejar errores ===
function handleAudioError(e) {
  console.error("Error de audio:", audio.error);
  setTimeout(playNextTrack, 2000);
}

// === Reproducir siguiente canción ===
function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  console.log(`Siguiente pista: ${nextIndex + 1}`);
  
  // Fade out
  if (audio.volume > 0) {
    let volume = audio.volume;
    const fadeOut = setInterval(() => {
      volume -= 0.1;
      audio.volume = Math.max(0, volume);
      if (volume <= 0) {
        clearInterval(fadeOut);
        loadAndPlayTrack(nextIndex);
      }
    }, 50);
  } else {
    loadAndPlayTrack(nextIndex);
  }
}

// === Cargar y reproducir ===
function loadAndPlayTrack(index) {
  loadTrack(index);
  
  // Reproducir
  audio.play().then(() => {
    isPlaying = true;
    isFirstPlay = false;
    updateUI();
    console.log("Reproduciendo");
  }).catch(err => {
    console.error("Error al reproducir:", err);
    // Si hay error, intentar con la siguiente
    setTimeout(() => playNextTrack(), 1000);
  });
}

// === Play/Pause ===
function togglePlayPause() {
  if (!playlistLoaded) return;
  
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    // Si es la primera vez, ya la canción está cargada con inicio aleatorio
    audio.play().then(() => {
      isPlaying = true;
      isFirstPlay = false;
    }).catch(err => {
      console.error("Error al reproducir:", err);
    });
  }
  updateUI();
}

// === Actualizar UI ===
function updateUI() {
  if (isPlaying) {
    playPauseBtn.textContent = "⏸️ PAUSA";
    statusIndicator.textContent = "En vivo";
  } else {
    playPauseBtn.textContent = "▶️ PLAY";
    statusIndicator.textContent = "Pausado";
  }
}

// === Asignar eventos a los botones ===
playPauseBtn.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', playNextTrack);

// === Iniciar al hacer clic en cualquier parte (solo primera vez) ===
document.addEventListener('click', function initPlayback() {
  if (!isPlaying && playlistLoaded) {
    togglePlayPause();
  }
}, { once: true });

// === Monitoreo: si el audio se pausa inesperadamente, reintentar ===
setInterval(() => {
  if (playlistLoaded && isPlaying && audio.paused && !audio.ended) {
    console.warn("Audio pausado inesperadamente, reintentando...");
    audio.play().catch(err => {
      console.error("No se pudo reanudar, pasando a siguiente:", err);
      playNextTrack();
    });
  }
}, 3000);

console.log("Radio Teletext - Modo radio en vivo");
