/** User-facing strings (UX: plain, recoverable) */
export const copy = {
  startListening: 'Start listening',
  stopListening: 'Stop',
  resumeAudio: 'Resume',
  statusIdle: 'Ready',
  /** Light piano-first framing; keeps scope honest per product brief. */
  taglineIdle:
    'Piano-leaning, mood-first. Audio stays in your browser. Space: start or stop when the stage is ready.',
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
