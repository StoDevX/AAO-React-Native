import * as React from 'react'
import {Stack, useRouter} from 'expo-router'
import {HelpdeskList} from '../../../source/features/helpdesk/helpdesk-list'
import {servicesAtoZUrl} from '../../../source/features/helpdesk/page-configs'
import type {HelpdeskItem} from '../../../source/features/helpdesk/types'

/** The flat, alphabetical list of every Helpdesk service -- tapping one opens its detail page. */
function ServicesAtoZView(): React.ReactNode {
	let router = useRouter()

	let openService = (item: HelpdeskItem) =>
		router.push({pathname: '/Helpdesk/Detail', params: {url: item.href, title: item.title}})

	return (
		<HelpdeskList
			onSelect={openService}
			pageType="servicesAtoZ"
			title="Services A-Z"
			url={servicesAtoZUrl()}
		/>
	)
}

export default function ServicesAtoZScreen(): React.ReactNode {
	return (
		<>
			<Stack.Title>Services A-Z</Stack.Title>
			<ServicesAtoZView />
		</>
	)
}
