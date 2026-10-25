import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Jaring pengaman: error di luar React (atau saat start) tidak boleh berujung layar hitam kosong.
function showFatal(msg: string) {
  const root = document.getElementById('root')
  // Layar boot statis (#boot) tidak dihitung sebagai konten: kalau React belum menggantikannya, tampilkan galat.
  if (!root || root.querySelector(':scope > :not(#boot)')) return
  root.innerHTML =
    '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;background:#151815;color:#e6eae5;font-family:sans-serif">' +
    '<p style="font-weight:600">Life OS gagal dimulai</p>' +
    '<p style="font-size:12px;color:#8b8f93;word-break:break-word;max-width:320px"></p>' +
    '<button style="padding:10px 24px;border-radius:12px;border:0;background:#7dc7a0;color:#0f1a14;font-weight:600" onclick="location.reload()">Coba Lagi</button></div>'
  const p = root.querySelectorAll('p')[1]
  if (p) p.textContent = msg
}
window.addEventListener('error', (e) => showFatal(e.message || 'Error tidak diketahui'))
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason
  showFatal(r instanceof Error ? r.message : String(r))
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
