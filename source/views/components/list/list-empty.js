// @flow
import * as React from 'react'
import {View, Text} from 'react-native'

type Props = {
	mode: 'bug' | 'normal',
}

export class ListEmpty extends React.PureComponent<Props> {
	render() {
		return (
			<View>
				<Text>List is empty</Text>
			</View>
		)
	}
}
