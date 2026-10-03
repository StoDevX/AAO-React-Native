import * as React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {Host, HStack, List, RNHostView, Spacer, Text} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

interface WrapperProps {
	children: React.ReactNode
}

interface RowProps {
	title: string
	children: React.ReactNode
	contentContainerStyle?: StyleProp<ViewStyle>
}

/** The grouped list every component-library screen is drawn inside. */
export const LibraryWrapper = ({children}: WrapperProps): React.ReactNode => (
	<Host style={styles.host}>
		<List modifiers={[listStyle('insetGrouped')]}>{children}</List>
	</Host>
)

/**
 * One example: what it is on the left, the component itself on the right.
 *
 * Everything these screens demonstrate is a React Native component, so the
 * example is hosted rather than drawn by SwiftUI. `matchContents` lets each one
 * report its own size, since a badge, a button and a colour swatch have nothing
 * in common to state up front.
 */
export const Example = ({title, children, contentContainerStyle}: RowProps): React.ReactNode => (
	<HStack spacing={12}>
		<Text>{title}</Text>
		<Spacer />
		{/* One View, because RNHostView hosts exactly one element -- and it is
		    where `contentContainerStyle` lands, since RNHostView takes no style
		    of its own. */}
		<RNHostView matchContents={true}>
			<View style={contentContainerStyle}>{children}</View>
		</RNHostView>
	</HStack>
)

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
