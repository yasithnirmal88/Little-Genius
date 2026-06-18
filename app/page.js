export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const scienceDomains = [
  'Space',
  'Animals',
  'Weather',
  'Oceans',
  'Dinosaurs',
  'Human Body',
]

const missionSteps = [
  {
    title: 'Watch a Short',
    text: 'Start with a tiny science video that feels fun and easy to follow.',
    icon: '1F4F9',
    color: '#dbeafe',
    border: '#93c5fd',
  },
  {
    title: 'Earn Stars',
    text: 'Answer simple quiz questions and collect stars as you learn.',
    icon: '2B50',
    color: '#fff7d6',
    border: '#fcd34d',
  },
  {
    title: 'Try a Battle',
    text: 'Pick a side in a science debate and think like a little scientist.',
    icon: '2694',
    color: '#ffedd5',
    border: '#fdba74',
  },
]

const featureCards = [
  {
    title: '12 science worlds',
    text: 'Big ideas from space, animals, weather, the ocean, and more.',
    icon: '1F30D',
    color: '#d9f99d',
    border: '#84cc16',
  },
  {
    title: 'Safe for kids',
    text: 'Curated videos, moderated comments, and child-friendly design choices.',
    icon: '1F6E1',
    color: '#ede9fe',
    border: '#a78bfa',
  },
  {
    title: 'Ranks and rewards',
    text: 'Kids can level up, keep streaks, and collect fun science achievements.',
    icon: '1F3C6',
    color: '#ffe4ef',
    border: '#f9a8d4',
  },
]

function openMoji(hex) {
  return `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${hex}.svg`
}

function dicebear(seed, background = 'ffd5dc') {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${background}`
}

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (profile?.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  return (
    <main style={screenShell}>
      <div style={cloudOne} />
      <div style={cloudTwo} />
      <div style={cloudThree} />

      <section style={heroWrap}>
        <div style={heroTextCol}>
          <div style={heroBadge}>
            <img src={openMoji('1F4A1')} alt="" width="24" height="24" />
            <span>Little Genius</span>
          </div>

          <h1 style={heroTitle}>A cute science app where learning feels like play.</h1>
          <p style={heroLead}>
            Little Genius helps kids ages 5 to 9 explore science with short videos, simple quizzes,
            fun ranks, and playful science missions.
          </p>

          <div style={heroActions}>
            <Link href="/login" style={primaryButton}>Open the App</Link>
            <a href="#features" style={secondaryButton}>See What Kids Do</a>
          </div>

          <div style={miniStats}>
            {[
              ['20', 'Modules'],
              ['12', 'Science topics'],
              ['10', 'Ranks to climb'],
            ].map(([value, label]) => (
              <div key={label} style={statCard}>
                <strong style={statValue}>{value}</strong>
                <span style={statLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={phonePreviewWrap}>
          <div style={phoneShell}>
            <div style={phoneHeader}>
              <span style={phoneBrand}>Little Genius</span>
              <div style={phonePills}>
                <PhonePill icon="2B50" value="1540" />
                <PhonePill icon="1F525" value="25" />
              </div>
            </div>

            <div style={previewHeroCard}>
              <div style={previewTopRow}>
                <span style={previewMission}>Today&apos;s mission</span>
                <span style={previewStars}>3 stars</span>
              </div>
              <h2 style={previewTitle}>Welcome!</h2>
              <p style={previewText}>Pick an avatar and begin your next science adventure.</p>

              <div style={avatarGrid}>
                {['Alek', 'Liam', 'Nova', 'Maya'].map((seed) => (
                  <div key={seed} style={avatarCard}>
                    <img src={dicebear(seed)} alt={seed} width="72" height="72" style={avatarImage} />
                    <span style={avatarName}>{seed}</span>
                  </div>
                ))}
              </div>

              <div style={playButton}>Play</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" style={sectionWrap}>
        <div style={sectionTitleRow}>
          <img src={openMoji('1F680')} alt="" width="30" height="30" />
          <h2 style={sectionTitle}>What kids do inside</h2>
        </div>

        <div style={stepGrid}>
          {missionSteps.map((step) => (
            <div key={step.title} style={{ ...stepCard, background: step.color, borderColor: step.border }}>
              <img src={openMoji(step.icon)} alt="" width="52" height="52" />
              <div style={stepTitle}>{step.title}</div>
              <p style={stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionWrap}>
        <div style={sectionTitleRow}>
          <img src={openMoji('1F9EA')} alt="" width="30" height="30" />
          <h2 style={sectionTitle}>Built for curious kids</h2>
        </div>

        <div style={featureGrid}>
          {featureCards.map((feature) => (
            <div key={feature.title} style={{ ...featureCard, background: feature.color, borderColor: feature.border }}>
              <img src={openMoji(feature.icon)} alt="" width="54" height="54" />
              <div style={featureTitle}>{feature.title}</div>
              <p style={featureText}>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionWrap}>
        <div style={sectionTitleRow}>
          <img src={openMoji('1F30D')} alt="" width="30" height="30" />
          <h2 style={sectionTitle}>Science worlds to explore</h2>
        </div>

        <div style={chipCloud}>
          {scienceDomains.map((domain) => (
            <span key={domain} style={topicChip}>{domain}</span>
          ))}
        </div>
      </section>

      <section style={ctaWrap}>
        <div>
          <div style={ctaTitle}>Ready to start a science adventure?</div>
          <div style={ctaText}>
            Open the demo and explore the same playful world used across the learner experience.
          </div>
        </div>
        <Link href="/login" style={primaryButton}>Start Now</Link>
      </section>
    </main>
  )
}

function PhonePill({ icon, value }) {
  return (
    <div style={phonePill}>
      <img src={openMoji(icon)} alt="" width="16" height="16" />
      <span>{value}</span>
    </div>
  )
}

const screenShell = {
  minHeight: '100vh',
  background: '#bde7ff',
  padding: '20px 14px 40px',
  position: 'relative',
  overflow: 'hidden',
}

const cloudOne = {
  position: 'absolute',
  width: 210,
  height: 82,
  left: -30,
  top: 160,
  borderRadius: 999,
  background: '#f8fbff',
  opacity: 0.92,
}

const cloudTwo = {
  position: 'absolute',
  width: 240,
  height: 92,
  right: -30,
  top: 80,
  borderRadius: 999,
  background: '#f8fbff',
  opacity: 0.74,
}

const cloudThree = {
  position: 'absolute',
  width: 220,
  height: 86,
  right: '5%',
  bottom: 80,
  borderRadius: 999,
  background: '#f8fbff',
  opacity: 0.82,
}

const heroWrap = {
  width: 'min(1120px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.05fr) minmax(320px, 0.95fr)',
  gap: 24,
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
}

const heroTextCol = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
}

const heroBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 16px',
  borderRadius: 999,
  background: '#7755d9',
  color: '#fff',
  fontWeight: 900,
  width: 'fit-content',
  boxShadow: '0 10px 0 rgba(124, 58, 237, 0.16)',
}

const heroTitle = {
  margin: 0,
  fontSize: 'clamp(42px, 7vw, 74px)',
  lineHeight: 0.95,
  fontWeight: 900,
  color: '#22314a',
  letterSpacing: -1.4,
}

const heroLead = {
  margin: 0,
  fontSize: 'clamp(17px, 2vw, 21px)',
  lineHeight: 1.65,
  fontWeight: 700,
  color: '#475569',
  maxWidth: 700,
}

const heroActions = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
}

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '3px solid #4d9b14',
  background: '#84cc16',
  color: '#fff',
  borderRadius: 999,
  padding: '14px 26px',
  fontSize: 18,
  fontWeight: 900,
  boxShadow: '0 10px 0 rgba(77, 155, 20, 0.22)',
}

const secondaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '3px solid #93c5fd',
  background: '#fff',
  color: '#1d4ed8',
  borderRadius: 999,
  padding: '14px 26px',
  fontSize: 18,
  fontWeight: 900,
}

const miniStats = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
  maxWidth: 620,
}

const statCard = {
  background: '#ffffff',
  border: '3px solid #dbeafe',
  borderRadius: 24,
  padding: '18px 14px',
  boxShadow: '0 10px 0 rgba(15, 23, 42, 0.06)',
}

const statValue = {
  display: 'block',
  fontSize: 30,
  fontWeight: 900,
  color: '#1d4ed8',
}

const statLabel = {
  display: 'block',
  marginTop: 6,
  fontSize: 14,
  fontWeight: 800,
  color: '#475569',
}

const phonePreviewWrap = {
  display: 'flex',
  justifyContent: 'center',
}

const phoneShell = {
  width: 'min(100%, 420px)',
  background: '#f8fbff',
  border: '4px solid #8b5cf6',
  borderRadius: 34,
  overflow: 'hidden',
  boxShadow: '0 28px 50px rgba(15, 23, 42, 0.16)',
}

const phoneHeader = {
  background: '#7755d9',
  color: '#fff',
  padding: '14px 14px 12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
}

const phoneBrand = {
  fontWeight: 900,
  fontSize: 16,
}

const phonePills = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const phonePill = {
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

const previewHeroCard = {
  margin: 14,
  background: '#73a7f7',
  border: '3px solid #4f83e3',
  borderRadius: 28,
  padding: 18,
  textAlign: 'center',
  boxShadow: '0 12px 0 rgba(15, 23, 42, 0.08)',
}

const previewTopRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
}

const previewMission = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#f58b57',
  color: '#fff',
  fontWeight: 900,
  fontSize: 13,
}

const previewStars = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 999,
  background: '#fff',
  color: '#854d0e',
  fontWeight: 900,
  fontSize: 13,
}

const previewTitle = {
  margin: '16px 0 0',
  fontSize: 52,
  lineHeight: 1,
  fontWeight: 900,
  color: '#fff',
}

const previewText = {
  margin: '12px auto 0',
  maxWidth: 280,
  fontSize: 17,
  lineHeight: 1.55,
  fontWeight: 700,
  color: '#eff6ff',
}

const avatarGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginTop: 18,
}

const avatarCard = {
  background: '#fff',
  border: '3px solid #ffffff',
  borderRadius: 22,
  padding: 10,
  boxShadow: '0 8px 0 rgba(37, 99, 235, 0.15)',
}

const avatarImage = {
  width: '100%',
  height: 'auto',
  borderRadius: 16,
  background: '#fff7ed',
}

const avatarName = {
  display: 'block',
  marginTop: 8,
  fontSize: 12,
  fontWeight: 900,
  color: '#334155',
}

const playButton = {
  margin: '18px auto 0',
  width: 'fit-content',
  border: '3px solid #4d9b14',
  background: '#84cc16',
  color: '#fff',
  borderRadius: 999,
  padding: '14px 32px',
  fontSize: 26,
  fontWeight: 900,
  boxShadow: '0 10px 0 rgba(77, 155, 20, 0.22)',
}

const sectionWrap = {
  width: 'min(1120px, 100%)',
  margin: '34px auto 0',
  position: 'relative',
  zIndex: 1,
}

const sectionTitleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const sectionTitle = {
  margin: 0,
  fontSize: 'clamp(28px, 4vw, 40px)',
  fontWeight: 900,
  color: '#22314a',
}

const stepGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 14,
  marginTop: 16,
}

const stepCard = {
  border: '3px solid',
  borderRadius: 28,
  padding: 20,
  background: '#fff',
  boxShadow: '0 12px 0 rgba(15, 23, 42, 0.08)',
}

const stepTitle = {
  marginTop: 12,
  fontSize: 22,
  fontWeight: 900,
  color: '#22314a',
}

const stepText = {
  margin: '8px 0 0',
  fontSize: 15,
  lineHeight: 1.6,
  fontWeight: 700,
  color: '#475569',
}

const featureGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 14,
  marginTop: 16,
}

const featureCard = {
  border: '3px solid',
  borderRadius: 28,
  padding: 20,
  boxShadow: '0 12px 0 rgba(15, 23, 42, 0.08)',
}

const featureTitle = {
  marginTop: 12,
  fontSize: 22,
  fontWeight: 900,
  color: '#22314a',
}

const featureText = {
  margin: '8px 0 0',
  fontSize: 15,
  lineHeight: 1.6,
  fontWeight: 700,
  color: '#475569',
}

const chipCloud = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 16,
}

const topicChip = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: 999,
  background: '#fff',
  border: '3px solid #dbeafe',
  color: '#334155',
  fontWeight: 900,
  fontSize: 15,
  boxShadow: '0 8px 0 rgba(15, 23, 42, 0.05)',
}

const ctaWrap = {
  width: 'min(1120px, 100%)',
  margin: '36px auto 0',
  background: '#fff7d6',
  border: '3px solid #fcd34d',
  borderRadius: 30,
  padding: '20px 22px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 20,
  boxShadow: '0 12px 0 rgba(245, 158, 11, 0.08)',
  position: 'relative',
  zIndex: 1,
}

const ctaTitle = {
  fontSize: 30,
  fontWeight: 900,
  color: '#7c2d12',
}

const ctaText = {
  marginTop: 8,
  fontSize: 16,
  lineHeight: 1.55,
  fontWeight: 700,
  color: '#9a3412',
  maxWidth: 700,
}
