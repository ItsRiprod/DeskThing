import React, { ErrorInfo, ReactNode } from "react"
import ErrorScreen from "../components/ErrorScreen"; // Adjust the import path as needed

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage?: string
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo)

    // Update the state with the error message
    this.setState({ errorMessage: error.message })
  }

  render() {
    if (this.state.hasError) {
      // Pass the error message to the ErrorScreen component
      return <ErrorScreen message={this.state.errorMessage || "An unknown error occurred."} />
    }

    return this.props.children
  }
}

export default ErrorBoundary
