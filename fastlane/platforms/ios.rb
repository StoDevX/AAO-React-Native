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

  desc 'Provisions the profiles; bumps the build number; builds the app'
  lane :build do
    gym(include_bitcode: true,
        include_symbols: true)
  end

  desc 'Submit a new Beta Build to Testflight'
  lane :beta do
    match(type: 'appstore', readonly: true)
    increment_build_number(build_number: latest_testflight_build_number + 1,
                           xcodeproj: ENV['GYM_PROJECT'])

    build

    testflight
  end

  desc 'Upload dYSM symbols to Bugsnag from Apple'
  lane :refresh_dsyms do
    download_dsyms
    upload_symbols_to_bugsnag
    clean_build_artifacts
  end

  desc 'Run iOS builds or tests, as appropriate'
  lane :'ci-run' do
    # set up things so they can run
    authorize_ci_for_keys
    ci_keychains

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
    increment_version_number(version_number: "#{version}",
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

    # Set up code signing correctly
    # (more information: https://codesigning.guide)
    match(type: 'appstore', readonly: true)

    sh("security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k #{password} #{keychain}")

    sh('security find-identity -v -p codesigning')
  end
end
