// Data-only boundary shared by the host and the live Web owner.
export function presentationOf(pending, resolveText = value => value?.en ?? '') {
  if (!pending) return null
  if (pending.kind === 'approval') {
    if (pending.answerable !== true || typeof pending.callId !== 'string' || !pending.callId) return null
    return { kind: 'approval', callId: pending.callId, toolName: String(pending.toolName ?? ''),
      reason: String(pending.reason ?? ''), description: String(pending.displayReason ? resolveText(pending.displayReason) : pending.reason ?? '') }
  }
  const state = pending.snapshot?.()
  if (!['question', 'plan-review'].includes(pending.kind) || state?.closed || !['waterfall', 'rpc'].includes(state?.channel)) return null
  const questions = pending.questions
  if (!Array.isArray(questions) || !questions.length) return null
  // Blocking asks are unnamed; plan review names its tool in the presentation intent.
  const intentCallId = pending.kind === 'plan-review' && questions.length === 1 ? questions[0].intent?.callId : undefined
  const callId = pending.callId ?? intentCallId ?? ''
  return { kind: pending.kind, callId, channel: state.channel,
    questions: questions.map(q => ({ id: q.id, question: q.question, multiSelect: q.multiSelect === true,
      ...(q.header ? { header: q.header } : {}), ...(q.detail ? { detail: q.detail } : {}),
      ...(q.intent?.kind === 'plan-review' ? { intent: { kind: 'plan-review', approve: q.intent.approve } } : {}),
      options: (q.options ?? []).map(o => ({ label: o.label, ...(o.description ? { description: o.description } : {}) })) })),
    ...(state.countdown ? { countdown: { remainingMs: state.countdown.remainingMs, running: state.countdown.running === true } } : {}) }
}

export function validPresentation(value) {
  const text = (s, n) => typeof s === 'string' && s.length <= n
  if (!value || !text(value.callId, 200) || JSON.stringify(value).length > 48000) return false
  if (value.kind === 'approval') return Boolean(value.callId) && text(value.toolName, 200) && text(value.reason, 4000) && text(value.description, 4000)
  if (!['question', 'plan-review'].includes(value.kind) || !['waterfall', 'rpc'].includes(value.channel)) return false
  const qs = value.questions
  return Array.isArray(qs) && qs.length > 0 && qs.length <= 32 && new Set(qs.map(q => q.id)).size === qs.length && qs.every(q =>
    text(q.id, 200) && text(q.question, 8000) && (q.header === undefined || text(q.header, 200)) &&
    (q.detail === undefined || text(q.detail, 24000)) && typeof q.multiSelect === 'boolean' &&
    Array.isArray(q.options) && q.options.length <= 64 && new Set(q.options.map(o => o.label)).size === q.options.length &&
    q.options.every(o => text(o.label, 1000) && (o.description === undefined || text(o.description, 4000))))
}

export function validAnswer(view, answer) {
  if (JSON.stringify(answer)?.length > 48000) return false
  if (view.kind === 'approval') return answer === 'allowed-once' || answer === 'rejected'
  if (!answer || !Array.isArray(answer.answers) || answer.answers.length !== view.questions.length) return false
  return view.questions.every((q, index) => {
    const a = answer.answers[index]
    return a?.id === q.id && Array.isArray(a.selected) && new Set(a.selected).size === a.selected.length &&
      a.selected.every(label => q.options.some(option => option.label === label)) &&
      (a.custom === undefined || (typeof a.custom === 'string' && a.custom.length <= 8000)) &&
      (q.multiSelect || (a.selected.length <= 1 && !(a.selected.length && a.custom?.trim())))
  })
}

// Countdown ticks do not change the request's data identity.
export function presentationKey(view) {
  if (!view) return ''
  const { countdown, ...stable } = view
  return JSON.stringify(stable)
}

/** Match the blocking tool's public arguments to its Pending presentation, without local render keys. */
export function questionsKey(questions) {
  if (!Array.isArray(questions) || !questions.length) return ''
  return JSON.stringify(questions.map(q => ({ id: q.id, question: q.question, header: q.header ?? '', detail: q.detail ?? '',
    multiSelect: (q.multiSelect ?? q.multi_select) === true,
    options: (q.options ?? []).map(o => ({ label: o.label, description: o.description ?? '' })) })))
}
