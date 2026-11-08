import { createElement as h, useState } from 'react'
import { planAnswer, planReviewOptions } from '../../engine/question-answer.js'
import { CardButton, CardShell } from './shared.jsx'
import { QuestionCard } from './QuestionCard.jsx'

const PLAN_PREVIEW_LIMIT = 6000

/** One plan-review request, with a readable text preview. */
export function PlanReviewCard(props) {
  const { item, t, onOpenSession, onDismiss } = props
  const pending = item.interaction
  const question = Array.isArray(pending?.questions) ? pending.questions[0] : undefined
  const review = question === undefined ? null : planReviewOptions(question)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  if (review === null || question === undefined) {
    return h(QuestionCard, props)
  }

  const demo = item.demo === true
  const planText = review.plan.length > PLAN_PREVIEW_LIMIT
    ? `${review.plan.slice(0, PLAN_PREVIEW_LIMIT)}…`
    : review.plan

  async function answer(label) {
    if (busy || sent) return
    setBusy(true)
    setError(null)
    if (demo) {
      setSent(true)
      setBusy(false)
      onDismiss?.(item.id)
      return
    }
    try {
      await pending.answer(planAnswer(question, label))
      setSent(true)
      onDismiss?.(item.id)
    } catch {
      setBusy(false)
      setError(t('card.question.error'))
    }
  }

  const footer = []
  if (review.decline !== undefined) {
    footer.push(h(CardButton, {
      key: 'decline',
      variant: 'outline',
      disabled: busy || sent,
      onClick: () => answer(review.decline.label),
    }, t('card.plan.decline')))
  }
  footer.push(h(CardButton, {
    key: 'open',
    variant: 'ghost',
    onClick: () => onOpenSession?.(item.sessionId),
  }, t('card.plan.open')))
  footer.push(h(CardButton, {
    key: 'approve',
    variant: 'primary',
    disabled: busy || sent,
    onClick: () => answer(review.approve.label),
  }, t('card.plan.approve')))

  return h(CardShell, {
    title: t('card.plan.title'),
    subtitle: question.question,
    sessionTitle: item.sessionTitle,
    sessionId: item.sessionId,
    t,
    onOpenSession,
    onDismiss: () => onDismiss?.(item.id),
    dismissible: demo,
    demo,
    footer: h('div', { className: 'dni-card-actions-row dni-card-actions-wrap' }, footer),
  },
  h('pre', { className: 'dni-plan', tabIndex: 0 }, planText),
  sent ? h('div', { className: 'dni-success' }, t('card.answered')) : null,
  error !== null ? h('div', { className: 'dni-error', role: 'alert' }, error) : null,
  )
}
