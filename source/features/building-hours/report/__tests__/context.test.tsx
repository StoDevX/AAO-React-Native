import * as React from 'react'
import {act, renderHook} from '@testing-library/react-native'

import type {BuildingType} from '../../types'
import {BuildingReportProvider, useBuildingReport} from '../context'

const BUILDING: BuildingType = {
	name: 'Stav Hall',
	category: 'Dining',
	schedule: [{title: 'Hours', hours: [{days: ['Mo'], from: '7:00am', to: '8:00pm'}]}],
}

function renderReport() {
	return renderHook(() => useBuildingReport(), {
		wrapper: ({children}: {children: React.ReactNode}) => (
			<BuildingReportProvider>{children}</BuildingReportProvider>
		),
	})
}

describe('useBuildingReport', () => {
	it('has no draft until a report is started', async () => {
		let {result} = await renderReport()

		expect(result.current.draft).toBeNull()
	})

	it('reports no unsaved changes on a freshly started draft', async () => {
		let {result} = await renderReport()

		await act(() => {
			result.current.start(BUILDING)
		})

		expect(result.current.draft).toEqual(BUILDING)
		expect(result.current.hasUnsavedChanges).toBe(false)
	})

	it('notices an edit', async () => {
		let {result} = await renderReport()

		await act(() => {
			result.current.start(BUILDING)
		})
		await act(() => {
			result.current.edit({type: 'UPDATE_BUILDING', data: {name: 'The Cage'}})
		})

		expect(result.current.draft?.name).toBe('The Cage')
		expect(result.current.hasUnsavedChanges).toBe(true)
	})

	it('throws the draft away when the report is cleared', async () => {
		let {result} = await renderReport()

		await act(() => {
			result.current.start(BUILDING)
		})
		await act(() => {
			result.current.clear()
		})

		expect(result.current.draft).toBeNull()
		expect(result.current.hasUnsavedChanges).toBe(false)
	})

	it('starts a report with an empty note', async () => {
		let {result} = await renderReport()

		await act(() => {
			result.current.start(BUILDING)
		})

		expect(result.current.note).toBe('')
	})

	// A note with no field edits is still work someone loses if the sheet
	// dismisses without asking.
	it('counts a note as an unsaved change', async () => {
		let {result} = await renderReport()

		await act(() => {
			result.current.start(BUILDING)
		})
		expect(result.current.hasUnsavedChanges).toBe(false)

		await act(() => {
			result.current.setNote('The Friday hours are wrong.')
		})

		expect(result.current.note).toBe('The Friday hours are wrong.')
		expect(result.current.hasUnsavedChanges).toBe(true)
	})

	it('clears the note when a new report starts', async () => {
		let {result} = await renderReport()

		await act(() => {
			result.current.start(BUILDING)
		})
		await act(() => {
			result.current.setNote('Something')
		})
		await act(() => {
			result.current.start(BUILDING)
		})

		expect(result.current.note).toBe('')
	})
})
