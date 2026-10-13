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
		'ios/AllAboutAnything/AppDelegate.swift',
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

describe('Bash', () => {
	const WRITES = {
		'an inline Python edit': `python3 - <<'EOF'\np='source/__tests__/python.test.ts'\ns=open(p).read()\nopen(p,'w').write(s.replace('a','b'))\nEOF`,
		'sed -i': `sed -i '' 's/a/b/' source/__tests__/sed.test.ts`,
		'a heredoc': `cat > source/__tests__/heredoc.test.ts <<'EOF'\nimport x from 'y'\nEOF`,
		'perl -pi': `perl -pi -e 's/a/b/' uitests/PerlTests.swift`,
		cp: 'cp /tmp/draft.ts source/__tests__/cp.test.ts',
		'a node write': `node -e "require('fs').writeFileSync('scripts/node.test.mjs', '')"`,
		'an append': 'echo "it.todo(\'x\')" >> source/__tests__/append.test.ts',
		'git mv': 'git mv source/__tests__/old.test.ts source/__tests__/moved.test.ts',
		'a numbered redirect': 'echo x 1>source/__tests__/numbered.test.ts',
	}

	for (const [name, command] of Object.entries(WRITES)) {
		test(`refuses ${name} into a test file once`, async ($, on) => {
			toolsSucceed(on)
			expect(await $.tool.call({tool: 'Bash', command})).toEqual({deny: REMINDER})
			expect(await $.tool.call({tool: 'Bash', command})).toEqual({result: 'ok'})
		})
	}

	const READS = {
		'a Jest run': 'pnpm jest source/__tests__/a.test.ts',
		'a Jest run with stderr merged': 'pnpm jest source/__tests__/a.test.ts 2>&1 | tail -20',
		'sed -n': 'sed -n 1,40p source/__tests__/a.test.ts',
		grep: 'grep -n describe source/__tests__/a.test.ts',
		'an arrow function': `node -e "const f = x => x" source/__tests__/a.test.ts`,
		'a commit message': 'jj commit -m "Fix source/__tests__/a.test.ts"',
		'a Jest run piped through tee': 'pnpm jest source/__tests__/a.test.ts 2>&1 | tee /tmp/jest.log',
		'a Jest run sent to /dev/null': 'pnpm jest source/__tests__/a.test.ts >/dev/null 2>&1; echo $?',
		'a message to stderr': 'echo running >&2; pnpm jest source/__tests__/a.test.ts',
		'a diff saved to a file': 'git diff master -- source/__tests__/a.test.ts > /tmp/a.patch',
		'a grep for JSX': `grep -n '</Text>' source/features/x/__tests__/row.test.tsx`,
		'a copy out of a test file': 'cp source/__tests__/a.test.ts /tmp/backup.ts',
		'a script that compares': `python3 - <<'EOF'\np='source/__tests__/a.test.ts'\ns=open(p).read()\nprint(s.count('it(') > 3)\nEOF`,
		'a commit with an attribution line': `jj commit -m "$(cat <<'EOF'\nFix uitests/Calendar/ModuleCalendarTests.swift\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\n)"`,
	}

	for (const [name, command] of Object.entries(READS)) {
		test(`lets ${name} through`, async ($, on) => {
			toolsSucceed(on)
			expect(await $.tool.call({tool: 'Bash', command})).toEqual({result: 'ok'})
		})
	}

	test('lets a write to a file that is not a test through', async ($, on) => {
		toolsSucceed(on)
		const command = `sed -i '' 's/a/b/' source/lib/a.ts`
		expect(await $.tool.call({tool: 'Bash', command})).toEqual({result: 'ok'})
	})

	test('refuses a command naming two test files once, and marks both', async ($, on) => {
		toolsSucceed(on)
		const both = `sed -i '' 's/a/b/' source/__tests__/a.test.ts source/__tests__/b.test.ts`
		expect(await $.tool.call({tool: 'Bash', command: both})).toEqual({deny: REMINDER})
		const second = `sed -i '' 's/a/b/' source/__tests__/b.test.ts`
		expect(await $.tool.call({tool: 'Bash', command: second})).toEqual({result: 'ok'})
	})

	test('refuses a command when only one of its test files is new', async ($, on) => {
		toolsSucceed(on)
		await $.tool.call({tool: 'Bash', command: `sed -i '' 's/a/b/' source/__tests__/a.test.ts`})
		const both = `sed -i '' 's/a/b/' source/__tests__/a.test.ts source/__tests__/b.test.ts`
		expect(await $.tool.call({tool: 'Bash', command: both})).toEqual({deny: REMINDER})
	})
})
