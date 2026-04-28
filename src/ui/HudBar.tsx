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
}

function lineStatus(
  engine: EngineStatus,
  s: SessionState,
  livePaused: boolean
): string {
  if (engine === 'loading') return copy.statusLoading
  if (s === SessionStates.live) {
    return livePaused ? copy.statusAudioPaused : copy.statusLive
  }
  if (s === SessionStates.blocked) return 'Blocked'
  if (s === SessionStates.requestingPermission) return 'Requesting access…'
  return copy.statusIdle
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

  return (
    <section className="hud" aria-label="Player controls">
      <div className="hud-left">
        <span className="hud-status" aria-live="polite">
          {lineStatus(engineStatus, session, livePaused)}
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
