import * as React from 'react'
import type {GeoJSONSourceRef} from '@maplibre/maplibre-react-native'

/// The feature-state key the footprint layer's fill reads.
export const SELECTED = 'selected'

/// Runs a feature-state call and drops its failure, whether it rejects or
/// throws: `removeFeatureState` is not async, so a source whose native view is
/// already gone -- the screen closing with a place open -- throws on the spot.
function quietly(call: () => Promise<void>): void {
	try {
		call().catch(() => undefined)
	} catch {
		// The tint is decoration, and the dot and the card still say which
		// place is open.
	}
}

/// Marks one footprint selected in the source's feature state, and unmarks it
/// when the id changes or the screen goes. `data` is the source's data: when it
/// changes the state is set again, as new data may arrive without it.
///
/// Unmarking follows the id alone. MapLibre applies a removal on the next
/// frame, so removing and re-setting the same id for new data would leave it
/// unmarked.
export function useFootprintHighlight(
	sourceRef: React.RefObject<GeoJSONSourceRef | null>,
	id: string | null,
	data: unknown,
): void {
	React.useEffect(() => {
		let source = sourceRef.current
		if (!source || id === null) {
			return
		}
		return () => quietly(() => source.removeFeatureState({id}, SELECTED))
	}, [sourceRef, id])

	React.useEffect(() => {
		let source = sourceRef.current
		if (!source || id === null) {
			return
		}
		quietly(() => source.setFeatureState({id}, {[SELECTED]: true}))
	}, [sourceRef, id, data])
}
