import * as React from 'react'
import {useLocalSearchParams} from 'expo-router'

import {campusById} from '../../campuses'
import {useCampusParam} from '../campus/campus-param'
import {requiresSection, type GatedScreen} from '../campus/section-gate'
import {PaperProvider} from './paper-context'

/**
 * A route file's screen, shown as the paper of the campus the link names
 * (`?campus=`), else the active campus's. A campus without a paper gets the
 * section notice instead.
 */
export function newspaperRoute<P extends object>(Screen: React.ComponentType<P>): GatedScreen<P> {
	function WithPaper(props: P): React.ReactNode {
		let {campus: param} = useLocalSearchParams<{campus?: string}>()
		let campus = campusById(useCampusParam(param))
		// requiresSection has drawn the notice for a campus without one.
		if (!campus.paper) {
			return null
		}
		return (
			<PaperProvider campus={campus.id} paper={campus.paper}>
				<Screen {...props} />
			</PaperProvider>
		)
	}
	WithPaper.displayName = `newspaperRoute(${Screen.displayName ?? Screen.name})`
	return requiresSection(
		'paper',
		{title: 'Newspaper', noun: 'a student paper', systemImage: 'newspaper'},
		WithPaper,
	)
}
