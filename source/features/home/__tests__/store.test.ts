import {act} from '@testing-library/react-native'

import {useCollapsedGroupsStore, useHomeLayoutStore} from '../store'

describe('useHomeLayoutStore', () => {
	beforeEach(() => {
		useHomeLayoutStore.setState({layout: 'tiled'})
	})

	it('starts with the tiles of today', () => {
		expect(useHomeLayoutStore.getState().layout).toBe('tiled')
	})

	it('switches to grouped and back', async () => {
		await act(() => {
			useHomeLayoutStore.getState().setLayout('grouped')
		})
		expect(useHomeLayoutStore.getState().layout).toBe('grouped')

		await act(() => {
			useHomeLayoutStore.getState().setLayout('tiled')
		})
		expect(useHomeLayoutStore.getState().layout).toBe('tiled')
	})
})

describe('useCollapsedGroupsStore', () => {
	beforeEach(() => {
		useCollapsedGroupsStore.setState({collapsedGroups: []})
	})

	it('starts with every group open', () => {
		expect(useCollapsedGroupsStore.getState().collapsedGroups).toEqual([])
	})

	it('collapses a group when it is toggled, and opens it when it is toggled again', async () => {
		await act(() => {
			useCollapsedGroupsStore.getState().toggleGroup('eat')
		})
		expect(useCollapsedGroupsStore.getState().collapsedGroups).toEqual(['eat'])

		await act(() => {
			useCollapsedGroupsStore.getState().toggleGroup('eat')
		})
		expect(useCollapsedGroupsStore.getState().collapsedGroups).toEqual([])
	})

	it('keeps each group its own state', async () => {
		await act(() => {
			useCollapsedGroupsStore.getState().toggleGroup('eat')
			useCollapsedGroupsStore.getState().toggleGroup('listen-watch')
			useCollapsedGroupsStore.getState().toggleGroup('eat')
		})
		expect(useCollapsedGroupsStore.getState().collapsedGroups).toEqual(['listen-watch'])
	})

	it('is not hydrated until the saved groups have loaded', async () => {
		useCollapsedGroupsStore.setState({hydrated: false})
		await act(async () => {
			await useCollapsedGroupsStore.persist.rehydrate()
		})
		expect(useCollapsedGroupsStore.getState().hydrated).toBe(true)
	})
})
