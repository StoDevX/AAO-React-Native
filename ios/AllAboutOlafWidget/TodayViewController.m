//
//  TodayViewController.m
//  All About Olaf Balances Widget
//

#import "TodayViewController.h"
#import <NotificationCenter/NotificationCenter.h>

@interface TodayViewController () <NCWidgetProviding>
@end

@implementation TodayViewController

- (void)viewDidLoad
{
  [super viewDidLoad];

  [self parseBalances];
}

// Parse the returned data and assign it to the widget's view
- (void)parseBalances
{
  BOOL fileExists = [self checkIfFileExists];

  if (fileExists) {
    NSDictionary *dict = [self getBalancesFromFile];
    NSArray *balances = [dict objectForKey:@"balances"];

    _flexBalanceLabel.text = [balances valueForKey:@"flex"];
    _oleBalanceLabel.text = [balances valueForKey:@"ole"];
    _printBalanceLabel.text = [balances valueForKey:@"print"];
  }
}

// Get the data from a saved file
- (NSDictionary *)getBalancesFromFile
{
  _filePath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
  _fileName = @"aao-balances.json";
  _fileAtPath = [_filePath stringByAppendingPathComponent:_fileName];
  NSData *data = [NSData dataWithContentsOfFile:_fileAtPath];

  return [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:nil];
}

// Create a file if it does not already exist
- (BOOL)checkIfFileExists
{
  _filePath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
  _fileName = @"aao-balances.json";
  _fileAtPath = [_filePath stringByAppendingPathComponent:_fileName];

  // test: delete file
  // [self deleteSavedFile];
  
  if (![[NSFileManager defaultManager] fileExistsAtPath:_fileAtPath]) {
    // test: create data
    // [self testCreateFileAndData];

    return false;
  }

  return true;
}

- (void)deleteSavedFile
{
  [[NSFileManager defaultManager] removeItemAtPath:_fileAtPath error:nil];
}

// testing: creates and writes to file
- (void)testCreateFileAndData
{
   NSString *mockData = @"{\"balances\":{\"ole\":\"$10\",\"flex\":\"$20\",\"print\":\"$30\"}}";
   [[NSFileManager defaultManager] createFileAtPath:_fileAtPath contents:nil attributes:nil];
   [[mockData dataUsingEncoding:NSUTF8StringEncoding] writeToFile:_fileAtPath atomically:NO];
}


- (void)didReceiveMemoryWarning
{
  [super didReceiveMemoryWarning];
}

- (void)widgetPerformUpdateWithCompletionHandler:(void (^)(NCUpdateResult))completionHandler
{
  // Perform any setup necessary in order to update the view.
  
  // If an error is encountered, use NCUpdateResultFailed
  // If there's no update required, use NCUpdateResultNoData
  // If there's an update, use NCUpdateResultNewData

  completionHandler(NCUpdateResultNewData);
}

@end
