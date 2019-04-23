// @flow
import * as React from 'react'
import {Navigation} from 'react-native-navigation'
import {RefreshControl, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {View, ScrollView} from 'glamorous-native'
import {Markdown} from '@frogpond/markdown'
import {LoadingView} from '@frogpond/notice'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 15,
	},
})

type Props = {}

type State = {
	text: string,
	loading: boolean,
	refreshing: boolean,
}

export class FaqView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'FAQs',
	}

	state = {
		text: '',
		loading: true,
		refreshing: false,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	fetchData = async (reload?: boolean) => {
		let {text}: {text: string} = await fetch(API('/faqs'), {
			forReload: reload ? 500 : 0,
		})
			.json()
			.catch(() => ({text: 'There was a problem loading the FAQs'}))

		this.setState(() => ({text}))
	}

	refresh = async (): any => {
		this.setState(() => ({refreshing: true}))
		await this.fetchData(true)
		this.setState(() => ({refreshing: false}))
	}

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		const refreshControl = (
			<RefreshControl
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
			/>
		)

		return (
			<ScrollView
				backgroundColor={c.white}
				contentContainerStyle={styles.container}
				contentInsetAdjustmentBehavior="automatic"
				refreshControl={refreshControl}
			>
				<View paddingVertical={15}>
					<Markdown source={this.state.text} />
				</View>
			</ScrollView>
		)
	}
}
