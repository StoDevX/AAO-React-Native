import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {MESSENGER} from '../../source/campuses/edu-stolaf/paper'
import {ImageViewer} from '../../source/features/mess/image-viewer'
import {PaperProvider} from '../../source/features/mess/paper-context'

export default function MessengerImagePage(): React.ReactNode {
	let {id, index, url} = useLocalSearchParams<{id: string; index?: string; url?: string}>()
	// A comic or artwork has one picture and no index; a feature page names the picture tapped,
	// and a story's lead photo or a figure in its body names its address.
	return (
		<PaperProvider paper={MESSENGER}>
			<ImageViewer id={Number(id)} index={index === undefined ? 0 : Number(index)} url={url} />
		</PaperProvider>
	)
}
