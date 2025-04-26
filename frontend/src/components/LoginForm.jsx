import React, { useState } from 'react';

function LoginForm({ onSubmit, isLoading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', width: '100%' }}>
      <h2 className="mb-4">Login</h2>
      <div className="mb-3">
        <label htmlFor="login-username" className="form-label">Usuário:</label>
        <input
          type="text"
          id="login-username"
          className="form-control"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="login-password" className="form-label">Senha:</label>
        <input
          type="password"
          id="login-password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-danger mt-2">{error}</p>}
      <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span className="ms-1">Entrando...</span>
          </>
        ) : (
          'Entrar'
        )}
      </button>
    </form>
  );
}

export default LoginForm; 