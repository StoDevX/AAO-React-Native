import * as React from 'react'
import {GeoJSONSource, Layer, type FilterSpecification} from '@maplibre/maplibre-react-native'
import * as c from '@frogpond/colors'

import {PIN_IMAGE, PIN_NAME_LAYOUT, PIN_NAME_PAINT} from './map-pins-layer'
import type {Selection} from './lib/selection'

/// The ring around the selected place's gold dot: wider than a pin's, so
/// the open place stands out among them.
const SELECTION_RING = 3

/// The width of the gold line over a selected trail, and of the white casing
/// under it, so it reads over the base map's own trail.
const TRAIL_WIDTH = 4
const TRAIL_CASING = TRAIL_WIDTH + SELECTION_RING * 2

/// A line of either kind. MapLibre's `geometry-type` reports a one-part
/// MultiLineString as a LineString.
const IS_LINE: FilterSpecification = [
	'match',
	['geometry-type'],
	['LineString', 'MultiLineString'],
	true,
	false,
]

type Props = {
	/// The selected place, or nothing while no place is open.
	selection: Selection | null
}

/// The open place drawn over the map: a trail as its course in gold, anything
/// else as a gold dot, and either way its name as a map symbol. As a symbol
/// the name takes part in label placement, placed before the base map's
/// labels, so the base map's own name for the place gives way to it rather
/// than drawing through it -- and the name it carries stands in for the one
/// it hides.
export function MapSelectionLayer({selection}: Props): React.ReactNode {
	let data = React.useMemo((): GeoJSON.FeatureCollection => {
		if (!selection) {
			return {type: 'FeatureCollection', features: []}
		}
		let features: GeoJSON.Feature[] = [
			{
				type: 'Feature',
				geometry: {type: 'Point', coordinates: selection.at},
				properties: {name: selection.name, dot: selection.lines === null},
			},
		]
		if (selection.lines) {
			features.push({
				type: 'Feature',
				geometry: {type: 'MultiLineString', coordinates: selection.lines},
				properties: {},
			})
		}
		return {type: 'FeatureCollection', features}
	}, [selection])

	return (
		<GeoJSONSource data={data} id="map-selection">
			<Layer
				filter={IS_LINE}
				id="map-selection-trail-casing"
				layout={{'line-cap': 'round', 'line-join': 'round'}}
				paint={{'line-color': c.white, 'line-width': TRAIL_CASING}}
				type="line"
			/>
			<Layer
				filter={IS_LINE}
				id="map-selection-trail"
				layout={{'line-cap': 'round', 'line-join': 'round'}}
				paint={{'line-color': c.gold, 'line-width': TRAIL_WIDTH}}
				type="line"
			/>
			<Layer
				filter={['==', ['get', 'dot'], true]}
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
			<Layer
				filter={['==', ['get', 'dot'], false]}
				id="map-selection-trail-name"
				layout={PIN_NAME_LAYOUT}
				paint={PIN_NAME_PAINT}
				type="symbol"
			/>
		</GeoJSONSource>
	)
}
