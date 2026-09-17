import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {HelpdeskList} from '../../../../source/features/helpdesk/helpdesk-list'
import {kbUrl} from '../../../../source/features/helpdesk/page-configs'
import {slugFromHref} from '../../../../source/features/helpdesk/slug-from-href'
import type {HelpdeskItem} from '../../../../source/features/helpdesk/types'

/** The top-level Knowledge Base categories -- tapping one drills into `[id]`. */
function KBView(): React.ReactNode {
	let router = useRouter()

	let openCategory = (item: HelpdeskItem) =>
		router.push({
			pathname: '/Helpdesk/KB/[id]',
			params: {id: item.id, slug: slugFromHref(item.href), title: item.title},
		})

	return <HelpdeskList onSelect={openCategory} pageType="kb" title="Knowledge Base" url={kbUrl()} />
}

export default function KBScreen(): React.ReactNode {
	return (
		<>
			<Stack.Title>Knowledge Base</Stack.Title>
			<KBView />
		</>
	)
}
