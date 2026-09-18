import {describe, expect, it} from '@jest/globals'
import {readFileSync} from 'node:fs'
import {load} from 'js-yaml'
import {TIME_JUMPS} from '../time-jumps'
import {contextualStatus} from '../../lib/contextual-status'
import type {BuildingType} from '../../types'

let read = (file: string) =>
	load(readFileSync(`data/building-hours/${file}`, 'utf8')) as BuildingType

let jump = (label: string) => {
	let found = TIME_JUMPS.find((candidate) => candidate.label === label)
	if (!found) throw new Error(`no jump labelled ${label}`)
	return found.moment()
}

describe('every named jump lands where it says', () => {
	it('puts the Post Office in the chapel run-up', () => {
		let postOffice = read('3-1-post-office.yaml')
		expect(contextualStatus(postOffice, jump('Chapel in 5 min')).short).toBe('Chapel in 5 min')
	})

	it('puts the Post Office inside chapel', () => {
		let postOffice = read('3-1-post-office.yaml')
		expect(contextualStatus(postOffice, jump('During chapel')).short).toBe('Reopens at 10:30 AM')
	})

	it('puts the Pause Kitchen almost open', () => {
		let pause = read('1-2-pause-kitchen.yaml')
		expect(contextualStatus(pause, jump('Almost open')).short).toBe('Opens in 15 min')
	})

	it('closes everything in Mail and Packages', () => {
		let printCenter = read('3-2-print-center.yaml')
		expect(contextualStatus(printCenter, jump('Weekend, closed')).short).toBe('Closed')
	})
})
