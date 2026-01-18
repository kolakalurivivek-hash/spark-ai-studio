import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep this lightweight; helps debug "blank screen" situations.
    console.error("App crashed:", error);
    console.error("Component stack:", info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="glass rounded-2xl p-6 max-w-lg w-full">
            <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The app hit an unexpected error. You can try reloading the UI without losing your saved API key.
            </p>
            <pre className="mt-4 text-xs whitespace-pre-wrap text-muted-foreground/80">
              {this.state.error?.message}
            </pre>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Recover
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-muted text-foreground hover:bg-muted/80"
              >
                Reload
              </a>
            </div>
          </div>
        </div>
      )
    );
  }
}
