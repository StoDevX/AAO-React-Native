import {describe, expect, it} from '@jest/globals'
import profiles from '../../__tests__/fixtures/profiles-390.json'
import {latestProfile, parseStaffProfiles} from '../profiles'

/** Builds a minimal profile in the shape the WordPress API returns. */
const profile = (content: string) => ({
	title: {rendered: 'A Writer'},
	content: {rendered: content},
})

describe('parseStaffProfiles', () => {
	it('reads name, year, bio and photo', () => {
		let parsed = parseStaffProfiles(profiles)
		expect(parsed).toHaveLength(2)
		expect(parsed[0]?.name).toBe('Maya Betti')
		expect(parsed.map((p) => p.year).sort()).toStrictEqual(['2024-2025', '2025-2026'])
		expect(parsed[0]?.bio).not.toContain('<')
		expect(parsed[0]?.photo).toStrictEqual({
			url: 'https://olafmessenger.com/wp-content/uploads/2025/09/DSC01482-2.jpg',
			width: 1333,
			height: expect.any(Number),
		})
	})

	it('keeps only the visible bio text, not the form question in its attributes', () => {
		let [first] = parseStaffProfiles(profiles)
		expect(first?.bio).toMatch(/^Maya Betti is a junior from Shoreview/u)
		expect(first?.bio).not.toContain('Staff Bio for Website!')
	})

	it('decodes entities once, so an escaped entity stays literal', () => {
		let [parsed] = parseStaffProfiles([profile('<p>Tom &amp;amp; Jerry</p>')])
		expect(parsed?.bio).toBe('Tom &amp; Jerry')
	})

	it('gives no photo or year when the profile has none', () => {
		let [parsed] = parseStaffProfiles([profile('<p>Bio</p>')])
		expect(parsed).toStrictEqual({name: 'A Writer', bio: 'Bio', photo: null, year: ''})
	})

	it('skips a malformed profile', () => {
		expect(parseStaffProfiles([{title: 'no'}, profile('<p>Bio</p>')])).toHaveLength(1)
	})
})

describe('latestProfile', () => {
	it('picks the newest staff year', () => {
		let latest = latestProfile(parseStaffProfiles(profiles))
		expect(latest?.year).toBe('2025-2026')
		expect(latest?.bio).toContain('junior')
	})

	it('picks the newest staff year whatever the order', () => {
		let latest = latestProfile([...parseStaffProfiles(profiles)].reverse())
		expect(latest?.year).toBe('2025-2026')
	})

	it('gives nothing for no profiles', () => {
		expect(latestProfile([])).toBeNull()
	})
})
