import * as React from 'react'
import {GeoJSONSource, Layer} from '@maplibre/maplibre-react-native'
import * as c from '@frogpond/colors'

import {PIN_IMAGE, PIN_NAME_LAYOUT, PIN_NAME_PAINT} from './map-pins-layer'
import type {Coordinate} from './types'

/// The ring around the selected place's gold dot: wider than a pin's, so
/// the open place stands out among them.
const SELECTION_RING = 3

type Props = {
	/// The selected place, or nothing while no place is open.
	place: {at: Coordinate; name: string} | null
}

/// The open place's dot and its name, drawn as a map symbol. As a symbol it
/// takes part in label placement, placed before the base map's labels, so the
/// base map's own name for the place gives way to it rather than drawing
/// through it -- and the name it carries stands in for the one it hides.
export function MapSelectionLayer({place}: Props): React.ReactNode {
	let data = React.useMemo(
		(): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
			type: 'FeatureCollection',
			features: place
				? [
						{
							type: 'Feature',
							geometry: {type: 'Point', coordinates: place.at},
							properties: {name: place.name},
						},
					]
				: [],
		}),
		[place],
	)

	return (
		<GeoJSONSource data={data} id="map-selection">
			<Layer
				id="map-selection-dot"
				layout={{'icon-image': PIN_IMAGE, 'icon-allow-overlap': true, ...PIN_NAME_LAYOUT}}
				paint={{
					'icon-color': c.gold,
					'icon-halo-color': c.white,
					'icon-halo-width': SELECTION_RING,
					...PIN_NAME_PAINT,
				}}
				type="symbol"
			/>
		</GeoJSONSource>
	)
}
