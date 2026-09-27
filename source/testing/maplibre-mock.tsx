import * as React from 'react'
import {View, type ViewProps} from 'react-native'

/// `@maplibre/maplibre-react-native` bridges to a native MapLibre view through
/// a TurboModule, which does not exist in the Jest runtime -- importing the
/// real module throws before a single test runs. This stand-in renders `Map`
/// as a plain `View` carrying the props a test can assert on (its
/// accessibility label, in particular), skips `Camera` entirely, and leaves
/// each `Layer` as an empty marker.
///
/// Deliberately narrow: it covers what `BuildingCutout` imports and nothing
/// else, rather than pretending to be the whole module.

type MapProps = Pick<ViewProps, 'accessibilityLabel' | 'accessibilityRole' | 'style' | 'testID'> & {
	children?: React.ReactNode
}

export function Map({children, ...viewProps}: MapProps): React.ReactNode {
	return <View {...viewProps}>{children}</View>
}

export function Camera(): React.ReactNode {
	return null
}

/// Draws nothing, like the layers it wraps. The GeoJSON it carries is data,
/// and belongs to `toBuildingFootprints`' own tests rather than to a render
/// assertion here.
export function GeoJSONSource(): React.ReactNode {
	return null
}

/// A layer's paint and layout are the renderer's to apply, and nothing Jest
/// could assert about them would be more than the props we passed. Whether a
/// layer is there at all is a decision, though, so each draws an empty view a
/// test can find by `layer:<id>`.
export function Layer({id}: {id: string}): React.ReactNode {
	return <View testID={`layer:${id}`} />
}
