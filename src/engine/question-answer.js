/**
 * Pure question-draft logic, mirrored from the shipped `ask_user_question`
 * composer so an answer built here is protocol-identical to the one built in
 * the DSH page.
 */

/** A fresh draft for one question. */
export function emptyDraft() {
  return { selected: [], custom: '', skipped: false }
}

/** Create one draft per question. */
export function createDrafts(questions) {
  return (questions ?? []).map(() => emptyDraft())
}

/** Toggle one option with the question's single/multi semantics. */
export function toggleOption(draft, label, multiSelect) {
  const current = draft ?? emptyDraft()
  if (multiSelect === true) {
    const selected = current.selected.includes(label)
      ? current.selected.filter((item) => item !== label)
      : [...current.selected, label]
    return { ...current, selected, skipped: false }
  }
  return { ...current, selected: [label], custom: '', skipped: false }
}

/** Update the free-text answer with the question's single/multi semantics. */
export function updateCustom(draft, value, multiSelect) {
  const current = draft ?? emptyDraft()
  return {
    ...current,
    selected: multiSelect === true ? current.selected : [],
    custom: value,
    skipped: false,
  }
}

/** Mark one question explicitly skipped. */
export function skipDraft() {
  return { selected: [], custom: '', skipped: true }
}

/** Whether one draft counts as answered or explicitly skipped. */
export function isDraftComplete(draft) {
  if (draft === undefined || draft === null) return false
  if (draft.skipped === true) return true
  return draft.selected.length > 0 || String(draft.custom ?? '').trim() !== ''
}

/** Find the first incomplete draft, or -1 when every question is answered. */
export function firstIncompleteIndex(drafts) {
  return (drafts ?? []).findIndex((draft) => !isDraftComplete(draft))
}

/** Whether every question has an answer or an explicit skip. */
export function areDraftsComplete(drafts) {
  return (drafts ?? []).length > 0 && firstIncompleteIndex(drafts) === -1
}

/**
 * Build the answer batch exactly as the shipped composer does.
 * @param {Array<{id: string, multiSelect?: boolean}>} questions request questions.
 * @param {Array<object>} drafts one draft per question.
 * @returns {{ answers: Array<{id: string, selected: string[], custom?: string}> }}
 */
export function buildAnswer(questions, drafts) {
  const list = questions ?? []
  return {
    answers: list.map((question, index) => {
      const draft = drafts[index] ?? emptyDraft()
      if (draft.skipped === true) {
        return { id: question.id, selected: [] }
      }
      const custom = String(draft.custom ?? '').trim()
      return {
        id: question.id,
        selected: custom === '' || question.multiSelect === true ? [...draft.selected] : [],
        ...(custom === '' ? {} : { custom }),
      }
    }),
  }
}

/**
 * Narrow one question to the plan-review presentation contract.
 * @returns {{ approve: object, decline: object | undefined, plan: string } | null}
 */
export function planReviewOptions(question) {
  const intent = question?.intent
  if (intent?.kind !== 'plan-review') return null
  const options = Array.isArray(question.options) ? question.options : []
  const approve = options.find((option) => option?.label === intent.approve)
  if (approve === undefined) return null
  const decline = options.find((option) => option?.label !== intent.approve)
  return {
    approve,
    decline,
    plan: String(question.detail ?? ''),
  }
}

/** Build the one-question answer used by plan review. */
export function planAnswer(question, label) {
  return { answers: [{ id: question.id, selected: [label] }] }
}
