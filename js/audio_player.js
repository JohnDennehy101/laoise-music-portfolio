import MusicPlayer from "./components/MusicPlayer.js";

document.addEventListener("DOMContentLoaded", () => {
  const playlist = [
    {
      title: "TV Tree Demo",
      artist: "MARMALEE",
      src: "assets/audio/tv_tree_demo.mp3",
      lrcPath: "assets/audio/tv_tree_demo.lrc",
    },
  ];

  new MusicPlayer(playlist);
});
