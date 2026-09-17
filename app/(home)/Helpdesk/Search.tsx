import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {useDebounce} from '@frogpond/use-debounce'
import {NoticeView} from '@frogpond/notice'
import {SearchBar} from '../../../source/components/search-bar'
import {HelpdeskList} from '../../../source/features/helpdesk/helpdesk-list'
import {searchUrl} from '../../../source/features/helpdesk/page-configs'
import type {HelpdeskItem} from '../../../source/features/helpdesk/types'

function HelpdeskSearchView(): React.ReactNode {
	let router = useRouter()
	let [typedQuery, setTypedQuery] = React.useState('')
	let query = useDebounce(typedQuery, 500)

	let openItem = (item: HelpdeskItem) =>
		router.push({pathname: '/Helpdesk/Detail', params: {url: item.href, title: item.title}})

	// The search chrome is bound to component state (the change handler
	// updates typedQuery), so it can't move to a static outer component.
	// Compute it once and render it in every branch, so the user always has a
	// search bar to type into or clear.
	let searchChrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setTypedQuery} value={typedQuery} />
		</>
	)

	if (!query) {
		return (
			<>
				<NoticeView text="Search the campus Knowledge Base and Service Catalog." />
				{searchChrome}
			</>
		)
	}

	return (
		<>
			<HelpdeskList
				emptyText={`No results found for "${query}".`}
				onSelect={openItem}
				pageType="search"
				title={`Results for "${query}"`}
				url={searchUrl(query)}
			/>
			{searchChrome}
		</>
	)
}

export default function HelpdeskSearch(): React.ReactNode {
	return (
		<>
			<Stack.Title>Search</Stack.Title>
			<HelpdeskSearchView />
		</>
	)
}
