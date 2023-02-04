import * as React from 'react'
import {Icon, platformPrefixIconName} from '@frogpond/icon'
import * as c from '@frogpond/colors'
import {commonStyles, rightButtonStyles} from './styles'
import {HeaderBackButtonProps} from '@react-navigation/native-stack/lib/typescript/src/types'

export function OpenSettingsButton(_props: HeaderBackButtonProps): JSX.Element {
	return (
		<Icon
			name={platformPrefixIconName('ellipsis-horizontal-circle')}
			style={[commonStyles.button, rightButtonStyles.icon, {color: c.label}]}
			testID="button-open-settings"
		/>
	)
}
