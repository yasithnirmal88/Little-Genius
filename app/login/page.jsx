'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Btn } from '@/components/ui/Btn'

export default function LoginPage() {
  const supabase = createClient()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setErr('')
    if (!email.trim() || !password.trim()) {
      return setErr('Please enter both email and password.')
    }
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)
    if (error) return setErr(error.message)

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('email', email.trim().toLowerCase())
      .single()

    window.location.href = profile?.role === 'admin' ? '/admin' : '/dashboard'
  }

  const handleSignUp = async () => {
    setErr('')
    if (!username.trim() || !email.trim() || !password.trim()) {
      return setErr('All fields are required.')
    }
    if (username.trim().length < 3) {
      return setErr('Username must be at least 3 characters.')
    }
    if (!email.includes('@') || !email.includes('.')) {
      return setErr('Please enter a valid email address.')
    }
    if (password.length < 6) {
      return setErr('Password must be at least 6 characters.')
    }
    if (password !== confirmPassword) {
      return setErr('Passwords do not match.')
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim() },
      },
    })

    setLoading(false)
    if (error) return setErr(error.message)

    setMode('login')
    setErr('')
    setPassword('')
    setConfirmPassword('')
    alert('Account created! You can now sign in.')
  }

  const changeMode = (m) => {
    setMode(m)
    setErr('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 40px)',
        background: 'linear-gradient(160deg,#667eea22,#e1705522)',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(40px, 10vw, 64px)',
          marginBottom: 8,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
        }}
      >
        🔬
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 'clamp(22px, 5vw, 34px)',
          background: 'linear-gradient(90deg,#667eea,#e17055)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 4,
          letterSpacing: -0.5,
        }}
      >
        Little Genius
      </div>
      <div
        style={{
          color: '#aaa',
          fontSize: 'clamp(12px, 2vw, 14px)',
          marginBottom: 'clamp(16px, 3vw, 28px)',
          fontWeight: 500,
        }}
      >
        Science Learning for Kids 5–9
      </div>

      <div
        style={{
          width: 'min(92%, 450px)',
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 10px 25px rgba(102, 126, 234, 0.08)',
          border: '1px solid rgba(224, 224, 224, 0.6)',
          padding: 'clamp(16px, 3vw, 24px)',
          boxSizing: 'border-box',
        }}
      >
        {(mode === 'login' || mode === 'signup') && (
          <div
            style={{
              display: 'flex',
              background: '#f1f3f9',
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
            }}
          >
            <button
              onClick={() => changeMode('login')}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 9,
                background: mode === 'login' ? 'white' : 'transparent',
                color: mode === 'login' ? '#2d3436' : '#636e72',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => changeMode('signup')}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 9,
                background: mode === 'signup' ? 'white' : 'transparent',
                color: mode === 'signup' ? '#2d3436' : '#636e72',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === 'login' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Input value={email} onChange={setEmail} placeholder="Email Address" />
              <span style={{ position: 'absolute', right: 12, top: 11, fontSize: 14 }}>📧</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Input
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Password"
                style={{ paddingRight: 35 }}
              />
              <span style={{ position: 'absolute', right: 12, top: 11, fontSize: 14 }}>🔒</span>
            </div>

            {err && (
              <div style={{ color: '#e17055', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>
                ⚠️ {err}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                background: loading ? '#aaa' : 'linear-gradient(90deg,#667eea,#764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: 14,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 6,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
              }}
            >
              {loading ? 'Signing in…' : "Let's Go! 🚀"}
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Input value={username} onChange={setUsername} placeholder="Kid's Username" />
              <span style={{ position: 'absolute', right: 12, top: 11, fontSize: 14 }}>👤</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Input value={email} onChange={setEmail} placeholder="Email Address" />
              <span style={{ position: 'absolute', right: 12, top: 11, fontSize: 14 }}>📧</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Input type="password" value={password} onChange={setPassword} placeholder="Choose Password" />
              <span style={{ position: 'absolute', right: 12, top: 11, fontSize: 14 }}>🔒</span>
            </div>
            <div style={{ position: 'relative' }}>
              <Input
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm Password"
              />
              <span style={{ position: 'absolute', right: 12, top: 11, fontSize: 14 }}>🛡️</span>
            </div>

            {err && (
              <div style={{ color: '#e17055', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>
                ⚠️ {err}
              </div>
            )}

            <button
              onClick={handleSignUp}
              disabled={loading}
              style={{
                background: loading ? '#aaa' : 'linear-gradient(90deg,#e17055,#ff7675)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: 14,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 6,
                boxShadow: '0 4px 15px rgba(225, 112, 85, 0.2)',
              }}
            >
              {loading ? 'Creating account…' : 'Create Account ✨'}
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 'clamp(16px, 3vw, 24px)',
          padding: 'clamp(10px, 2vw, 14px)',
          background: 'white',
          borderRadius: 12,
          fontSize: 'clamp(10px, 1.5vw, 12px)',
          color: '#888',
          textAlign: 'left',
          width: 'min(92%, 450px)',
          boxSizing: 'border-box',
          border: '1px dashed #ddd',
        }}
      >
        <div style={{ fontWeight: 700, color: '#667eea', marginBottom: 4 }}>💡 Demo accounts:</div>
        • Admin: <b style={{ color: '#333' }}>slchaves0000@gmail.com</b> /{' '}
        <b style={{ color: '#333' }}>yasi12345</b>
        <br />
        • Kid: <b style={{ color: '#333' }}>cosmic@gmail.com</b> /{' '}
        <b style={{ color: '#333' }}>password123</b>
      </div>
    </div>
  )
}
