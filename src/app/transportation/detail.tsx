import * as React from 'react'
import {Stack} from 'expo-router'
import {BusRouteDetail} from '../../views/transportation/bus/detail'

export default function TransportationDetailRoute(): React.JSX.Element {
	return (
		<>
			<Stack.Screen options={{title: 'Bus Stop'}} />
			<BusRouteDetail />
		</>
	)
}
