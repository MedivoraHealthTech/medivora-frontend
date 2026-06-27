import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'

new BrowserAgent({
  init: {
    distributed_tracing: { enabled: true },
    privacy:             { cookies_enabled: true },
    ajax:                { deny_list: ['bam.nr-data.net'] },
  },
  info: {
    beacon:        'bam.nr-data.net',
    errorBeacon:   'bam.nr-data.net',
    licenseKey:    'NRBR-dc0a35a9f50f4276614',
    applicationID: '1306309754',
    sa:            1,
  },
  loader_config: {
    accountID:     '8131373',
    trustKey:      '8131373',
    agentID:       '1306309754',
    licenseKey:    'NRBR-dc0a35a9f50f4276614',
    applicationID: '1306309754',
  },
})

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
    <Analytics />
  </React.StrictMode>
)

