// @flow
import React from 'react'
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
};

export function FilterMenuToolbar({date, title, filters, onPress}: PropsType) {
  const appliedFilterCount = filters.filter(f => f.enabled).length
  const isFiltered = appliedFilterCount > 0

  return (
    <Toolbar onPress={onPress}>
      <View style={[styles.toolbarSection, styles.today]}>
        <Text>{date.format('MMM. Do')}</Text>
        {title ? <Text style={{paddingHorizontal: 4}}>—</Text> : null}
        {title ? <Text>{title}</Text> : null}
      </View>

      <ToolbarButton
        isActive={isFiltered}
        title={isFiltered ? `${appliedFilterCount} ${appliedFilterCount === 1 ? 'Filter' : 'Filters'}` : 'No Filters'}
        iconName={Platform.OS === 'ios' ? 'ios-funnel' : 'md-funnel'}
      />
    </Toolbar>
  )
}
