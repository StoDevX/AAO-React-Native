// @flow
import * as React from 'react'
import {FlatList, StyleSheet} from 'react-native'
import delay from 'delay'
import {PullRequestRow} from './row'
import * as c from '@frogpond/colors'
import {fetch} from '@frogpond/fetch'
import {GH_REPOS_API_URL} from '../../../../lib/constants'
import {type TopLevelViewPropsType} from '../../../types'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {ListSeparator, ListFooter} from '@frogpond/lists'
import type {GithubResponse} from './types'

let styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
})

type Props = TopLevelViewPropsType & {
	onRefresh: () => any,
	refreshing: boolean,
}

type State = {
	loading: boolean,
	refreshing: boolean,
	results: ?Array<GithubResponse>,
}

export class BundlePickerListView extends React.Component<Props, State> {
	static navigationOptions = {
		title: 'Bundle Picker',
	}

	state = {
		loading: true,
		refreshing: false,
		results: null,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
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

	fetchData = async () => {
		const results = await fetch(GH_REPOS_API_URL, {
			searchParams: {
				state: 'open',
			},
		}).json()
		this.setState(() => ({results}))
	}

	onPressRow = (request: GithubResponse) => {
		this.props.navigation.navigate('DownloaderView', {request})
	}

	keyExtractor = (request: GithubResponse, index: number) => index.toString()

	renderItem = ({item}: {item: GithubResponse}) => (
		<PullRequestRow onPress={() => this.onPressRow(item)} request={item} />
	)

	render() {
		const {results, loading} = this.state

		if (loading) {
			return <LoadingView text="Fetching Open PRs…" />
		}

		return (
			<FlatList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<NoticeView text="No pull requests found." />}
				ListFooterComponent={<ListFooter title="Powered by GitHub" />}
				data={results}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
				renderItem={this.renderItem}
				style={styles.listContainer}
			/>
		)
	}
}
