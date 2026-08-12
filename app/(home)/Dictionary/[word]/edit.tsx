import * as React from 'react'
import {ScrollView} from 'react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {InfoHeader} from '@frogpond/info-header'
import {TableView, Section} from '@frogpond/tableview'
import {CellTextField, ButtonCell} from '@frogpond/tableview/cells'
import {LoadingView, NoticeView} from '@frogpond/notice'
import noop from 'lodash/noop'

import {wordByTermOptions} from '../../../../source/features/dictionary/query'
import {submitReport} from '../../../../source/features/dictionary/report/submit'
import type {WordType} from '../../../../source/features/dictionary/types'

type TextFieldProps = {text: string; onChange: (text: string) => void}

const TitleCell = ({text, onChange = noop}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="words"
		onChangeText={onChange}
		onSubmitEditing={(ev) => onChange(ev.nativeEvent.text)}
		placeholder="Title"
		returnKeyType="done"
		value={text}
	/>
)

const DefinitionCell = ({text, onChange = noop}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="sentences"
		multiline={true}
		onChangeText={onChange}
		onSubmitEditing={(ev) => onChange(ev.nativeEvent.text)}
		placeholder="Definition"
		returnKeyType="default"
		value={text}
	/>
)

type DictionaryEditorBodyProps = {
	word: WordType
}

function DictionaryEditorBody({
	word: item,
}: DictionaryEditorBodyProps): React.ReactNode {
	let [term, setTerm] = React.useState(item.word)
	let [definition, setDefinition] = React.useState(item.definition)

	let submit = () => {
		submitReport(item, {
			word: term.trim(),
			definition: definition.trim(),
		})
	}

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="always"
		>
			<InfoHeader
				message="If you could tell us what the word and definition should be, we&rsquo;d greatly appreciate it."
				title="Thanks for spotting a problem!"
			/>

			<TableView>
				<Section header="WORD">
					<TitleCell onChange={setTerm} text={term} />
				</Section>

				<Section header="DEFINITION">
					<DefinitionCell onChange={setDefinition} text={definition} />
				</Section>

				<Section footer="Thanks for reporting!">
					<ButtonCell onPress={submit} title="Submit Report" />
				</Section>
			</TableView>
		</ScrollView>
	)
}

function DictionaryEditorView(): React.ReactNode {
	let {word} = useLocalSearchParams<{word: string}>()
	let {
		data: entry,
		isLoading,
		error,
		refetch,
	} = useQuery(wordByTermOptions(word))

	if (isLoading) {
		return <LoadingView />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!entry) {
		return <NoticeView text={`Could not find the word "${word}".`} />
	}

	return <DictionaryEditorBody word={entry} />
}

export default function DictionaryEditorPage(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Suggest an edit'}} />
			<DictionaryEditorView />
		</>
	)
}
