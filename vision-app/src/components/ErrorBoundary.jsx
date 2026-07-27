import React from 'react';
import { Button, Panel } from './UI.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-full items-center justify-center p-8">
          <Panel padded className="max-w-lg">
            <p className="type-overline">Something went wrong</p>
            <h1 className="mt-2 font-display text-title-lg text-ink">Unexpected application error</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {this.state.error.message || 'Please reload and try again.'}
            </p>
            <Button
              className="mt-5"
              variant="primary"
              onClick={() => {
                this.setState({ error: null });
                window.location.assign('/');
              }}
            >
              Reload Vision
            </Button>
          </Panel>
        </div>
      );
    }
    return this.props.children;
  }
}
