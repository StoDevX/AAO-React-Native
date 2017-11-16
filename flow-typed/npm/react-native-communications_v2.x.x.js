// flow-typed signature: a3f91c162011f345c2bd353826770e99
// flow-typed version: <<STUB>>/react-native-communications_v2.2.1/flow_v0.56.0

declare module 'react-native-communications' {
  declare export function phonecall(number: string, prompt: boolean): void;
  declare export function email(): void;
  declare export function email(to: ?Array<string>, cc: ?Array<string>, bcc: ?Array<string>, subject: ?string, body: ?string): void;
  declare export function text(number: string, body: string): void;
  declare export function textWithoutEncoding(number: string, body: string): void;
  declare export function web(address: string): void;
}
