document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("radioPlayButton");

  const playPath = document.getElementById("playPath");
  const pause1 = document.getElementById("pausePath1");
  const pause2 = document.getElementById("pausePath2");

  const currentShow = document.getElementById("currentShow");
  const currentTimeName = document.getElementById("currentTimeName");
  const currentTimeRange = document.getElementById("currentTimeRange");

  let playlist = [];
  let totalDuration = 0;
  let isPlaying = false;

  let currentTrackIndex = null;

  // Época fija: la radio ya estaba sonando
  const EPOCH = Date.UTC(2025, 0, 1, 0, 0, 0);

  function argentinaNowMs() {
    const now = new Date();
    return now.getTime() - now.getTimezoneOffset() * 60000 - 3 * 3600000;
  }

  async function loadPlaylist() {
    const res = await fetch("playlist.json", { cache: "no-store" });
    const data = await res.json();

    if (!data.tracks || !Array.isArray(data.tracks)) {
      throw new Error("playlist.json inválido");
    }

    playlist = data.tracks;
    totalDuration = playlist.reduce((a, t) => a + t.duration, 0);
  }

  function liveOffsetSeconds() {
    const elapsed = Math.floor((argentinaNowMs() - EPOCH) / 1000);
    return ((elapsed % totalDuration) + totalDuration) % totalDuration;
  }

  function resolveTrack(offset) {
    let acc = 0;
    for (let i = 0; i < playlist.length; i++) {
      const d = playlist[i].duration;
      if (acc + d > offset) {
        return { index: i, time: offset - acc };
      }
      acc += d;
    }
    return { index: 0, time: 0 };
  }

  function syncAndPlay() {
    if (!playlist.length || totalDuration === 0) return;

    const offset = liveOffsetSeconds();
    const { index, time } = resolveTrack(offset);
    const track = playlist[index];

    const sameTrack = currentTrackIndex === index;
    const drift = Math.abs(audio.currentTime - time);

    // SOLO re-sincroniza si es necesario
    if (!sameTrack || drift > 2 || audio.src === "") {
      audio.src = track.path;
      audio.currentTime = time;
      currentTrackIndex = index;
    }

    audio.onended = syncAndPlay;
    audio.onerror = () => setTimeout(syncAndPlay, 500);

    audio.play().catch(() => {
      setTimeout(syncAndPlay, 500);
    });
  }

  function updateButton() {
    if (isPlaying) {
      playPath.style.opacity = "0";
      pause1.style.opacity = "1";
      pause2.style.opacity = "1";
    } else {
      playPath.style.opacity = "1";
      pause1.style.opacity = "0";
      pause2.style.opacity = "0";
    }
  }

  playBtn.addEventListener("click", async () => {
    if (!playlist.length) {
      try {
        await loadPlaylist();
      } catch (e) {
        console.error(e);
        return;
      }
    }

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      syncAndPlay(); // siempre engancha al vivo
      isPlaying = true;
    }
    updateButton();
  });

  // UI “en vivo”
  currentShow.textContent = "Teletext Radio · En vivo";
  currentTimeName.textContent = "Emisión continua";
  currentTimeRange.textContent = "24/7";
});


