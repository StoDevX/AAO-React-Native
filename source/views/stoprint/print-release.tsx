import * as React from 'react'
import {Alert, StyleSheet, ScrollView, Text, TextProps} from 'react-native'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {ButtonCell} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import {
	cancelPrintJobForUser,
	releasePrintJobToPrinterForUser,
} from '../../lib/stoprint/api'
import {
	isStoprintMocked,
	showGeneralError,
	type Printer,
	type PrintJob,
} from '../../lib/stoprint'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'
import {DebugNoticeButton} from '@frogpond/navigation-buttons'
import {useHeldJobs} from './query'
import {useMutation} from '@tanstack/react-query'
import {useUsername} from '../../lib/login'
import {LoadingView} from '@frogpond/notice'

const styles = StyleSheet.create({
	cancelButton: {
		color: c.red,
	},
	buttonCell: {
		textAlign: 'center',
	},
	header: {
		fontSize: 30,
		textAlign: 'center',
		marginTop: 20,
		marginHorizontal: 10,
		color: c.label,
	},
})

const Header = (props: TextProps) => (
	<Text {...props} style={[styles.header, props.style]} />
)

function LeftDetailCell({detail, title}: {detail: string; title: string}) {
	return <Cell cellStyle="LeftDetail" detail={detail} title={title} />
}

function JobInformation({job}: {job: PrintJob}) {
	let wasPrintedAlready = job.statusFormatted === 'Sent to Printer'
	return (
		<Section header="JOB INFO">
			<LeftDetailCell detail="Status" title={job.statusFormatted} />
			<LeftDetailCell detail="Time" title={job.usageTimeFormatted} />
			<LeftDetailCell detail="Pages" title={job.totalPages.toString()} />
			<LeftDetailCell detail="Cost" title={job.usageCostFormatted} />
			<LeftDetailCell detail="Grayscale" title={job.grayscaleFormatted} />
			<LeftDetailCell detail="Paper Size" title={job.paperSizeFormatted} />
			{wasPrintedAlready && (
				<LeftDetailCell detail="Printer" title={job.printerName} />
			)}
		</Section>
	)
}

function PrinterInformation({printer}: {printer: Printer}) {
	return (
		<Section header="PRINTER INFO">
			<LeftDetailCell detail="Name" title={printer.printerName} />
			{Boolean(printer.location) && (
				<LeftDetailCell detail="Location" title={printer.location ?? ''} />
			)}
		</Section>
	)
}

export const PrintJobReleaseView = (): JSX.Element => {
	let navigation = useNavigation()

	let route = useRoute<RouteProp<RootStackParamList, 'PrintJobRelease'>>()
	let {job, printer} = route.params

	let {data: username = '', isLoading: loadingUsername} = useUsername()

	let {data: heldJobs = []} = useHeldJobs(printer?.printerName)
	let jobId = job.id.toString()
	let heldJob = heldJobs.find((item) => item.id.startsWith(jobId))

	const returnToJobsView = React.useCallback(() => {
		navigation.navigate('PrintJobs')
	}, [navigation])

	const releaseJob = useMutation({
		mutationKey: ['printing', 'release', heldJob?.id],
		mutationFn: async () => {
			if (!heldJob || !printer || !username) {
				showGeneralError(returnToJobsView)
				return
			}

			try {
				await releasePrintJobToPrinterForUser(
					{
						jobId: heldJob.id,
						printerName: printer.printerName,
						username: username,
					},
					{},
				)
				Alert.alert(
					'Job Successfully Released',
					`Document "${job.documentName}" is printing at ${printer.printerName}.`,
					[{text: 'OK', onPress: returnToJobsView}],
				)
			} catch (_error) {
				Alert.alert(
					'Error Releasing Job',
					'We encountered a problem while trying to release your job to the printer. Please try again or release your job at the printer itself.',
					[{text: 'OK', onPress: returnToJobsView}],
				)
				return
			}
		},
	})

	const cancelJob = useMutation({
		mutationKey: ['printing', 'cancel', heldJob?.id],
		mutationFn: async () => {
			if (!heldJob || !username) {
				showGeneralError(returnToJobsView)

				return
			}
			try {
				await cancelPrintJobForUser(heldJob.id, username, {})
				Alert.alert(
					'Job Successfully Cancelled',
					`Document "${job.documentName}" has been removed from your print queue.`,
					[{text: 'OK', onPress: returnToJobsView}],
				)
			} catch (_error) {
				Alert.alert(
					'Error Cancelling Job',
					'We encountered a problem while trying to cancel your job. Please try again or cancel your job at the printer itself.',
					[{text: 'OK', onPress: returnToJobsView}],
				)
			}
		},
	})

	if (loadingUsername) {
		return (
			<ScrollView>
				<LoadingView />
			</ScrollView>
		)
	}

	const requestCancel = () => {
		let prompt = `Are you sure you want to cancel printing "${job.documentName}"? This cannot be undone.`
		Alert.alert('Print Job Cancellation Confirmation', prompt, [
			{text: 'Keep Job', style: 'cancel'},
			{
				text: 'Cancel Job',
				style: 'destructive',
				onPress: () => cancelJob.mutate(),
			},
		])
	}

	const requestRelease = () => {
		let prompt = `Are you sure you want to print "${job.documentName}" to ${printer?.printerName}?`
		Alert.alert('Print Job Release Confirmation', prompt, [
			{text: 'Nope!', style: 'cancel'},
			{text: 'Print', style: 'default', onPress: () => releaseJob.mutate()},
		])
	}

	let status = releaseJob.isLoading
		? 'printing'
		: cancelJob.isLoading
		  ? 'cancelling'
		  : job?.statusFormatted === 'Pending Release'
		    ? 'pending'
		    : 'complete'

	let actionAvailable = status !== 'complete' && printer

	return (
		<ScrollView>
			<Header>{job.documentName}</Header>
			<TableView>
				<JobInformation job={job} />
				{actionAvailable && (
					<React.Fragment>
						{printer && <PrinterInformation printer={printer} />}
						<Section sectionPaddingBottom={0}>
							<ButtonCell
								onPress={requestRelease}
								textStyle={styles.buttonCell}
								title={status === 'printing' ? 'Printing…' : 'Print'}
							/>
						</Section>
						<Section>
							<ButtonCell
								onPress={requestCancel}
								textStyle={[styles.buttonCell, styles.cancelButton]}
								title={status === 'cancelling' ? 'Cancelling…' : 'Cancel'}
							/>
						</Section>
					</React.Fragment>
				)}
			</TableView>
		</ScrollView>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Release job',
	headerRight: () => <DebugNoticeButton shouldShow={isStoprintMocked} />,
}
