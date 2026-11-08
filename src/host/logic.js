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


/**
 * Encode one popup as base64 JSON. The payload travels inside the PowerShell
 * command, which avoids WSL interop dropping custom environment variables.
 */
export function popupPayload(title, body, silent = false, url = '') {
  const json = JSON.stringify({
    title: truncate(title, 80),
    body: truncate(body, 500),
    silent: silent === true,
    url: typeof url === 'string' ? url : '',
  })
  return Buffer.from(json, 'utf8').toString('base64')
}

/**
 * Build the PowerShell WinForms reminder.
 *
 * It is a small, topmost, bottom-right window with the message and two real
 * buttons: "打开 DSH" (when a URL is available) and "关闭". It auto-closes
 * after five minutes.
 */
export function popupScript(payload) {
  return `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}'))
$data = $json | ConvertFrom-Json
if (-not $data.silent) { [System.Media.SystemSounds]::Asterisk.Play() }
$form = New-Object System.Windows.Forms.Form
$form.Text = [string]$data.title
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ShowInTaskbar = $true
$form.TopMost = $true
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.AutoSize = $true
$form.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$form.MinimumSize = New-Object System.Drawing.Size(360, 0)
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 31, 34)
$form.ForeColor = [System.Drawing.Color]::FromArgb(230, 230, 230)
$form.Padding = New-Object System.Windows.Forms.Padding(16)
$body = New-Object System.Windows.Forms.Label
$body.Text = [string]$data.body
$body.AutoSize = $true
$body.MaximumSize = New-Object System.Drawing.Size(420, 0)
$body.ForeColor = [System.Drawing.Color]::FromArgb(230, 230, 230)
$body.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$buttons = New-Object System.Windows.Forms.FlowLayoutPanel
$buttons.FlowDirection = [System.Windows.Forms.FlowDirection]::RightToLeft
$buttons.AutoSize = $true
$buttons.Dock = [System.Windows.Forms.DockStyle]::Fill
if ($data.url -ne '') {
  $open = New-Object System.Windows.Forms.Button
  $open.Text = '打开 DSH'
  $open.AutoSize = $true
  $open.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
  $open.BackColor = [System.Drawing.Color]::FromArgb(77, 107, 254)
  $open.ForeColor = [System.Drawing.Color]::White
  $open.Add_Click({ Start-Process ([string]$data.url); $form.Close() })
  $buttons.Controls.Add($open)
}
$close = New-Object System.Windows.Forms.Button
$close.Text = '关闭'
$close.AutoSize = $true
$close.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$close.BackColor = [System.Drawing.Color]::FromArgb(45, 46, 50)
$close.ForeColor = [System.Drawing.Color]::FromArgb(230, 230, 230)
$close.Add_Click({ $form.Close() })
$buttons.Controls.Add($close)
$layout = New-Object System.Windows.Forms.TableLayoutPanel
$layout.ColumnCount = 1
$layout.RowCount = 2
$layout.AutoSize = $true
$layout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$layout.Dock = [System.Windows.Forms.DockStyle]::Fill
$layout.Controls.Add($body, 0, 0)
$layout.Controls.Add($buttons, 0, 1)
$form.Controls.Add($layout)
$form.Add_Shown({
  $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
  $form.Location = New-Object System.Drawing.Point(($wa.Right - $form.Width - 24), ($wa.Bottom - $form.Height - 24))
  $form.Activate()
})
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 300000
$timer.Add_Tick({ $form.Close() })
$timer.Start()
$form.ShowDialog() | Out-Null
$timer.Stop()
$form.Dispose()
`
}
