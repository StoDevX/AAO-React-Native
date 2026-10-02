import * as React from 'react'
import {Stack} from 'expo-router'
import {ScrollView, StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
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
	return (
		<>
			<Stack.Title>Privacy</Stack.Title>

			<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
				<SafeAreaView edges={['left', 'right']}>
					<Markdown source={privacyData.text} />
				</SafeAreaView>
			</ScrollView>
		</>
	)
}
