import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, UserRole } from '../types';
import { getUsers, createUser, deactivateUser, reactivateUser, deleteUser } from '../api/userApi';

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await deactivateUser(id);
      await loadUsers();
    } catch {
      setError('Failed to deactivate user.');
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await reactivateUser(id);
      await loadUsers();
    } catch {
      setError('Failed to reactivate user.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(id);
      await loadUsers();
    } catch {
      setError('Failed to delete user.');
    }
  };

  return (
    <div className="user-management">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>&#8592; Back</button>
        <h1>User Management</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="user-actions">
        <button className="create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {showCreateForm && (
        <CreateUserForm
          onCreated={() => { setShowCreateForm(false); loadUsers(); }}
          onError={setError}
        />
      )}

      {loading ? (
        <p className="loading-text">Loading users...</p>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={!u.is_active ? 'inactive-row' : ''}>
                  <td>{u.username}</td>
                  <td>{u.first_name} {u.last_name}</td>
                  <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td className="action-cell">
                    {u.is_active ? (
                      <button className="btn-deactivate" onClick={() => handleDeactivate(u.id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="btn-reactivate" onClick={() => handleReactivate(u.id)}>
                        Reactivate
                      </button>
                    )}
                    <button className="btn-delete" onClick={() => handleDelete(u.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateUserForm({ onCreated, onError }: { onCreated: () => void; onError: (msg: string) => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('scanner');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        password,
      });
      onCreated();
    } catch {
      onError('Failed to create user. Username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-user-form" onSubmit={handleSubmit}>
      <h3>Create New User</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>First Name</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="scanner">Scanner</option>
            <option value="generator">Generator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
      </div>
      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
