import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ColumnScreen} from '../../source/features/mess/column-screen'
import {newspaperRoute} from '../../source/features/mess/newspaper-route'

function NewspaperColumnPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <ColumnScreen id={Number(id)} />
}

export default newspaperRoute(NewspaperColumnPage)
