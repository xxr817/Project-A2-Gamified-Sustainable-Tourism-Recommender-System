import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import './index.css'

// AuthProvider 必须包在 BrowserRouter 里面、App 外面 —
// 这样所有页面 (包括路由切换时新挂载的页面) 都能用 useAuth() 拿到用户状态。
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
