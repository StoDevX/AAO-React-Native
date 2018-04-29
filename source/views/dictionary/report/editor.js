// @flow
import * as React from 'react'
import {ScrollView, View, Text, StyleSheet} from 'react-native'
import {CellTextField} from '../../components/cells/textfield'
import {ButtonCell} from '../../components/cells/button'
import {TableView, Section} from 'react-native-tableview-simple'
import {submitReport} from './submit'
import type {WordType} from '../types'
import * as c from '../../components/colors'
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

	static getDerivedStateFromProps(nextProps: Props) {
		let entry = nextProps.navigation.state.params.word
		return {
			term: entry.word,
			definition: entry.definition,
		}
	}

	state = {
		term: this.props.navigation.state.params.word.word,
		definition: this.props.navigation.state.params.word.definition,
	}

	submit = () => {
		submitReport(this.props.navigation.state.params.word, {
			word: this.state.term,
			definition: this.state.definition,
		})
	}

	onChangeTitle = (newTitle: string) => {
		this.setState(() => ({term: newTitle}))
	}

	onChangeDefinition = (newDefinition: string) => {
		this.setState(() => ({definition: newDefinition}))
	}

	render() {
		let term = this.state.term ? this.state.term.trim() : ''
		let definition = this.state.definition ? this.state.definition.trim() : ''

		return (
			<ScrollView
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="always"
			>
				<View style={styles.helpWrapper}>
					<Text style={styles.helpTitle}>Thanks for spotting a problem!</Text>
					<Text style={styles.helpDescription}>
						If you could tell us what the word and definition should be,
						we&rsquo;d greatly appreciate it.
					</Text>
				</View>

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
		hideLabel={true}
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
		hideLabel={true}
		multiline={true}
		onChangeText={onChange}
		onSubmitEditing={onChange}
		placeholder="Definition"
		returnKeyType="default"
		value={text}
	/>
)

const styles = StyleSheet.create({
	helpWrapper: {
		backgroundColor: c.white,
		borderWidth: StyleSheet.hairlineWidth,
		borderTopColor: c.iosHeaderTopBorder,
		borderBottomColor: c.iosHeaderBottomBorder,
		marginBottom: 10,
	},
	helpTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		paddingTop: 15,
		paddingHorizontal: 15,
	},
	helpDescription: {
		fontSize: 14,
		paddingTop: 5,
		paddingBottom: 15,
		paddingHorizontal: 15,
	},
})
