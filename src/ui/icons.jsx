import { createElement as h } from 'react'

function svg(props, children) {
  return h('svg', {
    viewBox: '0 0 24 24',
    width: props.size ?? 16,
    height: props.size ?? 16,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
    className: props.className,
  }, children)
}

export function BellIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'bell', d: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9' }),
    h('path', { key: 'clapper', d: 'M10.3 21a1.9 1.9 0 0 0 3.4 0' }),
  ])
}

export function AlertIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'triangle', d: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z' }),
    h('path', { key: 'line', d: 'M12 9v4' }),
    h('path', { key: 'dot', d: 'M12 17h.01' }),
  ])
}

export function QuestionIcon(props = {}) {
  return svg(props, [
    h('circle', { key: 'circle', cx: 12, cy: 12, r: 9 }),
    h('path', { key: 'q', d: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4' }),
    h('path', { key: 'dot', d: 'M12 17h.01' }),
  ])
}

export function CheckIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'check', d: 'M20 6 9 17l-5-5' }),
  ])
}

export function CloseIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'x', d: 'M18 6 6 18' }),
    h('path', { key: 'x2', d: 'm6 6 12 12' }),
  ])
}

export function PlanIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'page', d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
    h('path', { key: 'fold', d: 'M14 2v6h6' }),
    h('path', { key: 'lines', d: 'M8 13h8M8 17h5' }),
  ])
}

export function SoundIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'speaker', d: 'M11 5 6 9H2v6h4l5 4z' }),
    h('path', { key: 'wave', d: 'M15.5 8.5a5 5 0 0 1 0 7' }),
    h('path', { key: 'wave2', d: 'M18.5 5.5a9 9 0 0 1 0 13' }),
  ])
}

export function PopupIcon(props = {}) {
  return svg(props, [
    h('rect', { key: 'rect', x: 3, y: 3, width: 18, height: 14, rx: 2 }),
    h('path', { key: 'line', d: 'M3 9h18' }),
  ])
}

export function WindowsIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'w', d: 'M3 5.5 11 4v7H3z' }),
    h('path', { key: 'w2', d: 'M13 3.7 21 2.5V11h-8z' }),
    h('path', { key: 'w3', d: 'M3 13h8v7L3 18.5z' }),
    h('path', { key: 'w4', d: 'M13 13h8v8.5L13 20.3z' }),
  ])
}

export function ArrowIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'arrow', d: 'M7 17 17 7' }),
    h('path', { key: 'head', d: 'M8 7h9v9' }),
  ])
}

export function SparkIcon(props = {}) {
  return svg(props, [
    h('path', { key: 'spark', d: 'm12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z' }),
  ])
}
