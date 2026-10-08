import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ColumnScreen} from '../../source/features/mess/column-screen'
import {CARLETONIAN_PAPER} from '../../source/features/mess/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function CarletonianColumnPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return (
		<PaperProvider paper={CARLETONIAN_PAPER}>
			<ColumnScreen id={Number(id)} />
		</PaperProvider>
	)
}
