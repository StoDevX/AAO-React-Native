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

	/// The description's wage is usually the whole structure's range; the
	/// title's pay code names the tier, so it wins.
	test('drops the description’s wage when the title gives one', () => {
		let job = posting('AY Mail Services Student Worker (WS-ST1)', [
			{label: 'Wage', value: '$12.00-13.00/hour'},
		])
		expect(jobDetailFields(job).filter((field) => field.label === 'Wage')).toEqual([
			{label: 'Wage', value: '$12.00/hr'},
		])
	})

	test('keeps the description’s wage when the title has no pay code', () => {
		let job = posting('CURI Academic Year Student Researcher - Braun', [
			{label: 'Wage', value: '$13.50-15.50/hour'},
		])
		expect(jobDetailFields(job)).toEqual([
			{label: 'Term', value: 'Academic Year'},
			{label: 'Wage', value: '$13.50-15.50/hour'},
		])
	})

	test('adds nothing for a title that carries nothing', () => {
		let fields = [{label: 'Department', value: 'Libraries'}]
		expect(jobDetailFields(posting('Library Circulation Desk Assistant', fields))).toEqual(fields)
	})
})
