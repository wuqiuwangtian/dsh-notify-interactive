import { createElement as h } from 'react'
import { ApprovalCard } from './ApprovalCard.jsx'
import { QuestionCard } from './QuestionCard.jsx'
import { PlanReviewCard } from './PlanReviewCard.jsx'
import { CompletionCard } from './CompletionCard.jsx'

/**
 * Render one notification queue.
 * The caller supplies the same handlers to the in-page overlay and the popup,
 * so a card answered in either surface behaves identically.
 */
export function CardList({ items, t, settings, resolveText, onOpenSession, onDismiss }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return h('div', { className: 'dni-card-list' },
    items.map((item) => {
      if (item.kind === 'approval') {
        return h(ApprovalCard, {
          key: item.id,
          item,
          t,
          resolveText,
          onOpenSession,
          onDismiss,
        })
      }
      if (item.kind === 'question') {
        return h(QuestionCard, {
          key: item.id,
          item,
          t,
          onOpenSession,
          onDismiss,
        })
      }
      if (item.kind === 'plan-review') {
        return h(PlanReviewCard, {
          key: item.id,
          item,
          t,
          onOpenSession,
          onDismiss,
        })
      }
      if (item.kind === 'completion') {
        return h(CompletionCard, {
          key: item.id,
          item,
          t,
          settings,
          onOpenSession,
          onDismiss,
        })
      }
      return null
    }),
  )
}

let demoSequence = 0

/**
 * Local-only cards used by the settings page tests. They never touch a real
 * Host request and never answer anything.
 */
export function createDemoItems({ t, sessionId, sessionTitle }) {
  demoSequence += 1
  const suffix = `${Date.now()}:${demoSequence}`
  const targetSession = sessionId ?? 'demo-session'
  const targetTitle = sessionTitle ?? t('card.demo')
  return {
    approval: {
      id: `demo:approval:${suffix}`,
      kind: 'approval',
      scenario: 'approval',
      sessionId: targetSession,
      sessionTitle: targetTitle,
      demo: true,
      sticky: false,
      interaction: {
        kind: 'approval',
        key: `demo-approval-${suffix}`,
        toolName: 'Bash',
        reason: t('demo.approvalBody'),
        answerable: true,
      },
    },
    question: {
      id: `demo:question:${suffix}`,
      kind: 'question',
      scenario: 'question',
      sessionId: targetSession,
      sessionTitle: targetTitle,
      demo: true,
      sticky: false,
      interaction: {
        kind: 'question',
        key: `demo-question-${suffix}`,
        questions: [{
          id: 'demo-q',
          header: t('card.demo'),
          question: t('demo.question'),
          options: [
            { label: t('demo.questionOptionA') },
            { label: t('demo.questionOptionB') },
            { label: t('demo.questionOptionC') },
          ],
        }],
      },
    },
    completion: {
      id: `demo:completion:${suffix}`,
      kind: 'completion',
      scenario: 'completion',
      sessionId: targetSession,
      sessionTitle: targetTitle,
      demo: true,
      sticky: false,
      completedAt: Date.now(),
    },
  }
}
