'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'

function openMoji(hex) {
  return `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${hex}.svg`
}

function dicebear(seed, background = 'ffd5dc') {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${background}`
}

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

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setErr('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div style={screenShell}>
      <div style={cloudOne} />
      <div style={cloudTwo} />

      <div style={appFrame}>
        <div style={headerBar}>
          <Link href="/" style={backLink}>
            ← Back to overview
          </Link>
          <div style={brandRow}>
            <img src={openMoji('1F52C')} alt="" width="26" height="26" />
            <span>Little Genius</span>
          </div>
          <div style={headerTitle}>Sign In</div>
        </div>

        <div style={contentShell}>
          <div style={welcomeCard}>
            <div style={avatarRow}>
              {['Alek', 'Nova', 'Liam'].map((seed) => (
                <img key={seed} src={dicebear(seed)} alt={seed} width="70" height="70" style={avatarBubble} />
              ))}
            </div>
            <div style={welcomeTitle}>Welcome!</div>
            <div style={welcomeText}>A playful science app for kids ages 5 to 9.</div>
          </div>

          <div style={formCard}>
            <div style={modeTabs}>
              <button onClick={() => changeMode('login')} style={{ ...modeTab, ...(mode === 'login' ? activeModeTab : {}) }}>
                Sign In
              </button>
              <button onClick={() => changeMode('signup')} style={{ ...modeTab, ...(mode === 'signup' ? activeModeTab : {}) }}>
                Sign Up
              </button>
            </div>

            {mode === 'login' && (
              <div style={formStack}>
                <Input
                  value={email}
                  onChange={setEmail}
                  placeholder="Email Address"
                  style={inputStyle}
                />
                <Input
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  style={inputStyle}
                />

                {err && <div style={errorBox}>{err}</div>}

                <button onClick={handleLogin} disabled={loading} style={primaryButton}>
                  {loading ? 'Signing in...' : 'Let’s Go'}
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <div style={formStack}>
                <Input
                  value={username}
                  onChange={setUsername}
                  placeholder="Kid's Username"
                  style={inputStyle}
                />
                <Input
                  value={email}
                  onChange={setEmail}
                  placeholder="Email Address"
                  style={inputStyle}
                />
                <Input
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Choose Password"
                  style={inputStyle}
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm Password"
                  style={inputStyle}
                />

                {err && <div style={errorBox}>{err}</div>}

                <button onClick={handleSignUp} disabled={loading} style={primaryButton}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            )}
          </div>

          <div style={demoCard}>
            <div style={demoTitle}>Demo accounts</div>
            <div style={demoLine}><strong>Admin:</strong> `slchaves0000@gmail.com` / `yasi12345`</div>
            <div style={demoLine}><strong>Kid:</strong> `cosmic@gmail.com` / `password123`</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const screenShell = {
  minHeight: '100vh',
  background: '#bde7ff',
  padding: '14px 12px 24px',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const cloudOne = {
  position: 'absolute',
  width: 220,
  height: 84,
  left: -20,
  bottom: 92,
  borderRadius: 999,
  background: '#f8fbff',
  opacity: 0.9,
}

const cloudTwo = {
  position: 'absolute',
  width: 190,
  height: 72,
  right: -18,
  top: 140,
  borderRadius: 999,
  background: '#f8fbff',
  opacity: 0.74,
}

const appFrame = {
  width: 'min(100%, 460px)',
  background: '#f8fbff',
  border: '4px solid #8b5cf6',
  borderRadius: 34,
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 28px 50px rgba(15, 23, 42, 0.16)',
}

const headerBar = {
  background: '#7755d9',
  color: '#fff',
  padding: '14px 14px 12px',
}

const backLink = {
  color: '#ede9fe',
  fontSize: 13,
  fontWeight: 800,
}

const brandRow = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 12,
  fontWeight: 900,
  fontSize: 16,
}

const headerTitle = {
  marginTop: 10,
  fontSize: 34,
  lineHeight: 1,
  fontWeight: 900,
}

const contentShell = {
  padding: '16px 14px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const welcomeCard = {
  background: '#73a7f7',
  border: '3px solid #4f83e3',
  borderRadius: 28,
  padding: 18,
  textAlign: 'center',
  boxShadow: '0 12px 0 rgba(15, 23, 42, 0.08)',
}

const avatarRow = {
  display: 'flex',
  justifyContent: 'center',
  gap: 12,
  marginBottom: 12,
}

const avatarBubble = {
  borderRadius: '50%',
  border: '4px solid #fff',
  background: '#fff',
}

const welcomeTitle = {
  fontSize: 38,
  lineHeight: 1,
  fontWeight: 900,
  color: '#fff',
}

const welcomeText = {
  marginTop: 10,
  fontSize: 16,
  lineHeight: 1.5,
  fontWeight: 700,
  color: '#eff6ff',
}

const formCard = {
  background: '#ffffff',
  border: '3px solid #dbeafe',
  borderRadius: 26,
  padding: 16,
}

const modeTabs = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
  marginBottom: 14,
}

const modeTab = {
  border: '3px solid #dbeafe',
  background: '#f8fbff',
  color: '#475569',
  borderRadius: 18,
  padding: '12px 10px',
  fontSize: 15,
  fontWeight: 900,
  cursor: 'pointer',
}

const activeModeTab = {
  borderColor: '#facc15',
  background: '#fff7d6',
  color: '#854d0e',
}

const formStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const inputStyle = {
  border: '3px solid #dbeafe',
  borderRadius: 18,
  padding: '14px 14px',
  fontSize: 15,
  fontWeight: 700,
}

const errorBox = {
  background: '#fee2e2',
  border: '2px solid #fca5a5',
  color: '#b91c1c',
  borderRadius: 16,
  padding: '10px 12px',
  fontSize: 13,
  fontWeight: 800,
}

const primaryButton = {
  border: '3px solid #4d9b14',
  background: '#84cc16',
  color: '#fff',
  borderRadius: 18,
  padding: '14px 18px',
  fontSize: 18,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 10px 0 rgba(77, 155, 20, 0.22)',
}

const demoCard = {
  background: '#fff7d6',
  border: '3px solid #fcd34d',
  borderRadius: 24,
  padding: 14,
}

const demoTitle = {
  fontSize: 16,
  fontWeight: 900,
  color: '#854d0e',
}

const demoLine = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.55,
  color: '#7c2d12',
}
