import type {On} from 'claude-code'
import {describe, expect, test} from 'claude-code/testing'

import {isTestFile, REMINDER} from './register.ts'

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

describe('isTestFile', () => {
	const TEST_FILES = [
		'/repo/source/features/dining/__tests__/menu.ts',
		'scripts/scrape-bonapp.test.mjs',
		'plugins/with-alternate-icons.test.ts',
		'source/features/calendar/day-view.test.tsx',
		'uitests/Screens/AthleticsScreen.swift',
		'/repo/uitests/Calendar/ModuleCalendarTests.swift',
		'modules/ccc-calendar/ios/CalendarTest.swift',
	]
	const OTHER_FILES = [
		'source/features/dining/menu.ts',
		'source/lib/testing.ts',
		'ios/AllAboutOlaf/AppDelegate.swift',
		'docs/uitests.md',
	]

	for (const path of TEST_FILES) {
		test(`counts ${path} as a test file`, () => {
			expect(isTestFile(path)).toBe(true)
		})
	}

	for (const path of OTHER_FILES) {
		test(`does not count ${path} as a test file`, () => {
			expect(isTestFile(path)).toBe(false)
		})
	}
})

describe('Edit', () => {
	test('refuses the first edit to a test file, then lets edits through', async ($, on) => {
		toolsSucceed(on)
		const edit = {tool: 'Edit', file_path: TEST_FILE, old_string: 'a', new_string: 'b'} as const
		expect(await $.tool.call(edit)).toEqual({deny: REMINDER})
		expect(await $.tool.call(edit)).toEqual({result: 'ok'})
	})

	test('shares the reminder with Write for the same file', async ($, on) => {
		toolsSucceed(on)
		await $.tool.call({tool: 'Write', file_path: TEST_FILE, content: ''})
		const edit = await $.tool.call({
			tool: 'Edit',
			file_path: TEST_FILE,
			old_string: 'a',
			new_string: 'b',
		})
		expect(edit).toEqual({result: 'ok'})
	})
})

describe('subagents', () => {
	test('reminds a subagent after the main loop has been reminded', async ($, on) => {
		toolsSucceed(on)
		await $.tool.call({tool: 'Write', file_path: TEST_FILE, content: ''})
		// `agentId` is reserved on the test kit's call type, but the engine accepts it.
		const fromSubagent = await $.tool.call({
			tool: 'Write',
			file_path: TEST_FILE,
			content: '',
			agentId: 'subagent-1',
		} as never)
		expect(fromSubagent).toEqual({deny: REMINDER})
	})
})
