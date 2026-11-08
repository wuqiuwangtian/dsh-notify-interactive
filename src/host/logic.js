/**
 * Pure host-side notification formatting and presence policy.
 * Kept separate from process spawning so it can be tested without PowerShell.
 */

import { basename } from 'node:path'

export const PRESENCE_TTL_MS = 15_000
export const BODY_LIMIT = 500

export function truncate(value, limit = BODY_LIMIT) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (text.length <= limit) return text
  return `${text.slice(0, Math.max(0, limit - 1))}…`
}

/** Human-facing session label: cwd basename, then a short session id. */
export function sessionLabel(session) {
  const cwd = session?.header?.cwd
  if (typeof cwd === 'string' && cwd !== '') {
    const name = basename(cwd)
    if (name !== '') return name
  }
  const id = String(session?.id ?? '')
  return id === '' ? 'DSH' : id.slice(0, 8)
}

/**
 * Whether the host should emit its own Windows fallback.
 * A recent active web peer means the web client owns delivery (popup or its own
 * fallback call); otherwise this is a CLI/TUI or a closed page.
 */
export function shouldAutoNotify(lastPresence, now = Date.now(), ttl = PRESENCE_TTL_MS) {
  if (lastPresence === null || lastPresence === undefined) return true
  if (typeof lastPresence.at !== 'number') return true
  if (now - lastPresence.at > ttl) return true
  return lastPresence.active !== true
}

function questionOf(argumentsText) {
  if (typeof argumentsText !== 'string' || argumentsText === '') return undefined
  try {
    const parsed = JSON.parse(argumentsText)
    const question = parsed?.questions?.[0]?.question
    return typeof question === 'string' && question !== '' ? question : undefined
  } catch {
    return undefined
  }
}

export function reasonLabel(kind) {
  switch (kind) {
    case 'completed': return '完成'
    case 'error': return '出错'
    case 'max-tokens': return '超出长度'
    case 'blocked': return '被阻塞'
    case 'aborted': return '已中断'
    default: return kind === undefined ? '结束' : String(kind)
  }
}

/**
 * Map one committed session event to a Windows reminder.
 * @returns {{ kind: string, title: string, body: string } | null}
 */
export function messageForEvent(session, event) {
  if (session?.header?.origin === 'subagent') return null
  const label = sessionLabel(session)
  const type = event?.type
  const data = event?.data ?? {}

  if (type === 'approval/asked') {
    const tool = typeof data.toolName === 'string' && data.toolName !== '' ? data.toolName : '工具'
    const reason = typeof data.reason === 'string' && data.reason !== '' ? `：${data.reason}` : ''
    return {
      kind: 'approval',
      title: 'DSH 需要你',
      body: truncate(`会话 ${label}：${tool} 请求批准${reason}`),
    }
  }

  if (type === 'tool/call') {
    if (data.name === 'ask_user_question') {
      const question = questionOf(data.arguments)
      return {
        kind: 'question',
        title: 'DSH 需要你',
        body: truncate(`会话 ${label}：${question ?? '智能体正在等待你的回答'}`),
      }
    }
    if (data.name === 'exit_plan_mode') {
      return {
        kind: 'plan-review',
        title: 'DSH 需要你',
        body: truncate(`会话 ${label}：计划等待你审核`),
      }
    }
    return null
  }

  if (type === 'turn/end') {
    const reason = data.reason?.kind
    if (reason === 'aborted') return null
    return {
      kind: 'completion',
      title: 'DSH 任务结束',
      body: truncate(`会话 ${label}：本轮已结束（${reasonLabel(reason)}）`),
    }
  }

  return null
}
