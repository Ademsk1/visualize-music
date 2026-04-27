import { Component, type ErrorInfo, type ReactNode } from 'react'
import { copy } from './copy'
import './ErrorBoundary.css'

type Props = { readonly children: ReactNode }
type State = { readonly hasError: boolean }

/**
 * Catches render errors in descendants; recovery is a full page reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary', error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback" role="alert" aria-live="assertive">
          <p className="error-fallback__text">{copy.errorRender}</p>
          <button
            type="button"
            className="error-fallback__btn"
            onClick={() => {
              globalThis.location.reload()
            }}
          >
            {copy.refreshPage}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
