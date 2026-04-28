const PC_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

function pcName(pc: number): string {
  const i = Math.max(0, Math.min(11, Math.round(pc)))
  return PC_NAMES[i] ?? '—'
}

/**
 * One line for HUD: poly candidates or monophonic hint; "—" when nothing useful.
 */
export function formatNoteReadout(
  f: {
    readonly polyPitchClasses?: ReadonlyArray<{
      readonly pc: number
      readonly conf: number
    }> | null
    readonly pitchClassHint?: number
    readonly pitchClassConf?: number
  },
  opts: { readonly minPolyConf?: number; readonly minHintConf?: number } = {}
): string {
  const minP = opts.minPolyConf ?? 0.2
  const minH = opts.minHintConf ?? 0.28
  if (f.polyPitchClasses && f.polyPitchClasses.length > 0) {
    const parts: string[] = []
    for (const p of f.polyPitchClasses) {
      if ((p.conf ?? 0) < minP) continue
      parts.push(pcName(p.pc))
    }
    if (parts.length) return parts.join(' · ')
  }
  if (
    f.pitchClassHint != null &&
    f.pitchClassConf != null &&
    f.pitchClassConf >= minH
  ) {
    return pcName(f.pitchClassHint)
  }
  return '—'
}
