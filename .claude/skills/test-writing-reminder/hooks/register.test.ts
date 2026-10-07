import type {On} from 'claude-code'
import {describe, expect, test} from 'claude-code/testing'

import {REMINDER} from './register.ts'

/** Stands in for the tools themselves: every call that reaches them succeeds. */
function toolsSucceed(on: On): void {
	on('tool.call', () => ({result: 'ok'}) as never)
}

const TEST_FILE = '/repo/source/__tests__/a.test.ts'

describe('Write', () => {
	test('refuses the first write to a test file with the reminder', async ($, on) => {
		toolsSucceed(on)
		const first = await $.tool.call({tool: 'Write', file_path: TEST_FILE, content: ''})
		expect(first).toEqual({deny: REMINDER})
	})

	test('lets a second write to the same test file through', async ($, on) => {
		toolsSucceed(on)
		await $.tool.call({tool: 'Write', file_path: TEST_FILE, content: ''})
		const second = await $.tool.call({tool: 'Write', file_path: TEST_FILE, content: ''})
		expect(second).toEqual({result: 'ok'})
	})

	test('lets a write to a file that is not a test through', async ($, on) => {
		toolsSucceed(on)
		const write = await $.tool.call({tool: 'Write', file_path: '/repo/source/a.ts', content: ''})
		expect(write).toEqual({result: 'ok'})
	})
})
