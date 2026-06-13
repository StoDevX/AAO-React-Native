import * as React from 'react'
import {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {
	SegmentedSwitcher,
	SwitcherSegment,
} from '../../components/segmented-switcher'
import {KstoStationView} from '../streaming/radio/station-ksto'
import {KrlxStationView} from '../streaming/radio/station-krlx'

type Station = 'ksto' | 'krlx'

const SEGMENTS: ReadonlyArray<SwitcherSegment<Station>> = [
	{value: 'ksto', label: 'KSTO'},
	{value: 'krlx', label: 'KRLX'},
]

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	player: {
		flex: 1,
	},
})

export function RadioView(): React.ReactNode {
	let [station, setStation] = useState<Station>('ksto')

	return (
		<View style={styles.container}>
			<SegmentedSwitcher
				onChange={setStation}
				segments={SEGMENTS}
				value={station}
			/>
			<View style={styles.player}>
				{station === 'ksto' ? <KstoStationView /> : <KrlxStationView />}
			</View>
		</View>
	)
}

export {RadioView as View}

export const NavigationKey = 'Radio'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Radio',
}
