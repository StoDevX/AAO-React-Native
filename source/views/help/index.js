// @flow

import * as React from 'react'
import semver from 'semver'
import pkg from '../../../package.json'
import {useSelector, useDispatch} from 'react-redux'
import {ScrollView, StyleSheet} from 'react-native'
import {NoticeView, LoadingView} from '@frogpond/notice'
import type {ReduxState} from '../../redux'
import {getEnabledTools} from '../../redux/parts/help'
import * as wifi from './wifi'
import {ToolView} from './tool'

const CUSTOM_TOOLS = [wifi]

const shouldBeShown = (conf) =>
	!conf.hidden &&
	(!conf.versionRange || semver.satisfies(pkg.version, conf.versionRange))

const getToolView = (config) => {
	let customView = CUSTOM_TOOLS.find((tool) => tool.toolName === config.key)
	if (!customView) {
		return [ToolView, config]
	}
	return [customView.ToolView, config]
}

export function HelpView() {
	let tools = useSelector((state: ReduxState) => state.help?.tools || [])
	let fetching = useSelector(
		(state: ReduxState) => state.help?.fetching || false,
	)

	let dispatch = useDispatch()
	let findEnabledTools = React.useCallback(() => dispatch(getEnabledTools()), [
		dispatch,
	])

	React.useEffect(() => {
		findEnabledTools()
	}, [findEnabledTools])

	if (fetching) {
		return <LoadingView text="Loading…" />
	}

	let views = tools
		.filter(shouldBeShown)
		.map(getToolView)
		.map(([Tool, conf]) => <Tool key={conf.key} config={conf} />)

	if (!views.length) {
		return <NoticeView text="No tools are enabled." />
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>{views}</ScrollView>
	)
}

HelpView.navigationOptions = {
	title: 'Help',
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 10,
	},
})
