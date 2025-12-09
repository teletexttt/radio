// === TELEtext Radio - Sistema DUAL (móvil/desktop) ===
// Sin audio doble en móvil

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = new Audio();
let playlistLoaded = false;
let isFirstPlay = true;
let hasAppliedRandomStart = false;

// Detectar dispositivo
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
console.log(`📱 Dispositivo: ${isMobile ? 'Móvil' : 'Desktop'}`);

// Elementos del DOM
const nativePlayer = document.getElementById('radioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

// === CONFIGURAR INTERFAZ SEGÚN DISPOSITIVO ===
function setupInterface() {
  if (isMobile && nativePlayer) {
    // ⭐⭐ EN MÓVIL: Ocultar controles nativos ⭐⭐
    nativePlayer.style.display = 'none';
    nativePlayer.controls = false;
    
    // Crear controles custom si no existen
    createMobileControls();
  } else if (nativePlayer) {
    // ⭐⭐ EN DESKTOP: Mantener controles nativos visibles ⭐⭐
    nativePlayer.style.display = 'block';
    nativePlayer.controls = true;
  }
}

// === Crear controles para móvil ===
function createMobileControls() {
  // Verificar si ya existen
  if (document.getElementById('mobileControls')) return;
  
  const controlsHTML = `
    <div id="mobileControls" style="
      margin-top: 15px;
      display: flex;
      gap: 15px;
      justify-content: center;
      align-items: center;
    ">
      <button id="mobilePlayPause" style="
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
      ">▶️</button>
      
      <div style="
        background: rgba(255,255,255,0.1);
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 0.9rem;
        color: rgba(255,255,255,0.8);
      ">
        <span id="mobileTrackInfo">Cargando...</span>
      </div>
    </div>
  `;
  
  // Insertar después del reproductor nativo (oculto)
  if (nativePlayer && nativePlayer.parentNode) {
    nativePlayer.parentNode.insertAdjacentHTML('beforeend', controlsHTML);
    
    // Configurar eventos
    document.getElementById('mobilePlayPause').addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    });
  }
}

// === Actualizar controles móvil ===
function updateMobileControls() {
  if (!isMobile) return;
  
  const playBtn = document.getElementById('mobilePlayPause');
  const trackInfo = document.getElementById('mobileTrackInfo');
  
  if (playBtn) {
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
  }
  
  if (trackInfo && playlist[currentIndex]) {
    const trackName = playlist[currentIndex]
      .replace('music/', '')
      .replace('.mp3', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    
    trackInfo.textContent = `${currentIndex + 1}/${playlist.length}: ${trackName}`;
  }
}

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
    
    shufflePlaylist();
    
    // Configurar interfaz según dispositivo
    setupInterface();
    
    if (playlist.length > 0) {
      loadAndPlayImmediate(0);
    }
  })
  .catch(error => {
    console.error("❌ Error cargando playlist:", error);
    playlist = ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    shufflePlaylist();
    
    setupInterface();
    if (playlist.length > 0) {
      loadAndPlayImmediate(0);
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

// === Cargar y reproducir INMEDIATAMENTE ===
function loadAndPlayImmediate(index) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  const fullPath = track.startsWith('music/') ? track : 'music/' + track;
  
  console.log(`🎵 Cargando: ${track} (${index + 1}/${playlist.length})`);
  
  // Resetear controles
  hasAppliedRandomStart = false;
  
  // Configurar audio principal (SIEMPRE se usa este)
  audio.src = fullPath;
  audio.volume = 1;
  audio.crossOrigin = "anonymous";
  audio.currentTime = 0;
  
  // ⭐⭐ CONFIGURACIÓN DUAL: Sincronizar según dispositivo ⭐⭐
  if (!isMobile && nativePlayer) {
    // Desktop: Sincronizar reproductor nativo
    nativePlayer.src = fullPath;
    nativePlayer.currentTime = 0;
  }
  
  // Configurar listeners
  setupAudioListeners();
  
  // Reproducir INMEDIATAMENTE
  audio.play().then(() => {
    isPlaying = true;
    console.log("▶️ Reproducción iniciada");
    
    // Actualizar controles
    updateMobileControls();
    
    // Desktop: Sincronizar reproductor nativo
    if (!isMobile && nativePlayer && nativePlayer.paused) {
      nativePlayer.play().catch(() => {});
    }
  }).catch(error => {
    console.log("⏸️ Autoplay bloqueado");
    updateMobileControls();
  });
  
  // Metadatos en paralelo
  audio.addEventListener('loadedmetadata', function onLoaded() {
    audio.removeEventListener('loadedmetadata', onLoaded);
    
    // Inicio aleatorio solo primera canción
    if (isFirstPlay && !hasAppliedRandomStart && audio.duration > 60) {
      const randomStart = Math.random() * (audio.duration - 60);
      
      setTimeout(() => {
        audio.currentTime = randomStart;
        console.log(`🎲 Saltando a: ${Math.round(randomStart)}s`);
        
        // Desktop: Sincronizar
        if (!isMobile && nativePlayer) {
          nativePlayer.currentTime = randomStart;
        }
        
        hasAppliedRandomStart = true;
        isFirstPlay = false;
        updateMobileControls();
      }, 1000);
      
    } else {
      console.log("⏹️ Canción siguiente");
      updateMobileControls();
    }
  }, { once: true });
}

// === Configurar listeners del audio ===
function setupAudioListeners() {
  audio.removeEventListener('ended', handleTrackEnd);
  audio.removeEventListener('error', handleAudioError);
  audio.removeEventListener('timeupdate', handleTimeUpdate);
  
  audio.addEventListener('ended', handleTrackEnd);
  audio.addEventListener('error', handleAudioError);
  audio.addEventListener('timeupdate', handleTimeUpdate);
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

// === Actualizar tiempo (para controles) ===
function handleTimeUpdate() {
  // Actualizar barra de progreso si existe
  if (progressBar && audio.duration) {
    progressBar.style.width = (audio.currentTime / audio.duration) * 100 + '%';
  }
  
  // Desktop: Sincronizar reproductor nativo
  if (!isMobile && nativePlayer && isPlaying) {
    if (Math.abs(nativePlayer.currentTime - audio.currentTime) > 1) {
      nativePlayer.currentTime = audio.currentTime;
    }
  }
}

// === Reproducir siguiente canción ===
function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  console.log(`⏭️ Siguiente: ${nextIndex + 1}/${playlist.length}`);
  
  // Fade out
  if (audio.volume > 0) {
    let volume = audio.volume;
    const fadeOut = setInterval(() => {
      volume -= 0.1;
      audio.volume = Math.max(0, volume);
      
      if (volume <= 0) {
        clearInterval(fadeOut);
        loadAndPlayImmediate(nextIndex);
      }
    }, 50);
  } else {
    loadAndPlayImmediate(nextIndex);
  }
}

// === Control manual ===
window.startManualPlayback = function() {
  if (playlistLoaded && playlist.length > 0 && !isPlaying) {
    audio.play().then(() => {
      isPlaying = true;
      updateMobileControls();
      console.log("▶️ Reproducción manual");
    });
  }
};

// === Eventos para controles nativos (SOLO desktop) ===
if (!isMobile && nativePlayer) {
  nativePlayer.addEventListener('play', () => {
    if (!isPlaying && playlistLoaded) {
      audio.play().then(() => {
        isPlaying = true;
        updateMobileControls();
        console.log("▶️ Play desde control nativo");
      });
    }
  });
  
  nativePlayer.addEventListener('pause', () => {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      updateMobileControls();
      console.log("⏸️ Pause desde control nativo");
    }
  });
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
    loadAndPlayImmediate(currentIndex);
  }
}, { once: true });

console.log("📻 Radio Teletext - Sistema dual activado");


