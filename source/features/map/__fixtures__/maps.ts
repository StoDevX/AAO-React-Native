import type {Campus} from '../../building-hours/types'
import type {Building, FeatureCollection} from '../types'
import carletonMap from './carleton-map.json'
import stolafMap from './stolaf-map.json'

/**
 * Each campus's map, for UI testing: copies of what each ccc-server's
 * `map/geojson` served on 2026-09-30.
 *
 * The live maps are rebuilt whenever their data publishes, and a republish
 * changes what the map's tests measure -- a list row's position, which card
 * opens, which places exist -- with no change to the app. Replace the copies
 * deliberately, with `mise run update-map-fixtures`, when a test needs a place
 * they lack.
 *
 * Cast through `unknown` because TypeScript widens a JSON file's coordinates
 * to plain number arrays, which the geometry's ring and point tuples reject.
 */
export const UITEST_MAPS: Record<Campus, FeatureCollection<Building>> = {
	stolaf: stolafMap as unknown as FeatureCollection<Building>,
	carleton: carletonMap as unknown as FeatureCollection<Building>,
}
