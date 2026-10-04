export default class StorageManager {
  constructor(prefix = "marmalee") {
    this.prefix = prefix;
  }

  _getKey(key) {
    return `${this.prefix}_${key}`;
  }

  get(key, fallback) {
    try {
      const item = localStorage.getItem(this._getKey(key));
      return item !== null ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  set(key, val) {
    try {
      localStorage.setItem(this._getKey(key), JSON.stringify(val));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }
}
