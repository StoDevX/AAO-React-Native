import {makeBuilding} from '../../__tests__/fixtures'
import {visibleBuildings} from '../visible-buildings'

const buildings = [
	makeBuilding({id: 'a', name: 'Alpha Hall', categories: ['building']}),
	makeBuilding({id: 'b', name: 'Beta Lot', categories: ['parking']}),
	makeBuilding({id: 'c', name: 'Gamma Field', categories: ['outdoors']}),
]

const names = (features: ReturnType<typeof visibleBuildings>) =>
	features.map((feature) => feature.properties.name)

describe('visibleBuildings', () => {
	it('shows only the chosen category when nothing has been typed', () => {
		expect(names(visibleBuildings(buildings, 'Buildings', ''))).toEqual(['Alpha Hall'])
		expect(names(visibleBuildings(buildings, 'Parking', ''))).toEqual(['Beta Lot'])
	})

	// The segments narrow; the search does not. Someone who types a name wants
	// the place, not a reminder that they are on the wrong segment.
	it('searches every category, whichever segment is chosen', () => {
		expect(names(visibleBuildings(buildings, 'Buildings', 'gamma'))).toEqual(['Gamma Field'])
	})

	// The Caf, the Pause, Skoglund: people search for what they call a place.
	it('matches a nickname as well as a name', () => {
		let withNickname = [makeBuilding({id: 'd', name: 'Buntrock Commons', nickname: 'The Caf'})]

		expect(names(visibleBuildings(withNickname, 'Buildings', 'caf'))).toEqual(['Buntrock Commons'])
	})

	it('has nothing to show for a query nothing matches', () => {
		expect(visibleBuildings(buildings, 'Buildings', 'zzz')).toEqual([])
	})

	// Some records carry no categories at all -- the windmill, the wind chime
	// memorial -- and an empty list is not a match for any segment.
	it('leaves out a place that lists no categories', () => {
		let uncategorised = [makeBuilding({id: 'e', name: 'The Windmill', categories: []})]

		expect(visibleBuildings(uncategorised, 'Buildings', '')).toEqual([])
	})
})
