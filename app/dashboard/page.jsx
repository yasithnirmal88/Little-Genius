'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [modules, setModules] = useState([])
  const [shorts, setShorts] = useState([])
  const [progress, setProgress] = useState({})
  const [unlockedMods, setUnlockedMods] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('path')
  const [selMod, setSelMod] = useState(null)
  const [selShort, setSelShort] = useState(null)
  const [voted, setVoted] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/login')
      return
    }
    setUser(authUser)

    const { data: prof } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()
    setProfile(prof)

    const { data: mods } = await supabase
      .from('modules')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
    setModules(mods || [])

    const { data: sh } = await supabase
      .from('shorts')
      .select('*')
      .eq('status', 'published')
    setShorts(sh || [])

    if (prof) {
      const { data: prog } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', prof.id)
      const progMap = {}
      ;(prog || []).forEach((p) => {
        progMap[p.module_id] = p
      })
      setProgress(progMap)
    }

    // Auto-unlock: if all published modules in a tier have 3 stars, unlock next tier
    const unlocked = {}
    const modsData = modules || []
    const tiers = [...new Set(modsData.map((m) => m.tier))].sort((a, b) => a - b)
    let prevTierComplete = true
    tiers.forEach((tier) => {
      const tierMods = modsData.filter((m) => m.tier === tier && m.status === 'published')
      const allComplete = tierMods.every((m) => (progMap[m.id]?.stars || 0) >= 3)
      tierMods.forEach((m) => {
        unlocked[m.id] = prevTierComplete
      })
      prevTierComplete = allComplete
    })
    setUnlockedMods(unlocked)

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f4ff',
          fontSize: 18,
          color: '#667eea',
        }}
      >
        🚀 Loading…
      </div>
    )
  }

  const TABS = [
    { id: 'path', icon: '🗺️', label: 'Path' },
    { id: 'shorts', icon: '▶️', label: 'Shorts' },
    { id: 'battle', icon: '⚔️', label: 'Battle' },
    { id: 'ranks', icon: '🏅', label: 'Ranks' },
    { id: 'profile', icon: '👤', label: 'Me' },
  ]

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        background: '#f0f4ff',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'white',
          padding: 'clamp(10px, 2vw, 16px) clamp(12px, 3vw, 24px)',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 'clamp(16px, 3vw, 20px)',
            background: 'linear-gradient(90deg,#667eea,#e17055)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          🔬 Little Genius
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span
            style={{
              background: '#fff9e6',
              border: '1.5px solid #FFD700',
              borderRadius: 20,
              padding: '3px 8px',
              fontWeight: 700,
              color: '#f9ca24',
              fontSize: 12,
            }}
          >
            ⭐ {profile?.xp?.toLocaleString() || '0'}
          </span>
          <span
            style={{
              background: '#fff5f0',
              border: '1.5px solid #e17055',
              borderRadius: 20,
              padding: '3px 8px',
              fontWeight: 700,
              color: '#e17055',
              fontSize: 12,
            }}
          >
            🔥 {profile?.streak || '0'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {tab === 'path' && <PathTab modules={modules} progress={progress} onSelect={setSelMod} profile={profile} unlockedMods={unlockedMods} />}
        {tab === 'shorts' && (
          <div style={{ padding: 'clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)' }}>⚡ Science Shorts</div>
            {shorts.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelShort(s)}
                style={{
                  background: 'linear-gradient(135deg,#2d3436,#636e72)',
                  borderRadius: 'clamp(12px, 2vw, 16px)',
                  padding: 'clamp(12px, 2vw, 20px)',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Badge color="#A29BFE">{s.domain}</Badge>
                  <Badge color="#FFD700">+10 XP</Badge>
                </div>
                <div style={{ fontWeight: 700, fontSize: 'clamp(13px, 2vw, 16px)', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', textAlign: 'center', padding: '8px 0' }}>▶️</div>
                <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', opacity: 0.6, marginTop: 4, textAlign: 'right' }}>{s.duration}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'battle' && (
          <div style={{ padding: 'clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)' }}>⚔️ Science Battle</div>
            <div
              style={{
                background: 'linear-gradient(135deg,#e17055,#d63031)',
                borderRadius: 'clamp(12px, 2vw, 16px)',
                padding: 'clamp(12px, 2vw, 20px)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', opacity: 0.8 }}>MODULE 3 — STAR 3</div>
              <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', marginTop: 4 }}>
                "Is a virus alive or not alive?"
              </div>
            </div>
            {!voted ? (
              <div style={{ display: 'flex', gap: 10 }}>
                {['🦠 ALIVE', '💀 NOT ALIVE'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVoted(v)}
                    style={{
                      flex: 1,
                      padding: '18px 8px',
                      border: '2px solid #e17055',
                      borderRadius: 14,
                      background: 'white',
                      fontWeight: 700,
                      fontSize: 'clamp(12px, 2vw, 14px)',
                      cursor: 'pointer',
                      color: '#e17055',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    background: '#00b894',
                    borderRadius: 12,
                    padding: 12,
                    color: 'white',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  ✅ Voted: {voted}
                </div>
                {[
                  ['🦠 ALIVE', 'Viruses evolve and adapt.', '#A29BFE'],
                  ['💀 NOT ALIVE', "Can't survive without a host.", '#fd79a8'],
                ].map(([s, t, c]) => (
                  <div
                    key={s}
                    style={{
                      background: `${c}22`,
                      border: `1.5px solid ${c}`,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12, color: c }}>{s}</div>
                    <div style={{ fontSize: 'clamp(12px, 1.5vw, 14px)', marginTop: 4 }}>{t}</div>
                  </div>
                ))}
                <div
                  style={{
                    background: '#00b89422',
                    borderRadius: 12,
                    padding: 12,
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#00b894',
                  }}
                >
                  +25 XP earned! 🎉
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'ranks' && (
          <RanksTab profile={profile} />
        )}
        {tab === 'profile' && (
          <ProfileTab profile={profile} onLogout={handleLogout} />
        )}
      </div>

      {/* Bottom Nav */}
      <div
        style={{
          background: 'white',
          borderTop: '1px solid #eee',
          display: 'flex',
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: 'clamp(8px, 1.5vw, 12px) 0',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: tab === t.id ? '#667eea' : '#aaa',
            }}
          >
            <span style={{ fontSize: 'clamp(16px, 3vw, 22px)' }}>{t.icon}</span>
            <span style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', fontWeight: tab === t.id ? 700 : 400 }}>
              {t.label}
            </span>
            {tab === t.id && (
              <div style={{ width: 4, height: 4, background: '#667eea', borderRadius: 2 }} />
            )}
          </button>
        ))}
      </div>

      {selMod && <ModuleModal mod={selMod} progress={progress[selMod.id]} onClose={() => setSelMod(null)} />}
      {selShort && <ShortPlayer short={selShort} onClose={() => setSelShort(null)} />}
    </div>
  )
}

// ─── PATH TAB ───────────────────────────────────────────────────────────
function PathTab({ modules, progress, onSelect, profile, unlockedMods = {} }) {
  const CANVAS_W = 320
  const NODE_STEP = 78
  const totalH = Math.max(modules.length * NODE_STEP + 100, 400)

  const nodeX = [35, 65, 45, 25, 55, 75, 50, 30]
  const realPts = modules.map((m, i) => ({
    x: (nodeX[i % nodeX.length] / 100) * (CANVAS_W - 80) + 20,
    y: i * NODE_STEP + 60,
  }))

  const makePath = (pts) =>
    pts.reduce((d, p, i) => {
      if (i === 0) return `M${p.x},${p.y}`
      const prev = pts[i - 1]
      const cx = (prev.x + p.x) / 2
      return d + ` C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`
    }, '')

  const completedCount = modules.filter((m) => (progress[m.id]?.stars || 0) > 0).length
  const donePts = realPts.slice(0, Math.max(1, completedCount + 1))

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#f0f4ff' }}>
      <div
        style={{
          background: 'linear-gradient(135deg,#667eea,#764ba2)',
          margin: 12,
          borderRadius: 16,
          padding: '12px 16px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Rank</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            🎖️ {profile?.rank || 'Science Cadet'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>XP</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {profile?.xp?.toLocaleString() || '0'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>🔥 Streak</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.streak || '0'}</div>
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%' }}>
        <svg width="100%" viewBox={`0 0 ${CANVAS_W} ${totalH}`} style={{ display: 'block' }}>
          {/* Background science icons */}
          {[1,2,3,4,5,6,7,8].map((n) => {
            const icons = ['🧪','🔬','🚀','⚛️','🔭','🧬','⚗️','🧲','💡','🔋','🛸','🌡️']
            const icon = icons[(n * 7) % icons.length]
            const bx = 15 + ((n * 37) % (CANVAS_W - 40))
            const by = 20 + ((n * 53) % (totalH - 60))
            return (
              <text key={n} x={bx} y={by} fontSize={14} opacity={0.08}>
                {icon}
              </text>
            )
          })}
          {[1,2,3,4,5,6].map((n) => {
            const icons = ['🧪','🔬','⚗️','🧬']
            const icon = icons[(n * 11) % icons.length]
            const bx = 280 - ((n * 29) % 80)
            const by = 40 + ((n * 47) % (totalH - 80))
            return (
              <text key={`r${n}`} x={bx} y={by} fontSize={11} opacity={0.06}>
                {icon}
              </text>
            )
          })}
          <path d={makePath(realPts)} fill="none" stroke="#dde3f0" strokeWidth={10} strokeLinecap="round" />
          <path d={makePath(donePts)} fill="none" stroke="#A29BFE" strokeWidth={10} strokeLinecap="round" />
          <path
            d={makePath(donePts)}
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="6 10"
            opacity={0.5}
          />
          {modules.map((mod, i) => {
            const x = realPts[i].x
            const y = realPts[i].y
            const cs = ['#FF6B6B', '#FF9F43', '#48DBFB', '#1DD1A1', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7']
            const modProgress = progress[mod.id]
            const stars = modProgress?.stars || 0
            const effectivelyLocked = mod.locked && !unlockedMods[mod.id] && stars === 0
            const bg = effectivelyLocked ? '#b2bec3' : cs[i % cs.length]
            const isActive = !effectivelyLocked || stars < 3

            return (
              <g
                key={mod.id}
                onClick={() => !effectivelyLocked && onSelect(mod)}
                style={{ cursor: effectivelyLocked ? 'not-allowed' : 'pointer' }}
              >
                {isActive && <circle cx={x} cy={y} r={30} fill={bg} opacity={0.12} />}
                <circle cx={x} cy={y + 3} r={20} fill="#0000001a" />
                <circle cx={x} cy={y} r={20} fill={bg} stroke="white" strokeWidth={2.5} />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={effectivelyLocked ? 14 : 16}>
                  {effectivelyLocked ? '🔒' : stars >= 3 ? '✅' : mod.emoji}
                </text>
                {[0, 1, 2].map((s) => (
                  <text key={s} x={x - 10 + s * 10} y={y + 32} textAnchor="middle" fontSize={9}>
                    {s < stars ? '⭐' : '☆'}
                  </text>
                ))}
                <text x={x} y={y + 46} textAnchor="middle" fontSize={9} fontWeight="600" fill="#636e72">
                  {mod.title}
                </text>
                {isActive && (
                  <circle cx={x} cy={y} r={22} fill="none" stroke={bg} strokeWidth={1.5} opacity={0.5} strokeDasharray="3 4" />
                )}
              </g>
            )
          })}
        </svg>
        <div style={{ textAlign: 'center', paddingBottom: 20, color: '#aaa', fontSize: 13 }}>
          🔒 Keep going to unlock more!
        </div>
      </div>
    </div>
  )
}

// ─── MODULE MODAL ───────────────────────────────────────────────────────
function ModuleModal({ mod, progress, onClose }) {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  if (!mod) return null

  const stars = progress?.stars || 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          padding: 20,
          maxHeight: '75%',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 40,
            height: 4,
            background: '#ddd',
            borderRadius: 2,
            margin: '0 auto 16px',
          }}
        />
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
          {mod.emoji} {mod.title}
        </div>
        <StarRow count={stars} />
        <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
          {['overview', 'stars', 'xp'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 10,
                background: tab === t ? '#667eea' : '#f0f0f0',
                color: tab === t ? 'white' : '#555',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {t === 'xp' ? 'XP & Rewards' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '📹 Short video (30–60s)',
              '🧠 5-Question Quiz',
              '📹 Short video #2',
              '🧠 5-Question Quiz',
              '📹 Short video #3',
              '🧠 8-Question Quiz + ⚔️ Science Battle',
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: i < stars * 2 ? '#f0fff4' : '#fafafa',
                  borderRadius: 10,
                  border: '1.5px solid ' + (i < stars * 2 ? '#00b894' : '#eee'),
                  fontSize: 13,
                }}
              >
                <span>{i < stars * 2 ? '✅' : '⭕'}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
        {tab === 'stars' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['⭐ Star 1', 'Watch Short + 5-Question Quiz'],
              ['⭐ Star 2', 'Watch Short + 5-Question Quiz'],
              ['⭐ Star 3', 'Watch Short + 8-Question Quiz + Science Battle'],
            ].map(([star, desc], i) => (
              <div
                key={star}
                style={{
                  background: i < stars ? '#fff9e6' : '#fafafa',
                  border: '1.5px solid ' + (i < stars ? '#FFD700' : '#eee'),
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: i < stars ? '#f9ca24' : '#aaa' }}>
                  {star} {i < stars ? '✅' : ''}
                </div>
                <div style={{ fontSize: 13, color: '#636e72', marginTop: 4 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'xp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Watch a Short', '+ 10 XP'],
              ['Pass Quiz (Stars 1–2)', '+ 15 XP'],
              ['Pass Quiz (Star 3)', '+ 25 XP'],
              ['Science Battle', '+ 25 XP'],
              ['Perfect Score', '+ 10 XP'],
              ['Daily Login', '+ 5 XP/day'],
            ].map(([a, x]) => (
              <div
                key={a}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8f8f8',
                  borderRadius: 10,
                  fontSize: 13,
                }}
              >
                <span>{a}</span>
                <span style={{ fontWeight: 700, color: '#00b894' }}>{x}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => router.push(`/module/${mod.id}`)}
          style={{
            marginTop: 16,
            width: '100%',
            padding: 14,
            background: 'linear-gradient(90deg,#667eea,#764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {stars === 0 ? 'Start Module 🚀' : stars >= 3 ? 'Review 📖' : 'Continue ▶'}
        </button>
      </div>
    </div>
  )
}

// ─── SHORT PLAYER ─────────────────────────────────────────────────────
function ShortPlayer({ short, onClose }) {
  const isYouTube = short.video_url?.includes('youtube.com') || short.video_url?.includes('youtu.be')
  let embedUrl = null
  if (isYouTube) {
    const match = short.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'clamp(10px, 2vw, 16px) clamp(12px, 3vw, 24px)',
        color: 'white',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'clamp(13px, 2vw, 16px)' }}>{short.title}</div>
          <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', opacity: .6 }}>{short.domain} · {short.duration}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 clamp(12px, 3vw, 24px)' }} onClick={(e) => e.stopPropagation()}>
        {embedUrl ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', width: '100%', maxWidth: 800 }}>
            <iframe
              src={embedUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : short.video_url ? (
          <video controls style={{ width: '100%', maxWidth: 800, borderRadius: 12 }} src={short.video_url} />
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📹</div>
            <div>Video not available</div>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: 12, color: '#666', fontSize: 13 }}>
        Tap anywhere outside to close
      </div>
    </div>
  )
}

// ─── STAR ROW ──────────────────────────────────────────────────────────
function StarRow({ count, max = 3 }) {
  return (
    <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: 13 }}>
          {i < count ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  )
}

// ─── RANKS TAB ─────────────────────────────────────────────────────────
function RanksTab({ profile }) {
  const ranks = [
    'Science Cadet',
    'Spark Explorer',
    'Atom Scout',
    'Bio Ranger',
    'Geo Pioneer',
    'Quantum Apprentice',
    'Stellar Knight',
    'Nova Commander',
    'Spark Admiral',
    'Supreme Spark Commander',
  ]

  return (
    <div style={{ padding: 'clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)' }}>🏅 Rank Ladder</div>
      {ranks.map((r, i) => {
        const isCurrent = profile?.rank === r
        return (
          <div
            key={r}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 1.5vw, 14px)',
              background: isCurrent ? '#667eea11' : '#fafafa',
              border: `1.5px solid ${isCurrent ? '#667eea' : '#eee'}`,
              borderRadius: 12,
              padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 16px)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: isCurrent ? '#667eea' : i < 1 ? '#00b894' : '#dfe6e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: isCurrent || i < 1 ? 'white' : '#aaa',
                fontSize: 12,
              }}
            >
              {isCurrent ? '✓' : i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  color: isCurrent ? '#667eea' : '#2d3436',
                }}
              >
                {r}
              </div>
              <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#aaa' }}>
                Modules {i * 2 + 1}–{i * 2 + 2}
              </div>
            </div>
            {isCurrent && (
              <span
                style={{
                  fontSize: 'clamp(10px, 1.5vw, 12px)',
                  background: '#667eea',
                  color: 'white',
                  borderRadius: 10,
                  padding: '2px 8px',
                }}
              >
                YOU
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── PROFILE TAB ───────────────────────────────────────────────────────
function ProfileTab({ profile, onLogout }) {
  return (
    <div style={{ padding: 'clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 16px)' }}>
      <div
        style={{
          background: 'linear-gradient(135deg,#667eea,#764ba2)',
          borderRadius: 'clamp(16px, 3vw, 24px)',
          padding: 'clamp(16px, 3vw, 28px)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 'clamp(36px, 8vw, 52px)', marginBottom: 8 }}>🧑‍🚀</div>
        <div style={{ fontWeight: 700, fontSize: 'clamp(16px, 3vw, 22px)' }}>
          {profile?.username || 'CosmicNebula42'}
        </div>
        <div style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', opacity: 0.8 }}>
          {profile?.rank || 'Science Cadet'}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(16px, 4vw, 32px)',
            marginTop: 'clamp(10px, 2vw, 16px)',
          }}
        >
          {[
            [profile?.xp?.toLocaleString() || '0', 'XP'],
            [profile?.streak || '0', '🔥'],
            [profile?.modules_completed || '0', 'Modules'],
          ].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontWeight: 700, fontSize: 'clamp(18px, 3vw, 24px)' }}>{v}</div>
              <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', opacity: 0.8 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onLogout}
        style={{
          background: '#ff7675',
          color: 'white',
          border: 'none',
          borderRadius: 'clamp(10px, 1.5vw, 14px)',
          padding: 'clamp(10px, 2vw, 14px)',
          fontWeight: 700,
          fontSize: 'clamp(13px, 2vw, 15px)',
          cursor: 'pointer',
        }}
      >
        Log Out
      </button>
    </div>
  )
}

// ─── BADGE ─────────────────────────────────────────────────────────────
function Badge({ color, children }) {
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 20,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  )
}
