import type {Moment} from 'moment-timezone'

import {categoriesFrom} from '../building-hours/lib'
import type {BuildingType} from '../building-hours/types'
import {hoursAnswer, openNowLabel} from './answers'

/** One choice on a hotline menu: another menu, or a finished answer to read. */
export type HotlineOption = {label: string; target: HotlineMenu | {answer: string}}

/** A menu of the phone tree; its options are offered by position, from 1. */
export type HotlineMenu = {title: string; options: HotlineOption[]}

/** What the tree is built from, all of it in hand before the call is answered. */
export type DirectoryInput = {
	/** Each dining hall with specials, and what its specials answer says. */
	halls: Array<{name: string; specials: string}>
	buildings: BuildingType[]
	now: Moment
}

/** A menu of `buildings`, each reading its hours today, labelled by `label`. */
function buildingsMenu(
	title: string,
	buildings: BuildingType[],
	now: Moment,
	label: (building: BuildingType) => string,
): HotlineMenu {
	return {
		title,
		options: buildings.map((building) => ({
			label: label(building),
			target: {answer: hoursAnswer(building, now)},
		})),
	}
}

/**
 * The hotline's whole tree at `now`: the dining halls' specials, every listed
 * venue's hours by category, and what is open right now. A branch with nothing
 * under it is left out of the main menu.
 */
export function buildDirectory({halls, buildings, now}: DirectoryInput): HotlineMenu {
	let options: HotlineOption[] = []

	if (halls.length > 0) {
		options.push({
			label: 'the dining hall specials',
			target: {
				title: 'Dining halls',
				options: halls.map((hall) => ({label: hall.name, target: {answer: hall.specials}})),
			},
		})
	}

	let listed = buildings.filter((building) => building.listed !== false)
	if (listed.length > 0) {
		options.push({
			label: 'building hours',
			target: {
				title: 'Building hours',
				options: categoriesFrom(listed).map((category) => ({
					label: category,
					target: buildingsMenu(
						category,
						listed.filter((building) => building.category === category),
						now,
						(building) => building.name,
					),
				})),
			},
		})
	}

	let open = buildings.flatMap((building) => {
		let label = openNowLabel(building, now)
		return label ? [{building, label}] : []
	})
	options.push({
		label: 'everything open right now',
		target:
			open.length > 0
				? {
						title: 'Open right now',
						options: open.map(({building, label}) => ({
							label,
							target: {answer: hoursAnswer(building, now)},
						})),
					}
				: {answer: 'Nothing is open right now.'},
	})

	return {title: 'Main menu', options}
}
