import * as React from 'react'
import {StyleSheet} from 'react-native'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {DisclosureRow} from '../../components/rows'
import {helpdeskPageOptions} from './query'
import {useSelectorConfigStore} from './selector-store'
import type {HelpdeskPageType} from './page-configs'
import type {HelpdeskItem} from './types'

type Props = {
	pageType: HelpdeskPageType
	url: string
	title: string
	emptyText?: string
	onSelect: (item: HelpdeskItem) => void
}

const styles = StyleSheet.create({
	host: {flex: 1},
})

/**
 * The one list-rendering screen every Helpdesk page shares -- search, service
 * catalog, KB, services A-Z, and their category drill-downs -- so each of
 * those only has to supply what page to fetch and what a tap on a row does.
 */
export function HelpdeskList(props: Props): React.ReactNode {
	let {pageType, url, title, emptyText, onSelect} = props
	let {data = [], error, isError, isLoading, refetch} = useQuery(helpdeskPageOptions(pageType, url))
	let queryClient = useQueryClient()

	// Best-effort catch-up, once per mount: the query above already renders off
	// whatever selector config is on hand (bundled or last-cached), so this
	// can't be allowed to block or delay that. If refresh() actually pulled a
	// changed config, the results above may have been parsed under the old
	// one, so every Helpdesk query gets invalidated to reparse under the new
	// one rather than sitting stale for up to staleTime. refresh() catches its
	// own fetch/parse failures internally and never rejects, so there is no
	// error branch to handle here.
	React.useEffect(() => {
		useSelectorConfigStore
			.getState()
			.refresh(queryClient)
			.then(() => {
				queryClient.invalidateQueries({queryKey: ['helpdesk']})
			})
		// Deliberately once per mount -- see the comment above.
		// oxlint-disable-next-line react/exhaustive-deps
	}, [])

	if (isLoading) {
		return <LoadingView />
	}

	if (isError && error instanceof Error) {
		return <NoticeView text={String(error)} />
	}

	if (!data.length) {
		return <NoticeView text={emptyText ?? 'Nothing found.'} />
	}

	return (
		<Host matchContents={false} style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await refetch()
					}),
				]}
			>
				<Section title={title}>
					{data.map((item) => (
						<DisclosureRow
							key={item.id}
							detail={item.snippet}
							identifier={`helpdesk-item-${item.id}`}
							onPress={() => onSelect(item)}
							title={item.title}
						/>
					))}
				</Section>
			</List>
		</Host>
	)
}
