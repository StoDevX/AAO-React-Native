import {makeBuilding} from '../../__tests__/fixtures'
import {searchPlaces} from '../search-places'

const places = [
	makeBuilding({id: 'a', name: 'Alpha Hall', categories: ['building']}),
	makeBuilding({id: 'b', name: 'Beta Lot', categories: ['parking']}),
	makeBuilding({id: 'c', name: 'Gamma Field', categories: ['outdoors']}),
]

const names = (features: ReturnType<typeof searchPlaces>) =>
	features.map((feature) => feature.properties.name)

describe('searchPlaces', () => {
	// Someone who types a name wants the place, whichever group is open.
	it('searches every category', () => {
		expect(names(searchPlaces(places, 'gamma'))).toEqual(['Gamma Field'])
	})

	// The Caf, the Pause, Skoglund: people search for what they call a place.
	it('matches a nickname as well as a name', () => {
		let withNickname = [makeBuilding({id: 'd', name: 'Buntrock Commons', nickname: 'The Caf'})]
		expect(names(searchPlaces(withNickname, 'caf'))).toEqual(['Buntrock Commons'])
	})

	it('has nothing to show for a query nothing matches', () => {
		expect(searchPlaces(places, 'zzz')).toEqual([])
	})
})
