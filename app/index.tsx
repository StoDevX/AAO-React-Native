import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

export default function PlaceholderHome(): React.ReactElement {
	return (
		<View style={styles.container}>
			<Text accessibilityRole="header" style={styles.text}>
				expo-router shell — checkpoint 1
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
	text: {
		fontSize: 16,
	},
})
