(() => {
  window.__spoken = [];
  const ss = {
    speaking: false, pending: false,
    speak(u) { window.__spoken.push(u.text); this.speaking = true; this._u = u; },
    cancel() { this.speaking = false; this._u = null; },
    getVoices() { return []; }, addEventListener() {}, removeEventListener() {}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true });
  window.__endSpeech = () => { const u = ss._u; ss.speaking = false; ss._u = null; if (u && u.onend) u.onend(); };
})();
