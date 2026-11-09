import { randomUUID } from 'node:crypto'

/** Local deterministic adapter for an isolated DSH profile. No network, new tools or log appends. */
export function createNativeAdapter(LlmAdapter, ctx) {
  return new class extends LlmAdapter {
    providerInfo() { return { id: 'notify-fixture', name: 'Local notification acceptance (no network)' } }
    async listModels() {
      return ['approval', 'question', 'plan', 'completion'].map(id => ({ provider: 'notify-fixture', id, name: id }))
    }
    async resolveModel(provider, model) {
      return { provider, id: model, name: model, context: { contextWindow: 1_000_000 }, defaultMaxTokens: 4096 }
    }
    async *stream(options) {
      let value = 'Local acceptance complete.'
      const last = options.messages.at(-1)
      const act = !options.purpose && last?.role === 'user' && last.source?.kind !== 'user-question-reply'
      if (act && options.model === 'approval') {
        const outcome = await ctx.approval.request({ agent: ctx.agents.requireInitiator(), toolName: 'notification-test-only',
          callId: randomUUID(), reason: 'Isolated test. No command or file access.', signal: options.signal })
        value = `Approval outcome: ${outcome}`
      }
      if (act && ['question', 'plan'].includes(options.model)) {
        const questions = [
          { id: 'single', question: 'Select test platform', options: [{ label: 'Windows' }, { label: 'Linux' }] },
          { id: 'multi', question: 'Select channels', multi_select: true, options: [{ label: 'Popup' }, { label: 'Sound' }] },
          { id: 'custom', question: 'Add a note' },
        ]
        const block = { type: 'tool-call', id: randomUUID(), name: options.model === 'plan' ? 'exit_plan_mode' : 'ask_user_question',
          arguments: JSON.stringify(options.model === 'plan'
            ? { plan: '# Notification acceptance plan\n\n1. Show the request\n2. Wait for explicit user action' }
            : { questions }) }
        yield { type: 'block-start', index: 0, blockType: 'tool-call' }
        yield { type: 'tool-call-delta', index: 0, id: block.id, name: block.name, argumentsDelta: block.arguments }
        yield { type: 'block-end', index: 0, block }
        yield { type: 'finish', reason: { kind: 'tool-calls' } }
        return
      }
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'text-delta', index: 0, text: value }
      yield { type: 'block-end', index: 0, block: { type: 'text', text: value } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    }
  }()
}
