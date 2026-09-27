import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ColumnScreen} from '../../../source/features/mess/column-screen'

export default function MessengerColumnPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <ColumnScreen id={Number(id)} />
}
