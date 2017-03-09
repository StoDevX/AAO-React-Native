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
import {white} from '../views/components/colors'

import CalendarView from '../views/calendar'

import {ContactsView} from '../views/contacts'

import {DictionaryView, DictionaryDetailView} from '../views/dictionary'

import {HomeView, EditHomeView} from '../views/home'

import StreamingView from '../views/streaming'
import KSTOView from '../views/streaming/radio'
import WebcamsView from '../views/streaming/webcams'

import {MenusView} from '../views/menus'
import {BonAppHostedMenu} from '../views/menus/menu-bonapp'
import {FilterView} from '../views/components/filter'

import NewsView from '../views/news'
import NewsItemView from '../views/news/news-item'

import SISView from '../views/sis'
import BalancesView from '../views/sis/balances'

import {
  BuildingHoursView,
  BuildingHoursDetailView,
} from '../views/building-hours'

import TransportationView from '../views/transportation'

import SettingsView from '../views/settings'
import CreditsView from '../views/settings/credits'
import PrivacyView from '../views/settings/privacy'
import LegalView from '../views/settings/legal'
import {FaqView} from '../views/faqs'

import {StudentOrgsView, StudentOrgsDetailView} from '../views/student-orgs'

const {DocumentDir} = dirs
const outputDir = `${DocumentDir}/aao-view-shots`

type ViewCollectionType = {
  [key: string]: {
    [key: string]: {
      view: ReactClass<*>,
      delay: number,
    },
  },
};

const defaultProps = {
  navigator: Navigator,
  route: {id: '', title: '', index: 0},
}

export class SnapshotsView extends React.Component {
  state = {
    viewPath: 'streaming.radio',
  };

  _ref: any;

  views: ViewCollectionType = {
    buildinghours: {
      list: {view: () => <BuildingHoursView {...defaultProps} />, delay: 100}
    },
    contacts: {
      list: {view: () => <ContactsView />, delay: 100},
    },
    dictionary: {
      list: {view: () => <DictionaryView />, delay: 100},
    },
    home: {
      home: {view: () => <HomeView />, delay: 100},
      edit: {view: () => <EditHomeView />, delay: 100},
    },
    news: {
      tabs: {view: () => <NewsView {...defaultProps} />, delay: 5000},
    },
    settings: {
      index: {view: () => <SettingsView {...defaultProps} />, delay: 100},
      credits: {view: () => <CreditsView />, delay: 100},
      faqs: {view: () => <FaqView />, delay: 100},
      legal: {view: () => <LegalView />, delay: 100},
      privacy: {view: () => <PrivacyView />, delay: 100},
    },
    sis: {
      tabs: {view: () => <SISView {...defaultProps} />, delay: 100},
      balances: {view: () => <BalancesView />, delay: 100},
    },
    streaming: {
      tabs: {view: () => <StreamingView />, delay: 100},
      radio: {view: () => <KSTOView />, delay: 100},
      webcams: {view: () => <WebcamsView />, delay: 1000},
    },
    studentorgs: {
      list: {view: () => <StudentOrgsView />, delay: 2000},
    },
    transit: {
      tabs: {view: () => <TransportationView />, delay: 100},
    },
  };

  saveSnapshot = () => {
    const name = this.state.viewPath
    return takeSnapshot(this._ref, {
      format: 'png',
      path: `${outputDir}/${name}.png`,
    }).then(
      uri => console.log('saved to', uri),
      err => console.error('snapstho failed', err),
    )
  };

  saveAll = async () => {
    for (const [parent, child] of this.viewsAsList()) {
      const viewPath = `${parent}.${child}`
      const args = get(this.views, viewPath)

      this.setState({viewPath})
      await delay(args.delay || 1000)
      await this.saveSnapshot()
      await delay(100)
    }
  };

  viewsAsList = () => {
    // goes from {name: {inner: {}}} to [[name, inner]]
    const choices = toPairs(this.views).map(([key, val]) =>
      toPairs(val).map(([innerKey]) => [key, innerKey]))

    return flatten(choices)
  };

  onChangeView = (value: string) => {
    this.setState({viewPath: value})
  };

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

        <View>
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
          ref={ref => this._ref = ref}
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
  buttonBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  viewContainer: {
    backgroundColor: white,
  },
})
