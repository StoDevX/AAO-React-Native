// @flow

import * as React from 'react'
import glamorous, {View} from 'glamorous-native'
import {BaseText, Paragraph} from './formatting'

// the list itself
export const List = glamorous(View)({})

// the list item's text
export const ListText = glamorous(Paragraph)({
	flex: 1,
})

// the list item's container box thing
type Props = {
	children?: React.Node,
}

export class ListItem extends React.PureComponent<Props> {
	render() {
		return (
			<View alignItems="center" flexDirection="row">
				<BaseText paddingRight={4}>• </BaseText>
				<ListText {...this.props} />
			</View>
		)
	}
}
