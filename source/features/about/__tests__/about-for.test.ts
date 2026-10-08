import {describe, expect, test} from '@jest/globals'

import {aboutFor} from '../about-for'

describe("each campus's About", () => {
	test("All About Olaf's tells its story and credits both its writers and its helpers", () => {
		let about = aboutFor('stolaf')
		expect(about.story.length).toBeGreaterThan(0)
		expect(about.credits.map((credit) => credit.id)).toEqual(['contributors', 'acknowledgements'])
	})

	// CARLS' own credits name its writers alone, and tell no history.
	test("CARLS' shows its own intro and writers, and no story or empty list", () => {
		let about = aboutFor('carleton')
		expect(about.intro).toMatch(/^CARLS is an application created by Hawken Rives/u)
		expect(about.story).toEqual([])
		expect(about.credits.map((credit) => credit.id)).toEqual(['contributors'])
		expect(about.credits[0].names).toContain('Grace Pipes')
	})
})
