import { useNotifications } from '@/contexts/NotificationContext';
import { timeAgo } from '@/lib/utils';
import { Bell, AlertTriangle, Shield, Wrench, Wifi, Copy, Check, Trash2 } from 'lucide-react';
import type { NotificationType } from '@/types';

const typeIcons: Record<NotificationType, React.ElementType> = {
  duplicate_ip: Copy, warranty_expiry: Wrench, device_offline: Wifi, maintenance_due: Wrench, security_alert: Shield,
};
const typeColors: Record<NotificationType, string> = {
  duplicate_ip: '#EF4444', warranty_expiry: '#F59E0B', device_offline: '#EF4444', maintenance_due: '#3B82F6', security_alert: '#8B5CF6',
};
const severityColors: Record<string, string> = { info: '#3B82F6', warning: '#F59E0B', error: '#EF4444', critical: '#DC2626' };

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Notifications</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--accent-primary)', fontSize: 13, cursor: 'pointer' }}>
            <Check size={14} style={{ marginRight: 6 }} />Mark All Read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifications.map((notif) => {
          const Icon = typeIcons[notif.type] || Bell;
          const color = typeColors[notif.type] || '#6B7280';
          return (
            <div key={notif.id}
              style={{
                background: notif.isRead ? 'var(--bg-card)' : 'var(--bg-tertiary)',
                borderRadius: 12, padding: '16px 20px', border: `1px solid ${notif.isRead ? 'var(--border-primary)' : 'var(--border-secondary)'}`,
                display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all 0.2s', cursor: 'pointer',
                borderLeft: notif.isRead ? undefined : `3px solid ${color}`,
              }}
              onClick={() => markAsRead(notif.id)}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{notif.title}</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${severityColors[notif.severity]}15`, color: severityColors[notif.severity], fontWeight: 600, textTransform: 'uppercase' }}>{notif.severity}</span>
                  {!notif.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)' }} />}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{notif.message}</p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>{timeAgo(notif.createdAt)}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Trash2 size={15} /></button>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
