import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#1118270D',
  },
  amount: { fontSize: 15, fontWeight: '700' },
  label: { opacity: 0.7, marginTop: 2, fontSize: 12 },
})

type Props = {
  flex?: string
  ole?: string
  printPages?: number
  swipesToday?: number
  swipesWeek?: number
}

export function BalanceStrip({
  flex = '$42.18',
  ole = '$16.50',
  printPages = 143,
  swipesToday = 1,
  swipesWeek = 7,
}: Props) {
  const items = [
    { label: 'Flex', value: flex },
    { label: 'Ole', value: ole },
    { label: 'Print', value: `${printPages} pgs` },
    { label: 'Swipes', value: `${swipesToday} / ${swipesWeek}` },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {items.map((it) => (
          <View key={it.label} style={styles.chip}>
            <Text style={styles.amount}>{it.value}</Text>
            <Text style={styles.label}>{it.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
