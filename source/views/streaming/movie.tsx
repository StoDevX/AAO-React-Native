import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

export function WeeklyMovieView(): JSX.Element {
	return (
		<View style={styles.container}>
			<Text>Movie</Text>
		</View>
	)
}

let styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
