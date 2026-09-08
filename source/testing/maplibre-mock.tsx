import * as React from 'react'
import {View, type ViewProps} from 'react-native'

/// `@maplibre/maplibre-react-native` bridges to a native MapLibre view through
/// a TurboModule, which does not exist in the Jest runtime -- importing the
/// real module throws before a single test runs. This stand-in renders `Map`
/// as a plain `View` carrying the props a test can assert on (its
/// accessibility label, in particular), and skips `Camera` and `Layer`
/// entirely: neither draws anything a Jest tree can observe.
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

/// Renders its children so a test can still reach whatever the source wraps.
/// The GeoJSON it carries is data, and belongs to `toBuildingFootprints`' own
/// tests rather than to a render assertion here.
export function GeoJSONSource({children}: {children?: React.ReactNode}): React.ReactNode {
	return <>{children}</>
}

/// A layer's whole job is paint and layout the renderer applies. There is
/// nothing here Jest could assert that would not just be reading back the
/// props we passed.
export function Layer(): React.ReactNode {
	return null
}
