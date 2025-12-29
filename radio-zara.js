// radio-zara.js - ZARA RADIO (Sincronizado)
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
    
    // ========== ZARA RADIO ==========
    async function loadZaraPlaylist() {
        try {
            console.log('📻 Cargando Zara Radio...');
            const response = await fetch('playlist.json');
            const data = await response.json();
            
            currentPlaylist = data.tracks.map(track => ({
                path: track,
                file: track.split('/').pop()
            }));
            
            // CÁLCULO ZARA RADIO - SÍNCRONICO
            const ahora = new Date();
            const segundosHoy = (ahora.getHours() * 3600) + 
                                (ahora.getMinutes() * 60) + 
                                ahora.getSeconds();
            const duracionTotal = currentPlaylist.length * 240; // 4 min por canción
            const segundosEnCiclo = segundosHoy % duracionTotal;
            currentTrackIndex = Math.floor(segundosEnCiclo / 240) % currentPlaylist.length;
            const segundoEnCancion = segundosEnCiclo % 240;
            
            console.log(`⏱️ Sincronizado: canción ${currentTrackIndex + 1}/${currentPlaylist.length}`);
            console.log(`   Hora ARG: ${ahora.getHours()}:${ahora.getMinutes()}:${ahora.getSeconds()}`);
            console.log(`   Segundo en canción: ${segundoEnCancion}s`);
            
        } catch (error) {
            console.error('Error:', error);
            currentPlaylist = [];
            currentTrackIndex = 0;
        }
    }
    
    function playNextTrack() {
        if (currentPlaylist.length === 0) return;
        
        currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        console.log(`⏭️ ${currentTrackIndex + 1}/${currentPlaylist.length}`);
        playCurrentTrack();
    }
    
    function playCurrentTrack() {
        if (currentPlaylist.length === 0) return;
        
        const track = currentPlaylist[currentTrackIndex];
        console.log(`🎵 ${track.file}`);
        
        // Calcular segundo actual
        const ahora = new Date();
        const segundosHoy = (ahora.getHours() * 3600) + 
                           (ahora.getMinutes() * 60) + 
                           ahora.getSeconds();
        const segundoEnCancion = segundosHoy % 240;
        
        audioPlayer.src = track.path;
        audioPlayer.currentTime = segundoEnCancion; // EMPIEZA EN SEGUNDO CORRECTO
        
        if (isPlaying) {
            audioPlayer.play().catch(e => {
                console.error('❌ Error:', e.name);
                setTimeout(() => playNextTrack(), 2000);
            });
        }
        
        // Programar siguiente canción en el tiempo restante
        const tiempoRestante = 240 - segundoEnCancion;
        setTimeout(() => {
            if (isPlaying) {
                playNextTrack();
            }
        }, tiempoRestante * 1000);
        
        audioPlayer.onerror = function() {
            console.error('❌ Error audio');
            setTimeout(() => playNextTrack(), 2000);
        };
    }
    
    // ========== EVENTOS ==========
    playButton.addEventListener('click', async function() {
        if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
        } else {
            if (currentPlaylist.length === 0) await loadZaraPlaylist();
            isPlaying = true;
            playCurrentTrack();
        }
        
        playPath.setAttribute('opacity', isPlaying ? '0' : '1');
        pausePath1.setAttribute('opacity', isPlaying ? '1' : '0');
        pausePath2.setAttribute('opacity', isPlaying ? '1' : '0');
    });
    
    // ========== INICIALIZAR ==========
    loadZaraPlaylist();
    console.log('✅ Zara Radio lista - SINCRONIZADO');
});
