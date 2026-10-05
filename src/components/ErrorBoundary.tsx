import { Component, type ReactNode } from 'react'

// Shows a friendly screen instead of a blank page if something unexpected breaks.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: unknown) { console.error('App error:', error) }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F4EF', color: '#111', padding: 24, textAlign: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 28, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 18px', color: '#6f6a62' }}>Please reload the page. If it keeps happening, message us on WhatsApp.</p>
          <button onClick={() => window.location.reload()} style={{ minHeight: 46, padding: '0 24px', border: '1px solid #111', background: '#111', color: '#F7F4EF', letterSpacing: '.2em', textTransform: 'uppercase', fontSize: 12, cursor: 'pointer' }}>Reload</button>
        </div>
      </div>
    )
  }
}
