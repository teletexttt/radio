// === TELEtext Radio v2 ===
// Crossfade + Shuffle avanzado + control automático

let playlist = [];
let index = 0;
let isPlaying = false;
let fadeInProgress = false;
let lastTrack = -1;

let audio = new Audio();
let nextAudio = new Audio();

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
    playTrack();
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

// === REPRODUCIR - VERSIÓN OPTIMIZADA ===
function playTrack() {
  if (!playlistLoaded || playlist.length === 0 || isPlaying || fadeInProgress) return;

  // Cargar y reproducir INMEDIATO
  loadTrack(audio, index);
  
  // Intentar reproducir YA, no esperar metadata
  const playAttempt = audio.play();
  
  if (playAttempt !== undefined) {
    playAttempt
      .then(() => {
        isPlaying = true;
        playPauseBtn.textContent = "⏸";
        console.log("▶️ Reproducción iniciada inmediata");
        
        // Programar crossfade después de asegurar reproducción
        audio.onloadedmetadata = () => {
          const randomStart = Math.random() * audio.duration * 0.8;
          audio.currentTime = randomStart;
          scheduleCrossfade();
        };
      })
      .catch(error => {
        console.log("⏸️ Autoplay bloqueado. Esperando interacción.");
        // Mostrar botón manual en web también
        showManualStartButton();
      });
  }
}

// Función auxiliar para botón manual
function showManualStartButton() {
  if (document.getElementById('manualStartBtn')) return;
  
  const btn = document.createElement('button');
  btn.id = 'manualStartBtn';
  btn.textContent = '▶️ INICIAR TRANSMISIÓN';
  btn.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 15px 30px;
    font-size: 1.2rem;
    background: #8a2be2;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 0 30px rgba(138, 43, 226, 0.7);
  `;
  
  btn.onclick = function() {
    // Forzar inicio con interacción del usuario
    audio.play().then(() => {
      isPlaying = true;
      playPauseBtn.textContent = "⏸";
      this.remove();
      scheduleCrossfade();
    });
  };
  
  document.body.appendChild(btn);
}

// Botón para móviles (si agregaste el HTML)
document.getElementById('startRadioBtn')?.addEventListener('click', function() {
  audio.play().then(() => {
    isPlaying = true;
    playPauseBtn.textContent = "⏸";
    this.parentElement.style.display = 'none';
    scheduleCrossfade();
  });
});

// === Programar el próximo crossfade ===
function scheduleCrossfade() {
  const remaining = audio.duration - audio.currentTime;

  if (remaining > CROSSFADE_TIME) {
    setTimeout(startCrossfade, (remaining - CROSSFADE_TIME) * 1000);
  } else {
    startCrossfade();
  }
}

// === Crossfade suave y limpio ===
function startCrossfade() {
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
        audio.pause();
        audio.src = "";
        audio = nextAudio;
        nextAudio = new Audio();
        scheduleCrossfade();
      }
    }, 50);
  };
}

// === Botón Play/Pause ===
playPauseBtn.addEventListener("click", () => {
  if (!isPlaying) playTrack();
  else pauseTrack();
});

function pauseTrack() {
  audio.pause();
  isPlaying = false;
  playPauseBtn.textContent = "▶️";
}

// === Barra de progreso ===
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    progressBar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  }
});

// === Control manual de seek ===
progressContainer.addEventListener("click", e => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  audio.currentTime = (clickX / width) * audio.duration;
});


