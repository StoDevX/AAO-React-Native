// flow-typed signature: ab86b30867ed98ef143c44b3b4983e5c
// flow-typed version: <<STUB>>/react-native-onesignal_v3.2.7/flow_v0.78.0

declare module 'react-native-onesignal' {
  declare export type OneSignalOpenResult = {
    notification: {
      payload: {
        body: any,
        additionalData: any,
      },
      isAppInFocus: boolean,
    },
  }

  declare export type OneSignalNotification = {
    shown: boolean,
    payload: {
      notificationID: '',
      contentAvailable: boolean,
      badge: 1,
      sound: 'default',
      title: 'Hello!',
      body: 'World',
      launchURL: '',
    },
    displayType: 1,
    silentNotification: boolean,
  }

  declare export type OneSignalIdsResult = {
    pushToken: ?string,
    subscribed: boolean,
    userId: ?string,
    userSubscriptionSetting: boolean,
  }

  declare type EventTypeEnum = 'received' | 'opened' | 'ids' | 'emailSubscription';

  declare type Permissions = {
    alert: boolean,
    badge: boolean,
    sound: boolean,
  }

  declare export type SubscriptionState = {
    hasPrompted: boolean,
    notificationsEnabled: boolean,
    subscriptionEnabled: boolean,
    userSubscriptionEnabled: boolean,
    pushToken: ?string,
    userId: ?string,
    emailUserId: ?string,
    emailAddress: ?string,
    emailSubscribed: boolean
  };

  declare export type TagsObject = {[key: string]: string}

  declare type DisplayOption =
    | 0 // None
    | 1 // InAppAlert
    | 2 // Notification

  declare export type NotificationContent = {}
  declare export type NotificationData = {}
  declare export type NotificationParameters = {hidden?: boolean}

  declare export type IosSettings = {
    kOSSettingsKeyAutoPrompt?: boolean,
    kOSSettingsKeyInAppLaunchURL?: boolean,
    kOSSSettingsKeyPromptBeforeOpeningPushURL?: boolean,
    kOSSettingsKeyInFocusDisplayOption?: DisplayOption,
  };

  declare export default class OneSignal {
    static addEventListener(type: 'received', handler: (OneSignalNotification) => mixed): void;
    static addEventListener(type: 'opened', handler: (OneSignalOpenResult) => mixed): void;
    static addEventListener(type: 'ids', handler: (OneSignalIdsResult) => mixed): void;
    static addEventListener(type: 'emailSubscription', handler: (...any[]) => mixed): void;
    static removeEventListener(type: EventTypeEnum, handler: Function): void;
    static clearListeners(): void;

    static registerForPushNotifications(): void;

    static promptForPushNotificationsWithUserResponse(callback: (bool) => mixed): void;

    static requestPermissions(permissions: Permissions): void;

    static configure(): void;

    static init(appId: string, iosSettings: IosSettings): void;

    static checkPermissions(callback: (Permissions) => mixed): void;

    static promptForPushNotificationPermissions(callback: (bool) => mixed): void;

    static getPermissionSubscriptionState(callback: (SubscriptionState) => mixed): void;

    static sendTag(key: string, value: string): void;
    static sendTags(TagsObject): void;
    static getTags((null | TagsObject | Error) => mixed): void;
    static deleteTag(key: string): void;

    static enableVibrate(enable: boolean): void;
    static enableSound(enable: boolean): void;

    static setEmail(email: string): void;
    static setEmail(email: string, emailAuthCode: string): void;
    static setEmail(email: string, callback: (?Error) => mixed): void;
    static setEmail(email: string, emailAuthCode: string, callback: (?Error) => mixed): void;

    static logoutEmail(callback: (?Error) => mixed): void;

    static setLocationShared(enable: boolean): void;
    static setSubscription(enable: boolean): void;

    static promptLocation(): void;

    static inFocusDisplaying(DisplayOption): void;

    static postNotification(contents: NotificationContent, data: NotificationData, player_id: string | Array<string>): void;
    static postNotification(contents: NotificationContent, data: NotificationData, player_id: string | Array<string>, otherParameters?: NotificationParameters): void;

    static clearOneSignalNotifications(): void;
    static cancelNotification(id: number): void;

    static syncHashedEmail(email: string): void;

    static setLogLevel(level: string): void;

    static setRequiresUserPrivacyConsent(required: boolean): void;
    static provideUserConsent(granted: boolean): void;
    static userProvidedPrivacyConsent(): Promise<boolean>;
  }
}
