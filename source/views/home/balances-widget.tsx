import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {makeCardStyles} from './styles'
import {useColorScheme} from 'react-native'

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  amount: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  label: { opacity: 0.7, marginTop: 4, textAlign: 'center' },
})

type Props = { editMode: boolean }

export function BalancesWidget(_: Props) {
  // fake balances
  const balances = [
    { label: 'Flex', amount: '$42.18' },
    { label: 'Ole', amount: '$16.50' },
    { label: 'Copy', amount: '$5.10' },
    { label: 'Print', amount: '$8.43' },
  ]

  return (
    <View>
      <View style={styles.row}>
        {balances.map((b) => (
          <View key={b.label} style={styles.chip}>
            <Text style={styles.amount}>{b.amount}</Text>
            <Text style={styles.label}>{b.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
