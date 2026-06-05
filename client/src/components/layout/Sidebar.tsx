import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NAV_ITEMS } from '@/lib/constants';
import {
  LayoutDashboard, HardDrive, Globe, FileBarChart, ScrollText,
  Users, Bell, Settings, ChevronLeft, ChevronRight, LogOut, Sun, Moon,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, HardDrive, Globe, FileBarChart, ScrollText, Users, Bell, Settings,
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        background: 'var(--bg-sidebar)',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '20px 12px' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          minHeight: 'var(--header-height)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #008793 0%, #004D7A 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 14,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          PS
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
              PSCCHC
            </div>
            <div style={{ color: 'var(--text-sidebar)', fontSize: 11, whiteSpace: 'nowrap' }}>
              Asset & IP Manager
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ marginBottom: 8, padding: collapsed ? '0' : '0 12px' }}>
          {!collapsed && (
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-sidebar)', opacity: 0.6 }}>
              Main Menu
            </span>
          )}
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '11px 0' : '11px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 10,
                marginBottom: 2,
                color: isActive ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
                background: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {Icon && <Icon size={19} style={{ flexShrink: 0 }} />}
              {!collapsed && <span>{item.label}</span>}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    borderRadius: 4,
                    background: '#fff',
                    display: collapsed ? 'none' : 'block',
                  }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: collapsed ? '11px 0' : '11px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10,
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-sidebar)',
            background: 'transparent',
            fontSize: 13.5,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-sidebar-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User info */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '11px 0' : '11px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              marginTop: 4,
            }}
          >
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
                flexShrink: 0,
              }}
            >
              {getInitials(user.fullName)}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName}
                </div>
                <div style={{ color: 'var(--text-sidebar)', fontSize: 11 }}>
                  {user.role.name}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sidebar)', padding: 4 }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: -14,
          top: 80,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 60,
          transition: 'all 0.2s',
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
