// === TELEtext Radio - Radio en vivo 24hs ===

let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = document.getElementById('radioPlayer');
let playlistLoaded = false;

// === HORA ARGENTINA ===
function getArgentinaTime() {
    const now = new Date();
    const argentinaOffset = -3 * 60; // UTC-3
    const localOffset = now.getTimezoneOffset();
    const offsetDiff = argentinaOffset + localOffset;
    return new Date(now.getTime() + offsetDiff * 60000);
}

// === CALCULAR ÍNDICE POR TIEMPO REAL ===
function calcularIndicePorTiempo() {
    if (!playlist || playlist.length === 0) return 0;
    
    const ahora = getArgentinaTime();
    const epoch = new Date(2025, 0, 1, 0, 0, 0); // 1 Ene 2025, 00:00 Argentina
    
    const milisegundosTranscurridos = ahora - epoch;
    if (milisegundosTranscurridos <= 0) return 0;
    
    const msPorCancion = 240 * 1000; // 4 minutos por canción
    const posicionContinua = Math.floor(milisegundosTranscurridos / msPorCancion);
    
    // Hash de playlist para variar inicio
    let hash = 0;
    for (let i = 0; i < playlist.length; i++) {
        const track = playlist[i];
        if (typeof track === 'string') {
            for (let j = 0; j < track.length; j++) {
                hash = (hash << 5) - hash + track.charCodeAt(j);
                hash |= 0;
            }
        }
    }
    
    const indiceFinal = (posicionContinua + Math.abs(hash)) % playlist.length;
    console.log(`📻 Índice por tiempo: ${indiceFinal}/${playlist.length}`);
    return indiceFinal;
}

// === CALCULAR POSICIÓN EN CANCIÓN ===
function calcularPosicionEnCancion() {
    const ahora = getArgentinaTime();
    const epoch = new Date(2025, 0, 1, 0, 0, 0);
    const milisegundosTranscurridos = ahora - epoch;
    
    if (milisegundosTranscurridos <= 0) return 0;
    
    const msPorCancion = 240 * 1000; // 4 minutos
    const posicionContinua = milisegundosTranscurridos / msPorCancion;
    const fraccionCancion = posicionContinua % 1;
    
    return fraccionCancion; // 0.0 = inicio, 0.5 = mitad, 0.99 = casi fin
}

// === Cargar playlist ===
fetch("playlist.json")
  .then(response => response.json())
  .then(data => {
    playlist = data.tracks || ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    
    // CALCULAR ÍNDICE POR TIEMPO REAL
    currentIndex = calcularIndicePorTiempo();
    loadTrack(currentIndex);
  })
  .catch(() => {
    playlist = ["music/toclimbthecliff.mp3", "music/doomsday.mp3"];
    playlistLoaded = true;
    currentIndex = calcularIndicePorTiempo();
    loadTrack(currentIndex);
  });

function loadTrack(index) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  const fullPath = track.startsWith('music/') ? track : 'music/' + track;
  
  audio.pause();
  audio.src = fullPath;
  audio.volume = 1;
  
  // POSICIÓN SINCRONIZADA EN TIEMPO REAL
  audio.onloadedmetadata = () => {
    const duracionTotal = audio.duration;
    
    if (duracionTotal > 30) {
        // 1. CALCULAR POSICIÓN EXACTA EN LA CANCIÓN
        const fraccion = calcularPosicionEnCancion();
        let posicionSegundos = fraccion * duracionTotal;
        
        // 2. LIMITAR: no empezar en los últimos 30 segundos
        const maxPosicion = duracionTotal - 30;
        if (posicionSegundos > maxPosicion) {
            posicionSegundos = maxPosicion;
        }
        
        // 3. MARGEN SEGURO: no empezar antes de 10 segundos
        const minPosicion = 10;
        if (posicionSegundos < minPosicion) {
            posicionSegundos = minPosicion;
        }
        
        audio.currentTime = posicionSegundos;
        console.log(`⏱️ Posición sincronizada: ${Math.floor(posicionSegundos)}s/${Math.floor(duracionTotal)}s`);
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

// === Botón de play/pause ===
document.addEventListener('DOMContentLoaded', function() {
    const playButton = document.getElementById('radioPlayButton');
    const playPath = document.getElementById('playPath');
    const pausePath1 = document.getElementById('pausePath1');
    const pausePath2 = document.getElementById('pausePath2');
    
    if (playButton) {
        playButton.addEventListener('click', function() {
            if (isPlaying) {
                // PAUSA
                audio.pause();
                isPlaying = false;
                playPath.setAttribute('opacity', '1');
                pausePath1.setAttribute('opacity', '0');
                pausePath2.setAttribute('opacity', '0');
            } else {
                // PLAY
                if (!audio.src) {
                    loadTrack(currentIndex);
                }
                audio.play().then(() => {
                    isPlaying = true;
                    playPath.setAttribute('opacity', '0');
                    pausePath1.setAttribute('opacity', '1');
                    pausePath2.setAttribute('opacity', '1');
                });
            }
        });
    }
});

// === Monitoreo automático ===
setInterval(() => {
  if (isPlaying && audio.paused && !audio.ended) {
    audio.play().catch(() => playNextTrack());
  }
}, 3000);

// === Iniciar con clic en cualquier parte ===
document.addEventListener('click', () => {
  if (!isPlaying && playlistLoaded) {
    if (!audio.src) loadTrack(currentIndex);
    audio.play().then(() => isPlaying = true);
  }
}, { once: true });

// === INTERFAZ DE PROGRAMACIÓN ===
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar "En vivo ahora"
    function updateCurrentShow() {
        const currentShow = document.getElementById('currentShow');
        const currentTimeName = document.getElementById('currentTimeName');
        const currentTimeRange = document.getElementById('currentTimeRange');
        
        if (currentShow && currentTimeName) {
            // Horarios simulados
            const ahora = getArgentinaTime();
            const hora = ahora.getHours();
            let programa = "", horario = "";
            
            if (hora >= 1 && hora < 6) {
                programa = "Madrugada txt";
                horario = "01:00 - 06:00";
            } else if (hora >= 6 && hora < 12) {
                programa = "Telesoft";
                horario = "06:00 - 12:00";
            } else if (hora >= 12 && hora < 16) {
                programa = "Radio 404";
                horario = "12:00 - 16:00";
            } else if (hora >= 16 && hora < 20) {
                programa = "Floppy Disk";
                horario = "16:00 - 20:00";
            } else {
                programa = "Piratas Informáticos";
                horario = "20:00 - 01:00";
            }
            
            currentShow.textContent = programa;
            if (currentTimeName) currentTimeName.textContent = programa;
            if (currentTimeRange) currentTimeRange.textContent = horario;
        }
    }
    
    // Generar programación
    function generateSchedule() {
        const scheduleGrid = document.querySelector('.schedule-grid');
        if (!scheduleGrid) return;
        
        const schedules = [
            { time: "01:00 - 06:00", name: "Madrugada txt", desc: "Sonidos atmosféricos y experimentales" },
            { time: "06:00 - 12:00", name: "Telesoft", desc: "Programa matutino con energía y ritmos" },
            { time: "12:00 - 16:00", name: "Radio 404", desc: "Ritmos variados y selecciones especiales" },
            { time: "16:00 - 20:00", name: "Floppy Disk", desc: "Transición hacia la noche" },
            { time: "20:00 - 01:00", name: "Piratas Informáticos", desc: "Sesiones extendidas nocturnas" }
        ];
        
        scheduleGrid.innerHTML = '';
        schedules.forEach(schedule => {
            const card = document.createElement('div');
            card.className = 'schedule-card';
            card.innerHTML = `
                <div class="schedule-time">${schedule.time}</div>
                <div class="schedule-name">${schedule.name}</div>
                <div class="schedule-desc">${schedule.desc}</div>
            `;
            scheduleGrid.appendChild(card);
        });
    }
    
    // Generar colecciones
    function generateCollections() {
        const collectionsGrid = document.querySelector('.collections-grid');
        if (!collectionsGrid) return;
        
        const collections = [
            { name: "Madrugada txt", tracks: 24, desc: "Selección atmosférica para las primeras horas" },
            { name: "Telesoft", tracks: 32, desc: "Energía y ritmos para comenzar el día" },
            { name: "Radio 404", tracks: 28, desc: "Ritmos variados característicos" },
            { name: "Floppy Disk", tracks: 30, desc: "Transición hacia la noche con sonidos profundos" },
            { name: "Piratas Informáticos", tracks: 35, desc: "Sesiones extendidas y atmósferas nocturnas" }
        ];
        
        collectionsGrid.innerHTML = '';
        collections.forEach(collection => {
            const card = document.createElement('div');
            card.className = 'collection-card';
            card.innerHTML = `
                <div class="collection-header">
                    <div class="collection-name">${collection.name}</div>
                    <div class="collection-meta">
                        <span>${collection.tracks} tracks</span>
                    </div>
                </div>
                <div class="collection-body">
                    <div class="collection-desc">${collection.desc}</div>
                </div>
            `;
            collectionsGrid.appendChild(card);
        });
    }
    
    // Botón compartir
    const shareButton = document.getElementById('shareRadioButton');
    if (shareButton) {
        shareButton.addEventListener('click', function() {
            const url = window.location.href;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    const originalHTML = shareButton.innerHTML;
                    shareButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
                    shareButton.style.borderColor = '#00FF37';
                    shareButton.style.color = '#00FF37';
                    
                    setTimeout(() => {
                        shareButton.innerHTML = originalHTML;
                        shareButton.style.borderColor = '';
                        shareButton.style.color = '';
                    }, 2000);
                });
            }
        });
    }
    
    // Inicializar interfaz
    updateCurrentShow();
    generateSchedule();
    generateCollections();
    
    // Actualizar cada minuto
    setInterval(updateCurrentShow, 60000);
});

console.log("📻 Teletext Radio cargado - Transmisión en vivo 24/7");
