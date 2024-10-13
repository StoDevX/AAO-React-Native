// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import { SymbolView, type SFSymbol } from 'expo-symbols';
import Ionicons from '@expo/vector-icons/Ionicons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';

export function TabBarIcon({ style, ...rest }: IconProps<SFSymbol>) {
  return <SymbolView size={28} tintColor={rest.color} style={[{ marginBottom: -3 }, style]} {...rest} />;
  // return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}
