'use client'

import { useState } from 'react'

function openMoji(hex) {
  return `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${hex}.svg`
}

export default function QuizEngine({ questions, onComplete, onContinue, passingScore = 80, title = 'Quiz' }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)

  const q = questions[idx]

  if (!questions || questions.length === 0) {
    return (
      <div style={emptyState}>
        <img src={openMoji('1F914')} alt="" width="54" height="54" />
        <div>No questions yet.</div>
      </div>
    )
  }

  const handleSubmit = () => {
    if (selected === null) return
    setSubmitted(true)
    setAnswers((prev) => [...prev, { questionIndex: idx, selected, correct: selected === q.correct_index }])
  }

  const handleNext = () => {
    if (idx < questions.length - 1) {
      setIdx((prev) => prev + 1)
      setSelected(null)
      setSubmitted(false)
    } else {
      const finalAnswers = [...answers, { questionIndex: idx, selected, correct: selected === q.correct_index }]
      const correctCount = finalAnswers.filter((item) => item.correct).length
      const score = Math.round((correctCount / questions.length) * 100)
      setFinished(true)
      onComplete({ score, passed: score >= passingScore, correctCount, total: questions.length, answers: finalAnswers })
    }
  }

  if (finished) {
    const correctCount = answers.filter((item) => item.correct).length + (selected === q.correct_index ? 1 : 0)
    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= passingScore

    return (
      <div style={resultShell}>
        <div style={resultPanel}>
          <img src={openMoji(passed ? '1F389' : '1F642')} alt="" width="84" height="84" />
          <div style={{ ...resultTitle, color: passed ? '#15803d' : '#c2410c' }}>
            {passed ? 'Great job!' : 'Keep trying!'}
          </div>
          <div style={resultText}>
            {correctCount} / {questions.length} correct
          </div>

          <div style={resultBarTrack}>
            <div style={{ ...resultBarFill, width: `${score}%`, background: passed ? '#84cc16' : '#fb923c' }} />
          </div>

          <div style={resultCaption}>
            Passing score: {passingScore}% • Your score: {score}%
          </div>

          <div style={resultActions}>
            <button
              onClick={() => {
                setIdx(0)
                setSelected(null)
                setSubmitted(false)
                setAnswers([])
                setFinished(false)
              }}
              style={secondaryButton}
            >
              Retry
            </button>
            {onContinue && (
              <button onClick={onContinue} style={primaryButton}>
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={quizShell}>
      <div style={quizTopRow}>
        <div style={quizLabelWrap}>
          <img src={openMoji('1F52C')} alt="" width="28" height="28" />
          <div>
            <div style={quizTitle}>{title}</div>
            <div style={quizCounter}>Question {idx + 1} of {questions.length}</div>
          </div>
        </div>
        <span style={counterBubble}>{idx + 1}/{questions.length}</span>
      </div>

      <div style={progressTrack}>
        <div
          style={{
            ...progressFill,
            width: `${((idx + (submitted ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div style={questionCard}>
        <div style={questionText}>{q.question_text}</div>
        <div style={answerStack}>
          {q.options.map((opt, optionIndex) => {
            const isSelected = selected === optionIndex
            const isCorrect = q.correct_index === optionIndex
            let background = '#ffffff'
            let border = '#dbeafe'
            let text = '#22314a'

            if (submitted) {
              if (isCorrect) {
                background = '#dcfce7'
                border = '#84cc16'
                text = '#166534'
              } else if (isSelected && !isCorrect) {
                background = '#ffedd5'
                border = '#fb923c'
                text = '#9a3412'
              } else {
                background = '#f8fafc'
                border = '#e2e8f0'
                text = '#94a3b8'
              }
            } else if (isSelected) {
              background = '#fef3c7'
              border = '#facc15'
              text = '#854d0e'
            }

            return (
              <button
                key={optionIndex}
                onClick={() => {
                  if (!submitted) setSelected(optionIndex)
                }}
                disabled={submitted}
                style={{
                  ...answerButton,
                  background,
                  borderColor: border,
                  color: text,
                  cursor: submitted ? 'default' : 'pointer',
                }}
              >
                <span
                  style={{
                    ...answerBubble,
                    borderColor: submitted && isCorrect ? '#84cc16' : border,
                    background: submitted && isCorrect ? '#84cc16' : '#ffffff',
                    color: submitted && isCorrect ? '#ffffff' : text,
                  }}
                >
                  {submitted && isCorrect ? '✓' : submitted && isSelected && !isCorrect ? '✕' : String.fromCharCode(65 + optionIndex)}
                </span>
                <span style={answerText}>{opt}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={actionRow}>
        {!submitted ? (
          <button onClick={handleSubmit} style={primaryButton}>
            Submit
          </button>
        ) : (
          <button onClick={handleNext} style={primaryButton}>
            {idx < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  )
}

const emptyState = {
  textAlign: 'center',
  padding: 26,
  color: '#64748b',
  fontWeight: 800,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'center',
}

const quizShell = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const quizTopRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
}

const quizLabelWrap = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const quizTitle = {
  fontSize: 'clamp(20px, 6vw, 22px)',
  lineHeight: 1.05,
  fontWeight: 900,
  color: '#22314a',
}

const quizCounter = {
  marginTop: 4,
  fontSize: 13,
  fontWeight: 800,
  color: '#64748b',
}

const counterBubble = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 12px',
  borderRadius: 999,
  background: '#ede9fe',
  color: '#5b21b6',
  fontWeight: 900,
  fontSize: 12,
  flexShrink: 0,
}

const progressTrack = {
  width: '100%',
  height: 12,
  background: '#e0f2fe',
  borderRadius: 999,
  overflow: 'hidden',
}

const progressFill = {
  height: 12,
  background: '#60a5fa',
  borderRadius: 999,
  transition: 'width .25s ease',
}

const questionCard = {
  background: '#fff7d6',
  border: '3px solid #fcd34d',
  borderRadius: 24,
  padding: 18,
  boxShadow: '0 10px 0 rgba(245, 158, 11, 0.08)',
}

const questionText = {
  fontSize: 'clamp(20px, 6vw, 24px)',
  lineHeight: 1.2,
  fontWeight: 900,
  color: '#7c2d12',
}

const answerStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  marginTop: 18,
}

const answerButton = {
  width: '100%',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '14px 14px',
  border: '3px solid',
  borderRadius: 20,
  textAlign: 'left',
}

const answerBubble = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '3px solid',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 900,
  fontSize: 14,
  flexShrink: 0,
}

const answerText = {
  fontSize: 16,
  lineHeight: 1.45,
  fontWeight: 800,
}

const actionRow = {
  display: 'flex',
  justifyContent: 'center',
}

const primaryButton = {
  border: '3px solid #4d9b14',
  background: '#84cc16',
  color: '#fff',
  borderRadius: 18,
  padding: '12px 20px',
  fontSize: 17,
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 10px 0 rgba(77, 155, 20, 0.22)',
}

const secondaryButton = {
  border: '3px solid #93c5fd',
  background: '#ffffff',
  color: '#1d4ed8',
  borderRadius: 18,
  padding: '12px 20px',
  fontSize: 17,
  fontWeight: 900,
  cursor: 'pointer',
}

const resultShell = {
  display: 'flex',
  justifyContent: 'center',
}

const resultPanel = {
  width: '100%',
  background: '#ffffff',
  border: '3px solid #dbeafe',
  borderRadius: 28,
  padding: 'clamp(18px, 5vw, 24px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  textAlign: 'center',
}

const resultTitle = {
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 900,
}

const resultText = {
  fontSize: 18,
  fontWeight: 900,
  color: '#334155',
}

const resultBarTrack = {
  width: 'min(220px, 100%)',
  height: 12,
  background: '#e2e8f0',
  borderRadius: 999,
  overflow: 'hidden',
}

const resultBarFill = {
  height: 12,
  borderRadius: 999,
}

const resultCaption = {
  fontSize: 13,
  fontWeight: 800,
  color: '#64748b',
}

const resultActions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  justifyContent: 'center',
}
