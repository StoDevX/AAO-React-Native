import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Markdown} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import {Button} from '@frogpond/button'
import glamorous from 'glamorous-native'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useNavigation} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'

const Term = glamorous.text({
	fontSize: 36,
	textAlign: 'center',
	marginHorizontal: 18,
	marginVertical: 10,
})

const Container = glamorous.scrollView({
	paddingHorizontal: 18,
	paddingVertical: 6,
})

const styles = StyleSheet.create({
	paragraph: {
		fontSize: 16,
	},
})

type Props = TopLevelViewPropsType & {
	route: {params: {item: WordType}}
}

export const DetailNavigationOptions = (props: {
	route: RouteProp<RootStackParamList, 'DictionaryDetail'>
}): NativeStackNavigationOptions => {
	let {item} = props.route.params
	return {
		title: item.word,
		headerBackTitle: 'Dictionary',
	}
}

export let DictionaryDetailView = (props: Props): JSX.Element => {
	let [item] = React.useState<WordType>(props.route.params.item)

	let navigation = useNavigation()

	let handleEditButtonPress = React.useCallback(
		(item: WordType) =>
			navigation.navigate('DictionaryEditor', {
				item: item,
			}),
		[navigation],
	)

	return (
		<Container>
			<Term selectable={true}>{item.word}</Term>
			<Markdown
				source={item.definition}
				styles={{Paragraph: styles.paragraph}}
			/>

			<Button
				onPress={() => handleEditButtonPress(item)}
				title="Suggest an Edit"
			/>

			<ListFooter title="Collected by the humans of All About Olaf" />
		</Container>
	)
}
