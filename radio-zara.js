// radio-zara.js - VERSIÓN FINAL CORREGIDA (INICIO RÁPIDO)
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
    
    // ========== CONFIGURACIÓN PROGRAMAS (SIMULADOS) ==========
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
    
    // ========== FUNCIONES PROGRAMA (SIMULADOS) ==========
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
    
    // ========== LÓGICA RADIO CON SINCRONIZACIÓN EXACTA ==========
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
    
    function calcularPosicionExacta() {
        // 1. Transmisión comenzó el 1 enero 2025, 00:00 ARG
        const inicioTransmision = new Date('2025-01-01T03:00:00Z');
        const ahora = new Date();
        
        // 2. Segundos transcurridos desde que empezó la radio
        const segundosTranscurridos = Math.floor((ahora - inicioTransmision) / 1000);
        
        // 3. Duración promedio por canción (3 minutos = 180 segundos)
        // ¡IMPORTANTE! Todos usan el MISMO número
        const segundosPorCancion = 180;
        
        // 4. Segundos totales de la playlist completa
        const segundosTotalPlaylist = currentPlaylist.length * segundosPorCancion;
        
        // 5. Posición actual en la playlist cíclica infinita
        const posicionEnPlaylist = segundosTranscurridos % segundosTotalPlaylist;
        
        // 6. Qué canción está sonando AHORA
        currentTrackIndex = Math.floor(posicionEnPlaylist / segundosPorCancion) % currentPlaylist.length;
        
        // 7. En qué segundo de ESA canción está la transmisión
        const segundoEnCancion = posicionEnPlaylist % segundosPorCancion;
        
        console.log('🎯 SINCRONIZACIÓN EXACTA:');
        console.log(`   📻 Canción: #${currentTrackIndex + 1}/${currentPlaylist.length}`);
        console.log(`   ⏱️  Segundo: ${segundoEnCancion}s`);
        console.log(`   🔗 Todos escuchan lo mismo`);
        
        return {
            trackIndex: currentTrackIndex,
            segundoEnCancion: segundoEnCancion,
            track: currentPlaylist[currentTrackIndex]
        };
    }
    
    function playTransmisionExacta() {
        if (currentPlaylist.length === 0) return;
        
        const posicion = calcularPosicionExacta();
        const track = posicion.track;
        
        console.log(`🎵 Conectando a transmisión:`);
        console.log(`   📀 "${track.file}"`);
        console.log(`   🎯 Empezando en segundo: ${posicion.segundoEnCancion}`);
        
        // FIXED: Configurar src y tiempo INMEDIATAMENTE (sin esperar loadedmetadata)
        audioPlayer.src = track.path;
        // Establecer currentTime de inmediato. El navegador lo aplicará cuando cargue.
        audioPlayer.currentTime = Math.min(posicion.segundoEnCancion, 3600); // Límite seguro de 1 hora
        
        console.log(`   🔊 Tiempo establecido: ${posicion.segundoEnCancion}s (sin esperar metadata)`);
        
        // FIXED: Reproducir inmediatamente
        if (isPlaying) {
            audioPlayer.play().catch(e => {
                console.error('❌ Error al reproducir:', e);
                setTimeout(siguienteCancion, 1000);
            });
        }
        
        // Configurar manejadores de eventos para errores y fin de canción
        audioPlayer.onended = function() {
            console.log('✅ Canción terminada - Siguiente');
            siguienteCancion();
        };
        
        audioPlayer.onerror = function() {
            console.error('❌ Error de audio');
            setTimeout(siguienteCancion, 1000);
        };
    }
    
    function siguienteCancion() {
        if (currentPlaylist.length === 0) return;
        
        // Avanzar a siguiente canción
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        const track = currentPlaylist[currentTrackIndex];
        
        console.log(`⏭️ Siguiente canción: #${currentTrackIndex + 1} (${track.file})`);
        
        // Para cambios normales, empezar desde 0
        audioPlayer.src = track.path;
        audioPlayer.currentTime = 0;
        
        if (isPlaying) {
            audioPlayer.play().catch(e => {
                console.error('❌ Error:', e);
                setTimeout(siguienteCancion, 1000);
            });
        }
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
            // PAUSAR
            audioPlayer.pause();
            isPlaying = false;
            console.log('⏸️ Pausado');
        } else {
            // PLAY - Conectar a transmisión EXACTA
            if (currentPlaylist.length === 0) {
                await loadPlaylist();
            }
            isPlaying = true;
            
            console.log('▶️ Conectando a transmisión exacta...');
            console.log('⚡ INICIO RÁPIDO (sin esperar metadata)');
            
            playTransmisionExacta();
        }
        updatePlayButton();
    });
    
    shareButton.addEventListener('click', shareRadio);
    
    // ========== INICIALIZACIÓN ==========
    async function init() {
        console.log('🚀 Radio Zara - Versión Final (Inicio Rápido)');
        console.log('🎯 Sincronización exacta por segundo');
        console.log('⚡ Corrección: Inicio inmediato (sin esperar metadata)');
        
        await loadPlaylist();
        generateScheduleCards();
        setInterval(updateDisplayInfo, 60000);
        updateDisplayInfo();
        
        console.log('✅ Radio lista con sincronización exacta e inicio rápido');
    }
    
    init();
});
