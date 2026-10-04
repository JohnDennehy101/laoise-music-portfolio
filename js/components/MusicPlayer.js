import AudioVisualiser from "../classes/AudioVisualiser.js";
import LyricParser from "../classes/LyricParser.js";
import StorageManager from "../classes/StorageManager.js";

export default class MusicPlayer {
  constructor(playlist) {
    this.playlist = playlist;
    this.lyricParser = new LyricParser();
    this.storage = new StorageManager("marmalee");

    this.currentTrackIndex = parseInt(this.storage.get("track_index", 0), 10);
    if (
      this.currentTrackIndex >= this.playlist.length ||
      this.currentTrackIndex < 0
    ) {
      this.currentTrackIndex = 0;
    }

    this.init();
  }

  init() {
    this.injectHTML();
    this.cacheElements();

    this.visualizer = new AudioVisualiser(this.canvas, this.audioElement);
    this.bindEvents();

    const savedTime = parseFloat(this.storage.get("audio_time", 0));
    const wasPlaying = this.storage.get("is_playing", false);
    this.loadTrack(this.currentTrackIndex, savedTime, wasPlaying);
  }

  injectHTML() {
    const playerHTML = `
      <div class="lrc-player-widget">
        <button class="lrc-toggle-btn" id="lrcToggleBtn" aria-label="Toggle Music Player">
          <span class="pulse-dot"></span>
          <span id="toggleBtnText">Play Music</span>
        </button>
        <div class="lrc-player-drawer" id="lrcDrawer">
          <div class="lrc-header">
            <div class="lrc-track-info">
              <h4 id="trackTitle">Loading...</h4>
              <p id="trackArtist"></p>
            </div>
            <button class="lrc-close-btn" id="lrcCloseBtn" aria-label="Close Player">&times;</button>
          </div>
          <canvas class="lrc-visualizer-canvas" id="audioCanvas" width="350" height="60"></canvas>
          <div class="lrc-lyrics-container" id="lrcLyricsContainer">
            <div class="lrc-line">Loading lyrics...</div>
          </div>
          <div class="lrc-controls">
            <div class="lrc-progress-area">
              <span id="currentTime">0:00</span>
              <input type="range" class="lrc-progress-bar" id="lrcProgressBar" value="0" min="0" max="100" step="0.1" aria-label="Track Progress">
              <span id="durationTime">0:00</span>
            </div>
            <div class="lrc-main-buttons">
              <button class="lrc-btn" id="lrcPrevBtn" title="Previous Track">⏮</button>
              <button class="lrc-btn lrc-btn-play" id="lrcPlayBtn" title="Play/Pause">▶</button>
              <button class="lrc-btn" id="lrcNextBtn" title="Next Track">⏭</button>
            </div>
          </div>
        </div>
        <audio id="audioElement" crossorigin="anonymous" preload="auto"></audio>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", playerHTML);
  }

  cacheElements() {
    this.toggleBtn = document.getElementById("lrcToggleBtn");
    this.toggleBtnText = document.getElementById("toggleBtnText");
    this.drawer = document.getElementById("lrcDrawer");
    this.closeBtn = document.getElementById("lrcCloseBtn");
    this.playBtn = document.getElementById("lrcPlayBtn");
    this.prevBtn = document.getElementById("lrcPrevBtn");
    this.nextBtn = document.getElementById("lrcNextBtn");
    this.audioElement = document.getElementById("audioElement");
    this.progressBar = document.getElementById("lrcProgressBar");
    this.currentTimeEl = document.getElementById("currentTime");
    this.durationTimeEl = document.getElementById("durationTime");
    this.lyricsContainer = document.getElementById("lrcLyricsContainer");
    this.trackTitleEl = document.getElementById("trackTitle");
    this.trackArtistEl = document.getElementById("trackArtist");
    this.canvas = document.getElementById("audioCanvas");

    this.parsedLyrics = [];
    this.lyricLineElements = [];
  }

  async loadTrack(index, resumeTime = 0, autoPlay = false) {
    const track = this.playlist[index];
    this.currentTrackIndex = index;
    this.trackTitleEl.textContent = track.title;
    this.trackArtistEl.textContent = track.artist;
    this.audioElement.src = track.src;
    this.audioElement.currentTime = resumeTime;

    this.parsedLyrics = await this.lyricParser.load(track.lrcPath);
    if (this.parsedLyrics.length > 0) {
      this.renderLyrics();
    } else {
      this.lyricsContainer.innerHTML = `<div class="lrc-line">Could not load lyric file.</div>`;
    }

    if (autoPlay) {
      this.visualizer.init();
      this.visualizer.resumeContext();
      this.audioElement
        .play()
        .then(() => this.updatePlayState(true))
        .catch((e) => console.log("Autoplay prevented:", e));
    }
  }

  renderLyrics() {
    this.lyricsContainer.innerHTML = this.parsedLyrics
      .map(
        (item, i) =>
          `<div class="lrc-line" data-index="${i}" data-time="${item.time}">${item.text}</div>`,
      )
      .join("");

    this.lyricLineElements = this.lyricsContainer.querySelectorAll(".lrc-line");
    this.lyricLineElements.forEach((el) => {
      el.addEventListener("click", () => {
        this.audioElement.currentTime = parseFloat(
          el.getAttribute("data-time"),
        );
      });
    });
  }

  formatTime(s) {
    if (isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  }

  updatePlayState(isPlaying) {
    if (isPlaying) {
      this.playBtn.textContent = "⏸";
      this.toggleBtnText.textContent = "Now Playing...";
      this.storage.set("is_playing", true);
    } else {
      this.playBtn.textContent = "▶";
      this.toggleBtnText.textContent = "Paused";
      this.storage.set("is_playing", false);
    }
  }

  async togglePlay() {
    this.visualizer.init();
    this.visualizer.resumeContext();
    if (this.audioElement.paused) {
      try {
        await this.audioElement.play();
        this.updatePlayState(true);
      } catch (e) {
        console.log("Playback error:", e);
      }
    } else {
      this.audioElement.pause();
      this.updatePlayState(false);
    }
  }

  changeTrack(step) {
    const nextIdx =
      (this.currentTrackIndex + step + this.playlist.length) %
      this.playlist.length;
    this.loadTrack(nextIdx, 0, true);
  }

  handleTimeUpdate() {
    if (!this.audioElement.duration) return;
    const cur = this.audioElement.currentTime;
    this.progressBar.value = (cur / this.audioElement.duration) * 100;
    this.currentTimeEl.textContent = this.formatTime(cur);

    this.storage.set("audio_time", cur);
    this.storage.set("track_index", this.currentTrackIndex);

    const activeIdx = this.parsedLyrics.findIndex((item, i) => {
      const nextTime = this.parsedLyrics[i + 1]?.time ?? Infinity;
      return cur >= item.time && cur < nextTime;
    });

    this.lyricLineElements.forEach((el, idx) => {
      const isActive = idx === activeIdx;
      if (isActive && !el.classList.contains("active")) {
        el.classList.add("active");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (!isActive) {
        el.classList.remove("active");
      }
    });
  }

  bindEvents() {
    this.playBtn.addEventListener("click", () => this.togglePlay());
    this.nextBtn.addEventListener("click", () => this.changeTrack(1));
    this.prevBtn.addEventListener("click", () => this.changeTrack(-1));
    this.audioElement.addEventListener("ended", () => this.changeTrack(1));

    this.toggleBtn.addEventListener("click", () =>
      this.drawer.classList.toggle("active"),
    );
    this.closeBtn.addEventListener("click", () =>
      this.drawer.classList.remove("active"),
    );

    this.audioElement.addEventListener("loadedmetadata", () => {
      this.durationTimeEl.textContent = this.formatTime(
        this.audioElement.duration,
      );
    });

    this.audioElement.addEventListener("timeupdate", () =>
      this.handleTimeUpdate(),
    );

    this.progressBar.addEventListener("input", () => {
      if (!this.audioElement.duration) return;
      this.audioElement.currentTime =
        (this.progressBar.value / 100) * this.audioElement.duration;
    });

    window.addEventListener("beforeunload", () => {
      this.storage.set("audio_time", this.audioElement.currentTime);
      this.storage.set("is_playing", !this.audioElement.paused);
      this.visualizer.stop();
    });
  }
}
