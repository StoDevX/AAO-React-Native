import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ImageViewer} from '../../source/features/mess/image-viewer'
import {CARLETONIAN} from '../../source/campuses/edu-carleton/paper'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function CarletonianImagePage(): React.ReactNode {
	let {id, index, url} = useLocalSearchParams<{id: string; index?: string; url?: string}>()
	return (
		<PaperProvider paper={CARLETONIAN}>
			<ImageViewer id={Number(id)} index={index === undefined ? 0 : Number(index)} url={url} />
		</PaperProvider>
	)
}
