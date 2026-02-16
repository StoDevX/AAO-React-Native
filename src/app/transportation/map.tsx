import * as React from 'react'
import {Stack} from 'expo-router'
import {BusMap} from '../../views/transportation/bus/map'

export default function TransportationMapRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Bus Map'}} />
			<BusMap />
		</>
	)
}
