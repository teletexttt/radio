// radio-zara.js - RADIO SIMPLE - CON SINCRONIZACIÓN REAL
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
    
    // ========== RADIO CON SINCRONIZACIÓN REAL ==========
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
    
    function getSyncPosition() {
        // 1. La transmisión empezó el 2025-01-01 00:00 (hora Argentina)
        const transmissionStart = new Date('2025-01-01T03:00:00Z'); // 00:00 ARG = 03:00 UTC
        
        // 2. Tiempo transcurrido desde entonces
        const now = new Date();
        const msSinceStart = now.getTime() - transmissionStart.getTime();
        
        // 3. Cada 4 horas cambia de canción en la playlist
        const msPerSlot = 4 * 60 * 60 * 1000; // 4 horas en ms
        
        // 4. Qué canción está sonando AHORA
        const slotIndex = Math.floor(msSinceStart / msPerSlot);
        currentTrackIndex = slotIndex % currentPlaylist.length;
        
        // 5. Cuánto tiempo lleva sonando ESTA canción
        const msIntoCurrentSlot = msSinceStart % msPerSlot;
        
        console.log(`🌍 Sincronización:`);
        console.log(`   ▶️ Canción global: #${currentTrackIndex + 1}`);
        console.log(`   ⏱️  Lleva sonando: ${Math.floor(msIntoCurrentSlot / 1000)} segundos en este slot`);
        
        return {
            trackIndex: currentTrackIndex,
            msIntoCurrentSlot: msIntoCurrentSlot,
            track: currentPlaylist[currentTrackIndex]
        };
    }
    
    function playSyncedTrack() {
        if (currentPlaylist.length === 0) return;
        
        // Obtener posición sincronizada
        const sync = getSyncPosition();
        const track = sync.track;
        
        console.log(`🎵 Sumándose a transmisión:`);
        console.log(`   📀 "${track.file}"`);
        console.log(`   #${sync.trackIndex + 1}/${currentPlaylist.length}`);
        
        // Configurar el audio
        audioPlayer.src = track.path;
        
        // CUANDO EL AUDIO ESTÉ LISTO, establecer el tiempo correcto
        audioPlayer.addEventListener('loadedmetadata', function onLoaded() {
            // Eliminar este listener para que no se ejecute múltiples veces
            audioPlayer.removeEventListener('loadedmetadata', onLoaded);
            
            const audioDuration = audioPlayer.duration;
            if (audioDuration > 0) {
                // Calcular en qué punto de la canción está la transmisión global
                // Asumimos que la canción se repite durante las 4 horas del slot
                const slotDuration = 4 * 60 * 60; // 4 horas en segundos
                const progress = (sync.msIntoCurrentSlot / 1000) % slotDuration;
                const scaledProgress = (progress / slotDuration) * audioDuration;
                
                // Empezar desde ese punto (pero no muy cerca del final)
                const startTime = Math.min(scaledProgress % audioDuration, audioDuration - 5);
                
                audioPlayer.currentTime = startTime;
                
                console.log(`   🔊 Duración: ${audioDuration.toFixed(1)}s`);
                console.log(`   🚀 Iniciando en: ${startTime.toFixed(1)}s (NO desde 0)`);
                console.log(`   ✅ Se sumó a transmisión en curso`);
            }
            
            // Reproducir
            if (isPlaying) {
                audioPlayer.play().catch(e => {
                    console.error('❌ Error al reproducir:', e);
                    setTimeout(playNextTrack, 1000);
                });
            }
        });
        
        // Si hay error al cargar, saltar a siguiente
        audioPlayer.onerror = function() {
            console.error('❌ Error cargando audio');
            setTimeout(playNextTrack, 1000);
        };
        
        // Cuando termine ESTA canción, pasar a la siguiente (pero desde 0)
        audioPlayer.onended = function() {
            console.log('✅ Canción terminada - Siguiente desde inicio');
            playNextTrackFromStart();
        };
    }
    
    function playNextTrackFromStart() {
        if (currentPlaylist.length === 0) return;
        
        // Siguiente canción en playlist infinita
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        const track = currentPlaylist[currentTrackIndex];
        
        console.log(`⏭️ Siguiente canción: #${currentTrackIndex + 1} (${track.file})`);
        console.log(`   🎯 Esta SÍ empieza desde 0 (cambio normal)`);
        
        // Para cambios normales, empezar desde 0
        audioPlayer.src = track.path;
        audioPlayer.currentTime = 0;
        
        if (isPlaying) {
            audioPlayer.play().catch(e => {
                console.error('❌ Error:', e);
                setTimeout(playNextTrackFromStart, 1000);
            });
        }
        
        audioPlayer.onended = function() {
            console.log('✅ Canción terminada');
            playNextTrackFromStart();
        };
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
            // Pausar
            audioPlayer.pause();
            isPlaying = false;
            console.log('⏸️ Pausado');
        } else {
            // Reproducir - SUMARSE A TRANSMISIÓN
            if (currentPlaylist.length === 0) {
                await loadPlaylist();
            }
            isPlaying = true;
            console.log('▶️ Sumándose a transmisión global...');
            playSyncedTrack(); // ← ¡ESTA es la función que sincroniza!
        }
        updatePlayButton();
    });
    
    shareButton.addEventListener('click', shareRadio);
    
    // ========== INICIALIZACIÓN ==========
    async function init() {
        console.log('🚀 Radio Simple - Iniciando');
        console.log('📡 Modo: Transmisión continua 24/7');
        console.log('👥 Los usuarios se SUMAN donde va la transmisión');
        
        await loadPlaylist();
        generateScheduleCards();
        setInterval(updateDisplayInfo, 60000);
        updateDisplayInfo();
        
        console.log('✅ Radio lista');
        console.log('💡 Click PLAY para sumarte a la transmisión');
    }
    
    init();
});
