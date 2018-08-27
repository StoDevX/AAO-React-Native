// @flow
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Markdown} from '../../../components/markdown'
import {ListFooter} from '@frogpond/lists'
import glamorous from 'glamorous-native'
import {trackScreenView} from '@frogpond/analytics'
import {Button} from '@frogpond/button'
import {openUrl} from '@frogpond/open-url'
import type {OtherModeType} from '../types'
import {GH_NEW_ISSUE_URL} from '../../../lib/constants'

const Title = glamorous.text({
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

type Props = {navigation: {state: {params: {mode: OtherModeType}}}}

export class OtherModesDetailView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: any) => {
		return {
			title: navigation.state.params.mode.name,
		}
	}

	onPress = () => {
		const {name, url} = this.props.navigation.state.params.mode
		trackScreenView(`Transportation_OtherModes_${name.replace(' ', '')}View`)
		openUrl(url)
	}

	render() {
		const mode = this.props.navigation.state.params.mode
		return (
			<Container>
			<Title selectable={true}>{mode.name}</Title>

			<Markdown
			source={mode.description}
			styles={{Paragraph: styles.paragraph}}
			/>

			<Button onPress={this.onPress} title="More Info" />

			<ListFooter
			href={GH_NEW_ISSUE_URL}
			title="Collected by the humans of All About Olaf"
			/>
			</Container>
		)
	}
}
