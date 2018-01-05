// @flow
import * as React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import type momentT from 'moment'
import type {FilterType} from '../../components/filter'
import {Toolbar, ToolbarButton} from '../../components/toolbar'

const styles = StyleSheet.create({
  today: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 14,
  },
  toolbarSection: {
    flexDirection: 'row',
  },
})

type PropsType = {
  date: momentT,
  title?: string,
  onPress: () => any,
  filters: FilterType[],
}

export function FilterMenuToolbar({date, title, filters, onPress}: PropsType) {
  const appliedFilterCount = filters
    .filter(f => f.type !== 'picker')
    .filter(f => f.enabled).length

  const isFiltered = appliedFilterCount > 0
  const filterWord = appliedFilterCount === 1 ? 'Filter' : 'Filters'

  return (
    <Toolbar onPress={onPress}>
      <View style={[styles.toolbarSection, styles.today]}>
        <Text>
          <Text>{date.format('MMM. Do')}</Text>
          {title ? <Text> — {title}</Text> : null}
        </Text>
      </View>

      <ToolbarButton
        iconName={Platform.OS === 'ios' ? 'ios-funnel' : 'md-funnel'}
        isActive={isFiltered}
        title={
          isFiltered ? `${appliedFilterCount} ${filterWord}` : 'No Filters'
        }
      />
    </Toolbar>
  )
}
