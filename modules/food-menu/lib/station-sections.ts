import type {MenuItemType} from '../types'

/** One section of the menu: a station, or one of its sub-stations. */
export type MenuSection = {
	/** Unique across the menu, since a sub-station's carries its station's name. */
	title: string
	/** The station the section belongs to, which carries its note. */
	station: string
	data: MenuItemType[]
}

/**
 * A station's items, sectioned by the sub-station Bon Appétit files each under.
 *
 * The Cage lists a special alongside dozens of burgers, wraps and breakfast
 * sandwiches, all under a station called `Daily Special`; the sub-stations are
 * what tell a burger from a wrap. Bon Appétit files no special under one, so
 * the items without a sub-station lead, under the station's own name, and the
 * sub-stations follow in the cafe's order.
 *
 * A sub-station is headed with its station's name as well as its own -- `Daily
 * Special • Burgers` -- since Stav files a `Cheese` at three stations, and a
 * list cannot nest one heading beneath another.
 */
export function stationSections(station: string, items: MenuItemType[]): MenuSection[] {
	let unfiled: MenuItemType[] = []
	let bySubStation = new Map<string, MenuItemType[]>()

	for (let item of items) {
		if (!item.sub_station) {
			unfiled.push(item)
			continue
		}

		let filed = bySubStation.get(item.sub_station)
		if (filed) {
			filed.push(item)
		} else {
			bySubStation.set(item.sub_station, [item])
		}
	}

	let subStations = Array.from(bySubStation, ([name, data]) => ({name, data})).sort(
		(a, b) => Number(a.data[0].sub_station_order) - Number(b.data[0].sub_station_order),
	)

	let sections: MenuSection[] = []
	if (unfiled.length > 0) {
		sections.push({title: station, station, data: unfiled})
	}
	for (let {name, data} of subStations) {
		sections.push({title: `${station} • ${name}`, station, data})
	}

	return sections
}
