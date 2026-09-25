import * as React from 'react'
import {Image, StyleSheet} from 'react-native'
import {RNHostView, VStack} from '@expo/ui/swift-ui'
import {frame} from '@expo/ui/swift-ui/modifiers'

type Props = {
	url: string
	/** The frame, in points */
	width: number
	height: number
	/** Draws a circle, for a writer's photo */
	round?: boolean
}

/**
 * A photo from the web. `@expo/ui` has no image that loads a URL, so this is
 * a React Native image hosted in a fixed frame; the frame keeps the layout
 * still while it loads.
 */
export function RemotePhoto({url, width, height, round = false}: Props): React.ReactNode {
	return (
		<VStack modifiers={[frame({width, height})]}>
			<RNHostView matchContents={false}>
				<Image
					accessibilityIgnoresInvertColors={true}
					source={{uri: url}}
					style={[{width, height}, round ? {borderRadius: width / 2} : styles.square]}
				/>
			</RNHostView>
		</VStack>
	)
}

const styles = StyleSheet.create({
	square: {borderRadius: 2},
})
