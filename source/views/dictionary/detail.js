// @flow
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Markdown} from '../components/markdown'
import {ListFooter} from '../components/list'
import {Button} from '../components/button'
import glamorous from 'glamorous-native'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {GH_NEW_ISSUE_URL} from '../../globals'

// TODO: This doesn't point at the SA dictionary because they don't have an
// overview page.
const STO_SA_DICT_URL = GH_NEW_ISSUE_URL

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
	navigation: {state: {params: {item: WordType}}},
}

export class DictionaryDetailView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: any) => {
		return {
			title: navigation.state.params.item.word,
		}
	}

	handleEditButtonPress = () => {
		const item = this.props.navigation.state.params.item
		this.props.navigation.navigate('DictionaryEditorView', {
			word: item,
		})
	}

	render() {
		const item = this.props.navigation.state.params.item
		return (
			<Container>
				<Term selectable={true}>{item.word}</Term>
				<Markdown
					source={item.definition}
					styles={{Paragraph: styles.paragraph}}
				/>

				<Button onPress={this.handleEditButtonPress} title="Suggest an Edit" />

				<ListFooter
					href={STO_SA_DICT_URL}
					title={
						'Collected by the humans of All About Olaf,\nfrom the Student Activities dictionary'
					}
				/>
			</Container>
		)
	}
}
