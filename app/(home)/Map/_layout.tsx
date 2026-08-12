import * as React from 'react'
import {Stack} from 'expo-router'
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
				<Stack.Screen
					name="BuildingPicker"
					options={{...sheetOptions, headerShown: true, title: 'Buildings'}}
				/>
				<Stack.Screen name="BuildingInfo" options={sheetOptions} />
			</Stack>
		</MapSelectionProvider>
	)
}
