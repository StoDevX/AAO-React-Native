import * as React from 'react'
import {Platform, StyleSheet, Text} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '@frogpond/touchable'
import {useTheme} from '@frogpond/app-theme'
import {commonStyles, rightButtonStyles as styles} from './styles'
import {platformPrefixIconName} from '../icon/platform-prefix-icon-name'

type Props = {
	onPress: () => void
	title?: string
}

export function SearchButton(props: Props): JSX.Element {
	let {colors} = useTheme()

	return (
		<Touchable highlight={false} onPress={props.onPress} style={styles.button}>
			{props.title ? (
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
				<Icon
					name={platformPrefixIconName('search-outline')}
					style={styles.icon}
				/>
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
