// @flow

import * as React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import {TabBarIcon} from '@frogpond/navigation-tabs'

export default function WeeklyMovieView() {
	return (
		<View style={styles.container}>
			<Text>Movie</Text>
		</View>
	)
}
WeeklyMovieView.navigationOptions = {
	tabBarLabel: 'Weekly Movie',
	tabBarIcon: TabBarIcon('film'),
}

let styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
