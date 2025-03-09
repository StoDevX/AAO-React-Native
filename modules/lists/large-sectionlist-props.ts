import {SectionList} from 'react-native'

// Opting out of RN's defaults (because we are dealing with a large list)
// and this seems to fix the headers from jumping all over when scrolling.
// Your mileage may vary.
// https://github.com/facebook/react-native/issues/21468#issuecomment-533214634

export const largeListProps: Pick<
	SectionList['props'],
	'initialNumToRender' | 'maxToRenderPerBatch' | 'windowSize'
> = {
	initialNumToRender: 50,
	maxToRenderPerBatch: 50,
	windowSize: 41,
}
