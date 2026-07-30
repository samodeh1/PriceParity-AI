import React from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '601384251709-ft9c1s2pjivg84ih1vr123umn9f2efu4.apps.googleusercontent.com';

if (!clientId) {
  console.error("VITE_GOOGLE_CLIENT_ID is missing from your .env file!");
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)

