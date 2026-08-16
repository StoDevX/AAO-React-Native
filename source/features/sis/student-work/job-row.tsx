import * as React from 'react'
import {Column, Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import type {JobSummary} from '@frogpond/ccc-jobs'
import {format, isValid, parseISO} from 'date-fns'

type Props = {
	onPress: (job: JobSummary) => void
	job: JobSummary
}

/// `PostedDate` is a plain `YYYY-MM-DD` with no zone, parsed as local time so
/// the date a student sees is the date Oracle published.
function postedOn(postedDate: string): string | undefined {
	let parsed = parseISO(postedDate)
	return isValid(parsed) ? `Posted ${format(parsed, 'MMMM d, yyyy')}` : undefined
}

export const JobRow = (props: Props): React.ReactNode => {
	let {job} = props
	let posted = postedOn(job.postedDate)

	return (
		<ListRow arrowPosition="top" onPress={() => props.onPress(job)}>
			<Row alignItems="center">
				<Column flex={1}>
					<Title lines={2}>{job.title}</Title>
					{posted ? <Detail lines={1}>{posted}</Detail> : null}
				</Column>
			</Row>
		</ListRow>
	)
}
