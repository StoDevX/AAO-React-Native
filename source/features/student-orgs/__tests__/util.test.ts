import {describe, expect, test} from '@jest/globals'

import type {StudentOrgDetailType, StudentOrgType} from '../types'
import {instagramHandle, meetingRows, withDetail} from '../util'

function makeOrg(overrides: Partial<StudentOrgType> = {}): StudentOrgType {
	return {
		meetings: '',
		contacts: [],
		advisors: [],
		description: 'From the list.',
		category: 'Religious',
		lastUpdated: '2000-01-01',
		website: '',
		name: 'Agape',
		organizationUri: 'agape',
		memberCount: 15,
		...overrides,
	}
}

describe('withDetail', () => {
	let contact = {
		firstName: 'Ole',
		lastName: 'Olson',
		title: 'Primary Contact',
		email: 'olson1@stolaf.edu',
	}

	test("the org's own record adds what only it holds", () => {
		let detail: StudentOrgDetailType = {
			...makeOrg(),
			contacts: [contact],
			constitutionUrl: 'https://docs.google.com/document/d/1',
		}
		let org = withDetail(makeOrg(), detail)

		expect(org.contacts).toEqual([contact])
		expect(org.constitutionUrl).toBe('https://docs.google.com/document/d/1')
		expect(org.description).toBe('From the list.')
	})

	test("the list's record stands alone until the org's own arrives", () => {
		expect(withDetail(makeOrg(), undefined)).toEqual(makeOrg())
	})

	test("the list's record stands alone when the server has no record for it", () => {
		expect(withDetail(makeOrg(), null)).toEqual(makeOrg())
	})

	test("another org's record is not mixed in", () => {
		let other: StudentOrgDetailType = {
			...makeOrg({organizationUri: 'chess-club'}),
			contacts: [contact],
		}
		expect(withDetail(makeOrg(), other).contacts).toEqual([])
	})
})

describe('meetingRows', () => {
	test('where and when are rows of their own', () => {
		let org = makeOrg({
			meetingLocation: 'Norway Room',
			meetingTime: '7pm-8pm',
			meetings: 'Norway Room, 7pm-8pm',
		})
		expect(meetingRows(org)).toEqual([
			{label: 'Where', value: 'Norway Room'},
			{label: 'When', value: '7pm-8pm'},
		])
	})

	test('only the part given is shown', () => {
		expect(meetingRows(makeOrg({meetingTime: '7pm-8pm'}))).toEqual([
			{label: 'When', value: '7pm-8pm'},
		])
	})

	test("an older server's joined meetings stand as one row", () => {
		expect(meetingRows(makeOrg({meetings: 'Norway Room7pm-8pm'}))).toEqual([
			{label: 'Meets', value: 'Norway Room7pm-8pm'},
		])
	})

	test('a record without meetings at all has no rows', () => {
		let org = {...makeOrg(), meetings: undefined} as unknown as StudentOrgType
		expect(meetingRows(org)).toEqual([])
	})

	test('an org that never meets has no rows', () => {
		expect(meetingRows(makeOrg())).toEqual([])
	})
})

describe('instagramHandle', () => {
	test('a profile link reads as its handle', () => {
		expect(instagramHandle('https://www.instagram.com/stolafchess/')).toBe('@stolafchess')
		expect(instagramHandle('https://www.instagram.com/kso.stolaf/')).toBe('@kso.stolaf')
	})

	test('a link that is not a profile reads as itself', () => {
		expect(instagramHandle('https://example.com/')).toBe('https://example.com/')
	})
})
