import React from 'react'
import {describe, it, expect, jest, beforeEach} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'

import {ContextMenu} from '@frogpond/context-menu'
import {HomeScreenTile} from '../tile'
import {reducer as settings, type State} from '../../../redux/parts/settings'
import type {ViewType} from '../../views'

jest.mock('@react-native-vector-icons/entypo', () => ({Entypo: 'Icon'}))

const mockNavigate = jest.fn()
const mockOpenUrl = jest.fn()

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({navigate: mockNavigate}),
}))

jest.mock('@frogpond/open-url', () => ({
	openUrl: (url: string) => mockOpenUrl(url),
}))

// Stub the native iOS context menu — render its children inline so the
// underlying button is still queryable, and capture the props for assertion.
jest.mock('@frogpond/context-menu', () => ({
	ContextMenu: jest.fn(({children}) => children),
}))

const navView: ViewType = {
	id: 'menus',
	type: 'view',
	view: 'Menus',
	title: 'Menus',
	icon: 'bowl',
	foreground: 'light',
	tint: '#3478F6',
}

const urlView: ViewType = {
	id: 'oleville',
	type: 'url',
	url: 'https://oleville.com/',
	title: 'Oleville',
	icon: 'browser',
	foreground: 'dark',
	tint: '#FFCC00',
}

const buildStore = (initial?: Partial<State>) =>
	configureStore({
		reducer: {settings},
		preloadedState: {
			settings: {
				unofficialityAcknowledged: false,
				devModeOverride: false,
				homescreenSizes: {},
				...initial,
			},
		},
	})

const lastContextMenuProps = () => {
	const calls = (ContextMenu as unknown as jest.Mock).mock.calls
	return calls[calls.length - 1][0] as {
		actions: Array<{key: string; title: string}>
		selectedAction?: string
		onPressMenuItem: (key: string) => void
	}
}

describe('HomeScreenTile', () => {
	beforeEach(() => {
		mockNavigate.mockReset()
		mockOpenUrl.mockReset()
		;(ContextMenu as unknown as jest.Mock).mockClear()
	})

	it('navigates on press for a view-type entry', () => {
		const store = buildStore()
		render(
			<Provider store={store}>
				<HomeScreenTile view={navView} />
			</Provider>,
		)
		fireEvent.press(screen.getByLabelText('Menus'))
		expect(mockNavigate).toHaveBeenCalledWith('Menus')
	})

	it('opens the URL on press for a url-type entry', () => {
		const store = buildStore()
		render(
			<Provider store={store}>
				<HomeScreenTile view={urlView} />
			</Provider>,
		)
		fireEvent.press(screen.getByLabelText('Oleville'))
		expect(mockOpenUrl).toHaveBeenCalledWith('https://oleville.com/')
	})

	it('passes the persisted tile size through as selectedAction and renders that variant', () => {
		const store = buildStore({homescreenSizes: {menus: '1x1'}})
		render(
			<Provider store={store}>
				<HomeScreenTile view={navView} />
			</Provider>,
		)
		expect(lastContextMenuProps().selectedAction).toBe('1x1')
		// At 1x1 the title is hidden visually but accessibilityLabel remains.
		expect(screen.queryByText('Menus')).toBeNull()
		expect(screen.getByLabelText('Menus')).toBeTruthy()
	})

	it('exposes the four size actions with human labels', () => {
		const store = buildStore()
		render(
			<Provider store={store}>
				<HomeScreenTile view={navView} />
			</Provider>,
		)
		expect(lastContextMenuProps().actions).toEqual([
			{key: '1x1', title: 'Small'},
			{key: '1x2', title: 'Medium'},
			{key: '2x2', title: 'Large'},
			{key: '2x4', title: 'Wide'},
		])
	})

	it('dispatches setHomescreenTileSize when the menu callback fires', () => {
		const store = buildStore()
		render(
			<Provider store={store}>
				<HomeScreenTile view={navView} />
			</Provider>,
		)
		lastContextMenuProps().onPressMenuItem('2x2')
		expect(store.getState().settings.homescreenSizes).toEqual({menus: '2x2'})
	})
})
