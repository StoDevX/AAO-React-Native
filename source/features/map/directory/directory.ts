import {ownHours} from '../../building-hours/lib'
import type {BuildingType} from '../../building-hours/types'
import type {StackEntry} from '../lib/also-here'
import {nameKey} from '../lib/place-sections'
import type {PlaceTile} from '../lib/place-tiles'
import type {Building, Feature} from '../types'
import type {BuildingDirectory, DirectoryEntry, DirectoryFloor} from './types'

/// What a directory entry opens: a card on the stack (with the venue whose
/// status it shows, if any), a web page, or nothing.
export type EntryTarget =
	| {kind: 'card'; opens: StackEntry; venue?: BuildingType}
	| {kind: 'link'; href: string}
	| {kind: 'none'}

type Place = {
	building: Feature<Building>
	features: Array<Feature<Building>>
	venues: Array<BuildingType>
	links: Array<PlaceTile>
}

/// The card for a venue, showing its status.
function venueCard(venue: BuildingType): EntryTarget {
	return {kind: 'card', opens: {kind: 'venue', name: venue.name}, venue}
}

/**
 * What an entry on a building's directory opens. An explicit `venue` or
 * `point` decides; otherwise the name is matched, folding case, accents and
 * punctuation, against the Hours venues on the building or its points, then
 * the points themselves, then the building's department and office links.
 * A key or name that matches nothing leaves the entry as text.
 */
export function resolveEntry(
	entry: DirectoryEntry,
	{building, features, venues, links}: Place,
): EntryTarget {
	let points = features.filter((feature) => feature.properties.parent === building.id)
	let here = new Set([building.id, ...points.map((point) => point.id)])
	let venuesHere = venues.filter(
		(venue) => venue.building !== undefined && here.has(venue.building),
	)
	let key = nameKey(entry.name)

	let pointCard = (point: Feature<Building>): EntryTarget => ({
		kind: 'card',
		opens: {kind: 'feature', id: point.id},
		venue: ownHours(venues, point),
	})

	if (entry.venue) {
		let venue = venues.find((candidate) => candidate.name === entry.venue)
		return venue ? venueCard(venue) : {kind: 'none'}
	}
	if (entry.point) {
		let point = features.find((feature) => feature.id === entry.point)
		return point ? pointCard(point) : {kind: 'none'}
	}

	let venue = venuesHere.find((candidate) => nameKey(candidate.name) === key)
	if (venue) {
		return venueCard(venue)
	}
	let point = points.find((candidate) => nameKey(candidate.properties.name) === key)
	if (point) {
		return pointCard(point)
	}
	let link = links.find((candidate) => candidate.href && nameKey(candidate.label) === key)
	if (link?.href) {
		return {kind: 'link', href: link.href}
	}
	return {kind: 'none'}
}

/// A building's directory, if it keeps one.
export function directoryFor(
	directories: Array<BuildingDirectory>,
	buildingId: string,
): BuildingDirectory | undefined {
	return directories.find((directory) => directory.building === buildingId)
}

/// One floor's row on the card: where it sits in the file, its name, and how
/// many places it holds.
export type FloorRow = {index: number; name: string; detail: string}

/// The floors with anything on them, bottom to top, as the card lists them.
export function floorRows(directory: BuildingDirectory): Array<FloorRow> {
	return directory.floors.flatMap((floor, index) => {
		let count = floor.entries.length
		return count === 0
			? []
			: [{index, name: floor.name, detail: `${count} ${count === 1 ? 'place' : 'places'}`}]
	})
}

/// A room as the college writes it, "TOH 220", or the room alone when the
/// building has no abbreviation.
export function roomLabel(
	abbreviation: string | undefined,
	room: string | undefined,
): string | undefined {
	if (!room) {
		return undefined
	}
	return abbreviation ? `${abbreviation} ${room}` : room
}

/// A floor's entries in the order its sheet lists them.
export function sortedEntries(floor: DirectoryFloor): Array<DirectoryEntry> {
	return [...floor.entries].sort((a, b) =>
		a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}),
	)
}
