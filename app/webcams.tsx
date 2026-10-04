import * as React from 'react'
import {Stack} from 'expo-router'

import WebcamsPage from './streaming-media/webcams'

/// The webcams on a screen of their own, for the grouped home, where each of
/// Streams and Webcams is a tile rather than a tab.
export default function WebcamsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Title>Webcams</Stack.Title>
			<WebcamsPage />
		</>
	)
}
