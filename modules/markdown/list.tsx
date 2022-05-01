import * as React from 'react'
import glamorous from 'glamorous-native'
import {BaseText, Paragraph} from './formatting'
import {StyleProp, TextStyle} from 'react-native'

// the list itself
export const List = glamorous.view({})

// the list item's text
export const ListText = glamorous(Paragraph)({
	flex: 1,
})

// the list item's container box thing
type Props = React.PropsWithChildren<{style: StyleProp<TextStyle>}>

export class ListItem extends React.PureComponent<Props> {
	render(): JSX.Element {
		return (
			<glamorous.View alignItems="center" flexDirection="row">
				<BaseText>• </BaseText>
				<ListText {...this.props} />
			</glamorous.View>
		)
	}
}
