'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const RANKS = [
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

const TAB_ITEMS = [
  { id: 'home', label: 'Home', icon: '1F31F' },
  { id: 'path', label: 'Learn', icon: '1F333' },
  { id: 'progress', label: 'Progress', icon: '1F3C6' },
  { id: 'ranks', label: 'Ranks', icon: '1F451' },
  { id: 'me', label: 'Me', icon: '1F9D1' },
]

const HOME_AVATAR_SEEDS = ['Alek', 'Liam', 'Nova', 'Maya', 'Ivy', 'Kai']
const FRIEND_SEEDS = ['Alek', 'Liam', 'Ava', 'Nia']

const ACHIEVEMENTS = [
  { id: 'rocket', label: 'Rocket', icon: '1F680' },
  { id: 'dna', label: 'DNA', icon: '1F9EC' },
  { id: 'energy', label: 'Energy', icon: '26A1' },
  { id: 'planet', label: 'Planet', icon: '1F30D' },
]

function dicebear(seed, background = 'b6e3f4') {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${background}`
}

function openMoji(hex) {
  return `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${hex}.svg`
}

function getProfileSeed(profile) {
  return profile?.username || profile?.email || 'Little Genius'
}

function getUnlockedModule(modules, progress, unlockedMods) {
  const ordered = [...modules].sort((a, b) => a.sort_order - b.sort_order)
  return ordered.find((mod) => !mod.locked || unlockedMods[mod.id] || (progress[mod.id]?.stars || 0) > 0) || ordered[0] || null
}

function getModuleStars(progress, moduleId) {
  return progress[moduleId]?.stars || 0
}

function getTierLabel(mod) {
  return `Tier ${mod.tier}`
}

function rankIndex(rank) {
  const index = RANKS.indexOf(rank)
  return index >= 0 ? index : 0
}

function textClamp(lines) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState(null)
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [shorts, setShorts] = useState([])
  const [progress, setProgress] = useState({})
  const [unlockedMods, setUnlockedMods] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('home')
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedShort, setSelectedShort] = useState(null)
  const [battleChoice, setBattleChoice] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      router.push('/login')
      return
    }

    const { data: prof } = await supabase.from('users').select('*').eq('auth_id', authUser.id).single()
    setProfile(prof)

    const { data: mods } = await supabase.from('modules').select('*').eq('status', 'published').order('sort_order', { ascending: true })
    const { data: ls } = await supabase.from('lessons').select('*').order('step_number')
    const { data: qs } = await supabase.from('quizzes').select('*, quiz_questions(*)')
    const { data: sh } = await supabase.from('shorts').select('*').eq('status', 'published')

    setModules(mods || [])
    setLessons(ls || [])
    setQuizzes(qs || [])
    setShorts(sh || [])

    const progressMap = {}
    if (prof) {
      const { data: prog } = await supabase.from('user_progress').select('*').eq('user_id', prof.id)
      ;(prog || []).forEach((item) => {
        progressMap[item.module_id] = item
      })
    }
    setProgress(progressMap)

    const unlocked = {}
    const tierValues = [...new Set((mods || []).map((mod) => mod.tier))].sort((a, b) => a - b)
    let previousTierComplete = true

    tierValues.forEach((tier) => {
      const tierModules = (mods || []).filter((mod) => mod.tier === tier && mod.status === 'published')
      const allComplete = tierModules.every((mod) => (progressMap[mod.id]?.stars || 0) >= 3)

      tierModules.forEach((mod) => {
        unlocked[mod.id] = previousTierComplete
      })

      previousTierComplete = allComplete
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
      <div style={loadingShell}>
        <div style={loadingCard}>
          <img src={openMoji('1F52C')} alt="" width="72" height="72" />
          <div style={{ fontSize: 18, fontWeight: 900, color: '#334155' }}>Loading Little Genius...</div>
        </div>
      </div>
    )
  }

  const firstModule = getUnlockedModule(modules, progress, unlockedMods)
  const completedModules = modules.filter((mod) => getModuleStars(progress, mod.id) >= 3).length
  const currentRankIndex = rankIndex(profile?.rank)
  const featuredShorts = shorts.slice(0, 3)
  const nextModules = modules.slice(0, 6)

  return (
    <div style={screenShell}>
      <div style={skyCloudLeft} />
      <div style={skyCloudRight} />

      <div style={appFrame}>
        <HeaderBar
          profile={profile}
          title={TAB_ITEMS.find((item) => item.id === tab)?.label || 'Home'}
          avatarSeed={getProfileSeed(profile)}
        />

        <div style={contentShell}>
          {tab === 'home' && (
            <HomeTab
              profile={profile}
              featuredShorts={featuredShorts}
              onPickShort={setSelectedShort}
              onPlay={() => {
                if (firstModule) router.push(`/module/${firstModule.id}`)
              }}
            />
          )}

          {tab === 'path' && (
            <PathTab
              modules={nextModules}
              progress={progress}
              unlockedMods={unlockedMods}
              onOpenModule={setSelectedModule}
            />
          )}

          {tab === 'progress' && (
            <ProgressTab
              profile={profile}
              completedModules={completedModules}
              modules={modules.length}
              battleChoice={battleChoice}
              onBattlePick={setBattleChoice}
            />
          )}

          {tab === 'ranks' && <RanksTab profile={profile} />}

          {tab === 'me' && <ProfileTab profile={profile} onLogout={handleLogout} />}
        </div>

        <BottomTabs activeTab={tab} onChange={setTab} />
      </div>

      {selectedModule && (
        <ModuleSheet
          mod={selectedModule}
          stars={getModuleStars(progress, selectedModule.id)}
          lessonCount={lessons.filter((lesson) => lesson.module_id === selectedModule.id).length}
          quizCount={quizzes.filter((quiz) => quiz.module_id === selectedModule.id).length}
          onClose={() => setSelectedModule(null)}
          onStart={() => router.push(`/module/${selectedModule.id}`)}
        />
      )}

      {selectedShort && <ShortPlayer short={selectedShort} onClose={() => setSelectedShort(null)} />}
    </div>
  )
}

function HeaderBar({ profile, title, avatarSeed }) {
  return (
    <div style={headerBar}>
      <div style={brandStack}>
        <div style={brandBadge}>
          <img src={openMoji('1F4A1')} alt="" width="22" height="22" />
          <span>Little Genius</span>
        </div>
        <div style={pageTitle}>{title}</div>
      </div>

      <div style={headerChips}>
        <StatPill icon="2B50" value={profile?.xp?.toLocaleString() || '0'} />
        <StatPill icon="1F525" value={profile?.streak || '0'} />
        <img src={dicebear(avatarSeed, 'c0aede')} alt="" width="42" height="42" style={avatarBubble} />
      </div>
    </div>
  )
}

function HomeTab({ profile, featuredShorts, onPickShort, onPlay }) {
  const selectedAvatar = getProfileSeed(profile)

  return (
    <div style={tabStack}>
      <Panel color="#6ea8fe" border="#4f83e3">
        <div style={{ ...stack12, alignItems: 'center', textAlign: 'center' }}>
          <StatusStrip profile={profile} />
          <div style={heroTitle}>Welcome!</div>
          <div style={heroSubtitle}>Pick an avatar and start your next science mission.</div>

          <div style={avatarGrid}>
            {HOME_AVATAR_SEEDS.map((seed) => {
              const active = selectedAvatar.toLowerCase().includes(seed.toLowerCase())
              return (
                <div key={seed} style={{ ...avatarChoice, borderColor: active ? '#2563eb' : '#ffffff' }}>
                  <img src={dicebear(seed, 'ffd5dc')} alt={seed} width="84" height="84" style={avatarChoiceImage} />
                  <div style={avatarLabel}>{seed}</div>
                </div>
              )
            })}
          </div>

          <button onClick={onPlay} style={playButton}>
            Play
          </button>
        </div>
      </Panel>

      <SectionTitle icon="1F39E" label="Featured Shorts" />
      <div style={cardGrid}>
        {featuredShorts.map((short, index) => (
          <button key={short.id} onClick={() => onPickShort(short)} style={{ ...softCard, textAlign: 'left', background: shortCardColors[index % shortCardColors.length] }}>
            <div style={shortHeader}>
              <Badge label={short.domain} />
              <span style={xpChip}>+10 XP</span>
            </div>
            <div style={shortTitle}>{short.title}</div>
            <div style={shortMeta}>
              <img src={openMoji(index === 0 ? '1F680' : index === 1 ? '1F52D' : '1F30B')} alt="" width="36" height="36" />
              <span>{short.duration}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PathTab({ modules, progress, unlockedMods, onOpenModule }) {
  return (
    <div style={{ ...tabStack, paddingBottom: 28 }}>
      <SectionTitle icon="1F333" label="Learn Path" />
      <div style={pathScrollArea}>
        <div style={pathTrunk} />
        {modules.map((mod, index) => {
          const locked = mod.locked && !unlockedMods[mod.id] && getModuleStars(progress, mod.id) === 0
          const stars = getModuleStars(progress, mod.id)
          const offsetStyle = index % 2 === 0 ? pathCardLeft : pathCardRight

          return (
            <button
              key={mod.id}
              onClick={() => !locked && onOpenModule(mod)}
              style={{
                ...pathNodeCard,
                ...offsetStyle,
                opacity: locked ? 0.6 : 1,
                cursor: locked ? 'not-allowed' : 'pointer',
              }}
            >
              <div style={pathNodeTop}>
                <span style={pathTier}>{getTierLabel(mod)}</span>
                <StarRow count={stars} />
              </div>
              <div style={pathNodeTitleRow}>
                <span style={moduleEmojiBubble}>{mod.emoji || 'SCI'}</span>
                <div>
                  <div style={pathNodeTitle}>{mod.title}</div>
                  <div style={pathNodeMeta}>{locked ? 'Locked until previous tier is complete' : 'Tap to continue'}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProgressTab({ profile, completedModules, modules, battleChoice, onBattlePick }) {
  const profileRank = profile?.rank || RANKS[0]
  const levelNumber = rankIndex(profileRank) + 1

  return (
    <div style={tabStack}>
      <Panel color="#2f6fe4" border="#1d4fb5">
        <div style={{ ...stack16, alignItems: 'center', textAlign: 'center', color: '#fff' }}>
          <img src={openMoji('1F3C6')} alt="" width="82" height="82" />
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.4 }}>TIER {levelNumber}</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{profileRank}</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Points: {profile?.xp?.toLocaleString() || '0'}</div>
          <div style={progressCounterRow}>
            <MiniCounter label="Modules" value={`${completedModules}/${modules}`} />
            <MiniCounter label="Streak" value={profile?.streak || '0'} />
            <MiniCounter label="Badges" value="4" />
          </div>
        </div>
      </Panel>

      <SectionTitle icon="1F396" label="Achievements" />
      <div style={achievementGrid}>
        {ACHIEVEMENTS.map((achievement, index) => (
          <div key={achievement.id} style={{ ...achievementCard, background: achievementColors[index] }}>
            <img src={openMoji(achievement.icon)} alt="" width="46" height="46" />
            <div style={achievementLabel}>{achievement.label}</div>
          </div>
        ))}
      </div>

      <SectionTitle icon="2694" label="Science Battle" />
      <div style={battleCard}>
        <div style={battleQuestion}>Is a virus alive or not alive?</div>
        {!battleChoice ? (
          <div style={battleChoiceRow}>
            <button onClick={() => onBattlePick('Alive')} style={battleButton}>Alive</button>
            <button onClick={() => onBattlePick('Not Alive')} style={battleButton}>Not Alive</button>
          </div>
        ) : (
          <div style={battleResult}>
            <div style={battlePicked}>You picked: {battleChoice}</div>
            <div style={battleHint}>Great job. Now compare the evidence from both sides.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function RanksTab({ profile }) {
  const currentIndex = rankIndex(profile?.rank)

  return (
    <div style={tabStack}>
      <SectionTitle icon="1F451" label="Ranks Ladder" />

      <div style={friendsRow}>
        {FRIEND_SEEDS.map((seed) => (
          <div key={seed} style={friendBubble}>
            <img src={dicebear(seed, 'ffd966')} alt={seed} width="62" height="62" style={friendAvatar} />
            <span style={friendName}>{seed}</span>
          </div>
        ))}
      </div>

      <div style={ladderStack}>
        {[...RANKS].reverse().map((rank, reverseIndex) => {
          const realIndex = RANKS.length - reverseIndex - 1
          const isCurrent = realIndex === currentIndex
          const width = `${72 + reverseIndex * 3}%`

          return (
            <div key={rank} style={{ ...ladderStep, width, background: ladderColors[reverseIndex % ladderColors.length], borderColor: isCurrent ? '#1d4ed8' : '#8b5a2b' }}>
              <div style={ladderStepText}>
                <div style={ladderTierLabel}>Tier {realIndex + 1}</div>
                <div style={ladderRankName}>{rank}</div>
              </div>
              {isCurrent && (
                <img src={dicebear(getProfileSeed(profile), 'c4b5fd')} alt="" width="72" height="72" style={ladderAvatar} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProfileTab({ profile, onLogout }) {
  return (
    <div style={tabStack}>
      <Panel color="#8ec5ff" border="#6197d8">
        <div style={{ ...stack16, alignItems: 'center', textAlign: 'center' }}>
          <img src={dicebear(getProfileSeed(profile), 'fecdd3')} alt="" width="110" height="110" style={profileAvatar} />
          <div style={profileName}>{profile?.username || 'Science Cadet'}</div>
          <div style={profileRank}>{profile?.rank || 'Science Cadet'}</div>

          <div style={profileStatsGrid}>
            <ProfileStat label="XP" value={profile?.xp?.toLocaleString() || '0'} />
            <ProfileStat label="Streak" value={profile?.streak || '0'} />
            <ProfileStat label="Modules" value={profile?.modules_completed || '0'} />
          </div>
        </div>
      </Panel>

      <button onClick={onLogout} style={logoutButton}>
        Log Out
      </button>
    </div>
  )
}

function BottomTabs({ activeTab, onChange }) {
  return (
    <div style={bottomTabs}>
      {TAB_ITEMS.map((item) => {
        const active = item.id === activeTab
        return (
          <button key={item.id} onClick={() => onChange(item.id)} style={{ ...tabButton, background: active ? '#fff3bf' : 'transparent', borderColor: active ? '#eab308' : 'transparent' }}>
            <img src={openMoji(item.icon)} alt="" width="24" height="24" />
            <span style={{ ...tabButtonLabel, color: active ? '#7c2d12' : '#475569' }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function SectionTitle({ icon, label }) {
  return (
    <div style={sectionTitle}>
      <img src={openMoji(icon)} alt="" width="28" height="28" />
      <span>{label}</span>
    </div>
  )
}

function StatusStrip({ profile }) {
  const dots = [0, 1, 2, 3, 4, 5, 6]
  const activeDots = Math.min(Number(profile?.streak || 0), dots.length)

  return (
    <div style={statusStrip}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={openMoji('1F525')} alt="" width="24" height="24" />
        <strong>{profile?.streak || 0} day streak</strong>
      </div>
      <div style={statusDots}>
        {dots.map((dot, index) => (
          <span key={dot} style={{ ...statusDot, background: index < activeDots ? '#fff' : '#f3d4c8' }} />
        ))}
      </div>
    </div>
  )
}

function StarRow({ count }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[0, 1, 2].map((index) => (
        <span key={index} style={{ color: index < count ? '#fbbf24' : '#e2e8f0', fontSize: 14 }}>
          ★
        </span>
      ))}
    </div>
  )
}

function StatPill({ icon, value }) {
  return (
    <div style={statPill}>
      <img src={openMoji(icon)} alt="" width="18" height="18" />
      <span>{value}</span>
    </div>
  )
}

function Badge({ label }) {
  return <span style={badgeStyle}>{label}</span>
}

function Panel({ children, color, border }) {
  return <div style={{ ...panelBase, background: color, borderColor: border }}>{children}</div>
}

function MiniCounter({ label, value }) {
  return (
    <div style={miniCounter}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ProfileStat({ label, value }) {
  return (
    <div style={profileStatCard}>
      <div style={profileStatValue}>{value}</div>
      <div style={profileStatLabel}>{label}</div>
    </div>
  )
}

function ModuleSheet({ mod, stars, lessonCount, quizCount, onClose, onStart }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(event) => event.stopPropagation()}>
        <div style={sheetHandle} />
        <div style={sheetTitleRow}>
          <span style={moduleEmojiBubble}>{mod.emoji || 'SCI'}</span>
          <div>
            <div style={sheetTitle}>{mod.title}</div>
            <div style={sheetSubtitle}>{getTierLabel(mod)}</div>
          </div>
        </div>

        <div style={sheetInfoGrid}>
          <ProfileStat label="Stars" value={`${stars}/3`} />
          <ProfileStat label="Lessons" value={lessonCount || 0} />
          <ProfileStat label="Quizzes" value={quizCount || 0} />
        </div>

        <p style={sheetDescription}>{mod.description || 'Explore videos, quiz stars, and one Science Battle at the end of the module.'}</p>

        <button onClick={onStart} style={primarySheetButton}>
          {stars > 0 ? 'Continue Module' : 'Start Module'}
        </button>
      </div>
    </div>
  )
}

function ShortPlayer({ short, onClose }) {
  const isYouTube = short.video_url?.includes('youtube.com') || short.video_url?.includes('youtu.be')
  let embedUrl = null

  if (isYouTube) {
    const match = short.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={videoModal} onClick={(event) => event.stopPropagation()}>
        <div style={videoModalHeader}>
          <div>
            <div style={sheetTitle}>{short.title}</div>
            <div style={sheetSubtitle}>{short.domain} • {short.duration}</div>
          </div>
          <button onClick={onClose} style={closeButton}>X</button>
        </div>

        {embedUrl ? (
          <div style={videoFrameShell}>
            <iframe
              src={embedUrl}
              style={videoFrame}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : short.video_url ? (
          <video controls style={videoPlayer} src={short.video_url} />
        ) : (
          <div style={emptyVideoState}>
            <img src={openMoji('1F4F9')} alt="" width="56" height="56" />
            <div>Video not available yet.</div>
          </div>
        )}
      </div>
    </div>
  )
}

const loadingShell = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#cfefff',
  padding: 20,
}

const loadingCard = {
  width: 'min(92vw, 360px)',
  background: '#fff',
  border: '4px solid #7dd3fc',
  borderRadius: 28,
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 14,
  boxShadow: '0 16px 0 rgba(14, 116, 144, 0.18)',
}

const screenShell = {
  minHeight: '100vh',
  background: '#bde7ff',
  padding: '14px 12px 24px',
  position: 'relative',
  overflow: 'hidden',
}

const skyCloudLeft = {
  position: 'absolute',
  width: 190,
  height: 72,
  left: -10,
  bottom: 84,
  background: '#f7fbff',
  borderRadius: 999,
  opacity: 0.92,
}

const skyCloudRight = {
  position: 'absolute',
  width: 220,
  height: 88,
  right: -30,
  top: 120,
  background: '#f7fbff',
  borderRadius: 999,
  opacity: 0.7,
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
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
}

const brandStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const brandBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 900,
  fontSize: 16,
}

const pageTitle = {
  fontSize: 28,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: -0.5,
}

const headerChips = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const statPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  background: '#5b3ec6',
  border: '2px solid rgba(255,255,255,0.2)',
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 12,
}

const avatarBubble = {
  borderRadius: '50%',
  border: '3px solid #ffffff',
  background: '#fff',
}

const contentShell = {
  padding: '16px 14px 94px',
  minHeight: 'calc(100vh - 142px)',
  overflowY: 'auto',
}

const tabStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const panelBase = {
  border: '3px solid',
  borderRadius: 28,
  padding: 18,
  boxShadow: '0 12px 0 rgba(15, 23, 42, 0.08)',
}

const stack12 = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const stack16 = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const statusStrip = {
  width: '100%',
  background: '#f08c55',
  color: '#fff',
  border: '3px solid #d86d36',
  borderRadius: 22,
  padding: '12px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const statusDots = {
  display: 'flex',
  gap: 6,
}

const statusDot = {
  width: 12,
  height: 12,
  borderRadius: '50%',
}

const heroTitle = {
  fontSize: 44,
  lineHeight: 1,
  fontWeight: 900,
  color: '#ffffff',
  textShadow: '0 3px 0 rgba(37, 99, 235, 0.22)',
}

const heroSubtitle = {
  fontSize: 18,
  fontWeight: 800,
  color: '#eff6ff',
}

const avatarGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
}

const avatarChoice = {
  background: '#ffffff',
  border: '3px solid #ffffff',
  borderRadius: 22,
  padding: 10,
  boxShadow: '0 8px 0 rgba(37, 99, 235, 0.15)',
}

const avatarChoiceImage = {
  width: '100%',
  height: 'auto',
  borderRadius: 16,
  background: '#fff7ed',
}

const avatarLabel = {
  marginTop: 8,
  fontSize: 12,
  fontWeight: 800,
  color: '#334155',
}

const playButton = {
  border: '3px solid #4d9b14',
  background: '#84cc16',
  color: '#fff',
  borderRadius: 999,
  padding: '14px 36px',
  fontSize: 24,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 10px 0 rgba(77, 155, 20, 0.28)',
}

const sectionTitle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 24,
  fontWeight: 900,
  color: '#22314a',
}

const cardGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))',
  gap: 12,
}

const softCard = {
  border: '3px solid #ffffff',
  borderRadius: 24,
  padding: 14,
  boxShadow: '0 10px 0 rgba(15, 23, 42, 0.08)',
  cursor: 'pointer',
}

const shortCardColors = ['#fff7d6', '#e0f2fe', '#ffe4ef']

const shortHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#ffffff',
  color: '#334155',
  fontWeight: 800,
  fontSize: 12,
}

const xpChip = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#fee2e2',
  color: '#b91c1c',
  fontWeight: 800,
  fontSize: 12,
}

const shortTitle = {
  marginTop: 14,
  fontSize: 17,
  fontWeight: 900,
  color: '#243b53',
  ...textClamp(2),
}

const shortMeta = {
  marginTop: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 13,
  fontWeight: 800,
  color: '#475569',
}

const pathScrollArea = {
  position: 'relative',
  padding: '10px 0 16px',
}

const pathTrunk = {
  position: 'absolute',
  top: 10,
  bottom: 10,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 22,
  background: '#8b5a2b',
  borderRadius: 999,
}

const pathNodeCard = {
  position: 'relative',
  width: '76%',
  border: '3px solid #a56a2f',
  borderRadius: 24,
  padding: 14,
  background: '#dca76b',
  boxShadow: '0 10px 0 rgba(120, 53, 15, 0.2)',
  marginBottom: 20,
}

const pathCardLeft = {
  marginRight: 'auto',
}

const pathCardRight = {
  marginLeft: 'auto',
}

const pathNodeTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
}

const pathTier = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '5px 10px',
  borderRadius: 999,
  background: '#fff7ed',
  color: '#9a3412',
  fontSize: 12,
  fontWeight: 900,
}

const pathNodeTitleRow = {
  marginTop: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const moduleEmojiBubble = {
  width: 54,
  height: 54,
  borderRadius: 18,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff7ed',
  border: '2px solid #fcd34d',
  fontSize: 18,
  fontWeight: 900,
  color: '#7c2d12',
  flexShrink: 0,
}

const pathNodeTitle = {
  fontSize: 18,
  fontWeight: 900,
  color: '#3f2209',
}

const pathNodeMeta = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 700,
  color: '#7c4b1c',
}

const progressCounterRow = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10,
}

const miniCounter = {
  background: '#5e89e8',
  border: '2px solid rgba(255,255,255,0.25)',
  borderRadius: 18,
  padding: '10px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const achievementGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}

const achievementColors = ['#eadcff', '#fff2b8', '#ffd9cc', '#d9f0ff']

const achievementCard = {
  borderRadius: 24,
  padding: 14,
  border: '3px solid #fff',
  textAlign: 'center',
  boxShadow: '0 10px 0 rgba(15, 23, 42, 0.08)',
}

const achievementLabel = {
  marginTop: 10,
  fontWeight: 900,
  color: '#334155',
}

const battleCard = {
  background: '#fff7ed',
  border: '3px solid #fdba74',
  borderRadius: 26,
  padding: 18,
  boxShadow: '0 10px 0 rgba(194, 65, 12, 0.08)',
}

const battleQuestion = {
  fontSize: 22,
  lineHeight: 1.2,
  fontWeight: 900,
  color: '#7c2d12',
}

const battleChoiceRow = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}

const battleButton = {
  border: '3px solid #f97316',
  background: '#fff',
  color: '#9a3412',
  borderRadius: 20,
  padding: '14px 10px',
  fontWeight: 900,
  fontSize: 16,
  cursor: 'pointer',
}

const battleResult = {
  marginTop: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const battlePicked = {
  fontWeight: 900,
  color: '#0f766e',
}

const battleHint = {
  fontWeight: 700,
  color: '#475569',
}

const friendsRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
}

const friendBubble = {
  background: '#dbeafe',
  border: '3px solid #fff',
  borderRadius: 22,
  padding: 10,
  textAlign: 'center',
  boxShadow: '0 8px 0 rgba(59, 130, 246, 0.12)',
}

const friendAvatar = {
  borderRadius: '50%',
  background: '#fff',
}

const friendName = {
  display: 'block',
  marginTop: 8,
  fontSize: 12,
  fontWeight: 900,
  color: '#334155',
}

const ladderStack = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  paddingBottom: 12,
}

const ladderColors = ['#d6bcfa', '#fed7aa', '#fde68a', '#bfdbfe', '#d9f99d']

const ladderStep = {
  minHeight: 78,
  border: '3px solid',
  borderRadius: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  boxShadow: '0 10px 0 rgba(120, 53, 15, 0.12)',
}

const ladderStepText = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const ladderTierLabel = {
  fontSize: 12,
  fontWeight: 900,
  color: '#7c2d12',
}

const ladderRankName = {
  fontSize: 17,
  fontWeight: 900,
  color: '#4a2c12',
}

const ladderAvatar = {
  borderRadius: '50%',
  background: '#fff',
  border: '3px solid #fff',
}

const profileAvatar = {
  borderRadius: '50%',
  background: '#fff',
  border: '4px solid #fff',
  boxShadow: '0 12px 0 rgba(59, 130, 246, 0.15)',
}

const profileName = {
  fontSize: 28,
  fontWeight: 900,
  color: '#1e3a8a',
}

const profileRank = {
  fontSize: 16,
  fontWeight: 800,
  color: '#334155',
}

const profileStatsGrid = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10,
}

const profileStatCard = {
  background: '#ffffff',
  border: '3px solid #dbeafe',
  borderRadius: 20,
  padding: '12px 10px',
  textAlign: 'center',
}

const profileStatValue = {
  fontSize: 20,
  fontWeight: 900,
  color: '#0f172a',
}

const profileStatLabel = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: '#64748b',
}

const logoutButton = {
  border: '3px solid #dc2626',
  background: '#ef4444',
  color: '#fff',
  borderRadius: 20,
  padding: '14px 18px',
  fontWeight: 900,
  fontSize: 18,
  cursor: 'pointer',
  boxShadow: '0 10px 0 rgba(220, 38, 38, 0.2)',
}

const bottomTabs = {
  position: 'absolute',
  left: 10,
  right: 10,
  bottom: 10,
  background: '#ffffff',
  border: '3px solid #dbeafe',
  borderRadius: 26,
  padding: 8,
  display: 'grid',
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  gap: 8,
}

const tabButton = {
  border: '2px solid transparent',
  borderRadius: 18,
  padding: '8px 4px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
}

const tabButtonLabel = {
  fontSize: 11,
  fontWeight: 900,
}

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.42)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: 12,
  zIndex: 50,
}

const sheet = {
  width: 'min(100%, 460px)',
  background: '#fff',
  borderRadius: '28px 28px 22px 22px',
  padding: 18,
  boxShadow: '0 28px 60px rgba(15, 23, 42, 0.2)',
}

const sheetHandle = {
  width: 76,
  height: 8,
  borderRadius: 999,
  background: '#dbeafe',
  margin: '0 auto 18px',
}

const sheetTitleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const sheetTitle = {
  fontSize: 22,
  fontWeight: 900,
  color: '#22314a',
}

const sheetSubtitle = {
  marginTop: 4,
  fontSize: 13,
  fontWeight: 800,
  color: '#64748b',
}

const sheetInfoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10,
  marginTop: 18,
}

const sheetDescription = {
  marginTop: 18,
  marginBottom: 18,
  fontSize: 15,
  lineHeight: 1.55,
  color: '#475569',
}

const primarySheetButton = {
  width: '100%',
  border: '3px solid #4d9b14',
  background: '#84cc16',
  color: '#fff',
  borderRadius: 18,
  padding: '14px 16px',
  fontSize: 18,
  fontWeight: 900,
  cursor: 'pointer',
}

const videoModal = {
  width: 'min(100%, 760px)',
  background: '#fff',
  borderRadius: 28,
  padding: 18,
  boxShadow: '0 28px 60px rgba(15, 23, 42, 0.2)',
}

const videoModalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
}

const closeButton = {
  border: 'none',
  background: '#e2e8f0',
  color: '#334155',
  width: 38,
  height: 38,
  borderRadius: '50%',
  fontWeight: 900,
  cursor: 'pointer',
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
}

const emptyVideoState = {
  minHeight: 220,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
  color: '#64748b',
  fontWeight: 800,
}
