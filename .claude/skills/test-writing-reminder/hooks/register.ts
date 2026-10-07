import {atom, read, update} from 'claude-code'
import type {EngineInterface, Register} from 'claude-code'

import type {ReminderKey} from '../types'

/** What the model reads when a write is refused; AGENTS.md → Testing gives the reasons. */
export const REMINDER = `test-writing-reminder: check this test against the kinds this repo does not want (AGENTS.md → Testing):

1. Jest tests of look or layout: color, size, spacing, truncation, tap targets
2. Tests that check mocked behavior
3. Tests that need heavy mocking to run
4. Tests of platform behavior: what iOS, React Native, Hermes or a library does, rather than what this app decides
5. Tests that metrics or Sentry calls are sent
6. Tests that restate config
7. Data-flow UI tests

If the test is none of these, send the same write again.`

/** Paths that mark a file as a test in this repo. */
const TEST_FILE_PATTERNS = [
	/(^|\/)__tests__\//,
	/\.test\.(ts|tsx|mjs)$/,
	/(^|\/)uitests\/.+\.swift$/,
	/Tests?\.swift$/,
]

/** Whether a path names a test file in this repo. */
export function isTestFile(path: string): boolean {
	return TEST_FILE_PATTERNS.some((pattern) => pattern.test(path))
}

/** The test files each agent has already been reminded about this session. */
const reminded = atom(
	{plugin: 'test-writing-reminder', key: 'reminded'} as const,
	[] as readonly ReminderKey[],
)

/**
 * Marks the test files as reminded for this agent, and says whether any had
 * not been yet. A subagent never sees the main loop's refusal, so each agent
 * is reminded on its own.
 */
async function shouldRemind(
	$: EngineInterface,
	agentId: string | undefined,
	paths: readonly string[],
): Promise<boolean> {
	const keys = paths.map((path) => `${agentId ?? 'main'}:${path.replace(/^\.\//, '')}`)
	const seen = await read($, reminded)
	if (keys.every((key) => seen.includes(key))) {
		return false
	}
	await update($, reminded, (list) => [...new Set([...list, ...keys])])
	return true
}

export const register: Register = (on) => {
	on('tool.call', {tool: 'Write'}, async ($, e, next) =>
		(await shouldRemind($, e.agentId, [e.file_path].filter(isTestFile)))
			? {deny: REMINDER}
			: next(e),
	)

	on('tool.call', {tool: 'Edit'}, async ($, e, next) =>
		(await shouldRemind($, e.agentId, [e.file_path].filter(isTestFile)))
			? {deny: REMINDER}
			: next(e),
	)
}
