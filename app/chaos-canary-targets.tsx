import * as React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {Redirect} from 'expo-router'
import {isChaos} from '@frogpond/launch-arguments'

/**
 * One 20pt button with no label, for the chaos canary that proves the
 * unlabelled and small-target oracles can see. Sends anyone else home.
 */
export default function ChaosCanaryTargets(): React.ReactNode {
	if (!isChaos) {
		return <Redirect href="/" />
	}
	return (
		<View style={styles.screen}>
			<Pressable accessibilityRole="button" style={styles.button} testID="chaos.canary-target" />
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	button: {width: 20, height: 20, backgroundColor: 'gray'},
})
