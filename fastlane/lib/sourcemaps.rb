# Generate argument values for the generate_sourcemap and upload_sourcemap_to_sentry lanes
def sourcemap_args
	# The cwd is /fastlane. I don't know why entry_file doesn't need to be ../, but
	# I believe that watchman finds the project root and automatically looks there
	case lane_context[:PLATFORM_NAME]
	when :android
		platform = 'android'
		entry_file = 'index.js'
		bundle_output = 'index.android.bundle'
		sourcemap_output = 'index.android.bundle.map'
	when :ios
		platform = 'ios'
		entry_file = 'index.js'
		bundle_output = 'main.jsbundle'
		sourcemap_output = 'main.jsbundle.map'
	end

	{
		platform: platform,
		entry_file: entry_file,
		bundle_output: bundle_output,
		sourcemap_output: sourcemap_output,
	}
end

# Use react-native cli to generate the source map
def generate_sourcemap
	args = sourcemap_args

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

def sentry_release
	"#{bundle_identifier}@#{current_bundle_version}+#{current_bundle_code}"
end

def sentry_dist
	current_bundle_code
end

def bundle_identifier
	case lane_context[:PLATFORM_NAME]
	when :android
		"com.allaboutolaf"
	when :ios
		"NFMTHAZVS9.com.drewvolz.stolaf"
	end
end

# Upload sourcemap to sentry
def upload_sourcemap_to_sentry
	args = sourcemap_args

	cmd = [
	       'npx sentry-cli',
	       'releases',
	       'files',
	       sentry_release,
	       'upload-sourcemaps',
	       "--dist #{sentry_dist}",
	       "--strip-prefix #{File.expand_path(File.join(__FILE__, '..', '..', '..'))}",
	       '--rewrite',
	       args[:bundle_output],
	       args[:sourcemap_output]
	].join ' '

	FastlaneCore::CommandExecutor.execute(command: cmd,
	                                      print_all: true,
	                                      print_command: true)
end
