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
    const collectionsGrid = document.querySelector('.collections-grid');
    
    let isPlaying = false;
    let currentPlaylist = [];
    let currentTrackIndex = 0;
    let currentTrackPlaying = null;
    
    // --- MODO ESPECIAL ACTIVADO ---
    const MODO_ESPECIAL = true;
    const PLAYLIST_ESPECIAL = 'playlist_especial.json';
    // ------------------------------
    
    const programNames = {
        "madrugada": "Madrugada txt",
        "mañana": "Telesoft", 
        "tarde": "Radio 404",
        "mediatarde": "Floppy Disk",
        "noche": "Piratas Informáticos"
    };
    
    const programDescriptions = {
        "madrugada": "Sonidos atmosféricos y experimentales para las primeras horas del día.",
        "mañana": "Programa matutino con energía y ritmos para comenzar el día.",
        "tarde": "Ritmos variados y selecciones especiales para acompañar la tarde.",
        "mediatarde": "Transición hacia la noche con sonidos más atmosféricos.",
        "noche": "Sesiones extendidas y atmósferas nocturnas para terminar el día."
    };
    
    const scheduleData = {
        "schedules": [
            {
                "name": "madrugada",
                "displayName": "Madrugada txt",
                "start": "01:00",
                "end": "06:00",
                "description": programDescriptions.madrugada
            },
            {
                "name": "mañana",
                "displayName": "Telesoft",
                "start": "06:00",
                "end": "12:00",
                "description": programDescriptions.mañana
            },
            {
                "name": "tarde",
                "displayName": "Radio 404",
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
                "displayName": "Piratas Informáticos",
                "start": "20:00",
                "end": "01:00",
                "description": programDescriptions.noche
            }
        ]
    };
    
    const collectionsData = [
        {
            "name": "Madrugada txt",
            "folder": "madrugada",
            "tracks": 24,
            "description": "Selección atmosférica para las primeras horas del día."
        },
        {
            "name": "Telesoft",
            "folder": "mañana",
            "tracks": 32,
            "description": "Energía y ritmos para comenzar el día con buen pie."
        },
        {
            "name": "Radio 404",
            "folder": "tarde",
            "tracks": 28,
            "description": "Ritmos variados que caracterizan al programa Radio 404."
        },
        {
            "name": "Floppy Disk",
            "folder": "mediatarde",
            "tracks": 30,
            "description": "Transición hacia la noche con sonidos más profundos."
        },
        {
            "name": "Piratas Informáticos",
            "folder": "noche",
            "tracks": 35,
            "description": "Sesiones extendidas y atmósferas nocturnas."
        }
    ];
    
    async function getArgentinaTime() {
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/America/Argentina/Buenos_Aires');
            const data = await response.json();
            return new Date(data.datetime);
        } catch (error) {
            console.error("⚠️ API de hora falló. Usando fallback local.", error);
            const now = new Date();
            const argentinaOffset = -3 * 60;
            const localOffset = now.getTimezoneOffset();
            const offsetDiff = argentinaOffset + localOffset;
            return new Date(now.getTime() + offsetDiff * 60000);
        }
    }
    
    function formatTimeForDisplay(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    // --- FUNCIÓN MODIFICADA PARA MODO ESPECIAL ---
    async function loadCurrentPlaylist() {
        console.log('🎭 MODO ESPECIAL ACTIVADO - Ignorando programación horaria');
        
        try {
            const response = await fetch(PLAYLIST_ESPECIAL);
            if (!response.ok) throw new Error(`Archivo no encontrado: ${PLAYLIST_ESPECIAL}`);
            
            const data = await response.json();
            
            if (data.tracks && Array.isArray(data.tracks)) {
                currentPlaylist = data.tracks;
                console.log(`✅ Playlist ESPECIAL cargada: ${currentPlaylist.length} pistas`);
                
                currentTrackIndex = Math.floor(Math.random() * currentPlaylist.length);
                
                // Actualizar UI para mostrar que es especial
                currentShow.textContent = "🎭 Selección Especial";
                currentTimeName.textContent = "Selección Especial";
                currentTimeRange.textContent = "Reproducción continua";
                
                if (isPlaying) {
                    playCurrentTrack();
                }
            } else {
                throw new Error("Formato incorrecto en playlist especial");
            }
        } catch (error) {
            console.error(`❌ Error cargando ${PLAYLIST_ESPECIAL}:`, error);
            alert(`No se puede cargar la playlist especial. Verifica que ${PLAYLIST_ESPECIAL} exista y tenga pistas.`);
            currentPlaylist = [];
        }
    }
    
    function playNextTrack() {
        if (currentPlaylist.length === 0) {
            loadCurrentPlaylist().then(() => {
                if (currentPlaylist.length > 0) {
                    currentTrackIndex = 0;
                    playCurrentTrack();
                }
            });
            return;
        }
        
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        
        setTimeout(() => {
            playCurrentTrack();
        }, 50);
    }
    
    function playCurrentTrack() {
        if (currentPlaylist.length === 0) {
            console.log('⚠️ Playlist vacía');
            return;
        }
        
        const track = currentPlaylist[currentTrackIndex];
        
        if (currentTrackPlaying === track && !audioPlayer.paused) {
            playNextTrack();
            return;
        }
        
        currentTrackPlaying = track;
        console.log('🎵 Reproduciendo (Especial):', track);
        
        audioPlayer.onended = null;
        audioPlayer.onerror = null;
        
        audioPlayer.src = track;
        
        audioPlayer.addEventListener('loadedmetadata', function onMetadata() {
            audioPlayer.removeEventListener('loadedmetadata', onMetadata);
            
            if (audioPlayer.duration > 30) {
                const randomStart = Math.random() * (audioPlayer.duration * 0.7) + (audioPlayer.duration * 0.1);
                audioPlayer.currentTime = randomStart;
            } else {
                audioPlayer.currentTime = 0;
            }
            
            if (isPlaying) {
                const playPromise = audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.error('❌ Error al reproducir:', e);
                        setTimeout(playNextTrack, 500);
                    });
                }
            }
        }, { once: true });
        
        audioPlayer.onended = function() {
            console.log('✅ Canción terminó, siguiente...');
            playNextTrack();
        };
        
        audioPlayer.onerror = function(e) {
            console.error('❌ Error en canción:', audioPlayer.error?.message || 'Error desconocido');
            setTimeout(() => {
                playNextTrack();
            }, 500);
        };
        
        if (audioPlayer.readyState >= 1) {
            audioPlayer.dispatchEvent(new Event('loadedmetadata'));
        }
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
    
    function generateScheduleCards() {
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
    
    function generateCollectionCards() {
        collectionsGrid.innerHTML = '';
        
        collectionsData.forEach(collection => {
            const card = document.createElement('div');
            card.className = 'collection-card';
            
            card.innerHTML = `
                <div class="collection-header">
                    <div class="collection-name">${collection.name}</div>
                    <div class="collection-meta">
                        <span>${collection.tracks} tracks</span>
                    </div>
                </div>
                <div class="collection-body">
                    <div class="collection-desc">${collection.description}</div>
                </div>
            `;
            
            collectionsGrid.appendChild(card);
        });
    }
    
    playButton.addEventListener('click', async function() {
        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
            updatePlayButton();
        } else {
            if (!audioPlayer.src || audioPlayer.ended) {
                if (currentPlaylist.length === 0) {
                    await loadCurrentPlaylist();
                    currentTrackIndex = 0;
                }
                isPlaying = true;
                updatePlayButton();
                playCurrentTrack();
            } else {
                audioPlayer.play().then(() => {
                    isPlaying = true;
                    updatePlayButton();
                }).catch(e => {
                    console.error('Error al reanudar:', e);
                    playNextTrack();
                });
            }
        }
    });
    
    shareButton.addEventListener('click', shareRadio);
    
    // ✅ INICIALIZACIÓN
    async function init() {
        generateScheduleCards();
        generateCollectionCards();
        
        // En modo especial, no chequeamos horarios
        if (MODO_ESPECIAL) {
            console.log('🎭 INICIANDO EN MODO ESPECIAL');
            currentShow.textContent = "🎭 Selección Especial";
            currentTimeName.textContent = "Selección Especial";
            currentTimeRange.textContent = "Reproducción continua";
        }
        
        await loadCurrentPlaylist();
        
        // Configurar chequeos periódicos (solo para fallos técnicos)
        setInterval(() => {
            if (isPlaying && audioPlayer.paused && !audioPlayer.ended) {
                audioPlayer.play().catch(e => {
                    console.error('No se pudo reanudar, siguiente canción:', e);
                    playNextTrack();
                });
            }
        }, 5000);
    }
    
    init();
});
