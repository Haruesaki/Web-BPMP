import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import './index.css'
import App from './App.jsx'
import { TTSProvider } from './context/TTSContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TTSProvider>
      <App />
    </TTSProvider>
  </StrictMode>,
)
