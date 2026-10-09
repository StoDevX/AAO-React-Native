import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, Picker, Text} from '@expo/ui/swift-ui'
import {pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'

import {track} from '../../../telemetry/track'
import {STATION_LIST, STATIONS, type StationId} from '../stations'
import {useRadioStore} from '../store'

const ORDER: StationId[] = STATION_LIST.map((station) => station.id)

/** Which station the player shows. Browsing only: it never changes what plays. */
export function StationPicker(): React.ReactNode {
	let viewed = useRadioStore((state) => state.viewedStationId)
	let browse = useRadioStore((state) => state.browse)
	return (
		// Sized by React Native across, and by the picker's own height down.
		<Host matchContents={{vertical: true}} style={styles.host}>
			<Picker
				label="Station"
				modifiers={[pickerStyle('segmented')]}
				onSelectionChange={(selection) => {
					track({name: 'radio.station.browse', attributes: {station: selection as StationId}})
					browse(selection as StationId)
				}}
				selection={viewed}
			>
				{ORDER.map((id) => (
					<Text key={id} modifiers={[tag(id)]}>
						{STATIONS[id].id.toUpperCase()}
					</Text>
				))}
			</Picker>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		alignSelf: 'stretch',
	},
})
