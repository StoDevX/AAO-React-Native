import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ImageViewer} from '../../source/features/mess/image-viewer'
import {newspaperRoute} from '../../source/features/mess/newspaper-route'

function NewspaperImagePage(): React.ReactNode {
	let {id, index, url} = useLocalSearchParams<{id: string; index?: string; url?: string}>()
	// A comic or artwork has one picture and no index; a feature page names the picture tapped,
	// and a story's lead photo or a figure in its body names its address.
	return <ImageViewer id={Number(id)} index={index === undefined ? 0 : Number(index)} url={url} />
}

export default newspaperRoute(NewspaperImagePage)
