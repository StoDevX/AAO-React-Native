import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {ImageViewer} from '../../../source/features/mess/image-viewer'

export default function MessengerImagePage(): React.ReactNode {
	let {id} = useLocalSearchParams<{id: string}>()
	return <ImageViewer id={Number(id)} />
}
