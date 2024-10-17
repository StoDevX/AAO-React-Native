import * as React from 'react'
import {StyleSheet, Text} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
	footer: {
		fontSize: 10,
		color: c.secondaryLabel,
		textAlign: 'center',
		paddingVertical: 20,
		paddingBottom: 25,
	},
})

interface Props {
	title: string
	href?: string
}

export function ListFooter(props: Props): React.JSX.Element {
	const {title} = props
	return (
		<Text selectable={true} style={[styles.footer]}>
			{title}
		</Text>
	)
}
