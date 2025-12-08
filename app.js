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

// === Reproducir ===
function playTrack() {
  if (!playlistLoaded || playlist.length === 0 || isPlaying || fadeInProgress) return;

  loadTrack(audio, index);

  audio.onloadedmetadata = () => {
    // Salida desde un punto aleatorio (radio style)
    const randomStart = Math.random() * audio.duration * 0.8;
    audio.currentTime = randomStart;
    audio.volume = 1;

    audio.play().then(() => {
      isPlaying = true;
      playPauseBtn.textContent = "⏸";
      scheduleCrossfade();
    }).catch(err => console.log("Autoplay bloqueado:", err));
  };
}

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

