// @flow
/* eslint-disable no-await-in-loop */

import React from 'react'
import {
  Button,
  Dimensions,
  Navigator,
  Picker,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native'

import delay from 'delay'
import {takeSnapshot, dirs} from 'react-native-view-shot'
import get from 'lodash/get'
import flatten from 'lodash/flatten'
import toPairs from 'lodash/toPairs'

import * as c from '../views/components/colors'
import {StyledAlphabetListView} from '../views/components/alphabet-listview'
StyledAlphabetListView.initialListSize = 18

import CalendarView from '../views/calendar'

import {ContactsView} from '../views/contacts'

import {DictionaryView} from '../views/dictionary'

import {HomeView, EditHomeView} from '../views/home'

import StreamingView from '../views/streaming'
import KSTOView from '../views/streaming/radio'
import {WebcamsView} from '../views/streaming/webcams'

import {MenusView} from '../views/menus'

import NewsView from '../views/news'

import SISView from '../views/sis'
import BalancesView from '../views/sis/balances'

import {BuildingHoursView} from '../views/building-hours'

import TransportationView from '../views/transportation'

import SettingsView from '../views/settings'
import CreditsView from '../views/settings/credits'
import PrivacyView from '../views/settings/privacy'
import LegalView from '../views/settings/legal'
import CredentialsLoginSection from '../views/settings/sections/login-credentials'
import OddsAndEndsSection from '../views/settings/sections/odds-and-ends'
import SupportSection from '../views/settings/sections/support'
import {FaqView} from '../views/faqs'

import {StudentOrgsView} from '../views/student-orgs'

const {DocumentDir} = dirs
const outputDir = `${DocumentDir}/aao-view-shots`

type ViewCollectionType = {
  [key: string]: {
    [key: string]: {
      view: ReactClass<*>,
      delay: number,
    },
  },
}

const Nav = ({children}: {children?: Function}) => (
  <Navigator
    renderScene={(route, navigator) => children && children({route, navigator})}
  />
)

export class SnapshotsView extends React.Component {
  static navigationOptions = {
    title: 'Snapshot Time',
  }

  _ref: any

  state = {
    viewPath: 'streaming.radio',
  }

  views: ViewCollectionType = {
    buildinghours: {
      list: {
        view: () => <Nav>{props => <BuildingHoursView {...props} />}</Nav>,
        delay: 1500,
      },
    },
    calendar: {
      tabs: {
        view: () => <Nav>{props => <CalendarView {...props} />}</Nav>,
        delay: 1000,
      },
    },
    contacts: {
      list: {
        view: () => <Nav>{props => <ContactsView {...props} />}</Nav>,
        delay: 100,
      },
    },
    dictionary: {
      list: {
        view: () => <Nav>{props => <DictionaryView {...props} />}</Nav>,
        delay: 1000,
      },
    },
    home: {
      home: {view: () => <HomeView />, delay: 100},
      edit: {view: () => <EditHomeView />, delay: 500},
    },
    menus: {
      tabs: {
        view: () => <Nav>{props => <MenusView {...props} />}</Nav>,
        delay: 2000,
      },
    },
    news: {
      tabs: {
        view: () => <Nav>{props => <NewsView {...props} />}</Nav>,
        delay: 5000,
      },
    },
    settings: {
      index: {
        view: () => <Nav>{props => <SettingsView {...props} />}</Nav>,
        delay: 100,
      },
      credits: {view: () => <CreditsView />, delay: 100},
      faqs: {view: () => <FaqView />, delay: 100},
      legal: {view: () => <LegalView />, delay: 100},
      privacy: {view: () => <PrivacyView />, delay: 100},
      'section-credentials': {
        view: () => <CredentialsLoginSection />,
        delay: 100,
      },
      'section-support': {
        view: () => <Nav>{props => <SupportSection {...props} />}</Nav>,
        delay: 100,
      },
      'section-odds and ends': {
        view: () => <Nav>{props => <OddsAndEndsSection {...props} />}</Nav>,
        delay: 100,
      },
    },
    sis: {
      tabs: {
        view: () => <Nav>{props => <SISView {...props} />}</Nav>,
        delay: 100,
      },
      balances: {view: () => <BalancesView />, delay: 100},
    },
    streaming: {
      tabs: {view: () => <StreamingView />, delay: 100},
      radio: {
        view: () => <Nav>{props => <KSTOView {...props} />}</Nav>,
        delay: 100,
      },
      webcams: {view: () => <WebcamsView />, delay: 1000},
    },
    studentorgs: {
      list: {
        view: () => <Nav>{props => <StudentOrgsView {...props} />}</Nav>,
        delay: 2500,
      },
    },
    transit: {
      tabs: {view: () => <TransportationView />, delay: 100},
    },
  }

  saveSnapshot = () => {
    const name = this.state.viewPath
    return takeSnapshot(this._ref, {
      format: 'png',
      path: `${outputDir}/${name}.png`,
    }).then(
      uri => console.log('saved to', uri),
      err => console.error('snapstho failed', err),
    )
  }

  saveAll = async () => {
    for (const [parent, child] of this.viewsAsList()) {
      const viewPath = `${parent}.${child}`
      const args = get(this.views, viewPath)

      this.setState({viewPath})
      await delay(args.delay || 1000)
      await this.saveSnapshot()
    }
  }

  viewsAsList = () => {
    // goes from {name: {inner: {}}} to [[name, inner]]
    const choices = toPairs(this.views).map(([key, val]) =>
      toPairs(val).map(([innerKey]) => [key, innerKey]),
    )

    return flatten(choices)
  }

  onChangeView = (value: string) => {
    this.setState({viewPath: value})
  }

  render() {
    const selected = get(this.views, this.state.viewPath, {})

    const options = this.viewsAsList().map(([parent, child]) => (
      <Picker.Item
        key={`${parent}.${child}`}
        label={`${parent} ❯ ${child}`}
        value={`${parent}.${child}`}
      />
    ))

    const height = Dimensions.get('window').height
    const heightDiff = Platform.OS === 'ios' ? 64 : 56

    const childStyle = {
      height: height - heightDiff,
    }

    return (
      <ScrollView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.settings}>
          <Picker
            onValueChange={this.onChangeView}
            selectedValue={this.state.viewPath}
          >
            {options}
          </Picker>

          <View style={styles.buttonBar}>
            <Button onPress={this.saveSnapshot} title="Snapshot" />
            <Button onPress={this.saveAll} title="Run All" />
          </View>
        </View>

        <View
          ref={ref => (this._ref = ref)}
          style={[styles.viewContainer, childStyle]}
        >
          {selected.view()}
        </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settings: {
    backgroundColor: c.white,
  },
  buttonBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  viewContainer: {
    ...Platform.select({
      ios: {
        backgroundColor: c.iosLightBackground,
      },
      android: {
        backgroundColor: c.androidLightBackground,
      },
    }),
  },
})
