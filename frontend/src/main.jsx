import React from 'react'; // Importa React, StrictMode não é mais necessário
// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'; // Importa o CSS do Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // <-- ADICIONAR ESTA LINHA para importar o JS do Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css';
// import './index.css' // CSS removido
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  // <StrictMode> // Linha removida
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  // </StrictMode>, // Linha removida
)
