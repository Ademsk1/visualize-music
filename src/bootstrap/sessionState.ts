export const SessionStates = {
  idle: 'idle',
  requestingPermission: 'requestingPermission',
  live: 'live',
  blocked: 'blocked',
} as const

export type SessionState = (typeof SessionStates)[keyof typeof SessionStates]
