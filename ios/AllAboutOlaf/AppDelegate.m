/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"
#import <AVFoundation/AVFoundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <RNSentry.h>
#import <ReactNativeNavigation/ReactNativeNavigation.h>

@implementation AppDelegate

@synthesize oneSignal = _oneSignal;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL* jsCodeLocation;

#if DEBUG
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif

  [ReactNativeNavigation bootstrap:jsCodeLocation launchOptions:launchOptions];

  RCTBridge* bridge = [ReactNativeNavigation getBridge];
  [RNSentry installWithBridge:bridge];

  // set up the requests cacher
  NSURLCache *URLCache = [[NSURLCache alloc] initWithMemoryCapacity:4 * 1024 * 1024   // 4 MiB
                                                       diskCapacity:20 * 1024 * 1024  // 20 MiB
                                                           diskPath:nil];
  [NSURLCache setSharedURLCache:URLCache];

  // ignore vibrate/silent switch when playing audio
  [[AVAudioSession sharedInstance] setCategory: AVAudioSessionCategoryPlayback error: nil];

  return YES;
}

@end
