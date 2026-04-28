import { useCallback, useEffect, useRef, useState } from 'react'
import { SessionStates, type SessionState } from './bootstrap/sessionState'
import {
  readFeatureFrame,
  resetFeatureSmoothing,
  setFeatureReducedMotion,
  stubFeatureFrame,
} from './audio/features'
import { createAudioGraph, type AudioGraph } from './audio/createAudioGraph'
import type { SceneController } from './scene/SceneController'
import { NoteGraphModel } from './graph/noteGraphState'
import { CHROMA_SIZE } from './audio/chroma'
import { HudBar, type EngineStatus } from './ui/HudBar'
import { copy, micErrorMessage } from './ui/copy'
import {
  resetDocumentTitleToDefault,
  syncDocumentTitle,
} from './ui/documentTitle'
import './App.css'

/** dBFS; lower = more sensitive (picks up quieter sounds). */
const DEFAULT_MIN_LEVEL_DB = -42

function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<AudioGraph | null>(null)
  const noteGraphRef = useRef(new NoteGraphModel())
  const chromaRef = useRef(new Float32Array(CHROMA_SIZE))
  const sceneRef = useRef<SceneController | null>(null)
  const rafRef = useRef(0)
  const frameIdRef = useRef(0)
  const roRef = useRef<ResizeObserver | null>(null)
  const stateUnsubRef = useRef<(() => void) | null>(null)
  const mountRef = useRef({ cancelled: false })
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('loading')
  const [engineErrorMessage, setEngineErrorMessage] = useState<string | null>(
    null
  )
  const [session, setSession] = useState<SessionState>(SessionStates.idle)
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const [audioSuspended, setAudioSuspended] = useState(false)
  const [minLevelDb, setMinLevelDb] = useState(DEFAULT_MIN_LEVEL_DB)
  const minLevelDbRef = useRef(minLevelDb)
  const reducedMotionRef = useRef(false)
  useEffect(() => {
    minLevelDbRef.current = minLevelDb
  }, [minLevelDb])

  useEffect(() => {
    syncDocumentTitle(engineStatus, session, audioSuspended)
  }, [engineStatus, session, audioSuspended])

  useEffect(() => {
    return () => {
      resetDocumentTitleToDefault()
    }
  }, [])

  const tearDownGraph = useCallback(() => {
    stateUnsubRef.current?.()
    stateUnsubRef.current = null
    graphRef.current?.dispose()
    graphRef.current = null
    noteGraphRef.current.reset()
    resetFeatureSmoothing()
    setAudioSuspended(false)
  }, [])

  useEffect(() => {
    const mq = globalThis.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      setFeatureReducedMotion(mq.matches)
      reducedMotionRef.current = mq.matches
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const g = graphRef.current
      if (g?.context.state === 'suspended') {
        void g.context.resume()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const mount = mountRef.current
    mount.cancelled = false

    void import('./scene/SceneController')
      .then((mod) => {
        if (mount.cancelled) return
        let scene: InstanceType<typeof mod.SceneController>
        try {
          scene = new mod.SceneController(el, {
            onContextLost: () => {
              if (mount.cancelled) return
              mount.cancelled = true
              cancelAnimationFrame(rafRef.current)
              tearDownGraph()
              setSession(SessionStates.idle)
              setEngineErrorMessage(copy.errorWebGlLost)
              setEngineStatus('error')
              roRef.current?.disconnect()
              roRef.current = null
              try {
                scene.dispose()
              } catch {
                /* context may already be invalid */
              }
              sceneRef.current = null
            },
          })
        } catch {
          setEngineErrorMessage(copy.errorWebGlInit)
          setEngineStatus('error')
          return
        }
        sceneRef.current = scene
        setEngineErrorMessage(null)
        setEngineStatus('ready')
        const ro = new ResizeObserver(() => {
          if (!hostRef.current) return
          const { clientWidth, clientHeight } = hostRef.current
          scene.setSize(clientWidth, clientHeight)
        })
        roRef.current = ro
        ro.observe(el)

        const loop = () => {
          if (mount.cancelled) return
          const t = frameIdRef.current++
          const graph = graphRef.current
          const s = sceneRef.current
          if (!s) {
            rafRef.current = requestAnimationFrame(loop)
            return
          }
          if (graph) {
            const { frame, rms } = readFeatureFrame(
              graph.analyser,
              t,
              chromaRef.current
            )
            const snap = noteGraphRef.current.update(
              performance.now() * 0.001,
              chromaRef.current,
              rms,
              minLevelDbRef.current,
              { reducedMotion: reducedMotionRef.current }
            )
            s.applyViz(frame, snap, { live: true })
            s.render()
          } else {
            const { frame } = stubFeatureFrame(t)
            s.applyViz(frame, null, { live: false })
            s.render()
          }
          rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
      })
      .catch(() => {
        if (mount.cancelled) return
        setEngineErrorMessage(copy.errorSceneLoad)
        setEngineStatus('error')
      })

    return () => {
      mount.cancelled = true
      cancelAnimationFrame(rafRef.current)
      roRef.current?.disconnect()
      roRef.current = null
      tearDownGraph()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [tearDownGraph])

  const handleControl = useCallback(async () => {
    if (engineStatus !== 'ready') return

    const g = graphRef.current
    if (g?.context.state === 'suspended') {
      void g.context.resume()
      return
    }
    if (session === SessionStates.live && g) {
      tearDownGraph()
      setSession(SessionStates.idle)
      return
    }
    if (session === SessionStates.requestingPermission) return

    setSession(SessionStates.requestingPermission)
    setBlockedMessage(null)
    try {
      tearDownGraph()
      const graph = await createAudioGraph()
      graphRef.current = graph
      const onState = () => {
        setAudioSuspended(graph.context.state === 'suspended')
      }
      graph.context.addEventListener('statechange', onState)
      onState()
      stateUnsubRef.current = () => {
        graph.context.removeEventListener('statechange', onState)
      }
      setSession(SessionStates.live)
    } catch (e) {
      setSession(SessionStates.blocked)
      setBlockedMessage(micErrorMessage(e))
    }
  }, [engineStatus, session, tearDownGraph])

  const controlRef = useRef(handleControl)
  useEffect(() => {
    controlRef.current = handleControl
  }, [handleControl])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      const t = e.target
      if (
        t instanceof globalThis.HTMLElement &&
        t.closest('input, textarea, [contenteditable="true"]')
      ) {
        return
      }
      e.preventDefault()
      void controlRef.current()
    }
    globalThis.addEventListener('keydown', onKey, { passive: false })
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app-root">
      <a className="skip-link" href="#main-stage">
        {copy.skipToViz}
      </a>
      <main
        id="main-stage"
        className="stage-host"
        ref={hostRef}
        aria-label="3D music visualization, animated from microphone level and tone"
        tabIndex={0}
      />
      <HudBar
        session={session}
        engineStatus={engineStatus}
        engineErrorMessage={engineErrorMessage ?? undefined}
        audioSuspended={audioSuspended}
        blockedMessage={blockedMessage ?? undefined}
        onControl={handleControl}
        minLevelDb={minLevelDb}
        onMinLevelDb={setMinLevelDb}
        showLevelSlider={engineStatus === 'ready'}
      />
    </div>
  )
}

export default App
