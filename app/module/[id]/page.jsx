'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import QuizEngine from '@/components/QuizEngine'

function openMoji(hex) {
  return `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${hex}.svg`
}

function dicebear(seed, background = 'c4b5fd') {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${background}`
}

function getProfileSeed(profile) {
  return profile?.username || profile?.email || 'Little Genius'
}

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
  const [battleChoice, setBattleChoice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [steps, setSteps] = useState([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: prof } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
    setProfile(prof)

    const { data: moduleData } = await supabase.from('modules').select('*').eq('id', id).single()
    setMod(moduleData)

    if (moduleData && prof) {
      const { data: allMods } = await supabase.from('modules').select('*').order('sort_order')
      const { data: allProg } = await supabase.from('user_progress').select('*').eq('user_id', prof.id)
      const progMap = {}
      ;(allProg || []).forEach((item) => {
        progMap[item.module_id] = item
      })
      const { data: myProg } = await supabase.from('user_progress').select('*').eq('user_id', prof.id).eq('module_id', id).single()
      const myStars = myProg?.stars || 0
      const tiers = [...new Set((allMods || []).map((item) => item.tier))].sort((a, b) => a - b)
      let previousTierComplete = true
      let unlocked = false

      for (const tier of tiers) {
        const tierMods = (allMods || []).filter((item) => item.tier === tier && item.status === 'published')
        if (tierMods.some((item) => item.id === moduleData.id)) {
          unlocked = previousTierComplete
          break
        }
        previousTierComplete = tierMods.every((item) => (progMap[item.id]?.stars || 0) >= 3)
      }

      if (moduleData.locked && !unlocked && myStars === 0) {
        router.push('/dashboard')
        return
      }
    }

    const { data: lessonData } = await supabase.from('lessons').select('*').eq('module_id', id).order('step_number')
    const { data: quizData } = await supabase.from('quizzes').select('*, quiz_questions(*)').eq('module_id', id)

    setLessons(lessonData || [])
    setQuizzes(quizData || [])

    if (prof) {
      const { data: pr } = await supabase.from('user_progress').select('*').eq('user_id', prof.id).eq('module_id', id).single()
      setProgress(pr)
    }

    setLoading(false)
  }

  const buildSteps = useCallback(() => {
    const built = [{ type: 'intro' }]
    const lessonList = lessons.length > 0 ? lessons : []
    const quizList = quizzes.length > 0 ? quizzes : []
    const starCount = Math.max(lessonList.length, quizList.length, 1)

    for (let i = 0; i < Math.min(starCount, 3); i += 1) {
      const lesson = lessonList[i] || null
      const quiz = quizList[i] || null

      if (lesson?.video_url) built.push({ type: 'video', lesson, star: i + 1 })
      if (lesson?.knowledge_text) built.push({ type: 'knowledge', lesson, star: i + 1 })
      if (quiz) built.push({ type: 'quiz', quiz, star: i + 1 })
    }

    if (starCount >= 3) built.push({ type: 'battle' })
    built.push({ type: 'complete' })
    return built
  }, [lessons, quizzes])

  useEffect(() => {
    if (!loading) {
      const built = buildSteps()
      setSteps(built)
      if (progress) {
        const resumeIdx = Math.min(progress.steps_completed?.length || 0, built.length - 1)
        setStepIdx(resumeIdx)
      }
    }
  }, [loading, buildSteps, progress])

  const currentStep = steps[stepIdx] || null
  const earnedStars = progress?.stars || 0

  const goBack = () => {
    router.push('/dashboard')
  }

  const goNext = async () => {
    if (stepIdx >= steps.length - 1) return

    const step = currentStep
    if (step && (step.type === 'video' || step.type === 'knowledge')) {
      setSaving(true)
      const completedSteps = [...new Set([...(progress?.steps_completed || []), stepIdx])]
      const payload = {
        user_id: profile.id,
        module_id: Number(id),
        steps_completed: completedSteps,
        stars: progress?.stars || 0,
        quiz_scores: progress?.quiz_scores || [],
      }
      await supabase.from('user_progress').upsert(payload, { onConflict: 'user_id,module_id' })
      setProgress((prev) => ({ ...(prev || {}), ...payload }))
      setSaving(false)
    }

    setStepIdx((prev) => prev + 1)
  }

  const saveProgress = async (update) => {
    if (!profile) return
    setSaving(true)

    const completedSteps = [...(progress?.steps_completed || []), stepIdx]
    const payload = {
      user_id: profile.id,
      module_id: Number(id),
      stars: Math.max(earnedStars, update?.stars || 0),
      steps_completed: [...new Set(completedSteps)],
      quiz_scores: progress?.quiz_scores || [],
      ...(update?.xp ? { completed: earnedStars + (update?.stars || 0) >= 3 } : {}),
    }

    if (progress?.id) {
      await supabase.from('user_progress').update(payload).eq('id', progress.id)
    } else {
      const { data } = await supabase.from('user_progress').insert(payload).select().single()
      if (data) setProgress(data)
    }

    if (update?.xp) {
      const newXp = (profile.xp || 0) + update.xp
      const completedCount = earnedStars + (update?.stars || 0) >= 3 ? (profile.modules_completed || 0) + 1 : profile.modules_completed
      await supabase.from('users').update({ xp: newXp, modules_completed: completedCount }).eq('id', profile.id)
      setProfile((prev) => ({ ...prev, xp: newXp, modules_completed: completedCount }))
    }

    setProgress((prev) => ({ ...(prev || {}), ...payload }))
    setSaving(false)
  }

  const handleQuizComplete = async (result) => {
    if (result.passed) {
      const newStars = Math.min(earnedStars + 1, 3)
      const xpEarned = (currentStep.star <= 2 ? 15 : 25) + (result.score === 100 ? 10 : 0)
      await saveProgress({ stars: newStars, xp: xpEarned })
    }
  }

  const handleBattleVote = async (choice) => {
    setBattleChoice(choice)
    await saveProgress({ xp: 25 })
  }

  const handleCompleteModule = async () => {
    await saveProgress({ stars: 3, xp: 0 })
    goBack()
  }

  if (loading) {
    return (
      <div style={loadingShell}>
        <div style={loadingCard}>
          <img src={openMoji('1F9EA')} alt="" width="72" height="72" />
          <div style={loadingTitle}>Loading your mission...</div>
        </div>
      </div>
    )
  }

  if (!mod) {
    return (
      <div style={loadingShell}>
        <div style={loadingCard}>
          <img src={openMoji('1F50D')} alt="" width="72" height="72" />
          <div style={loadingTitle}>Module not found</div>
          <button onClick={goBack} style={ghostButton}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div style={screenShell}>
      <div style={cloudOne} />
      <div style={cloudTwo} />

      <div style={appFrame}>
        <div style={headerBar}>
          <div style={headerTop}>
            <div style={brandBadge}>
              <img src={openMoji('1F4A1')} alt="" width="20" height="20" />
              <span>Little Genius</span>
            </div>

            <div style={headerPills}>
              <HeaderPill icon="2B50" value={profile?.xp?.toLocaleString() || '0'} />
              <HeaderPill icon="1F525" value={profile?.streak || '0'} />
              <img src={dicebear(getProfileSeed(profile))} alt="" width="42" height="42" style={profileThumb} />
            </div>
          </div>

          <div style={headerBottom}>
            <button onClick={goBack} style={backButton}>←</button>
            <div style={{ flex: 1 }}>
              <div style={moduleTitle}>{mod.title}</div>
              <div style={moduleHeaderMeta}>
                <StarRow count={earnedStars} />
                <span>{currentStep?.type === 'complete' ? 'Finish line' : `Step ${Math.min(stepIdx + 1, steps.length)}/${steps.length}`}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={contentShell}>
          {currentStep?.type === 'intro' && <IntroStep mod={mod} onStart={goNext} />}
          {currentStep?.type === 'video' && <VideoStep lesson={currentStep.lesson} star={currentStep.star} onNext={goNext} />}
          {currentStep?.type === 'knowledge' && <KnowledgeStep lesson={currentStep.lesson} star={currentStep.star} onNext={goNext} />}
          {currentStep?.type === 'quiz' && (
            <div style={quizShell}>
              <QuizEngine
                key={currentStep.quiz.id}
                questions={currentStep.quiz.quiz_questions || []}
                passingScore={currentStep.quiz.passing_score || 80}
                title={currentStep.quiz.title || `Star ${currentStep.star} Quiz`}
                onComplete={handleQuizComplete}
                onContinue={goNext}
              />
            </div>
          )}
          {currentStep?.type === 'battle' && <BattleStep choice={battleChoice} onVote={handleBattleVote} onNext={goNext} />}
          {currentStep?.type === 'complete' && <CompleteStep mod={mod} earnedStars={earnedStars} onFinish={handleCompleteModule} />}
        </div>

        {currentStep && !['intro', 'quiz', 'battle', 'complete'].includes(currentStep.type) && (
          <div style={footerBar}>
            <button onClick={goNext} style={primaryButton}>Continue</button>
          </div>
        )}
      </div>

      {saving && (
        <div style={savingOverlay}>
          <div style={savingCard}>Saving your progress...</div>
        </div>
      )}
    </div>
  )
}

function IntroStep({ mod, onStart }) {
  return (
    <div style={stack16}>
      <div style={{ ...heroPanel, background: '#73a7f7', borderColor: '#4f83e3' }}>
        <div style={heroIconWrap}>
          <span style={heroEmoji}>{mod.emoji}</span>
        </div>
        <div style={heroTitle}>{mod.title}</div>
        <div style={heroText}>{mod.description || 'A short science mission with videos, quizzes, and one big battle at the end.'}</div>

        <div style={starBadgeRow}>
          {[1, 2, 3].map((star) => (
            <span key={star} style={starBadge}>Star {star}</span>
          ))}
        </div>

        <button onClick={onStart} style={playButton}>Start Learning</button>
      </div>

      <InfoStrip icon="1F680" title="Mission flow" text="Watch a short video, learn one big idea, answer a quiz, and earn stars." />
    </div>
  )
}

function VideoStep({ lesson, star, onNext }) {
  const isYouTube = lesson.video_url?.includes('youtube.com') || lesson.video_url?.includes('youtu.be')
  let embedUrl = null

  if (isYouTube) {
    const match = lesson.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`
  }

  return (
    <div style={stack16}>
      <StepBanner star={star} title="Watch & Learn" icon="1F4F9" color="#dbeafe" border="#93c5fd" />

      <div style={contentCard}>
        {embedUrl ? (
          <div style={videoFrameShell}>
            <iframe
              src={embedUrl}
              style={videoFrame}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : lesson.video_url ? (
          <video controls style={videoPlayer} src={lesson.video_url} />
        ) : (
          <div style={emptyCard}>
            <img src={openMoji('1F4F9')} alt="" width="58" height="58" />
            <div>Video coming soon.</div>
          </div>
        )}
      </div>

      <InfoStrip icon="1F9E0" title="Kid tip" text="Listen for the biggest idea in the video. That will help with the next quiz." />

      <div style={actionRow}>
        <button onClick={onNext} style={primaryButton}>Got it</button>
      </div>
    </div>
  )
}

function KnowledgeStep({ lesson, star, onNext }) {
  return (
    <div style={stack16}>
      <StepBanner star={star} title="What You Learned" icon="1F4DA" color="#dcfce7" border="#86efac" />

      <div style={knowledgeCard}>
        <img src={openMoji('1F9E0')} alt="" width="52" height="52" />
        <div style={knowledgeText}>
          {lesson.knowledge_text || 'Knowledge notes will appear here after the lesson video.'}
        </div>
      </div>

      <div style={actionRow}>
        <button onClick={onNext} style={primaryButton}>Ready for Quiz</button>
      </div>
    </div>
  )
}

function BattleStep({ choice, onVote, onNext }) {
  return (
    <div style={stack16}>
      <StepBanner star={3} title="Science Battle" icon="2694" color="#ffedd5" border="#fdba74" />

      <div style={battlePanel}>
        <div style={battleQuestion}>Is a virus alive or not alive?</div>
        <div style={battleHelper}>Choose a side, then compare the evidence.</div>

        {!choice ? (
          <div style={battleChoiceRow}>
            <button onClick={() => onVote('Alive')} style={battleChoiceButton}>Alive</button>
            <button onClick={() => onVote('Not Alive')} style={battleChoiceButton}>Not Alive</button>
          </div>
        ) : (
          <div style={battleAnswerStack}>
            <div style={battleResultCard}>You picked: {choice}</div>
            <div style={evidenceCard}>
              <strong>Alive:</strong> Viruses evolve and adapt over time.
            </div>
            <div style={evidenceCard}>
              <strong>Not alive:</strong> They cannot survive without a host.
            </div>
            <button onClick={onNext} style={primaryButton}>Continue</button>
          </div>
        )}
      </div>
    </div>
  )
}

function CompleteStep({ mod, earnedStars, onFinish }) {
  return (
    <div style={stack16}>
      <div style={{ ...heroPanel, background: '#d9f99d', borderColor: '#84cc16' }}>
        <img src={openMoji(earnedStars >= 3 ? '1F3C6' : '1F4D6')} alt="" width="92" height="92" />
        <div style={{ ...heroTitle, color: '#3f6212' }}>
          {earnedStars >= 3 ? 'Module Complete!' : 'Nice Progress!'}
        </div>
        <div style={{ ...heroText, color: '#4d7c0f' }}>
          {earnedStars >= 3
            ? `You finished ${mod.title} and earned all 3 stars.`
            : `You earned ${earnedStars}/3 stars so far. Come back to finish the mission.`}
        </div>
        <StarRow count={earnedStars} large />
        <button onClick={onFinish} style={playButton}>Back to Dashboard</button>
      </div>
    </div>
  )
}

function StepBanner({ star, title, icon, color, border }) {
  return (
    <div style={{ ...stepBanner, background: color, borderColor: border }}>
      <div style={stepBannerTitle}>
        <img src={openMoji(icon)} alt="" width="30" height="30" />
        <span>{title}</span>
      </div>
      <span style={stepStarBadge}>Star {star}</span>
    </div>
  )
}

function InfoStrip({ icon, title, text }) {
  return (
    <div style={infoStrip}>
      <img src={openMoji(icon)} alt="" width="36" height="36" />
      <div>
        <div style={infoTitle}>{title}</div>
        <div style={infoText}>{text}</div>
      </div>
    </div>
  )
}

function HeaderPill({ icon, value }) {
  return (
    <div style={headerPill}>
      <img src={openMoji(icon)} alt="" width="16" height="16" />
      <span>{value}</span>
    </div>
  )
}

function StarRow({ count, large = false }) {
  return (
    <div style={{ display: 'flex', gap: large ? 8 : 4, justifyContent: 'center' }}>
      {[1, 2, 3].map((item) => (
        <span key={item} style={{ color: item <= count ? '#f59e0b' : '#dbeafe', fontSize: large ? 28 : 16 }}>
          ★
        </span>
      ))}
    </div>
  )
}

const loadingShell = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#bde7ff',
  padding: 20,
}

const loadingCard = {
  width: 'min(92vw, 360px)',
  background: '#fff',
  border: '4px solid #8b5cf6',
  borderRadius: 28,
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 14,
  boxShadow: '0 18px 0 rgba(124, 58, 237, 0.16)',
}

const loadingTitle = {
  fontSize: 19,
  fontWeight: 900,
  color: '#334155',
}

const screenShell = {
  minHeight: '100vh',
  background: '#bde7ff',
  padding: '14px 12px 24px',
  position: 'relative',
  overflow: 'hidden',
}

const cloudOne = {
  position: 'absolute',
  width: 210,
  height: 82,
  right: -20,
  top: 120,
  borderRadius: 999,
  background: '#f8fbff',
  opacity: 0.72,
}

const cloudTwo = {
  position: 'absolute',
  width: 180,
  height: 70,
  left: -12,
  bottom: 96,
  borderRadius: 999,
  background: '#f8fbff',
  opacity: 0.9,
}

const appFrame = {
  width: 'min(100%, 460px)',
  minHeight: 'calc(100vh - 28px)',
  margin: '0 auto',
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

const headerTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
}

const brandBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 900,
  fontSize: 16,
}

const headerPills = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const headerPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  background: '#5b3ec6',
  border: '2px solid rgba(255,255,255,0.18)',
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 12,
}

const profileThumb = {
  borderRadius: '50%',
  border: '3px solid #ffffff',
  background: '#fff',
}

const headerBottom = {
  marginTop: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const backButton = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.18)',
  background: '#5b3ec6',
  color: '#fff',
  fontSize: 22,
  fontWeight: 900,
  cursor: 'pointer',
  flexShrink: 0,
}

const moduleTitle = {
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 900,
}

const moduleHeaderMeta = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 8,
  fontSize: 13,
  fontWeight: 800,
  color: '#ede9fe',
}

const contentShell = {
  padding: '16px 14px 22px',
  minHeight: 'calc(100vh - 172px)',
  overflowY: 'auto',
}

const footerBar = {
  padding: '0 14px 18px',
}

const primaryButton = {
  border: '3px solid #4d9b14',
  background: '#84cc16',
  color: '#fff',
  borderRadius: 18,
  padding: '14px 22px',
  fontSize: 18,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 10px 0 rgba(77, 155, 20, 0.22)',
}

const ghostButton = {
  border: '3px solid #93c5fd',
  background: '#fff',
  color: '#1d4ed8',
  borderRadius: 18,
  padding: '12px 20px',
  fontSize: 16,
  fontWeight: 900,
  cursor: 'pointer',
}

const stack16 = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const heroPanel = {
  border: '3px solid',
  borderRadius: 28,
  padding: 22,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 14,
  textAlign: 'center',
  boxShadow: '0 12px 0 rgba(15, 23, 42, 0.08)',
}

const heroIconWrap = {
  width: 120,
  height: 120,
  borderRadius: '50%',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 10px 0 rgba(255,255,255,0.18)',
}

const heroEmoji = {
  fontSize: 72,
  lineHeight: 1,
}

const heroTitle = {
  fontSize: 38,
  lineHeight: 1,
  fontWeight: 900,
  color: '#fff',
}

const heroText = {
  fontSize: 17,
  lineHeight: 1.55,
  fontWeight: 700,
  color: '#eff6ff',
}

const starBadgeRow = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'center',
}

const starBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 14px',
  borderRadius: 999,
  background: '#ffffff',
  color: '#334155',
  fontWeight: 900,
  fontSize: 13,
}

const playButton = {
  border: '3px solid #4d9b14',
  background: '#84cc16',
  color: '#fff',
  borderRadius: 999,
  padding: '14px 32px',
  fontSize: 24,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 10px 0 rgba(77, 155, 20, 0.26)',
}

const infoStrip = {
  background: '#ffffff',
  border: '3px solid #dbeafe',
  borderRadius: 22,
  padding: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const infoTitle = {
  fontSize: 14,
  fontWeight: 900,
  color: '#1e3a8a',
}

const infoText = {
  marginTop: 4,
  fontSize: 14,
  lineHeight: 1.5,
  color: '#475569',
}

const stepBanner = {
  border: '3px solid',
  borderRadius: 22,
  padding: '12px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
}

const stepBannerTitle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 24,
  fontWeight: 900,
  color: '#22314a',
}

const stepStarBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 12px',
  borderRadius: 999,
  background: '#ffffff',
  color: '#334155',
  fontWeight: 900,
  fontSize: 13,
  flexShrink: 0,
}

const contentCard = {
  background: '#ffffff',
  border: '3px solid #dbeafe',
  borderRadius: 24,
  padding: 12,
}

const videoFrameShell = {
  position: 'relative',
  paddingBottom: '56.25%',
  height: 0,
}

const videoFrame = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  border: 'none',
  borderRadius: 18,
}

const videoPlayer = {
  width: '100%',
  borderRadius: 18,
  background: '#000',
}

const emptyCard = {
  minHeight: 220,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  color: '#64748b',
  fontWeight: 800,
}

const actionRow = {
  display: 'flex',
  justifyContent: 'flex-end',
}

const knowledgeCard = {
  background: '#ffffff',
  border: '3px solid #bfdbfe',
  borderRadius: 24,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const knowledgeText = {
  fontSize: 16,
  lineHeight: 1.7,
  color: '#334155',
  whiteSpace: 'pre-wrap',
  fontWeight: 700,
}

const quizShell = {
  background: '#ffffff',
  border: '3px solid #dbeafe',
  borderRadius: 26,
  padding: 16,
  boxShadow: '0 10px 0 rgba(15, 23, 42, 0.06)',
}

const battlePanel = {
  background: '#fff7ed',
  border: '3px solid #fdba74',
  borderRadius: 26,
  padding: 18,
  boxShadow: '0 10px 0 rgba(194, 65, 12, 0.08)',
}

const battleQuestion = {
  fontSize: 28,
  lineHeight: 1.15,
  fontWeight: 900,
  color: '#7c2d12',
}

const battleHelper = {
  marginTop: 8,
  fontSize: 15,
  lineHeight: 1.5,
  color: '#9a3412',
  fontWeight: 700,
}

const battleChoiceRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginTop: 18,
}

const battleChoiceButton = {
  border: '3px solid #fb923c',
  background: '#ffffff',
  color: '#9a3412',
  borderRadius: 20,
  padding: '14px 10px',
  fontSize: 18,
  fontWeight: 900,
  cursor: 'pointer',
}

const battleAnswerStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginTop: 18,
}

const battleResultCard = {
  background: '#22c55e',
  color: '#fff',
  borderRadius: 18,
  padding: '12px 14px',
  fontWeight: 900,
  fontSize: 16,
  textAlign: 'center',
}

const evidenceCard = {
  background: '#fff',
  border: '2px solid #fed7aa',
  borderRadius: 18,
  padding: '12px 14px',
  fontSize: 15,
  lineHeight: 1.5,
  color: '#475569',
}

const savingOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(255,255,255,0.58)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 40,
}

const savingCard = {
  background: '#fff',
  border: '3px solid #8b5cf6',
  color: '#4c1d95',
  padding: '16px 20px',
  borderRadius: 20,
  fontWeight: 900,
  fontSize: 16,
}
