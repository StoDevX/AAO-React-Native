// @flow

import * as React from 'react'
import semver from 'semver'
import pkg from '../../../package.json'
import {connect} from 'react-redux'
import {ScrollView, StyleSheet} from 'react-native'
import {NoticeView} from '../components/notice'
import LoadingView from '../components/loading'
import {type TopLevelViewPropsType} from '../types'
import {type ReduxState} from '../../flux'
import {getEnabledTools} from '../../flux/parts/help'
import * as wifi from './wifi'
import {ToolView} from './tool'
import {type ToolOptions} from './types'

const CUSTOM_TOOLS = [wifi]

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

type ReduxStateProps = {
	fetching: boolean,
	tools: Array<ToolOptions>,
}

type ReduxDispatchProps = {
	getEnabledTools: () => mixed,
}

type Props = TopLevelViewPropsType & ReduxStateProps & ReduxDispatchProps

export class HelpView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Help',
	}

	componentWillMount() {
		this.props.getEnabledTools()
	}

	render() {
		if (this.props.fetching) {
			return <LoadingView text="Loading…" />
		}

		const views = this.props.tools
			.filter(shouldBeShown)
			.map(getToolView)
			.map(([Tool, conf]) => <Tool key={conf.key} config={conf} />)

		return views.length ? (
			<ScrollView contentContainerStyle={styles.container}>views</ScrollView>
		) : (
			<NoticeView text="No tools are enabled." />
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		fetching: state.help ? state.help.fetching : false,
		tools: state.help ? state.help.tools : [],
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		getEnabledTools: () => dispatch(getEnabledTools()),
	}
}

export default connect(mapState, mapDispatch)(HelpView)

const styles = StyleSheet.create({
	container: {
		paddingTop: 10,
	},
})
