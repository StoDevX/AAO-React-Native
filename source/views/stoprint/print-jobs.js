// @flow

import React from 'react'
import {timezone} from '@frogpond/constants'
import {Platform, SectionList} from 'react-native'
import {connect} from 'react-redux'
import {type ReduxState} from '../../redux'
import {updatePrintJobs} from '../../redux/parts/stoprint'
import {type PrintJob, STOPRINT_HELP_PAGE} from '../../lib/stoprint'
import {
	ListRow,
	ListSeparator,
	ListSectionHeader,
	Detail,
	Title,
} from '@frogpond/lists'
import {LoadingView} from '@frogpond/notice'
import type {TopLevelViewPropsType} from '../types'
import delay from 'delay'
import {openUrl} from '@frogpond/open-url'
import {StoPrintErrorView, StoPrintNoticeView} from './components'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import sortBy from 'lodash/sortBy'
import {getTimeRemaining} from './lib'
import {Timer} from '@frogpond/timer'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	jobs: Array<PrintJob>,
	error: ?string,
	loginState: string,
}

type ReduxDispatchProps = {
	updatePrintJobs: () => Promise<any>,
}

type Props = ReactProps & ReduxDispatchProps & ReduxStateProps

type State = {
	initialLoadComplete: boolean,
	loading: boolean,
}

class PrintJobsView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Print Jobs',
		headerBackTitle: 'Jobs',
	}

	state = {
		initialLoadComplete: false,
		loading: true,
	}

	componentDidMount() {
		this.initialLoad()
	}

	initialLoad = async () => {
		await this.fetchData()
		this.setState(() => ({loading: false, initialLoadComplete: true}))
	}

	refresh = async (): any => {
		let start = Date.now()

		this.setState(() => ({loading: true}))

		await this.fetchData()
		// console.log('data returned')

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = start - Date.now()
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
		this.setState(() => ({loading: false}))
	}

	fetchData = () => this.props.updatePrintJobs()

	keyExtractor = (item: PrintJob) => item.id.toString()

	openSettings = () => this.props.navigation.navigate('SettingsView')

	handleJobPress = (job: PrintJob) => {
		if (job.statusFormatted === 'Pending Release') {
			this.props.navigation.navigate('PrinterListView', {job: job})
		} else {
			this.props.navigation.navigate('PrintJobReleaseView', {job: job})
		}
	}

	renderItem = ({item}: {item: PrintJob}) => (
		<Timer
			interval={60000}
			moment={true}
			render={({now}) => (
				<ListRow onPress={() => this.handleJobPress(item)}>
					<Title>{item.documentName}</Title>
					<Detail>
						Expires {getTimeRemaining(now, item.usageTimeFormatted)}
						{' • '}
						{item.usageCostFormatted}
						{' • '}
						{item.totalPages} {item.totalPages === 1 ? 'page' : 'pages'}
					</Detail>
				</ListRow>
			)}
			timezone={timezone()}
		/>
	)

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	render() {
		if (this.props.loginState === 'checking') {
			return <LoadingView text="Logging in…" />
		}
		if (this.props.error) {
			return (
				<StoPrintErrorView
					navigation={this.props.navigation}
					refresh={this.fetchData}
					statusMessage={this.props.error}
				/>
			)
		}
		if (this.state.loading && !this.state.initialLoadComplete) {
			return <LoadingView text="Fetching a list of stoPrint Jobs…" />
		}
		if (this.props.loginState !== 'logged-in') {
			return (
				<StoPrintNoticeView
					buttonText="Open Settings"
					header="You are not logged in"
					onPress={this.openSettings}
					refresh={this.fetchData}
					text="You must be logged in to your St. Olaf account to access this feature"
				/>
			)
		} else if (this.props.jobs.length === 0) {
			const instructions =
				Platform.OS === 'android'
					? 'using the Mobility Print app'
					: 'using the Print option in the Share Sheet'
			const descriptionText = `You can print from a computer, or by ${instructions}.`

			return (
				<StoPrintNoticeView
					buttonText="Learn how to use stoPrint"
					description={descriptionText}
					header="Nothing to Print!"
					onPress={() => openUrl(STOPRINT_HELP_PAGE)}
					refresh={this.fetchData}
					text="Need help getting started?"
				/>
			)
		}
		const grouped = groupBy(this.props.jobs, j => j.statusFormatted || 'Other')
		let groupedJobs = toPairs(grouped).map(([title, data]) => ({
			title,
			data,
		}))
		let sortedGroupedJobs = sortBy(groupedJobs, [
			group => group.title !== 'Pending Release', // puts 'Pending Release' jobs at the top
		])
		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.state.loading}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={sortedGroupedJobs}
			/>
		)
	}
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
	return {
		jobs: state.stoprint ? state.stoprint.jobs : [],
		error: state.stoprint ? state.stoprint.jobsError : null,
		loginState: state.settings ? state.settings.loginState : 'logged-out',
	}
}

function mapDispatchToProps(dispatch): ReduxDispatchProps {
	return {
		updatePrintJobs: () => dispatch(updatePrintJobs()),
	}
}

export const ConnectedPrintJobsView = connect(
	mapStateToProps,
	mapDispatchToProps,
)(PrintJobsView)
