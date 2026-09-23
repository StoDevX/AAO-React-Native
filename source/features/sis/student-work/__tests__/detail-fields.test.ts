import type {JobDetail} from '@frogpond/ccc-jobs'
import {jobDetailFields} from '../lib'

function posting(title: string, fields: JobDetail['fields']): JobDetail {
	return {
		id: '1',
		title,
		category: 'Student Work',
		schedule: undefined,
		location: undefined,
		postedDate: undefined,
		fields,
		body: '',
		url: 'https://example.invalid/job/1',
	}
}

describe('jobDetailFields', () => {
	test('leads with the wage, level, and term the title carries', () => {
		let job = posting('AY Stav Student Supervisor (WS-NST3)', [
			{label: 'Department', value: 'Stav Hall'},
		])
		expect(jobDetailFields(job)).toEqual([
			{label: 'Wage', value: '$15.50/hr'},
			{label: 'Level', value: 'Lead'},
			{label: 'Term', value: 'Academic Year'},
			{label: 'Department', value: 'Stav Hall'},
		])
	})

	/// The listing's own wage is what the employer wrote, so it wins; the
	/// title's pay code only fills in when the listing states none.
	test('shows the listing’s wage over the one the title implies', () => {
		let job = posting('AY Mail Services Student Worker (WS-ST1)', [
			{label: 'Department', value: 'Mail Services'},
			{label: 'Wage', value: '$12.00-13.00/hour'},
		])
		expect(jobDetailFields(job)).toEqual([
			{label: 'Wage', value: '$12.00-13.00/hour'},
			{label: 'Level', value: 'Entry-level'},
			{label: 'Term', value: 'Academic Year'},
			{label: 'Department', value: 'Mail Services'},
		])
	})

	test('keeps the description’s wage when the title has no pay code', () => {
		let job = posting('CURI Academic Year Student Researcher - Braun', [
			{label: 'Wage', value: '$13.50-15.50/hour'},
		])
		expect(jobDetailFields(job)).toEqual([
			{label: 'Wage', value: '$13.50-15.50/hour'},
			{label: 'Term', value: 'Academic Year'},
		])
	})

	test('adds nothing for a title that carries nothing', () => {
		let fields = [{label: 'Department', value: 'Libraries'}]
		expect(jobDetailFields(posting('Library Circulation Desk Assistant', fields))).toEqual(fields)
	})
})
