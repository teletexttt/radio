// === TELEtext Radio - Versión SIMPLE y ESTABLE ===
// Sin crossfade complejo, sin paradas entre temas

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = new Audio();
let playlistLoaded = false;

// Usar reproductor nativo si existe (para controles visibles)
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
    
    // Cargar y reproducir primera canción
    if (playlist.length > 0) {
      loadAndPlayTrack(0);
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
      loadAndPlayTrack(0);
    }
  });

// === Mezclar playlist (shuffle simple) ===
function shufflePlaylist() {
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
  console.log("🔀 Playlist mezclada");
}

// === Cargar y reproducir canción ===
function loadAndPlayTrack(index) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  
  // Asegurar ruta con 'music/'
  const fullPath = track.startsWith('music/') ? track : 'music/' + track;
  
  console.log(`🎵 Cargando: ${track}`);
  
  // Configurar audio
  audio.src = fullPath;
  audio.volume = 1;
  audio.crossOrigin = "anonymous";
  
  // Sincronizar con reproductor nativo si existe
  if (nativePlayer) {
    nativePlayer.src = fullPath;
  }
  
  // Cuando se carguen los metadatos, comenzar en punto aleatorio
  audio.addEventListener('loadedmetadata', function onLoaded() {
    audio.removeEventListener('loadedmetadata', onLoaded);
    
    if (audio.duration > 60) {
      const randomStart = Math.random() * (audio.duration - 60);
      audio.currentTime = randomStart;
      console.log(`🎲 Inicia en: ${Math.round(randomStart)}s`);
    }
    
    // Reproducir
    audio.play().then(() => {
      isPlaying = true;
      console.log("▶️ Reproduciendo");
      
      // Actualizar controles nativos
      if (nativePlayer) {
        nativePlayer.currentTime = audio.currentTime;
        if (nativePlayer.paused) nativePlayer.play();
      }
      
    }).catch(error => {
      console.log("⏸️ Autoplay bloqueado - Esperando interacción");
      // Mostrar instrucción para usuario
      showPlayInstructions();
    });
  }, { once: true });
  
  // Manejar final de canción
  audio.addEventListener('ended', playNextTrack, { once: true });
  
  // Manejar errores
  audio.addEventListener('error', function onError(e) {
    audio.removeEventListener('error', onError);
    console.error("❌ Error cargando canción:", track, e);
    
    // Saltar a siguiente canción después de 2 segundos
    setTimeout(() => {
      playNextTrack();
    }, 2000);
  }, { once: true });
}

// === Reproducir siguiente canción ===
function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  console.log(`⏭️ Pasando a canción ${nextIndex + 1}/${playlist.length}`);
  
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

// === Instrucciones para autoplay bloqueado ===
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
      <button onclick="startPlayback()" style="
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

// === Función global para iniciar reproducción ===
window.startPlayback = function() {
  if (playlistLoaded && playlist.length > 0) {
    audio.play().then(() => {
      isPlaying = true;
      const instructions = document.getElementById('playInstructions');
      if (instructions) instructions.remove();
      console.log("▶️ Reproducción iniciada manualmente");
    });
  }
};

// === Sincronizar con controles nativos ===
if (nativePlayer) {
  // Cuando el usuario interactúa con el reproductor nativo
  nativePlayer.addEventListener('play', () => {
    if (!isPlaying && playlistLoaded) {
      audio.play().then(() => {
        isPlaying = true;
        console.log("▶️ Reproducción desde control nativo");
      });
    }
  });
  
  nativePlayer.addEventListener('pause', () => {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      console.log("⏸️ Pausa desde control nativo");
    }
  });
  
  // Sincronizar tiempo
  nativePlayer.addEventListener('timeupdate', () => {
    if (Math.abs(audio.currentTime - nativePlayer.currentTime) > 2) {
      audio.currentTime = nativePlayer.currentTime;
    }
  });
}

// === Monitoreo de estado ===
setInterval(() => {
  if (playlistLoaded && isPlaying) {
    // Si el audio se pausó pero debería estar reproduciendo
    if (audio.paused && !audio.ended) {
      console.warn("⚠️ Audio pausado inesperadamente, reintentando...");
      audio.play().catch(err => {
        console.error("❌ No se pudo reanudar:", err);
      });
    }
    
    // Si hay error, pasar a siguiente canción
    if (audio.error) {
      console.error("❌ Error detectado, pasando a siguiente canción...");
      playNextTrack();
    }
  }
}, 3000); // Verificar cada 3 segundos

// === Para móviles: permitir iniciar con toque en cualquier lugar ===
document.addEventListener('click', function initPlayback() {
  if (!isPlaying && playlistLoaded) {
    audio.play().then(() => {
      isPlaying = true;
      console.log("▶️ Reproducción iniciada por interacción");
    }).catch(err => {
      console.log("⏸️ Aún esperando interacción específica...");
    });
  }
}, { once: true });

console.log("📻 Radio Teletext - Sistema simple cargado");
