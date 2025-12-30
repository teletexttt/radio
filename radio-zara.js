// radio-zara.js - RADIO SIMPLE 1→2→3 - TRANSMISIÓN SINCRONIZADA
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
    let trackStartTime = 0; // Timestamp de cuándo empezó esta canción
    
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
    
    // ========== TRANSMISIÓN SINCRONIZADA ==========
    async function loadPlaylist() {
        try {
            console.log('📻 Cargando playlist...');
            const response = await fetch('playlist.json');
            const data = await response.json();
            
            currentPlaylist = data.tracks.map(track => ({
                path: track,
                file: track.split('/').pop()
            }));
            
            console.log(`📻 Playlist cargada: ${currentPlaylist.length} canciones`);
            
        } catch (error) {
            console.error('Error:', error);
            currentPlaylist = [];
            currentTrackIndex = 0;
        }
    }
    
    function calculateSyncPosition() {
        // La transmisión global comenzó el 1 de enero de 2025 a las 00:00 (hora Argentina)
        const transmissionStart = new Date(Date.UTC(2025, 0, 1, 3, 0, 0, 0)); // 00:00 ARG = 03:00 UTC
        
        const now = new Date();
        const trackDuration = 4 * 60 * 60 * 1000; // 4 horas en milisegundos
        
        // 1. Cuánto tiempo ha pasado desde que empezó la transmisión
        const timeSinceStart = now.getTime() - transmissionStart.getTime();
        
        // 2. Qué canción está sonando AHORA MISMO (todas las radios del mundo)
        currentTrackIndex = Math.floor(timeSinceStart / trackDuration) % currentPlaylist.length;
        
        // 3. En qué segundo/minuto de ESA canción está la transmisión
        const timeIntoCurrentTrack = timeSinceStart % trackDuration;
        
        // 4. Cuándo empezó ESTA canción específica
        trackStartTime = transmissionStart.getTime() + (currentTrackIndex * trackDuration);
        
        console.log(`🌍 Sincronización global calculada:`);
        console.log(`   ▶️ Canción actual: ${currentTrackIndex + 1}/${currentPlaylist.length}`);
        console.log(`   ⏱️  Transmisión lleva: ${Math.floor(timeIntoCurrentTrack / 1000 / 60)} minutos en esta canción`);
        console.log(`   🔗 Todos los oyentes en el mismo punto`);
        
        return {
            trackIndex: currentTrackIndex,
            timeIntoCurrentTrack: timeIntoCurrentTrack / 1000, // en segundos
            trackStartTime: trackStartTime
        };
    }
    
    function playSyncTrack() {
        if (currentPlaylist.length === 0) return;
        
        // Calcular posición EXACTA de la transmisión global
        const syncData = calculateSyncPosition();
        const track = currentPlaylist[syncData.trackIndex];
        
        console.log(`🎵 Conectando a transmisión global:`);
        console.log(`   📀 "${track.file}"`);
        console.log(`   🎯 Empezando en segundo ${Math.floor(syncData.timeIntoCurrentTrack)}`);
        
        audioPlayer.src = track.path;
        
        // ¡ESTA ES LA CLAVE! No empezar desde 0
        // Esperar a que el audio esté cargado para establecer el tiempo correcto
        audioPlayer.onloadedmetadata = function() {
            // Limitar el tiempo al máximo de duración del audio
            const startTime = Math.min(syncData.timeIntoCurrentTrack, audioPlayer.duration - 1);
            audioPlayer.currentTime = startTime;
            
            console.log(`   🔊 Audio cargado: ${audioPlayer.duration.toFixed(1)}s total`);
            console.log(`   🚀 Reproduciendo desde: ${startTime.toFixed(1)}s`);
            
            if (isPlaying) {
                audioPlayer.play().catch(e => {
                    console.error('❌ Error al reproducir:', e.name);
                    scheduleNextTrack();
                });
            }
        };
        
        audioPlayer.onended = function() {
            console.log('✅ Canción terminada - Cambiando a siguiente');
            scheduleNextTrack();
        };
        
        audioPlayer.onerror = function() {
            console.error('❌ Error de audio - Saltando a siguiente canción');
            scheduleNextTrack();
        };
    }
    
    function scheduleNextTrack() {
        // Calcular cuándo debe cambiar la canción según el horario global
        const now = new Date();
        const trackDuration = 4 * 60 * 60 * 1000;
        
        // Cuánto tiempo falta para que termine ESTA canción
        const timeUntilNextTrack = trackStartTime + trackDuration - now.getTime();
        
        if (timeUntilNextTrack > 0) {
            console.log(`⏳ Próxima canción en: ${Math.round(timeUntilNextTrack / 1000 / 60)} minutos`);
            
            setTimeout(() => {
                if (isPlaying) {
                    console.log(`🔄 Cambio automático programado`);
                    playSyncTrack(); // Esto recalculará la posición
                }
            }, timeUntilNextTrack);
        } else {
            // Si ya pasó el tiempo, cambiar inmediatamente
            console.log(`⚡ Cambio inmediato (ya pasó el horario)`);
            playSyncTrack();
        }
        
        updateDisplayInfo();
    }
    
    function updatePlayButton() {
        playPath.setAttribute('opacity', isPlaying ? '0' : '1');
        pausePath1.setAttribute('opacity', isPlaying ? '1' : '0');
        pausePath2.setAttribute('opacity', isPlaying ? '1' : '0');
    }
    
    function shareRadio() {
        const url = window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                const originalHTML = shareButton.innerHTML;
                shareButton.innerHTML = '✅';
                shareButton.style.borderColor = '#00FF37';
                setTimeout(() => {
                    shareButton.innerHTML = originalHTML;
                    shareButton.style.borderColor = '';
                }, 2000);
            });
        }
    }
    
    // ========== EVENTOS ==========
    playButton.addEventListener('click', async function() {
        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
            console.log('⏸️ Pausado');
        } else {
            if (currentPlaylist.length === 0) await loadPlaylist();
            isPlaying = true;
            
            console.log('▶️ Conectando a transmisión global...');
            console.log('📡 Sincronizando con todos los oyentes...');
            
            // Esto es lo que cambia:
            // NO calcular posición local, SINO posición global
            playSyncTrack();
            
            console.log('✅ Conectado - Escuchas lo mismo que todos');
        }
        updatePlayButton();
    });
    
    shareButton.addEventListener('click', shareRadio);
    
    // ========== INICIALIZACIÓN ==========
    async function init() {
        console.log('🚀 Iniciando Radio Simple');
        console.log('📡 Modo: Transmisión sincronizada 24/7');
        console.log('🎯 TODOS los oyentes escuchan EXACTAMENTE lo mismo');
        
        await loadPlaylist();
        generateScheduleCards();
        setInterval(updateDisplayInfo, 60000);
        
        console.log('✅ Radio lista');
        console.log('💡 Da PLAY para unirte a la transmisión global');
    }
    
    init();
});
