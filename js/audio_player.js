import MusicPlayer from "./components/MusicPlayer.js";

document.addEventListener("DOMContentLoaded", () => {
  const playlist = [
    {
      title: "Ain't That Sad",
      artist: "MARMALEE",
      src: "assets/audio/aint_that_sad.m4a",
      lrcPath: "assets/audio/aint_that_sad.lrc",
    },
    {
      title: "Come Back To Me",
      artist: "MARMALEE",
      src: "assets/audio/come_back_to_me.m4a",
      lrcPath: "assets/audio/come_back_to_me.lrc",
    },
    {
      title: "TV Tree Demo",
      artist: "MARMALEE",
      src: "assets/audio/tv_tree_demo.mp3",
      lrcPath: "assets/audio/tv_tree_demo.lrc",
    },
  ];

  new MusicPlayer(playlist);
});
