/**
 * Call once from a user gesture (e.g. start of handleAnalyze) so autoplay of
 * TTS on the next screen is more likely to succeed (Chrome/Safari policies).
 */
let unlocked = false;

export function unlockAudioPlayback() {
  if (unlocked || typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.001);
    }
  } catch {
    /* ignore */
  }
  try {
    const silent = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA=='
    );
    silent.volume = 0;
    void silent.play();
  } catch {
    /* ignore */
  }
  unlocked = true;
}
