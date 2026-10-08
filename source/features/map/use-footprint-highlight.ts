import * as React from 'react'
import type {GeoJSONSourceRef} from '@maplibre/maplibre-react-native'

/// The feature-state key the footprint layer's fill reads.
export const SELECTED = 'selected'

/// Runs a feature-state call and drops its failure, whether it rejects or
/// throws: `removeFeatureState` is not async, so a source whose native view is
/// already gone throws on the spot.
function quietly(call: () => Promise<void>): void {
	try {
		call().catch(() => undefined)
	} catch {
		// The tint is decoration, and the dot and the card still say which
		// place is open.
	}
}

/// Marks one footprint selected in the source's feature state, and unmarks it
/// when the id changes or the screen goes.
///
/// `resetKey` is never read, only compared: give it a new value whenever
/// something may have left the source without the mark -- new data, or a
/// style load, before which the source takes no feature state at all -- and
/// the mark is set again.
///
/// Unmarking follows the id alone. MapLibre applies a removal on the next
/// frame, so removing and re-setting the same id on a reset would leave it
/// unmarked. The source is looked up when unmarking rather than when marking,
/// since a place can open before the source has mounted.
export function useFootprintHighlight(
	sourceRef: React.RefObject<GeoJSONSourceRef | null>,
	id: string | null,
	resetKey: unknown,
): void {
	React.useEffect(() => {
		if (id === null) {
			return
		}
		return () => {
			// The source as it is now, which is the point: it may have mounted
			// after this place opened, and has gone when the screen closes.
			// oxlint-disable-next-line react-hooks/exhaustive-deps
			let source = sourceRef.current
			if (source) {
				quietly(() => source.removeFeatureState({id}, SELECTED))
			}
		}
	}, [sourceRef, id])

	React.useEffect(() => {
		let source = sourceRef.current
		if (!source || id === null) {
			return
		}
		quietly(() => source.setFeatureState({id}, {[SELECTED]: true}))
	}, [sourceRef, id, resetKey])
}
