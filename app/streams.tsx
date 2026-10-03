import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {Stack} from 'expo-router'

import StreamingPage from './streaming-media/index'
import {NOW_PLAYING_BAR_CLEARANCE, RadioNowPlayingBar} from '../source/features/streaming/radio'

/// The streams on a screen of their own, for the grouped home, where each of
/// Streams and Webcams is a tile rather than a tab. The radio's player lives
/// on a tab bar here, so without one it is drawn along the bottom, always: this
/// is the radio's home, and Home's bar can be switched off.
export default function StreamsScreen(): React.ReactNode {
	return (
		<>
			<Stack.Title>Streams</Stack.Title>
			<View style={styles.content}>
				<StreamingPage />
			</View>
			<RadioNowPlayingBar alwaysVisible={true} />
		</>
	)
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingBottom: NOW_PLAYING_BAR_CLEARANCE,
	},
})
