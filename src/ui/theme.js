/**
 * Copy the live DSH theme into a detached popup document.
 *
 * The popup is a separate document, so it does not inherit the host's CSS
 * variables. We enumerate same-origin stylesheet custom properties, read their
 * resolved values from the main document, and set the same values on the popup
 * root. A later theme switch re-runs this function.
 */

const KNOWN_TOKENS = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-layer-3',
  '--dsw-alias-bg-layer-4',
  '--dsw-alias-bg-overlay',
  '--dsw-alias-bg-mask-1',
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-border-l3',
  '--dsw-alias-border-l4',
  '--dsw-alias-brand-primary',
  '--dsw-alias-label-primary',
  '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary',
  '--dsw-alias-label-caption',
  '--dsw-alias-label-dimmed',
  '--dsw-alias-label-primary-foreground',
  '--dsw-alias-state-error-primary',
  '--dsw-alias-state-idle-primary',
  '--dsw-alias-state-success-primary',
  '--dsw-alias-state-success-tertiary',
  '--dsw-alias-state-warn-primary',
  '--dsw-alias-state-warn-secondary',
  '--dsw-alias-state-warn-tertiary',
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-interactive-bg-hover-danger',
  '--dsw-alias-interactive-bg-active',
  '--dsw-alias-button-primary-fill',
  '--dsw-alias-button-primary-hover',
  '--dsw-alias-toast-bg',
  '--dsw-alias-toast-label',
  '--dsw-alias-scrollbar-bg-l2',
  '--dsw-alias-scrollbar-hover-l2',
  '--dsw-specific-sidebar-fill',
  '--dsh-chat-content-width',
  '--dsh-composer-side-clearance',
  '--ds-font-family',
  '--ds-font-family-code',
]

const CUSTOM_PREFIXES = ['--dsw-', '--dsh-', '--ds-']

function collectFromStyleSheets(sourceDocument) {
  const names = new Set()
  for (const sheet of Array.from(sourceDocument.styleSheets)) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      // Cross-origin stylesheet: skip it rather than fail the whole copy.
      continue
    }
    if (rules === undefined || rules === null) continue
    for (const rule of Array.from(rules)) {
      const style = rule.style
      if (style === undefined || style === null) continue
      for (let index = 0; index < style.length; index += 1) {
        const name = style[index]
        if (CUSTOM_PREFIXES.some((prefix) => name.startsWith(prefix))) names.add(name)
      }
      if (rule.cssRules !== undefined && rule.cssRules !== null) {
        for (const nested of Array.from(rule.cssRules)) {
          const nestedStyle = nested.style
          if (nestedStyle === undefined || nestedStyle === null) continue
          for (let index = 0; index < nestedStyle.length; index += 1) {
            const name = nestedStyle[index]
            if (CUSTOM_PREFIXES.some((prefix) => name.startsWith(prefix))) names.add(name)
          }
        }
      }
    }
  }
  return names
}

function copyThemeAttributes(sourceDocument, targetDocument) {
  const sourceRoot = sourceDocument.documentElement
  const targetRoot = targetDocument.documentElement
  for (const name of ['theme', 'colorScheme', 'color-scheme', 'platform', 'fontSize']) {
    const value = sourceRoot.dataset?.[name]
    if (value !== undefined) targetRoot.dataset[name] = value
  }
  const body = sourceDocument.body
  const view = sourceDocument.defaultView
  if (body !== null && view !== null) {
    const bodyStyle = view.getComputedStyle(body)
    targetDocument.body.style.fontFamily = bodyStyle.fontFamily
    targetDocument.body.style.fontSize = bodyStyle.fontSize
    targetDocument.body.style.color = 'var(--dsw-alias-label-primary)'
    targetDocument.body.style.background = 'var(--dsw-alias-bg-base)'
  }
}

/**
 * Copy every live theme token from one document to another.
 * @param {Document} sourceDocument the DSH page document.
 * @param {Document} targetDocument the popup document.
 */
export function applyTheme(sourceDocument, targetDocument) {
  if (sourceDocument === undefined || sourceDocument === null) return
  if (targetDocument === undefined || targetDocument === null) return
  const sourceRoot = sourceDocument.documentElement
  const targetRoot = targetDocument.documentElement
  if (sourceRoot === undefined || sourceRoot === null) return
  if (targetRoot === undefined || targetRoot === null) return
  const view = sourceDocument.defaultView
  if (view === null || view === undefined) return
  const computed = view.getComputedStyle(sourceRoot)
  const names = new Set([...KNOWN_TOKENS, ...collectFromStyleSheets(sourceDocument)])
  for (const name of names) {
    const value = computed.getPropertyValue(name)
    if (value !== undefined && value !== null && value !== '') {
      targetRoot.style.setProperty(name, value.trim())
    }
  }
  copyThemeAttributes(sourceDocument, targetDocument)
}
