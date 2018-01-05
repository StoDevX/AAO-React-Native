# coding: utf-8

# Generate argument values for the generate_sourcemap and upload_sourcemap_to_bugsnag lanes
def get_sourcemap_args
  # The cwd is /fastlane. I don't know why entry_file doesn't need to be ../, but
  # I believe that watchman finds the project root and automatically looks there
  case lane_context[:PLATFORM_NAME]
  when :android
    platform = 'android'
    entry_file = 'index.js'
    bundle_output = '../android-release.bundle'
    sourcemap_output = '../android-release.bundle.map'
    bundle_url = 'index.android.bundle'
  when :ios
    platform = 'ios'
    entry_file = 'index.js'
    bundle_output = '../ios-release.bundle'
    sourcemap_output = '../ios-release.bundle.map'
    bundle_url = 'main.jsbundle'
  end

  {
    platform: platform,
    entry_file: entry_file,
    bundle_output: bundle_output,
    sourcemap_output: sourcemap_output,
    bundle_url: bundle_url,
  }
end

# Use react-native cli to generate the source map
def generate_sourcemap
  args = get_sourcemap_args

  cmd = [
    'npx react-native bundle',
    '--dev false',
    "--platform '#{args[:platform]}'",
    "--entry-file '#{args[:entry_file]}'",
    "--bundle-output '#{args[:bundle_output]}'",
    "--sourcemap-output '#{args[:sourcemap_output]}'",
  ].join ' '

  FastlaneCore::CommandExecutor.execute(command: cmd,
                                        print_all: true,
                                        print_command: true)
end

# Upload source map to Bugsnag
def upload_sourcemap_to_bugsnag
  args = get_sourcemap_args

  cmd = [
    'npx bugsnag-sourcemaps upload',
    "--api-key '#{ENV['BUGSNAG_KEY']}'",
    "--minified-file '#{args[:bundle_output]}'",
    "--source-map '#{args[:sourcemap_output]}'",
    "--minified-url '#{args[:bundle_url]}'",
    '--upload-sources',
  ].join ' '

  FastlaneCore::CommandExecutor.execute(command: cmd,
                                        print_all: true,
                                        print_command: true)
end
