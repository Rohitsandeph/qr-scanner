import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>QR Scanner</h1>
          <span className="role-badge">{user.role}</span>
        </div>
        <div className="dashboard-header-right">
          <span className="username">{user.username}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Welcome, {user.first_name || user.username}</h2>

        <div className="dashboard-cards">
          <div className="dashboard-card" onClick={() => navigate('/scan')}>
            <div className="card-icon">&#128247;</div>
            <h3>Scan QR Codes</h3>
            <p>Scan and match QR codes</p>
          </div>

          {(user.role === 'admin' || user.role === 'generator') && (
            <div className="dashboard-card" onClick={() => navigate('/generate')}>
              <div className="card-icon">&#9881;</div>
              <h3>Generate QR Codes</h3>
              <p>Create and print QR codes</p>
            </div>
          )}

{user.role === 'admin' && (
            <div className="dashboard-card" onClick={() => navigate('/users')}>
              <div className="card-icon">&#128101;</div>
              <h3>Manage Users</h3>
              <p>Create, edit, deactivate users</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
