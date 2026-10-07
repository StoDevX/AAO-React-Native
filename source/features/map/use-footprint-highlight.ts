import * as React from 'react'
import type {GeoJSONSourceRef} from '@maplibre/maplibre-react-native'

/// The feature-state key the footprint layer's fill reads.
export const SELECTED = 'selected'

/// Marks one footprint selected in the source's feature state, and unmarks it
/// when the id changes or the screen goes. `data` is the source's data: when it
/// changes the state is set again, as new data may arrive without it.
///
/// Unmarking follows the id alone. MapLibre applies a removal on the next
/// frame, so removing and re-setting the same id for new data would leave it
/// unmarked.
///
/// A failed call is dropped -- the tint is decoration, and the dot and the
/// card still say which place is open.
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
		return () => {
			source.removeFeatureState({id}, SELECTED).catch(() => undefined)
		}
	}, [sourceRef, id])

	React.useEffect(() => {
		if (id === null) {
			return
		}
		sourceRef.current?.setFeatureState({id}, {[SELECTED]: true}).catch(() => undefined)
	}, [sourceRef, id, data])
}
