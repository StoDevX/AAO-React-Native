import * as React from 'react'
import {useState} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {KstoStationView} from '../streaming/radio/station-ksto'
import {KrlxStationView} from '../streaming/radio/station-krlx'

type Station = 'ksto' | 'krlx'

const STATIONS: Station[] = ['ksto', 'krlx']

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
	segment: {
		flexDirection: 'row',
		margin: 12,
		borderRadius: 9,
		backgroundColor: c.secondarySystemFill,
		padding: 2,
	},
	segmentButton: {
		flex: 1,
		paddingVertical: 7,
		borderRadius: 7,
		alignItems: 'center',
	},
	segmentButtonActive: {
		backgroundColor: c.systemBackground,
	},
	segmentLabel: {
		fontSize: 15,
		fontWeight: '600',
		color: c.label,
	},
	player: {
		flex: 1,
	},
})

export function RadioView(): React.ReactNode {
	let [station, setStation] = useState<Station>('ksto')

	return (
		<View style={styles.container}>
			<View accessibilityRole="tablist" style={styles.segment}>
				{STATIONS.map((id) => (
					<Touchable
						key={id}
						accessibilityLabel={id.toUpperCase()}
						accessibilityRole="tab"
						accessibilityState={{selected: station === id}}
						highlight={false}
						onPress={() => setStation(id)}
						style={[
							styles.segmentButton,
							station === id && styles.segmentButtonActive,
						]}
					>
						<Text style={styles.segmentLabel}>{id.toUpperCase()}</Text>
					</Touchable>
				))}
			</View>
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
