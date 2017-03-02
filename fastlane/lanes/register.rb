desc "Adds any unregistered devices to the provisioning profile"
lane :register do
  id = CredentialsManager::AppfileConfig.try_fetch_value(:app_identifier)
  new_devices = get_unprovisioned_devices_from_hockey(app_bundle_id: id)
  register_devices(devices: new_devices)
  match(force: true)
end
