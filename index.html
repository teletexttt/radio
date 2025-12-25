// === TELEtext Radio - Radio sincronizada 24/7 ===

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

// === CALCULAR CANCIÓN Y POSICIÓN EXACTA ===
function calcularCancionYPosicion() {
    if (!playlist || playlist.length === 0) return { index: 0, position: 0 };
    
    const ahora = getArgentinaTime();
    const epoch = new Date(2025, 0, 1, 0, 0, 0); // 1 Ene 2025, 00:00 Argentina
    
    // Segundos transcurridos desde epoch
    const segundosTranscurridos = (ahora - epoch) / 1000;
    if (segundosTranscurridos <= 0) return { index: 0, position: 0 };
    
    // Calcular ciclo total de playlist
    const duracionTotalPlaylist = playlist.reduce((sum, track) => sum + (track.duration || 300), 0);
    const ciclosCompletos = Math.floor(segundosTranscurridos / duracionTotalPlaylist);
    const segundosEnCicloActual = segundosTranscurridos - (ciclosCompletos * duracionTotalPlaylist);
    
    // Encontrar canción actual y posición exacta
    let tiempoAcumulado = 0;
    for (let i = 0; i < playlist.length; i++) {
        const duracionCancion = playlist[i].duration || 300;
        
        if (segundosEnCicloActual < tiempoAcumulado + duracionCancion) {
            const posicionEnCancion = segundosEnCicloActual - tiempoAcumulado;
            
            // Verificar que la posición sea válida
            if (posicionEnCancion >= 0 && posicionEnCancion < duracionCancion - 5) {
                console.log(`📻 Sincronizado: Canción ${i+1}/${playlist.length}, posición ${Math.floor(posicionEnCancion)}s`);
                return { index: i, position: posicionEnCancion };
            } else {
                // Si está en los últimos 5 segundos, pasar a la siguiente
                return { index: (i + 1) % playlist.length, position: 0 };
            }
        }
        tiempoAcumulado += duracionCancion;
    }
    
    return { index: 0, position: 0 };
}

// === Cargar playlist ===
fetch("playlist.json")
  .then(response => response.json())
  .then(data => {
    playlist = data.tracks || [];
    
    // Si es formato antiguo (array de strings), convertir
    if (playlist.length > 0 && typeof playlist[0] === 'string') {
        playlist = playlist.map(file => ({
            file: file,
            path: file.startsWith('music/') ? file : 'music/' + file,
            duration: 300 // duración por defecto
        }));
    }
    
    playlistLoaded = true;
    
    // CALCULAR POSICIÓN EXACTA
    const { index, position } = calcularCancionYPosicion();
    currentIndex = index;
    
    // Cargar canción con posición exacta
    setTimeout(() => loadTrack(currentIndex, position), 100);
  })
  .catch(() => {
    playlist = [
        { file: "toclimbthecliff.mp3", path: "music/toclimbthecliff.mp3", duration: 300 },
        { file: "doomsday.mp3", path: "music/doomsday.mp3", duration: 300 }
    ];
    playlistLoaded = true;
    
    const { index, position } = calcularCancionYPosicion();
    currentIndex = index;
    setTimeout(() => loadTrack(currentIndex, position), 100);
  });

function loadTrack(index, startPosition = 0) {
  if (!playlistLoaded || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  const fullPath = track.path || (track.file.startsWith('music/') ? track.file : 'music/' + track.file);
  
  audio.pause();
  audio.src = fullPath;
  audio.volume = 1;
  
  // POSICIÓN EXACTA SINCRONIZADA
  audio.onloadedmetadata = () => {
    const duracionTotal = track.duration || audio.duration || 300;
    
    if (duracionTotal > 10) {
        // ✅ CORRECCIÓN: Si startPosition es 0 (canción siguiente), usar 0
        // Si startPosition tiene valor (canción actual), usar posición sincronizada
        
        let posicionSegundos;
        
        if (startPosition === 0) {
            // CANCIÓN SIGUIENTE: siempre empieza desde 0
            posicionSegundos = 0;
            console.log(`▶️ Canción siguiente: ${track.file}, inicio desde 0s`);
        } else {
            // CANCIÓN ACTUAL: usar posición sincronizada
            posicionSegundos = Math.min(Math.max(startPosition, 10), duracionTotal - 5);
            console.log(`⏱️ Canción actual: ${track.file}, posición: ${Math.floor(posicionSegundos)}s`);
        }
        
        audio.currentTime = posicionSegundos;
        
        // Auto-play si estaba reproduciendo
        if (isPlaying) {
            audio.play().catch(e => console.log("Auto-play bloqueado:", e));
        }
    }
  };
  
  audio.onended = () => setTimeout(playNextTrack, 500);
  audio.onerror = () => setTimeout(playNextTrack, 2000);
}

function playNextTrack() {
  if (!playlistLoaded || playlist.length === 0) return;
  
  const nextIndex = (currentIndex + 1) % playlist.length;
  
  console.log(`⏭️ Reproduciendo siguiente canción: ${nextIndex+1}/${playlist.length}`);
  
  // Fade out simple
  const fadeOut = setInterval(() => {
    if (audio.volume > 0.1) {
      audio.volume -= 0.1;
    } else {
      clearInterval(fadeOut);
      loadTrack(nextIndex, 0); // ✅ Iniciar desde 0
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
                    const { index, position } = calcularCancionYPosicion();
                    currentIndex = index;
                    loadTrack(currentIndex, position);
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

// === Sincronización periódica (cada 30 segundos) ===
setInterval(() => {
  if (playlistLoaded && playlist.length > 0) {
    const { index, position } = calcularCancionYPosicion();
    
    // Si la canción calculada es diferente a la actual
    if (index !== currentIndex) {
      console.log("🔄 Sincronizando con emisión...");
      currentIndex = index;
      loadTrack(currentIndex, position);
    }
    // Si es la misma canción pero con desfase > 10 segundos
    else if (isPlaying && audio.currentTime) {
      const desfase = Math.abs(audio.currentTime - position);
      if (desfase > 10) {
        console.log(`🔄 Corrigiendo desfase: ${Math.floor(desfase)}s`);
        audio.currentTime = position;
      }
    }
  }
}, 30000); // 30 segundos

// === Iniciar con clic en cualquier parte ===
document.addEventListener('click', () => {
  if (!isPlaying && playlistLoaded) {
    const { index, position } = calcularCancionYPosicion();
    currentIndex = index;
    
    if (!audio.src) loadTrack(currentIndex, position);
    audio.play().then(() => isPlaying = true);
  }
}, { once: true });

// === INTERFAZ DE PROGRAMACIÓN (sin cambios) ===
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

console.log("📻 Teletext Radio - Cada canción siguiente empieza desde 0");
