/** `<agentId or "main">:<path as written>`: one test file one agent has been reminded about. */
export type ReminderKey = string

declare module 'claude-code' {
	interface PluginState {
		'test-writing-reminder': {reminded: readonly ReminderKey[]}
	}
}
