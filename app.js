// === TELEtext Radio Continuous Player ===
// Reproducción continua con crossfade y control de playlist.json

let playlist = [];
let index = 0;
let isPlaying = false;
let fadeInProgress = false;

let audio = new Audio();
let nextAudio = new Audio();

const playPauseBtn = document.getElementById("playPauseBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

let playlistLoaded = false;
const CROSSFADE_TIME = 3; // segundos de mezcla

// === Cargar playlist ===
fetch("playlist.json")
  .then(r => r.json())
  .then(data => {
    playlist = data.tracks;
    shufflePlaylist(); // comentar esta línea si querés orden fijo
    playlistLoaded = true;
    console.log("✅ Playlist cargada:", playlist);
    playTrack(); // inicia automáticamente
  })
  .catch(err => console.error("❌ Error cargando playlist:", err));

// === Mezclar playlist ===
function shufflePlaylist() {
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
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
    const randomStart = Math.random() * audio.duration * 0.85;
    audio.currentTime = randomStart;
    audio.volume = 1;

    audio.play().then(() => {
      isPlaying = true;
      playPauseBtn.textContent = "⏸";
      scheduleCrossfade();
    }).catch(err => {
      console.log("Autoplay bloqueado o error:", err);
    });
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

// === Crossfade real y continuo ===
function startCrossfade() {
  index = (index + 1) % playlist.length;
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
        audio.src = ""; // libera el anterior
        audio = nextAudio;
        nextAudio = new Audio();
        scheduleCrossfade(); // continúa ciclo infinito
      }
    }, 50);
  };
}

// === Botón Play/Pause ===
playPauseBtn.addEventListener("click", () => {
  if (!isPlaying) {
    playTrack();
  } else {
    pauseTrack();
  }
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
progressContain

