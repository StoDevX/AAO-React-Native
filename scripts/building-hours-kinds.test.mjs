import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import {duplicateBuildingHours} from './building-hours-kinds.mjs'

describe('duplicateBuildingHours', () => {
	it('names two building venues on one key', () => {
		assert.deepEqual(
			duplicateBuildingHours([
				{name: 'Tomson Hall', building: 'toh', kind: 'building'},
				{name: 'Tomson Annex', building: 'toh', kind: 'building'},
			]),
			[{building: 'toh', names: ['Tomson Hall', 'Tomson Annex']}],
		)
	})

	it('allows one building venue beside offices on the same key', () => {
		assert.deepEqual(
			duplicateBuildingHours([
				{name: 'Tomson Hall', building: 'toh', kind: 'building'},
				{name: 'Registrar', building: 'toh', kind: 'office'},
			]),
			[],
		)
	})

	it('ignores venues with no key', () => {
		assert.deepEqual(
			duplicateBuildingHours([
				{name: 'SARN Hotline', kind: 'service'},
				{name: 'Another Line', kind: 'service'},
			]),
			[],
		)
	})
})
