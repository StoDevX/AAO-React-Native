import * as React from 'react'
import {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {
	SegmentedSwitcher,
	SwitcherSegment,
} from '../../components/segmented-switcher'
import {OtherModesView} from './other-modes'
import {BusView} from './bus'

type TransportMode =
	| 'Express Bus'
	| 'Red Line'
	| 'Blue Line'
	| 'Oles Go'
	| 'other'

const SEGMENTS: ReadonlyArray<SwitcherSegment<TransportMode>> = [
	{value: 'Express Bus', label: 'Express Bus'},
	{value: 'Red Line', label: 'Red Line'},
	{value: 'Blue Line', label: 'Blue Line'},
	{value: 'Oles Go', label: 'Oles Go'},
	{value: 'other', label: 'Other Modes'},
]

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	mode: {
		flex: 1,
	},
})

function SelectedMode({mode}: {mode: TransportMode}): React.ReactNode {
	if (mode === 'other') {
		return <OtherModesView />
	}
	return <BusView line={mode} />
}

function TransportationView(): React.ReactNode {
	let [mode, setMode] = useState<TransportMode>('Express Bus')

	return (
		<View style={styles.container}>
			<SegmentedSwitcher
				onChange={setMode}
				scrollable={true}
				segments={SEGMENTS}
				value={mode}
			/>
			<View style={styles.mode}>
				<SelectedMode mode={mode} />
			</View>
		</View>
	)
}

export {TransportationView as View}

export type NavigationParams = undefined
export const NavigationKey = 'Transportation'
export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Transportation',
}
