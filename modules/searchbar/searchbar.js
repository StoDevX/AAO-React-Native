// @flow

import {Platform} from 'react-native'

import {SearchBar as AndroidSearchBar} from './searchbar-android'
import {SearchBar as IosSearchBar} from './searchbar-ios'

export const SearchBar = Platform.OS === 'ios' ? IosSearchBar : AndroidSearchBar
