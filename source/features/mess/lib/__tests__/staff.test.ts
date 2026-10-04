import {describe, expect, it} from '@jest/globals'
import staff from '../../__tests__/fixtures/staff-2026-2027.json'
import {parseStaffProfiles} from '../profiles'
import {groupStaff, newestStaffYear, photoSubjectOf} from '../staff'
import type {StaffProfile} from '../../types'

/** A profile holding only what grouping reads. */
const person = (name: string, role: string): StaffProfile => ({
	id: name.length,
	name,
	role,
	bio: '',
	photo: null,
	year: '2026-2027',
})

/** Each group's title and its people as `name (role)`, for a readable comparison. */
const shape = (profiles: StaffProfile[]) =>
	groupStaff(profiles).map((group) => [
		group.title,
		group.people.map((p) => `${p.name} (${p.role})`),
	])

describe('groupStaff', () => {
	it('puts each of the paper’s roles in its group, in the masthead’s order', () => {
		expect(
			shape([
				person('Ina', 'Illustrator'),
				person('Cal', 'Copy Editor'),
				person('Wes', 'Staff Writer'),
				person('Nia', 'News Editor'),
				person('Bea', 'Business Manager'),
				person('Eve', 'Executive Editor'),
			]),
		).toStrictEqual([
			['Leadership', ['Eve (Executive Editor)', 'Bea (Business Manager)']],
			['Section Editors', ['Nia (News Editor)']],
			['Writers', ['Wes (Staff Writer)']],
			['Visuals', ['Ina (Illustrator)']],
			['Copy Desk', ['Cal (Copy Editor)']],
		])
	})

	it('reads a managing editor or editor-in-chief as leadership, before any other editor', () => {
		expect(
			shape([
				person('Nia', 'News Editor'),
				person('Max', 'Managing Editor'),
				person('Cy', 'Editor-in-Chief'),
			]),
		).toStrictEqual([
			['Leadership', ['Cy (Editor-in-Chief)', 'Max (Managing Editor)']],
			['Section Editors', ['Nia (News Editor)']],
		])
	})

	it('reads an editor in chief however it is written, and plural titles, as leadership', () => {
		expect(
			shape([
				person('Al', 'Editor in Chief'),
				person('Bo', 'Co-Editor in Chief'),
				person('Cy', 'Executive Editors'),
			]),
		).toStrictEqual([
			['Leadership', ['Bo (Co-Editor in Chief)', 'Al (Editor in Chief)', 'Cy (Executive Editors)']],
		])
	})

	it('reads a plural title in the group of its singular', () => {
		expect(shape([person('Di', 'Staff Writers'), person('Ed', 'Photographers')])).toStrictEqual([
			['Writers', ['Di (Staff Writers)']],
			['Visuals', ['Ed (Photographers)']],
		])
	})

	it('puts the editor in chief first, then executive and managing editors', () => {
		expect(
			shape([
				person('Max', 'Managing Editor'),
				person('Eve', 'Executive Editor'),
				person('Cy', 'Editor-in-Chief'),
			]),
		).toStrictEqual([
			['Leadership', ['Cy (Editor-in-Chief)', 'Eve (Executive Editor)', 'Max (Managing Editor)']],
		])
	})

	it('puts an assistant, associate or deputy after the title they assist', () => {
		expect(
			shape([
				person('Ann', 'Assistant Managing Editor'),
				person('Max', 'Managing Editor'),
				person('Avi', 'Associate Director'),
				person('Dee', 'Director'),
			]),
		).toStrictEqual([
			[
				'Leadership',
				[
					'Max (Managing Editor)',
					'Ann (Assistant Managing Editor)',
					'Dee (Director)',
					'Avi (Associate Director)',
				],
			],
		])
	})

	it('reads any copy title as the copy desk, not a section editor', () => {
		expect(shape([person('Lu', 'Copy/Layout Editor'), person('Ry', 'Copy Chief')])).toStrictEqual([
			['Copy Desk', ['Ry (Copy Chief)', 'Lu (Copy/Layout Editor)']],
		])
	})

	it('reads a director or manager as leadership', () => {
		expect(
			shape([person('Vi', 'Visual Director'), person('Mo', 'Marketing Director')]),
		).toStrictEqual([['Leadership', ['Mo (Marketing Director)', 'Vi (Visual Director)']]])
	})

	it('reads a reporter or correspondent as a writer', () => {
		expect(
			shape([
				person('Sam', 'Senior Reporter'),
				person('Ada', 'A&E Correspondent'),
				person('Gil', 'SGA Correspondent'),
			]),
		).toStrictEqual([
			['Writers', ['Ada (A&E Correspondent)', 'Sam (Senior Reporter)', 'Gil (SGA Correspondent)']],
		])
	})

	it('reads a photographer, or someone who also illustrates, as visuals', () => {
		expect(
			shape([person('Pia', 'Photographer'), person('Ike', 'Illustrator/Photographer')]),
		).toStrictEqual([['Visuals', ['Ike (Illustrator/Photographer)', 'Pia (Photographer)']]])
	})

	it('orders people in a group by role, then by name', () => {
		expect(
			shape([
				person('Zed', 'News Editor'),
				person('Amy', 'Sports Editor'),
				person('Ann', 'News Editor'),
			]),
		).toStrictEqual([
			['Section Editors', ['Ann (News Editor)', 'Zed (News Editor)', 'Amy (Sports Editor)']],
		])
	})

	it('keeps a role it does not know, and a blank one, under Other Staff', () => {
		expect(shape([person('Pat', 'Podcast Host'), person('Bo', '')])).toStrictEqual([
			['Other Staff', ['Bo ()', 'Pat (Podcast Host)']],
		])
	})

	it('leaves out a group with nobody in it', () => {
		expect(groupStaff([person('Eve', 'Executive Editor')]).map((g) => g.title)).toStrictEqual([
			'Leadership',
		])
	})

	it('places everyone on this year’s staff, with nobody under Other Staff', () => {
		let groups = groupStaff(parseStaffProfiles(staff))
		expect(groups.flatMap((g) => g.people)).toHaveLength(27)
		expect(groups.map((g) => g.title)).not.toContain('Other Staff')
		expect(groups[0]?.people.slice(0, 3).map((p) => p.role)).toStrictEqual([
			'Executive Editor',
			'Executive Editor',
			'Executive Editor',
		])
	})
})

/** The paper's staff years, as the staff_year terms list them. */
const years = [
	{id: 41, name: '2024-2025'},
	{id: 1147, name: '2026-2027'},
	{id: 998, name: '2025-2026'},
]

describe('newestStaffYear', () => {
	it('picks the latest staff year by its name', () => {
		expect(newestStaffYear(years)).toStrictEqual({id: 1147, name: '2026-2027'})
	})

	it('picks the latest whatever the order', () => {
		expect(newestStaffYear([...years].reverse())).toStrictEqual({id: 1147, name: '2026-2027'})
	})

	it('gives none when the paper has no staff years', () => {
		expect(newestStaffYear([])).toBeNull()
	})
})

describe('photoSubjectOf', () => {
	it('names a tile by its first and last names, for its initials', () => {
		expect(photoSubjectOf(person('Julia Sikorski Roehsner', 'Executive Editor'))).toStrictEqual({
			displayName: 'Julia Sikorski Roehsner',
			firstName: 'Julia',
			lastName: 'Roehsner',
			thumbnail: '',
		})
	})

	it('carries the photo as the thumbnail', () => {
		let photo = {url: 'https://olafmessenger.com/a.jpg', width: 900, height: 1200}
		expect(photoSubjectOf({...person('Ada Lin', 'Photographer'), photo}).thumbnail).toBe(photo.url)
	})

	it('ignores stray spaces around and inside a name', () => {
		expect(photoSubjectOf(person(' Ada  Lin ', 'Photographer'))).toMatchObject({
			firstName: 'Ada',
			lastName: 'Lin',
		})
	})

	it('reads a last name before a suffix such as Jr. or III', () => {
		expect(photoSubjectOf(person('Sam Ruiz Jr.', 'Staff Writer')).lastName).toBe('Ruiz')
		expect(photoSubjectOf(person('Lee Park III', 'Staff Writer')).lastName).toBe('Park')
	})

	it('leaves a single name without a last name, so its initials come from the name alone', () => {
		expect(photoSubjectOf(person('Cher', 'Staff Writer'))).toMatchObject({
			firstName: 'Cher',
			lastName: '',
		})
	})
})
