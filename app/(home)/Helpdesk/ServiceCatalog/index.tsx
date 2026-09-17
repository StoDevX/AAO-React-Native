import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {HelpdeskList} from '../../../../source/features/helpdesk/helpdesk-list'
import {serviceCatalogUrl} from '../../../../source/features/helpdesk/page-configs'
import {slugFromHref} from '../../../../source/features/helpdesk/slug-from-href'
import type {HelpdeskItem} from '../../../../source/features/helpdesk/types'

/** The top-level Service Catalog categories -- tapping one drills into `[id]`. */
function ServiceCatalogView(): React.ReactNode {
	let router = useRouter()

	let openCategory = (item: HelpdeskItem) =>
		router.push({
			pathname: '/Helpdesk/ServiceCatalog/[id]',
			params: {id: item.id, slug: slugFromHref(item.href), title: item.title},
		})

	return (
		<HelpdeskList
			onSelect={openCategory}
			pageType="serviceCatalog"
			title="Service Catalog"
			url={serviceCatalogUrl()}
		/>
	)
}

export default function ServiceCatalogScreen(): React.ReactNode {
	return (
		<>
			<Stack.Title>Service Catalog</Stack.Title>
			<ServiceCatalogView />
		</>
	)
}
