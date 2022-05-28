import * as React from 'react'
import {Text, TextProps} from 'react-native'

export function SelectableText(props: TextProps): JSX.Element {
	return <Text {...props} selectable={true} />
}
