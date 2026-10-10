import {describe, expect, test} from '@jest/globals'
import * as c from '@frogpond/colors'

import type {ViewType} from '../../views'
import {visibleGroups, type HomeGroup} from '../groups'

const menus: ViewType = {
	type: 'view',
	view: '/menus',
	title: 'Menus',
	icon: 'fork.knife',
	gradient: c.greenGradient,
}
const devOnly: ViewType = {...menus, title: 'Dev Menus', devOnly: true}

describe("Home's tile groups", () => {
	test('keep each tile Home would show', () => {
		let groups: HomeGroup[] = [{title: 'Carleton College', tiles: [menus]}]
		expect(visibleGroups(groups, {isDev: false})).toEqual([
			{title: 'Carleton College', tiles: [menus]},
		])
	})

	test('drop a group whose every tile is hidden, heading and all', () => {
		let groups: HomeGroup[] = [{title: 'Dev Only', tiles: [devOnly]}]
		expect(visibleGroups(groups, {isDev: false})).toEqual([])
		expect(visibleGroups(groups, {isDev: true})).toEqual([{title: 'Dev Only', tiles: [devOnly]}])
	})

	test('are none for a campus without groups', () => {
		expect(visibleGroups(undefined, {isDev: true})).toEqual([])
	})
})
