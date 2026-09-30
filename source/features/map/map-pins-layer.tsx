import * as React from 'react'
import type {NativeSyntheticEvent} from 'react-native'
import {
	GeoJSONSource,
	Images,
	Layer,
	type GeoJSONSourceRef,
	type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native'
import * as c from '@frogpond/colors'

import pinImage from '../../../images/map/pin.png'
import {pinCollection, pinIds, pressedPin, type MapPins} from './lib/map-pins'

/// More than any cluster on either campus holds, so one call returns them all.
const CLUSTER_LEAF_LIMIT = 1000

/// A white disc drawn as a signed distance field (images/map/pin.png), so it
/// can be tinted each group's color and ringed with a halo.
const PIN_IMAGE = 'map-pin'
/// Drawn at its own size -- a 16pt dot in a 32pt square -- since MapLibre
/// scales an SDF's halo with the icon, and a shrunk image rings its whole
/// square white.
const PIN_ICON_SIZE = 1
/// The white ring around the dot.
const PIN_RING = 2
const CLUSTER_RADIUS = 14
const PIN_STROKE = 2
/// Both campuses' styles serve Noto Sans and nothing else. Left unset, a text
/// layer asks for MapLibre's default font stack, whose glyphs 404 -- and the
/// source's tiles then never finish, so the pins vanish with their names.
const PIN_FONT = ['Noto Sans Medium']
/// A pin's name in the base map's own label colors -- dark text on a light
/// halo -- rather than the group's color, which is too light to read on the
/// map's tan. The dot carries the group's color.
const PIN_TEXT_COLOR = '#2f2a24'
const PIN_TEXT_HALO = '#f4f1e9'
const PIN_TEXT_HALO_WIDTH = 1.2

type Props = {
	pins: MapPins | null
	onSelect: (id: string) => void
	/// A cluster was tapped: the places it holds, for the screen to frame.
	/// The camera, and the sheet it has to stay clear of, are the screen's.
	onCluster: (ids: string[]) => void
}

/// The places the sheet is listing, as pins; close ones merge into a numbered
/// cluster, as in Maps. A pin opens its place; a cluster is framed until it
/// splits.
export function MapPinsLayer({pins, onSelect, onCluster}: Props): React.ReactNode {
	let sourceRef = React.useRef<GeoJSONSourceRef>(null)
	let data = React.useMemo(() => pinCollection(pins?.places ?? []), [pins])

	let handlePress = React.useCallback(
		async (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
			let {features, lngLat} = event.nativeEvent
			let press = pressedPin(features, [lngLat[0], lngLat[1]])
			if (press?.kind === 'pin') {
				onSelect(press.buildingId)
			} else if (press?.kind === 'cluster') {
				let leaves = await sourceRef.current?.getClusterLeaves(
					press.clusterId,
					CLUSTER_LEAF_LIMIT,
					0,
				)
				if (leaves) {
					onCluster(pinIds(leaves))
				}
			}
		},
		[onSelect, onCluster],
	)

	if (!pins) {
		return null
	}

	return (
		<>
			<Images images={{[PIN_IMAGE]: {source: pinImage, sdf: true}}} />
			<GeoJSONSource
				cluster={true}
				data={data}
				id="map-pins"
				onPress={(event) => {
					// A pin wins the tap outright: the map's own handler would look
					// for a place's name under it and open that as well.
					event.stopPropagation()
					void handlePress(event)
				}}
				ref={sourceRef}
			>
				<Layer
					filter={['has', 'point_count']}
					id="map-pins-clusters"
					paint={{
						'circle-color': pins.color,
						'circle-radius': CLUSTER_RADIUS,
						'circle-stroke-color': c.white,
						'circle-stroke-width': PIN_STROKE,
					}}
					type="circle"
				/>
				<Layer
					filter={['has', 'point_count']}
					id="map-pins-cluster-counts"
					layout={{
						'text-field': ['get', 'point_count_abbreviated'],
						'text-font': PIN_FONT,
						'text-size': 13,
					}}
					paint={{'text-color': c.white}}
					type="symbol"
				/>
				{/* One symbol for a place's dot and its name, rather than a circle and
			    a separate label, so the two are placed together. As symbols they
			    take part in label placement, and being above the base map they
			    are placed first: the base map's own label for a pinned place
			    yields, rather than drawing underneath the dot beside a second
			    copy of the name. */}
				<Layer
					filter={['!', ['has', 'point_count']]}
					id="map-pins-points"
					layout={{
						'icon-image': PIN_IMAGE,
						'icon-size': PIN_ICON_SIZE,
						// A pin always draws, even over another; it still claims its
						// space, which is what hides the base map's label there.
						'icon-allow-overlap': true,
						'text-field': ['get', 'name'],
						'text-font': PIN_FONT,
						'text-size': 12,
						'text-offset': [0, 0.9],
						'text-anchor': 'top',
						// Where two pins crowd each other, a name drops, not a pin.
						'text-optional': true,
					}}
					paint={{
						'icon-color': pins.color,
						'icon-halo-color': c.white,
						'icon-halo-width': PIN_RING,
						'text-color': PIN_TEXT_COLOR,
						'text-halo-color': PIN_TEXT_HALO,
						'text-halo-width': PIN_TEXT_HALO_WIDTH,
					}}
					type="symbol"
				/>
			</GeoJSONSource>
		</>
	)
}
