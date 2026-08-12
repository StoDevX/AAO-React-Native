import * as React from 'react'
import {StyleSheet, TextProps, Text, View, ViewProps} from 'react-native'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {Markdown, type MarkdownStyle} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import {Button} from '@frogpond/button'
import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'

import {wordByTermOptions} from '../../../../source/features/dictionary/query'

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

const Term = (props: TextProps): React.ReactNode => (
	<Text {...props} style={[styles.term, props.style]} />
)

const Container = (props: ViewProps): React.ReactNode => (
	<View {...props} style={[styles.container, props.style]} />
)

export default function DictionaryDetailPage(): React.ReactNode {
	let router = useRouter()
	let {word} = useLocalSearchParams<{word: string}>()
	let {
		data: entry,
		isLoading,
		error,
		refetch,
	} = useQuery(wordByTermOptions(word))

	let screen = <Stack.Screen options={{title: entry?.word ?? word}} />

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!entry) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the word "${word}".`} />
			</>
		)
	}

	let handleEditButtonPress = (): void =>
		router.push({
			pathname: '/Dictionary/[word]/edit',
			params: {word: entry.word},
		})

	return (
		<>
			{screen}
			<Container>
				<Term selectable={true}>{entry.word}</Term>
				<Markdown
					markdownStyle={paragraphMarkdownStyle}
					source={entry.definition}
				/>

				<Button onPress={handleEditButtonPress} title="Suggest an Edit" />

				<ListFooter title="Collected by the humans of All About Olaf" />
			</Container>
		</>
	)
}
