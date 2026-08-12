import * as React from 'react'
import {Stack} from 'expo-router'
// Here rather than in the root layout: expo-router loads a route's module the
// first time that route renders, so the Mapbox SDK and its one bridge call to
// set the access token stay off the cold-start path for everyone who never
// opens the map. This layout mounts before the map screen it wraps.
import '../../../source/lib/mapbox'
import {MapSelectionProvider} from '../../../source/features/map/selection-context'

/// react-navigation's option types reach this project only through
/// expo-router, which does not re-export them, so borrow the one Stack.Screen
/// already declares.
type ScreenOptions = NonNullable<
	React.ComponentProps<typeof Stack.Screen>['options']
>

/// Half-height and full-height. `sheetLargestUndimmedDetentIndex: 'last'`
/// keeps the map behind the sheet undimmed -- and therefore interactive -- at
/// every detent, which is the whole point of presenting these as sheets rather
/// than as pushed screens.
const sheetOptions = {
	presentation: 'formSheet',
	sheetAllowedDetents: [0.5, 1],
	sheetCornerRadius: 16,
	sheetGrabberVisible: true,
	sheetLargestUndimmedDetentIndex: 'last',
} satisfies ScreenOptions

export default function MapLayout(): React.ReactNode {
	return (
		<MapSelectionProvider>
			{/* The map screen's own header comes from the (home) stack above this
			    one, so this stack contributes chrome only for the sheets. */}
			<Stack screenOptions={{headerShown: false}}>
				<Stack.Screen name="index" />
				{/* Both sheets keep a header: it carries the title and, on the
				    info card, the close button -- the native place for it, and
				    one less piece of chrome drawn by hand inside the content. */}
				<Stack.Screen
					name="BuildingPicker"
					options={{...sheetOptions, headerShown: true, title: 'Buildings'}}
				/>
				<Stack.Screen
					name="BuildingInfo"
					options={{...sheetOptions, headerShown: true}}
				/>
			</Stack>
		</MapSelectionProvider>
	)
}
