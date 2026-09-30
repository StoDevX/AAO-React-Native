import type {PlaceTile} from './place-tiles'

/// A card's four carousels of places.
export type PlaceSections = {
	departments: Array<PlaceTile>
	offices: Array<PlaceTile>
	alsoHere: Array<PlaceTile>
	accessibleParking: Array<PlaceTile>
}

/**
 * A name reduced to what two spellings of it share: case, accents and
 * punctuation folded away, so "Piper Center" and "piper center" meet.
 * Nothing looser -- "Office of the Registrar" is not "Registrar" -- since a
 * wrong merge would open one office's card from another's tile.
 */
export function nameKey(name: string): string {
	return name
		.normalize('NFD')
		.replaceAll(/\p{M}/gu, '')
		.toLowerCase()
		.replaceAll(/[^\p{L}\p{N}]/gu, '')
}

function byLabel(a: PlaceTile, b: PlaceTile): number {
	return a.label.localeCompare(b.label, undefined, {sensitivity: 'base'})
}

/**
 * The card's Departments, Offices and Also at This Location, with each place
 * in only one of them. A department or office link that names the same place
 * as one of `candidates` (from `alsoHere`) becomes one tile, in the link's
 * section, that opens the place's card, which then lists the link's page.
 * Offices with no link join Offices, accessible parking spots get Accessible
 * Parking, and Also at This Location keeps the rest.
 */
export function placeSections(
	links: Array<PlaceTile>,
	candidates: Array<PlaceTile>,
): PlaceSections {
	let unused = [...candidates]
	let merged = links.map((tile) => {
		let index = unused.findIndex((candidate) => nameKey(candidate.label) === nameKey(tile.label))
		if (index === -1) {
			return tile
		}
		let [candidate] = unused.splice(index, 1)
		let opens =
			candidate.opens && tile.href
				? {...candidate.opens, link: {label: tile.label, href: tile.href}}
				: candidate.opens
		return {...tile, opens, venue: candidate.venue}
	})

	return {
		departments: merged.filter((tile) => tile.kind === 'department').sort(byLabel),
		offices: [
			...merged.filter((tile) => tile.kind === 'office'),
			...unused.filter((tile) => tile.kind === 'office'),
		].sort(byLabel),
		alsoHere: unused
			.filter((tile) => tile.kind !== 'office' && tile.kind !== 'accessible-parking')
			.sort(byLabel),
		accessibleParking: unused.filter((tile) => tile.kind === 'accessible-parking').sort(byLabel),
	}
}
