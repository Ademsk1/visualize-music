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
  if (s === SessionStates.blocked) return { icon: '⛔', text: 'Blocked' }
  if (s === SessionStates.requestingPermission) {
    return { icon: '🔒', text: 'Requesting access…' }
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
  journeySpeed = 0.55,
  onJourneySpeed,
}: Props) {
  if (engineStatus === 'error') {
    return (
      <section className="hud" aria-label="Error">
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
              max={2}
              step={0.01}
              value={journeySpeed}
              onChange={(e) => onJourneySpeed(Number(e.target.value))}
              aria-valuemin={0.05}
              aria-valuemax={2}
              aria-valuenow={journeySpeed}
            />
            <span className="hud-level-value" aria-hidden>
              {journeySpeed.toFixed(2)}
            </span>
          </label>
        )}
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
    </section>
  )
}
