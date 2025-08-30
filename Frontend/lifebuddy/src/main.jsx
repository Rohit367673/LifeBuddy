import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Import the trustedTypes utility to initialize the policy before rendering
import './utils/trustedTypes'

createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  ),
)
document.documentElement.classList.add('react-mounted');
