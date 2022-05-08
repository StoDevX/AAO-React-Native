import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {Platform, SectionList} from 'react-native'
import {useDispatch, useSelector} from 'react-redux'
import type {ReduxState} from '../../redux'
import {updatePrintJobs} from '../../redux/parts/stoprint'
import type {LoginStateEnum} from '../../redux/parts/login'
import {logInViaCredentials} from '../../redux/parts/login'
import {loadLoginCredentials} from '../../lib/login'
import type {PrintJob} from '../../lib/stoprint'
import {STOPRINT_HELP_PAGE} from '../../lib/stoprint'
import {
	Detail,
	ListRow,
	ListSectionHeader,
	ListSeparator,
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
	jobs: Array<PrintJob>
	error?: string
	status: LoginStateEnum
}

type ReduxDispatchProps = {
	logInViaCredentials: (username: string, password: string) => Promise<any>
	updatePrintJobs: () => Promise<any>
}

type Props = ReactProps & ReduxDispatchProps & ReduxStateProps

type State = {
	initialLoadComplete: boolean
	loading: boolean
}

class PrintJobsView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Print Jobs',
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

	refresh = async () => {
		let start = Date.now()

		this.setState(() => ({loading: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = start - Date.now()
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
		this.setState(() => ({loading: false}))
	}

	logIn = async () => {
		let {status} = this.props
		if (status === 'logged-in' || status === 'checking') {
			return
		}

		let {username = '', password = ''} = await loadLoginCredentials()
		if (username && password) {
			await this.props.logInViaCredentials(username, password)
		}
	}

	fetchData = async () => {
		await this.logIn()
		await this.props.updatePrintJobs()
	}

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
		if (this.props.status === 'checking') {
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

		if (this.props.status !== 'logged-in') {
			return (
				<StoPrintNoticeView
					buttonText="Open Settings"
					header="You are not logged in"
					onPress={this.openSettings}
					refresh={this.fetchData}
					text="You must be logged in to your St. Olaf account to access this feature"
				/>
			)
		}

		if (this.props.jobs.length === 0) {
			let instructions =
				Platform.OS === 'android'
					? 'using the Mobility Print app'
					: 'using the Print option in the Share Sheet'
			let descriptionText = `You can print from a computer, or by ${instructions}.`

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

		let grouped = groupBy(this.props.jobs, (j) => j.statusFormatted || 'Other')
		let groupedJobs = toPairs(grouped).map(([title, data]) => ({
			title,
			data,
		}))
		let sortedGroupedJobs = sortBy(groupedJobs, [
			(group) => group.title !== 'Pending Release', // puts 'Pending Release' jobs at the top
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

export function ConnectedPrintJobsView(props: TopLevelViewPropsType) {
	let dispatch = useDispatch()

	let jobs = useSelector((state: ReduxState) => state.stoprint?.jobs || [])
	let error = useSelector(
		(state: ReduxState) => state.stoprint?.jobsError || null,
	)
	let status = useSelector(
		(state: ReduxState) => state.login?.status || 'logged-out',
	)

	let _logInViaCredentials = React.useCallback(
		(username, password) => dispatch(logInViaCredentials(username, password)),
		[dispatch],
	)
	let _updatePrintJobs = React.useCallback(
		() => dispatch(updatePrintJobs()),
		[dispatch],
	)

	return (
		<PrintJobsView
			{...props}
			error={error}
			jobs={jobs}
			logInViaCredentials={_logInViaCredentials}
			status={status}
			updatePrintJobs={_updatePrintJobs}
		/>
	)
}
