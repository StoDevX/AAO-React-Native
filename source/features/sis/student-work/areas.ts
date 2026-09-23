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
	/// Known to hold nothing: every unit's search answered and none found anything.
	empty: boolean
	/// Every unit's search has answered, whether or not it succeeded.
	settled: boolean
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
		let settled = true
		for (let unit of area.units) {
			let result = units.get(unit)
			if (result === undefined || result.status === 'pending') settled = false
			if (result?.status !== 'success') continue
			answered += 1
			for (let id of result.ids) {
				if (boardIds.has(id)) ids.add(id)
			}
		}

		let allAnswered = answered === area.units.length
		let count = ids.size > 0 || allAnswered ? ids.size : undefined
		statuses.set(area.slug, {ids, count, empty: allAnswered && ids.size === 0, settled})
	}

	return statuses
}

/// Whether a list with these areas chosen (by name) can show its postings.
/// Until every search for a chosen area has answered, the list cannot tell
/// the area's postings from the rest, and one that filled in search by search
/// would jump back to the top each time. `retrying` is a Try Again under way,
/// shown as loading rather than as the same failure.
export function chosenAreaState(
	chosenNames: string[] | null,
	areas: StudentWorkArea[],
	membership: Map<string, AreaStatus>,
	retrying: boolean,
): 'ready' | 'loading' | 'failed' {
	let statuses = areas
		.filter((area) => (chosenNames ?? []).includes(area.name))
		.map((area) => membership.get(area.slug))

	if (statuses.some((status) => status === undefined || !status.settled)) {
		return 'loading'
	}
	if (statuses.some((status) => status?.count === undefined)) {
		return retrying ? 'loading' : 'failed'
	}
	return 'ready'
}
