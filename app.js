// === TELEtext Radio - Sistema CORREGIDO ===
// Inicio aleatorio SOLO en primera canción
// FIX: Sin doble audio, controles personalizados

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio; // Reproductor único
let playlistLoaded = false;
let isFirstPlay = true;

// Elementos de la interfaz
let playPauseBtn;
let nextBtn;
let statusIndicator;

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
    console.log("✅ Playlist cargada:", playlist.length, "canciones");
    playlistLoaded = true;
    
    // Mezclar aleatoriamente
    shufflePlaylist();
    
    // Inicializar controles
    initControls();
    
    // Cargar primera canción
    if (playlist.length > 0) {
      loadTrack(0);
    }
  })
  .catch(error => {
    console.error("❌ Error cargando playlist:", error);
    playlist = ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    shufflePlaylist();
    
    initControls();
    
    if (playlist.length > 0) {
      loadTrack(0);
    }
  });

// === Inicializar controles UI ===
function initControls() {
  playPauseBtn = document.getElementById('playPauseBtn');
  nextBtn = document.getElementById('nextBtn');
  statusIndicator = document.getElementById('statusIndicator');
  
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', playNextTrack);
  }
  
  // Crear reproductor único
  if (!audio) {
    audio = new Audio();
    audio.crossOrigin = "anonymous";
    console.log("🔊 Reproductor único creado");
  }
}

// === Mezclar playlist ===
function shufflePlaylist() {
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
  console.log("🔀 Playlist mezclada");
}

// === Cargar canción ===
function loadTrack(index) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  const fullPath = track.startsWith('music/') ? track : 'music/' + track;
  
  console.log(`🎵 Cargando: ${index + 1}/${playlist.length}`);
  
  if (!audio) return;
  
  // Pausar y limpiar listeners previos
  audio.pause();
  audio.removeEventListener('ended', handleTrackEnd);
  audio.removeEventListener('error', handleAudioError);
  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
  
  // Configurar nueva fuente
  audio.src = fullPath;
  audio.volume = 1;
  
  // Configurar listeners
  audio.addEventListener('ended', handleTrackEnd);
  audio.addEventListener('error', handleAudioError);
  audio.addEventListener('loadedmetadata', handleLoadedMetadata);
  
  // Actualizar UI
  updateStatus(`Cargando canción ${index + 1} de ${playlist.length}`);
}

// === Manejar metadatos cargados ===
function handleLoadedMetadata() {
  if (isFirstPlay && audio.duration > 60) {
    const randomStart = Math.random() * (audio.duration - 60);
    audio.currentTime = randomStart;
    console.log(`🎲 Inicio aleatorio: ${Math.round(randomStart)}s`);
    isFirstPlay = false;
  } else {
    audio.currentTime = 0;
  }
  
  // Remover listener para no acumular
  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
}

// === Manejar fin de canción ===
function handleTrackEnd() {
  console.log("✅ Canción terminada");
  updateStatus("Canción terminada, siguiente...");
  setTimeout(playNextTrack, 500);
}

// === Manejar errores ===
function handleAudioError(e) {
  console.error("❌ Error de audio:", audio.error);
  updateStatus("Error, saltando a siguiente canción...");
  setTimeout(playNextTrack, 2000);
}

// === Alternar play/pause ===
function togglePlayPause() {
  if (!playlistLoaded || !audio) return;
  
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = "▶️";
    updateStatus("Pausado");
    console.log("⏸️ Pausado");
  } else {
    audio.play().then(() => {
      isPlaying = true;
      playPauseBtn.textContent = "⏸️";
      updateStatus("Reproduciendo...");
      console.log("▶️ Reproduciendo");
    }).catch(err => {
      console.error("❌ Error al reproducir:", err);
      updateStatus("Error al reproducir");
    });
  }
}

// === Reproducir siguiente canción ===
function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  console.log(`⏭️ Siguiente canción: ${nextIndex + 1}/${playlist.length}`);
  
  // Fade out antes de cambiar
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

// === Cargar y reproducir canción ===
function loadAndPlayTrack(index) {
  loadTrack(index);
  
  if (audio) {
    audio.play().then(() => {
      isPlaying = true;
      playPauseBtn.textContent = "⏸️";
      updateStatus(`Reproduciendo canción ${index + 1} de ${playlist.length}`);
      console.log("▶️ Reproduciendo");
    }).catch(err => {
      console.error("❌ Error reproduciendo:", err);
      updateStatus("Error, intentando siguiente...");
      setTimeout(() => playNextTrack(), 1000);
    });
  }
}

// === Actualizar estado en UI ===
function updateStatus(text) {
  if (statusIndicator) {
    statusIndicator.textContent = text;
  }
}

// === Iniciar con toque en cualquier parte ===
document.addEventListener('click', function initPlayback() {
  if (!isPlaying && playlistLoaded && audio) {
    loadAndPlayTrack(currentIndex);
  }
}, { once: true });

// === Monitoreo automático ===
setInterval(() => {
  if (playlistLoaded && isPlaying && audio) {
    if (audio.paused && !audio.ended) {
      console.warn("⚠️ Audio pausado inesperadamente, reintentando...");
      audio.play().catch(err => {
        console.error("❌ No se pudo reanudar:", err);
        playNextTrack();
      });
    }
    
    if (audio.error) {
      console.error("❌ Error detectado, siguiente canción...");
      playNextTrack();
    }
  }
}, 3000);

console.log("📻 Radio Teletext - Controles personalizados, sin doble audio");
