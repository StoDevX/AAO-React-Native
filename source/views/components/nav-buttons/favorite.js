// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../touchable'
import {rightButtonStyles as styles} from './styles'

type Props = {
  onFavorite: () => any,
  favorited: boolean,
}

export class FavoriteButton extends React.PureComponent<Props> {
  render() {
    // (ios|md)-heart(-outline)
    const iconPlatform = Platform.OS === 'ios' ? 'ios' : 'md'
    const icon =
      `${iconPlatform}-heart` + (this.props.favorited ? '' : '-outline')

    return (
      <Touchable
        highlight={false}
        onPress={this.props.onFavorite}
        style={styles.button}
      >
        <Icon name={icon} style={styles.icon} />
      </Touchable>
    )
  }
}
