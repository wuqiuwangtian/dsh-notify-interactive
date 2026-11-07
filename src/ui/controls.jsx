import { createElement as h } from 'react'

/** A small set of host-styled controls; no Harness Client package is imported. */
export function Button({
  variant = 'outline',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  onClick,
  title,
  children,
  ...rest
}) {
  return h('button', {
    ...rest,
    type,
    className: `dni-btn dni-btn-${variant} dni-btn-${size}${className === '' ? '' : ` ${className}`}`,
    disabled,
    onClick,
    title,
  }, children)
}

export function Switch({ checked, onChange, label, disabled = false }) {
  return h('button', {
    type: 'button',
    role: 'switch',
    'aria-checked': Boolean(checked),
    'aria-label': label,
    className: `dni-switch${checked ? ' is-on' : ''}`,
    disabled,
    onClick: () => onChange(!checked),
  }, h('span', { className: 'dni-switch-knob', 'aria-hidden': true }))
}

export function Field({ label, hint, children }) {
  return h('div', { className: 'dni-field' },
    h('div', { className: 'dni-field-text' },
      h('div', { className: 'dni-field-label' }, label),
      hint !== undefined && hint !== null
        ? h('div', { className: 'dni-field-hint' }, hint)
        : null,
    ),
    h('div', { className: 'dni-field-control' }, children),
  )
}

export function Section({ title, children }) {
  return h('section', { className: 'dni-section' },
    title !== undefined ? h('h3', { className: 'dni-section-title' }, title) : null,
    h('div', { className: 'dni-section-body' }, children),
  )
}

export function Select({ value, onChange, options, label }) {
  return h('select', {
    className: 'dni-select',
    value,
    'aria-label': label,
    onChange: (event) => onChange(event.target.value),
  }, options.map((option) => h('option', { key: option.value, value: option.value }, option.label)))
}

export function Slider({ value, min = 0, max = 1, step = 0.05, onChange, label }) {
  return h('input', {
    type: 'range',
    className: 'dni-slider',
    value,
    min,
    max,
    step,
    'aria-label': label,
    onChange: (event) => onChange(Number(event.target.value)),
  })
}

export function Badge({ tone = 'neutral', children }) {
  return h('span', { className: `dni-badge dni-badge-${tone}` }, children)
}

export function IconButton({ label, onClick, disabled = false, children }) {
  return h('button', {
    type: 'button',
    className: 'dni-icon-button',
    'aria-label': label,
    title: label,
    disabled,
    onClick,
  }, children)
}

export function Divider() {
  return h('div', { className: 'dni-divider', role: 'separator' })
}
