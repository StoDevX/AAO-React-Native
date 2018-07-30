// @flow
import * as React from 'react'
import {StyleSheet, FlatList} from 'react-native'
import * as c from '../components/colors'
import type {StoryType} from './types'
import {ListSeparator} from '../components/list'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {NewsRow} from './news-row'
import openUrl from '../components/open-url'
import LoadingView from '../components/loading'

import {rssFeed, wpJson} from '@app/fetch'
import {DataFetcher} from '@frogpond/data-fetcher'

type Props = TopLevelViewPropsType & {
	name: string,
	url: string,
	query?: Object,
	mode: 'rss' | 'wp-json',
	thumbnail: number,
};

type DataFetcherProps = {
	feed: {
		data: Array<StoryType>,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
};

export default class NewsContainer extends React.Component<Props> {
	renderSeparator = () => {
		return <ListSeparator spacing={{left: 101}} />
	}

	renderItem = ({item}: {item: StoryType}) => {
		return <NewsRow
			onPress={url => openUrl(url)}
			story={item}
			thumbnail={this.props.thumbnail}
		/>
	}

	keyExtractor = (item: StoryType) => item.title

	render() {
		let feed
		if (this.props.mode === 'rss') {
			feed = rssFeed({url: this.props.url, query: this.props.query})
		} else if (this.props.mode === 'wp-json') {
			feed = wpJson({url: this.props.url, query: this.props.query})
		} else {
			throw new Error(`unknown mode ${this.props.mode}`)
		}

		return (
			<DataFetcher
				error={NoticeView}
				loading={() => <LoadingView text="Loading…" />}
				render={({feed}: DataFetcherProps) => {
					let {data: entries, refresh, loading} = feed

					return (
						<FlatList
							ItemSeparatorComponent={this.renderSeparator}
							ListEmptyComponent={<NoticeView text="No news." />}
							data={entries}
							keyExtractor={this.keyExtractor}
							onRefresh={refresh}
							refreshing={loading}
							renderItem={this.renderItem}
							style={styles.listContainer}
						/>
					)
				}}
				resources={{feed}}
			/>
		)
	}
}

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
})
