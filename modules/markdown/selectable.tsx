import * as React from 'react'
import {Text, TextProps} from 'react-native'

export function SelectableText(props: TextProps): React.JSX.Element {
	return <Text {...props} selectable={true} />
}
