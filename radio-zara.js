// radio-zara.js - VERSIÓN FINAL ESTABLE
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
    let lastValidCalculation = null; // NUEVO: Para estabilizar en refresh
    
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
    
    // ========== LÓGICA RADIO ESTABLE (CORREGIDO PARA REFRESH) ==========
    async function loadPlaylist() {
        try {
            console.log('📻 Sintonizando radio...');
            const response = await fetch('playlist.json');
            const data = await response.json();
            
            currentPlaylist = data.tracks.map(track => ({
                path: track,
                file: track.split('/').pop()
            }));
            
            console.log(`📻 Playlist cargada: ${currentPlaylist.length} canciones`);
            
            // Calcular posición ACTUAL en la transmisión continua
            calcularPosicionTransmision();
            
        } catch (error) {
            console.error('Error:', error);
            currentPlaylist = [];
            currentTrackIndex = 0;
        }
    }
    
    function calcularPosicionTransmision() {
        // Fecha de inicio de la transmisión (1 enero 2025, 00:00 ARG)
        const inicioTransmision = new Date('2025-01-01T03:00:00Z');
        const ahora = new Date();
        
        // Tiempo transcurrido en MILISEGUNDOS
        const msTranscurridos = ahora.getTime() - inicioTransmision.getTime();
        
        // ESTIMADO: 3 minutos por canción (180,000 ms)
        const msPorCancion = 3 * 60 * 1000;
        
        // Total de canciones reproducidas desde el inicio
        const totalCancionesReproducidas = Math.floor(msTranscurridos / msPorCancion);
        
        // Posición actual en la playlist cíclica
        const nuevaPosicion = totalCancionesReproducidas % currentPlaylist.length;
        
        // VERIFICACIÓN DE ESTABILIDAD (EVITA SALTOS EN REFRESH)
        if (lastValidCalculation !== null) {
            const diferencia = Math.abs(nuevaPosicion - lastValidCalculation);
            
            // Si la diferencia es pequeña (1-2 canciones), mantener la anterior
            // Esto evita saltos en refresh por milisegundos de diferencia
            if (diferencia <= 2 && diferencia !== 0) {
                console.log('📻 Manteniendo posición estable de radio...');
                console.log(`   ↻ Refresh detectado, manteniendo canción #${lastValidCalculation + 1}`);
                currentTrackIndex = lastValidCalculation;
            } else {
                // Cambio REAL (pasó tiempo suficiente)
                currentTrackIndex = nuevaPosicion;
                lastValidCalculation = nuevaPosicion;
                console.log(`   ✅ Cambio real a canción #${currentTrackIndex + 1}`);
            }
        } else {
            // Primera vez que se calcula
            currentTrackIndex = nuevaPosicion;
            lastValidCalculation = nuevaPosicion;
        }
        
        console.log('📡 LÓGICA RADIO ESTABLE:');
        console.log(`   ▶️  Canción actual: #${currentTrackIndex + 1}`);
        console.log(`   📻 Posición estable: ${currentTrackIndex + 1}/${currentPlaylist.length}`);
    }
    
    function playTransmisionActual() {
        if (currentPlaylist.length === 0) return;
        
        const track = currentPlaylist[currentTrackIndex];
        console.log(`🎵 Reproduciendo: "${track.file}"`);
        console.log(`   (#${currentTrackIndex + 1}/${currentPlaylist.length})`);
        
        // Configurar audio
        audioPlayer.src = track.path;
        
        // Reproducir
        if (isPlaying) {
            audioPlayer.play().catch(e => {
                console.error('❌ Error:', e);
                // Si falla, siguiente canción
                setTimeout(siguienteCancion, 1000);
            });
        }
        
        // Cuando TERMINE esta canción, pasar a la SIGUIENTE
        audioPlayer.onended = function() {
            console.log('✅ Canción terminada - Siguiente en playlist');
            siguienteCancion();
        };
        
        audioPlayer.onerror = function() {
            console.error('❌ Error de audio');
            setTimeout(siguienteCancion, 1000);
        };
    }
    
    function siguienteCancion() {
        if (currentPlaylist.length === 0) return;
        
        // AVANZAR en la playlist
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        lastValidCalculation = currentTrackIndex; // Actualizar posición válida
        
        console.log(`⏭️ Siguiente: #${currentTrackIndex + 1}`);
        
        // Reproducir siguiente
        playTransmisionActual();
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
            // PLAY - Conectar a transmisión
            if (currentPlaylist.length === 0) {
                await loadPlaylist();
            }
            isPlaying = true;
            
            console.log('▶️ Conectando a transmisión...');
            console.log('📻 Radio estable - Sin saltos en refresh');
            
            // Calcular dónde va la transmisión AHORA
            calcularPosicionTransmision();
            
            // Reproducir desde ahí
            playTransmisionActual();
        }
        updatePlayButton();
    });
    
    shareButton.addEventListener('click', shareRadio);
    
    // ========== INICIALIZACIÓN ==========
    async function init() {
        console.log('🚀 Radio Zara - Versión Final Estable');
        console.log('📡 Lógica: 1 PLAYLIST INFINITA');
        console.log('🔒 Estable en refresh (F5)');
        console.log('🎭 Programas simulados');
        
        await loadPlaylist();
        generateScheduleCards();
        setInterval(updateDisplayInfo, 60000);
        updateDisplayInfo();
        
        console.log('✅ Radio estable lista');
        console.log('💡 Haz clic en PLAY para conectarte');
        console.log('🔄 F5 mantendrá posición estable');
    }
    
    init();
});
