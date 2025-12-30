// radio-zara.js - RADIO SIMPLE - VERSIÓN ESTABLE
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
    let lastCalculatedPosition = -1; // Para verificar consistencia
    
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
    
    // ========== RADIO ESTABLE ==========
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
    
    function getGlobalTrackPosition() {
        // Fecha fija de inicio de transmisión
        const transmissionStart = new Date('2025-01-01T03:00:00Z'); // 00:00 ARG
        
        const now = new Date();
        const msSinceStart = now.getTime() - transmissionStart.getTime();
        const msPerSlot = 4 * 60 * 60 * 1000; // 4 horas en milisegundos
        
        // Slot global actual (qué bloque de 4 horas estamos)
        const globalSlot = Math.floor(msSinceStart / msPerSlot);
        
        // Track index según slot global (playlist cíclica)
        const calculatedIndex = globalSlot % currentPlaylist.length;
        
        // Verificar consistencia
        if (lastCalculatedPosition !== -1 && lastCalculatedPosition !== calculatedIndex) {
            console.warn(`⚠️ Cambio detectado: ${lastCalculatedPosition} → ${calculatedIndex}`);
        }
        
        lastCalculatedPosition = calculatedIndex;
        
        console.log(`🌍 Posición global calculada:`);
        console.log(`   🎯 Slot global: ${globalSlot}`);
        console.log(`   ▶️  Canción: #${calculatedIndex + 1}/${currentPlaylist.length}`);
        console.log(`   ✅ Consistente: ${lastCalculatedPosition === calculatedIndex ? 'SÍ' : 'NO'}`);
        
        return {
            trackIndex: calculatedIndex,
            msIntoSlot: msSinceStart % msPerSlot,
            slot: globalSlot
        };
    }
    
    function preloadNextTrack() {
        if (currentPlaylist.length === 0) return;
        
        // Precargar la canción que SIGUE en la secuencia global
        const globalPos = getGlobalTrackPosition();
        const nextIndex = (globalPos.trackIndex + 1) % currentPlaylist.length;
        const nextTrack = currentPlaylist[nextIndex];
        
        if (nextAudioPreload) {
            nextAudioPreload.pause();
            nextAudioPreload = null;
        }
        
        nextAudioPreload = new Audio();
        nextAudioPreload.preload = 'auto';
        nextAudioPreload.src = nextTrack.path;
        nextAudioPreload.load();
        
        console.log(`🔮 Precargando siguiente: "${nextTrack.file}"`);
    }
    
    function playSyncedTrack() {
        if (currentPlaylist.length === 0 || isTransitioning) return;
        
        console.time('⏱️ Sincronización');
        isTransitioning = true;
        
        // Obtener posición GLOBAL actual
        const globalPos = getGlobalTrackPosition();
        currentTrackIndex = globalPos.trackIndex; // ¡IMPORTANTE! Sincronizar con global
        const track = currentPlaylist[currentTrackIndex];
        
        console.log(`🎵 Conectando a transmisión global:`);
        console.log(`   📀 "${track.file}"`);
        console.log(`   #${currentTrackIndex + 1}/${currentPlaylist.length}`);
        
        // Configurar audio
        audioPlayer.src = track.path;
        
        // Sincronizar tiempo de inicio
        let syncCompleted = false;
        const syncTimeout = setTimeout(() => {
            if (!syncCompleted) {
                console.log('⚡ Timeout sincronización - Forzando inicio');
                safePlay();
            }
        }, 2000);
        
        const onLoaded = () => {
            if (syncCompleted) return;
            syncCompleted = true;
            clearTimeout(syncTimeout);
            
            if (audioPlayer.duration > 0) {
                // Calcular posición dentro de la canción actual
                const slotDuration = 4 * 60 * 60; // 4 horas en segundos
                const progress = (globalPos.msIntoSlot / 1000) % slotDuration;
                const scaledProgress = (progress / slotDuration) * audioPlayer.duration;
                const startTime = Math.min(scaledProgress % audioPlayer.duration, audioPlayer.duration - 5);
                
                audioPlayer.currentTime = startTime;
                console.log(`🎯 Iniciando en: ${startTime.toFixed(1)}s/${audioPlayer.duration.toFixed(1)}s`);
            }
            
            safePlay();
            console.timeEnd('⏱️ Sincronización');
        };
        
        audioPlayer.addEventListener('loadedmetadata', onLoaded, { once: true });
        
        // Si ya tiene metadata, usar inmediatamente
        if (audioPlayer.readyState >= 1) {
            setTimeout(onLoaded, 10);
        }
    }
    
    function playNextTrackInstant() {
        if (currentPlaylist.length === 0 || isTransitioning) return;
        
        console.time('⏱️ Verificación cambio');
        isTransitioning = true;
        
        // 1. Verificar qué canción DEBERÍA estar sonando GLOBALMENTE
        const globalPos = getGlobalTrackPosition();
        const shouldBeTrackIndex = globalPos.trackIndex;
        
        console.log(`🔍 Verificación cambio:`);
        console.log(`   🎧 Actual local: #${currentTrackIndex + 1}`);
        console.log(`   🌍 Debería ser: #${shouldBeTrackIndex + 1}`);
        
        // 2. DECISIÓN: ¿Cambiar o repetir?
        if (currentTrackIndex === shouldBeTrackIndex) {
            // Misma canción, solo repetir desde inicio
            console.log(`🔄 Repitiendo misma canción (bloque de 4 horas)`);
            
            audioPlayer.currentTime = 0;
            
            setTimeout(() => {
                audioPlayer.play().catch(e => {
                    console.error('❌ Error al repetir:', e);
                });
                isTransitioning = false;
                console.timeEnd('⏱️ Verificación cambio');
            }, 30);
            
            return;
        }
        
        // 3. Cambiar a la canción globalmente correcta
        console.log(`⏭️ Cambiando a canción global: #${shouldBeTrackIndex + 1}`);
        currentTrackIndex = shouldBeTrackIndex;
        const track = currentPlaylist[currentTrackIndex];
        
        // Cambiar audio
        audioPlayer.pause();
        audioPlayer.src = track.path;
        audioPlayer.currentTime = 0;
        
        // Reproducir
        setTimeout(() => {
            audioPlayer.play().catch(e => {
                console.error('❌ Error en cambio:', e);
                // Reintento
                setTimeout(() => {
                    isTransitioning = false;
                    playNextTrackInstant();
                }, 300);
            });
            
            isTransitioning = false;
            console.timeEnd('⏱️ Verificación cambio');
            
            // Precargar siguiente
            preloadNextTrack();
        }, 50);
    }
    
    function safePlay() {
        if (!isPlaying) {
            isTransitioning = false;
            return;
        }
        
        audioPlayer.play().catch(e => {
            console.error('❌ Error play:', e);
            setTimeout(() => {
                isTransitioning = false;
                playNextTrackInstant();
            }, 500);
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
            audioPlayer.pause();
            isPlaying = false;
            console.log('⏸️ Pausado');
        } else {
            if (currentPlaylist.length === 0) {
                await loadPlaylist();
            }
            isPlaying = true;
            console.log('▶️ Conectando...');
            playSyncedTrack();
        }
        updatePlayButton();
    });
    
    // Configurar eventos UNA VEZ
    audioPlayer.onended = function() {
        console.log('✅ Canción terminada - Verificando si cambiar...');
        playNextTrackInstant();
    };
    
    audioPlayer.onerror = function() {
        console.error('❌ Error audio');
        setTimeout(() => {
            if (isPlaying) {
                playNextTrackInstant();
            }
        }, 500);
    };
    
    shareButton.addEventListener('click', shareRadio);
    
    // ========== INICIALIZACIÓN ==========
    async function init() {
        console.log('🚀 Radio Simple - Versión Estable');
        console.log('🎯 Cada F5 calculará MISMA posición');
        console.log('🔄 Solo cambia cada 4 horas (no por terminar canción)');
        
        await loadPlaylist();
        generateScheduleCards();
        setInterval(updateDisplayInfo, 60000);
        updateDisplayInfo();
        
        console.log('✅ Radio lista');
    }
    
    init();
});
