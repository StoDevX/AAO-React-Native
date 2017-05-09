platform :ios do
  desc 'Runs all the tests'
  lane :test do
    scan(scheme: ENV['GYM_SCHEME'],
         project: ENV['GYM_PROJECT'])
  end

  desc 'Take screenshots'
  lane :screenshot do
    snapshot(devices: ['iPhone 7 Plus', 'iPhone 6', 'iPhone 5s', 'iPhone 4s'],
             languages: ['en-US'],
             scheme: ENV['GYM_SCHEME'],
             project: ENV['GYM_PROJECT'])
  end

  desc 'Go rogue'
  lane :'go-rogue' do
    activate_rogue_team
  end

  desc 'Provisions the profiles; bumps the build number; builds the app'
  lane :build do
    # make sure we have a copy of the data files
    bundle_data

    sh('security find-identity -v -p codesigning')

    # Build the app
    gym(export_method: 'ad-hoc')
  end

  desc 'Build, but for the rogue devs'
  lane :'rogue-build' do
    activate_rogue_team
    match(type: 'adhoc', readonly: true)
    build
  end

  desc 'Make a beta, but for the rogue devs'
  lane :'rogue-beta' do
    activate_rogue_team
    match(type: 'adhoc', readonly: true)
    set_version
    beta
  end

  desc 'Submit a new Beta Build to HockeyApp'
  lane :beta do
    badge

    build

    hockey(notes: release_notes)
  end

  desc 'Run iOS builds or tests, as appropriate'
  lane :'ci-run' do
    # set up things so they can run
    authorize_ci_for_keys
    ci_keychains
    activate_rogue_team

    # Set up code signing correctly
    # (more information: https://codesigning.guide)
    match(type: 'adhoc', readonly: true)

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
      codepush
    else
      build
    end
  end

  lane :codepush do
    codepush_cli(app: 'AllAboutOlaf-iOS')
  end

  desc 'Include the build number in the version string'
  lane :set_version do |options|
    version = options[:version] || current_bundle_version
    build = options[:build_number] || current_build_number
    increment_version_number(version_number: "#{version}+#{build}",
                             xcodeproj: ENV['GYM_PROJECT'])
    increment_build_number(build_number: build,
                           xcodeproj: ENV['GYM_PROJECT'])
    set_package_data(data: { version: "#{version}+#{build}" })
  end

  desc 'Do CI-system keychain setup'
  private_lane :ci_keychains do
    keychain = ENV['MATCH_KEYCHAIN_NAME']
    password = ENV['MATCH_KEYCHAIN_PASSWORD']

    create_keychain(name: keychain,
                    password: password,
                    timeout: 3600)

    match(readonly: true)

    sh("security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k #{password} #{keychain}")
  end
end
