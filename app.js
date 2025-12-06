let playlist = [];
let audio = new Audio();
let index = 0;
let isPlaying = false;

const playPauseBtn = document.getElementById("playPauseBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

let playlistLoaded = false;

// Cargar playlist generada automáticamente
fetch("playlist.json")
    .then(r => r.json())
    .then(data => {
        playlist = data.tracks;
        playlistLoaded = true;

        // Mezclar aleatoriamente al estilo radio
        shufflePlaylist();
        console.log("Playlist cargada y mezclada:", playlist);
    })
    .catch(err => console.error("Error cargando playlist:", err));

// Mezcla aleatoria tipo radio
function shufflePlaylist() {
    for (let i = playlist.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
}

// Cargar canción
function loadTrack(i) {
    if (!playlistLoaded || playlist.length === 0) return;
    audio.src = playlist[i];
    audio.load();
}

// Reproducir canción con arranque aleatorio tipo radio
function playTrack() {
    if (!playlistLoaded || playlist.length === 0) {
        console.log("Esperando playlist...");
        return;
    }

    loadTrack(index);

    audio.onloadedmetadata = () => {

        // Arranque aleatorio entre 0% y 85% para simular radio en vivo
        const randomStart = Math.random() * audio.duration * 0.85;
        audio.currentTime = randomStart;

        audio.play()
            .then(() => {
                isPlaying = true;
                playPauseBtn.textContent = "⏸";
            })
            .catch(err => console.error("Error en play:", err));
    };
}

// Pausar
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = "▶️";
}

// Botón play/pause
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

// Buscar en la barra
progressContainer.addEventListener("click", (ev) => {
    const width = progressContainer.clientWidth;
    const clickX = ev.offsetX;
    audio.currentTime = (clickX / width) * audio.duration;
});

// Cuando termina → siguiente tema aleatorio
audio.addEventListener("ended", () => {
    index = (index + 1) % playlist.length;
    playTrack();
});

