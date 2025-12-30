// radio-zara.js - RADIO SIMPLE 1→2→3 - TRANSMISIÓN INFINITA
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
    
    // ========== TRANSMISIÓN INFINITA ==========
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
    
    function calculateInitialPosition() {
        // La transmisión comenzó hace mucho tiempo (ej: 1 enero 2025)
        // Cada 4 horas cambia de canción en la playlist infinita
        const transmissionStart = new Date(Date.UTC(2025, 0, 1, 3, 0, 0, 0)); // 00:00 ARG
        
        const now = new Date();
        const hoursPerTrack = 4; // Cada 4 horas, siguiente canción
        const msPerTrack = hoursPerTrack * 60 * 60 * 1000;
        
        // Cuánto tiempo ha pasado desde el inicio
        const timeSinceStart = now.getTime() - transmissionStart.getTime();
        
        // Qué número de canción está sonando AHORA (playlist infinita)
        // Ej: si pasaron 100 horas y cada canción "dura" 4 horas, vamos en la canción #25
        currentTrackIndex = Math.floor(timeSinceStart / msPerTrack) % currentPlaylist.length;
        
        console.log(`🌍 Transmisión infinita:`);
        console.log(`   ▶️ Canción actual: #${currentTrackIndex + 1} de ${currentPlaylist.length}`);
        console.log(`   🔄 Playlist: ${currentTrackIndex + 1}→${currentTrackIndex + 2}→...`);
        console.log(`   🔗 Todos conectados a la misma canción`);
        
        return currentTrackIndex;
    }
    
    function playCurrentTrack(startFromBeginning = false) {
        if (currentPlaylist.length === 0) return;
        
        const track = currentPlaylist[currentTrackIndex];
        console.log(`🎵 Transmisión en vivo:`);
        console.log(`   📀 "${track.file}"`);
        console.log(`   #${currentTrackIndex + 1}/${currentPlaylist.length}`);
        
        audioPlayer.src = track.path;
        
        if (!startFromBeginning) {
            // Calcular en qué segundo de la canción está la transmisión global
            // Basado en el tiempo real desde que empezó ESTA canción
            const transmissionStart = new Date(Date.UTC(2025, 0, 1, 3, 0, 0, 0));
            const now = new Date();
            const hoursPerTrack = 4;
            const msPerTrack = hoursPerTrack * 60 * 60 * 1000;
            
            const timeSinceStart = now.getTime() - transmissionStart.getTime();
            const timeIntoCurrentTrack = timeSinceStart % msPerTrack;
            
            // Convertir a posición dentro de la canción REAL
            // Asumimos que el tiempo de la canción se escala al bloque de 4 horas
            // O simplemente empezamos desde un punto aleatorio/medio
            audioPlayer.onloadedmetadata = function() {
                const duration = audioPlayer.duration;
                if (duration > 0) {
                    // Posición proporcional dentro de la canción
                    const progress = (timeIntoCurrentTrack / msPerTrack);
                    const startTime = Math.min(progress * duration, duration - 5);
                    
                    audioPlayer.currentTime = startTime;
                    console.log(`   🚀 Sincronizado en: ${startTime.toFixed(1)}s de ${duration.toFixed(1)}s`);
                }
                
                if (isPlaying) {
                    audioPlayer.play().catch(e => {
                        console.error('❌ Error:', e.name);
                        playNextTrack();
                    });
                }
            };
        } else {
            audioPlayer.currentTime = 0;
            if (isPlaying) {
                audioPlayer.play().catch(e => {
                    console.error('❌ Error:', e.name);
                    playNextTrack();
                });
            }
        }
        
        // Cuando termine ESTA canción, pasar a la siguiente
        audioPlayer.onended = function() {
            console.log('✅ Canción terminada - Siguiente en playlist infinita');
            playNextTrack();
        };
        
        audioPlayer.onerror = function() {
            console.error('❌ Error de audio - Saltando a siguiente');
            playNextTrack();
        };
    }
    
    function playNextTrack() {
        if (currentPlaylist.length === 0) return;
        
        // Siguiente en la playlist infinita
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        console.log(`⏭️ Siguiente: #${currentTrackIndex + 1}/${currentPlaylist.length}`);
        playCurrentTrack(true); // Esta sí empieza desde 0
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
            
            console.log('▶️ Conectando a transmisión infinita...');
            console.log('📡 Playlist 1→2→3→... infinita');
            
            // Calcular en qué canción está la transmisión global
            calculateInitialPosition();
            
            // Unirse a la transmisión donde va
            playCurrentTrack(false);
            
            console.log('✅ Conectado - Todos escuchan lo mismo');
        }
        updatePlayButton();
    });
    
    shareButton.addEventListener('click', shareRadio);
    
    // ========== INICIALIZACIÓN ==========
    async function init() {
        console.log('🚀 Iniciando Radio Simple');
        console.log('📡 Modo: Transmisión infinita 24/7');
        console.log('🔄 Playlist: 1→2→3→...→84→1→2→...');
        console.log('👥 Todos se suman donde va la transmisión');
        
        await loadPlaylist();
        generateScheduleCards();
        setInterval(updateDisplayInfo, 60000);
        
        console.log('✅ Radio lista - Transmisión continua');
    }
    
    init();
});
