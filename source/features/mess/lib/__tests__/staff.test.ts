import {describe, expect, it} from '@jest/globals'
import staff from '../../__tests__/fixtures/staff-2026-2027.json'
import years from '../../__tests__/fixtures/staff-years.json'
import {parseStaffProfiles} from '../profiles'
import {groupStaff, newestStaffYear} from '../staff'
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

describe('newestStaffYear', () => {
	it('picks the latest staff year by its name', () => {
		expect(newestStaffYear(years)).toStrictEqual({id: 1147, name: '2026-2027'})
	})

	it('picks the latest whatever the order', () => {
		expect(newestStaffYear([...years].reverse())).toStrictEqual({id: 1147, name: '2026-2027'})
	})

	it('fails when the paper has no staff years, so the screen shows an error rather than nothing', () => {
		expect(() => newestStaffYear([])).toThrow('The Olaf Messenger lists no staff years')
	})
})
