// @flow
import React from 'react'
import {Cell} from 'react-native-tableview-simple'
import {SectionWithNullChildren} from '../../components/section-with-null-children'
import type {TopLevelViewPropsType} from '../../types'
import {LoginButton} from '../components/login-button'

export class TokenLoginSection extends React.Component {
  state = {
    loading: false,
  }

  props: TopLevelViewPropsType & {
    loggedIn: boolean,
    logIn: (tokenStatus: boolean) => any,
    logOut: () => any,
    message: ?string,
  }

  logIn = () => {
    this.props.navigator.push({
      id: 'SISLoginView',
      index: this.props.route.index + 1,
      sceneConfig: 'fromBottom',
      onDismiss: (route, navigator) => navigator.pop(),
      props: {
        onLoginComplete: this.props.logIn,
      },
    })
  }

  logOut = () => {
    this.props.logOut()
  }

  render() {
    let {loggedIn, message} = this.props
    let {loading} = this.state

    return (
      <SectionWithNullChildren
        header='GOOGLE LOGIN'
        footer='Google login allows SIS access, which enables flex dollars, ole dollars, and course information.'
      >
        {message ? <Cell title={'⚠️ ' + message} /> : null}

        <LoginButton
          loading={loading}
          loggedIn={loggedIn}
          label='Google'
          onPress={loggedIn ? this.logOut : this.logIn}
        />
      </SectionWithNullChildren>
    )
  }
}
