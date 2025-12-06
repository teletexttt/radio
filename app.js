let playlist = [];
let index = 0;
let isPlaying = false;

let audio = new Audio();
let nextAudio = new Audio();

const playPauseBtn = document.getElementById("playPauseBtn");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");

let playlistLoaded = false;
const CROSSFADE_TIME = 3; // segundos

// Cargar playlist
fetch("playlist.json")
    .then(r => r.json())
    .then(data => {
        playlist = data.tracks;
        shufflePlaylist();
        playlistLoaded = true;
        console.log("Playlist cargada:", playlist);
    });

// Mezclar playlist
function shufflePlaylist() {
    for (let i = playlist.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
    }
}

function loadTrack(player, i) {
    player.src = playlist[i];
    player.load();
}

// Reproducir con inicio aleatorio
function playTrack() {
    if (!playlistLoaded || playlist.length === 0) return;

    loadTrack(audio, index);

    audio.onloadedmetadata = () => {
        // Salto aleatorio para simular radio
        const randomStart = Math.random() * audio.duration * 0.85;
        audio.currentTime = randomStart;

        audio.volume = 1;

        audio.play().then(() => {
            isPlaying = true;
            playPauseBtn.textContent = "⏸";

            scheduleCrossfade();
        });
    };
}

function scheduleCrossfade() {
    const remaining = audio.duration - audio.currentTime;

    if (remaining > CROSSFADE_TIME) {
        setTimeout(() => startCrossfade(), (remaining - CROSSFADE_TIME) * 1000);
    } else {
        startCrossfade();
    }
}

// Crossfade REAL compatible con navegadores
function startCrossfade() {
    index = (index + 1) % playlist.length;

    loadTrack(nextAudio, index);

    nextAudio.onloadedmetadata = () => {
        let t = 0;
        nextAudio.volume = 0;
        nextAudio.play();

        const interval = setInterval(() => {
            t += 0.05;

            audio.volume = Math.max(0, 1 - t / CROSSFADE_TIME);
            nextAudio.volume = Math.min(1, t / CROSSFADE_TIME);

            if (t >= CROSSFADE_TIME) {
                clearInterval(interval);

                audio.pause();
                audio = nextAudio;
                nextAudio = new Audio();

                scheduleCrossfade();
            }
        }, 50);
    };
}

// PAUSA
function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = "▶️";
}

// BOTÓN PLAY
playPauseBtn.addEventListener("click", () => {
    if (!isPlaying) playTrack();
    else pauseTrack();
});

// BARRA DE PROGRESO
audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        progressBar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
    }
});

// SEEK
progressContainer.addEventListener("click", e => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    audio.currentTime = (clickX / width) * audio.duration;
});
