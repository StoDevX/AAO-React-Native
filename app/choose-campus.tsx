import * as React from 'react'
import {Host, List, Button} from '@expo/ui/swift-ui'
import {Stack} from 'expo-router'

import {CAMPUSES} from '../source/campuses'
import {useCampusStore} from '../source/features/campus/store'
import {track} from '../source/features/telemetry/track'

/** Asks which campus the app is for, in a build with no default and nothing saved. */
export function CampusPicker(): React.ReactNode {
	let setCampus = useCampusStore((state) => state.setCampus)
	return (
		<Host style={{flex: 1}}>
			<List>
				{CAMPUSES.map((campus) => (
					<Button
						key={campus.id}
						label={campus.name}
						onPress={() => {
							track({name: 'campus.picked', attributes: {campus: campus.id}})
							setCampus(campus.id)
						}}
					/>
				))}
			</List>
		</Host>
	)
}

export default function ChooseCampusScreen(): React.ReactNode {
	return (
		<>
			<Stack.Title>Choose Your Campus</Stack.Title>
			<CampusPicker />
		</>
	)
}
