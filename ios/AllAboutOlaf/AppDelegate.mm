#import "AppDelegate.h"
#import <AVFoundation/AVFoundation.h>
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"AllAboutOlaf";

  // set up the requests cacher
  NSURLCache *URLCache = [[NSURLCache alloc] initWithMemoryCapacity:4 * 1024 * 1024   // 4 MiB
                                                       diskCapacity:20 * 1024 * 1024  // 20 MiB
                                                           diskPath:nil];
  [NSURLCache setSharedURLCache:URLCache];

  // ignore vibrate/silent switch when playing audio
  [[AVAudioSession sharedInstance] setCategory: AVAudioSessionCategoryPlayback error: nil];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *pendingBundlePath = [defaults stringForKey:@"jsBundlePath_pending"];

  // 1. Activate new update if one is pending
  if (pendingBundlePath != nil) {
    [defaults setObject:pendingBundlePath forKey:@"jsBundlePath"];
    [defaults setBool:YES forKey:@"isUpdatePendingVerification"];
    [defaults removeObjectForKey:@"jsBundlePath_pending"];

    // Also save the version tag of the new update
    NSURL *pendingBundleURL = [NSURL fileURLWithPath:pendingBundlePath];
    NSURL *updateDirURL = [[pendingBundleURL URLByDeletingLastPathComponent] URLByDeletingLastPathComponent];
    NSString *versionTag = [updateDirURL lastPathComponent];
    [defaults setObject:versionTag forKey:@"currentJSVersion"];
  }

  // 2. Check if the last update caused a crash
  if ([defaults boolForKey:@"isUpdatePendingVerification"]) {
    // Crash detected! Start rollback.
    [defaults removeObjectForKey:@"isUpdatePendingVerification"]; // Assume failure until proven otherwise

    NSString *currentBundlePath = [defaults stringForKey:@"jsBundlePath"];
    NSURL *currentBundleURL = [NSURL fileURLWithPath:currentBundlePath];
    NSURL *updateDirURL = [[currentBundleURL URLByDeletingLastPathComponent] URLByDeletingLastPathComponent];

    // Delete the faulty update
    [[NSFileManager defaultManager] removeItemAtURL:updateDirURL error:nil];

    // Find the next best update
    NSString *channel = [defaults stringForKey:@"updateChannel"] ?: @"release";
    NSURL *channelDirURL = [[self getUpdatesDirectory] URLByAppendingPathComponent:channel];

    NSArray *availableUpdates = [self getSortedUpdatesInDirectory:channelDirURL];

    // Try up to 3 historical updates
    BOOL foundViableUpdate = NO;
    for (int i = 0; i < MIN(3, [availableUpdates count]); i++) {
        NSURL *nextBestUpdateURL = [availableUpdates objectAtIndex:i];
        NSString *nextBestBundlePath = [[nextBestUpdateURL URLByAppendingPathComponent:@"bundles"] URLByAppendingPathComponent:@"main.jsbundle"].path;

        if ([[NSFileManager defaultManager] fileExistsAtPath:nextBestBundlePath]) {
            [defaults setObject:nextBestBundlePath forKey:@"jsBundlePath"];
            foundViableUpdate = YES;
            break;
        }
    }

    if (!foundViableUpdate) {
        [defaults removeObjectForKey:@"jsBundlePath"];

        // Cross-channel fallback
        if (![channel isEqualToString:@"release"]) {
            [[NSFileManager defaultManager] removeItemAtURL:channelDirURL error:nil];
            [defaults removeObjectForKey:@"updateChannel"];

            NSURL *releaseChannelDirURL = [[self getUpdatesDirectory] URLByAppendingPathComponent:@"release"];
            NSArray *releaseUpdates = [self getSortedUpdatesInDirectory:releaseChannelDirURL];

            if ([releaseUpdates count] > 0) {
                NSURL *latestReleaseUpdateURL = [releaseUpdates firstObject];
                NSString *latestReleaseBundlePath = [[latestReleaseUpdateURL URLByAppendingPathComponent:@"bundles"] URLByAppendingPathComponent:@"main.jsbundle"].path;
                [defaults setObject:latestReleaseBundlePath forKey:@"jsBundlePath"];
            }
        }
    }
  }

  // 3. Determine the final URL
  NSString *jsBundlePath = [defaults stringForKey:@"jsBundlePath"];
  if (jsBundlePath != nil && [[NSFileManager defaultManager] fileExistsAtPath:jsBundlePath]) {
    return [NSURL fileURLWithPath:jsBundlePath];
  } else {
    #if DEBUG
      return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
    #else
      return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    #endif
  }
}

- (NSURL *)getUpdatesDirectory {
    return [[[[NSFileManager defaultManager] URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] firstObject] URLByAppendingPathComponent:@"updates"];
}

- (NSArray<NSURL *> *)getSortedUpdatesInDirectory:(NSURL *)directoryURL {
    NSArray *properties = @[NSURLContentModificationDateKey];
    NSArray *contents = [[NSFileManager defaultManager] contentsOfDirectoryAtURL:directoryURL
                                                       includingPropertiesForKeys:properties
                                                                          options:NSDirectoryEnumerationSkipsHiddenFiles
                                                                            error:nil];

    return [contents sortedArrayUsingComparator:^NSComparisonResult(NSURL *url1, NSURL *url2) {
        NSDate *date1, *date2;
        [url1 getResourceValue:&date1 forKey:NSURLContentModificationDateKey error:nil];
        [url2 getResourceValue:&date2 forKey:NSURLContentModificationDateKey error:nil];
        return [date2 compare:date1]; // Descending order
    }];
}

@end
