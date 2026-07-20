import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime, getInitials } from '@/lib/utils';
import type { User } from '@/types';
import { Plus, Edit2, Trash2, X, Search, UserCheck, UserX } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 };

export default function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', username: '', password: '', roleId: '' });
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch roles for the form dropdown
  useEffect(() => {
    if (!token) return;
    // The users API returns users with their roles; extract unique roles from them
    // Alternatively, we can hardcode the known roles from constants
    // Since there's no dedicated /api/roles endpoint, extract from users or use constants
    import('@/lib/constants').then(({ ROLES }) => {
      setRoles(ROLES.map((r) => ({ id: r.id, name: r.name })));
    });
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role?.name?.toLowerCase().includes(q);
  });

  const openAdd = () => { setEditUser(null); setForm({ fullName: '', email: '', username: '', password: '', roleId: roles[0]?.id || '' }); setShowForm(true); };
  const openEdit = (u: User) => { setEditUser(u); setForm({ fullName: u.fullName, email: u.email, username: u.username, password: '', roleId: u.role?.id || '' }); setShowForm(true); };

  const saveUser = async () => {
    if (!token) return;
    try {
      if (editUser) {
        const res = await fetch(`${API_URL}/api/users/${editUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fullName: form.fullName, email: form.email, roleId: form.roleId, isActive: editUser.isActive }),
        });
        if (res.ok) {
          toast.success('User updated successfully');
          await fetchUsers();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to update user');
        }
      } else {
        const res = await fetch(`${API_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fullName: form.fullName, email: form.email, username: form.username, password: form.password || 'changeme123', roleId: form.roleId }),
        });
        if (res.ok) {
          toast.success('User added successfully');
          await fetchUsers();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error || 'Failed to create user');
        }
      }
    } catch {
      toast.error('Network error');
    }
    setShowForm(false);
  };

  const toggleActive = async (id: string) => {
    if (!token) return;
    const user = users.find((u) => u.id === id);
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        toast.info(user.isActive ? 'User deactivated' : 'User activated');
        await fetchUsers();
      }
    } catch {
      toast.error('Network error');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete user?')) return;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('User deleted');
        await fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>User Management</h2>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #008793, #004D7A)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." style={{ ...inputStyle, paddingLeft: 40 }} />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading users...</div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map((user) => (
          <div key={user.id} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '20px', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-card)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #008793, #004D7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>{getInitials(user.fullName)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{user.fullName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: user.isActive ? '#10B981' : '#EF4444' }} />
                <span style={{ fontSize: 11, color: user.isActive ? '#10B981' : '#EF4444' }}>{user.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Role</div>
                <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 500 }}>{user.role?.name || '—'}</div>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Last Login</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(user)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}><Edit2 size={13} /> Edit</button>
              <button onClick={() => toggleActive(user.id)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: user.isActive ? '#F59E0B' : '#10B981' }}>{user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}</button>
              <button onClick={() => deleteUser(user.id)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No users found</div>
        )}
      </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in" style={{ background: 'var(--bg-secondary)', borderRadius: 16, width: 420, padding: 28, border: '1px solid var(--border-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{editUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Full Name</label><input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Email</label><input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} style={inputStyle} /></div>
              {!editUser && <div><label style={labelStyle}>Username</label><input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} style={inputStyle} /></div>}
              {!editUser && <div><label style={labelStyle}>Password</label><input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} style={inputStyle} placeholder="Default: changeme123" /></div>}
              <div><label style={labelStyle}>Role</label><select value={form.roleId} onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveUser} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{editUser ? 'Update' : 'Add User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
