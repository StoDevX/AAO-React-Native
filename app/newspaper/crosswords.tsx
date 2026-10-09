import * as React from 'react'
import {Stack} from 'expo-router'
import {NoticeView} from '@frogpond/notice'

import {CrosswordsScreen} from '../../source/features/newspaper/crosswords-screen'
import {newspaperRoute} from '../../source/features/newspaper/newspaper-route'
import {usePaper} from '../../source/features/newspaper/paper-context'

/** The paper's crosswords; a paper that publishes none says so. */
function NewspaperCrosswordsPage(): React.ReactNode {
	let paper = usePaper()
	if (!paper.crosswords) {
		return (
			<>
				<Stack.Title>Crosswords</Stack.Title>
				<NoticeView
					description={`${paper.title} doesn't publish crosswords.`}
					systemImage="square.grid.3x3"
					title="No Crosswords"
				/>
			</>
		)
	}
	return <CrosswordsScreen />
}

export default newspaperRoute(NewspaperCrosswordsPage)
