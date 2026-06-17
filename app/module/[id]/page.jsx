'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import QuizEngine from '@/components/QuizEngine'
import { Btn } from '@/components/ui/Btn'

export default function ModuleFlowPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [mod, setMod] = useState(null)
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [progress, setProgress] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stepIdx, setStepIdx] = useState(0)
  const [quizResults, setQuizResults] = useState({})
  const [battleVoted, setBattleVoted] = useState(false)
  const [saving, setSaving] = useState(false)

  const [steps, setSteps] = useState([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prof } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
    setProfile(prof)

    const { data: m } = await supabase.from('modules').select('*').eq('id', id).single()
    setMod(m)

    // Check lock status with auto-unlock logic
    if (m && prof) {
      const { data: allMods } = await supabase.from('modules').select('*').order('sort_order')
      const { data: allProg } = await supabase.from('user_progress').select('*').eq('user_id', prof.id)
      const progMap = {}
      ;(allProg || []).forEach((p) => { progMap[p.module_id] = p })
      const { data: myProg } = await supabase.from('user_progress').select('*').eq('user_id', prof.id).eq('module_id', id).single()
      const myStars = myProg?.stars || 0
      const tiers = [...new Set((allMods || []).map((x) => x.tier))].sort((a, b) => a - b)
      let prevTierComplete = true
      let isUnlocked = false
      for (const tier of tiers) {
        const tierMods = (allMods || []).filter((x) => x.tier === tier && x.status === 'published')
        if (tierMods.some((x) => x.id === m.id)) {
          isUnlocked = prevTierComplete
          break
        }
        prevTierComplete = tierMods.every((x) => (progMap[x.id]?.stars || 0) >= 3)
      }
      if (m.locked && !isUnlocked && myStars === 0) {
        router.push('/dashboard')
        return
      }
    }

    const { data: ls } = await supabase.from('lessons').select('*').eq('module_id', id).order('step_number')
    setLessons(ls || [])

    const { data: qs } = await supabase.from('quizzes').select('*, quiz_questions(*)').eq('module_id', id)
    setQuizzes(qs || [])

    if (prof) {
      const { data: pr } = await supabase.from('user_progress').select('*').eq('user_id', prof.id).eq('module_id', id).single()
      setProgress(pr)
    }

    setLoading(false)
  }

  const buildSteps = useCallback(() => {
    const s = []
    s.push({ type: 'intro', title: `Welcome to ${mod?.title || 'Module'}` })

    const ls = lessons.length > 0 ? lessons : []
    const qs = quizzes.length > 0 ? quizzes : []

    const starCount = Math.max(ls.length, qs.length, 1)
    for (let i = 0; i < Math.min(starCount, 3); i++) {
      const lesson = ls[i] || null
      const quiz = qs[i] || null

      if (lesson?.video_url) {
        s.push({ type: 'video', lesson, star: i + 1, label: `Star ${i + 1} Video` })
      }
      if (lesson?.knowledge_text) {
        s.push({ type: 'knowledge', lesson, star: i + 1, label: `Star ${i + 1} Knowledge` })
      }
      if (quiz) {
        s.push({ type: 'quiz', quiz, star: i + 1, label: `Star ${i + 1} Quiz` })
      }
    }

    if (starCount >= 3) {
      s.push({ type: 'battle', label: 'Science Battle' })
    }

    s.push({ type: 'complete', label: 'Complete' })
    return s
  }, [mod, lessons, quizzes])

  useEffect(() => {
    if (!loading) {
      const s = buildSteps()
      setSteps(s)
      if (progress) {
        const resumeIdx = Math.min(progress.steps_completed?.length || 0, s.length - 1)
        setStepIdx(resumeIdx)
      }
    }
  }, [loading, buildSteps, progress])

  const currentStep = steps[stepIdx] || null
  const isLast = stepIdx >= steps.length - 1
  const earnedStars = progress?.stars || 0

  const goNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
  }

  const goBack = () => {
    router.push('/dashboard')
  }

  const saveProgress = async (update) => {
    if (!profile) return
    setSaving(true)
    const completedSteps = [...(progress?.steps_completed || []), stepIdx]
    const upd = {
      user_id: profile.id,
      module_id: Number(id),
      stars: Math.max(earnedStars, update?.stars || 0),
      steps_completed: [...new Set(completedSteps)],
      quiz_scores: progress?.quiz_scores || [],
      ...(update?.xp ? { completed: earnedStars + (update?.stars || 0) >= 3 } : {}),
    }
    if (progress?.id) {
      await supabase.from('user_progress').update(upd).eq('id', progress.id)
    } else {
      const { data } = await supabase.from('user_progress').insert(upd).select().single()
      if (data) setProgress(data)
    }
    if (update?.xp) {
      const newXp = (profile.xp || 0) + update.xp
      await supabase.from('users').update({ xp: newXp, modules_completed: earnedStars + (update?.stars || 0) >= 3 ? (profile.modules_completed || 0) + 1 : profile.modules_completed }).eq('id', profile.id)
      setProfile((p) => ({ ...p, xp: newXp }))
    }
    setProgress((p) => ({ ...p, ...upd }))
    setSaving(false)
  }

  const handleQuizComplete = async (result) => {
    setQuizResults((r) => ({ ...r, [currentStep.quiz.id]: result }))
    if (result.passed) {
      const newStars = Math.min(earnedStars + 1, 3)
      const xpEarned = (currentStep.star <= 2 ? 15 : 25) + (result.score === 100 ? 10 : 0)
      await saveProgress({ stars: newStars, xp: xpEarned })
    }
  }

  const handleBattleVote = () => {
    setBattleVoted(true)
    saveProgress({ xp: 25 })
  }

  const handleCompleteModule = async () => {
    await saveProgress({ stars: 3, xp: 0 })
    goBack()
  }

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', fontSize: 18, color: '#667eea' }}>
        🚀 Loading module…
      </div>
    )
  }

  if (!mod) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#636e72' }}>Module not found</div>
        <Btn onClick={goBack} color="#667eea">Back to Dashboard</Btn>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0f4ff', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: 'clamp(10px, 2vw, 16px) clamp(12px, 3vw, 24px)',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goBack} style={{ background: 'transparent', border: 'none', fontSize: 'clamp(18px, 3vw, 22px)', cursor: 'pointer', padding: 4 }}>←</button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436' }}>
              {mod.emoji} {mod.title}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
              {[1, 2, 3].map((s) => (
                <span key={s} style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>
                  {s <= earnedStars ? '⭐' : '☆'}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#aaa' }}>
          Step {Math.min(stepIdx + 1, steps.length)}/{steps.length}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px, 2vw, 24px)', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 20px)' }}>
        {currentStep?.type === 'intro' && (
          <IntroStep mod={mod} onStart={goNext} />
        )}
        {currentStep?.type === 'video' && (
          <VideoStep lesson={currentStep.lesson} star={currentStep.star} onNext={goNext} />
        )}
        {currentStep?.type === 'knowledge' && (
          <KnowledgeStep lesson={currentStep.lesson} star={currentStep.star} onNext={goNext} />
        )}
        {currentStep?.type === 'quiz' && (
          <div style={{ background: 'white', borderRadius: 'clamp(12px, 2vw, 16px)', padding: 'clamp(14px, 2.5vw, 24px)', border: '1.5px solid #eee' }}>
            <QuizEngine
              key={currentStep.quiz.id}
              questions={currentStep.quiz.quiz_questions || []}
              passingScore={currentStep.quiz.passing_score || 80}
              title={currentStep.quiz.title || `Star ${currentStep.star} Quiz`}
              onComplete={(result) => handleQuizComplete(result)}
              onContinue={goNext}
            />
          </div>
        )}
        {currentStep?.type === 'battle' && (
          <BattleStep voted={battleVoted} onVote={handleBattleVote} onNext={goNext} />
        )}
        {currentStep?.type === 'complete' && (
          <CompleteStep mod={mod} earnedStars={earnedStars} onFinish={handleCompleteModule} />
        )}
      </div>

      {/* Footer navigation */}
      {currentStep && !['intro', 'quiz', 'battle', 'complete'].includes(currentStep.type) && (
        <div style={{
          background: 'white',
          borderTop: '1px solid #eee',
          padding: 'clamp(10px, 2vw, 16px) clamp(12px, 3vw, 24px)',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <Btn onClick={goNext} color="#667eea" style={{ padding: '10px 24px' }}>
            Continue →
          </Btn>
        </div>
      )}

      {saving && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{ fontSize: 14, color: '#667eea', fontWeight: 700 }}>Saving…</div>
        </div>
      )}
    </div>
  )
}

// ─── INTRO ────────────────────────────────────────────────────────────
function IntroStep({ mod, onStart }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', gap: 16,
      padding: 'clamp(16px, 3vw, 40px)',
    }}>
      <div style={{ fontSize: 'clamp(48px, 12vw, 80px)', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.1))' }}>
        {mod.emoji}
      </div>
      <div style={{ fontWeight: 800, fontSize: 'clamp(22px, 4vw, 32px)', color: '#2d3436' }}>
        {mod.title}
      </div>
      {mod.description && (
        <div style={{ fontSize: 'clamp(13px, 2vw, 16px)', color: '#636e72', maxWidth: 400 }}>
          {mod.description}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{
            background: '#667eea22', borderRadius: 12, padding: '8px 16px',
            fontWeight: 600, fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#667eea',
          }}>
            ⭐ Star {s}
          </div>
        ))}
      </div>
      <Btn onClick={onStart} color="#667eea" style={{ padding: '12px 32px', fontSize: 'clamp(14px, 2.5vw, 18px)', marginTop: 8 }}>
        Start Learning 🚀
      </Btn>
    </div>
  )
}

// ─── VIDEO ────────────────────────────────────────────────────────────
function VideoStep({ lesson, star, onNext }) {
  const isYouTube = lesson.video_url?.includes('youtube.com') || lesson.video_url?.includes('youtu.be')

  let embedUrl = null
  if (isYouTube) {
    const match = lesson.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      gap: 'clamp(12px, 2vw, 20px)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: '#667eea22', borderRadius: 8, padding: '4px 10px', fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#667eea' }}>
          ⭐ Star {star}
        </span>
        Watch & Learn
      </div>

      {embedUrl ? (
        <div style={{
          position: 'relative',
          paddingBottom: '56.25%',
          height: 0,
          overflow: 'hidden',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          background: '#000',
        }}>
          <iframe
            src={embedUrl}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              border: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : lesson.video_url ? (
        <video
          controls
          style={{ width: '100%', borderRadius: 'clamp(12px, 2vw, 16px)', background: '#000' }}
          src={lesson.video_url}
        />
      ) : (
        <div style={{
          background: 'linear-gradient(135deg,#667eea22,#764ba222)',
          borderRadius: 'clamp(12px, 2vw, 16px)',
          padding: 'clamp(32px, 6vw, 60px)',
          textAlign: 'center',
          color: '#667eea',
          fontSize: 'clamp(14px, 2.5vw, 18px)',
          fontWeight: 700,
        }}>
          <div style={{ fontSize: 'clamp(36px, 8vw, 52px)', marginBottom: 8 }}>📹</div>
          Video coming soon!
        </div>
      )}

      <Btn onClick={onNext} color="#667eea" style={{ padding: '10px 24px', alignSelf: 'flex-end' }}>
        Got it! →
      </Btn>
    </div>
  )
}

// ─── KNOWLEDGE ────────────────────────────────────────────────────────
function KnowledgeStep({ lesson, star, onNext }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      gap: 'clamp(12px, 2vw, 20px)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: '#00b89422', borderRadius: 8, padding: '4px 10px', fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#00b894' }}>
          ⭐ Star {star}
        </span>
        What You Learned
      </div>

      <div style={{
        background: 'white',
        borderRadius: 'clamp(12px, 2vw, 16px)',
        padding: 'clamp(16px, 3vw, 28px)',
        border: '1.5px solid #eee',
        fontSize: 'clamp(14px, 2vw, 16px)',
        lineHeight: 1.6,
        color: '#2d3436',
        whiteSpace: 'pre-wrap',
      }}>
        {lesson.knowledge_text || (
          <div style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>
            <div style={{ fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: 8 }}>🧠</div>
            Knowledge content coming soon!
          </div>
        )}
      </div>

      <Btn onClick={onNext} color="#667eea" style={{ padding: '10px 24px', alignSelf: 'flex-end' }}>
        Ready for Quiz! →
      </Btn>
    </div>
  )
}

// ─── BATTLE ───────────────────────────────────────────────────────────
function BattleStep({ voted, onVote, onNext }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      gap: 'clamp(12px, 2vw, 20px)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436', display: 'flex', alignItems: 'center', gap: 8 }}>
        ⚔️ Science Battle
      </div>
      <div style={{
        background: 'linear-gradient(135deg,#e17055,#d63031)',
        borderRadius: 'clamp(12px, 2vw, 16px)',
        padding: 'clamp(14px, 2.5vw, 24px)',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', opacity: 0.8 }}>
          MODULE 3 — STAR 3
        </div>
        <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', marginTop: 4 }}>
          "Is a virus alive or not alive?"
        </div>
      </div>
      {!voted ? (
        <div style={{ display: 'flex', gap: 10 }}>
          {['🦠 ALIVE', '💀 NOT ALIVE'].map((v) => (
            <button
              key={v}
              onClick={() => onVote()}
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
          <div style={{ background: '#00b894', borderRadius: 12, padding: 12, color: 'white', fontWeight: 700, textAlign: 'center' }}>
            ✅ Vote recorded! +25 XP
          </div>
          {[
            ['🦠 ALIVE', 'Viruses evolve and adapt.', '#A29BFE'],
            ['💀 NOT ALIVE', "Can't survive without a host.", '#fd79a8'],
          ].map(([s, t, c]) => (
            <div key={s} style={{ background: `${c}22`, border: `1.5px solid ${c}`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: c }}>{s}</div>
              <div style={{ fontSize: 'clamp(12px, 1.5vw, 14px)', marginTop: 4 }}>{t}</div>
            </div>
          ))}
        </div>
      )}
      {voted && (
        <Btn onClick={onNext} color="#667eea" style={{ padding: '10px 24px', alignSelf: 'flex-end' }}>
          Continue →
        </Btn>
      )}
    </div>
  )
}

// ─── COMPLETE ─────────────────────────────────────────────────────────
function CompleteStep({ mod, earnedStars, onFinish }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', gap: 16,
      padding: 'clamp(16px, 3vw, 40px)',
    }}>
      <div style={{ fontSize: 'clamp(48px, 12vw, 80px)' }}>
        {earnedStars >= 3 ? '🏆' : '📖'}
      </div>
      <div style={{ fontWeight: 800, fontSize: 'clamp(22px, 4vw, 32px)', color: '#2d3436' }}>
        {earnedStars >= 3 ? 'Module Complete!' : 'Keep Going!'}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3].map((s) => (
          <span key={s} style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
            {s <= earnedStars ? '⭐' : '☆'}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 'clamp(13px, 2vw, 16px)', color: '#636e72', maxWidth: 400 }}>
        {earnedStars >= 3
          ? 'Amazing work! You completed this module with all 3 stars!'
          : `You earned ${earnedStars}/3 stars so far. Come back to earn more!`}
      </div>
      <Btn onClick={onFinish} color="#667eea" style={{ padding: '12px 32px', fontSize: 'clamp(14px, 2.5vw, 18px)', marginTop: 8 }}>
        Back to Dashboard
      </Btn>
    </div>
  )
}
