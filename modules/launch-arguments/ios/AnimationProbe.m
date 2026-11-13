// EXPERIMENT (do not merge): logs, once a second under --uitesting, every
// layer in the app's windows that has animations attached, so a run that
// stalls waiting for "animations idle" names what is still animating. It
// starts from +load, so it does not depend on any module being created, and
// it says so as soon as it loads.
#import <UIKit/UIKit.h>

@interface AAOAnimationProbe : NSObject
@end

@implementation AAOAnimationProbe

static NSString *lastReport = nil;

+ (void)load
{
  BOOL uitesting = [[NSProcessInfo processInfo].arguments containsObject:@"--uitesting"];
  NSLog(@"[anim-probe] loaded uitesting=%d", uitesting);
  if (!uitesting) {
    return;
  }
  dispatch_async(dispatch_get_main_queue(), ^{
    NSTimer *timer = [NSTimer timerWithTimeInterval:1.0 repeats:YES block:^(NSTimer *_) {
      [AAOAnimationProbe report];
    }];
    [[NSRunLoop mainRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];
    NSLog(@"[anim-probe] timer started");
  });
}

+ (NSString *)describe:(CALayer *)layer
{
  NSArray<NSString *> *keys = layer.animationKeys;
  if (keys.count == 0) {
    return nil;
  }
  NSMutableArray<NSString *> *parts = [NSMutableArray array];
  for (NSString *key in keys) {
    if (parts.count >= 6) {
      break;
    }
    CAAnimation *animation = [layer animationForKey:key];
    [parts addObject:[NSString stringWithFormat:@"%@=%@(d=%.2f,r=%@)", key,
                                                NSStringFromClass(animation.class), animation.duration,
                                                animation.repeatCount == HUGE_VALF
                                                    ? @"inf"
                                                    : [NSString stringWithFormat:@"%g", animation.repeatCount]]];
  }
  id delegate = layer.delegate;
  return [NSString stringWithFormat:@"%@<%@> %@", NSStringFromClass(layer.class),
                                    delegate ? NSStringFromClass([delegate class]) : @"-",
                                    [parts componentsJoinedByString:@" "]];
}

+ (void)walk:(CALayer *)layer depth:(NSUInteger)depth into:(NSMutableArray<NSString *> *)lines
{
  if (lines.count > 40 || depth > 60) {
    return;
  }
  NSString *line = [self describe:layer];
  if (line) {
    [lines addObject:line];
  }
  for (CALayer *sublayer in [layer.sublayers copy]) {
    [self walk:sublayer depth:depth + 1 into:lines];
  }
}

+ (void)report
{
  NSMutableArray<NSString *> *lines = [NSMutableArray array];
  NSMutableArray<NSString *> *windows = [NSMutableArray array];
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (![scene isKindOfClass:[UIWindowScene class]]) {
      continue;
    }
    for (UIWindow *window in ((UIWindowScene *)scene).windows) {
      [windows addObject:[NSString stringWithFormat:@"%@%@", NSStringFromClass(window.class),
                                                    window.hidden ? @"(hidden)" : @""]];
      [self walk:window.layer depth:0 into:lines];
    }
  }
  NSString *report = [NSString stringWithFormat:@"windows=[%@] animating=%lu\n%@",
                                                [windows componentsJoinedByString:@","],
                                                (unsigned long)lines.count, [lines componentsJoinedByString:@"\n"]];
  if ([report isEqualToString:lastReport]) {
    return;
  }
  lastReport = report;
  for (NSString *line in [report componentsSeparatedByString:@"\n"]) {
    if (line.length > 0) {
      NSLog(@"[anim-probe] %@", line);
    }
  }
}

@end
