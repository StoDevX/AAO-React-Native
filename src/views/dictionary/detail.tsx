import * as React from 'react'
import {StyleSheet, TextProps, Text, View, ViewProps} from 'react-native'
import {Markdown} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import {Button} from '@frogpond/button'
import * as c from '@frogpond/colors'

import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useDictionary} from './query'

const styles = StyleSheet.create({
	paragraph: {
		color: c.label,
		fontSize: 16,
	},
	container: {
		paddingHorizontal: 18,
		paddingVertical: 6,
	},
	term: {
		color: c.label,
		fontSize: 36,
		textAlign: 'center',
		marginHorizontal: 18,
		marginVertical: 10,
	},
})

export const Term = (props: TextProps): React.JSX.Element => (
	<Text {...props} style={[styles.term, props.style]} />
)

export const Container = (props: ViewProps): React.JSX.Element => (
	<View {...props} style={[styles.container, props.style]} />
)

export let DictionaryDetailView = (): React.JSX.Element => {
	let params = useLocalSearchParams<{word: string}>()
	let router = useRouter()

	let {data = []} = useDictionary()
	let item = data.find((w) => w.word === params.word)

	let handleEditButtonPress = React.useCallback(
		() =>
			item &&
			router.push({
				pathname: '/dictionary/report',
				params: {word: item.word, definition: item.definition},
			}),
		[item, router],
	)

	if (!item) {
		return (
			<Container>
				<Term>Word not found</Term>
			</Container>
		)
	}

	return (
		<>
			<Stack.Screen options={{title: item.word}} />
			<Container>
				<Term selectable={true}>{item.word}</Term>
				<Markdown
					source={item.definition}
					styles={{Paragraph: styles.paragraph}}
				/>

				<Button onPress={handleEditButtonPress} title="Suggest an Edit" />

				<ListFooter title="Collected by the humans of All About Olaf" />
			</Container>
		</>
	)
}
