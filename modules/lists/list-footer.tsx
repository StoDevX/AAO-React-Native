import * as React from 'react'
import {StyleSheet, Text} from 'react-native'

import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	footer: {
		fontSize: 10,
		color: c.secondaryLabel,
		textAlign: 'center',
		paddingVertical: 20,
		paddingBottom: 25,
	},
})

type Props = {
	title: string
	href?: string
}

export function ListFooter(props: Props): JSX.Element {
	const {title} = props
	return (
		<Text selectable={true} style={[styles.footer]}>
			{title}
		</Text>
	)
}
