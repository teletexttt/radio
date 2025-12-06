let playlist = [];
let audio = new Audio();
let index = 0;
let isPlaying = false;

const playPauseBtn = document.getElementById("playPauseBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

// Cargar playlist generada automáticamente por GitHub
fetch("playlist.json")
    .then(r => r.json())
    .then(data => {
        playlist = data.tracks;
    });

// Reproducir canción
function playTrack() {
    audio.src = playlist[index];
    audio.play();
    isPlaying = true;
    playPauseBtn.textContent = "⏸";
}

// Pausar
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = "▶️";
}

playPauseBtn.addEventListener("click", () => {
    if (!isPlaying) playTrack();
    else pauseTrack();
});

// Barra de progreso
audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        let pct = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = pct + "%";
    }
});

// Click en barra
progressContainer.addEventListener("click", (ev) => {
    const width = progressContainer.clientWidth;
    const clickX = ev.offsetX;
    audio.currentTime = (clickX / width) * audio.duration;
});

// Loop infinito
audio.addEventListener("ended", () => {
    index = (index + 1) % playlist.length;
    playTrack();
});
