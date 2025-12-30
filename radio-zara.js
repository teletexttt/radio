// radio-zara.js - SISTEMA CON VERIFICACIÓN CONTINUA
document.addEventListener('DOMContentLoaded', function() {
    const playButton = document.getElementById('radioPlayButton');
    const shareButton = document.getElementById('shareRadioButton');
    let audioPlayer = document.getElementById('radioPlayer');
    const playPath = document.getElementById('playPath');
    const pausePath1 = document.getElementById('pausePath1');
    const pausePath2 = document.getElementById('pausePath2');
    const currentShow = document.getElementById('currentShow');
    const currentTimeName = document.getElementById('currentTimeName');
    const currentTimeRange = document.getElementById('currentTimeRange');
    const scheduleGrid = document.querySelector('.schedule-grid');
    
    let isPlaying = false;
    let currentPlaylist = [];
    let currentTrackIndex = 0;
    let verificationInterval = null;
    
    // ========== CONFIGURACIÓN ==========
    const programNames = {
        "madrugada": "Radio 404",
        "mañana": "Archivo txt", 
        "tarde": "Telesoft",
        "mediatarde": "Floppy Disk",
        "noche": "Internet Archive",
        "especial": "Especiales txt"
    };
    
    const programDescriptions = {
        "madrugada": "Sonidos atmosféricos y experimentales para las primeras horas del día.",
        "mañana": "Programa matutino con energía y ritmos para comenzar el día.",
        "tarde": "Ritmos variados y selecciones especiales para acompañar la tarde.",
        "mediatarde": "Transición hacia la noche con sonidos más atmosféricos.",
        "noche": "Sesiones extendidas y atmósferas nocturnas para terminar el día.",
        "especial": "Programación especial viernes y sábados de 22:00 a 00:00."
    };
    
    const scheduleData = {
        "schedules": [
            {"name": "madrugada", "displayName": "Radio 404", "start": "01:00", "end": "06:00"},
            {"name": "mañana", "displayName": "Archivo txt", "start": "06:00", "end": "12:00"},
            {"name": "tarde", "displayName": "Telesoft", "start": "12:00", "end": "16:00"},
            {"name": "mediatarde", "displayName": "Floppy Disk", "start": "16:00", "end": "20:00"},
            {"name": "noche", "displayName": "Internet Archive", "start": "20:00", "end": "01:00"},
            {"name": "especial", "displayName": "Especiales txt", "start": "22:00", "end": "00:00"}
        ]
    };
    
    // ========== FUNCIONES PROGRAMA ==========
    function getArgentinaTime() {
        const now = new Date();
        const argentinaOffset = -3 * 60;
        const localOffset = now.getTimezoneOffset();
        const offsetDiff = argentinaOffset + localOffset;
        return new Date(now.getTime() + offsetDiff * 60000);
    }
    
    function formatTimeForDisplay(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    function getCurrentSchedule() {
        const now = getArgentinaTime();
        const day = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        for (const schedule of scheduleData.schedules) {
            if (schedule.name === "especial" && day !== 5 && day !== 6) continue;
            
            const start = schedule.start.split(':').map(Number);
            const end = schedule.end.split(':').map(Number);
            const startTime = start[0] * 60 + start[1];
            let endTime = end[0] * 60 + end[1];
            
            if (endTime < startTime) endTime += 24 * 60;
            const adjustedCurrentTime = currentTime + (currentTime < startTime ? 24 * 60 : 0);
            if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
                return schedule;
            }
        }
        return scheduleData.schedules[0];
    }
    
    // ========== CÁLCULO PRECISO ==========
    function calcularPosicionActual() {
        const ahora = getArgentinaTime();
        const segundosHoy = (ahora.getHours() * 3600) + (ahora.getMinutes() * 60) + ahora.getSeconds();
        
        if (currentPlaylist.length === 0) return { trackIndex: 0, segundoEnTrack: 0 };
        
        const duracionTotal = currentPlaylist.length * 240;
        const segundosEnCiclo = segundosHoy % duracionTotal;
        const trackIndex = Math.floor(segundosEnCiclo / 240) % currentPlaylist.length;
        const segundoEnTrack = segundosEnCiclo % 240;
        
        return { trackIndex, segundoEnTrack };
    }
    
    // ========== VERIFICACIÓN CONTINUA ==========
    function iniciarVerificacion() {
        detenerVerificacion();
        
        verificationInterval = setInterval(() => {
            if (!isPlaying || currentPlaylist.length === 0) return;
            
            const posicionActual = calcularPosicionActual();
            const posicionAudio = audioPlayer.currentTime;
            const diferencia = Math.abs(posicionActual.segundoEnTrack - posicionAudio);
            
            // Re-sincronizar si hay desfase > 5 segundos
            if (diferencia > 5 && !audioPlayer.ended) {
                console.log(`🔄 Re-sincronizando: ${Math.floor(posicionAudio)}s → ${posicionActual.segundoEnTrack}s`);
                audioPlayer.currentTime = posicionActual.segundoEnTrack;
            }
            
            // Cambiar de canción si es necesario
            if (posicionActual.trackIndex !== currentTrackIndex) {
                console.log(`🔄 Cambio de canción por horario`);
                currentTrackIndex = posicionActual.trackIndex;
                cargarYReproducirTrackActual();
            }
            
            // Forzar fin si pasó el tiempo
            if (posicionActual.segundoEnTrack >= 239 && !audioPlayer.ended) {
                console.log('⏰ Fin de canción detectado');
                playNextTrack();
            }
        }, 3000); // Verificar cada 3 segundos
    }
    
    function detenerVerificacion() {
        if (verificationInterval) {
            clearInterval(verificationInterval);
            verificationInterval = null;
        }
    }
    
    // ========== ZARA RADIO ==========
    async function loadZaraPlaylist() {
        try {
            console.log('📻 Cargando playlist...');
            const response = await fetch('playlist.json');
            const data = await response.json();
            
            currentPlaylist = data.tracks.map(track => ({
                path: track,
                file: track.split('/').pop()
            }));
            
            // Posicionar según hora actual
            const posicion = calcularPosicionActual();
            currentTrackIndex = posicion.trackIndex;
            
            console.log(`⏱️ Sincronizado: canción ${currentTrackIndex + 1}/${currentPlaylist.length}`);
            console.log(`   Segundo en canción: ${posicion.segundoEnTrack}s`);
            
            updateDisplayInfo();
            
        } catch (error) {
            console.error('Error:', error);
            currentPlaylist = [];
            currentTrackIndex = 0;
        }
    }
    
    function cargarYReproducirTrackActual() {
        if (currentPlaylist.length === 0) return;
        
        const track = currentPlaylist[currentTrackIndex];
        const posicion = calcularPosicionActual();
        
        console.log(`🎵 ${track.file} (segundo ${Math.floor(posicion.segundoEnTrack)})`);
        
        audioPlayer.src = track.path;
        audioPlayer.currentTime = posicion.segundoEnTrack;
        
        if (isPlaying) {
            audioPlayer.play().catch(e => {
                console.error('❌ Error:', e.name);
                playNextTrack();
            });
        }
        
        audioPlayer.onerror = function() {
            console.error('❌ Error audio');
            playNextTrack();
        };
    }
    
    function playNextTrack() {
        if (currentPlaylist.length === 0) return;
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        console.log(`⏭️ ${currentTrackIndex + 1}/${currentPlaylist.length}`);
        cargarYReproducirTrackActual();
    }
    
    function updateDisplayInfo() {
        const schedule = getCurrentSchedule();
        const displayName = schedule.displayName || programNames[schedule.name];
        currentShow.textContent = displayName;
        currentTimeName.textContent = displayName;
        currentTimeRange.textContent = `${formatTimeForDisplay(schedule.start)} - ${formatTimeForDisplay(schedule.end)}`;
    }
    
    function generateScheduleCards() {
        if (!scheduleGrid) return;
        scheduleGrid.innerHTML = '';
        scheduleData.schedules.forEach(schedule => {
            const card = document.createElement('div');
            card.className = 'schedule-card';
            const displayName = schedule.displayName || programNames[schedule.name];
            const description = programDescriptions[schedule.name] || '';
            card.innerHTML = `
                <div class="schedule-time">${formatTimeForDisplay(schedule.start)} - ${formatTimeForDisplay(schedule.end)}</div>
                <div class="schedule-name">${displayName}</div>
                <div class="schedule-desc">${description}</div>
            `;
            scheduleGrid.appendChild(card);
        });
    }
    
    function updatePlayButton() {
        playPath.setAttribute('opacity', isPlaying ? '0' : '1');
        pausePath1.setAttribute('opacity', isPlaying ? '1' : '0');
        pausePath2.setAttribute('opacity', isPlaying ? '1' : '0');
    }
    
    // ========== EVENTOS ==========
    playButton.addEventListener('click', async function() {
        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
            detenerVerificacion();
        } else {
            if (currentPlaylist.length === 0) await loadZaraPlaylist();
            
            const track = currentPlaylist[currentTrackIndex];
            const isSameTrack = audioPlayer.src && audioPlayer.src.includes(track.file);
            
            if (isSameTrack && !audioPlayer.ended) {
                audioPlayer.play().then(() => {
                    isPlaying = true;
                    console.log('▶️ Reanudando transmisión');
                    iniciarVerificacion();
                }).catch(e => {
                    console.error('Error reanudando:', e);
                    cargarYReproducirTrackActual();
                });
            } else {
                isPlaying = true;
                cargarYReproducirTrackActual();
                iniciarVerificacion();
            }
        }
        updatePlayButton();
    });
    
    // ========== INICIALIZACIÓN ==========
    async function init() {
        console.log('🚀 Iniciando Zara Radio (Sistema Verificado)...');
        await loadZaraPlaylist();
        generateScheduleCards();
        setInterval(updateDisplayInfo, 60000);
        console.log('✅ Radio lista - Verificación continua activa');
    }
    
    init();
});
