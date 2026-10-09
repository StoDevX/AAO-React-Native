import {describe, expect, it} from '@jest/globals'
import profiles from '../../__tests__/fixtures/profiles-390.json'
import staff from '../../__tests__/fixtures/staff-2026-2027.json'
import {latestProfile, parseStaffProfiles} from '../profiles'

/** Builds a minimal profile in the shape the WordPress API returns. */
const profile = (content: string) => ({
	id: 1,
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

	it('gives no photo, year or role when the profile has none', () => {
		let [parsed] = parseStaffProfiles([profile('<p>Bio</p>')])
		expect(parsed).toStrictEqual({
			id: 1,
			name: 'A Writer',
			role: '',
			bio: 'Bio',
			photo: null,
			year: '',
		})
	})

	it('reads the role from the excerpt, decoded', () => {
		let parsed = parseStaffProfiles(staff)
		let mathea = parsed.find((p) => p.name === 'Mathea Petersin')
		expect(mathea?.role).toBe('A&E Correspondent')
		expect(mathea?.id).toBe(staff.find((p) => p.title.rendered === 'Mathea Petersin')?.id)
	})

	it('reads no role from an excerpt WordPress made from the bio', () => {
		let bio = 'Ada Lin is a junior from Northfield who writes about the arts and edits the paper.'
		let [parsed] = parseStaffProfiles([
			{
				...profile(`<p>${bio}</p>`),
				excerpt: {rendered: '<p>Ada Lin is a junior from Northfield who writes [&hellip;]</p>\n'},
			},
		])
		expect(parsed?.role).toBe('')
		expect(parsed?.bio).toBe(bio)
	})

	it('reads no role from a made excerpt that no longer matches the bio word for word', () => {
		let [parsed] = parseStaffProfiles([
			{
				...profile('<p>[caption]Ada at work[/caption] Ada Lin edits &#8220;the paper&#8221;.</p>'),
				excerpt: {rendered: '<p>Ada Lin edits &#8220;the paper&#8221; and writes [&hellip;]</p>'},
			},
		])
		expect(parsed?.role).toBe('')
	})

	it('reads no role from an excerpt longer than any title', () => {
		let [parsed] = parseStaffProfiles([
			{
				...profile('<p>Bio</p>'),
				excerpt: {rendered: '<p>Ada Lin is a junior from Northfield who edits the paper.</p>'},
			},
		])
		expect(parsed?.role).toBe('')
	})

	it('reads no role from an excerpt WordPress made from a bio too short to cut', () => {
		let [parsed] = parseStaffProfiles([
			{
				...profile('<p>Sophomore English major from Northfield.</p>'),
				excerpt: {rendered: '<p>Sophomore English major from Northfield.</p>\n'},
			},
		])
		expect(parsed?.role).toBe('')
		expect(parsed?.bio).toBe('Sophomore English major from Northfield.')
	})

	it('keeps a role that happens to open the bio', () => {
		let [parsed] = parseStaffProfiles([
			{
				...profile('<p>Photographer and junior Ada Lin shoots sports.</p>'),
				excerpt: {rendered: '<p>Photographer</p>'},
			},
		])
		expect(parsed?.role).toBe('Photographer')
	})

	it('draws the medium copy of a photo, not the full upload', () => {
		let [parsed] = parseStaffProfiles([
			{
				...profile('<p>Bio</p>'),
				_embedded: {
					'wp:featuredmedia': [
						{
							source_url: 'https://olafmessenger.com/full.jpg',
							media_details: {
								width: 1501,
								height: 2001,
								sizes: {
									medium: {
										source_url: 'https://olafmessenger.com/medium.jpg',
										width: 450,
										height: 600,
									},
								},
							},
						},
					],
				},
			},
		])
		expect(parsed?.photo).toStrictEqual({
			url: 'https://olafmessenger.com/medium.jpg',
			width: 450,
			height: 600,
		})
	})

	it('reads every profile of a year, with its role and year', () => {
		let parsed = parseStaffProfiles(staff)
		expect(parsed).toHaveLength(27)
		expect(parsed.every((p) => p.role !== '' && p.year === '2026-2027')).toBe(true)
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
