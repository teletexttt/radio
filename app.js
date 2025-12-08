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
}

// === Crossfade suave con inicio aleatorio ===
function startCrossfade() {
  if (fadeInProgress || !playlistLoaded) return;
  
  index = (index + 1) % playlist.length;

  if (index === 0) {
    complexShuffle();
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
