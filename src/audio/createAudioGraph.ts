/**
 * Web Audio: mic stream → AnalyserNode (no output to destination).
 */
export type AudioGraph = {
  readonly context: AudioContext
  readonly stream: MediaStream
  readonly analyser: AnalyserNode
  dispose: () => void
}

export async function createAudioGraph(): Promise<AudioGraph> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
    video: false,
  })

  const context = new AudioContext()
  if (context.state === 'suspended') {
    await context.resume()
  }

  const source = context.createMediaStreamSource(stream)
  const analyser = context.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.7
  source.connect(analyser)

  return {
    context,
    stream,
    analyser,
    dispose: () => {
      source.disconnect()
      analyser.disconnect()
      stream.getTracks().forEach((track) => track.stop())
      void context.close()
    },
  }
}
