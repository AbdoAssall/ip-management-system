import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/devices': 'Device Management',
  '/ipam': 'IP Address Management',
  '/reports': 'Reports',
  '/audit': 'Audit Logs',
  '/users': 'User Management',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const currentPage = pageTitles[location.pathname] || pageTitles[('/' + location.pathname.split('/')[1])] || 'Dashboard';

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Left - Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>PSCCHC</span>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
          {currentPage}
        </span>
      </div>

      {/* Right - Search, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: searchOpen ? 'var(--bg-input)' : 'transparent',
            borderRadius: 10,
            border: searchOpen ? '1px solid var(--border-primary)' : '1px solid transparent',
            transition: 'all 0.3s',
            overflow: 'hidden',
            width: searchOpen ? 280 : 38,
          }}
        >
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              flexShrink: 0,
            }}
          >
            <Search size={18} />
          </button>
          {searchOpen && (
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              placeholder="Search devices, IPs, assets..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 13,
                padding: '8px 12px 8px 0',
                fontFamily: 'var(--font-body)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchOpen(false);
                  setSearchQuery('');
                }
              }}
            />
          )}
        </div>

        {/* Notifications */}
        <a
          href="/notifications"
          style={{
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            position: 'relative',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#EF4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount}
            </span>
          )}
        </a>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border-primary)', margin: '0 4px' }} />

        {/* Profile */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #008793, #004D7A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {getInitials(user.fullName)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user.fullName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.role.name}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
