// @flow

import React from 'react'
import {FlatList, StyleSheet, View, Text, Button} from 'react-native'
import {connect} from 'react-redux'
import {type ReduxState} from '../../flux'
import {ListEmpty} from '../components/list'
import {updatePrintJobs} from '../../flux/parts/stoprint'
import type {PrintJob} from './types'
import {
	ListRow,
	ListSeparator,
	ListSectionHeader,
	Detail,
	Title,
} from '../components/list'
import type {TopLevelViewPropsType} from '../types'
import delay from 'delay'

const styles = StyleSheet.create({
	list: {},
})

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	jobs: Array<PrintJob>,
	error: ?string,
	loading: boolean,
	loginState: string,
}

type ReduxDispatchProps = {
	updatePrintJobs: () => Promise<any>,
}

type Props = ReactProps & ReduxDispatchProps & ReduxStateProps

class PrintReleaseView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'Print Jobs',
	}

	componentWillMount = () => {
		this.refresh()
	}

	refresh = async (): any => {
		let start = Date.now()

		await this.fetchData()
		// console.log('data returned')

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = start - Date.now()
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
	}

	fetchData = () => this.props.updatePrintJobs()

	keyExtractor = (item: PrintJob) => item.id

	openSettings = () => this.props.navigation.navigate('SettingsView')

	releaseJob = (id: any) =>
		this.props.navigation.navigate('PrintJobReleaseView', {id})

	renderItem = ({item}: {item: PrintJob}) => (
		<ListRow onPress={() => this.releaseJob(item.id)}>
			<Title>{item.documentName}</Title>
			<Detail>
				{item.usageCostFormatted} • {item.totalPages} pages •{' '}
				{item.statusFormatted} • {item.grayscaleFormatted}
			</Detail>
		</ListRow>
	)

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	render() {
		if (this.props.loginState !== 'logged-in') {
			return (
				<View>
					<Text>You are not logged in.</Text>
					<Button onPress={this.openSettings} title="Open Settings" />
				</View>
			)
		}

		return (
			<FlatList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<ListEmpty mode="bug" />}
				data={this.props.jobs}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.props.loading}
				renderItem={this.renderItem}
				style={styles.list}
			/>
		)
	}
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
	return {
		jobs: state.stoprint ? state.stoprint.jobs : [],
		error: state.stoprint ? state.stoprint.error : null,
		loading: state.stoprint ? state.stoprint.loadingJobs : false,
		loginState: state.settings ? state.settings.loginState : 'logged-out',
	}
}

function mapDispatchToProps(dispatch): ReduxDispatchProps {
	return {
		updatePrintJobs: () => dispatch(updatePrintJobs()),
	}
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(PrintReleaseView)
