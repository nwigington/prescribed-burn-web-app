# California State Parks Prescribed Fire Operations Hub — Version 3.3

This package is a static ArcGIS Maps SDK for JavaScript application built with vanilla HTML, CSS, and JavaScript through the ArcGIS CDN. Version 3.3 builds on the Version 3.2 production-readiness work for California State Parks ArcGIS Online users, keeps `RxBurns_Poly` as the authoritative burn-unit source and edit target, and adds a centralized map-selection clearing workflow.

## Run locally

Serve the folder through HTTP rather than opening `index.html` with a `file:///` address.

```powershell
cd "C:\path\to\CVD_Prescribed_Fire_GIS_Hub_v3_3"
python -m http.server 8000
```

Open `http://localhost:8000`.

## Version 3.3 changes

- Added an accessible **Clear selection** control to the Map Tools **Identify** tab.
- Clears the active burn-unit selection, selected point-forecast marker, popup state, and point-forecast results without deleting features or clearing an unfinished sketch.
- Restores the default Identify instructions and normal burn-unit symbology after clearing.
- Disables the control when no map selection is active.
- Supports the Escape key as a keyboard equivalent when no dialog is open.
- Treats a new empty-map point forecast as the active selection and clears prior map-selection context.

## Version 3.2 changes

- Darkened the **Map tools** button for reliable contrast over bright basemaps.
- Removed the browser-only demonstration-mode notice.
- Aligned the three Burn Map workflow controls in one row on desktop.
- Aligned the three unit weather resource links in one row on desktop.
- Corrected burn-unit centroid conversion from Web Mercator to geographic coordinates.
- Corrected map-click point-forecast coordinate handling.
- Added explicit NWS timeout and HTTP error reporting so forecast requests do not remain indefinitely busy.
- Added NWS grid-forecast values for quantitative precipitation, transport wind, mixing height, and gust when available.
- Corrected the empty-year filter defect that could remove every burn unit from the Burn List.
- Made Burn List filters and burn-unit forms read field aliases and coded-value domains from `RxBurns_Poly` at runtime.
- Made both **Update forecast data** controls run the same forecast-refresh workflow and populate the seven-day matrix.
- Hid temporary application graphics from the standard ArcGIS Layer List.
- Uses the `RxBurns_Poly` web-map layer, or the configured service layer as a fallback, for query and `applyEdits` operations.
- Added dark native select and option styling for the burn-event form.

## Authoritative burn-layer behavior

The application first searches the configured web map for `RxBurns_Poly` by exact title, matching service URL, or a recognizable prescribed-burn title. When found, that layer becomes the source for:

- burn-unit queries;
- field aliases;
- coded-value domains and subtype domains;
- edit capability checks; and
- add/update operations.

The application draws a separate forecast-score overlay so burn units can be symbolized by high, medium, low, or unknown burn score. That overlay and other temporary graphics are hidden from the ArcGIS Layer List. The authoritative `RxBurns_Poly` layer remains represented in the Layer List.

## ArcGIS configuration

Edit `config.js`.

```javascript
arcgis: {
  portalUrl: "https://www.arcgis.com",
  webMapItemId: "YOUR_WEB_MAP_ITEM_ID"
},

authentication: {
  mode: "oauth",
  oauthAppId: "YOUR_REGISTERED_APP_ID",
  oauthPortalUrl: "https://www.arcgis.com",
  requireSignIn: true,
  popup: false,
  allowedOrganizationId: "YOUR_STATE_PARKS_ORG_ID"
},

prescribedBurns: {
  serviceUrl: "https://services2.arcgis.com/.../FeatureServer/0",
  webMapLayerTitle: "RxBurns_Poly",
  layerId: 0,
  allowFeatureServiceEdits: true,
  requireOAuthForEdits: true
}
```

The field mapping under `prescribedBurns.fields` is treated as a preferred mapping. After the layer loads, the application reconciles those names against actual REST field names and aliases, then builds the form and filters from the layer's domains.

See `ARCGIS_ONLINE_SETUP.md` for the full authorized-user setup and testing sequence.

## Forecast behavior

For a map click or selected burn unit, the application:

1. converts the point or polygon center to WGS 84 longitude and latitude;
2. requests the NWS `/points/{latitude},{longitude}` endpoint;
3. follows the returned hourly, daily, and grid-data URLs;
4. renders the point forecast; and
5. scores the seven daytime forecast periods against the unit's preferred conditions.

NWS does not provide every advanced fire-behavior value through the general point forecast. Dispersion Index and LVORI remain `n/a` unless a future approved source is configured. The official **NWS Spot Forecast** link remains available for operational requests.

## Production limitations still requiring a data design

The following interfaces are present but should not be treated as durable production records until related hosted tables or approved services are configured:

- burn events and actual-weather observations;
- preferred-condition records and forecast snapshots;
- notification subscribers and email delivery;
- conceptual smoke-sensitive area results.

For production, use related tables keyed by GlobalID/GUID, editor tracking, authenticated edits, and an approved notification or integration service. Do not store subscriber email addresses in unsecured client-side state.

## Files

- `index.html` — application structure and dialogs
- `styles.css` — dark glassmorphism and responsive design
- `app.js` — ArcGIS, schema/domain, editing, weather, filtering, and smoke logic
- `config.js` — portal, item, layer, field, weather, and link configuration
- `ARCGIS_ONLINE_SETUP.md` — authorized-user and editable-layer setup
- `PRODUCTION_CHECKLIST.md` — deployment and acceptance checklist
- `ACCESSIBILITY.md` — accessibility implementation and tests
- `FEATURE_MATRIX.md` — feature status and production dependencies
- `RELEASE_NOTES.md` — version-specific corrections
