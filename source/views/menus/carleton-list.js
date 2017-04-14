// @flow
import React from 'react'
import {View, Platform, ScrollView, StyleSheet} from 'react-native'
import type {TopLevelViewPropsType} from '../types'
import type {CarletonDetailMenuType} from './types'
import {Row} from '../components/layout'
import {ListRow, ListSeparator, Title} from '../components/list'
import {NoticeView} from '../components/notice'
import {BonAppHostedMenu} from './menu-bonapp'

const carleton = [
  {
    id: 'CarletonBurtonMenuView',
    title: 'Burton',
    rnVectorIcon: {iconName: 'trophy'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '35',
      loadingMessage: ['Searching for Schiller…'],
    },
  },
  {
    id: 'CarletonLDCMenuView',
    title: 'LDC',
    rnVectorIcon: {iconName: 'water'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '36',
      loadingMessage: ['Tracking down empty seats…'],
    },
  },
  {
    id: 'CarletonWeitzMenuView',
    title: 'Weitz Center',
    rnVectorIcon: {iconName: 'wine'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '458',
      loadingMessage: ['Observing the artwork…', 'Previewing performances…'],
    },
  },
  {
    id: 'CarletonSaylesMenuView',
    title: 'Sayles Hill',
    rnVectorIcon: {iconName: 'snow'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '34',
      loadingMessage: ['Engaging in people-watching…', 'Checking the mail…'],
    },
  },
]

const styles = StyleSheet.create({
  rowText: {
    paddingVertical: 6,
  },
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
})

export class CarletonMenuPicker extends React.Component {
  props: TopLevelViewPropsType

  onPressRow = (data: CarletonDetailMenuType) => {
    this.props.navigator.push({
      id: 'BonAppHostedMenu',
      title: data.title,
      backButtonTitle: 'Carleton',
      index: this.props.route.index + 1,
      props: {
        name: data.title,
        loadingMessage: data.props.loadingMessage,
        cafeId: data.props.cafeId,
      },
    })
  }

  render() {
    if (!carleton) {
      return <NoticeView text="No Carleton Cafes to choose." />
    }

    return (
      <ScrollView style={styles.container}>
        {carleton.map((loc: CarletonDetailMenuType, i, collection) => (
          <View key={i}>
            <ListRow
              onPress={() => this.onPressRow(loc)}
              arrowPosition="center"
            >
              <Row alignItems="center">
                <Title style={styles.rowText}>{loc.title}</Title>
              </Row>
            </ListRow>
            {i < collection.length - 1
              ? <ListSeparator spacing={{left: 15}} />
              : null}
          </View>
        ))}
      </ScrollView>
    )
  }
}
