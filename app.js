// === TELEtext Radio - Radio sincronizada 24/7 con programas ===
// CONFIGURACIÓN DE PROGRAMAS
const PROGRAMACION = [
    { hora: 1,  duracion: 5,  programa: "madrugadatxt", nombre: "Madrugada txt" },      // 01:00 - 06:00
    { hora: 6,  duracion: 6,  programa: "telesoft",     nombre: "Telesoft" },           // 06:00 - 12:00
    { hora: 12, duracion: 4,  programa: "radio404",     nombre: "Radio 404" },          // 12:00 - 16:00
    { hora: 16, duracion: 4,  programa: "especialestxt", nombre: "Especiales txt" },    // 16:00 - 20:00
    { hora: 20, duracion: 5,  programa: "teletext",     nombre: "Teletext" }            // 20:00 - 01:00
];

// Variables del reproductor
let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let audio = document.getElementById('radioPlayer');
let playlistLoaded = false;
let programaActual = null;

// === HORA ARGENTINA ===
function getArgentinaTime() {
    const now = new Date();
    const argentinaOffset = -3 * 60;
    const localOffset = now.getTimezoneOffset();
    const offsetDiff = argentinaOffset + localOffset;
    return new Date(now.getTime() + offsetDiff * 60000);
}

// === OBTENER PROGRAMA ACTUAL ===
function getProgramaActual() {
    const ahora = getArgentinaTime();
    const horaActual = ahora.getHours();
    
    for (const bloque of PROGRAMACION) {
        let horaFin = bloque.hora + bloque.duracion;
        if (horaFin > 24) horaFin -= 24;
        
        if (horaActual >= bloque.hora && horaActual < horaFin) {
            return bloque;
        }
    }
    
    // Si es después de la 1AM pero antes de las 6AM (cruce de día)
    return PROGRAMACION[0]; // Madrugada txt por defecto
}

// === Cargar playlist del programa activo ===
function cargarPlaylistDelPrograma() {
    const bloque = getProgramaActual();
    
    if (programaActual === bloque.programa && playlist.length > 0) {
        return Promise.resolve(); // Ya tenemos la playlist correcta
    }
    
    console.log(`📻 Cambiando a programa: ${bloque.nombre} (${bloque.programa})`);
    programaActual = bloque.programa;
    
    return fetch(`music/${bloque.programa}/playlist.json`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            playlist = data.tracks || [];
            playlistLoaded = true;
            
            // Actualizar interfaz
            actualizarInterfazPrograma(bloque);
            console.log(`✅ Playlist cargada: ${playlist.length} tracks`);
            
            // Si estaba reproduciendo, continuar con nueva playlist
            if (isPlaying) {
                currentIndex = 0;
                loadTrack(currentIndex, 0);
            }
        })
        .catch(error => {
            console.error(`❌ Error cargando ${bloque.programa}:`, error);
            // Fallback a playlist de emergencia
            return fetch(`music/teletext/playlist.json`)
                .then(r => r.json())
                .then(data => {
                    playlist = data.tracks || [];
                    playlistLoaded = true;
                    console.log(`🔄 Usando playlist de emergencia: ${playlist.length} tracks`);
                });
        });
}

// === CALCULAR CANCIÓN Y POSICIÓN EXACTA (MISMA LÓGICA) ===
function calcularCancionYPosicion() {
    if (!playlist || playlist.length === 0) return { index: 0, position: 0 };
    
    const ahora = getArgentinaTime();
    const epoch = new Date(2025, 0, 1, 0, 0, 0);
    const segundosTranscurridos = (ahora - epoch) / 1000;
    if (segundosTranscurridos <= 0) return { index: 0, position: 0 };
    
    const duracionTotalPlaylist = playlist.reduce((sum, track) => sum + (track.duration || 300), 0);
    const ciclosCompletos = Math.floor(segundosTranscurridos / duracionTotalPlaylist);
    const segundosEnCicloActual = segundosTranscurridos - (ciclosCompletos * duracionTotalPlaylist);
    
    let tiempoAcumulado = 0;
    for (let i = 0; i < playlist.length; i++) {
        const duracionCancion = playlist[i].duration || 300;
        
        if (segundosEnCicloActual < tiempoAcumulado + duracionCancion) {
            const posicionEnCancion = segundosEnCicloActual - tiempoAcumulado;
            
            if (posicionEnCancion >= 0 && posicionEnCancion < duracionCancion - 5) {
                console.log(`🎯 Sincronizado: ${i+1}/${playlist.length}, posición ${Math.floor(posicionEnCancion)}s`);
                return { index: i, position: posicionEnCancion };
            } else {
                return { index: (i + 1) % playlist.length, position: 0 };
            }
        }
        tiempoAcumulado += duracionCancion;
    }
    
    return { index: 0, position: 0 };
}

// === Funciones del reproductor (IGUALES que antes) ===
function loadTrack(index, startPosition = 0) {
    if (!playlistLoaded || index >= playlist.length) return;
    
    currentIndex = index;
    const track = playlist[index];
    const fullPath = track.url || track.path || `music/${programaActual}/${track.file}`;
    
    audio.pause();
    audio.src = fullPath;
    audio.volume = 1;
    
    audio.onloadedmetadata = () => {
        const duracionTotal = track.duration || audio.duration || 300;
        let posicionSegundos;
        
        if (startPosition === 0) {
            posicionSegundos = 0;
            console.log(`▶️ Canción siguiente: ${track.file}, inicio desde 0s`);
        } else {
            posicionSegundos = Math.min(Math.max(startPosition, 10), duracionTotal - 5);
            console.log(`⏱️ Canción actual: ${track.file}, posición: ${Math.floor(posicionSegundos)}s`);
        }
        
        audio.currentTime = posicionSegundos;
        
        if (isPlaying) {
            audio.play().catch(e => console.log("Auto-play bloqueado:", e));
        }
    };
    
    audio.onended = () => setTimeout(playNextTrack, 500);
    audio.onerror = () => setTimeout(playNextTrack, 2000);
}

function playNextTrack() {
    if (!playlistLoaded || playlist.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    console.log(`⏭️ Siguiente: ${nextIndex+1}/${playlist.length}`);
    
    const fadeOut = setInterval(() => {
        if (audio.volume > 0.1) {
            audio.volume -= 0.1;
        } else {
            clearInterval(fadeOut);
            loadTrack(nextIndex, 0);
            audio.play().then(() => {
                isPlaying = true;
            }).catch(() => playNextTrack());
        }
    }, 50);
}

// === Actualizar interfaz ===
function actualizarInterfazPrograma(bloque) {
    const currentShow = document.getElementById('currentShow');
    const currentTimeName = document.getElementById('currentTimeName');
    const currentTimeRange = document.getElementById('currentTimeRange');
    
    if (currentShow) currentShow.textContent = bloque.nombre;
    if (currentTimeName) currentTimeName.textContent = bloque.nombre;
    
    if (currentTimeRange) {
        let horaFin = bloque.hora + bloque.duracion;
        if (horaFin >= 24) horaFin -= 24;
        currentTimeRange.textContent = `${bloque.hora}:00 - ${horaFin}:00`;
    }
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', function() {
    // Cargar playlist inicial
    cargarPlaylistDelPrograma().then(() => {
        const { index, position } = calcularCancionYPosicion();
        currentIndex = index;
        
        // Configurar botón play
        const playButton = document.getElementById('radioPlayButton');
        const playPath = document.getElementById('playPath');
        const pausePath1 = document.getElementById('pausePath1');
        const pausePath2 = document.getElementById('pausePath2');
        
        if (playButton) {
            playButton.addEventListener('click', function() {
                if (isPlaying) {
                    audio.pause();
                    isPlaying = false;
                    playPath.setAttribute('opacity', '1');
                    pausePath1.setAttribute('opacity', '0');
                    pausePath2.setAttribute('opacity', '0');
                } else {
                    if (!audio.src) {
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
    });
    
    // Verificar cambio de programa cada minuto
    setInterval(() => {
        cargarPlaylistDelPrograma();
    }, 60000);
    
    // Monitoreo de reproducción
    setInterval(() => {
        if (isPlaying && audio.paused && !audio.ended) {
            audio.play().catch(() => playNextTrack());
        }
    }, 3000);
    
    // Sincronización periódica
    setInterval(() => {
        if (playlistLoaded && playlist.length > 0) {
            const { index, position } = calcularCancionYPosicion();
            
            if (index !== currentIndex) {
                console.log("🔄 Sincronizando con emisión...");
                currentIndex = index;
                loadTrack(currentIndex, position);
            } else if (isPlaying && audio.currentTime) {
                const desfase = Math.abs(audio.currentTime - position);
                if (desfase > 10) {
                    console.log(`🔄 Corrigiendo desfase: ${Math.floor(desfase)}s`);
                    audio.currentTime = position;
                }
            }
        }
    }, 30000);
});

console.log("📻 Teletext Radio - Sistema de programas activado");
