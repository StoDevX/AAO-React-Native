import * as React from 'react'
import {Alert, StyleSheet, ScrollView} from 'react-native'
import glamorous from 'glamorous-native'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {ButtonCell} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import {
	cancelPrintJobForUser,
	heldJobsAvailableAtPrinterForUser,
	releasePrintJobToPrinterForUser,
} from '../../lib/stoprint/api'
import {
	HeldJobsResponseOrErrorType,
	isStoprintMocked,
	showGeneralError,
} from '../../lib/stoprint'
import type {
	Printer,
	PrintJob,
	HeldJob,
	ReleaseResponseOrErrorType,
	CancelResponseOrErrorType,
} from '../../lib/stoprint'
import {loadLoginCredentials} from '../../lib/login'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'
import {DebugNoticeButton} from '@frogpond/navigation-buttons'

const styles = StyleSheet.create({
	cancelButton: {
		color: c.red,
	},
	buttonCell: {
		textAlign: 'center',
	},
})

const Header = glamorous.text({
	fontSize: 30,
	textAlign: 'center',
	marginTop: 20,
	marginHorizontal: 10,
	color: c.black,
})

function LeftDetailCell({detail, title}: {detail: string; title: string}) {
	return <Cell cellStyle="LeftDetail" detail={detail} title={title} />
}

function JobInformation({job}: {job: PrintJob}) {
	let wasPrintedAlready = job.statusFormatted === 'Sent to Printer'
	return (
		<Section header="JOB INFO" sectionTintColor={c.sectionBgColor}>
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
		<Section header="PRINTER INFO" sectionTintColor={c.sectionBgColor}>
			<LeftDetailCell detail="Name" title={printer.printerName} />
			{Boolean(printer.location) && (
				<LeftDetailCell detail="Location" title={printer.location ?? ''} />
			)}
		</Section>
	)
}

export const PrintJobReleaseView = (): JSX.Element => {
	let [heldJob, setHeldJob] = React.useState<HeldJob | null>(null)
	let [status, setStatus] = React.useState<string>('')

	let route = useRoute<RouteProp<RootStackParamList, 'PrintJobRelease'>>()
	let {job, printer} = route.params

	let navigation = useNavigation()

	const returnToJobsView = React.useCallback(() => {
		navigation.navigate('PrintJobs')
	}, [navigation])

	const getHeldJob = React.useCallback(async () => {
		if (!printer) {
			return
		}

		let response: HeldJobsResponseOrErrorType

		if (isStoprintMocked) {
			response = await heldJobsAvailableAtPrinterForUser(
				printer.printerName,
				'mockUsername',
			)
		} else {
			let {username = null} = await loadLoginCredentials()
			if (!username) {
				Alert.alert(
					'Not Logged In',
					'You are not logged in. Please open the app settings and log in.',
					[{text: 'OK'}],
				)
				return
			}

			response = await heldJobsAvailableAtPrinterForUser(
				printer.printerName,
				username,
			)
		}

		let jobId = job.id.toString()
		if (response.error) {
			showGeneralError(returnToJobsView)

			return
		}

		let heldJobMatch = response.value.find((heldJob) =>
			heldJob.id.startsWith(jobId),
		)
		if (heldJobMatch) {
			setHeldJob(heldJobMatch)
		} else {
			showGeneralError(returnToJobsView)
		}
	}, [job.id, printer, returnToJobsView])

	React.useEffect(() => {
		let formatted =
			job.statusFormatted === 'Pending Release' ? 'pending' : 'complete'

		setStatus(formatted)

		if (status === 'pending') {
			getHeldJob()
		}
	}, [getHeldJob, job.statusFormatted, status])

	const requestCancel = () => {
		let prompt = `Are you sure you want to cancel printing "${job.documentName}"? This cannot be undone.`
		Alert.alert('Print Job Cancellation Confirmation', prompt, [
			{text: 'Keep Job', style: 'cancel'},
			{text: 'Cancel Job', style: 'destructive', onPress: cancelJob},
		])
	}

	const requestRelease = () => {
		let prompt = `Are you sure you want to print "${job.documentName}" to ${printer?.printerName}?`
		Alert.alert('Print Job Release Confirmation', prompt, [
			{text: 'Nope!', style: 'cancel'},
			{text: 'Print', style: 'default', onPress: releaseJob},
		])
	}

	const releaseJob = async () => {
		if (!printer) {
			return
		}

		setStatus('printing')
		let {username} = await loadLoginCredentials()
		if (!heldJob || !username) {
			showGeneralError(returnToJobsView)

			return
		}
		let response: ReleaseResponseOrErrorType =
			await releasePrintJobToPrinterForUser({
				jobId: heldJob.id,
				printerName: printer.printerName,
				username: username,
			})
		if (response.error) {
			Alert.alert(
				'Error Releasing Job',
				'We encountered a problem while trying to release your job to the printer. Please try again or release your job at the printer itself.',
				[{text: 'OK', onPress: returnToJobsView}],
			)
		} else {
			Alert.alert(
				'Job Successfully Released',
				`Document "${job.documentName}" is printing at ${printer.printerName}.`,
				[{text: 'OK', onPress: returnToJobsView}],
			)
		}
	}

	const cancelJob = async () => {
		setStatus('cancelling')

		const {username} = await loadLoginCredentials()

		if (!heldJob || !username) {
			showGeneralError(returnToJobsView)

			return
		}
		let response: CancelResponseOrErrorType = await cancelPrintJobForUser(
			heldJob.id,
			username,
		)
		if (response.error) {
			Alert.alert(
				'Error Cancelling Job',
				'We encountered a problem while trying to cancel your job. Please try again or cancel your job at the printer itself.',
				[{text: 'OK', onPress: returnToJobsView}],
			)
		} else {
			Alert.alert(
				'Job Successfully Cancelled',
				`Document "${job.documentName}" has been removed from your print queue.`,
				[{text: 'OK', onPress: returnToJobsView}],
			)
		}
	}

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
