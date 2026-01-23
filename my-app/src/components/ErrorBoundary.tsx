"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full items-center justify-center flex-col gap-4 bg-black text-white p-6">
          <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-2">
             <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-500">Something went wrong</h2>
          <p className="text-zinc-400 text-center max-w-md">
            {this.state.error?.message || "An unexpected error occurred while rendering this component."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium border border-zinc-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
