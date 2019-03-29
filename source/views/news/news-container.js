// @flow
import * as React from 'react'
import type {StoryType} from './types'
import {LoadingView} from '@frogpond/notice'
import type {TopLevelViewPropsType} from '../types'
import {NewsList} from './news-list'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'

type Props = TopLevelViewPropsType & {
	source: string | {url: string, type: 'rss' | 'wp-json'},
	thumbnail: false | number,
	title: string,
}

type State = {
	entries: StoryType[],
	initialLoadComplete: boolean,
	refreshing: boolean,
}

export default class NewsContainer extends React.PureComponent<Props, State> {
	state = {
		entries: [],
		initialLoadComplete: false,
		refreshing: false,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({initialLoadComplete: true}))
		})
	}

	fetchData = async (reload?: boolean) => {
		let url
		if (typeof this.props.source === 'string') {
			url = API(`/news/named/${this.props.source}`)
		} else if (this.props.source.type === 'rss') {
			url = API('/news/rss', {url: this.props.source.url})
		} else if (this.props.source.type === 'wp-json') {
			url = API('/news/wpjson', {url: this.props.source.url})
		} else {
			throw new Error('invalid news source type!')
		}

		let entries: Array<StoryType> = await fetch(url, {
			forReload: reload ? 500 : 0,
		}).json()

		this.setState(() => ({entries}))
	}

	refresh = async (): any => {
		this.setState(() => ({refreshing: true}))
		await this.fetchData(true)
		this.setState(() => ({refreshing: false}))
	}

	render() {
		if (!this.state.initialLoadComplete) {
			return <LoadingView />
		}

		return (
			<NewsList
				entries={this.state.entries}
				loading={this.state.refreshing}
				name={this.props.title}
				navigation={this.props.navigation}
				onRefresh={this.refresh}
				thumbnail={this.props.thumbnail}
			/>
		)
	}
}
