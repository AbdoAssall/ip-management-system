import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Anchor, Container, Ship } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      {/* Left Hero Panel */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #111624 0%, #1a2744 30%, #004D7A 70%, #008793 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Floating decorative elements */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', opacity: 0.06 }}>
          <Anchor size={120} color="#fff" />
        </div>
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', opacity: 0.06 }}>
          <Container size={140} color="#fff" />
        </div>
        <div style={{ position: 'absolute', top: '50%', right: '20%', opacity: 0.04 }}>
          <Ship size={100} color="#fff" />
        </div>

        {/* Glowing orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,135,147,0.15) 0%, transparent 70%)', transform: 'translate(-50%,-50%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '30%', left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,77,122,0.2) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        {/* Logo */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #008793, #004D7A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 28,
            color: '#fff',
            marginBottom: 28,
            boxShadow: '0 12px 40px rgba(0,135,147,0.3)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          PS
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 32,
            fontWeight: 800,
            color: '#fff',
            textAlign: 'center',
            marginBottom: 12,
            position: 'relative',
            zIndex: 2,
          }}
        >
          PSCCHC
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 15,
            textAlign: 'center',
            maxWidth: 360,
            lineHeight: 1.7,
            position: 'relative',
            zIndex: 2,
          }}
        >
          Port Said Container & Cargo Handling Company
        </p>
        <div
          style={{
            marginTop: 40,
            padding: '14px 28px',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
            Asset & IP Management System
          </p>
        </div>

        {/* Grid lines decoration */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 200, opacity: 0.03 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 10} x2="100%" y2={i * 10} stroke="#fff" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 40 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="200" stroke="#fff" strokeWidth="0.5" />
          ))}
        </svg>
      </div>

      {/* Right Login Panel */}
      <div
        style={{
          width: 520,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 60px',
          background: '#0f1219',
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 26,
              fontWeight: 700,
              color: '#e8ecf4',
              marginBottom: 8,
            }}
          >
            Welcome Back
          </h2>
          <p style={{ color: '#6b7590', fontSize: 14 }}>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                color: '#f87171',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#a0aabe', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              Email Address
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#171c28',
                borderRadius: 10,
                border: '1px solid #252d3d',
                transition: 'border-color 0.2s',
              }}
            >
              <Mail size={18} style={{ margin: '0 14px', color: '#6b7590', flexShrink: 0 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  flex: 1,
                  padding: '13px 14px 13px 0',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: '#e8ecf4',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', color: '#a0aabe', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#171c28',
                borderRadius: 10,
                border: '1px solid #252d3d',
              }}
            >
              <Lock size={18} style={{ margin: '0 14px', color: '#6b7590', flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  flex: 1,
                  padding: '13px 0',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: '#e8ecf4',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 14px', color: '#6b7590' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #008793, #004D7A)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(0,135,147,0.3)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>


      </div>
    </div>
  );
}
