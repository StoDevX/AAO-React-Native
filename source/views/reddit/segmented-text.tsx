import * as React from 'react'
import {Text, StyleSheet} from 'react-native'
import type {StyleProp, TextStyle} from 'react-native'
import type {Segment} from '@frogpond/html-lib'
import {openUrl} from '@frogpond/open-url'
import * as c from '@frogpond/colors'

type Props = {
	segments: Segment[]
	onLinkPress?: (url: string) => void
	style?: StyleProp<TextStyle>
}

export function SegmentedText({
	segments,
	onLinkPress,
	style,
}: Props): React.ReactNode {
	return (
		<Text selectable={true} style={style}>
			{segments.map((seg, i) =>
				seg.type === 'link' ? (
					<Text
						key={i}
						onPress={() => (onLinkPress ?? openUrl)(seg.url)}
						style={styles.link}
					>
						{seg.text}
					</Text>
				) : (
					seg.text
				),
			)}
		</Text>
	)
}

const styles = StyleSheet.create({
	link: {
		color: c.link,
		textDecorationLine: 'underline',
	},
})
