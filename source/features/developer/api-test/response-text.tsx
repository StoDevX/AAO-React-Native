import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {ColorValue} from 'react-native'
import {Host, ScrollView, Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, frame, padding, textSelection} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

type Props = {
	/** A line over the body in its own colour, such as an error status. */
	heading?: {text: string; color: ColorValue}
	body: string
}

/**
 * A response body that is not JSON, in selectable monospaced text. Drawn in
 * SwiftUI so it takes the label colour: a React Native text input draws black
 * whatever the appearance, which is unreadable on the dark-mode background.
 */
export function ResponseText({heading, body}: Props): React.ReactNode {
	return (
		<Host style={styles.host}>
			<ScrollView>
				<VStack
					alignment="leading"
					modifiers={[frame({maxWidth: Infinity, alignment: 'leading'}), padding({all: 16})]}
					spacing={12}
				>
					{heading ? (
						<Text
							modifiers={[
								font({textStyle: 'headline', design: 'monospaced'}),
								foregroundStyle(heading.color),
							]}
						>
							{heading.text}
						</Text>
					) : null}
					{body ? (
						<Text
							modifiers={[
								font({textStyle: 'footnote', design: 'monospaced'}),
								foregroundStyle(c.label),
								textSelection(true),
							]}
						>
							{body}
						</Text>
					) : null}
				</VStack>
			</ScrollView>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
})
