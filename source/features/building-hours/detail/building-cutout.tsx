import * as React from 'react'
import {StyleSheet, useColorScheme, View} from 'react-native'
import {RNHostView} from '@expo/ui/swift-ui'
import {Camera, GeoJSONSource, Layer, Map} from '@maplibre/maplibre-react-native'
import * as c from '@frogpond/colors'
import {toBuildingFootprints} from '../../map/lib/building-footprints'
import {cutoutBounds} from '../../map/lib/cutout-bounds'
import type {Building, Feature} from '../../map/types'
import {basemapScheme, mapStyleUrl} from '../../map/urls'
import type {Campus} from '../types'
import {PICTURE_CORNER_RADIUS} from '../../../components/place-card/card-style'

/** How tall the cutout draws. */
const CUTOUT_HEIGHT = 160
/**
 * Both campuses' styles ship the same Noto Sans stacks, so one font name works
 * against either glyph endpoint.
 */
const LABEL_FONT = ['Noto Sans Medium']
/**
 * The St. Olaf basemap's building-name layer. Carleton's style has no layer by
 * this id.
 */
const STOLAF_BUILDING_LABELS = 'campus_labels_buildings'
/**
 * The framed building's name, drawn to read against each basemap appearance:
 * dark on a white halo over the light basemap, light on a dark halo over the
 * dark one.
 *
 * Literal colours, not PlatformColor: MapLibre's paint spec takes style-spec
 * strings and cannot resolve a dynamic system colour. Keyed by the basemap's
 * appearance rather than the system's, because Carleton's basemap stays light
 * in dark mode.
 */
const LABEL_PAINT = {
	light: {
		'text-color': 'rgb(28, 28, 30)',
		'text-halo-color': 'rgb(255, 255, 255)',
		'text-halo-width': 1.5,
	},
	dark: {
		'text-color': 'rgb(242, 242, 247)',
		'text-halo-color': 'rgb(28, 28, 30)',
		'text-halo-width': 1.5,
	},
} as const
/** Points of breathing room around the framed building, so its footprint
 * doesn't run flush against the cutout's edges. */
const CUTOUT_PADDING = 32

type Props = {
	campus: Campus
	feature: Feature<Building>
	/// How wide the cutout draws. A width of 100% would resolve against the
	/// whole sheet rather than the inset row the cutout sits in.
	width: number
}

/**
 * A small, non-interactive map framed on the venue's own building -- "where
 * this is," not decoration. No logo, no attribution link, no user location,
 * and every touch gesture is off: the sheet's own drag and the list's own
 * scroll have to reach past it undisturbed, and there is nothing here for a
 * tap to do.
 *
 * Renders `null` when there is nothing to frame, which `cutoutBounds` signals
 * by returning `undefined`, and until `width` is known.
 */
export function BuildingCutout({campus, feature, width}: Props): React.ReactNode {
	let scheme = useColorScheme()

	// Framed on the same geometry the layers below draw, so the two cannot
	// disagree. Callers are expected to have checked `hasFootprint` already --
	// this guard is the belt to that braces, and keeps the component honest on
	// its own.
	let bounds = cutoutBounds(feature)
	if (!bounds) {
		return null
	}

	// MapLibre fits the camera to `bounds` once, on the map's first layout, and
	// never again. Mounted before its row reports a width, the map fits the
	// building into zero points and stays at zoom 0 -- a map of the world.
	if (width <= 0) {
		return null
	}

	let footprints = toBuildingFootprints([feature])

	return (
		<RNHostView matchContents={true}>
			{/* Rounded here: SwiftUI cannot clip a hosted native view. */}
			<View style={[styles.frame, {width}]}>
				<Map
					accessibilityLabel={`Map showing ${feature.properties.name}`}
					accessibilityRole="image"
					attribution={false}
					compass={false}
					doubleTapHoldZoom={false}
					doubleTapZoom={false}
					dragPan={false}
					logo={false}
					mapStyle={mapStyleUrl(campus, scheme)}
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

					{/* A Layer whose id the style already has adopts that layer, and
					    its filter replaces the style's own. This one keeps the style's
					    `kind` match and drops the framed building, whose name the label
					    below draws instead. Every St. Olaf label carries `buildingId`,
					    the same id as `feature`. */}
					{campus === 'stolaf' ? (
						<Layer
							filter={[
								'all',
								['match', ['get', 'kind'], ['building'], true, false],
								['!=', ['get', 'buildingId'], feature.id],
							]}
							id={STOLAF_BUILDING_LABELS}
							type="symbol"
						/>
					) : null}

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
							paint={LABEL_PAINT[basemapScheme(campus, scheme)]}
							type="symbol"
						/>
					</GeoJSONSource>
				</Map>
			</View>
		</RNHostView>
	)
}

const styles = StyleSheet.create({
	frame: {
		height: CUTOUT_HEIGHT,
		borderRadius: PICTURE_CORNER_RADIUS,
		overflow: 'hidden',
	},
	map: {
		width: '100%',
		height: '100%',
	},
})
