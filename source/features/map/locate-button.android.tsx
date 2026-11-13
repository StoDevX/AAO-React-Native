import * as React from 'react'
import {PermissionsAndroid, StyleSheet, View} from 'react-native'
import {FloatingActionButton, Host, Icon} from '@expo/ui/jetpack-compose'
import {LocationManager} from '@maplibre/maplibre-react-native'
import * as c from '@frogpond/colors'

import type {LocateButtonProps} from './locate-button'
import myLocationIcon from '@expo/material-symbols/my_location.xml'

export type {LocateButtonProps}

/** The gap between the button and the sheet's top. */
const MARGIN = 16

/**
 * Android's my-location button: a Material floating action button above the
 * map's sheet, at the end, as Google Maps places it. It asks for location
 * permission when first pressed, then moves the map to the reader. Hidden
 * while the sheet is up so far it would sit over the search bar.
 */
export function LocateButton({sheetHeight, onLocate}: LocateButtonProps): React.ReactNode {
	let locate = async () => {
		if (!(await requestLocation())) {
			return
		}
		let position = await LocationManager.getCurrentPosition()
		if (position) {
			onLocate(position.coords.longitude, position.coords.latitude)
		}
	}

	return (
		<View pointerEvents="box-none" style={[styles.anchor, {bottom: sheetHeight + MARGIN}]}>
			<Host matchContents={true}>
				<FloatingActionButton
					containerColor={c.tertiarySystemGroupedBackground}
					onClick={() => {
						locate().catch((error: unknown) => console.warn('could not locate', error))
					}}
				>
					<FloatingActionButton.Icon>
						<Icon contentDescription="Show my location" source={myLocationIcon} />
					</FloatingActionButton.Icon>
				</FloatingActionButton>
			</Host>
		</View>
	)
}

/**
 * Asks for location, and says whether any was granted. Android 12 and later
 * let the reader choose Approximate, which grants coarse location alone, and
 * that is enough to find someone on a campus map. MapLibre's own
 * `requestPermissions` counts only a grant of both as a yes.
 */
async function requestLocation(): Promise<boolean> {
	let {ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION} = PermissionsAndroid.PERMISSIONS
	let result = await PermissionsAndroid.requestMultiple([
		ACCESS_FINE_LOCATION,
		ACCESS_COARSE_LOCATION,
	])
	return Object.values(result).some((answer) => answer === PermissionsAndroid.RESULTS.GRANTED)
}

const styles = StyleSheet.create({
	anchor: {position: 'absolute', right: 16},
})
