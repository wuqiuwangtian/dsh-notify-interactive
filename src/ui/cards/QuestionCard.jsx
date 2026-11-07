import { createElement as h, useEffect, useState } from 'react'
import { QuestionIcon } from '../icons.jsx'
import {
  buildAnswer,
  createDrafts,
  firstIncompleteIndex,
  skipDraft,
  toggleOption,
  updateCustom,
} from '../../engine/question-answer.js'
import { CardButton, CardShell, usePendingSnapshot } from './shared.jsx'

const COUNTDOWN_STATES = new Set(['waiting', 'editing', 'continued'])

/** One pending ask_user_question request. */
export function QuestionCard({ item, t, onOpenSession, onDismiss }) {
  const pending = item.interaction
  const snapshot = usePendingSnapshot(pending)
  const questions = Array.isArray(pending?.questions) ? pending.questions : []
  const [drafts, setDrafts] = useState(() => createDrafts(questions))
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const demo = item.demo === true

  useEffect(() => {
    setDrafts(createDrafts(questions))
    // The card identity owns the draft lifetime; a new request remounts it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  const channel = snapshot?.channel ?? (demo ? 'demo' : 'none')
  const countdown = snapshot?.countdown
  const showCountdown = countdown !== undefined && !COUNTDOWN_STATES.has(snapshot?.waitState)
  const disabled = busy || sent

  function update(index, next) {
    setDrafts((current) => current.map((draft, draftIndex) => (draftIndex === index ? next : draft)))
    setError(null)
    setSent(false)
    pending?.engage?.()
  }

  async function submit() {
    if (disabled) return
    const incomplete = firstIncompleteIndex(drafts)
    if (incomplete >= 0) {
      setError(t('card.question.required'))
      return
    }
    setBusy(true)
    setError(null)
    if (demo) {
      setSent(true)
      setBusy(false)
      onDismiss?.(item.id)
      return
    }
    if (pending === undefined || pending === null || channel === 'none') {
      setBusy(false)
      setError(t('card.question.error'))
      return
    }
    try {
      await pending.answer(buildAnswer(questions, drafts))
      setSent(true)
      if (channel === 'rpc' && typeof pending.dismiss === 'function') {
        try {
          await pending.dismiss()
        } catch {
          // The host may already have closed the card.
        }
      }
      onDismiss?.(item.id)
    } catch {
      setBusy(false)
      setError(t('card.question.error'))
    }
  }

  function holdFocus() {
    pending?.holdFocus?.()
  }

  function releaseFocus(event) {
    if (event?.relatedTarget !== null && event?.relatedTarget !== undefined) {
      if (event.currentTarget.contains(event.relatedTarget)) return
    }
    pending?.releaseFocus?.()
  }

  const body = h('div', {
    className: 'dni-question-body',
    onPointerDownCapture: holdFocus,
    onFocusCapture: holdFocus,
    onBlurCapture: releaseFocus,
  },
  questions.map((question, index) => {
    const draft = drafts[index] ?? { selected: [], custom: '', skipped: false }
    const options = Array.isArray(question.options) ? question.options : []
    const multi = question.multiSelect === true
    return h('div', { key: question.id ?? index, className: 'dni-question' },
      question.header !== undefined
        ? h('div', { className: 'dni-question-header' }, question.header)
        : null,
      h('div', { className: 'dni-question-text' }, question.question),
      question.detail !== undefined && question.detail !== ''
        ? h('div', { className: 'dni-question-detail' }, question.detail)
        : null,
      multi
        ? h('div', { className: 'dni-question-hint' }, t('card.question.multi'))
        : null,
      options.length > 0
        ? h('div', { className: 'dni-options', role: 'group' },
          options.map((option) => {
            const selected = draft.selected.includes(option.label)
            return h('button', {
              key: option.label,
              type: 'button',
              className: `dni-option${selected ? ' is-selected' : ''}`,
              'aria-pressed': selected,
              disabled: disabled || draft.skipped === true,
              onClick: () => update(index, toggleOption(draft, option.label, multi)),
            },
            h('span', { className: 'dni-option-mark', 'aria-hidden': true }, selected ? '✓' : ''),
            h('span', { className: 'dni-option-text' },
              h('span', { className: 'dni-option-label' }, option.label),
              option.description !== undefined
                ? h('span', { className: 'dni-option-description' }, option.description)
                : null,
            ),
            )
          }),
        )
        : null,
      h('div', { className: `dni-custom-row${draft.custom !== '' ? ' is-active' : ''}` },
        h('label', { className: 'dni-custom-label', htmlFor: `dni-question-${item.id}-${index}` }, t('card.question.other')),
        h('input', {
          id: `dni-question-${item.id}-${index}`,
          className: 'dni-input',
          type: 'text',
          value: draft.custom,
          placeholder: t('card.question.otherPlaceholder'),
          disabled: disabled || draft.skipped === true,
          onChange: (event) => update(index, updateCustom(draft, event.target.value, multi)),
          onKeyDown: (event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
              event.preventDefault()
              submit()
            }
          },
        }),
      ),
      h('div', { className: 'dni-question-footer' },
        draft.skipped === true
          ? h('span', { className: 'dni-question-skipped' }, t('card.question.skipped'))
          : null,
        h('button', {
          type: 'button',
          className: 'dni-link-button',
          disabled: disabled,
          onClick: () => {
            update(index, draft.skipped === true
              ? { selected: [], custom: '', skipped: false }
              : skipDraft())
          },
        }, draft.skipped === true ? t('card.question.unskip') : t('card.question.skip')),
      ),
    )
  }),
  )

  const footerChildren = []
  if (showCountdown) {
    footerChildren.push(h('span', { key: 'countdown', className: 'dni-countdown' },
      countdown.running
        ? t('card.question.countdown', { seconds: Math.ceil(countdown.remainingMs / 1000) })
        : t('card.question.paused'),
    ))
    if (countdown.running) {
      footerChildren.push(h('button', {
        key: 'take-time',
        type: 'button',
        className: 'dni-link-button',
        onClick: () => pending?.takeTime?.(),
      }, t('card.question.takeTime')))
    }
  }
  footerChildren.push(h(CardButton, {
    key: 'submit',
    variant: 'primary',
    onClick: submit,
    disabled,
  }, sent ? t('card.question.sent') : t('card.question.submit')))

  return h(CardShell, {
    tone: 'info',
    icon: h(QuestionIcon, { size: 18 }),
    title: t('card.question.title'),
    sessionTitle: item.sessionTitle,
    sessionId: item.sessionId,
    t,
    onOpenSession,
    onDismiss: () => onDismiss?.(item.id),
    dismissible: demo,
    demo,
    badge: questions.length > 1
      ? h('span', { className: 'dni-badge dni-badge-neutral' }, String(questions.length))
      : null,
    footer: h('div', { className: 'dni-card-actions-row dni-card-actions-wrap' }, footerChildren),
  },
  body,
  sent ? h('div', { className: 'dni-success' }, t('card.question.sent')) : null,
  error !== null ? h('div', { className: 'dni-error', role: 'alert' }, error) : null,
  )
}
