// @flow
import * as React from 'react'
import {RefreshControl, StyleSheet} from 'react-native'
import * as c from '../components/colors'
import {View, ScrollView} from 'glamorous-native'
import {Markdown} from '../components/markdown'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import LoadingView from '../components/loading'
import * as defaultData from '../../../docs/faqs.json'
import delay from 'delay'
import {GH_PAGES_URL} from '../../globals'

const faqsUrl = GH_PAGES_URL('faqs.json')

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
		text: defaultData.text,
		loading: true,
		refreshing: false,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	fetchData = async () => {
		let {text} = await fetchJson(faqsUrl).catch(err => {
			reportNetworkProblem(err)
			return {text: 'There was a problem loading the FAQs'}
		})

		if (process.env.NODE_ENV === 'development') {
			text = defaultData.text
		}

		this.setState(() => ({text}))
	}

	refresh = async (): any => {
		const start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
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
