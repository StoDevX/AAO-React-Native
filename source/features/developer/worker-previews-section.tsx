import * as React from 'react'
import {Section, Text} from '@expo/ui/swift-ui'
import {foregroundStyle} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'

import type {CampusId} from '../../campuses'
import {ActionRow, DisclosureRow} from '../../components/rows'
import {previewServerUrl, workerPreviewsOptions} from './worker-previews'

type Props = {
	/** The campus whose path on a Preview is offered. */
	campus: CampusId
	/** The address in the Server URL field, so the Preview it names is marked. */
	currentUrl: string
	/** Puts a Preview's address in the Server URL field, as a discovered server does. */
	onSelect: (url: string) => void
}

/**
 * ccc-server's open pull requests, each deployed to a Worker Preview, listed
 * only once asked for: the list comes from GitHub through the Worker, and
 * most visits to this screen don't need it.
 */
export const WorkerPreviewsSection = ({
	campus,
	currentUrl,
	onSelect,
}: Props): React.ReactElement => {
	let {data, error, isFetching, isFetched, refetch} = useQuery(workerPreviewsOptions())

	let previews = (data ?? []).flatMap((preview) =>
		preview.previewUrl ? [{...preview, url: previewServerUrl(preview.previewUrl, campus)}] : [],
	)
	let withoutPreview = (data?.length ?? 0) - previews.length

	let footer = !isFetched
		? 'Lists ccc-server pull requests with a Worker Preview. Tap one to use it, then Save.'
		: withoutPreview > 0
			? `Tap a preview to use it, then Save. ${withoutPreview} without a preview (a fork, or a branch name too long) not shown.`
			: 'Tap a preview to use it, then Save.'

	let buttonTitle = isFetching
		? 'Fetching Previews…'
		: isFetched
			? 'Refresh Previews'
			: 'Fetch Previews'

	return (
		<Section footer={<Text>{footer}</Text>} title="Worker Previews">
			<ActionRow disabled={isFetching} onPress={() => void refetch()} title={buttonTitle} />
			{error ? <Text modifiers={[foregroundStyle(c.systemRed)]}>{error.message}</Text> : null}
			{isFetched && !error && previews.length === 0 ? (
				<Text modifiers={[foregroundStyle(c.secondaryLabel)]}>
					No open pull requests have a preview.
				</Text>
			) : null}
			{previews.map((preview) => (
				<DisclosureRow
					key={preview.number}
					destination="action"
					detail={[preview.branch]}
					detailLines={1}
					onPress={() => onSelect(preview.url)}
					tag={currentUrl === preview.url ? {text: 'Selected', color: c.systemGreen} : undefined}
					title={`#${preview.number} ${preview.title}`}
					titleLines={2}
				/>
			))}
		</Section>
	)
}
