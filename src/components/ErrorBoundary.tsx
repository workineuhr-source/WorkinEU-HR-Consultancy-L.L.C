import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          errorMessage = parsed.error || this.state.error.message;
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-brand-blue mb-4">Something went wrong</h2>
            <p className="text-gray-500 mb-8">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-brand-gold transition-all shadow-lg"
            >
              <RefreshCw size={20} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
