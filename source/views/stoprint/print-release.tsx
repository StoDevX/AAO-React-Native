import * as React from 'react'
import {Alert, StyleSheet, ScrollView} from 'react-native'
import type {TopLevelViewPropsType} from '../types'
import glamorous from 'glamorous-native'
import {TableView, Section, Cell, ButtonCell} from '@frogpond/tableview'
import * as c from '@frogpond/colors'
import {
	cancelPrintJobForUser,
	heldJobsAvailableAtPrinterForUser,
	releasePrintJobToPrinterForUser,
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

type Props = TopLevelViewPropsType & {
	navigation: {
		state: {params: {job: PrintJob; printer?: Printer}}
	}
}

type State = {
	heldJob?: HeldJob
	status: 'complete' | 'pending' | 'printing' | 'cancelling'
}

export class PrintJobReleaseView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Release Job',
	}

	state = {
		heldJob: null,
		status:
			this.props.navigation.state.params.job.statusFormatted ===
			'Pending Release'
				? 'pending'
				: 'complete',
	}

	componentDidMount() {
		if (this.state.status === 'pending') {
			this.getHeldJob()
		}
	}

	getHeldJob = async () => {
		let {username = null} = await loadLoginCredentials()
		if (!username) {
			Alert.alert(
				'Not Logged In',
				'You are not logged in. Please open the app settings and log in.',
				[{text: 'OK'}],
			)
			return
		}

		let {job, printer} = this.props.navigation.state.params
		let jobId = job.id.toString()
		let response = await heldJobsAvailableAtPrinterForUser(
			printer.printerName,
			username,
		)

		if (response.error) {
			showGeneralError(this.returnToJobsView)
			return
		}

		let heldJobMatch = response.value.find((heldJob) =>
			heldJob.id.startsWith(jobId),
		)
		if (heldJobMatch) {
			this.setState(() => ({heldJob: heldJobMatch}))
		} else {
			showGeneralError(this.returnToJobsView)
		}
	}

	requestCancel = () => {
		let {job} = this.props.navigation.state.params
		let prompt = `Are you sure you want to cancel printing "${job.documentName}"? This cannot be undone.`
		Alert.alert('Print Job Cancellation Confirmation', prompt, [
			{text: 'Keep Job', style: 'cancel'},
			{text: 'Cancel Job', style: 'destructive', onPress: this.cancelJob},
		])
	}

	requestRelease = () => {
		let {job, printer} = this.props.navigation.state.params
		let prompt = `Are you sure you want to print "${job.documentName}" to ${printer.printerName}?`
		Alert.alert('Print Job Release Confirmation', prompt, [
			{text: 'Nope!', style: 'cancel'},
			{text: 'Print', style: 'default', onPress: this.releaseJob},
		])
	}

	releaseJob = async () => {
		this.setState(() => ({status: 'printing'}))
		let {printer, job} = this.props.navigation.state.params
		let {username} = await loadLoginCredentials()
		let {heldJob} = this.state
		if (!heldJob || !username) {
			showGeneralError(this.returnToJobsView)
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
				[{text: 'OK', onPress: this.returnToJobsView}],
			)
		} else {
			Alert.alert(
				'Job Successfully Released',
				`Document "${job.documentName}" is printing at ${printer.printerName}.`,
				[{text: 'OK', onPress: this.returnToJobsView}],
			)
		}
	}

	cancelJob = async () => {
		this.setState(() => ({status: 'cancelling'}))
		let {username, job} = this.props.navigation.state.params
		let {heldJob} = this.state
		if (!heldJob) {
			showGeneralError(this.returnToJobsView)
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
				[{text: 'OK', onPress: this.returnToJobsView}],
			)
		} else {
			Alert.alert(
				'Job Successfully Cancelled',
				`Document "${job.documentName}" has been removed from your print queue.`,
				[{text: 'OK', onPress: this.returnToJobsView}],
			)
		}
	}

	returnToJobsView = () => {
		this.props.navigation.navigate('PrintJobsView')
	}

	render() {
		let {job, printer} = this.props.navigation.state.params
		let {status} = this.state
		let actionAvailable = status !== 'complete' && printer
		return (
			<ScrollView>
				<Header>{job.documentName}</Header>
				<TableView>
					<JobInformation job={job} />
					{actionAvailable && (
						<React.Fragment>
							<PrinterInformation printer={printer} />
							<Section sectionPaddingBottom={0}>
								<ButtonCell
									onPress={this.requestRelease}
									textStyle={styles.buttonCell}
									title={status === 'printing' ? 'Printing…' : 'Print'}
								/>
							</Section>
							<Section>
								<ButtonCell
									onPress={this.requestCancel}
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
}
