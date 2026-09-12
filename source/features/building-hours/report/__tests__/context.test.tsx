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
			result.current.edit({type: 'SET_BUILDING_NAME', name: 'The Cage'})
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
})
