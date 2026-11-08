import { useEffect, useState } from 'react'
import { localeIdOf, translate } from '../i18n/dict.js'

function readLocale(ctx) {
  try {
    return ctx?.locale?.getLocale?.() ?? { id: 'en' }
  } catch {
    return { id: 'en' }
  }
}

/**
 * Subscribe to the DSH locale and return a translator bound to it.
 * The plugin's dictionaries cover the surfaces it owns; the host locale id is
 * only used to choose between them.
 */
export function useLocale(ctx) {
  const [snapshot, setSnapshot] = useState(() => readLocale(ctx))
  useEffect(() => {
    if (typeof ctx?.locale?.subscribe !== 'function') return undefined
    return ctx.locale.subscribe(() => setSnapshot(readLocale(ctx)))
  }, [ctx])
  const id = localeIdOf(snapshot?.active ?? snapshot?.id)
  return {
    id,
    t: (key, vars) => translate(id, key, vars),
  }
}
