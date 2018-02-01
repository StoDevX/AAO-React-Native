// @flow

import React from 'react'
import {Text} from 'react-native'

type Props = {
	items: Array<string>,
}

export class FormattedLine extends React.PureComponent<Props> {
	render() {
		const items = this.props.items
		const lines = items.map((item, index, items) => {
			const last = index === items.length - 1
			return (
				<Text key={item}>
					{item} {!last && <Text>&middot; </Text>}
				</Text>
			)
		})
		return lines
	}
}
