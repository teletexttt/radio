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
        loadTrack(audio, 0);
        
        // Esperar a que carguen metadatos para comenzar aleatorio
        audio.onloadedmetadata = function() {
            if (audio.duration > 60) {
                const randomStart = Math.random() * (audio.duration - 60);
                audio.currentTime = randomStart;
            }
            
            // Intentar reproducción después de configurar tiempo aleatorio
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
                        console.log("⏸️ Autoplay bloqueado.");
                    });
            }
        };
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

// === Cargar canción con inicio aleatorio ===
function loadTrack(player, i) {
  player.src = playlist[i];
  player.load();
  
  // Cuando los metadatos estén cargados, comenzar en punto aleatorio
  player.onloadedmetadata = function() {
    if (player.duration > 60) {
      const randomStart = Math.random() * (player.duration - 60);
      player.currentTime = randomStart;
    }
  };
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
        
        audio.pause();
        audio.src = nextAudio.src;
        audio.currentTime = nextAudio.currentTime;
        audio.volume = 1;
        
        audio.play();
        
        nextAudio = new Audio();
        
        scheduleCrossfade();
      }
    }, 50);
  };
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
    if (!fadeInProgress) {
        setTimeout(() => {
            index = (index + 1) % playlist.length;
            audio.src = playlist[index];
            audio.play();
        }, 2000);
    }
});
