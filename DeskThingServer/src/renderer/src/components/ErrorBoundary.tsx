// src/components/ErrorBoundary.tsx

import { Component, ReactNode, ErrorInfo } from 'react'
import Button from './Button'
import { IconRefresh } from '@renderer/assets/icons'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      hasError: true,
      error,
      errorInfo
    })
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg w-full h-full flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold">Something went wrong</h3>
          <pre className="text-sm overflow-auto max-h-[200px]">{this.state.error?.message}</pre>
          <Button
            onClick={this.resetError}
            className="group mt-4 gap-2 bg-zinc-950 hover:bg-red-700"
          >
            Try Again
            <IconRefresh className="group-hover:animate-spin" />
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
