/* Data-only UI. DSH Pending objects and authorization remain in their owning Web page. */
const card = document.getElementById('card')
const form = document.getElementById('interaction')
const error = document.getElementById('error')
let audio, audioEventId, activeId, view, viewKey, busy = false, uncertain = false, engaged = false
let zh = false
let actionQueue = Promise.resolve()
const text = (cn, en) => zh ? cn : en
function node(tag, content, className) {
  const element = document.createElement(tag)
  if (content !== undefined) element.textContent = content
  if (className) element.className = className
  return element
}
function measure() { window.reminder.rendered(activeId, Math.ceil(card.getBoundingClientRect().height), card.classList.contains('interactive') ? 420 : 360) }
function showError(message) { error.textContent = message; error.hidden = !message; measure() }
function controls() {
  for (const element of form.querySelectorAll('button,input,textarea')) element.disabled = !view || busy || uncertain || view.blocked === true
}
async function action(kind, answer) {
  if (!view || busy || uncertain || view.blocked) return false
  if (kind === 'answer') { busy = true; controls() }
  const id = activeId
  try {
    const request = actionQueue.then(() => activeId === id ? window.reminder.interact(id, kind, answer) : { status: 'unavailable' })
    actionQueue = request.catch(() => {})
    const result = await request
    if (activeId !== id) return false
    if (result.status !== 'success') {
      if (result.status === 'uncertain') uncertain = true
      showError(result.status === 'uncertain'
        ? text('提交结果未确认，请回会话核对。', 'Result unconfirmed. Check the conversation.')
        : text('请求已变化或 Web 未连接，请回会话处理。', 'Request changed or Web unavailable. Open the conversation.'))
      return false
    }
    return true
  } catch {
    if (activeId === id) { uncertain = true; showError(text('连接中断，请回会话核对。', 'Connection lost. Check the conversation.')) }
    return false
  } finally { if (activeId === id && kind === 'answer') { busy = false; controls() } }
}
function edit() {
  if (!engaged) { engaged = true; void action('engage') }
}
function renderInteraction(next) {
  if (!next && viewKey && form.childElementCount) {
    view = null; controls()
    showError(text('Web 暂不可用，回答草稿已保留。可回会话处理。', 'Web unavailable. Draft kept. Open the conversation to continue.'))
    return
  }
  const { countdown, blocked, token, channel, ...stable } = next ?? {}
  const key = JSON.stringify(stable)
  const wasUnavailable = !view
  view = next
  // Preserve drafts, focus and input composition through heartbeat/countdown updates.
  if (viewKey === key) { if (wasUnavailable && !uncertain) error.hidden = true; updateCountdown(); controls(); return }
  viewKey = key
  form.replaceChildren()
  busy = false; uncertain = false; engaged = false
  error.hidden = true
  card.classList.toggle('interactive', Boolean(view))
  document.getElementById('open').classList.toggle('primary', !view)
  document.getElementById('body').hidden = Boolean(view)
  if (!view) { measure(); return }
  if (view.kind === 'approval') {
    form.append(node('div', view.toolName, 'tool'), node('p', view.description))
    const row = node('div', undefined, 'decision-actions')
    for (const [label, outcome, style] of [[text('拒绝', 'Reject'), 'rejected', ''], [text('允许一次', 'Allow once'), 'allowed-once', 'primary']]) {
      const button = node('button', label, style)
      button.type = 'button'
      button.onclick = async () => { if (await action('answer', outcome)) window.reminder.dismiss(activeId) }
      row.append(button)
    }
    form.append(row)
  } else {
    const drafts = view.questions.map(() => ({ selected: [], custom: '', skipped: false }))
    const content = node('div', undefined, 'questions')
    view.questions.forEach((question, index) => {
      const draft = drafts[index]
      const field = node('fieldset')
      field.append(node('legend', question.question))
      if (question.detail) field.append(node('p', question.detail, 'detail'))
      const options = node('div', undefined, 'options')
      const inputs = []
      for (const option of question.options) {
        const label = node('label', undefined, 'option')
        const input = node('input')
        input.type = question.multiSelect ? 'checkbox' : 'radio'
        input.name = `q-${index}`
        input.value = option.label
        const copy = node('span')
        copy.append(node('span', option.label))
        if (option.description) copy.append(node('small', option.description))
        label.append(input, copy); inputs.push(input)
        input.onchange = () => {
          if (question.multiSelect) draft.selected = inputs.filter(i => i.checked).map(i => i.value)
          else { draft.selected = [input.value]; draft.custom = ''; custom.value = '' }
          draft.skipped = false; skip.setAttribute('aria-pressed', 'false'); edit()
        }
        options.append(label)
      }
      field.append(options)
      const custom = node('textarea')
      custom.rows = 2
      custom.maxLength = 8000
      custom.placeholder = text('自定义回答', 'Custom answer')
      custom.setAttribute('aria-label', question.question + ' — ' + custom.placeholder)
      custom.oninput = () => {
        draft.custom = custom.value; draft.skipped = false
        if (!question.multiSelect) { draft.selected = []; for (const input of inputs) input.checked = false }
        skip.setAttribute('aria-pressed', 'false'); edit()
      }
      // IME Enter only edits the draft. Submission always requires the explicit button.
      const skip = node('button', text('跳过此题', 'Skip question'), 'skip')
      skip.type = 'button'; skip.setAttribute('aria-pressed', 'false')
      skip.onclick = () => {
        draft.skipped = !draft.skipped; draft.selected = []; draft.custom = ''; custom.value = ''
        for (const input of inputs) input.checked = false
        skip.setAttribute('aria-pressed', String(draft.skipped)); edit()
      }
      field.append(custom, skip); content.append(field)
    })
    form.append(content)
    const row = node('div', undefined, 'decision-actions')
    const countdownNode = node('span', undefined, 'countdown'); countdownNode.id = 'countdown'
    const takeTime = node('button', text('慢慢回答', 'Take time')); takeTime.id = 'take-time'; takeTime.type = 'button'
    takeTime.onclick = () => void action('take-time')
    const submit = node('button', text('提交回答', 'Submit answers'), 'primary'); submit.type = 'button'
    submit.onclick = async () => {
      const incomplete = drafts.findIndex(d => !d.skipped && !d.selected.length && !d.custom.trim())
      if (incomplete !== -1) { content.querySelectorAll('textarea')[incomplete].focus(); showError(text('请回答每道题，或明确选择跳过。', 'Answer each question or explicitly skip it.')); return }
      const answer = { answers: view.questions.map((q, i) => {
        const d = drafts[i], custom = d.custom.trim()
        return { id: q.id, selected: d.skipped ? [] : [...d.selected], ...(!d.skipped && custom ? { custom } : {}) }
      }) }
      if (JSON.stringify(answer).length > 48000) { showError(text('回答过长，请缩短或回会话提交。', 'Answers too long. Shorten them or submit in the conversation.')); return }
      if (await action('answer', answer)) window.reminder.dismiss(activeId)
    }
    row.append(countdownNode, takeTime, submit); form.append(row)
    updateCountdown()
  }
  controls(); measure()
}
function updateCountdown() {
  const label = document.getElementById('countdown'), button = document.getElementById('take-time')
  if (!label || !button) return
  const countdown = view?.countdown
  label.hidden = !countdown
  label.textContent = countdown?.running ? text(`剩余 ${Math.ceil(countdown.remainingMs / 1000)} 秒`, `${Math.ceil(countdown.remainingMs / 1000)}s left`) : text('计时已暂停', 'Timer paused')
  button.hidden = !countdown?.running
}
window.reminder.onMessage(message => {
  if (message.type === 'silence') { if (audioEventId === message.eventId) audio?.pause(); return }
  if (message.type === 'interaction-update') { if (activeId === message.id) renderInteraction(message.interaction); return }
  if (message.audio) {
    audio?.pause(); audioEventId = message.eventId; audio = new Audio(message.audio); audio.volume = message.volume
    audio.play().then(() => window.reminder.audioResult(message.id, true), () => window.reminder.audioResult(message.id, false))
  }
  if (message.audioOnly) { window.reminder.rendered(message.id); return }
  activeId = message.id; viewKey = undefined
  zh = /[\u3400-\u9fff]/.test(message.openLabel)
  for (const [name, value] of Object.entries(message.theme ?? {})) {
    if (/^--(?:dsw|dsh|ds)-[a-zA-Z0-9-]+$/.test(name) && typeof value === 'string' && !/url\s*\(/i.test(value)) document.documentElement.style.setProperty(name, value)
  }
  const session = document.getElementById('session')
  session.textContent = message.sessionTitle ?? ''; session.title = message.sessionTitle ?? ''; session.hidden = !message.sessionTitle
  document.getElementById('body').textContent = message.body
  document.getElementById('open').textContent = message.openLabel
  document.getElementById('close').textContent = message.closeLabel ?? text('关闭', 'Close')
  card.hidden = message.popup === false
  renderInteraction(message.interaction ?? null)
})
document.getElementById('open').onclick = () => window.reminder.openSession(activeId)
document.getElementById('close').onclick = () => window.reminder.dismiss(activeId)
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !event.isComposing) window.reminder.dismiss(activeId) })
new ResizeObserver(() => { if (activeId && !card.hidden) measure() }).observe(card)
window.reminder.ready()
