import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // Para redirecionar de volta após o login

  if (isLoading) {
    // Mostra carregando enquanto verifica o estado de autenticação inicial
    return <div>Verificando autenticação...</div>;
  }

  if (!isAuthenticated) {
    // Se não estiver autenticado, redireciona para /login
    // Passa a localização atual para que possamos redirecionar de volta após o login (opcional)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo da rota aninhada
  // Outlet é usado aqui se você estiver usando PrivateRoute para layout aninhado
  // Se você passar o componente como `element` na definição da rota, pode retornar `children` (se passado)
  // Para a forma mais comum com v6, retornar <Outlet /> é apropriado se a rota é definida como:
  // <Route element={<PrivateRoute />}> <Route path="/dashboard" element={<Dashboard />} /> </Route>
  // Ou, se definida como <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />, retorne `children`.
  // Uma forma mais simples para rotas únicas é passar o elemento diretamente: 
  // <Route path="/dashboard" element={<PrivateRoute element={<DashboardPage />} />} />
  // E neste caso, o PrivateRoute retornaria o `element` recebido como prop.
  
  // Vamos usar a abordagem com <Outlet /> que é flexível para rotas aninhadas
  return <Outlet />;
}

// Abordagem alternativa passando o componente como prop 'element'
/*
function PrivateRoute({ element: ElementComponent }) { 
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Verificando autenticação...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return ElementComponent;
}
*/

export default PrivateRoute; 