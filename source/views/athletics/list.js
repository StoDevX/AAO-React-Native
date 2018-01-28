// @flow

import React from 'react'
import {AthleticsRow} from './row'
import LoadingView from '../components/loading'
import {NoticeView} from '../components/notice'
//import {ListRow, ListSeparator, Detail, Title} from '../components/list'
//import {Column} from '../components/layout'
//import {getTrimmedTextWithSpaces, parseHtml} from '../../lib/html'

let athleticsUrl =
	'http://athletics.stolaf.edu/services/scores_chris.aspx?format=json'

export class AthleticsView extends React.Component {
	state = {
		loaded: false,
		refreshing: true,
		error: null,
		data: null,
	}

	static navigationOptions = {
		title: 'Athletics',
	}

	componentWillMount() {
		this.fetchData()
	}

	fetchData = async () => {
		try {
			const response = await fetchJson(athleticsUrl)
			const result = response.scores

			this.setState({
				data: result,
				loaded: true,
				refreshing: false,
				error: null,
			})
		} catch (error) {
			this.setState({error: error.message})
			console.warn(error)
		}
	}

	render() {
		if (!this.state.loaded) {
			return <LoadingView />
		}

		if (this.state.error) {
			return <NoticeView text={'Error: ' + this.state.error.message} />
		}

		if (this.state.data.size < 1) {
			return <NoticeView text="Oops! We didn't find any athletic data." />
		}

		let athleticsData = this.state.data
		return <AthleticsRow data={athleticsData} />
	}
}
