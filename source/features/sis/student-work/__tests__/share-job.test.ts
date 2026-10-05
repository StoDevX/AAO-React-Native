import {Share} from 'react-native'
import {shareJob} from '../lib'
import type {JobDetail} from '@frogpond/ccc-jobs'

const JOB: JobDetail = {
	id: '2841',
	title: 'AY Athletic Events Student Worker (WS-ST1)',
	category: 'Student Work',
	schedule: 'Part time',
	location: 'Northfield, MN, United States',
	postedDate: '2026-08-14T16:43:34+00:00',
	fields: [{label: 'Wage', value: '$12.00-13.00/hour'}],
	body: '**Duties and Responsibilities:** Tasks include playing music.',
	url: 'https://example.test/sites/CX_1/job/2841',
}

describe('shareJob', () => {
	test('shares the posting url', () => {
		const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'})

		shareJob(JOB)

		expect(share).toHaveBeenCalledWith(expect.objectContaining({url: JOB.url}))
		share.mockRestore()
	})
})
