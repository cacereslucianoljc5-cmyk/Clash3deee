import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MeshyGenerator from './MeshyGenerator.jsx'

/* Enrutado mínimo por hash:
     #meshy  -> generador 3D con Meshy AI
     resto   -> landing de Siege Kingdoms */
function Root() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const isMeshy = hash.replace(/^#\/?/, '').toLowerCase() === 'meshy'
  return isMeshy ? <MeshyGenerator /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
