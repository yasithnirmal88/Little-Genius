'use client'

import { useState } from 'react'
import { Btn } from './ui/Btn'

export default function QuizEngine({ questions, onComplete, onContinue, passingScore = 80, title = 'Quiz' }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)

  const q = questions[idx]
  if (!questions || questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>
        No questions yet.
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
      setIdx(idx + 1)
      setSelected(null)
      setSubmitted(false)
    } else {
      const finalAnswers = [...answers, { questionIndex: idx, selected, correct: selected === q.correct_index }]
      const correctCount = finalAnswers.filter((a) => a.correct).length
      const score = Math.round((correctCount / questions.length) * 100)
      setFinished(true)
      onComplete({ score, passed: score >= passingScore, correctCount, total: questions.length, answers: finalAnswers })
    }
  }

  if (finished) {
    const correctCount = answers.filter((a) => a.correct).length + (selected === q.correct_index ? 1 : 0)
    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= passingScore
    return (
      <div style={{ textAlign: 'center', padding: 'clamp(16px, 3vw, 32px)' }}>
        <div style={{ fontSize: 'clamp(40px, 8vw, 60px)', marginBottom: 8 }}>
          {passed ? '🎉' : '😅'}
        </div>
        <div style={{ fontWeight: 700, fontSize: 'clamp(18px, 3vw, 24px)', color: passed ? '#00b894' : '#e17055' }}>
          {passed ? 'Great job!' : 'Keep trying!'}
        </div>
        <div style={{ fontSize: 'clamp(13px, 2vw, 16px)', color: '#636e72', marginTop: 8 }}>
          {correctCount} / {questions.length} correct
        </div>
        <div style={{
          margin: '16px auto',
          width: 'clamp(140px, 30vw, 200px)',
          height: 8,
          background: '#f0f0f0',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${score}%`,
            height: 8,
            background: passed ? '#00b894' : '#e17055',
            borderRadius: 4,
            transition: 'width .5s',
          }} />
        </div>
        <div style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#aaa', marginBottom: 16 }}>
          Passing score: {passingScore}% · Your score: {score}%
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn onClick={() => { setIdx(0); setSelected(null); setSubmitted(false); setAnswers([]); setFinished(false) }} color="#667eea" outline>
            Retry
          </Btn>
          {onContinue && (
            <Btn onClick={onContinue} color="#00b894">
              Continue →
            </Btn>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 16px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 2vw, 14px)', color: '#636e72' }}>
          {title}
        </div>
        <div style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: '#aaa' }}>
          Q{idx + 1}/{questions.length}
        </div>
      </div>
      <div style={{ background: '#f0f0f0', borderRadius: 6, height: 6 }}>
        <div style={{
          width: `${((idx + (submitted ? 1 : 0)) / questions.length) * 100}%`,
          height: 6,
          background: 'linear-gradient(90deg,#667eea,#764ba2)',
          borderRadius: 6,
          transition: 'width .3s',
        }} />
      </div>
      <div style={{
        background: 'white',
        borderRadius: 'clamp(12px, 2vw, 16px)',
        padding: 'clamp(14px, 2.5vw, 24px)',
        border: '1.5px solid #eee',
      }}>
        <div style={{ fontWeight: 700, fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#2d3436', marginBottom: 'clamp(12px, 2vw, 20px)' }}>
          {q.question_text}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, oi) => {
            const isSelected = selected === oi
            const isCorrect = q.correct_index === oi
            let bg = 'white'
            let border = '#e0e0e0'
            let txt = '#2d3436'
            if (submitted) {
              if (isCorrect) { bg = '#00b89411'; border = '#00b894'; txt = '#00b894' }
              else if (isSelected && !isCorrect) { bg = '#ff767522'; border = '#e17055'; txt = '#e17055' }
              else { border = '#f0f0f0'; txt = '#bbb' }
            } else if (isSelected) {
              bg = '#667eea11'; border = '#667eea'; txt = '#667eea'
            }
            return (
              <button
                key={oi}
                onClick={() => { if (!submitted) setSelected(oi) }}
                disabled={submitted}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 12px)',
                  padding: 'clamp(10px, 1.5vw, 14px) clamp(12px, 2vw, 16px)',
                  border: `2px solid ${border}`,
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  background: bg,
                  cursor: submitted ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: 'clamp(13px, 2vw, 15px)',
                  color: txt,
                  fontWeight: isSelected || submitted ? 600 : 400,
                  transition: 'all .15s',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{
                  width: 'clamp(22px, 4vw, 28px)',
                  height: 'clamp(22px, 4vw, 28px)',
                  borderRadius: '50%',
                  border: `2px solid ${submitted && isCorrect ? '#00b894' : border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(11px, 1.5vw, 13px)',
                  fontWeight: 700,
                  flexShrink: 0,
                  background: submitted && isCorrect ? '#00b894' : 'transparent',
                  color: submitted && isCorrect ? 'white' : txt,
                }}>
                  {submitted && isCorrect ? '✓' : submitted && isSelected && !isCorrect ? '✗' : String.fromCharCode(65 + oi)}
                </span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!submitted ? (
          <Btn onClick={handleSubmit} color="#667eea" style={{ padding: '10px 24px' }}>
            Submit
          </Btn>
        ) : (
          <Btn onClick={handleNext} color="#667eea" style={{ padding: '10px 24px' }}>
            {idx < questions.length - 1 ? 'Next →' : 'See Results'}
          </Btn>
        )}
      </div>
    </div>
  )
}
