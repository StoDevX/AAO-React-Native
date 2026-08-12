import * as React from 'react'
import {StyleSheet, TextProps, Text, View, ViewProps} from 'react-native'
import {Markdown, type MarkdownStyle} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import {Button} from '@frogpond/button'
import * as c from '@frogpond/colors'

import {useRouter} from 'expo-router'
import type {WordType} from './types'

const paragraphMarkdownStyle: MarkdownStyle = {paragraph: {fontSize: 16}}

const styles = StyleSheet.create({
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

export const Term = (props: TextProps): React.ReactNode => (
	<Text {...props} style={[styles.term, props.style]} />
)

export const Container = (props: ViewProps): React.ReactNode => (
	<View {...props} style={[styles.container, props.style]} />
)

type Props = {
	word: WordType
}

export let DictionaryDetailView = ({word: item}: Props): React.ReactNode => {
	let router = useRouter()

	let handleEditButtonPress = React.useCallback(
		() =>
			router.push({
				pathname: '/Dictionary/[word]/edit',
				params: {word: item.word},
			}),
		[item.word, router],
	)

	return (
		<Container>
			<Term selectable={true}>{item.word}</Term>
			<Markdown
				markdownStyle={paragraphMarkdownStyle}
				source={item.definition}
			/>

			<Button onPress={handleEditButtonPress} title="Suggest an Edit" />

			<ListFooter title="Collected by the humans of All About Olaf" />
		</Container>
	)
}
