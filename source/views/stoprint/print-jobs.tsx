import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {Platform, SectionList} from 'react-native'
import {useDispatch, useSelector} from 'react-redux'
import type {ReduxState} from '../../redux'
import {updatePrintJobs} from '../../redux/parts/stoprint'
import type {LoginStateEnum} from '../../redux/parts/login'
import {LoginAction, logInViaCredentials} from '../../redux/parts/login'
import {loadLoginCredentials} from '../../lib/login'
import type {PrintJob} from '../../lib/stoprint'
import {STOPRINT_HELP_PAGE, isStoprintMocked} from '../../lib/stoprint'
import {
	Detail,
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Title,
} from '@frogpond/lists'
import {LoadingView} from '@frogpond/notice'
import delay from 'delay'
import {openUrl} from '@frogpond/open-url'
import {StoPrintErrorView, StoPrintNoticeView} from './components'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import sortBy from 'lodash/sortBy'
import {getTimeRemaining} from './lib'
import {Timer} from '@frogpond/timer'
import {ThunkAction} from 'redux-thunk'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {DebugNoticeButton} from '@frogpond/navigation-buttons'

type ReduxStateProps = {
	jobs: Array<PrintJob>
	error: string | null
	status: LoginStateEnum
}

type ReduxDispatchProps = {
	logInViaCredentials: (
		username: string,
		password: string,
	) => ThunkAction<void, ReduxState, void, LoginAction>
	updatePrintJobs: () => ThunkAction<void, ReduxState, void, LoginAction>
}

type Props = ReduxDispatchProps & ReduxStateProps

const PrintJobsView = (props: Props) => {
	let [initialLoadComplete, setInitialLoadComplete] = React.useState(false)
	let [loading, setLoading] = React.useState(true)

	let navigation = useNavigation()

	let logIn = React.useCallback(async () => {
		let {status} = props
		if (status === 'logged-in' || status === 'checking' || isStoprintMocked) {
			return
		}

		let {username = '', password = ''} = await loadLoginCredentials()
		if (username && password) {
			await props.logInViaCredentials(username, password)
		}
	}, [props])

	let fetchData = React.useCallback(async () => {
		await logIn()
		await props.updatePrintJobs()
	}, [logIn, props])

	React.useEffect(() => {
		async function getData() {
			await fetchData()
			setLoading(false)
			setInitialLoadComplete(true)
		}
		getData()
	}, [fetchData])

	let refresh = async () => {
		let start = Date.now()

		setLoading(true)

		await fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = start - Date.now()
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
		setLoading(false)
	}

	let openSettings = () => navigation.navigate('Settings')

	let handleJobPress = (job: PrintJob) => {
		if (job.statusFormatted === 'Pending Release') {
			navigation.navigate('PrinterList', {job: job})
		} else {
			navigation.navigate('PrintJobRelease', {job: job})
		}
	}

	if (props.status === 'checking') {
		return <LoadingView text="Logging in…" />
	}

	if (props.error) {
		return <StoPrintErrorView refresh={fetchData} statusMessage={props.error} />
	}

	if (loading && !initialLoadComplete) {
		return <LoadingView text="Fetching a list of stoPrint Jobs…" />
	}

	if (props.status !== 'logged-in' && !isStoprintMocked) {
		return (
			<StoPrintNoticeView
				buttonText="Open Settings"
				header="You are not logged in"
				onPress={openSettings}
				refresh={fetchData}
				text="You must be logged in to your St. Olaf account to access this feature"
			/>
		)
	}

	if (props.jobs.length === 0) {
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
				refresh={fetchData}
				text="Need help getting started?"
			/>
		)
	}

	let grouped = groupBy(props.jobs, (j) => j.statusFormatted || 'Other')
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
			keyExtractor={(item: PrintJob) => item.id.toString()}
			onRefresh={refresh}
			refreshing={loading}
			renderItem={({item}: {item: PrintJob}) => (
				<Timer
					interval={60000}
					moment={true}
					render={({now}) => (
						<ListRow onPress={() => handleJobPress(item)}>
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
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={sortedGroupedJobs}
		/>
	)
}

export function ConnectedPrintJobsView(): JSX.Element {
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
			error={error}
			jobs={jobs}
			logInViaCredentials={_logInViaCredentials}
			status={status}
			updatePrintJobs={_updatePrintJobs}
		/>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Print Jobs',
	headerRight: () => <DebugNoticeButton shouldShow={isStoprintMocked} />,
}
