/** User-facing strings (UX: plain, recoverable) */
export const copy = {
  startListening: 'Start listening',
  stopListening: 'Stop',
  resumeAudio: 'Resume',
  statusIdle: 'Ready',
  statusRequestingAccess: 'Requesting access…',
  statusBlocked: 'Blocked',
  /** Light piano-first framing; keeps scope honest per product brief. */
  taglineIdle:
    'Piano-leaning, mood-first. Audio stays in your browser — not a tuner, notation app, or judge of your playing.',
  statusAudioPaused: 'Audio paused (tap Resume)',
  statusLive: 'Live',
  statusLoading: 'Loading visuals…',
  errorSceneLoad: 'Could not load the 3D engine. Refresh the page, or check your network.',
  errorWebGlLost:
    'The graphics context was lost (often after a GPU reset or sleep). Refresh the page to continue.',
  errorWebGlInit:
    'WebGL could not start (graphics blockers, disabled GPU, or an outdated browser). Try another browser or check site settings.',
  refreshPage: 'Refresh page',
  errorMicDenied: 'Microphone access was blocked. Check browser permissions and try again.',
  errorNoInput: 'No audio input was found. Connect a mic and try again.',
  errorGeneric: 'Could not start audio. Please try again.',
  errorRender:
    'Something went wrong in the interface. Refresh the page to try again.',
  skipToViz: 'Skip to visualization',
  /** HUD: live pitch-class readout (throttled; not tuner-grade). */
  hudDetectedNotes: 'Heard (pitch classes)',
  /** HUD: envelope level meter */
  hudInputLevel: 'Input level',
  /** Map detected pitch classes to A4; not strobe tuning. */
  hudTuningA4: 'A4 reference (Hz)',
  /** Shown when engine is ready; groups tuning + other sliders. */
  hudTuningHint:
    'Maps pitch labels to this A4. Does not retune the microphone—only the note names.',
  /** Region label for the shortcut strip */
  hudKeyboardRegionLabel: 'Keyboard shortcuts',
  /** Segments for the visual shortcut strip (paired with kbd in HudBar) */
  hudKbdSpaceAction: 'Start or stop',
  hudKbdTabAction: 'Move focus (skip, controls, stage)',
  hudKbdStageAction: 'Click the stage to focus the 3D view',
} as const

export function micErrorMessage(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
      return copy.errorMicDenied
    }
    if (e.name === 'NotFoundError') {
      return copy.errorNoInput
    }
  }
  return copy.errorGeneric
}
