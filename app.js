// === TELEtext Radio - Radio en vivo 24hs ===

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = document.getElementById('radioPlayer');
let playlistLoaded = false;
let isFirstPlay = true;

// === Cargar playlist ===
fetch("playlist.json")
  .then(response => response.json())
  .then(data => {
    playlist = data.tracks || ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    shufflePlaylist();
    loadTrack(0);
  })
  .catch(() => {
    playlist = ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    shufflePlaylist();
    loadTrack(0);
  });

function shufflePlaylist() {
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
}

function loadTrack(index) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  const fullPath = track.startsWith('music/') ? track : 'music/' + track;
  
  audio.pause();
  audio.src = fullPath;
  audio.volume = 1;
  
  // CORRECCIÓN: Canciones empiezan desde el principio
  audio.onloadedmetadata = () => {
    const saved = localStorage.getItem('radio_state');
    
    if (saved) {
        // Caso especial: recuperando después de F5
        const state = JSON.parse(saved);
        audio.currentTime = state.currentTime || 0;
        localStorage.removeItem('radio_state');
    } else if (isFirstPlay && audio.duration > 60) {
        // Solo primera canción de la sesión empieza aleatorio
        audio.currentTime = Math.random() * (audio.duration - 60);
        isFirstPlay = false;
    } else {
        // NORMAL: todas las canciones empiezan desde 0
        audio.currentTime = 0;
    }
  };
  
  audio.onended = () => setTimeout(playNextTrack, 500);
  audio.onerror = () => setTimeout(playNextTrack, 2000);
}

function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  
  // Fade out simple
  const fadeOut = setInterval(() => {
    if (audio.volume > 0.1) {
      audio.volume -= 0.1;
    } else {
      clearInterval(fadeOut);
      loadTrack(nextIndex);
      audio.play().then(() => {
        isPlaying = true;
      }).catch(() => playNextTrack());
    }
  }, 50);
}

// === Iniciar con clic en cualquier parte ===
document.addEventListener('click', () => {
  if (!isPlaying && playlistLoaded) {
    if (!audio.src) loadTrack(currentIndex);
    audio.play().then(() => isPlaying = true);
  }
}, { once: true });

// === Monitoreo automático ===
setInterval(() => {
  if (isPlaying && audio.paused && !audio.ended) {
    audio.play().catch(() => playNextTrack());
  }
}, 3000);

// === SOLUCIÓN PARA F5 - PERSISTENCIA ===
window.addEventListener('beforeunload', () => {
    if (isPlaying) {
        localStorage.setItem('radio_state', JSON.stringify({
            playing: true,
            index: currentIndex,
            playlist: playlist,
            currentTime: audio.currentTime,
            src: audio.src
        }));
    } else {
        localStorage.removeItem('radio_state');
    }
});

window.addEventListener('load', () => {
    const saved = localStorage.getItem('radio_state');
    if (!saved) return;
    
    const state = JSON.parse(saved);
    
    if (state.playlist && state.playlist.length > 0) {
        playlist = state.playlist;
        currentIndex = state.index || 0;
        
        if (state.src && playlistLoaded) {
            audio.src = state.src;
            audio.currentTime = state.currentTime || 0;
            
            audio.play().then(() => {
                isPlaying = true;
                isFirstPlay = false;
            }).catch(e => {
                document.addEventListener('click', () => {
                    audio.play().then(() => isPlaying = true);
                }, { once: true });
            });
        }
    }
});

audio.addEventListener('ended', () => {
    localStorage.removeItem('radio_state');
});



