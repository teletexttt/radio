// === TELEtext Radio v2 ===
// Crossfade + Shuffle avanzado + control automático

let playlist = [];
let index = 0;
let isPlaying = false;
let fadeInProgress = false;
let lastTrack = -1;

// MODIFICACIÓN: Usar el reproductor nativo del HTML
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
    complexShuffle(); // mezcla completa sin repetir la última
    playlistLoaded = true;
    console.log("✅ Playlist cargada:", playlist);
    
    // Precargar primera canción en el reproductor nativo
    if (audio && playlist.length > 0) {
        audio.src = playlist[0];
        console.log("🎵 Primera canción precargada en reproductor nativo");
    }
    
    // Intentar play automático (funciona en desktop, móvil necesita interacción)
    const playAttempt = audio.play();
    if (playAttempt !== undefined) {
        playAttempt
            .then(() => {
                isPlaying = true;
                if (playPauseBtn) playPauseBtn.textContent = "⏸";
                console.log("▶️ Autoplay exitoso");
                scheduleCrossfade();
            })
            .catch(error => {
                console.log("⏸️ Autoplay bloqueado. Usuario debe tocar PLAY.");
                // En móvil, el usuario debe tocar el botón del reproductor nativo
            });
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

// === Cargar canción ===
function loadTrack(player, i) {
  player.src = playlist[i];
  player.load();
}

// === Programar el próximo crossfade ===
function scheduleCrossfade() {
  if (!audio.duration) {
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

// === Crossfade suave y limpio ===
function startCrossfade() {
  if (fadeInProgress || !playlistLoaded) return;
  
  index = (index + 1) % playlist.length;

  if (index === 0) {
    // Cuando termina la lista, remezclar
    complexShuffle();
  }

  loadTrack(nextAudio, index);

  nextAudio.onloadedmetadata = () => {
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
        audio.pause();
        audio.src = nextAudio.src;
        audio.currentTime = nextAudio.currentTime;
        audio.volume = 1;
        
        // Reproducir el nuevo audio en el reproductor nativo
        audio.play();
        
        // Limpiar nextAudio
        nextAudio = new Audio();
        
        // Programar próximo crossfade
        scheduleCrossfade();
      }
    }, 50);
  };
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

// === Sincronizar estado del reproductor nativo ===
audio.addEventListener("play", () => {
    isPlaying = true;
    if (playPauseBtn) playPauseBtn.textContent = "⏸";
    
    // Si es la primera vez que se reproduce, programar crossfade
    if (!fadeInProgress && audio.currentTime === 0) {
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
    // Intentar siguiente canción si hay error
    if (!fadeInProgress) {
        setTimeout(() => {
            index = (index + 1) % playlist.length;
            audio.src = playlist[index];
            audio.play();
        }, 2000);
    }
});
