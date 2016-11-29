require 'xcodeproj'
project_path = './ios/AllAboutOlaf.xcodeproj'
project = Xcodeproj::Project.open(project_path)
project_name = 'AllAboutOlaf'

team_id = 'NFMTHAZVS'
devteam = 'NFMTHAZVS9'
bundle_id = 'com.volz.drew.aao.rogue'
profile_id = '41adf2d3-cb22-4a24-80c3-b4fe83539aa1'
profile_name = 'match Development com.volz.drew.aao.rogue'

main_target = project.targets.find { |t| t.name == project_name }
main_target_uuid = main_target && main_target.uuid

if main_target_uuid
  target_atts_obj = project.root_object.attributes['TargetAttributes']
  puts 'Before'
  puts target_atts_obj
  target_atts_obj[main_target_uuid] ||= {}
  target_atts_obj[main_target_uuid]['DevelopmentTeam'] = team_id
  puts 'After'
  puts target_atts_obj
end

main_target.build_configurations.each do |config|
  puts "#{config.name}: Before"
  puts config.build_settings
  config.build_settings['DEVELOPMENT_TEAM'] = devteam
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = bundle_id
  config.build_settings['PROVISIONING_PROFILE'] = profile_id
  config.build_settings['PROVISIONING_PROFILE_SPECIFIER'] = profile_name
  puts "#{config.name}: After"
  puts config.build_settings
end

project.save
