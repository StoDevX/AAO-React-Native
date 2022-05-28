import {Platform} from 'react-native'

import {LinkTable as LinkTableIos} from './link-table-ios'
import {LinkTable as LinkTableAndroid} from './link-table-android'

export const LinkTable = Platform.OS === 'ios' ? LinkTableIos : LinkTableAndroid
