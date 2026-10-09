import {beforeEach, expect, test} from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {campusById} from '../../../campuses'
import {pickedFor, useQuickActionsStore} from '../store'

const stolaf = campusById('edu.stolaf')
const carleton = campusById('edu.carleton')
const STOLAF_DEFAULTS = ['Stav Menu', 'Cage Menu', 'Olaf Messenger', 'Transit']

let picked = (campus = stolaf) => pickedFor(useQuickActionsStore.getState(), campus)

beforeEach(() => {
	useQuickActionsStore.setState({picked: {}})
})

test("starts with each campus's defaults", () => {
	expect(picked()).toStrictEqual(STOLAF_DEFAULTS)
	expect(picked(carleton)).toStrictEqual(['Menus', 'Building Hours', 'SUMO', 'Convo'])
})

test('hands back the same defaults each time, which a store selector needs', () => {
	expect(picked()).toBe(picked())
})

test('toggle removes a picked destination', () => {
	useQuickActionsStore.getState().toggleQuickAction('Transit', stolaf)
	expect(picked()).toStrictEqual(['Stav Menu', 'Cage Menu', 'Olaf Messenger'])
})

test('toggle appends an unpicked destination when a slot is free', () => {
	useQuickActionsStore.setState({picked: {'edu.stolaf': ['Transit']}})
	useQuickActionsStore.getState().toggleQuickAction('Calendar', stolaf)
	expect(picked()).toStrictEqual(['Transit', 'Calendar'])
})

test('toggle ignores a fifth pick', () => {
	useQuickActionsStore.getState().toggleQuickAction('Calendar', stolaf)
	expect(picked()).toStrictEqual(STOLAF_DEFAULTS)
})

test('toggle ignores an id that names no destination', () => {
	useQuickActionsStore.setState({picked: {'edu.stolaf': ['Transit']}})
	useQuickActionsStore.getState().toggleQuickAction('Nowhere', stolaf)
	expect(picked()).toStrictEqual(['Transit'])
})

// A tile renamed in a later release must not hold one of the four slots.
test('toggle prunes unknown ids, freeing their slot', () => {
	useQuickActionsStore.setState({
		picked: {'edu.stolaf': ['Stav Menu', 'Cage Menu', 'Transit', 'Renamed Tile']},
	})
	useQuickActionsStore.getState().toggleQuickAction('Calendar', stolaf)
	expect(picked()).toStrictEqual(['Stav Menu', 'Cage Menu', 'Transit', 'Calendar'])
})

test('reset restores the defaults', () => {
	useQuickActionsStore.setState({picked: {'edu.stolaf': ['Calendar']}})
	useQuickActionsStore.getState().resetQuickActions(stolaf)
	expect(picked()).toStrictEqual(STOLAF_DEFAULTS)
})

test("a Carleton pick leaves St. Olaf's alone", () => {
	useQuickActionsStore.getState().toggleQuickAction('SUMO', carleton)
	expect(picked(carleton)).toStrictEqual(['Menus', 'Building Hours', 'Convo'])
	expect(picked()).toStrictEqual(STOLAF_DEFAULTS)
})

test("resetting Carleton restores Carleton's defaults alone", () => {
	useQuickActionsStore.setState({picked: {'edu.stolaf': ['Transit'], 'edu.carleton': ['SUMO']}})
	useQuickActionsStore.getState().resetQuickActions(carleton)
	expect(picked(carleton)).toStrictEqual(['Menus', 'Building Hours', 'SUMO', 'Convo'])
	expect(picked()).toStrictEqual(['Transit'])
})

test("drops a 2.9 RC's saved picks, which used the old shape", async () => {
	await AsyncStorage.setItem(
		'quick-actions',
		JSON.stringify({
			state: {quickActions: ['Transit'], carletonQuickActions: ['SUMO']},
			version: 1,
		}),
	)
	await useQuickActionsStore.persist.rehydrate()
	expect(useQuickActionsStore.getState().picked).toStrictEqual({})
	expect(picked()).toStrictEqual(STOLAF_DEFAULTS)
})
