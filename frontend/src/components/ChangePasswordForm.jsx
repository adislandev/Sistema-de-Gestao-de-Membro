import React, { useState } from 'react';

function ChangePasswordForm({ onSubmit, isLoading, error }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError('');
    if (newPassword !== confirmPassword) {
      setLocalError('A nova senha e a confirmação não correspondem.');
      return;
    }
    if (newPassword.length < 6) { 
        setLocalError('A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }
    onSubmit({ currentPassword, newPassword });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="mb-3">Alterar Senha</h3>
      <div className="mb-3">
        <label htmlFor="current-password" className="form-label">Senha Atual:</label>
        <input
          type="password"
          id="current-password"
          className="form-control"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="new-password" className="form-label">Nova Senha:</label>
        <input
          type="password"
          id="new-password"
          className="form-control"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="confirm-password" className="form-label">Confirmar Nova Senha:</label>
        <input
          type="password"
          id="confirm-password"
          className="form-control"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {(localError || error) && (
        <p className="text-danger mt-2">{localError || error}</p>
      )}
      <button type="submit" className="btn btn-warning w-100" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span className="ms-1">Alterando...</span>
          </>
        ) : (
          'Alterar Senha'
        )}
      </button>
    </form>
  );
}

export default ChangePasswordForm; 