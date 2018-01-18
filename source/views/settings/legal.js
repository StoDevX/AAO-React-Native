// @flow
import * as React from 'react'
import * as c from '../components/colors'
import {View, ScrollView} from 'glamorous-native'
import {Markdown} from '../components/markdown'
import {text} from '../../../docs/legal.json'

type Props = {}

export default class LegalView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'Legal',
	}

	render() {
		return (
			<ScrollView
				backgroundColor={c.white}
				contentInsetAdjustmentBehavior="automatic"
				paddingHorizontal={15}
			>
				<View paddingVertical={15}>
					<Markdown source={text} />
				</View>
			</ScrollView>
		)
	}
}
