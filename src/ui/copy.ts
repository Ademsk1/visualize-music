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
  /** Journey: lock orbit so the view looks along the wire path. */
  hudCameraAlignWire: 'Align view with path',
  /** Favor slurred/legato notes (e.g. piano with sustain) in note detection. */
  hudSustainMode: 'Sustain / legato sensitivity',
} as const

/** First-run and “?” help dialog (not used for in-app error strings). */
export const helpModal = {
  title: 'About visualize-music',
  ok: 'OK',
  helpButtonAria: 'Open help: overview and how the controls work',
  pWhat1:
    'visualize-music is a small browser app that runs in this window: it listens to your microphone and drives a 3D scene in real time. The goal is mood, colour, and movement that feel connected to your playing, not a tuner or score-reader—polyphony and dense chords are harder for analysis; single lines and clear phrases work best.',
  pHow1:
    'You grant mic access, then the app runs audio analysis in the background (level, tonality, pitch classes). A Three.js view reacts while you play: a calm idle scene before you go live, and a forward “journey” with notes and colour when you are listening. Audio stays in your browser.',
  pHud1: 'The bottom bar, from left to right:',
  items: [
    {
      name: 'Status and tagline',
      text:
        'When idle, you see a short line about what the app is for. In live mode, a brief status and (when the engine is running) a live level meter and rough pitch-class readout.',
    },
    {
      name: 'Input level (Min. level dBFS)',
      text:
        'Trades off sensitivity vs noise. Lower numbers pick up softer sounds; higher numbers need a louder input before notes are considered.',
    },
    {
      name: 'Radial mapping',
      text:
        'Puts detected pitch classes around a circle: even chromatic spacing, or a golden-angle spread so neighbours don’t all sit together.',
    },
    {
      name: 'Travel speed',
      text:
        'How fast the journey path moves in 3D while you are listening. Slow for calmer motion, fast for a busier run.',
    },
    {
      name: 'Align view with path',
      text:
        'Orbits the camera to look along the wire of the path instead of freely tumbling. Zoom still works; rotation follows the path.',
    },
    {
      name: 'Sustain / legato sensitivity',
      text:
        'Favours continuing the same note when the signal is a bit smeared, e.g. piano with sustain, so the graph does not re-trigger every partial.',
    },
    {
      name: 'A4 reference (Hz)',
      text:
        'Shifts how pitch class labels (C, D, …) are named for your hearing or tuning. It does not re-tune the audio—only the labels in the readout.',
    },
    {
      name: 'Start / Stop (primary button)',
      text:
        'Asks for the microphone, starts live analysis, or stops and tears down the audio path. Your browser may resume the audio context after a gesture—use the button or Space as indicated.',
    },
  ],
  pKbd1:
    'Shortcuts: Space to start or stop, Tab to move between skip link, this bar, and the 3D area, and click the stage to focus the canvas. Use the ? button to reopen this panel anytime.',
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
