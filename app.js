// === TELEtext Radio v2 ===
// Crossfade + Shuffle avanzado + control automático

let playlist = [];
let index = 0;
let isPlaying = false;
let fadeInProgress = false;
let lastTrack = -1;

// Usar el reproductor nativo del HTML
let audio = document.getElementById('radioPlayer');
let nextAudio = new Audio();

// Asegurar que el reproductor nativo esté configurado
if (audio) {
    audio.volume = 1;
    audio.crossOrigin = "anonymous";
}

const playPauseBtn = document.getElementById("playPauseBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

let playlistLoaded = false;
const CROSSFADE_TIME = 5; // segundos de mezcla suave

// === Cargar playlist ===
fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    playlist = data.tracks;
    complexShuffle();
    playlistLoaded = true;
    console.log("✅ Playlist cargada:", playlist);
    
    // Precargar primera canción con inicio aleatorio
    if (audio && playlist.length > 0) {
        loadTrackWithRandomStart(audio, 0);
        
        // Intentar reproducción automática
        const playAttempt = audio.play();
        if (playAttempt !== undefined) {
            playAttempt
                .then(() => {
                    isPlaying = true;
                    if (playPauseBtn) playPauseBtn.textContent = "⏸";
                    console.log("▶️ Reproduciendo desde:", Math.round(audio.currentTime), "segundos");
                    scheduleCrossfade();
                })
                .catch(error => {
                    console.log("⏸️ Autoplay bloqueado - Esperando interacción del usuario");
                });
        }
    }
  })
  .catch(err => console.error("❌ Error cargando playlist:", err));

// === Mezcla avanzada (shuffle completo) ===
function complexShuffle() {
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }

  // Evitar repetir la última canción de la sesión anterior
  if (lastTrack !== -1 && playlist[0] === lastTrack) {
    const temp = playlist[0];
    playlist[0] = playlist[playlist.length - 1];
    playlist[playlist.length - 1] = temp;
  }

  lastTrack = playlist[playlist.length - 1];
}

// === Cargar canción con inicio aleatorio (para TODAS las canciones) ===
function loadTrackWithRandomStart(player, trackIndex) {
  player.src = playlist[trackIndex];
  player.load();
  
  // Configurar inicio aleatorio cuando los metadatos estén cargados
  player.onloadedmetadata = function() {
    if (player.duration > 60) {
      const randomStart = Math.random() * (player.duration - 60);
      player.currentTime = randomStart;
      console.log("🎲 Canción", trackIndex + 1, "inicia en:", Math.round(randomStart), "segundos");
    }
  };
}

// === Programar el próximo crossfade ===
function scheduleCrossfade() {
  if (!audio.duration || !playlistLoaded) {
    setTimeout(scheduleCrossfade, 500);
    return;
  }
  
  const remaining = audio.duration - audio.currentTime;

  if (remaining > CROSSFADE_TIME) {
    setTimeout(startCrossfade, (remaining - CROSSFADE_TIME) * 1000);
  } else {
    startCrossfade();
  }
// === Crossfade mejorado - evita cortes ===
function startCrossfade() {
  if (fadeInProgress || !playlistLoaded) return;
  
  console.log("🎛️ Iniciando crossfade...");
  
  index = (index + 1) % playlist.length;

  if (index === 0) {
    complexShuffle();
  }

  // Crear NUEVA instancia de audio para evitar problemas
  nextAudio = new Audio();
  nextAudio.crossOrigin = "anonymous";
  nextAudio.volume = 0;
  
  // Precargar la siguiente canción ANTES del crossfade
  nextAudio.src = playlist[index];
  nextAudio.load();

  // Función interna para iniciar el crossfade cuando esté listo
  const initiateCrossfade = () => {
    // Verificar que nextAudio sea válido y tenga datos
    if (!nextAudio || !nextAudio.duration || nextAudio.duration === Infinity) {
      console.warn("⚠️ nextAudio no válido, reintentando...");
      setTimeout(startCrossfade, 1000);
      return;
    }

    fadeInProgress = true;
    
    // Iniciar reproducción de nextAudio
    nextAudio.play().catch(error => {
      console.error("❌ Error reproduciendo nextAudio:", error);
      fadeInProgress = false;
      // Reintentar con siguiente canción
      setTimeout(startCrossfade, 2000);
      return;
    });

    let t = 0;
    const interval = setInterval(() => {
      t += 0.05;
      
      // Crossfade de volúmenes
      if (audio && audio.volume > 0) {
        audio.volume = Math.max(0, 1 - t / CROSSFADE_TIME);
      }
      
      if (nextAudio && nextAudio.volume < 1) {
        nextAudio.volume = Math.min(1, t / CROSSFADE_TIME);
      }

      // Cuando termine el crossfade
      if (t >= CROSSFADE_TIME) {
        clearInterval(interval);
        fadeInProgress = false;
        
        // Transición completa
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        
        // Cambiar referencias
        audio = nextAudio;
        audio.volume = 1;
        nextAudio = null;
        
        console.log("✅ Crossfade completado a canción:", index + 1);
        
        // Programar próximo crossfade con verificación extra
        setTimeout(() => {
          if (audio && audio.duration && !audio.paused) {
            scheduleCrossfade();
          } else {
            console.warn("⚠️ Audio no listo para próximo crossfade, reintentando...");
            setTimeout(scheduleCrossfade, 1000);
          }
        }, 500);
      }
    }, 50);
  };

  // Manejadores de eventos para nextAudio
  const errorHandler = () => {
    console.error("❌ Error cargando nextAudio, saltando canción...");
    nextAudio = null;
    fadeInProgress = false;
    // Saltar a siguiente canción
    index = (index + 1) % playlist.length;
    setTimeout(startCrossfade, 1000);
  };

  const loadedHandler = () => {
    // Remover listeners
    nextAudio.removeEventListener('loadedmetadata', loadedHandler);
    nextAudio.removeEventListener('error', errorHandler);
    
    // Verificar que tenga duración válida
    if (nextAudio.duration && nextAudio.duration > 0) {
      // Iniciar crossfade después de asegurar carga
      setTimeout(initiateCrossfade, 100);
    } else {
      errorHandler();
    }
  };

  // Agregar listeners
  nextAudio.addEventListener('loadedmetadata', loadedHandler, { once: true });
  nextAudio.addEventListener('error', errorHandler, { once: true });
  
  // Timeout de seguridad
  setTimeout(() => {
    if (fadeInProgress && (!nextAudio || !nextAudio.readyState)) {
      console.warn("⚠️ Timeout cargando nextAudio, forzando siguiente canción...");
      errorHandler();
    }
  }, 10000); // 10 segundos timeout
}

  // Cargar siguiente canción con inicio aleatorio
  loadTrackWithRandomStart(nextAudio, index);

  // Cuando nextAudio esté listo, iniciar crossfade
  const startCrossfadeTransition = () => {
    let t = 0;
    fadeInProgress = true;
    nextAudio.volume = 0;
    nextAudio.play();

    const interval = setInterval(() => {
      t += 0.05;
      audio.volume = Math.max(0, 1 - t / CROSSFADE_TIME);
      nextAudio.volume = Math.min(1, t / CROSSFADE_TIME);

      if (t >= CROSSFADE_TIME) {
        clearInterval(interval);
        fadeInProgress = false;
        
        // Cambiar al nuevo audio
        const prevAudio = audio;
        audio = nextAudio;
        nextAudio = new Audio();
        
        // Limpiar el audio anterior
        prevAudio.pause();
        prevAudio.src = "";
        
        // Programar próximo crossfade
        scheduleCrossfade();
      }
    }, 50);
  };

  // Si nextAudio ya tiene metadatos, iniciar crossfade inmediatamente
  if (nextAudio.readyState >= 1) {
    startCrossfadeTransition();
  } else {
    // Esperar a que carguen los metadatos
    nextAudio.addEventListener('loadedmetadata', startCrossfadeTransition, { once: true });
  }
}

// === Botón Play/Pause ===
if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
        if (!isPlaying) {
            audio.play().then(() => {
                isPlaying = true;
                playPauseBtn.textContent = "⏸";
                scheduleCrossfade();
            });
        } else {
            audio.pause();
            isPlaying = false;
            playPauseBtn.textContent = "▶️";
        }
    });
}

// === Sincronizar estado del reproductor nativo ===
audio.addEventListener("play", () => {
    isPlaying = true;
    if (playPauseBtn) playPauseBtn.textContent = "⏸";
    
    if (!fadeInProgress && audio.currentTime < 5) {
        setTimeout(scheduleCrossfade, 1000);
    }
});

audio.addEventListener("pause", () => {
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = "▶️";
});

// === Barra de progreso ===
audio.addEventListener("timeupdate", () => {
  if (audio.duration && progressBar) {
    progressBar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  }
});

// === Control manual de seek ===
if (progressContainer) {
    progressContainer.addEventListener("click", e => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        audio.currentTime = (clickX / width) * audio.duration;
    });
}

// === Manejo de errores ===
audio.addEventListener("error", (e) => {
    console.error("❌ Error en reproductor:", e);
    if (!fadeInProgress) {
        setTimeout(() => {
            index = (index + 1) % playlist.length;
            loadTrackWithRandomStart(audio, index);
            audio.play();
        }, 2000);
    }
});

// === Reinicio aleatorio si el usuario salta manualmente ===
audio.addEventListener("seeking", () => {
    // Si el usuario busca manualmente cerca del inicio, reprogramar crossfade
    if (audio.currentTime < 10 && !fadeInProgress) {
        setTimeout(scheduleCrossfade, 1000);
    }
});

