import React from 'react'
import {ScrollView, View, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import {text} from '../../../../docs/legal.json'

const styles = StyleSheet.create({
	scroll: {
		backgroundColor: c.white,
		paddingHorizontal: 15,
	},
	view: {
		paddingVertical: 15,
	},
})

export let LegalView = (): JSX.Element => (
	<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scroll}>
		<View style={styles.view}>
			<Markdown source={text} />
		</View>
	</ScrollView>
)
