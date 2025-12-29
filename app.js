// app.js - TELEXT RADIO (MODO SIMPLE - Esta Semana)
document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const playButton = document.getElementById('radioPlayButton');
    const shareButton = document.getElementById('shareRadioButton');
    let audioPlayer = document.getElementById('radioPlayer');
    const playPath = document.getElementById('playPath');
    const pausePath1 = document.getElementById('pausePath1');
    const pausePath2 = document.getElementById('pausePath2');
    const currentShow = document.getElementById('currentShow');
    const currentTimeName = document.getElementById('currentTimeName');
    const currentTimeRange = document.getElementById('currentTimeRange');
    
    // Estado simple
    let isPlaying = false;
    let currentPlaylist = [];
    let currentTrackIndex = 0;
    let currentTrackPlaying = null;
    
    // ========== FUNCIONES DE TIEMPO (MANTENER) ==========
    
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
    
    // ========== PLAYLIST SIMPLE ==========
    
    async function loadSimplePlaylist() {
        try {
            console.log('📻 Cargando playlist simple...');
            const response = await fetch('music/playlist.json');
            
            if (!response.ok) {
                throw new Error('No se encontró playlist.json');
            }
            
            const data = await response.json();
            
            // Convertir strings a objetos
            currentPlaylist = data.tracks.map(trackPath => ({
                path: trackPath,
                file: trackPath.split('/').pop(),
                duration: 240 // Valor por defecto
            }));
            
            // ⭐⭐ IMPORTANTE: Siempre empieza desde la PRIMERA ⭐⭐
            currentTrackIndex = 0;
            
            console.log(`✅ ${currentPlaylist.length} canciones cargadas (Modo Simple)`);
            
        } catch (error) {
            console.error('Error cargando playlist:', error);
            
            // Fallback con algunos de tus tracks
            currentPlaylist = [
                {path: 'music/aerodynamik.mp3', file: 'aerodynamik.mp3', duration: 240},
                {path: 'music/andando.mp3', file: 'andando.mp3', duration: 240},
                {path: 'music/bajoelagua.mp3', file: 'bajoelagua.mp3', duration: 240},
                {path: 'music/blueelectric.mp3', file: 'blueelectric.mp3', duration: 240},
                {path: 'music/ciudad.mp3', file: 'ciudad.mp3', duration: 240},
                {path: 'music/jazzcartel.mp3', file: 'jazzcartel.mp3', duration: 240}
            ];
            currentTrackIndex = 0;
        }
    }
    
    function playNextTrack() {
        if (currentPlaylist.length === 0) {
            console.log('⚠️ Playlist vacía, recargando...');
            loadSimplePlaylist().then(() => {
                if (currentPlaylist.length > 0) {
                    currentTrackIndex = 0;
                    playCurrentTrack();
                }
            });
            return;
        }
        
        // Avanza secuencialmente (1→2→3→...→N→1)
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        console.log(`⏭️ Siguiente: ${currentTrackIndex + 1}/${currentPlaylist.length}`);
        
        playCurrentTrack();
    }
    
    function playCurrentTrack() {
        if (currentPlaylist.length === 0) {
            console.log('⚠️ No hay canciones');
            return;
        }
        
        const track = currentPlaylist[currentTrackIndex];
        
        // Evitar recargar la misma canción
        if (currentTrackPlaying === track.path && !audioPlayer.paused) {
            return;
        }
        
        currentTrackPlaying = track.path;
        console.log(`🎵 ${track.file} (${currentTrackIndex + 1}/${currentPlaylist.length})`);
        
        // Limpiar estado anterior
        audioPlayer.onended = null;
        audioPlayer.onerror = null;
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        // Nueva fuente
        audioPlayer.src = track.path;
        
        // Reproducir si está en modo play
        const tryPlay = () => {
            if (isPlaying) {
                audioPlayer.play().catch(e => {
                    console.error('❌ Error al reproducir:', e);
                    setTimeout(() => playNextTrack(), 1000);
                });
            }
        };
        
        // Manejar carga del audio
        audioPlayer.addEventListener('loadedmetadata', function onMetadata() {
            audioPlayer.removeEventListener('loadedmetadata', onMetadata);
            audioPlayer.currentTime = 0; // ⭐ SIEMPRE desde 0:00 ⭐
            tryPlay();
        }, { once: true });
        
        // Si ya está cargado
        if (audioPlayer.readyState >= 1) {
            audioPlayer.currentTime = 0;
            tryPlay();
        }
        
        // Cuando termina la canción
        audioPlayer.onended = function() {
            console.log('✅ Canción terminada, siguiente...');
            playNextTrack();
        };
        
        // Manejo de errores
        audioPlayer.onerror = function() {
            console.error('❌ Error de audio, saltando canción...');
            setTimeout(() => playNextTrack(), 500);
        };
    }
    
    // ========== INTERFAZ ==========
    
    function updateDisplayInfo() {
        // Mantén tu lógica actual de mostrar programa/horario
        const scheduleData = {
            "schedules": [
                {
                    "name": "madrugada",
                    "displayName": "Radio 404",
                    "start": "01:00",
                    "end": "06:00",
                    "description": "Sonidos atmosféricos y experimentales para las primeras horas del día."
                },
                {
                    "name": "mañana",
                    "displayName": "Archivo txt",
                    "start": "06:00",
                    "end": "12:00",
                    "description": "Programa matutino con energía y ritmos para comenzar el día."
                }
                // ... tus otros programas
            ]
        };
        
        const now = getArgentinaTime();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        let currentSchedule = scheduleData.schedules[0];
        
        for (const schedule of scheduleData.schedules) {
            const start = schedule.start.split(':').map(Number);
            const end = schedule.end.split(':').map(Number);
            const startTime = start[0] * 60 + start[1];
            let endTime = end[0] * 60 + end[1];
            
            if (endTime < startTime) endTime += 24 * 60;
            
            const adjustedCurrentTime = currentTime + (currentTime < startTime ? 24 * 60 : 0);
            
            if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
                currentSchedule = schedule;
                break;
            }
        }
        
        // Actualizar DOM
        currentShow.textContent = currentSchedule.displayName;
        currentTimeName.textContent = currentSchedule.displayName;
        currentTimeRange.textContent = 
            `${formatTimeForDisplay(currentSchedule.start)} - ${formatTimeForDisplay(currentSchedule.end)}`;
    }
    
    function updatePlayButton() {
        if (isPlaying) {
            playPath.setAttribute('opacity', '0');
            pausePath1.setAttribute('opacity', '1');
            pausePath2.setAttribute('opacity', '1');
            playButton.setAttribute('aria-label', 'Pausar');
        } else {
            playPath.setAttribute('opacity', '1');
            pausePath1.setAttribute('opacity', '0');
            pausePath2.setAttribute('opacity', '0');
            playButton.setAttribute('aria-label', 'Reproducir');
        }
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
            // PAUSA
            audioPlayer.pause();
            isPlaying = false;
        } else {
            // PLAY simple - sin cálculos horarios
            if (currentPlaylist.length === 0) {
                await loadSimplePlaylist();
            }
            isPlaying = true;
            playCurrentTrack();
        }
        updatePlayButton();
    });
    
    shareButton.addEventListener('click', shareRadio);
    
    // ========== INICIALIZACIÓN ==========
    
    async function init() {
        console.log('🚀 Iniciando Teletext Radio (Modo Simple - Esta Semana)');
        console.log('⭐ PLAYLIST SECUENCIAL: 1→2→3→...→N→1');
        
        // Cargar playlist
        await loadSimplePlaylist();
        
        // Mostrar info de programa/horario
        updateDisplayInfo();
        
        // Check periódico solo para info (no cambia playlist)
        setInterval(updateDisplayInfo, 60000);
        
        // Check de caída de audio
        setInterval(() => {
            if (isPlaying && audioPlayer.paused && !audioPlayer.ended) {
                console.log('⚠️ Audio caído, reintentando...');
                audioPlayer.play().catch(() => playNextTrack());
            }
        }, 5000);
        
        console.log('✅ Radio lista en MODO SIMPLE');
    }
    
    // Iniciar
    init();
});
