import {AppRegistry} from 'react-native';
import App from './source/app';
AppRegistry.registerComponent('AllAboutOlaf', () => App);
import codePush from 'react-native-code-push';

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
};

AppRegistry.registerComponent('AllAboutOlaf', () =>
  codePush(codePushOptions)(App));
