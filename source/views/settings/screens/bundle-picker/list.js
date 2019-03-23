// @flow
import * as React from 'react'
import {FlatList, View, Text, StyleSheet} from 'react-native'
import {BranchRow} from './row'
import * as c from '@frogpond/colors'
import {fetch} from '@frogpond/fetch'
import {CIRCLE_API_BASE_URL, GH_REPOS_API_URL} from '../../../../lib/constants'
import {refreshApp} from '../../../../lib/refresh'
import RNFS from 'react-native-fs'
import {
	setActiveBundle,
	registerBundle,
	reloadBundle,
	getBundles,
} from 'react-native-dynamic-bundle'
import {type TopLevelViewPropsType} from '../../../types'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {ListSeparator} from '@frogpond/lists'

let styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
})

type Props = TopLevelViewPropsType

type State = {
	results: any,
	loading: boolean,
}

export class BundlePickerListView extends React.Component<Props, State> {
	static navigationOptions = {
		title: 'Bundle Picker',
	}

	state = {
		results: null,
		loading: true,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	fetchData = async () => {
		const results = await fetch(GH_REPOS_API_URL).json()
		this.setState(() => ({results: results}))
	}

	onPressRow = (row: any) => {
		console.log(row)
	}

	keyExtractor = (branch: any, index: number) => index.toString()

	renderItem = branch => <BranchRow onPress={this.onPressRow} branch={branch} />

	render() {
		const {results, loading} = this.state

		if (loading) {
			return <LoadingView />
		}

		return (
			<FlatList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<NoticeView text="No branches found." />}
				data={results}
				keyExtractor={this.keyExtractor}
				renderItem={this.renderItem}
				style={styles.listContainer}
			/>
		)
	}
}
