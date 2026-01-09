import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Wrap in try-catch for better error visibility
const root = ReactDOM.createRoot(document.getElementById('root'));

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render App:', error);
  root.render(
    <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#c33' }}>Error Loading Application</h1>
      <p style={{ color: '#666' }}>{error.message}</p>
      <details style={{ marginTop: '1rem', textAlign: 'left', maxWidth: '800px', margin: '1rem auto' }}>
        <summary style={{ cursor: 'pointer', color: '#667eea' }}>Error Details</summary>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '1rem', 
          overflow: 'auto',
          fontSize: '0.9rem',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          {error.stack || error.toString()}
        </pre>
      </details>
    </div>
  );
}

