import * as React from 'react'
import {StyleSheet, Text, View, ScrollView, Pressable, useColorScheme} from 'react-native'
import {HomeScreenButton} from './button'
import type {ViewType} from '../views'
import {makeCardStyles} from './styles'

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', paddingVertical: 4 },
  item: { width: 220, marginRight: 12 },
  gear: { opacity: 0.6 },
})

type Props = {
  title: string
  items: ViewType[]
  onPress: (v: ViewType) => void
  onOpenConfig?: () => void
}

export function WidgetRow({title, items, onPress, onOpenConfig}: Props) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onOpenConfig ? (
          <Pressable onPress={onOpenConfig} accessibilityRole="button">
            <Text style={styles.gear}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {items.map((it) => (
            <View style={styles.item} key={it.title}>
              <HomeScreenButton view={it} onPress={() => onPress(it)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
