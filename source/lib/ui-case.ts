import {Platform} from 'react-native'

/**
 * Words that keep their capital in sentence case: the proper nouns the
 * app's own labels use. A word with a capital past its first letter
 * (BonApp, PubSafe, FAQs) or in capitals throughout (API, SARN) keeps it
 * without being listed.
 */
const PROPER_NOUNS: ReadonlySet<string> = new Set([
	'Android',
	'Appetit',
	'Appétit',
	'Bon',
	'Cage',
	'Carleton',
	'Central',
	'Chapel',
	'Google',
	'Hall',
	'Mess',
	'Messenger',
	'Northfield',
	'Olaf',
	'Ole',
	'Oles',
	'Pause',
	'Play',
	'Sentry',
	'Spotify',
	'St.',
	'Stav',
	'Time',
])

/** Whether `word` keeps its capitals in sentence case. */
function keepsCase(word: string): boolean {
	let bare = word.replaceAll(/^[^A-Za-z]+|[^A-Za-z.]+$/gu, '')
	return PROPER_NOUNS.has(bare) || /[A-Z]/u.test(bare.slice(1))
}

/**
 * `text` in sentence case: its first word capitalised, the rest in lower
 * case but for proper nouns. "Report a Problem" → "Report a problem", "Sign
 * in to St. Olaf" as it is.
 */
export function sentenceCase(text: string): string {
	return text
		.split(' ')
		.map((word, index) => (index === 0 || keepsCase(word) ? word : word.toLowerCase()))
		.join(' ')
}

/**
 * A label the app writes in Title Case, as iOS sets titles and buttons, in
 * sentence case on Android, as Material sets them. Only for the app's own
 * words: a name from the server -- a building, a station -- is a proper
 * noun however it reads.
 */
export function uiCase(text: string): string {
	return Platform.OS === 'android' ? sentenceCase(text) : text
}
