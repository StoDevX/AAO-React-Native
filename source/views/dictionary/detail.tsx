import * as React from 'react'
import {StyleSheet, TextProps, Text, View, ViewProps} from 'react-native'
import {Markdown} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import {Button} from '@frogpond/button'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'

const styles = StyleSheet.create({
	paragraph: {
		fontSize: 16,
	},
	container: {
		paddingHorizontal: 18,
		paddingVertical: 6,
	},
	term: {
		fontSize: 36,
		textAlign: 'center',
		marginHorizontal: 18,
		marginVertical: 10,
	},
})

export const Term = (props: TextProps): JSX.Element => (
	<Text {...props} style={[styles.term, props.style]} />
)

export const Container = (props: ViewProps): JSX.Element => (
	<View {...props} style={[styles.container, props.style]} />
)

export const NavigationKey = 'DictionaryDetail' as const

export const DetailNavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {word} = props.route.params.item
	return {
		title: word,
	}
}

export let DictionaryDetailView = (): JSX.Element => {
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {item} = route.params

	let navigation = useNavigation()

	let handleEditButtonPress = React.useCallback(
		() => navigation.navigate('DictionaryEditor', {item}),
		[item, navigation],
	)

	return (
		<Container>
			<Term selectable={true}>{item.word}</Term>
			<Markdown
				source={item.definition}
				styles={{Paragraph: styles.paragraph}}
			/>

			<Button onPress={handleEditButtonPress} title="Suggest an Edit" />

			<ListFooter title="Collected by the humans of All About Olaf" />
		</Container>
	)
}
