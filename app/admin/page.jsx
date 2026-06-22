'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Btn } from '@/components/ui/Btn'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'





export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState(null)
  const [modules, setModules] = useState([])
  const [shorts, setShorts] = useState([])
  const [users, setUsers] = useState([])
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (prof?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    setProfile(prof)

    const { data: mods } = await supabase.from('modules').select('*').order('sort_order')
    setModules(mods || [])

    const { data: sh } = await supabase.from('shorts').select('*')
    setShorts(sh || [])

    const { data: us } = await supabase.from('users').select('*').order('username')
    setUsers(us || [])

    const { data: ls } = await supabase.from('lessons').select('*, module_id').order('module_id').order('step_number')
    setLessons(ls || [])

    const { data: qz } = await supabase.from('quizzes').select('*, quiz_questions(*)').order('module_id')
    setQuizzes(qz || [])

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const pubM = modules.filter((m) => m.status === 'published').length
  const pubS = shorts.filter((s) => s.status === 'published').length
  const activeU = users.filter((u) => u.status === 'active').length

  const TABS = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'modules', icon: '📦', label: 'Modules' },
    { id: 'lessons', icon: '📖', label: 'Lessons' },
    { id: 'quizzes', icon: '❓', label: 'Quizzes' },
    { id: 'shorts', icon: '▶️', label: 'Shorts' },
    { id: 'users', icon: '👥', label: 'Users' },
  ]

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fc', fontSize: 18, color: '#667eea' }}>
        🛠️ Loading admin…
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f7f8fc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg,#2d3436,#636e72)',
        padding: 'clamp(10px, 2vw, 16px) clamp(12px, 3vw, 24px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 'clamp(14px, 2.5vw, 18px)' }}>🛠️ Admin Panel</div>
          <div style={{ color: '#aaa', fontSize: 'clamp(10px, 1.5vw, 12px)' }}>Little Genius CMS</div>
        </div>
        <button onClick={handleLogout} style={{
          background: '#ff7675', color: 'white', border: 'none',
          borderRadius: 'clamp(8px, 1.5vw, 12px)',
          padding: 'clamp(4px, 1vw, 8px) clamp(8px, 1.5vw, 14px)',
          fontWeight: 700, fontSize: 'clamp(11px, 1.5vw, 13px)', cursor: 'pointer',
        }}>
          Logout
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: 'clamp(12px, 2vw, 24px)',
        display: 'flex', flexDirection: 'column',
        gap: 'clamp(12px, 2vw, 20px)',
      }}>
        {tab === 'dashboard' && (
          <>
            <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436' }}>📊 Overview</div>
            <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 16px)', flexWrap: 'wrap' }}>
              <StatCard icon="📦" label="Published Modules" value={pubM} color="#667eea" />
              <StatCard icon="▶️" label="Published Shorts" value={pubS} color="#e17055" />
            </div>
            <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 16px)', flexWrap: 'wrap' }}>
              <StatCard icon="👥" label="Active Users" value={activeU} color="#00b894" />
              <StatCard icon="🚫" label="Suspended" value={users.length - activeU} color="#fd79a8" />
            </div>
            <div style={{ background: 'white', borderRadius: 'clamp(12px, 2vw, 16px)', padding: 'clamp(14px, 2vw, 20px)', border: '1.5px solid #eee' }}>
              <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)', marginBottom: 'clamp(10px, 1.5vw, 14px)', color: '#2d3436' }}>📈 Content Health</div>
              {[['Modules', modules, pubM, '#667eea'], ['Shorts', shorts, pubS, '#e17055']].map(([name, arr, pub, c]) => (
                <div key={name} style={{ marginBottom: 'clamp(10px, 1.5vw, 14px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(11px, 1.5vw, 13px)', marginBottom: 4 }}>
                    <span style={{ color: '#636e72' }}>{name}</span>
                    <span style={{ fontWeight: 700, color: c }}>{pub}/{arr.length} published</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 6, height: 8 }}>
                    <div style={{
                      width: `${(pub / Math.max(arr.length, 1)) * 100}%`,
                      height: 8, background: c, borderRadius: 6, transition: 'width .3s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {tab === 'modules' && (
          <AdminModules supabase={supabase} modules={modules} setModules={setModules} />
        )}
        {tab === 'lessons' && (
          <AdminLessons supabase={supabase} lessons={lessons} setLessons={setLessons} modules={modules} />
        )}
        {tab === 'quizzes' && (
          <AdminQuizzes supabase={supabase} quizzes={quizzes} setQuizzes={setQuizzes} modules={modules} />
        )}
        {tab === 'shorts' && (
          <AdminShorts supabase={supabase} shorts={shorts} setShorts={setShorts} modules={modules} />
        )}
        {tab === 'users' && (
          <AdminUsers users={users} />
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ background: 'white', borderTop: '1px solid #eee', display: 'flex', flexShrink: 0, overflowX: 'auto' }}>
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
              color: tab === t.id ? '#2d3436' : '#aaa',
              minWidth: 72,
            }}
          >
            <span style={{ fontSize: 'clamp(16px, 3vw, 22px)' }}>{t.icon}</span>
            <span style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', fontWeight: tab === t.id ? 700 : 400 }}>
              {t.label}
            </span>
            {tab === t.id && <div style={{ width: 4, height: 4, background: '#2d3436', borderRadius: 2 }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── STAT CARD ─────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 'clamp(12px, 2vw, 16px)',
      padding: 'clamp(12px, 2vw, 18px) clamp(14px, 2vw, 20px)',
      border: `1.5px solid ${color}33`,
      flex: '1 1 clamp(140px, 20vw, 200px)',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 'clamp(18px, 3vw, 26px)' }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 'clamp(18px, 3vw, 26px)', color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#aaa', marginTop: 2 }}>{label}</div>
    </div>
  )
}

// ─── ADMIN MODULES ─────────────────────────────────────────────────────
function VideoUploadBtn({ bucket, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUrl('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setUrl(data.url)
        if (onUploaded) onUploaded(data.url)
      } else {
        alert('Upload failed: ' + (data.error || 'unknown error'))
      }
    } catch (err) {
      alert('Upload error: ' + err.message)
    }
    setUploading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input type="file" accept="video/*" onChange={handleFile} style={{ display: 'none' }} id={`file-${bucket}`} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Btn
          onClick={() => document.getElementById(`file-${bucket}`).click()}
          color="#00b894" outline
          disabled={uploading}
        >
          {uploading ? '⏳ Uploading...' : `📹 Upload ${bucket === 'module-videos' ? 'Module' : 'Short'} Video`}
        </Btn>
        {url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: '#00b894', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
              ✅ {url.split('/').pop()}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              style={{ background: '#00b89422', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: '#00b894', fontWeight: 700, flexShrink: 0 }}
            >
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminModules({ supabase, modules, setModules }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [showForm, setShowForm] = useState(false)

  const openEdit = (mod) => { setForm({ ...mod }); setEditing(mod.id); setShowForm(true) }
  const openNew = () => {
    setForm({ tier: 1, title: '', emoji: '🔬', description: '', domains: [], locked: true, status: 'draft', sort_order: modules.length + 1 })
    setEditing(null)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.title.trim()) return
    if (editing) {
      await supabase.from('modules').update(form).eq('id', editing)
      setModules((ms) => ms.map((m) => (m.id === editing ? { ...m, ...form } : m)))
    } else {
      const { data } = await supabase.from('modules').insert(form).select().single()
      if (data) setModules((ms) => [...ms, data])
    }
    setShowForm(false)
  }

  const del = async (id) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    await supabase.from('modules').delete().eq('id', id)
    setModules((ms) => ms.filter((m) => m.id !== id))
  }

  const toggleField = async (id, field, value) => {
    await supabase.from('modules').update({ [field]: value }).eq('id', id)
    setModules((ms) => ms.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436' }}>
          📦 Modules ({modules.length})
        </div>
        <Btn onClick={openNew} color="#667eea">
          + New Module
        </Btn>
      </div>

      {showForm && (
        <div style={{
          background: 'white', border: '1.5px solid #667eea',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(12px, 2vw, 20px)',
          display: 'flex', flexDirection: 'column',
          gap: 'clamp(8px, 1.5vw, 12px)',
        }}>
          <div style={{ fontWeight: 700, color: '#667eea', fontSize: 'clamp(13px, 2vw, 15px)' }}>
            {editing ? 'Edit Module' : 'New Module'}
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
            <Input value={form.emoji || ''} onChange={(v) => setForm((f) => ({ ...f, emoji: v }))} placeholder="Emoji" style={{ width: 'clamp(50px, 10vw, 70px)' }} />
            <Input value={form.title || ''} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Module title" style={{ flex: 1, minWidth: 120 }} />
          </div>
          <Input value={form.description || ''} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Description (optional)" />
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
            <Select
              value={form.tier || 1}
              onChange={(v) => setForm((f) => ({ ...f, tier: Number(v) }))}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: n, label: `Tier ${n}` }))}
              style={{ flex: 1, minWidth: 100 }}
            />
            <Select
              value={form.status || 'draft'}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={['draft', 'published'].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              style={{ flex: 1, minWidth: 100 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'clamp(12px, 1.5vw, 14px)', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.locked} onChange={(e) => setForm((f) => ({ ...f, locked: e.target.checked }))} />
              Locked
            </label>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)' }}>
            <Btn onClick={save} color="#667eea">Save</Btn>
            <Btn onClick={() => setShowForm(false)} color="#aaa" outline>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Upload video button for modules */}
      <VideoUploadBtn bucket="module-videos" />

      {modules.map((mod) => {
        const tierColors = { 1: '#667eea', 2: '#e17055', 3: '#00b894', 4: '#fd79a8' }
        const color = tierColors[mod.tier] || '#aaa'
        return (
          <div key={mod.id} style={{
            background: 'white',
            borderRadius: 'clamp(12px, 2vw, 16px)',
            padding: 'clamp(10px, 2vw, 16px) clamp(12px, 2vw, 18px)',
            border: '1.5px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
          }}>
            <div style={{
              width: 'clamp(32px, 6vw, 44px)',
              height: 'clamp(32px, 6vw, 44px)',
              borderRadius: 'clamp(10px, 1.5vw, 14px)',
              background: `${color}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(16px, 3vw, 22px)',
              flexShrink: 0,
            }}>
              {mod.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)', color: '#2d3436' }}>{mod.title}</div>
              <div style={{ display: 'flex', gap: 'clamp(4px, 1vw, 8px)', marginTop: 4, flexWrap: 'wrap' }}>
                <Badge color={color}>Tier {mod.tier}</Badge>
                <Badge color={mod.status === 'published' ? '#00b894' : '#636e72'}>{mod.status}</Badge>
                {mod.locked && <Badge color="#e17055">🔒 Locked</Badge>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)', flexShrink: 0 }}>
              <button
                onClick={() => toggleField(mod.id, 'locked', !mod.locked)}
                style={{ background: '#f0f0f0', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
              >
                {mod.locked ? '🔓' : '🔒'}
              </button>
              <button
                onClick={() => toggleField(mod.id, 'status', mod.status === 'published' ? 'draft' : 'published')}
                style={{ background: '#f0f0f0', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
              >
                {mod.status === 'published' ? '📤' : '📢'}
              </button>
              <button
                onClick={() => openEdit(mod)}
                style={{ background: '#667eea22', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
              >
                ✏️
              </button>
              <button
                onClick={() => del(mod.id)}
                style={{ background: '#ff716522', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
              >
                🗑️
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── RICH TEXT EDITOR ──────────────────────────────────────────────────
function TiptapEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // This ensures the editor updates when you click "Edit" on a different lesson
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div style={{ border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden', background: 'white' }}>
      <div style={{ background: '#f5f5f5', padding: '8px', display: 'flex', gap: '8px', borderBottom: '1px solid #e0e0e0' }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={{ fontWeight: 'bold', padding: '4px 8px', background: editor.isActive('bold') ? '#ddd' : 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={{ fontStyle: 'italic', padding: '4px 8px', background: editor.isActive('italic') ? '#ddd' : 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={{ fontWeight: 'bold', padding: '4px 8px', background: editor.isActive('heading') ? '#ddd' : 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}>H3</button>
      </div>
      <div style={{ padding: '10px 12px', minHeight: '100px', cursor: 'text' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}



// ─── ADMIN LESSONS ─────────────────────────────────────────────────────
function AdminLessons({ supabase, lessons, setLessons, modules }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [showForm, setShowForm] = useState(false)

  const openEdit = (l) => { setForm({ ...l }); setEditing(l.id); setShowForm(true) }
  const openNew = () => {
    setForm({ module_id: modules[0]?.id || '', step_number: lessons.length + 1, title: '', video_url: '', knowledge_text: '' })
    setEditing(null)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.title.trim() || !form.module_id) return
    if (editing) {
      await supabase.from('lessons').update(form).eq('id', editing)
      setLessons((ls) => ls.map((l) => (l.id === editing ? { ...l, ...form } : l)))
    } else {
      const { data } = await supabase.from('lessons').insert(form).select().single()
      if (data) setLessons((ls) => [...ls, data])
    }
    setShowForm(false)
  }

const del = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    await supabase.from('lessons').delete().eq('id', id)
    setLessons((ls) => ls.filter((l) => l.id !== id))
  }

  const groupedByModule = {}
  lessons.forEach((l) => {
    if (!groupedByModule[l.module_id]) groupedByModule[l.module_id] = { module: modules.find((m) => m.id === l.module_id), lessons: [] }
    groupedByModule[l.module_id].lessons.push(l)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436' }}>
          📖 Lessons ({lessons.length})
        </div>
        <Btn onClick={openNew} color="#6c5ce7">+ New Lesson</Btn>
      </div>

      {showForm && (
        <div style={{
          background: 'white', border: '1.5px solid #6c5ce7',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(12px, 2vw, 20px)',
          display: 'flex', flexDirection: 'column',
          gap: 'clamp(8px, 1.5vw, 12px)',
        }}>
          <div style={{ fontWeight: 700, color: '#6c5ce7', fontSize: 'clamp(13px, 2vw, 15px)' }}>
            {editing ? 'Edit Lesson' : 'New Lesson'}
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
            <Select
              value={form.module_id || ''}
              onChange={(v) => setForm((f) => ({ ...f, module_id: Number(v) }))}
              options={modules.map((m) => ({ value: m.id, label: `${m.emoji} ${m.title}` }))}
              style={{ flex: 1, minWidth: 150 }}
            />
            <Input value={form.step_number || ''} onChange={(v) => setForm((f) => ({ ...f, step_number: Number(v) }))} placeholder="Step #" type="number" style={{ width: 'clamp(70px, 12vw, 100px)' }} />
          </div>
          <Input value={form.title || ''} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Lesson title" />
          <Input value={form.video_url || ''} onChange={(v) => setForm((f) => ({ ...f, video_url: v }))} placeholder="Video URL (YouTube link)" />
          
          
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 600 }}>Knowledge text:</div>
            <TiptapEditor
              value={form.knowledge_text || ''}
              onChange={(newHtml) => setForm((f) => ({ ...f, knowledge_text: newHtml }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)' }}>
            <Btn onClick={save} color="#6c5ce7">Save</Btn>
            <Btn onClick={() => setShowForm(false)} color="#aaa" outline>Cancel</Btn>
          </div>
        </div>
      )}

      {Object.entries(groupedByModule).map(([modId, group]) => (
        <div key={modId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)',
            color: '#636e72', padding: '4px 0',
            borderBottom: '2px solid #6c5ce722',
          }}>
            {group.module?.emoji} {group.module?.title || `Module #${modId}`}
          </div>
          {group.lessons.map((l) => (
            <div key={l.id} style={{
              background: 'white', borderRadius: 'clamp(10px, 1.5vw, 14px)',
              padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 16px)',
              border: '1.5px solid #eee', display: 'flex',
              alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)',
            }}>
              <div style={{
                width: 'clamp(28px, 5vw, 36px)', height: 'clamp(28px, 5vw, 36px)',
                borderRadius: '50%', background: '#6c5ce722',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)', color: '#6c5ce7',
                flexShrink: 0,
              }}>
                {l.step_number}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)', color: '#2d3436', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.title}
                </div>
                <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#aaa', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.video_url ? '📹 Video' : ''} {l.knowledge_text ? '🧠 Knowledge' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)', flexShrink: 0 }}>
                <button onClick={() => openEdit(l)}
                  style={{ background: '#6c5ce722', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
                >✏️</button>
                <button onClick={() => del(l.id)}
                  style={{ background: '#ff716522', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── ADMIN SHORTS ──────────────────────────────────────────────────────
function AdminShorts({ supabase, shorts, setShorts, modules }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [showForm, setShowForm] = useState(false)

  const DOMAINS = [
    'Space & Astronomy', 'Biology', 'Chemistry', 'Physics', 'Earth Science',
    'Weather', 'Human Body', 'Animals', 'Quantum Physics',
    'Technology & Robotics', 'Ocean Science', 'Dinosaurs & Fossils',
  ]

  const openEdit = (s) => { setForm({ ...s }); setEditing(s.id); setShowForm(true) }
  const openNew = () => {
    setForm({ title: '', domain: DOMAINS[0], duration: '0:30', module_id: null, star: 1, status: 'draft' })
    setEditing(null)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.title.trim()) return
    if (editing) {
      await supabase.from('shorts').update(form).eq('id', editing)
      setShorts((ss) => ss.map((s) => (s.id === editing ? { ...s, ...form } : s)))
    } else {
      const { data } = await supabase.from('shorts').insert(form).select().single()
      if (data) setShorts((ss) => [...ss, data])
    }
    setShowForm(false)
  }

const del = async (id) => {
    if (!window.confirm("Are you sure you want to delete this short?")) return;
    await supabase.from('shorts').delete().eq('id', id)
    setShorts((ss) => ss.filter((s) => s.id !== id))
  }

  const toggleStatus = async (id, status) => {
    await supabase.from('shorts').update({ status }).eq('id', id)
    setShorts((ss) => ss.map((s) => (s.id === id ? { ...s, status } : s)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436' }}>
          ▶️ Shorts ({shorts.length})
        </div>
        <Btn onClick={openNew} color="#e17055">+ New Short</Btn>
      </div>

      {/* Upload buttons */}
      <VideoUploadBtn bucket="short-videos" />

      {showForm && (
        <div style={{
          background: 'white', border: '1.5px solid #e17055',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(12px, 2vw, 20px)',
          display: 'flex', flexDirection: 'column',
          gap: 'clamp(8px, 1.5vw, 12px)',
        }}>
          <div style={{ fontWeight: 700, color: '#e17055', fontSize: 'clamp(13px, 2vw, 15px)' }}>
            {editing ? 'Edit Short' : 'New Short'}
          </div>
          <Input value={form.title || ''} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Short title" />
          <Select value={form.domain || DOMAINS[0]} onChange={(v) => setForm((f) => ({ ...f, domain: v }))} options={DOMAINS} />
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
            <Select
              value={form.module_id || ''}
              onChange={(v) => setForm((f) => ({ ...f, module_id: v ? Number(v) : null }))}
              options={[{ value: '', label: 'None' }, ...modules.map((m) => ({ value: m.id, label: m.title }))]}
              style={{ flex: 1, minWidth: 100 }}
            />
            <Select
              value={form.star || 1}
              onChange={(v) => setForm((f) => ({ ...f, star: Number(v) }))}
              options={[{ value: 1, label: '⭐ Star 1' }, { value: 2, label: '⭐ Star 2' }, { value: 3, label: '⭐ Star 3' }]}
              style={{ flex: 1, minWidth: 100 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
            <Input value={form.duration || ''} onChange={(v) => setForm((f) => ({ ...f, duration: v }))} placeholder="Duration e.g. 0:45" style={{ flex: 1, minWidth: 80 }} />
            <Select
              value={form.status || 'draft'}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={['draft', 'published'].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              style={{ flex: 1, minWidth: 100 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)' }}>
            <Btn onClick={save} color="#e17055">Save</Btn>
            <Btn onClick={() => setShowForm(false)} color="#aaa" outline>Cancel</Btn>
          </div>
        </div>
      )}

      {shorts.map((s) => (
        <div key={s.id} style={{
          background: 'white',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(10px, 2vw, 16px) clamp(12px, 2vw, 18px)',
          border: '1.5px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 1.5vw, 14px)',
        }}>
          <div style={{
            width: 'clamp(32px, 6vw, 44px)', height: 'clamp(32px, 6vw, 44px)',
            borderRadius: 'clamp(10px, 1.5vw, 14px)',
            background: '#636e7222', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(16px, 3vw, 22px)', flexShrink: 0,
          }}>
            ▶️
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)', color: '#2d3436', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.title}
            </div>
            <div style={{ display: 'flex', gap: 'clamp(4px, 1vw, 8px)', marginTop: 4, flexWrap: 'wrap' }}>
              <Badge color="#A29BFE">{s.domain}</Badge>
              <Badge color={s.status === 'published' ? '#00b894' : '#636e72'}>{s.status}</Badge>
              <Badge color="#636e72">{s.duration}</Badge>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)', flexShrink: 0 }}>
            <button onClick={() => toggleStatus(s.id, s.status === 'published' ? 'draft' : 'published')}
              style={{ background: '#f0f0f0', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
            >
              {s.status === 'published' ? '📤' : '📢'}
            </button>
            <button onClick={() => openEdit(s)}
              style={{ background: '#e1705522', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
            >
              ✏️
            </button>
            <button onClick={() => del(s.id)}
              style={{ background: '#ff716522', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ADMIN USERS ───────────────────────────────────────────────────────
function AdminUsers({ users }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  const filtered = users.filter(
    (u) =>
      (filter === 'all' || u.status === filter) &&
      u.username.toLowerCase().includes(search.toLowerCase())
  )

  const setStatus = async (id, status) => {
    await supabase.from('users').update({ status }).eq('id', id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 16px)' }}>
      <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436' }}>
        👥 Users ({users.length})
      </div>
      <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
        <Input value={search} onChange={setSearch} placeholder="Search username…" style={{ flex: 1, minWidth: 150 }} />
        <Select
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          style={{ width: 'clamp(100px, 20vw, 140px)' }}
        />
      </div>
      {filtered.map((u) => (
        <div key={u.id} style={{
          background: 'white',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(10px, 2vw, 16px) clamp(12px, 2vw, 18px)',
          border: '1.5px solid #eee',
        }}>
          {/* User header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)' }}>
            <div style={{
              width: 'clamp(32px, 6vw, 44px)', height: 'clamp(32px, 6vw, 44px)',
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(14px, 2.5vw, 18px)', color: 'white', fontWeight: 700, flexShrink: 0,
            }}>
              {u.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)', color: '#2d3436' }}>{u.username}</div>
              <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#aaa' }}>{u.rank} · Joined {u.joined}</div>
            </div>
            <Badge color={u.status === 'active' ? '#00b894' : '#e17055'}>{u.status}</Badge>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 'clamp(8px, 1.5vw, 14px)',
            marginTop: 'clamp(8px, 1.5vw, 12px)',
            padding: 'clamp(6px, 1vw, 10px) 0',
            borderTop: '1px solid #f0f0f0',
          }}>
            {[
              ['⭐ XP', u.xp],
              ['🔥 Streak', u.streak],
              ['📦 Modules', u.modules_completed],
            ].map(([l, v]) => (
              <div key={l} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 'clamp(13px, 2vw, 16px)', color: '#2d3436' }}>{v}</div>
                <div style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', color: '#aaa' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Actions row */}
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', marginTop: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
            {u.status === 'active' ? (
              <Btn onClick={() => setStatus(u.id, 'suspended')} color="#e17055" outline style={{ flex: 1, fontSize: 'clamp(10px, 1.5vw, 12px)', minWidth: 80 }}>
                🚫 Suspend
              </Btn>
            ) : (
              <Btn onClick={() => setStatus(u.id, 'active')} color="#00b894" outline style={{ flex: 1, fontSize: 'clamp(10px, 1.5vw, 12px)', minWidth: 80 }}>
                ✅ Restore
              </Btn>
            )}
            <Btn onClick={() => alert(`View profile for ${u.username}`)} color="#667eea" outline style={{ flex: 1, fontSize: 'clamp(10px, 1.5vw, 12px)', minWidth: 80 }}>
              👤 View Profile
            </Btn>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ADMIN QUIZZES ─────────────────────────────────────────────────────
function AdminQuizzes({ supabase, quizzes, setQuizzes, modules }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [questionForm, setQuestionForm] = useState({})
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [expandedQuiz, setExpandedQuiz] = useState(null)

  const openEdit = (q) => {
    setForm({ module_id: q.module_id, lesson_id: q.lesson_id || '', title: q.title, passing_score: q.passing_score, max_attempts: q.max_attempts })
    setEditing(q.id)
    setShowForm(true)
  }
  const openNew = () => {
    setForm({ module_id: modules[0]?.id || '', lesson_id: '', title: 'Quiz', passing_score: 80, max_attempts: 3 })
    setEditing(null)
    setShowForm(true)
  }

  const save = async () => {
    if (!form.title.trim() || !form.module_id) return
    const payload = { ...form, lesson_id: form.lesson_id || null, module_id: Number(form.module_id) }
    if (editing) {
      await supabase.from('quizzes').update(payload).eq('id', editing)
      setQuizzes((qs) => qs.map((q) => (q.id === editing ? { ...q, ...payload } : q)))
    } else {
      const { data } = await supabase.from('quizzes').insert(payload).select('*, quiz_questions(*)').single()
      if (data) setQuizzes((qs) => [...qs, data])
    }
    setShowForm(false)
  }

 const del = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    await supabase.from('quizzes').delete().eq('id', id)
    setQuizzes((qs) => qs.filter((q) => q.id !== id))
  }

  const openNewQuestion = (quizId) => {
    setQuestionForm({ quiz_id: quizId, question_text: '', options: ['', '', '', ''], correct_index: 0, sort_order: 0 })
    setShowQuestionForm(true)
  }

  const saveQuestion = async () => {
    if (!questionForm.question_text.trim() || questionForm.options.some((o) => !o.trim())) return
    const payload = {
      quiz_id: questionForm.quiz_id,
      question_text: questionForm.question_text,
      options: questionForm.options,
      correct_index: Number(questionForm.correct_index),
      sort_order: questionForm.sort_order || 0,
    }
    const { data } = await supabase.from('quiz_questions').insert(payload).select().single()
    if (data) {
      setQuizzes((qs) => qs.map((q) => (q.id === data.quiz_id ? { ...q, quiz_questions: [...(q.quiz_questions || []), data] } : q)))
    }
    setShowQuestionForm(false)
  }

const delQuestion = async (questionId, quizId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    await supabase.from('quiz_questions').delete().eq('id', questionId)
    setQuizzes((qs) => qs.map((q) => (q.id === quizId ? { ...q, quiz_questions: (q.quiz_questions || []).filter((qq) => qq.id !== questionId) } : q)))
  }

  const getModTitle = (id) => modules.find((m) => m.id === id)?.title || `Module #${id}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436' }}>
          ❓ Quizzes ({quizzes.length})
        </div>
        <Btn onClick={openNew} color="#6c5ce7">+ New Quiz</Btn>
      </div>

      {/* Quiz form */}
      {showForm && (
        <div style={{
          background: 'white', border: '1.5px solid #6c5ce7',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(12px, 2vw, 20px)',
          display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 12px)',
        }}>
          <div style={{ fontWeight: 700, color: '#6c5ce7', fontSize: 'clamp(13px, 2vw, 15px)' }}>
            {editing ? 'Edit Quiz' : 'New Quiz'}
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
            <Select
              value={form.module_id || ''}
              onChange={(v) => setForm((f) => ({ ...f, module_id: Number(v) }))}
              options={modules.map((m) => ({ value: m.id, label: `${m.emoji} ${m.title}` }))}
              style={{ flex: 1 }}
            />
            <Input value={form.title || ''} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Quiz title" style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)', flexWrap: 'wrap' }}>
            <Input value={form.passing_score || ''} onChange={(v) => setForm((f) => ({ ...f, passing_score: Number(v) }))} placeholder="Passing score %" type="number" style={{ width: 'clamp(100px, 20vw, 140px)' }} />
            <Input value={form.max_attempts || ''} onChange={(v) => setForm((f) => ({ ...f, max_attempts: Number(v) }))} placeholder="Max attempts" type="number" style={{ width: 'clamp(100px, 20vw, 140px)' }} />
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)' }}>
            <Btn onClick={save} color="#6c5ce7">Save</Btn>
            <Btn onClick={() => setShowForm(false)} color="#aaa" outline>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Question form */}
      {showQuestionForm && (
        <div style={{
          background: 'white', border: '1.5px solid #00b894',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(12px, 2vw, 20px)',
          display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 12px)',
        }}>
          <div style={{ fontWeight: 700, color: '#00b894', fontSize: 'clamp(13px, 2vw, 15px)' }}>
            New Question
          </div>
          <Input value={questionForm.question_text || ''} onChange={(v) => setQuestionForm((f) => ({ ...f, question_text: v }))} placeholder="Question text" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                name="correct"
                checked={questionForm.correct_index === i}
                onChange={() => setQuestionForm((f) => ({ ...f, correct_index: i }))}
              />
              <Input
                value={questionForm.options[i] || ''}
                onChange={(v) => {
                  const opts = [...questionForm.options]
                  opts[i] = v
                  setQuestionForm((f) => ({ ...f, options: opts }))
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#aaa', marginTop: -4 }}>
            Select the radio button next to the correct answer.
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1vw, 10px)' }}>
            <Btn onClick={saveQuestion} color="#00b894">Add Question</Btn>
            <Btn onClick={() => setShowQuestionForm(false)} color="#aaa" outline>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Quiz list */}
      {quizzes.map((q) => {
        const qCount = q.quiz_questions?.length || 0
        const isExpanded = expandedQuiz === q.id
        return (
          <div key={q.id} style={{
            background: 'white', borderRadius: 'clamp(12px, 2vw, 16px)',
            border: '1.5px solid #eee', overflow: 'hidden',
          }}>
            <div style={{
              padding: 'clamp(10px, 2vw, 16px) clamp(12px, 2vw, 18px)',
              display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)',
              cursor: 'pointer',
            }}
              onClick={() => setExpandedQuiz(isExpanded ? null : q.id)}
            >
              <div style={{
                width: 'clamp(32px, 6vw, 44px)', height: 'clamp(32px, 6vw, 44px)',
                borderRadius: '50%', background: '#6c5ce722',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(14px, 2.5vw, 18px)', flexShrink: 0,
              }}>
                ❓
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)', color: '#2d3436' }}>{q.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <Badge color="#6c5ce7">{getModTitle(q.module_id)}</Badge>
                  <Badge color="#636e72">{qCount} question{qCount !== 1 ? 's' : ''}</Badge>
                  <Badge color="#00b894">Pass: {q.passing_score}%</Badge>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={(e) => { e.stopPropagation(); openEdit(q) }}
                  style={{ background: '#6c5ce722', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
                >✏️</button>
                <button onClick={(e) => { e.stopPropagation(); del(q.id) }}
                  style={{ background: '#ff716522', border: 'none', borderRadius: 'clamp(6px, 1vw, 10px)', padding: 'clamp(4px, 0.8vw, 8px) clamp(6px, 1vw, 10px)', cursor: 'pointer', fontSize: 'clamp(11px, 1.5vw, 14px)' }}
                >🗑️</button>
              </div>
            </div>
            {isExpanded && (
              <div style={{ borderTop: '1px solid #eee', padding: 'clamp(10px, 1.5vw, 16px) clamp(12px, 2vw, 18px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(8px, 1.5vw, 12px)' }}>
                  <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 1.5vw, 13px)', color: '#636e72' }}>
                    Questions ({qCount})
                  </div>
                  <Btn onClick={() => openNewQuestion(q.id)} color="#00b894" style={{ fontSize: 'clamp(10px, 1.5vw, 12px)' }}>
                    + Add Question
                  </Btn>
                </div>
                {(q.quiz_questions || []).map((qq, i) => (
                  <div key={qq.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', background: i % 2 === 0 ? '#fafafa' : 'white',
                    borderRadius: 8, marginBottom: 4,
                  }}>
                    <div style={{ fontWeight: 700, color: '#aaa', fontSize: 12, width: 24 }}>{i + 1}.</div>
                    <div style={{ flex: 1, fontSize: 'clamp(12px, 1.5vw, 13px)', color: '#2d3436' }}>
                      {qq.question_text}
                    </div>
                    <Badge color="#00b894">✓ {(qq.options || [])[qq.correct_index]}</Badge>
                    <button onClick={() => delQuestion(qq.id, q.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ff7675' }}
                    >✕</button>
                  </div>
                ))}
                {qCount === 0 && (
                  <div style={{ textAlign: 'center', padding: 16, color: '#aaa', fontSize: 13 }}>
                    No questions yet. Click "Add Question" to create one.
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── BADGE ─────────────────────────────────────────────────────────────
function Badge({ color, children }) {
  return (
    <span style={{
      background: `${color}22`, color,
      border: `1px solid ${color}44`,
      borderRadius: 20, padding: '2px 8px',
      fontSize: 11, fontWeight: 700,
    }}>
      {children}
    </span>
  )
}
