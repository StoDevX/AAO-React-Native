import * as React from 'react'
import {Platform, StyleSheet, Text} from 'react-native'
import Ionicon from '@expo/vector-icons/Ionicons'
import {Touchable} from '../touchable'
import {useTheme} from '../app-theme'
import {commonStyles, rightButtonStyles as styles} from './styles'

interface Props {
	onPress: () => void
	title?: string
}

export function SearchButton(props: Props): React.JSX.Element {
	let {colors} = useTheme()

	return (
		<Touchable highlight={false} onPress={props.onPress} style={styles.button}>
			{props.title != null ? (
				<Text
					style={[
						commonStyles.text,
						searchStyles.text,
						{color: colors.primary},
					]}
				>
					{props.title}
				</Text>
			) : (
				<Ionicon name="search-outline" style={styles.icon} />
			)}
		</Touchable>
	)
}

const searchStyles = StyleSheet.create({
	text: {
		...Platform.select({
			ios: {
				fontWeight: '600',
			},
			android: {
				fontWeight: '400',
			},
		}),
	},
})
