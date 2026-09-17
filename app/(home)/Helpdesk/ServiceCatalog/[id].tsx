import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {NoticeView} from '@frogpond/notice'
import {HelpdeskList} from '../../../../source/features/helpdesk/helpdesk-list'
import {serviceCatalogCategoryUrl} from '../../../../source/features/helpdesk/page-configs'
import type {HelpdeskItem} from '../../../../source/features/helpdesk/types'

/** One Service Catalog category's services -- tapping one opens the WebView `Detail` screen. */
export default function ServiceCatalogCategoryScreen(): React.ReactNode {
	let router = useRouter()
	let {id, slug, title} = useLocalSearchParams<{id: string; slug?: string; title?: string}>()

	let openService = (item: HelpdeskItem) =>
		router.push({pathname: '/Helpdesk/Detail', params: {url: item.href, title: item.title}})

	let screenTitle = <Stack.Screen options={{title: title ?? 'Service Catalog'}} />

	// `id` is the dynamic route segment, so expo-router always supplies it.
	// `slug` is an extra param this app's own ServiceCatalog list attaches to
	// every push, so a missing value means a bad or malformed link rather than
	// anything this screen can recover from.
	if (!slug) {
		return (
			<>
				{screenTitle}
				<NoticeView text="Could not find this category." />
			</>
		)
	}

	return (
		<>
			{screenTitle}
			<HelpdeskList
				onSelect={openService}
				pageType="serviceCatalogCategory"
				title={title ?? 'Service Catalog'}
				url={serviceCatalogCategoryUrl(id, slug)}
			/>
		</>
	)
}
