import {resolveGradient, type Gradient} from '@frogpond/colors'
import type {SFSymbol} from 'sf-symbols-typescript'

/// An area as data/student-work-areas.yaml writes it.
export type AreaEntry = {
	name: string
	slug: string
	icon: string
	gradient: unknown
	units: string[]
}

/// One Student Work tile: a group of St. Olaf units, from data/student-work-areas.yaml.
export type StudentWorkArea = {
	name: string
	slug: string
	icon: SFSymbol
	gradient: Gradient
	units: string[]
}

export function toAreas(entries: AreaEntry[]): StudentWorkArea[] {
	return entries.map((entry) => ({
		...entry,
		// The schema checks only that this is a string; see org-categories.yaml.
		icon: entry.icon as SFSymbol,
		gradient: resolveGradient(entry.gradient),
	}))
}

/// Where one unit's keyword search has got to.
export type UnitResult =
	| {status: 'success'; ids: string[]}
	| {status: 'error'}
	| {status: 'pending'}

export type AreaStatus = {
	/// The board's postings in this area, from the unit searches that answered.
	ids: Set<string>
	/// How many, or undefined while nothing about the area is known.
	count: number | undefined
	/// Only when every unit's search answered and none found anything.
	disabled: boolean
}

/// Which of the board's postings each area holds, keyed by the area's slug.
export function areaMembership(
	areas: StudentWorkArea[],
	units: Map<string, UnitResult>,
	boardIds: Set<string>,
): Map<string, AreaStatus> {
	let statuses = new Map<string, AreaStatus>()

	for (let area of areas) {
		let ids = new Set<string>()
		let answered = 0
		for (let unit of area.units) {
			let result = units.get(unit)
			if (result?.status !== 'success') continue
			answered += 1
			for (let id of result.ids) {
				if (boardIds.has(id)) ids.add(id)
			}
		}

		let allAnswered = answered === area.units.length
		let count = ids.size > 0 || allAnswered ? ids.size : undefined
		statuses.set(area.slug, {ids, count, disabled: allAnswered && ids.size === 0})
	}

	return statuses
}
