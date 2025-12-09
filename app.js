// === TELEtext Radio v3 ===
// Sistema simplificado - Sin paradas entre temas

let playlist = [];
let index = 0;
let isPlaying = false;
let fadeInProgress = false;
let lastTrack = -1;

// Usar el reproductor nativo del HTML
let audio = document.getElementById('radioPlayer');
let nextAudio = null;
let crossfadeTimeout = null;

// Asegurar que el reproductor nativo esté configurado
if (audio) {
    audio.volume = 1;
    audio.crossOrigin = "anonymous";
}

const playPauseBtn = document.getElementById("playPauseBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

let playlistLoaded = false;

// === Cargar playlist ===
fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    if (!data.tracks || !Array.isArray(data.tracks)) {
      throw new Error("Formato inválido de playlist.json");
    }
    
    playlist = data.tracks;
    console.log("✅ Playlist cargada:", playlist.length, "canciones");
    
    complexShuffle();
    playlistLoaded = true;
    
    // Precargar primera canción con inicio aleatorio
    if (audio && playlist.length > 0) {
        loadTrackWithRandomStart(audio, 0);
        
        // Intentar reproducción automática
        setTimeout(() => {
            const playAttempt = audio.play();
            if (playAttempt !== undefined) {
                playAttempt
                    .then(() => {
                        isPlaying = true;
                        if (playPauseBtn) playPauseBtn.textContent = "⏸";
                        console.log("▶️ Reproducción iniciada");
                        scheduleCrossfade();
                    })
                    .catch(error => {
                        console.log("⏸️ Autoplay bloqueado - Esperando interacción del usuario");
                    });
            }
        }, 500);
    }
  })
  .catch(err => {
    console.error("❌ Error cargando playlist:", err);
    // Playlist de respaldo
    playlist = [
        "music/toclimbthecliff.mp3",
        "music/doomsday.mp3",
        "music/lgds.mp3"
    ];
    playlistLoaded = true;
    complexShuffle();
    
    if (audio && playlist.length > 0) {
        loadTrackWithRandomStart(audio, 0);
    }
  });

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

// === Cargar canción con inicio aleatorio ===
function loadTrackWithRandomStart(player, trackIndex) {
  if (!playlist[trackIndex]) return;
  
  const trackPath = playlist[trackIndex];
  // Asegurar que tenga 'music/' si no lo tiene
  const fullPath = trackPath.startsWith('music/') ? trackPath : 'music/' + trackPath;
  
  player.src = fullPath;
  player.load();
  
  player.onloadedmetadata = function() {
    if (player.duration > 60) {
      const randomStart = Math.random() * (player.duration - 60);
      player.currentTime = randomStart;
      console.log("🎲 Canción", trackIndex + 1, "inicia en:", Math.round(randomStart), "segundos");
    }
  };
}

// === Programar próximo crossfade ===
function scheduleCrossfade() {
  if (!audio || !audio.duration || fadeInProgress || !playlistLoaded) {
    // Reintentar en 1 segundo si no está listo
    setTimeout(scheduleCrossfade, 1000);
    return;
  }
  
  const remaining = audio.duration - audio.currentTime;
  
  // Programar crossfade 3 segundos antes del final
  const crossfadeOffset = 3;
  
  if (remaining > crossfadeOffset) {
    const delay = (remaining - crossfadeOffset) * 1000;
    console.log(`⏰ Crossfade en ${Math.round(delay/1000)}s`);
    clearTimeout(crossfadeTimeout);
    crossfadeTimeout = setTimeout(startCrossfade, delay);
  } else {
    // Si falta poco, iniciar inmediatamente
    console.log("⏰ Crossfade inmediato");
    startCrossfade();
  }
}

// === CROSSFADE SIMPLIFICADO Y ROBUSTO ===
function startCrossfade() {
  if (fadeInProgress || !playlistLoaded || !audio) {
    console.log("⏳ Crossfade pospuesto - sistema ocupado");
    setTimeout(startCrossfade, 1000);
    return;
  }
  
  console.log("🎛️ Iniciando transición...");
  fadeInProgress = true;
  
  // Calcular siguiente canción
  index = (index + 1) % playlist.length;
  
  if (index === 0) {
    complexShuffle();
  }
  
  // Preparar siguiente canción
  const nextTrack = playlist[index];
  if (!nextTrack) {
    console.error("❌ No hay siguiente canción");
    fadeInProgress = false;
    return;
  }
  
  // Crear nuevo elemento de audio
  nextAudio = new Audio();
  nextAudio.crossOrigin = "anonymous";
  nextAudio.volume = 0; // Comenzar silencioso
  
  // Cargar la siguiente canción
  nextAudio.src = nextTrack;
  
  // Cuando esté listo para reproducir
  nextAudio.addEventListener('canplaythrough', function onCanPlay() {
    nextAudio.removeEventListener('canplaythrough', onCanPlay);
    
    // Iniciar reproducción de la siguiente canción
    nextAudio.play().then(() => {
      console.log("▶️ Siguiente canción iniciada");
      
      // Fade out del audio actual, fade in del siguiente
      let fadeProgress = 0;
      const fadeDuration = 3000; // 3 segundos de crossfade
      const startTime = Date.now();
      
      function performFade() {
        const elapsed = Date.now() - startTime;
        fadeProgress = Math.min(elapsed / fadeDuration, 1);
        
        // Ajustar volúmenes
        if (audio) {
          audio.volume = Math.max(0, 1 - fadeProgress);
        }
        
        if (nextAudio) {
          nextAudio.volume = Math.min(1, fadeProgress);
        }
        
        if (fadeProgress < 1) {
          requestAnimationFrame(performFade);
        } else {
          // Crossfade completado
          completeCrossfade();
        }
      }
      
      performFade();
      
    }).catch(err => {
      console.error("❌ Error reproduciendo siguiente canción:", err);
      recoverFromError();
    });
    
  }, { once: true });
  
  // Manejo de errores en nextAudio
  nextAudio.addEventListener('error', function onError() {
    nextAudio.removeEventListener('error', onError);
    console.error("❌ Error cargando siguiente canción");
    recoverFromError();
  }, { once: true });
  
  // Timeout de seguridad
  setTimeout(() => {
    if (fadeInProgress && (!nextAudio || nextAudio.readyState < 3)) {
      console.warn("⚠️ Timeout en carga de siguiente canción");
      recoverFromError();
    }
  }, 5000);
}

// === Completar crossfade ===
function completeCrossfade() {
  console.log("✅ Transición completada");
  
  // Pausar y limpiar audio anterior
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  }
  
  // Cambiar al nuevo audio
  audio = nextAudio;
  audio.volume = 1;
  nextAudio = null;
  
  fadeInProgress = false;
  
  // Programar próximo crossfade
  setTimeout(() => {
    if (audio && !audio.paused) {
      scheduleCrossfade();
    }
  }, 1000);
}

// === Recuperación de errores ===
function recoverFromError() {
  console.log("🔄 Recuperando de error...");
  
  fadeInProgress = false;
  
  // Limpiar nextAudio si existe
  if (nextAudio) {
    nextAudio.pause();
    nextAudio.src = "";
    nextAudio = null;
  }
  
  // Saltar a siguiente canción
  index = (index + 1) % playlist.length;
  
  // Recargar audio actual
  if (audio && playlist[index]) {
    loadTrackWithRandomStart(audio, index);
    audio.play().then(() => {
      console.log("✅ Recuperación exitosa");
      scheduleCrossfade();
    }).catch(err => {
      console.error("❌ Error en recuperación:", err);
      // Reintentar en 5 segundos
      setTimeout(recoverFromError, 5000);
    });
  }
}

// === MANEJO DE PAUSAS ===
if (audio) {
    audio.addEventListener("pause", () => {
        isPlaying = false;
        if (playPauseBtn) playPauseBtn.textContent = "▶️";
        
        // Cancelar crossfade programado
        clearTimeout(crossfadeTimeout);
        
        // Si hay crossfade en progreso, pausar nextAudio también
        if (fadeInProgress && nextAudio) {
            nextAudio.pause();
        }
    });

    audio.addEventListener("play", () => {
        isPlaying = true;
        if (playPauseBtn) playPauseBtn.textContent = "⏸";
        
        // Si hay crossfade en progreso, reanudar nextAudio
        if (fadeInProgress && nextAudio && nextAudio.paused) {
            nextAudio.play();
        } else {
            // Reprogramar crossfade si no hay en progreso
            scheduleCrossfade();
        }
    });
}

// === Botón Play/Pause (para controles ocultos) ===
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

// === Barra de progreso ===
if (audio) {
    audio.addEventListener("timeupdate", () => {
        if (audio.duration && progressBar) {
            progressBar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
        }
    });
}

// === Control manual de seek ===
if (progressContainer) {
    progressContainer.addEventListener("click", e => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        audio.currentTime = (clickX / width) * audio.duration;
        
        // Reprogramar crossfade después de seek manual
        clearTimeout(crossfadeTimeout);
        scheduleCrossfade();
    });
}

// === Manejo de errores del audio principal ===
if (audio) {
    audio.addEventListener("error", (e) => {
        console.error("❌ Error en reproductor principal:", e);
        
        // NO intentar recuperar inmediatamente si hay crossfade en progreso
        if (fadeInProgress) {
            console.log("⏳ Error durante crossfade, esperando a que termine...");
            return;
        }
        
        // Esperar un momento y recuperar
        setTimeout(recoverFromError, 1000);
    });
}

// === MONITOR DE ESTADO - Previene paradas ===
setInterval(() => {
  if (!playlistLoaded) return;
  
  // Si debería estar reproduciendo pero no lo está
  if (isPlaying && audio && audio.paused && !fadeInProgress) {
    console.warn("⚠️ Audio pausado pero debería reproducir, reiniciando...");
    audio.play().then(() => {
      console.log("▶️ Reproducción restaurada");
      scheduleCrossfade();
    }).catch(err => {
      console.error("❌ No se pudo restaurar:", err);
    });
  }
  
  // Si hay error en el audio principal y no se está recuperando
  if (audio && audio.error && !fadeInProgress) {
    console.warn("⚠️ Error detectado en audio, recuperando...");
    recoverFromError();
  }
}, 3000); // Verificar cada 3 segundos

// === Limpiar al cerrar página ===
window.addEventListener('beforeunload', () => {
  clearTimeout(crossfadeTimeout);
  if (audio) audio.pause();
  if (nextAudio) nextAudio.pause();
});
