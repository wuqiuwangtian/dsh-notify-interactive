import test from 'node:test'
import assert from 'node:assert/strict'
import {
  areDraftsComplete,
  buildAnswer,
  createDrafts,
  emptyDraft,
  firstIncompleteIndex,
  planAnswer,
  planReviewOptions,
  skipDraft,
  toggleOption,
  updateCustom,
} from '../src/engine/question-answer.js'

const single = { id: 'q1', question: 'Pick one', options: [{ label: 'A' }, { label: 'B' }] }
const multi = { id: 'q2', question: 'Pick many', multiSelect: true, options: [{ label: 'X' }, { label: 'Y' }] }

test('single-select keeps exactly one label and clears custom text', () => {
  let draft = emptyDraft()
  draft = toggleOption(draft, 'A', false)
  assert.deepEqual(draft.selected, ['A'])
  draft = updateCustom(draft, 'typed', false)
  assert.deepEqual(draft.selected, [])
  assert.equal(draft.custom, 'typed')
  draft = toggleOption(draft, 'B', false)
  assert.deepEqual(draft.selected, ['B'])
  assert.equal(draft.custom, '')
})

test('multi-select toggles labels and keeps them alongside custom text', () => {
  let draft = emptyDraft()
  draft = toggleOption(draft, 'X', true)
  draft = toggleOption(draft, 'Y', true)
  draft = toggleOption(draft, 'X', true)
  assert.deepEqual(draft.selected, ['Y'])
  draft = updateCustom(draft, 'both', true)
  assert.deepEqual(draft.selected, ['Y'])
  assert.equal(draft.custom, 'both')
})

test('buildAnswer mirrors the shipped composer for single, multi, custom, and skip', () => {
  const questions = [single, multi, { id: 'q3', question: 'Free text' }]
  const drafts = createDrafts(questions)
  drafts[0] = toggleOption(drafts[0], 'A', false)
  drafts[1] = updateCustom(drafts[1], 'Y+', true)
  drafts[2] = skipDraft()
  assert.deepEqual(buildAnswer(questions, drafts), {
    answers: [
      { id: 'q1', selected: ['A'] },
      { id: 'q2', selected: [], custom: 'Y+' },
      { id: 'q3', selected: [] },
    ],
  })
})

test('single-select custom text suppresses the selected labels', () => {
  const questions = [single]
  const drafts = createDrafts(questions)
  drafts[0] = updateCustom(drafts[0], 'custom answer', false)
  assert.deepEqual(buildAnswer(questions, drafts), {
    answers: [{ id: 'q1', selected: [], custom: 'custom answer' }],
  })
})

test('validation finds the first unanswered question', () => {
  const drafts = createDrafts([single, multi])
  assert.equal(areDraftsComplete(drafts), false)
  assert.equal(firstIncompleteIndex(drafts), 0)
  drafts[0] = toggleOption(drafts[0], 'A', false)
  assert.equal(firstIncompleteIndex(drafts), 1)
  drafts[1] = skipDraft()
  assert.equal(areDraftsComplete(drafts), true)
})

test('empty drafts are incomplete even when the batch is empty', () => {
  assert.equal(areDraftsComplete([]), false)
  assert.equal(firstIncompleteIndex([]), -1)
})

test('plan review recognizes the named approve option and the alternative', () => {
  const question = {
    id: 'plan',
    question: 'Review this plan',
    detail: '# Plan\nDo the thing',
    intent: { kind: 'plan-review', approve: 'Approve plan' },
    options: [{ label: 'Approve plan' }, { label: 'Keep planning' }],
  }
  const review = planReviewOptions(question)
  assert.equal(review.approve.label, 'Approve plan')
  assert.equal(review.decline.label, 'Keep planning')
  assert.equal(review.plan, '# Plan\nDo the thing')
  assert.deepEqual(planAnswer(question, 'Keep planning'), {
    answers: [{ id: 'plan', selected: ['Keep planning'] }],
  })
})

test('plan review rejects a missing approve option', () => {
  assert.equal(planReviewOptions({
    id: 'plan',
    intent: { kind: 'plan-review', approve: 'Missing' },
    options: [{ label: 'Other' }],
  }), null)
})
