import {describe, expect, test} from '@jest/globals'

import {normalizeCaption} from '../vocabulary'

describe('normalizeCaption: heard in real transcripts', () => {
	test.each([
		[
			'Hello, you are listening to Cara X, 88.1 FM service of Carlton College, based in Northfield, Minnesota.',
			'Hello, you are listening to KRLX, 88.1 FM service of Carleton College, based in Northfield, Minnesota.',
		],
		[
			'You can listen online or chat to the DJs at carolax.org or call into the studio at 507-222-4455.',
			'You can listen online or chat to the DJs at krlx.org or call into the studio at 507-222-4455.',
		],
		[
			'Hello, you are listening to Cara X, 88.one FM service of Carlton College, based in Northfield, Minnesota.',
			'Hello, you are listening to KRLX, 88.1 FM service of Carleton College, based in Northfield, Minnesota.',
		],
		[
			'Hello, you are listening to Carolex 88.1 FM service of Carlton College based in Northfield, Minnesota.',
			'Hello, you are listening to KRLX 88.1 FM service of Carleton College based in Northfield, Minnesota.',
		],
		[
			'You can listen online or chat to the DJs at Carolex.org or call into the studio at 507-222.',
			'You can listen online or chat to the DJs at krlx.org or call into the studio at 507-222.',
		],
		[
			'You can listen online or chat to the DJs at Karax.org or call into the studio',
			'You can listen online or chat to the DJs at krlx.org or call into the studio',
		],
		["you're listening to care like 88.1 FM", "you're listening to KRLX 88.1 FM"],
		['You are listening to Kerallax.', 'You are listening to KRLX.'],
		[
			'You can listen online or chat to the DJs at Carallax.org or call',
			'You can listen online or chat to the DJs at krlx.org or call',
		],
		[
			'Hello, you are listening to Car X 88.1 FM service',
			'Hello, you are listening to KRLX 88.1 FM service',
		],
	])('%s', (heard, corrected) => {
		expect(normalizeCaption(heard)).toBe(corrected)
	})

	test('leaves a half-heard prefix alone, and corrects it once the name is whole', () => {
		expect(normalizeCaption('Hello, you are listening to Cara')).toBe(
			'Hello, you are listening to Cara',
		)
		expect(normalizeCaption('Hello, you are listening to Cara X')).toBe(
			'Hello, you are listening to KRLX',
		)
	})
})

// Reported by Drew from the app, not in any transcript we hold: these rules are unverified.
describe('normalizeCaption: reported mishearings (unverified)', () => {
	test.each([
		['Carol X, 88.1', 'KRLX, 88.1'],
		['you are listening to Keralyx', 'you are listening to KRLX'],
		['this is K or Lex', 'this is KRLX'],
		['this is K R L X', 'this is KRLX'],
		['this is K-R-L-X', 'this is KRLX'],
		['this is K. R. L. X.', 'this is KRLX.'],
		['this is K S T O', 'this is KSTO'],
		['this is K-S-T-O', 'this is KSTO'],
		['you are listening to 93.one FM', 'you are listening to 93.1 FM'],
		['you are listening to 8.one FM', 'you are listening to 88.1 FM'],
		['88 point 1 FM', '88.1 FM'],
		['eighty-eight point one FM', '88.1 FM'],
		['ninety-three point one FM', '93.1 FM'],
		['93 point 1', '93.1'],
		['the Saint Olive College choir', 'the St. Olaf College choir'],
		['St. Olof College', 'St. Olaf College'],
		["Saint Olav's students", "St. Olaf's students"],
	])('%s', (heard, corrected) => {
		expect(normalizeCaption(heard)).toBe(corrected)
	})
})

describe('normalizeCaption: left alone', () => {
	test.each([
		'you know',
		'take care',
		'Carl called',
		'Carlton',
		'a Carlton Smith',
		'careful now',
		'carpenter',
		'Alex',
		'Kinnison',
		'Sam Kinnison',
		'Carolyn',
		'Carol Xu',
		'kind of',
		'88 one',
		'8.one',
		'I care like crazy',
		'it was 88 degrees',
		'Carleton College',
		'St. Olaf College',
		'KRLX',
		'Cara',
		'Cara X-ray',
	])('%s', (text) => {
		expect(normalizeCaption(text)).toBe(text)
	})

	test('is idempotent', () => {
		for (let text of [
			'Hello, you are listening to Cara X, 88.one FM service of Carlton College',
			'carolax.org and K-S-T-O and Saint Olive',
		]) {
			let once = normalizeCaption(text)
			expect(normalizeCaption(once)).toBe(once)
		}
	})
})
