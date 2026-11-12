import {ConvocationTabs} from '../../../source/features/carleton/convocation-tabs'

// The tabs are platform files outside app/: Expo Router bundles every file in
// app/ on every platform, so an Android-only layout here would ship to iOS too.
export default ConvocationTabs
