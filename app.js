// === TELEtext Radio - Sistema CORREGIDO ===
// Inicio aleatorio SOLO en primera canción

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = new Audio();
let playlistLoaded = false;
let isFirstPlay = true; // ← NUEVA VARIABLE: controla inicio aleatorio

// Usar reproductor nativo si existe
const nativePlayer = document.getElementById('radioPlayer');

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
    
    if (playlist.length > 0) {
      loadTrack(0);
    }
  });

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
  
  console.log(`🎵 Cargando: ${track} (${index + 1}/${playlist.length})`);
  
  // Configurar audio
  audio.src = fullPath;
  audio.volume = 1;
  audio.crossOrigin = "anonymous";
  
  // Sincronizar con reproductor nativo
  if (nativePlayer) {
    nativePlayer.src = fullPath;
    nativePlayer.currentTime = 0;
  }
  
  // Configurar listeners
  setupAudioListeners();
  
  // Cuando se carguen los metadatos
  audio.addEventListener('loadedmetadata', function onLoaded() {
    audio.removeEventListener('loadedmetadata', onLoaded);
    
    // ⭐⭐ CAMBIO CLAVE: Inicio aleatorio SOLO en primera reproducción ⭐⭐
    if (isFirstPlay && audio.duration > 60) {
      const randomStart = Math.random() * (audio.duration - 60);
      audio.currentTime = randomStart;
      console.log(`🎲 INICIO ALEATORIO (primera canción): ${Math.round(randomStart)}s`);
      
      // Marcar que ya no es la primera reproducción
      isFirstPlay = false;
    } else {
      // Canciones siguientes empiezan desde 0:00
      audio.currentTime = 0;
      console.log("⏹️ Inicio desde 0:00 (canción siguiente)");
    }
    
    // Sincronizar reproductor visual
    if (nativePlayer) {
      nativePlayer.currentTime = audio.currentTime;
    }
  }, { once: true });
}

// === Configurar listeners ===
function setupAudioListeners() {
  // Remover listeners previos
  audio.removeEventListener('ended', handleTrackEnd);
  audio.removeEventListener('error', handleAudioError);
  
  // Agregar nuevos
  audio.addEventListener('ended', handleTrackEnd);
  audio.addEventListener('error', handleAudioError);
}

// === Manejar fin de canción ===
function handleTrackEnd() {
  console.log("✅ Canción terminada");
  setTimeout(playNextTrack, 500);
}

// === Manejar errores ===
function handleAudioError(e) {
  console.error("❌ Error de audio:", audio.error);
  setTimeout(playNextTrack, 2000);
}

// === Reproducir siguiente canción ===
function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  console.log(`⏭️ Siguiente canción: ${nextIndex + 1}/${playlist.length}`);
  
  // Pequeño fade out antes de cambiar
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
  
  // Reproducir
  audio.play().then(() => {
    isPlaying = true;
    console.log("▶️ Reproduciendo");
  }).catch(err => {
    console.error("❌ Error reproduciendo:", err);
    setTimeout(() => playNextTrack(), 1000);
  });
}

// === Iniciar manualmente ===
window.startManualPlayback = function() {
  if (playlistLoaded && playlist.length > 0 && !isPlaying) {
    audio.play().then(() => {
      isPlaying = true;
      console.log("▶️ Reproducción manual iniciada");
    });
  }
};

// === Sincronización con controles nativos ===
if (nativePlayer) {
  nativePlayer.addEventListener('play', () => {
    if (!isPlaying && playlistLoaded) {
      audio.play().then(() => {
        isPlaying = true;
        console.log("▶️ Play desde control nativo");
      });
    }
  });
  
  // Sincronizar tiempo visualmente
  setInterval(() => {
    if (nativePlayer && audio && isPlaying) {
      if (Math.abs(nativePlayer.currentTime - audio.currentTime) > 1) {
        nativePlayer.currentTime = audio.currentTime;
      }
    }
  }, 1000);
}

// === Monitoreo ===
setInterval(() => {
  if (playlistLoaded && isPlaying) {
    if (audio.paused && !audio.ended) {
      console.warn("⚠️ Audio pausado, reintentando...");
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

// === Iniciar con toque ===
document.addEventListener('click', function initPlayback() {
  if (!isPlaying && playlistLoaded) {
    loadAndPlayTrack(currentIndex);
  }
}, { once: true });

console.log("📻 Radio Teletext - Inicio aleatorio solo en primera canción");

