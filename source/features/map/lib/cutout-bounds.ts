import {toBuildingFootprints} from './building-footprints'
import {featureBounds} from './feature-bounds'
import type {Building, Feature} from '../types'

/**
 * The box a building cutout frames, or `undefined` when there is nothing to
 * frame.
 *
 * Both halves have to agree: a feature with no drawable footprint leaves the
 * cutout with an outline it cannot fill, and a feature with no coordinates at
 * all has no box. Framing on a zero-area box clamps MapLibre to maximum zoom,
 * which draws a blank tile with a name floating on it -- the six St. Olaf
 * venues that key to a point rather than a building all landed there.
 */
export function cutoutBounds(feature: Feature<Building>): ReturnType<typeof featureBounds> {
	let footprints = toBuildingFootprints([feature])
	return footprints.features.length > 0 ? featureBounds(feature) : undefined
}
