// === TELEtext Radio v2 ===
// Crossfade mejorado - Con recuperación limpia de errores

let playlist = [];
let index = 0;
let isPlaying = false;
let fadeInProgress = false;
let lastTrack = -1;

// Usar el reproductor nativo del HTML
let audio = document.getElementById('radioPlayer');
let nextAudio = null;

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

// === Programar el próximo crossfade ===
function scheduleCrossfade() {
  if (!audio || !audio.duration || fadeInProgress || !playlistLoaded) {
    setTimeout(scheduleCrossfade, 1000);
    return;
  }
  
  const remaining = audio.duration - audio.currentTime;
  
  if (remaining > CROSSFADE_TIME + 2) { // +2 segundos de margen
    const delay = (remaining - CROSSFADE_TIME) * 1000;
    console.log(`⏰ Crossfade programado en ${Math.round(delay/1000)}s`);
    setTimeout(startCrossfade, delay);
  } else if (remaining > 0) {
    console.log("⏰ Iniciando crossfade inmediato...");
    startCrossfade();
  } else {
    // Si ya terminó, iniciar crossfade ahora
    startCrossfade();
  }
}

// === CROSSFADE MEJORADO - Con verificación de errores ===
function startCrossfade() {
  // VERIFICACIÓN EXTRA: Si audio principal tiene error, recuperar primero
  if (audio && audio.error) {
    console.warn("⚠️ Audio principal con error, recuperando antes de crossfade...");
    cleanAudioRecovery();
    return;
  }
  
  if (fadeInProgress || !playlistLoaded || !audio) return;
  
  console.log("🎛️ Preparando crossfade...");
  
  // Calcular siguiente índice
  index = (index + 1) % playlist.length;
  
  if (index === 0) {
    complexShuffle();
  }
  
  fadeInProgress = true;
  
  // Detener cualquier nextAudio previo
  if (nextAudio) {
    nextAudio.pause();
    nextAudio.src = "";
    nextAudio = null;
  }
  
  // Crear NUEVO objeto audio para la siguiente canción
  nextAudio = new Audio();
  nextAudio.crossOrigin = "anonymous";
  nextAudio.volume = 0; // Comenzar en silencio
  
  // Cargar la siguiente canción
  nextAudio.src = playlist[index];
  nextAudio.load();
  
  // Cuando nextAudio esté listo
  nextAudio.addEventListener('loadedmetadata', function onLoaded() {
    // Remover el listener para no acumular
    nextAudio.removeEventListener('loadedmetadata', onLoaded);
    
    // Verificar que sea válido
    if (!nextAudio.duration || nextAudio.duration === Infinity) {
      console.warn("⚠️ nextAudio inválido, saltando...");
      fadeInProgress = false;
      index = (index + 1) % playlist.length;
      setTimeout(startCrossfade, 1000);
      return;
    }
    
    // Iniciar reproducción de nextAudio
    nextAudio.play().catch(err => {
      console.error("❌ Error iniciando nextAudio:", err);
      fadeInProgress = false;
      setTimeout(startCrossfade, 2000);
      return;
    });
    
    // Iniciar crossfade gradual
    let fadeTime = 0;
    const fadeDuration = CROSSFADE_TIME * 1000; // Convertir a ms
    const startTime = Date.now();
    
    function performFade() {
      if (!audio || !nextAudio) {
        fadeInProgress = false;
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / fadeDuration, 1);
      
      // Ajustar volúmenes
      if (audio) {
        audio.volume = Math.max(0, 1 - progress);
      }
      
      if (nextAudio) {
        nextAudio.volume = Math.min(1, progress);
      }
      
      // Cuando el crossfade termine
      if (progress >= 1) {
        // Crossfade completo
        fadeInProgress = false;
        
        // Pausar y limpiar audio anterior
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
        }
        
        // Cambiar referencias
        audio = nextAudio;
        audio.volume = 1;
        nextAudio = null;
        
        console.log("✅ Crossfade completado");
        
        // Programar próximo crossfade
        setTimeout(() => {
          if (audio && !audio.paused && audio.duration) {
            scheduleCrossfade();
          }
        }, 1000);
        
      } else {
        // Continuar crossfade
        requestAnimationFrame(performFade);
      }
    }
    
    // Iniciar crossfade
    requestAnimationFrame(performFade);
    
  }, { once: true });
  
  // Manejo de errores en nextAudio
  nextAudio.addEventListener('error', function onError() {
    nextAudio.removeEventListener('error', onError);
    console.error("❌ Error cargando siguiente canción, saltando...");
    fadeInProgress = false;
    
    // Saltar a siguiente canción
    index = (index + 1) % playlist.length;
    setTimeout(startCrossfade, 2000);
  }, { once: true });
  
  // Timeout de seguridad
  setTimeout(() => {
    if (fadeInProgress && (!nextAudio || !nextAudio.readyState)) {
      console.warn("⚠️ Timeout en carga de nextAudio, forzando siguiente...");
      fadeInProgress = false;
      index = (index + 1) % playlist.length;
      startCrossfade();
    }
  }, 10000);
}

// === RECUPERACIÓN LIMPIA DESPUÉS DE ERROR ===
function cleanAudioRecovery() {
  console.log("🔄 Iniciando recuperación limpia...");
  
  // 1. Detener todo
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  }
  
  if (nextAudio) {
    nextAudio.pause();
    nextAudio.src = "";
    nextAudio = null;
  }
  
  // 2. Resetear estados
  fadeInProgress = false;
  isPlaying = false;
  
  // 3. Avanzar a siguiente canción (evitar la que causó error)
  index = (index + 1) % playlist.length;
  
  // 4. Cargar nueva canción
  if (playlist[index]) {
    loadTrackWithRandomStart(audio, index);
    
    // 5. Esperar y reproducir
    setTimeout(() => {
      audio.play().then(() => {
        isPlaying = true;
        if (playPauseBtn) playPauseBtn.textContent = "⏸";
        console.log("✅ Recuperación completada, reproduciendo canción", index + 1);
        
        // 6. Reprogramar crossfade
        setTimeout(scheduleCrossfade, 1000);
      }).catch(err => {
        console.error("❌ No se pudo recuperar reproducción:", err);
      });
    }, 500);
  }
}

// === MANEJO DE PAUSAS ===
if (audio) {
    audio.addEventListener("pause", () => {
        isPlaying = false;
        if (playPauseBtn) playPauseBtn.textContent = "▶️";
        
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
        
        // Esperar un momento y hacer recuperación limpia
        setTimeout(cleanAudioRecovery, 1000);
    });
}

// === MONITOREO CONTINUO - Previene cortes ===
setInterval(() => {
    if (playlistLoaded && isPlaying && !fadeInProgress) {
        // Verificar estado del audio actual
        if (audio && (audio.paused || audio.ended || audio.error)) {
            console.warn("⚠️ Audio en estado inválido, recuperando...");
            
            if (audio.error) {
                console.error("❌ Error de audio:", audio.error);
                // Saltar a siguiente canción
                index = (index + 1) % playlist.length;
            }
            
            // Recargar y reproducir
            loadTrackWithRandomStart(audio, index);
            audio.play().then(() => {
                console.log("🔄 Audio recuperado, reprogramando crossfade...");
                scheduleCrossfade();
            }).catch(err => {
                console.error("❌ No se pudo recuperar audio:", err);
            });
        }
        
        // Verificar que el crossfade esté programado
        if (!fadeInProgress && audio && audio.duration) {
            const timeUntilEnd = audio.duration - audio.currentTime;
            if (timeUntilEnd < CROSSFADE_TIME + 5 && timeUntilEnd > 0) {
                // Si falta poco y no hay crossfade programado, programarlo
                console.log("⏰ Programando crossfade de emergencia...");
                scheduleCrossfade();
            }
        }
    }
}, 5000); // Verificar cada 5 segundos
