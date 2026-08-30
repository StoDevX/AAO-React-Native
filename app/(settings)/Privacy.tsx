import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'
import {ScrollView, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import privacyData from '../../docs/privacy.json'

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: c.systemBackground,
		paddingHorizontal: 15,
		paddingVertical: 15,
	},
})

export default function PrivacyPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Privacy</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
				<Markdown source={privacyData.text} />
			</ScrollView>
		</>
	)
}
