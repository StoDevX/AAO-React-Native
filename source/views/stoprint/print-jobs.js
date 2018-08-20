// @flow

import React from 'react'
import {SectionList} from 'react-native'
import {connect} from 'react-redux'
import {type ReduxState} from '../../flux'
import {updatePrintJobs} from '../../flux/parts/stoprint'
import {type PrintJob, STOPRINT_HELP_PAGE} from '../../lib/stoprint'
import {
	ListRow,
	ListSeparator,
	ListSectionHeader,
	Detail,
	Title,
} from '../components/list'
import type {TopLevelViewPropsType} from '../types'
import delay from 'delay'
import openUrl from '../components/open-url'
import {StoPrintErrorView, StoPrintNoticeView} from './components'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import sortBy from 'lodash/sortBy'

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

class PrintJobsView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'Print Jobs',
		headerBackTitle: 'Jobs',
	}

	componentDidMount() {
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
		<ListRow onPress={() => this.handleJobPress(item)}>
			<Title>{item.documentName}</Title>
			<Detail>
				{item.usageTimeFormatted} • {item.usageCostFormatted} •{' '}
				{item.totalPages} pages • {item.statusFormatted}
			</Detail>
		</ListRow>
	)

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	render() {
		if (this.props.error) {
			return (
				<StoPrintErrorView
					navigation={this.props.navigation}
					refresh={this.fetchData}
				/>
			)
		}
		if (this.props.loginState !== 'logged-in') {
			return (
				<StoPrintNoticeView
					buttonText="Open Settings"
					header="You are not logged in"
					onPress={this.openSettings}
					text="You must be logged in to your St. Olaf student account to access this feature"
				/>
			)
		} else if (this.props.jobs.length === 0) {
			return (
				<StoPrintNoticeView
					buttonText="Install stoPrint"
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
				refreshing={this.props.loading}
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

export const ConnectedPrintJobsView = connect(
	mapStateToProps,
	mapDispatchToProps,
)(PrintJobsView)
