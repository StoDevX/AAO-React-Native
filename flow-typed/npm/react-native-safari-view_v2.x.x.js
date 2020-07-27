// flow-typed signature: a84c8b1c2f130061d1aaeade8462198a
// flow-typed version: <<STUB>>/react-native-safari-view_v2.1.0/flow_v0.122.0

declare module 'react-native-safari-view' {
  declare type SafariOptions = {
    url: string,
    readerMode?: boolean,
    tintColor?: string,
    barTintColor?: string,
    fromBottom?: boolean,
  };

  declare type EventName = 'onShow' | 'onDismiss';

  // TODO: add the singular {isAvailable} export for Android
  declare export default {
    isAvailable(): Promise<boolean>,
    dismiss(): void,
    show(SafariOptions): Promise<boolean>,
    addEventListener(event: EventName, () => any): {remove: () => void},
    removeEventListener(event: EventName, () => any): void,
  };
}
