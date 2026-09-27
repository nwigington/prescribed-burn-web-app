# Release Notes — Version 3.9

## Critical related-table persistence correction

Live testing showed that burn events could appear in the interface but disappear after refresh because Version 3.8 did not discover the published related tables.

### Root cause

The file geodatabase uses dataset names with underscores, such as `Burn_Events`, while the published ArcGIS Online FeatureServer exposes display names with spaces, such as `Burn Events`. Version 3.8 required an exact normalized string match that preserved underscores, so all seven table lookups could fail. The write functions then returned early when related storage was unavailable, allowing the UI to add the temporary in-memory record and announce apparent success.

### Corrections

- Uses the actual published table display names.
- Adds stable table-ID fallbacks: 10, 20, 21, 30, 31, 40, and 41.
- Normalizes punctuation, spaces, underscores, and case during discovery.
- Prefers the configured authoritative staging FeatureServer when locating related tables instead of a potentially unrelated web-map view.
- Removes silent no-op persistence behavior.
- Validates add/update capability before related edits.
- Reads each saved related record back from ArcGIS Online before reporting success.
- Shows a blocking alert when a burn-event or preferred-condition save is not persisted.
- Expands the Account dialog status details with the discovered table names and IDs.

### Expected production status

Before entering related data, the Account dialog should show `Connected (7/7)`.
