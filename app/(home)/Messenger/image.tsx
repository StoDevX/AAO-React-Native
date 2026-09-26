import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ImageViewer} from '../../../source/features/mess/image-viewer'

export default function MessengerImagePage(): React.ReactNode {
	let {id, index} = useLocalSearchParams<{id: string; index?: string}>()
	// A comic or artwork has one picture and no index; a feature page names the picture tapped.
	return <ImageViewer id={Number(id)} index={index === undefined ? 0 : Number(index)} />
}
