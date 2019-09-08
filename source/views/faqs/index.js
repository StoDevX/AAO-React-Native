// @flow
import * as React from 'react'
import delay from 'delay'
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
		let start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.fetchData(true)

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({refreshing: false}))
	}

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		let refreshControl = (
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
