import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host} from '@expo/ui/swift-ui'

/**
 * Holds a SwiftUI sheet in a React Native tree. It has nothing to see or
 * touch of its own, so it takes no room and no touches until the sheet is
 * presented.
 */
export function SheetHost({children}: {children: React.ReactNode}): React.ReactNode {
	return (
		<Host pointerEvents="none" style={styles.host}>
			{children}
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {position: 'absolute', width: 0, height: 0},
})
