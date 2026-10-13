import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ColumnScreen} from '../../source/features/newspaper/column-screen'
import {newspaperRoute} from '../../source/features/newspaper/newspaper-route'

function NewspaperColumnPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <ColumnScreen id={Number(id)} />
}

export default newspaperRoute(NewspaperColumnPage)
