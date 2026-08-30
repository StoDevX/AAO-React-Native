import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useMutation, useQuery} from '@tanstack/react-query'
import {Alert, StyleSheet, ScrollView, Text, TextProps} from 'react-native'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {ButtonCell} from '@frogpond/tableview/cells'
import * as c from '@frogpond/colors'
import {
	cancelPrintJobForUser,
	releasePrintJobToPrinterForUser,
} from '../../../../source/lib/stoprint/api'
import {showGeneralError, type Printer, type PrintJob} from '../../../../source/lib/stoprint'
import {
	heldJobsOptions,
	jobByIdOptions,
	printerByNameOptions,
} from '../../../../source/features/stoprint/query'
import {credentialsOptions} from '../../../../source/lib/login'
import {LoadingView, NoticeView} from '@frogpond/notice'

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

const Header = (props: TextProps) => <Text {...props} style={[styles.header, props.style]} />

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
			{wasPrintedAlready && <LeftDetailCell detail="Printer" title={job.printerName} />}
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

type PrintJobReleaseViewProps = {
	job: PrintJob
	printer?: Printer
}

function PrintJobReleaseView({job, printer}: PrintJobReleaseViewProps): React.ReactNode {
	let router = useRouter()

	let {data: username = '', isLoading: loadingUsername} = useQuery({
		...credentialsOptions,
		select: (data) => data?.username,
	})

	let {data: heldJobs = []} = useQuery(heldJobsOptions(username, printer?.printerName))
	let jobId = job.id.toString()
	let heldJob = heldJobs.find((item) => item.id.startsWith(jobId))

	const returnToJobsView = React.useCallback(() => {
		router.push('/PrintJobs')
	}, [router])

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
			<ScrollView contentInsetAdjustmentBehavior="automatic">
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

	let status = releaseJob.isPending
		? 'printing'
		: cancelJob.isPending
			? 'cancelling'
			: job?.statusFormatted === 'Pending Release'
				? 'pending'
				: 'complete'

	let actionAvailable = status !== 'complete' && printer

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
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

function PrintJobReleaseLoader(): React.ReactNode {
	let {jobId, printer: printerName} = useLocalSearchParams<{
		jobId: string
		printer?: string
	}>()

	let {data: username = '', isLoading: credentialsLoading} = useQuery({
		...credentialsOptions,
		select: (data) => data?.username,
	})

	let {
		data: job,
		isLoading: jobLoading,
		error: jobError,
		refetch: jobRefetch,
	} = useQuery(jobByIdOptions(username, jobId))

	let {
		data: printer,
		isLoading: printerLoading,
		error: printerError,
		refetch: printerRefetch,
	} = useQuery(printerByNameOptions(username, printerName))

	if (credentialsLoading || jobLoading || printerLoading) {
		return <LoadingView text="Loading…" />
	}

	if (jobError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={jobRefetch}
				text={`A problem occured while loading: ${
					jobError instanceof Error ? jobError.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!job) {
		return <NoticeView text="Could not find this print job." />
	}

	if (printerName !== undefined && printerError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={printerRefetch}
				text={`A problem occured while loading: ${
					printerError instanceof Error ? printerError.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (printerName !== undefined && !printer) {
		return <NoticeView text="Could not find this printer." />
	}

	return <PrintJobReleaseView job={job} printer={printer} />
}

export default function PrintJobReleasePage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Release job</Stack.Title>
			<PrintJobReleaseLoader />
		</>
	)
}
