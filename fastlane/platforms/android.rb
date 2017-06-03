platform :android do
  desc 'Makes a build'
  lane :build do
    # make sure we have a copy of the data files
    bundle_data

    gradle(task: 'assemble',
           build_type: 'Release',
           print_command: true,
           print_command_output: true)
  end

  desc 'Submit a new Beta Build to HockeyApp'
  lane :beta do
    badge

    build

    # Upload to HockeyApp
    hockey(notes: release_notes)
  end

  desc 'Run the appropriate action on CI'
  lane :'ci-run' do
    # prepare for the bright future with signed android betas
    authorize_ci_for_keys

    # set the app version
    set_version

    # set where this build came from
    set_package_data(data: {
      allaboutolaf: {
        source: 'beta',
      },
    })

    # and run
    should_deploy = ENV['run_deploy'] == '1'
    if should_deploy
      auto_beta
    else
      build
    end
  end

  desc 'Include the build number in the version string'
  lane :set_version do |options|
    version = options[:version] || current_bundle_version
    build = options[:build_number] || current_build_number
    set_gradle_version_name(version_name: "#{version}+#{build}",
                            gradle_path: lane_context[:GRADLE_FILE])
    set_gradle_version_code(version_code: build,
                            gradle_path: lane_context[:GRADLE_FILE])
    set_package_data(data: { version: "#{version}+#{build}" })
  end
end
