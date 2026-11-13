import {requiresSection} from '../../source/features/campus/section-gate'
import {StreamingMediaTabs} from '../../source/features/streaming/media-tabs'

// The tabs are platform files outside app/: Expo Router bundles every file in
// app/ on every platform, so an Android-only layout here would ship to iOS too.
export default requiresSection(
	'streaming',
	{title: 'Streaming Media', noun: 'webcams or streams', systemImage: 'video'},
	StreamingMediaTabs,
)
