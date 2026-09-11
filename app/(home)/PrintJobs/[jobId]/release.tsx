import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useMutation, useQuery} from '@tanstack/react-query'
import {Alert, StyleSheet} from 'react-native'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listStyle,
	multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers'
import {ActionRow, DetailRow} from '../../../../source/components/rows'
import * as c from '@frogpond/colors'
import {
	cancelPrintJobForUser,
	releasePrintJobToPrinterForUser,
} from '../../../../source/lib/stoprint/api'
import {
	isStoprintMocked,
	showGeneralError,
	type Printer,
	type PrintJob,
} from '../../../../source/lib/stoprint'
import {stoprintUsername} from '../../../../source/features/stoprint/lib'
import {
	heldJobsOptions,
	jobByIdOptions,
	printerByNameOptions,
} from '../../../../source/features/stoprint/query'
import {credentialsOptions} from '../../../../source/lib/login'
import {LoadingView, NoticeView} from '@frogpond/notice'

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

/// `frame(maxWidth: Infinity)` before the alignment: a Text is only as wide as
/// its content, so centring inside that says nothing about the row it sits in.
const DOCUMENT_NAME_MODIFIERS = [
	font({textStyle: 'title', weight: 'semibold'}),
	foregroundStyle(c.label),
	frame({maxWidth: Infinity}),
	multilineTextAlignment('center'),
]

function JobInformation({job}: {job: PrintJob}) {
	let wasPrintedAlready = job.statusFormatted === 'Sent to Printer'
	return (
		<Section title="JOB INFO">
			<DetailRow label="Status" value={job.statusFormatted} />
			<DetailRow label="Time" value={job.usageTimeFormatted} />
			<DetailRow label="Pages" value={job.totalPages.toString()} />
			<DetailRow label="Cost" value={job.usageCostFormatted} />
			<DetailRow label="Grayscale" value={job.grayscaleFormatted} />
			<DetailRow label="Paper Size" value={job.paperSizeFormatted} />
			{wasPrintedAlready ? <DetailRow label="Printer" value={job.printerName} /> : null}
		</Section>
	)
}

function PrinterInformation({printer}: {printer: Printer}) {
	return (
		<Section title="PRINTER INFO">
			<DetailRow label="Name" value={printer.printerName} />
			{Boolean(printer.location) && <DetailRow label="Location" value={printer.location ?? ''} />}
		</Section>
	)
}

type PrintJobReleaseViewProps = {
	job: PrintJob
	printer?: Printer
}

function PrintJobReleaseView({job, printer}: PrintJobReleaseViewProps): React.ReactNode {
	let router = useRouter()

	let {data: credentials, isLoading: loadingUsername} = useQuery(credentialsOptions)
	let username = stoprintUsername(credentials, isStoprintMocked)

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

	if (loadingUsername && !isStoprintMocked) {
		return <LoadingView />
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
		<Host style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				<Section>
					<Text modifiers={DOCUMENT_NAME_MODIFIERS}>{job.documentName}</Text>
				</Section>

				<JobInformation job={job} />

				{actionAvailable ? (
					<>
						{printer ? <PrinterInformation printer={printer} /> : null}
						<Section>
							<ActionRow
								disabled={status !== 'pending'}
								onPress={requestRelease}
								title={status === 'printing' ? 'Printing…' : 'Print'}
							/>
							{/* Destructive, and last: cancelling a job cannot be undone,
							    so it sits apart from the action a reader came here for. */}
							<ActionRow
								destructive={true}
								disabled={status !== 'pending'}
								onPress={requestCancel}
								title={status === 'cancelling' ? 'Cancelling…' : 'Cancel'}
							/>
						</Section>
					</>
				) : null}
			</List>
		</Host>
	)
}

function PrintJobReleaseLoader(): React.ReactNode {
	let {jobId, printer: printerName} = useLocalSearchParams<{
		jobId: string
		printer?: string
	}>()

	let {data: credentials, isLoading: credentialsLoading} = useQuery(credentialsOptions)
	let username = stoprintUsername(credentials, isStoprintMocked)

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

	if ((credentialsLoading && !isStoprintMocked) || jobLoading || printerLoading) {
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
