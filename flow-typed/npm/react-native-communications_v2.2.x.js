// flow-typed signature: 22b72e7592461f7b114b5f753c761865
// flow-typed version: c6154227d1/react-native-communications_v2.2.x/flow_>=v0.104.x

// @flow

type zeroArgumentEmail = () => void
type oneArgumentEmail = (to: Array<string>) => void
type fiveArgumentEmail = (to: Array<string>, cc: Array<string>, bcc: Array<string>, subject: string, body: string) => void

declare module 'react-native-communications' {
  declare module.exports: {
    phonecall: (phoneNumber: string, prompt: boolean) => void,
    email: & zeroArgumentEmail & oneArgumentEmail & fiveArgumentEmail,
    text: (phoneNumber?: string, body?: string) => void,
    textWithoutEncoding: (phoneNumber?: string, body?: string) => void,
    web: (address: string) => void,
    ...
  }
}
