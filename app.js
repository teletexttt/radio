// app.js - Teletext Radio v2.0 (Playlist por programa)
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
    const scheduleGrid = document.querySelector('.schedule-grid');
    
    // Estado
    let isPlaying = false;
    let currentPlaylist = [];
    let currentTrackIndex = 0;
    let currentProgram = null;
    let nextProgram = null; // Para transiciones
    let currentTrackPlaying = null;
    let programsConfig = null;
    
    // ========== FUNCIONES CORE ==========
    
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
    
    // ========== GESTIÓN DE PROGRAMAS ==========
    
    async function loadProgramsConfig() {
        try {
            console.log('📋 Cargando configuración de programas...');
            const response = await fetch('music/_programs.json');
            
            if (!response.ok) {
                console.error('❌ No se encontró music/_programs.json');
                return null;
            }
            
            programsConfig = await response.json();
            console.log(`✅ Config cargada: ${programsConfig.programs.length} programas`);
            return programsConfig;
            
        } catch (error) {
            console.error('Error cargando configuración:', error);
            return null;
        }
    }
    
    function getCurrentProgramFromSchedule(now) {
        if (!programsConfig) return null;
        
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        for (const program of programsConfig.programs) {
            const start = program.schedule.start.split(':').map(Number);
            const end = program.schedule.end.split(':').map(Number);
            
            const startTime = start[0] * 60 + start[1];
            let endTime = end[0] * 60 + end[1];
            
            // Manejar cruce de medianoche
            if (endTime <= startTime) {
                endTime += 24 * 60;
            }
            
            const adjustedCurrentTime = currentTime + 
                (currentTime < startTime ? 24 * 60 : 0);
            
            if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
                return program;
            }
        }
        
        return programsConfig.programs[0]; // Fallback
    }
    
    // ========== PLAYLIST POR PROGRAMA ==========
    
    async function loadCurrentPlaylist() {
        try {
            if (!programsConfig) {
                await loadProgramsConfig();
                if (!programsConfig) {
                    currentPlaylist = [{path: 'music/jazzcartel.mp3'}];
                    return;
                }
            }
            
            // Determinar programa actual
            const now = getArgentinaTime();
            currentProgram = getCurrentProgramFromSchedule(now);
            
            if (!currentProgram) {
                console.error('❌ No se pudo determinar el programa actual');
                currentPlaylist = [{path: 'music/jazzcartel.mp3'}];
                return;
            }
            
            console.log(`🎯 Programa actual: ${currentProgram.name} (${currentProgram.folder})`);
            
            // Cargar playlist del programa
            const response = await fetch(`music/${currentProgram.folder}/playlist.json`);
            
            if (response.ok) {
                const playlistData = await response.json();
                currentPlaylist = playlistData.tracks || [];
                console.log(`✅ Playlist cargada: ${currentPlaylist.length} tracks`);
            } else {
                // Fallback: buscar MP3s directamente
                console.warn(`⚠️ No hay playlist.json, usando MP3s directos`);
                currentPlaylist = await scanFolderForMP3s(currentProgram.folder);
            }
            
            currentTrackIndex = 0;
            updateDisplayInfo();
            
        } catch (error) {
            console.error('Error cargando playlist:', error);
            currentPlaylist = [{path: 'music/jazzcartel.mp3'}];
            currentTrackIndex = 0;
        }
    }
    
    async function scanFolderForMP3s(folderName) {
        try {
            // Este endpoint debe existir en tu backend
            const response = await fetch(`api/list-mp3s?folder=${folderName}`);
            if (response.ok) {
                const files = await response.json();
                return files.map(file => ({
                    file: file,
                    duration: 240, // Valor por defecto
                    path: `music/${folderName}/${file}`
                }));
            }
        } catch (e) {
            console.error('No se pudo escanear carpeta:', e);
        }
        
        // Fallback absoluto
        return [{path: 'music/jazzcartel.mp3', duration: 240, file: 'jazzcartel.mp3'}];
    }
    
    // ========== REPRODUCCIÓN ==========
    
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
        console.log(`⏭️ Siguiente: ${currentTrackIndex + 1}/${currentPlaylist.length}`);
        
        playCurrentTrack();
    }
    
    function playCurrentTrack() {
        if (currentPlaylist.length === 0) return;
        
        const track = currentPlaylist[currentTrackIndex];
        
        // Evitar recargar la misma canción
        if (currentTrackPlaying === track.path && !audioPlayer.paused) {
            return;
        }
        
        currentTrackPlaying = track.path;
        console.log(`🎵 Reproduciendo: ${track.file}`);
        
        // Limpiar estado anterior
        audioPlayer.onended = null;
        audioPlayer.onerror = null;
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        // Nueva fuente
        audioPlayer.src = track.path;
        
        // Cargar y reproducir
        const tryPlay = () => {
            if (isPlaying) {
                audioPlayer.play().catch(e => {
                    console.error('❌ Error al reproducir:', e);
                    setTimeout(() => playNextTrack(), 1000);
                });
            }
        };
        
        audioPlayer.addEventListener('loadedmetadata', function onMetadata() {
            audioPlayer.removeEventListener('loadedmetadata', onMetadata);
            audioPlayer.currentTime = 0; // Siempre desde 0
            tryPlay();
        }, { once: true });
        
        // Si ya está cargado
        if (audioPlayer.readyState >= 1) {
            audioPlayer.currentTime = 0;
            tryPlay();
        }
        
        // Eventos
        audioPlayer.onended = () => {
            console.log('✅ Canción terminada');
            playNextTrack();
        };
        
        audioPlayer.onerror = () => {
            console.error('❌ Error de audio');
            setTimeout(() => playNextTrack(), 500);
        };
    }
    
    // ========== INTERFAZ ==========
    
    function updateDisplayInfo() {
        if (!currentProgram) return;
        
        currentShow.textContent = currentProgram.name;
        currentTimeName.textContent = currentProgram.name;
        currentTimeRange.textContent = 
            `${formatTimeForDisplay(currentProgram.schedule.start)} - ${formatTimeForDisplay(currentProgram.schedule.end)}`;
    }
    
    function generateScheduleCards() {
        if (!scheduleGrid || !programsConfig) return;
        
        scheduleGrid.innerHTML = '';
        
        programsConfig.programs.forEach(program => {
            const card = document.createElement('div');
            card.className = 'schedule-card';
            
            card.innerHTML = `
                <div class="schedule-time">
                    ${formatTimeForDisplay(program.schedule.start)} - ${formatTimeForDisplay(program.schedule.end)}
                </div>
                <div class="schedule-name">${program.name}</div>
                <div class="schedule-desc">
                    ${program.description || 'Programación automática'}
                </div>
            `;
            
            scheduleGrid.appendChild(card);
        });
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
    
    // ========== DETECCIÓN DE CAMBIO DE PROGRAMA ==========
    
    function checkProgramChange() {
        if (!programsConfig) return;
        
        const now = getArgentinaTime();
        const newProgram = getCurrentProgramFromSchedule(now);
        
        if (!newProgram || !currentProgram) return;
        
        if (newProgram.folder !== currentProgram.folder) {
            console.log(`🔄 Cambio de programa: ${currentProgram.name} → ${newProgram.name}`);
            
            if (isPlaying) {
                // Transición diferida: esperar a que termine la canción actual
                nextProgram = newProgram;
                console.log('⏳ Transición programada al terminar canción actual');
            } else {
                // Cambiar inmediatamente si no está reproduciendo
                currentProgram = newProgram;
                loadCurrentPlaylist();
            }
        }
    }
    
    // Modificar evento onended para manejar transiciones
    const originalOnEnded = audioPlayer.onended;
    audioPlayer.onended = function() {
        if (nextProgram) {
            console.log(`🎬 Transicionando a: ${nextProgram.name}`);
            currentProgram = nextProgram;
            nextProgram = null;
            loadCurrentPlaylist().then(() => {
                playCurrentTrack();
            });
        } else {
            playNextTrack();
        }
    };
    
    // ========== EVENTOS ==========
    
    playButton.addEventListener('click', async function() {
        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
        } else {
            if (currentPlaylist.length === 0) {
                await loadCurrentPlaylist();
            }
            isPlaying = true;
            playCurrentTrack();
        }
        updatePlayButton();
    });
    
    shareButton.addEventListener('click', function() {
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
    });
    
    // ========== INICIALIZACIÓN ==========
    
    async function init() {
        console.log('🚀 Iniciando Teletext Radio v2.0...');
        
        // 1. Cargar configuración
        await loadProgramsConfig();
        
        // 2. Cargar playlist inicial
        await loadCurrentPlaylist();
        
        // 3. Generar interfaz
        updateDisplayInfo();
        if (programsConfig) {
            generateScheduleCards();
        }
        
        // 4. Iniciar checks periódicos
        setInterval(checkProgramChange, 30000); // Cada 30 segundos
        setInterval(updateDisplayInfo, 60000);
        
        // 5. Check de caída de audio
        setInterval(() => {
            if (isPlaying && audioPlayer.paused && !audioPlayer.ended) {
                console.log('⚠️ Audio caído, reintentando...');
                audioPlayer.play().catch(() => playNextTrack());
            }
        }, 5000);
        
        console.log('✅ Radio lista');
    }
    
    // Iniciar
    init();
});
