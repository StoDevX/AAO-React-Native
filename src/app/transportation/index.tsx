import React from 'react'
import {BusView} from '../../views/transportation/bus/wrapper'

export default function TransportationTabExpressBus(): React.ReactNode {
	return (
		<>
			{/* <Stack.Screen
				options={{
					title: 'Transportation',
				}}
			/> */}
			<BusView line="Express Bus" />
		</>
	)
}
