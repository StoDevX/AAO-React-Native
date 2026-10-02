import * as React from 'react'
import {Slot} from 'expo-router'

/// Streams, Webcams, KSTO and KRLX are each their own home tile, so this
/// route shows one of them at a time and each titles the screen itself.
export default function StreamingMediaLayout(): React.ReactNode {
	return <Slot />
}
