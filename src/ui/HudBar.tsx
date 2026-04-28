import { useId } from 'react'
import { copy } from './copy'
import { SessionStates, type SessionState } from '../bootstrap/sessionState'

export type EngineStatus = 'loading' | 'ready' | 'error'

type Props = {
  readonly session: SessionState
  readonly engineStatus: EngineStatus
  readonly engineErrorMessage?: string
  readonly audioSuspended?: boolean
  readonly blockedMessage?: string
  readonly onControl: () => void
  /** dBFS noise gate; only when level slider is shown. */
  readonly minLevelDb?: number
  readonly onMinLevelDb?: (value: number) => void
  readonly showLevelSlider?: boolean
  readonly angularPlacementMode?: 'even' | 'golden'
  readonly onAngularPlacementMode?: (mode: 'even' | 'golden') => void
  readonly journeySpeed?: number
  readonly onJourneySpeed?: (value: number) => void
  /** Lock camera to look along the wire (live journey). */
  readonly cameraAlignToWire?: boolean
  readonly onCameraAlignToWire?: (value: boolean) => void
  /** Better detection of slurred notes (piano with sustain). */
  readonly sustainMode?: boolean
  readonly onSustainMode?: (value: boolean) => void
  /** Equal-temperament A4 (Hz) for pitch-class labels; 400–480. */
  readonly tuningA4Hz?: number
  readonly onTuningA4Hz?: (value: number) => void
  readonly showTuningSlider?: boolean
  /** Throttled snapshot when live: level 0–1 + note line (not at rAF rate). */
  readonly liveAudioReadout?: { readonly level: number; readonly notesLine: string } | null
}

function statusCue(
  engine: EngineStatus,
  s: SessionState,
  livePaused: boolean
): { readonly icon: string; readonly text: string } {
  if (engine === 'loading') return { icon: '…', text: copy.statusLoading }
  if (s === SessionStates.live) {
    return livePaused
      ? { icon: '⏸', text: copy.statusAudioPaused }
      : { icon: '●', text: copy.statusLive }
  }
  if (s === SessionStates.blocked)
    return { icon: '⛔', text: copy.statusBlocked }
  if (s === SessionStates.requestingPermission) {
    return { icon: '🔒', text: copy.statusRequestingAccess }
  }
  return { icon: '○', text: copy.statusIdle }
}

export function HudBar({
  session,
  engineStatus,
  engineErrorMessage,
  audioSuspended = false,
  blockedMessage,
  onControl,
  minLevelDb = -42,
  onMinLevelDb,
  showLevelSlider = false,
  angularPlacementMode = 'even',
  onAngularPlacementMode,
  journeySpeed = 0.68,
  onJourneySpeed,
  cameraAlignToWire = false,
  onCameraAlignToWire,
  sustainMode = false,
  onSustainMode,
  tuningA4Hz = 440,
  onTuningA4Hz,
  showTuningSlider = false,
  liveAudioReadout = null,
}: Props) {
  const tuningHintId = useId()
  if (engineStatus === 'error') {
    return (
      <section className="hud" aria-label="Error">
        <div className="hud-main">
          <p className="hud-hint hud-hint--error">
            {engineErrorMessage ?? copy.errorSceneLoad}
          </p>
          <button
            type="button"
            className="hud-cta"
            onClick={() => {
              globalThis.location.reload()
            }}
          >
            {copy.refreshPage}
          </button>
        </div>
      </section>
    )
  }

  const livePaused = session === SessionStates.live && audioSuspended
  const liveRunning = session === SessionStates.live && !audioSuspended
  let cta: string
  if (livePaused) cta = copy.resumeAudio
  else if (liveRunning) cta = copy.stopListening
  else cta = copy.startListening
  const ctaClass = liveRunning ? 'hud-cta hud-cta--stop' : 'hud-cta'
  const cue = statusCue(engineStatus, session, livePaused)
  const announcement =
    session === SessionStates.blocked && blockedMessage
      ? `Blocked. ${blockedMessage}`
      : cue.text

  return (
    <section className="hud" aria-label="Player controls">
      <div className="hud-main">
      <div className="hud-left">
        <span className="hud-status" aria-live="polite" aria-atomic="true">
          <span className="hud-status-icon" aria-hidden>
            {cue.icon}
          </span>{' '}
          {cue.text}
        </span>
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </span>
        {engineStatus === 'ready' && session === SessionStates.idle && (
          <p className="hud-tagline">{copy.taglineIdle}</p>
        )}
        {engineStatus === 'ready' &&
          session === SessionStates.live &&
          liveAudioReadout && (
            <div
              className="hud-live"
              role="group"
              aria-label="Live audio readout, updated a few times per second"
            >
              <div className="hud-live-row">
                <span className="hud-live-label">{copy.hudInputLevel}</span>
                <div
                  className="hud-meter"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(
                    Math.max(0, Math.min(1, liveAudioReadout.level)) * 100
                  )}
                >
                  <div
                    className="hud-meter-fill"
                    style={{
                      width: `${Math.max(0, Math.min(1, liveAudioReadout.level)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <p className="hud-notes" role="status" aria-live="polite">
                <span className="hud-live-label">{copy.hudDetectedNotes}</span>{' '}
                <span className="hud-notes-value">{liveAudioReadout.notesLine}</span>
              </p>
            </div>
          )}
        {(showLevelSlider && onMinLevelDb) ||
        onAngularPlacementMode ||
        onJourneySpeed ||
        onCameraAlignToWire ||
        onSustainMode ||
        (showTuningSlider && onTuningA4Hz) ? (
          <div className="hud-controls">
            {showLevelSlider && onMinLevelDb && (
              <label className="hud-level">
                <span className="hud-level-label">Min. level (dBFS)</span>
                <input
                  type="range"
                  className="hud-level-range"
                  min={-58}
                  max={-18}
                  step={1}
                  value={minLevelDb}
                  onChange={(e) => onMinLevelDb(Number(e.target.value))}
                  aria-valuemin={-58}
                  aria-valuemax={-18}
                  aria-valuenow={minLevelDb}
                />
                <span className="hud-level-value" aria-hidden>
                  {minLevelDb}
                </span>
              </label>
            )}
            {onAngularPlacementMode && (
              <label className="hud-level">
                <span className="hud-level-label">Radial mapping</span>
                <select
                  className="hud-select"
                  value={angularPlacementMode}
                  onChange={(e) =>
                    onAngularPlacementMode(e.target.value as 'even' | 'golden')
                  }
                >
                  <option value="even">Even (chromatic)</option>
                  <option value="golden">Golden ratio</option>
                </select>
              </label>
            )}
            {onJourneySpeed && (
              <label className="hud-level">
                <span className="hud-level-label">Travel speed</span>
            <input
              type="range"
              className="hud-level-range"
              min={0.05}
              max={2.85}
              step={0.01}
              value={journeySpeed}
              onChange={(e) => onJourneySpeed(Number(e.target.value))}
              aria-valuemin={0.05}
              aria-valuemax={2.85}
              aria-valuenow={journeySpeed}
            />
                <span className="hud-level-value" aria-hidden>
                  {journeySpeed.toFixed(2)}
                </span>
              </label>
            )}
            {onCameraAlignToWire && (
              <label className="hud-level hud-level--check">
                <input
                  type="checkbox"
                  className="hud-check"
                  checked={cameraAlignToWire}
                  onChange={(e) => onCameraAlignToWire(e.target.checked)}
                />
                <span className="hud-level-label">{copy.hudCameraAlignWire}</span>
              </label>
            )}
            {onSustainMode && (
              <label className="hud-level hud-level--check">
                <input
                  type="checkbox"
                  className="hud-check"
                  checked={sustainMode}
                  onChange={(e) => onSustainMode(e.target.checked)}
                />
                <span className="hud-level-label">{copy.hudSustainMode}</span>
              </label>
            )}
            {showTuningSlider && onTuningA4Hz && (
              <div
                className="hud-tuning"
                role="group"
                aria-label={copy.hudTuningA4}
              >
                <p className="hud-tuning-hint" id={tuningHintId}>
                  {copy.hudTuningHint}
                </p>
                <label className="hud-level">
                  <span className="hud-level-label">{copy.hudTuningA4}</span>
                  <input
                    type="range"
                    className="hud-level-range"
                    min={400}
                    max={480}
                    step={0.5}
                    value={tuningA4Hz}
                    onChange={(e) => onTuningA4Hz(Number(e.target.value))}
                    aria-valuemin={400}
                    aria-valuemax={480}
                    aria-valuenow={tuningA4Hz}
                    aria-describedby={tuningHintId}
                  />
                  <span className="hud-level-value" aria-hidden>
                    {tuningA4Hz % 1 === 0
                      ? tuningA4Hz
                      : tuningA4Hz.toFixed(1)}
                  </span>
                </label>
              </div>
            )}
          </div>
        ) : null}
        {session === SessionStates.blocked && blockedMessage && (
          <p className="hud-hint" role="status">
            {blockedMessage}
          </p>
        )}
      </div>
      <button
        type="button"
        className={ctaClass}
        onClick={onControl}
        disabled={engineStatus === 'loading'}
        aria-busy={engineStatus === 'loading'}
      >
        {cta}
      </button>
      </div>
      <div
        className="hud-kbd"
        role="group"
        aria-label={copy.hudKeyboardRegionLabel}
      >
        <p className="hud-kbd-line">
          <kbd className="hud-kbd-key">Space</kbd>
          <span className="hud-kbd-mid" aria-hidden>
            —
          </span>
          <span className="hud-kbd-action">{copy.hudKbdSpaceAction}</span>
          <span className="hud-kbd-sep" aria-hidden>
            ·
          </span>
          <kbd className="hud-kbd-key">Tab</kbd>
          <span className="hud-kbd-mid" aria-hidden>
            —
          </span>
          <span className="hud-kbd-action">{copy.hudKbdTabAction}</span>
          <span className="hud-kbd-sep" aria-hidden>
            ·
          </span>
          <span className="hud-kbd-action">{copy.hudKbdStageAction}</span>
        </p>
      </div>
    </section>
  )
}
