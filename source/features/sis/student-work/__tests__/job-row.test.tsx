import * as React from 'react'
import {render, screen, fireEvent} from '@testing-library/react-native'
import {JobRow} from '../job-row'
import type {JobSummary} from '@frogpond/ccc-jobs'

const JOB: JobSummary = {
	id: '2841',
	title: 'AY Athletic Events Student Worker (WS-ST1)',
	postedDate: '2026-08-14',
	location: 'Northfield, MN, United States',
}

describe('JobRow', () => {
	test('shows the job title', async () => {
		await render(<JobRow job={JOB} onPress={jest.fn()} />)

		expect(screen.getByText(JOB.title)).toBeTruthy()
	})

	test('shows the posted date in long form', async () => {
		await render(<JobRow job={JOB} onPress={jest.fn()} />)

		expect(screen.getByText('Posted August 14, 2026')).toBeTruthy()
	})

	test('shows nothing for a posted date it cannot read', async () => {
		await render(<JobRow job={{...JOB, postedDate: ''}} onPress={jest.fn()} />)

		expect(screen.queryByText(/^Posted/u)).toBeNull()
	})

	test('passes the job back on press', async () => {
		const onPress = jest.fn()
		await render(<JobRow job={JOB} onPress={onPress} />)

		fireEvent.press(screen.getByText(JOB.title))
		expect(onPress).toHaveBeenCalledWith(JOB)
	})
})
