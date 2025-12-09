// === TELEtext Radio - Sistema CORREGIDO (sin duplicación) ===

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = new Audio();
let playlistLoaded = false;
let hasAttemptedAutoplay = false; // ← NUEVO: evita múltiples intentos

// Usar reproductor nativo si existe (solo para visualización)
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
    
    // Cargar primera canción (SIN autoplay aún)
    if (playlist.length > 0) {
      loadTrack(0); // Solo cargar, no reproducir
      
      // Esperar 500ms y luego intentar autoplay UNA sola vez
      setTimeout(() => {
        if (!hasAttemptedAutoplay) {
          attemptAutoplay();
          hasAttemptedAutoplay = true;
        }
      }, 500);
    }
  })
  .catch(error => {
    console.error("❌ Error cargando playlist:", error);
    // Playlist de respaldo
    playlist = [
      "music/toclimbthecliff.mp3",
      "music/doomsday.mp3", 
      "music/lgds.mp3"
    ];
    playlistLoaded = true;
    shufflePlaylist();
    
    if (playlist.length > 0) {
      loadTrack(0);
      setTimeout(attemptAutoplay, 500);
    }
  });

// === Intentar autoplay UNA sola vez ===
function attemptAutoplay() {
  if (!playlistLoaded || playlist.length === 0 || isPlaying) return;
  
  console.log("🎯 Intentando autoplay...");
  audio.play().then(() => {
    isPlaying = true;
    console.log("▶️ Autoplay exitoso");
  }).catch(error => {
    console.log("⏸️ Autoplay bloqueado - Esperando interacción");
    showPlayInstructions();
  });
}

// === Mezclar playlist ===
function shufflePlaylist() {
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
  console.log("🔀 Playlist mezclada");
}

// === Cargar canción (sin reproducir) ===
function loadTrack(index) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  
  // Asegurar ruta con 'music/'
  const fullPath = track.startsWith('music/') ? track : 'music/' + track;
  
  console.log(`🎵 Cargando: ${track} (${index + 1}/${playlist.length})`);
  
  // Configurar audio principal
  audio.src = fullPath;
  audio.volume = 1;
  audio.crossOrigin = "anonymous";
  
  // Sincronizar con reproductor nativo solo para visualización
  if (nativePlayer) {
    nativePlayer.src = fullPath;
    nativePlayer.currentTime = 0;
  }
  
  // Configurar listeners UNA sola vez
  setupAudioListeners();
  
  // Cuando se carguen los metadatos, comenzar en punto aleatorio
  audio.addEventListener('loadedmetadata', function onLoaded() {
    audio.removeEventListener('loadedmetadata', onLoaded);
    
    if (audio.duration > 60) {
      const randomStart = Math.random() * (audio.duration - 60);
      audio.currentTime = randomStart;
      console.log(`🎲 Inicia en: ${Math.round(randomStart)}s`);
      
      // Sincronizar tiempo con reproductor visual
      if (nativePlayer) {
        nativePlayer.currentTime = audio.currentTime;
      }
    }
  }, { once: true });
}

// === Configurar listeners del audio ===
function setupAudioListeners() {
  // Remover listeners previos para evitar acumulación
  audio.removeEventListener('ended', handleTrackEnd);
  audio.removeEventListener('error', handleAudioError);
  
  // Agregar listeners nuevos
  audio.addEventListener('ended', handleTrackEnd);
  audio.addEventListener('error', handleAudioError);
}

// === Manejar fin de canción ===
function handleTrackEnd() {
  console.log("✅ Canción terminada");
  setTimeout(playNextTrack, 500); // Pequeña pausa entre canciones
}

// === Manejar errores de audio ===
function handleAudioError(e) {
  console.error("❌ Error de audio:", audio.error);
  setTimeout(playNextTrack, 2000);
}

// === Reproducir siguiente canción ===
function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  console.log(`⏭️ Pasando a canción ${nextIndex + 1}/${playlist.length}`);
  
  // Cargar y reproducir siguiente canción
  loadTrack(nextIndex);
  
  audio.play().then(() => {
    isPlaying = true;
    console.log("▶️ Reproduciendo siguiente canción");
  }).catch(err => {
    console.error("❌ Error reproduciendo:", err);
    // Reintentar con siguiente canción
    setTimeout(playNextTrack, 1000);
  });
}

// === Mostrar instrucciones para autoplay bloqueado ===
function showPlayInstructions() {
  if (document.getElementById('playInstructions')) return;
  
  const instructions = document.createElement('div');
  instructions.id = 'playInstructions';
  instructions.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      z-index: 1000;
      border: 2px solid #00FF37;
      max-width: 300px;
    ">
      <p style="margin: 0 0 15px 0;">🎧 Presiona PLAY para iniciar la radio</p>
      <button onclick="startManualPlayback()" style="
        background: #00FF37;
        color: black;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
      ">
        ▶️ INICIAR RADIO
      </button>
    </div>
  `;
  
  document.body.appendChild(instructions);
}

// === Iniciar reproducción manualmente ===
window.startManualPlayback = function() {
  if (playlistLoaded && playlist.length > 0 && !isPlaying) {
    audio.play().then(() => {
      isPlaying = true;
      const instructions = document.getElementById('playInstructions');
      if (instructions) instructions.remove();
      console.log("▶️ Reproducción iniciada manualmente");
    });
  }
};

// === Sincronización con controles nativos ===
if (nativePlayer) {
  nativePlayer.addEventListener('play', () => {
    if (!isPlaying && playlistLoaded) {
      audio.play().then(() => {
        isPlaying = true;
        console.log("▶️ Reproducción desde control nativo");
      });
    }
  });
  
  // Solo sincronizar tiempo visualmente
  setInterval(() => {
    if (nativePlayer && audio && isPlaying) {
      if (Math.abs(nativePlayer.currentTime - audio.currentTime) > 1) {
        nativePlayer.currentTime = audio.currentTime;
      }
    }
  }, 1000);
}

// === Monitoreo de estado ===
setInterval(() => {
  if (playlistLoaded && isPlaying) {
    if (audio.paused && !audio.ended) {
      console.warn("⚠️ Audio pausado inesperadamente, reintentando...");
      audio.play().catch(err => {
        console.error("❌ No se pudo reanudar:", err);
        playNextTrack();
      });
    }
    
    if (audio.error) {
      console.error("❌ Error detectado, pasando a siguiente canción...");
      playNextTrack();
    }
  }
}, 3000);

// === Iniciar con toque (para móviles) ===
document.addEventListener('click', function initPlayback() {
  if (!isPlaying && playlistLoaded && !hasAttemptedAutoplay) {
    audio.play().then(() => {
      isPlaying = true;
      hasAttemptedAutoplay = true;
      console.log("▶️ Reproducción iniciada por interacción");
    }).catch(err => {
      console.log("⏸️ Aún esperando interacción específica...");
    });
  }
}, { once: true });

console.log("📻 Radio Teletext - Sistema sin duplicación cargado");
