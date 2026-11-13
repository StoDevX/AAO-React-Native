import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'

import {useCampus} from '../../../campus/store'
import {track} from '../../../telemetry/track'
import {stationsOffered} from '../stations'
import {useRadioStore} from '../store'
import {palette} from './palette'

/**
 * The stations as Material primary tabs, one per station, the one shown
 * underlined, as Android's media apps switch between sources. iOS uses a
 * segmented control.
 */
export function StationPicker(): React.ReactNode {
	let viewed = useRadioStore((state) => state.viewedStationId)
	let browse = useRadioStore((state) => state.browse)
	let stations = stationsOffered(useCampus())
	return (
		<View accessibilityRole="tablist" style={styles.tabs}>
			{stations.map(({id}) => {
				let selected = id === viewed
				return (
					<Pressable
						key={id}
						accessibilityRole="tab"
						accessibilityState={{selected}}
						android_ripple={{color: palette.track}}
						onPress={() => {
							track({name: 'radio.station.browse', attributes: {station: id}})
							browse(id)
						}}
						style={styles.tab}
					>
						<Text
							style={[styles.label, selected ? palette.styles.primary : palette.styles.secondary]}
						>
							{id.toUpperCase()}
						</Text>
						<View style={[styles.indicator, selected ? styles.indicatorOn : null]} />
					</Pressable>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	tabs: {
		alignSelf: 'stretch',
		flexDirection: 'row',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: palette.track,
	},
	tab: {flex: 1, height: 48, alignItems: 'center', justifyContent: 'flex-end', gap: 12},
	label: {fontSize: 14, fontWeight: '500', letterSpacing: 0.1},
	indicator: {width: 48, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3},
	indicatorOn: {backgroundColor: palette.primary},
})
