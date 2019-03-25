// @flow
import * as React from 'react'
import {ScrollView} from 'react-native'
import {InfoHeader} from '@frogpond/info-header'
import {
	TableView,
	Section,
	CellTextField,
	ButtonCell,
} from '@frogpond/tableview'
import {submitReport} from './submit'
import type {WordType} from '../types'
import type {TopLevelViewPropsType} from '../../types'

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {item: WordType}}},
}

type State = {
	term: string,
	definition: string,
}

export class DictionaryEditorView extends React.PureComponent<Props, State> {
	static navigationOptions = () => {
		return {
			title: 'Suggest an Edit',
		}
	}

	state = {
		term: this.props.navigation.state.params.word.word,
		definition: this.props.navigation.state.params.word.definition,
	}

	submit = () => {
		submitReport(this.props.navigation.state.params.word, {
			word: this.state.term.trim(),
			definition: this.state.definition.trim(),
		})
	}

	onChangeTitle = (newTitle: string) => {
		this.setState(() => ({term: newTitle}))
	}

	onChangeDefinition = (newDefinition: string) => {
		this.setState(() => ({definition: newDefinition}))
	}

	render() {
		let {term, definition} = this.state

		return (
			<ScrollView
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="always"
			>
				<InfoHeader
					message="If you could tell us what the word and definition should be, we&rsquo;d greatly appreciate it."
					title="Thanks for spotting a problem!"
				/>

				<TableView>
					<Section header="WORD">
						<TitleCell onChange={this.onChangeTitle} text={term} />
					</Section>

					<Section header="DEFINITION">
						<DefinitionCell
							onChange={this.onChangeDefinition}
							text={definition}
						/>
					</Section>

					<Section footer="Thanks for reporting!">
						<ButtonCell onPress={this.submit} title="Submit Report" />
					</Section>
				</TableView>
			</ScrollView>
		)
	}
}

type TextFieldProps = {text: string, onChange: string => any}

const TitleCell = ({text, onChange = () => {}}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="words"
		onChangeText={onChange}
		onSubmitEditing={onChange}
		placeholder="Title"
		returnKeyType="done"
		value={text}
	/>
)

const DefinitionCell = ({text, onChange = () => {}}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="sentences"
		multiline={true}
		onChangeText={onChange}
		onSubmitEditing={onChange}
		placeholder="Definition"
		returnKeyType="default"
		value={text}
	/>
)
