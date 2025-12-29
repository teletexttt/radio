// app.js - RADIO REAL (ZARA RADIO)
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
    
    let isPlaying = false;
    let currentPlaylist = [];
    
    // ========== ZARA RADIO ==========
    async function loadPlaylist() {
        try {
            console.log('📻 Cargando playlist...');
            const response = await fetch('playlist.json');
            const data = await response.json();
            
            currentPlaylist = data.tracks.map(track => ({
                path: track,
                file: track.split('/').pop()
            }));
            
            console.log(`✅ ${currentPlaylist.length} canciones (Radio Real)`);
            
        } catch (error) {
            console.error('Error:', error);
            currentPlaylist = [];
        }
    }
    
    function getCurrentTrackInfo() {
        if (currentPlaylist.length === 0) return { trackIndex: 0, secondInTrack: 0 };
        
        const ahora = new Date();
        const segundosHoy = (ahora.getHours() * 3600) + (ahora.getMinutes() * 60) + ahora.getSeconds();
        const duracionTotal = currentPlaylist.length * 240; // 4 min por canción
        const segundosEnCiclo = segundosHoy % duracionTotal;
        const trackIndex = Math.floor(segundosEnCiclo / 240) % currentPlaylist.length;
        const secondInTrack = segundosEnCiclo % 240;
        
        return { trackIndex, secondInTrack };
    }
    
    function playCurrentTrack() {
        if (currentPlaylist.length === 0) return;
        
        const { trackIndex, secondInTrack } = getCurrentTrackInfo();
        const track = currentPlaylist[trackIndex];
        
        console.log(`📻 Radio Real: canción ${trackIndex + 1}/${currentPlaylist.length}`);
        console.log(`   Hora actual: ${Math.floor(secondInTrack)}s de 240s`);
        
        audioPlayer.src = track.path;
        audioPlayer.currentTime = secondInTrack;
        
        if (isPlaying) {
            audioPlayer.play().catch(e => {
                console.error('❌ Error:', e.name);
                setTimeout(() => playCurrentTrack(), 2000);
            });
        }
        
        // Cuando la canción llegue a su fin (240s), pasar a la siguiente
        const timeToEnd = 240 - secondInTrack;
        setTimeout(() => {
            if (isPlaying) {
                console.log('🔄 Fin de canción por tiempo, siguiente...');
                playCurrentTrack();
            }
        }, timeToEnd * 1000);
        
        audioPlayer.onerror = function() {
            console.error('❌ Error audio, reintentando...');
            setTimeout(() => playCurrentTrack(), 2000);
        };
    }
    
    // ========== EVENTOS ==========
    playButton.addEventListener('click', async function() {
        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
        } else {
            if (currentPlaylist.length === 0) await loadPlaylist();
            isPlaying = true;
            playCurrentTrack();
        }
        
        playPath.setAttribute('opacity', isPlaying ? '0' : '1');
        pausePath1.setAttribute('opacity', isPlaying ? '1' : '0');
        pausePath2.setAttribute('opacity', isPlaying ? '1' : '0');
    });
    
    // Verificar cada minuto si cambió la canción
    setInterval(() => {
        if (isPlaying) {
            const { trackIndex } = getCurrentTrackInfo();
            const currentSrc = audioPlayer.src.split('/').pop();
            const shouldBeTrack = currentPlaylist[trackIndex]?.file;
            
            if (shouldBeTrack && currentSrc !== shouldBeTrack) {
                console.log('🔄 Cambio de canción por horario');
                playCurrentTrack();
            }
        }
    }, 60000);
    
    // ========== INICIALIZAR ==========
    loadPlaylist();
    console.log('✅ Radio Real (Zara Radio) - Todos escuchan lo mismo');
});
