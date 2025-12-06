
let playlist = [];
let audio = new Audio();
let index = 0;
let isPlaying = false;

const playPauseBtn = document.getElementById("playPauseBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

// Esperar a que cargue la playlist antes de permitir play
let playlistLoaded = false;

fetch("playlist.json")
    .then(r => r.json())
    .then(data => {
        playlist = data.tracks;
        playlistLoaded = true;
        console.log("Playlist cargada:", playlist);
    })
    .catch(err => console.error("Error cargando playlist:", err));

function loadTrack(i) {
    if (!playlistLoaded || playlist.length === 0) {
        console.log("Esperando carga de playlist...");
        return;
    }

    audio.src = playlist[i];
    audio.load(); // 🔥 NECESARIO
}

// Reproducir canción
function playTrack() {
    if (!playlistLoaded || playlist.length === 0) {
        console.log("Playlist todavía no lista...");
        return;
    }

    loadTrack(index);

    // Reproducir, luego saltar a un punto aleatorio (si es la primera vez)
    audio.onloadedmetadata = () => {
        if (!isPlaying) {
            // Arrancar en un punto aleatorio entre 0% y 90%
            const randomStart = Math.random() * audio.duration * 0.90;
            audio.currentTime = randomStart;
        }

        audio.play()
            .then(() => {
                isPlaying = true;
                playPauseBtn.textContent = "⏸";
            })
            .catch(err => console.error("Error al reproducir:", err));
    };
}


// Pausar
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = "▶️";
}

// Click en botón
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
    loadTrack(index);
    playTrack();
});

