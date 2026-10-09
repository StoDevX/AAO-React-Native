import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {MESSENGER} from '../../source/campuses/edu-stolaf/paper'
import {ColumnScreen} from '../../source/features/mess/column-screen'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function MessengerColumnPage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return (
		<PaperProvider paper={MESSENGER}>
			<ColumnScreen id={Number(id)} />
		</PaperProvider>
	)
}
