// src/components/ErrorBoundary.tsx

import { Component, ReactNode, ErrorInfo } from 'react'
import Button from './Button'
import { IconRefresh } from '@renderer/assets/icons'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  attempt?: number
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, attempt: -1 }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState((prevState) => ({
      hasError: true,
      error,
      attempt: (prevState.attempt ?? -1) + 1,
      errorInfo
    }))
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    })
  }

  componentDidUpdate(_prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState): void {
    if (prevState.hasError && !this.state.hasError) {
      this.setState({ attempt: -1 })
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg w-full h-full flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold">Something went wrong</h3>
          <pre className="text-sm overflow-auto max-h-[200px]">{this.state.error?.message}</pre>
          <Button
            onClick={
              (this.state.attempt || 0) >= 3
                ? (): void => window.location.reload()
                : this.resetError
            }
            className="group mt-4 gap-2 bg-zinc-950 hover:bg-red-700"
          >
            Try Again
            <IconRefresh className="group-hover:animate-spin" />
          </Button>
          {(this.state.attempt || 0) > 0 && (
            <p className="text-sm text-gray-500">Attempt {this.state.attempt}</p>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
