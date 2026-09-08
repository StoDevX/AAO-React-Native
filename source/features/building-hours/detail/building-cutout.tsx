import * as React from 'react'
import {StyleSheet} from 'react-native'
import {RNHostView} from '@expo/ui/swift-ui'
import {Camera, GeoJSONSource, Layer, Map} from '@maplibre/maplibre-react-native'
import * as c from '@frogpond/colors'
import {toBuildingFootprints} from '../../map/lib/building-footprints'
import {featureBounds} from '../../map/lib/feature-bounds'
import type {Building, Feature} from '../../map/types'
import {mapStyleUrl} from '../../map/urls'
import type {Campus} from '../query'

/** How tall the cutout draws. */
const CUTOUT_HEIGHT = 160
/**
 * Both campuses' styles ship the same Noto Sans stacks, so one font name works
 * against either glyph endpoint.
 */
const LABEL_FONT = ['Noto Sans Medium']
/** Points of breathing room around the framed building, so its footprint
 * doesn't run flush against the cutout's edges. */
const CUTOUT_PADDING = 32

type Props = {
	campus: Campus
	feature: Feature<Building>
}

/**
 * A small, non-interactive map framed on the venue's own building -- "where
 * this is," not decoration. No logo, no attribution link, no user location,
 * and every touch gesture is off: the sheet's own drag and the list's own
 * scroll have to reach past it undisturbed, and there is nothing here for a
 * tap to do.
 *
 * Renders `null` when the feature carries no coordinates at all, which
 * `featureBounds` signals by returning `undefined`.
 */
export function BuildingCutout({campus, feature}: Props): React.ReactNode {
	// Framed on the same geometry the layers below draw, so the two cannot
	// disagree. Callers are expected to have checked `hasFootprint` already --
	// this guard is the belt to that braces, and keeps the component honest on
	// its own.
	let footprints = toBuildingFootprints([feature])
	let bounds = footprints.features.length > 0 ? featureBounds(feature) : undefined
	if (!bounds) {
		return null
	}

	return (
		<RNHostView matchContents={true}>
			<Map
				accessibilityLabel={`Map showing ${feature.properties.name}`}
				accessibilityRole="image"
				attribution={false}
				compass={false}
				doubleTapHoldZoom={false}
				doubleTapZoom={false}
				dragPan={false}
				logo={false}
				mapStyle={mapStyleUrl(campus)}
				scaleBar={false}
				style={styles.map}
				touchPitch={false}
				touchRotate={false}
				touchZoom={false}
			>
				<Camera
					initialViewState={{
						bounds,
						padding: {
							top: CUTOUT_PADDING,
							right: CUTOUT_PADDING,
							bottom: CUTOUT_PADDING,
							left: CUTOUT_PADDING,
						},
					}}
				/>

				{/* The basemap names whichever buildings its own collision rules
				    allow, which at this zoom is usually the neighbours and not the
				    one being framed. Drawing this building's own outline and name
				    puts the subject beyond doubt: `text-allow-overlap` and
				    `text-ignore-placement` keep the label from being dropped in
				    favour of a neighbour's. */}
				<GeoJSONSource data={footprints} id="cutout-building">
					<Layer
						id="cutout-building-fill"
						paint={{'fill-color': c.gold, 'fill-opacity': 0.35}}
						type="fill"
					/>
					<Layer
						id="cutout-building-outline"
						paint={{'line-color': c.gold, 'line-width': 2}}
						type="line"
					/>
					<Layer
						id="cutout-building-label"
						layout={{
							'text-allow-overlap': true,
							'text-field': ['get', 'name'],
							'text-font': LABEL_FONT,
							'text-ignore-placement': true,
							'text-size': 13,
						}}
						// Literal colours, not PlatformColor: MapLibre's paint spec takes
						// style-spec strings and cannot resolve a dynamic system colour.
						// Both campuses' basemaps are light, so dark-on-white reads in
						// either appearance.
						paint={{
							'text-color': 'rgb(28, 28, 30)',
							'text-halo-color': 'rgb(255, 255, 255)',
							'text-halo-width': 1.5,
						}}
						type="symbol"
					/>
				</GeoJSONSource>
			</Map>
		</RNHostView>
	)
}

const styles = StyleSheet.create({
	map: {
		width: '100%',
		height: CUTOUT_HEIGHT,
	},
})
