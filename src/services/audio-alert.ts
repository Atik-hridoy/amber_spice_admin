/**
 * Web Audio API synthesizer for operational notifications and kitchen tickets.
 * Avoids external MP3 dependencies, CORS issues, and playback delay.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

// Persistent user sound preference
const MUTE_STORAGE_KEY = 'amberspice_admin_sound_muted'

export function isAudioMuted(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false')
}

export function toggleAudioMuted(): boolean {
  const next = !isAudioMuted()
  setAudioMuted(next)
  return next
}

/**
 * Plays a cheerful dual-tone chime (A5 -> E6) for new customer orders.
 */
export function playOrderAlert(): void {
  if (isAudioMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Tone 1: 880 Hz (A5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.04)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    // Tone 2: 1318.5 Hz (E6)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1318.5, now + 0.12)
    gain2.gain.setValueAtTime(0, now + 0.12)
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.16)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.75)
  } catch (err) {
    console.warn('Audio alert error:', err)
  }
}

/**
 * Plays a double-ding / urgent buzzer (D5 -> A5) for kitchen display arrival.
 */
export function playKitchenAlert(): void {
  if (isAudioMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // First pulse
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(587.33, now) // D5
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.03)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.32)

    // Second pulse
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(880, now + 0.18) // A5
    gain2.gain.setValueAtTime(0, now + 0.18)
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.21)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.18)
    osc2.stop(now + 0.6)
  } catch (err) {
    console.warn('Kitchen alert error:', err)
  }
}

/**
 * Plays a low-tone warning for stock alerts.
 */
export function playStockAlert(): void {
  if (isAudioMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.45)
  } catch (err) {
    console.warn('Stock alert error:', err)
  }
}

/**
 * Plays an attention-grabbing arrival doorbell (E5 -> G#5 -> B5) when a takeaway
 * customer taps "I'm at the Counter" to pick up their food.
 */
export function playCustomerArrivedAlert(): void {
  if (isAudioMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [659.25, 830.61, 987.77] // E5, G#5, B5 chime

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const startTime = now + idx * 0.12

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + 0.5)
    })
  } catch (err) {
    console.warn('Customer arrived alert error:', err)
  }
}
