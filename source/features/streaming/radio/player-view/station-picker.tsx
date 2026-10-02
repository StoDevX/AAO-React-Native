import * as React from 'react'
import {Picker, Text} from '@expo/ui/swift-ui'
import {pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'

import {STATIONS, type StationId} from '../stations'
import {useRadioStore} from '../store'

const ORDER: StationId[] = ['ksto', 'krlx']

/** Which station the player shows. Browsing only: it never changes what plays. */
export function StationPicker(): React.ReactNode {
	let viewed = useRadioStore((state) => state.viewedStationId)
	let browse = useRadioStore((state) => state.browse)
	return (
		<Picker
			label="Station"
			modifiers={[pickerStyle('segmented')]}
			onSelectionChange={(selection) => browse(selection as StationId)}
			selection={viewed}
		>
			{ORDER.map((id) => (
				<Text key={id} modifiers={[tag(id)]}>
					{STATIONS[id].id.toUpperCase()}
				</Text>
			))}
		</Picker>
	)
}
