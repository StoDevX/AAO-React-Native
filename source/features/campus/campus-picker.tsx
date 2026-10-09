import * as React from 'react'
import {Host, List, Button} from '@expo/ui/swift-ui'

import {CAMPUSES} from '../../campuses'
import {track} from '../telemetry/track'
import {useCampusStore} from './store'

/**
 * Asks which campus the app is for, in a build with no default and nothing
 * saved. The root layout shows it in place of the stack; it has no route of
 * its own, so no link can switch an installed app's campus.
 */
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
