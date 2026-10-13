import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, Section, Text} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {format} from 'date-fns'

import {LoadErrorView, LoadingView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {useQuery} from '@tanstack/react-query'

import {carleton} from '../../../source/campuses/edu-carleton'
import {DisclosureRow} from '../../../source/components/rows'
import {sectionServer} from '../../../source/features/campus/section-server'
import {archivedConvosOptions} from '../../../source/features/carleton/convos'

/** Carleton's screen, reachable by URL from any campus, so it asks Carleton's convos server. */
const SERVER = sectionServer(carleton.id, carleton.convos)

export default function ArchivedConvosPage(): React.ReactNode {
	let {data, error, refetch, isLoading} = useQuery(archivedConvosOptions(SERVER))

	if (isLoading) {
		return <LoadingView />
	}

	// A failed refresh keeps the recordings already loaded; only a list never loaded shows the error.
	if (!data) {
		return <LoadErrorView error={error} onRetry={refetch} />
	}

	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await refetch()
					}),
				]}
			>
				{data.length === 0 ? (
					<ContentUnavailableView systemImage="waveform" title="No recordings found." />
				) : (
					<Section footer={<Text>Recordings open in your browser.</Text>}>
						{data.map((convo) => (
							<DisclosureRow
								key={convo.recordingUrl}
								destination="external"
								detail={[format(convo.published, 'MMMM d, yyyy'), convo.description]}
								detailLines={3}
								image={{systemName: convo.isVideo ? 'play.rectangle' : 'headphones'}}
								onPress={() => openUrl(convo.recordingUrl)}
								title={convo.title}
								titleLines={2}
							/>
						))}
					</Section>
				)}
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})
