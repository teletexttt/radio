// app.js - Radio Teletext (Playlist lineal infinita)
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
    let currentSchedule = null;
    let currentTrackPlaying = null;
    
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
        "especial": "Programación especial viernes y sábados de 22:00 a 00:00. Seguinos en nuestras redes para mas info."
    };
    
    const scheduleData = {
        "schedules": [
            {
                "name": "madrugada",
                "displayName": "Radio 404",
                "start": "01:00",
                "end": "06:00",
                "description": programDescriptions.madrugada
            },
            {
                "name": "mañana",
                "displayName": "Archivo txt",
                "start": "06:00",
                "end": "12:00",
                "description": programDescriptions.mañana
            },
            {
                "name": "tarde",
                "displayName": "Telesoft",
                "start": "12:00",
                "end": "16:00",
                "description": programDescriptions.tarde
            },
            {
                "name": "mediatarde",
                "displayName": "Floppy Disk",
                "start": "16:00",
                "end": "20:00",
                "description": programDescriptions.mediatarde
            },
            {
                "name": "noche",
                "displayName": "Internet Archive",
                "start": "20:00",
                "end": "01:00",
                "description": programDescriptions.noche
            },
            {
                "name": "especial",
                "displayName": "Especiales txt",
                "start": "22:00",
                "end": "00:00",
                "description": programDescriptions.especial
            }
        ]
    };
    
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
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        for (const regular of scheduleData.schedules) {
            const startTime = parseInt(regular.start.split(':')[0]) * 60 + parseInt(regular.start.split(':')[1]);
            let endTime = parseInt(regular.end.split(':')[0]) * 60 + parseInt(regular.end.split(':')[1]);
            
            if (endTime < startTime) {
                endTime += 24 * 60;
                const adjustedCurrentTime = currentTime + (currentTime < startTime ? 24 * 60 : 0);
                if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
                    return regular;
                }
            } else {
                if (currentTime >= startTime && currentTime < endTime) {
                    return regular;
                }
            }
        }
        
        return scheduleData.schedules[0];
    }
    
    function updateDisplayInfo() {
        currentSchedule = getCurrentSchedule();
        const displayName = currentSchedule.displayName || programNames[currentSchedule.name] || currentSchedule.name;
        
        currentShow.textContent = displayName;
        currentTimeName.textContent = displayName;
        currentTimeRange.textContent = `${formatTimeForDisplay(currentSchedule.start)} - ${formatTimeForDisplay(currentSchedule.end)}`;
    }
    
    function generateScheduleCards() {
        if (!scheduleGrid) {
            console.error("❌ No se encontró .schedule-grid");
            return;
        }
        
        scheduleGrid.innerHTML = '';
        
        scheduleData.schedules.forEach(schedule => {
            const card = document.createElement('div');
            card.className = 'schedule-card';
            
            const displayName = schedule.displayName || programNames[schedule.name] || schedule.name;
            const description = schedule.description || programDescriptions[schedule.name] || 'Programación automática';
            
            card.innerHTML = `
                <div class="schedule-time">${formatTimeForDisplay(schedule.start)} - ${formatTimeForDisplay(schedule.end)}</div>
                <div class="schedule-name">${displayName}</div>
                <div class="schedule-desc">${description}</div>
            `;
            
            scheduleGrid.appendChild(card);
        });
    }
    
    // --- PLAYLIST LINEAL INFINITA (Simple) ---
    async function loadCurrentPlaylist() {
        try {
            console.log('📻 Cargando playlist.json...');
            
            const response = await fetch('playlist.json');
            if (!response.ok) {
                console.error('❌ No se encontró playlist.json');
                currentPlaylist = [{path: 'music/jazzcartel.mp3'}];
                return;
            }
            
            const data = await response.json();
            
            if (data.tracks && Array.isArray(data.tracks)) {
                currentPlaylist = data.tracks;
                currentTrackIndex = 0;
                console.log(`✅ Playlist cargada: ${currentPlaylist.length} tracks`);
            } else {
                console.error('❌ Formato incorrecto en playlist.json');
                currentPlaylist = [{path: 'music/jazzcartel.mp3'}];
                currentTrackIndex = 0;
            }
            
        } catch (error) {
            console.log('Error cargando playlist:', error);
            currentPlaylist = [{path: 'music/jazzcartel.mp3'}];
            currentTrackIndex = 0;
        }
    }
    
    function playNextTrack() {
        if (currentPlaylist.length === 0) {
            console.log('⚠️ Playlist vacía, recargando...');
            loadCurrentPlaylist().then(() => {
                if (currentPlaylist.length > 0) {
                    currentTrackIndex = 0;
                    playCurrentTrack();
                }
            });
            return;
        }
        
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        console.log(`⏭️ Siguiente canción: ${currentTrackIndex + 1}/${currentPlaylist.length}`);
        
        // SIN TIMEOUT - DIRECTO
        playCurrentTrack();
    }
    
    function playCurrentTrack() {
        if (currentPlaylist.length === 0) {
            console.log('⚠️ No hay canciones en la playlist');
            return;
        }
        
        const track = currentPlaylist[currentTrackIndex];
        
        // Si ya está reproduciendo ESTA canción, no hacer nada
        if (currentTrackPlaying === track.path && !audioPlayer.paused) {
            return;
        }
        
        currentTrackPlaying = track.path;
        console.log(`🎵 Reproduciendo canción ${currentTrackIndex + 1}/${currentPlaylist.length}: ${track.file}`);
        
        // Limpiar eventos anteriores
        audioPlayer.onended = null;
        audioPlayer.onerror = null;
        
        // Detener reproducción actual antes de cambiar fuente
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        // Nueva fuente
        audioPlayer.src = track.path;
        
        // Cargar y reproducir
        audioPlayer.load();
        
        const tryPlay = () => {
            if (isPlaying) {
                const playPromise = audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.error('❌ Error al reproducir:', e.name, e.message);
                        // Reintentar después de error
                        setTimeout(() => playNextTrack(), 1000);
                    });
                }
            }
        };
        
        // Cuando se cargue la metadata, asegurar inicio desde 0
        audioPlayer.addEventListener('loadedmetadata', function onMetadata() {
            audioPlayer.removeEventListener('loadedmetadata', onMetadata);
            audioPlayer.currentTime = 0;
            tryPlay();
        }, { once: true });
        
        // Si ya está cargado, forzar inicio desde 0
        if (audioPlayer.readyState >= 1) {
            audioPlayer.currentTime = 0;
            tryPlay();
        }
        
        // Evento cuando termina la canción
        audioPlayer.onended = function() {
            console.log('✅ Canción terminó completamente, siguiente...');
            playNextTrack();
        };
        
        // Manejo de errores
        audioPlayer.onerror = function(e) {
            console.error('❌ Error en canción:', audioPlayer.error ? audioPlayer.error.message : 'Error desconocido');
            console.log('🔄 Pasando a siguiente canción...');
            setTimeout(() => playNextTrack(), 500);
        };
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
    }
    
    function checkScheduleChange() {
        const oldSchedule = currentSchedule ? currentSchedule.name : null;
        updateDisplayInfo();
        
        if (currentSchedule && oldSchedule !== currentSchedule.name && isPlaying) {
            console.log(`🔄 Cambio de horario: ${oldSchedule} → ${currentSchedule.name}`);
        }
    }
    
    // --- LÓGICA SIMPLE DE PLAY/PAUSA ---
    playButton.addEventListener('click', async function() {
        if (isPlaying) {
            // PAUSA normal
            audioPlayer.pause();
            isPlaying = false;
            updatePlayButton();
        } else {
            // PLAY: Inicia o reanuda
            if (currentPlaylist.length === 0) {
                await loadCurrentPlaylist();
            }
            
            isPlaying = true;
            updatePlayButton();
            playCurrentTrack();
        }
    });
    
    shareButton.addEventListener('click', shareRadio);
    
    // FUNCIONALIDAD NOVEDADES
    function inicializarNovedades() {
        const novedadCards = document.querySelectorAll('.novedad-card');
        
        novedadCards.forEach(card => {
            card.addEventListener('click', function() {
                const imagen = this.querySelector('img');
                const texto = this.querySelector('p');
                
                let modal = document.getElementById('modalNovedad');
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = 'modalNovedad';
                    modal.className = 'modal-novedad';
                    modal.innerHTML = `
                        <div class="modal-contenido">
                            <div class="modal-imagen-container">
                                <img src="" alt="Novedad ampliada">
                            </div>
                            <div class="modal-texto-completo"></div>
                        </div>
                    `;
                    document.body.appendChild(modal);
                    
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.style.display = 'none';
                            document.body.style.overflow = 'auto';
                        }
                    });
                    
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && modal.style.display === 'flex') {
                            modal.style.display = 'none';
                            document.body.style.overflow = 'auto';
                        }
                    });
                }
                
                modal.querySelector('img').src = imagen.src;
                modal.querySelector('img').alt = imagen.alt;
                modal.querySelector('.modal-texto-completo').textContent = texto.textContent;
                
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        });
    }
    
    // INICIALIZACIÓN
    updateDisplayInfo();
    generateScheduleCards();
    inicializarNovedades();
    
    loadCurrentPlaylist();
    
    setInterval(checkScheduleChange, 60000);
    setInterval(updateDisplayInfo, 60000);
    
    // Chequeo de caída
    setInterval(() => {
        if (isPlaying && audioPlayer.paused && !audioPlayer.ended) {
            console.log('⚠️ Radio se detuvo inesperadamente, reanudando...');
            audioPlayer.play().catch(e => {
                console.error('No se pudo reanudar, siguiente canción:', e);
                playNextTrack();
            });
        }
    }, 5000);
});
