// @flow

import * as React from 'react'
import semver from 'semver'
import pkg from '../../../package.json'
import {ScrollView, StyleSheet, RefreshControl} from 'react-native'
import {NoticeView} from '../components/notice'
import LoadingView from '../components/loading'
import {type TopLevelViewPropsType} from '../types'
import * as wifi from './wifi'
import {ToolView} from './tool'
import {type ToolOptions} from './types'

import {aaoGh} from '@app/fetch'
import {DataFetcher} from '@frogpond/data-fetcher'
import {age} from '@frogpond/age'

const CUSTOM_TOOLS = [wifi]

let helpTools = aaoGh({
	file: 'help.json',
	version: 2,
	cacheControl: {
		maxAge: age.hours(1),
		staleWhileRevalidate: true,
		staleIfOffline: true,
	},
})

const shouldBeShown = conf =>
	!conf.hidden &&
	(!conf.versionRange || semver.satisfies(pkg.version, conf.versionRange))

const getToolView = config => {
	const customView = CUSTOM_TOOLS.find(tool => tool.toolName === config.key)
	if (!customView) {
		return [ToolView, config]
	}
	return [customView.ToolView, config]
}

type Props = TopLevelViewPropsType

type DataFetcherProps = {
	helpTools: {
		data: Array<ToolOptions>,
		error: ?Error,
		loading: boolean,
		refresh: () => any,
	},
}

export class HelpView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Help',
	}

	render() {
		return (
			<DataFetcher
				error={NoticeView}
				loading={() => <LoadingView text="Loading…" />}
				render={({helpTools}: DataFetcherProps) => {
					let {refresh, data, loading} = helpTools

					let refreshControl = (
						<RefreshControl onRefresh={refresh} refreshing={loading} />
					)

					let views = data.filter(shouldBeShown)

					if (!views.length) {
						return (
							<NoticeView
								refreshControl={refreshControl}
								text="No tools are enabled."
							/>
						)
					}

					let children = views
						.map(getToolView)
						.map(([Tool, conf]) => <Tool key={conf.key} config={conf} />)

					return (
						<ScrollView
							contentContainerStyle={styles.container}
							refreshControl={refreshControl}
						>
							{children}
						</ScrollView>
					)
				}}
				resources={{helpTools}}
			/>
		)
	}
}

export default HelpView

const styles = StyleSheet.create({
	container: {
		paddingTop: 10,
	},
})
