export default class LyricParser {
  constructor() {
    this.abortController = null;
  }

  async load(lrcPath) {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      const response = await fetch(lrcPath, {
        signal: this.abortController.signal,
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const lrcText = await response.text();
      return this.parse(lrcText);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Previous LRC fetch safely aborted.");
      } else {
        console.error("Failed to load LRC file:", err);
      }
      return [];
    }
  }

  parse(lrcString) {
    const lines = lrcString.trim().split(/\r?\n/);
    const parsed = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach((line) => {
      const match = timeReg.exec(line);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10);
        const time =
          mins * 60 + secs + ms / (match[3].length === 3 ? 1000 : 100);
        const text = line.replace(timeReg, "").trim();
        if (text) parsed.push({ time, text });
      }
    });
    return parsed;
  }
}
