/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"
#import <BugsnagReactNative/BugsnagReactNative.h>
#import <AVFoundation/AVFoundation.h>

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import "RCTOneSignal.h"

@implementation AppDelegate

@synthesize oneSignal = _oneSignal;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"
                                                                    fallbackResource:nil];
#ifndef DEBUG
  [BugsnagReactNative start];
#endif

  UIStoryboard *loadingViewStoryBoard = [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
  UIViewController *loadingViewController = [loadingViewStoryBoard instantiateViewControllerWithIdentifier:@"LaunchViewController"];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"AllAboutOlaf"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  rootView.loadingView = loadingViewController.view;

  self.oneSignal = [[RCTOneSignal alloc] initWithLaunchOptions:launchOptions
                                                         appId:@"aa46a500-ab1c-4127-b9ff-e7373da3ce35"
                                                      settings:@{kOSSettingsKeyAutoPrompt: @false}];

  // set up the requests cacher
  NSURLCache *URLCache = [[NSURLCache alloc] initWithMemoryCapacity:4 * 1024 * 1024   // 4 MiB
                                                       diskCapacity:20 * 1024 * 1024  // 20 MiB
                                                           diskPath:nil];
  [NSURLCache setSharedURLCache:URLCache];

  // ignore vibrate/silent switch when playing audio
  [[AVAudioSession sharedInstance] setCategory: AVAudioSessionCategoryPlayback error: nil];

  return YES;
}

// Required for the notification event.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification {
  [RCTOneSignal didReceiveRemoteNotification:notification];
}

@end
