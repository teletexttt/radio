// radio-zara.js - RADIO SIMPLE - VERSIÓN RÁPIDA
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
    let isTransitioning = false;
    let nextAudioPreload = null;
    
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
    
    // ========== RADIO RÁPIDA ==========
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
            
            // Precalcular siguiente canción
            preloadNextTrack();
            
        } catch (error) {
            console.error('Error:', error);
            currentPlaylist = [];
            currentTrackIndex = 0;
        }
    }
    
    function getSyncPosition() {
        // Transmisión empezó el 2025-01-01 00:00 ARG
        const transmissionStart = new Date('2025-01-01T03:00:00Z');
        const now = new Date();
        const msSinceStart = now.getTime() - transmissionStart.getTime();
        const msPerSlot = 4 * 60 * 60 * 1000; // 4 horas
        
        const slotIndex = Math.floor(msSinceStart / msPerSlot);
        currentTrackIndex = slotIndex % currentPlaylist.length;
        
        const msIntoCurrentSlot = msSinceStart % msPerSlot;
        
        console.log(`🌍 Sincronización rápida:`);
        console.log(`   ▶️ Canción: #${currentTrackIndex + 1}`);
        console.log(`   ⏱️  En slot: ${Math.floor(msIntoCurrentSlot / 1000)}s`);
        
        return {
            trackIndex: currentTrackIndex,
            msIntoCurrentSlot: msIntoCurrentSlot,
            track: currentPlaylist[currentTrackIndex]
        };
    }
    
    function calculateStartTime(syncData, audioDuration) {
        // Calcular punto de inicio en la canción actual
        const slotDuration = 4 * 60 * 60; // 4 horas en segundos
        const progress = (syncData.msIntoCurrentSlot / 1000) % slotDuration;
        const scaledProgress = (progress / slotDuration) * audioDuration;
        
        // No empezar muy cerca del final
        return Math.min(scaledProgress % audioDuration, audioDuration - 5);
    }
    
    function preloadNextTrack() {
        if (currentPlaylist.length === 0) return;
        
        const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        const nextTrack = currentPlaylist[nextIndex];
        
        // Precargar siguiente canción en background
        if (nextAudioPreload) {
            nextAudioPreload.pause();
            nextAudioPreload = null;
        }
        
        nextAudioPreload = new Audio();
        nextAudioPreload.preload = 'auto';
        nextAudioPreload.src = nextTrack.path;
        nextAudioPreload.load();
        
        console.log(`🔮 Precargando: "${nextTrack.file}"`);
    }
    
    function playSyncedTrack() {
        if (currentPlaylist.length === 0 || isTransitioning) return;
        
        console.time('⏱️ Tiempo sincronización');
        isTransitioning = true;
        
        const sync = getSyncPosition();
        const track = sync.track;
        
        console.log(`🎵 Conectando a: "${track.file}"`);
        
        // 1. Configurar audio actual
        audioPlayer.src = track.path;
        
        // 2. Intentar sincronización rápida
        let syncCompleted = false;
        const syncTimeout = setTimeout(() => {
            if (!syncCompleted) {
                console.log('⚡ Sincronización timeout - Forzando inicio');
                safePlay();
            }
        }, 1500); // Máximo 1.5 segundos para sincronizar
        
        // 3. Sincronizar cuando carguen metadatos
        const onLoaded = () => {
            if (syncCompleted) return;
            syncCompleted = true;
            clearTimeout(syncTimeout);
            
            if (audioPlayer.duration > 0) {
                const startTime = calculateStartTime(sync, audioPlayer.duration);
                audioPlayer.currentTime = startTime;
                console.log(`🎯 Inicio sincronizado: ${startTime.toFixed(1)}s`);
            }
            
            safePlay();
            console.timeEnd('⏱️ Tiempo sincronización');
        };
        
        audioPlayer.addEventListener('loadedmetadata', onLoaded, { once: true });
        
        // 4. Si ya está listo, sincronizar inmediatamente
        if (audioPlayer.readyState >= 1) { // HAVE_METADATA
            setTimeout(onLoaded, 10);
        }
    }
    
    function playNextTrackInstant() {
        if (currentPlaylist.length === 0 || isTransitioning) return;
        
        console.time('⏱️ Tiempo cambio');
        isTransitioning = true;
        
        // Cambiar a siguiente canción
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        const track = currentPlaylist[currentTrackIndex];
        
        console.log(`⏭️ Cambio rápido a: "${track.file}"`);
        
        // 1. Pausar y limpiar
        audioPlayer.pause();
        
        // 2. Usar audio precargado si está disponible
        if (nextAudioPreload && nextAudioPreload.src.includes(track.file)) {
            console.log('🚀 Usando audio precargado!');
            // Reutilizar el elemento precargado
            const temp = audioPlayer;
            audioPlayer = nextAudioPreload;
            nextAudioPreload = temp;
            nextAudioPreload.pause();
            nextAudioPreload.currentTime = 0;
        } else {
            // Cambiar src normalmente
            audioPlayer.src = track.path;
        }
        
        // 3. Empezar desde 0
        audioPlayer.currentTime = 0;
        
        // 4. Reproducir inmediatamente
        setTimeout(() => {
            audioPlayer.play().catch(e => {
                console.error('❌ Error play rápido:', e);
                // Reintento rápido
                setTimeout(() => {
                    isTransitioning = false;
                    playNextTrackInstant();
                }, 200);
            });
            
            isTransitioning = false;
            console.timeEnd('⏱️ Tiempo cambio');
            
            // Precargar la siguiente
            setTimeout(preloadNextTrack, 100);
        }, 30); // Delay mínimo para estabilidad
    }
    
    function safePlay() {
        if (!isPlaying) {
            isTransitioning = false;
            return;
        }
        
        audioPlayer.play().catch(e => {
            console.error('❌ Error en play:', e);
            // Si falla la sincronización, intentar cambio normal
            setTimeout(() => {
                isTransitioning = false;
                playNextTrackInstant();
            }, 300);
        }).then(() => {
            isTransitioning = false;
        });
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
            // Reproducir
            if (currentPlaylist.length === 0) {
                await loadPlaylist();
            }
            isPlaying = true;
            console.log('▶️ Iniciando transmisión...');
            playSyncedTrack();
        }
        updatePlayButton();
    });
    
    // Configurar eventos del audio UNA VEZ
    audioPlayer.onended = function() {
        console.log('✅ Canción terminada - Cambio rápido');
        playNextTrackInstant();
    };
    
    audioPlayer.onerror = function() {
        console.error('❌ Error de audio - Recuperando...');
        setTimeout(() => {
            if (isPlaying) {
                playNextTrackInstant();
            }
        }, 500);
    };
    
    shareButton.addEventListener('click', shareRadio);
    
    // ========== INICIALIZACIÓN ==========
    async function init() {
        console.log('🚀 Radio Simple - Versión Rápida');
        console.log('⚡ Cambios instantáneos entre canciones');
        
        await loadPlaylist();
        generateScheduleCards();
        setInterval(updateDisplayInfo, 60000);
        updateDisplayInfo();
        
        console.log('✅ Radio optimizada lista');
        console.log('💡 Click PLAY - Cambios serán rápidos');
    }
    
    init();
});
