import {expect, test} from '@jest/globals'

import type {MenuTab} from '../../menus/campus-section'
import {hallsOf} from '../halls'

const tabs: MenuTab[] = [
	{
		name: 'stav-hall',
		title: 'Stav Hall',
		icon: 'fork.knife',
		bonApp: {cafe: 'stav-hall', loadingMessage: []},
	},
	{
		name: 'the-cage',
		title: 'The Cage',
		icon: 'cup.and.saucer.fill',
		bonApp: {cafe: 'the-cage', loadingMessage: [], ignoreProvidedMenus: true},
	},
	{name: 'the-pause', title: 'The Pause', icon: 'pawprint.fill'},
]

test('offers each Bon Appétit café, as its Menus tab builds its menu, and no other', () => {
	expect(hallsOf(tabs)).toEqual([
		{title: 'Stav Hall', cafe: 'stav-hall', ignoreProvidedMenus: false},
		{title: 'The Cage', cafe: 'the-cage', ignoreProvidedMenus: true},
	])
})
