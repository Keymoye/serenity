"use client";

import React from 'react';

interface Props { children: React.ReactNode }

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p>Something went wrong. Please try again.</p>
          <button onClick={this.reset} className="mt-3 inline-flex rounded bg-white px-3 py-1 text-sm">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
