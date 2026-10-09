import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ColumnScreen} from '../../source/features/mess/column-screen'
import {CARLETONIAN} from '../../source/campuses/edu-carleton/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function CarletonianColumnPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return (
		<PaperProvider paper={CARLETONIAN}>
			<ColumnScreen id={Number(id)} />
		</PaperProvider>
	)
}
