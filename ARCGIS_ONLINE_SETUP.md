# ArcGIS Online Authorized-User and `RxBurns_Poly` Setup

## Required production access model

Use ArcGIS OAuth for California State Parks named users. The browser API key may remain available for public basemaps during development, but it must not be the authorization mechanism for permanent `RxBurns_Poly` edits.

```javascript
authentication: {
  mode: "oauth",
  oauthAppId: "PASTE_REGISTERED_APPLICATION_ID_HERE",
  oauthPortalUrl: "https://www.arcgis.com",
  requireSignIn: true,
  popup: false,
  allowedOrganizationId: "PASTE_CA_STATE_PARKS_ORGANIZATION_ID_HERE"
}
```

When a valid OAuth application ID is present, the page intentionally does not assign the API key globally. Requests to secured web maps and feature layers then use the signed-in member's ArcGIS credential.

## 1. Host and register the application

1. Publish this folder at its final HTTPS URL, for example `https://gisapps.parks.ca.gov/cvd-prescribed-fire/`.
2. In ArcGIS Online, create or update a **Web Mapping Application** item that points to that URL.
3. Open the application item's **Settings** and register the application.
4. Add the exact deployed URL as an OAuth redirect URI. Register each separate development, test, and production URL used for sign-in.
5. Copy the generated App ID into `authentication.oauthAppId`.
6. Obtain the California State Parks ArcGIS Online organization ID from an administrator and place it in `allowedOrganizationId`.

## 2. Share every dependency consistently

Share these items with the same approved State Parks group or with the organization:

- the web map in `arcgis.webMapItemId`;
- the `RxBurns_Poly` hosted feature layer or hosted feature-layer view;
- park boundaries and all other secured operational layers;
- related tables, tile layers, vector tile layers, and images used by the web map.

Test with a normal staff account, not only an administrator. The account must have query access and the appropriate data-editing privilege.

## 3. Configure `RxBurns_Poly` as the authoritative editable layer

The preferred arrangement is for the configured web map to contain the exact `RxBurns_Poly` layer intended for editing. Configure:

```javascript
prescribedBurns: {
  serviceUrl: "https://services2.arcgis.com/.../FeatureServer/0",
  webMapLayerTitle: "RxBurns_Poly",
  layerId: 0,
  definitionExpression: "",
  allowFeatureServiceEdits: true,
  requireOAuthForEdits: true
}
```

Use the layer endpoint ending in `/FeatureServer/0`, not only the FeatureServer root. If the editable layer is a hosted feature-layer view, use the view's layer URL and configure editing on that view.

The application chooses the source layer in this order:

1. exact web-map layer title;
2. exact configured service-layer URL; or
3. a feature layer whose title contains `RxBurn` or `prescribed burn`.

Temporary score, sketch, smoke, sensitive-area, and point-marker graphics are hidden from the standard Layer List. The source `RxBurns_Poly` layer is the layer used by `queryFeatures()` and `applyEdits()`.

## 4. Required feature-service capabilities

For loading:

- `Query` must be enabled;
- geometry must be returned;
- the item must be shared to the signed-in user;
- the hosted view's definition expression must include the intended records.

For the current form workflow:

- enable **Add** for new burn units;
- enable **Update** for attribute and geometry edits;
- enable **Delete** only if an approved deletion workflow is later added;
- retain editor tracking;
- restrict editing to authenticated users;
- configure ownership-based access only if it matches program requirements.

The application evaluates the layer's editing properties and operation capabilities at runtime. A user without add/update authorization receives a visible error rather than a false successful save.

## 5. Fields and domains

The configuration contains preferred field names:

```javascript
fields: {
  objectId: "OBJECTID",
  globalId: "GlobalID",
  name: "BURN_UNIT",
  parkUnit: "PARK_UNIT",
  locality: "LOCALITY",
  state: "STATE",
  status: "STATUS",
  priority: "PRIORITY",
  burnWindow: "BURN_WINDOW",
  fuel: "FUEL_TYPE",
  ignitionMethod: "IGNITION_METHOD",
  acres: "ACRES_BURNED",
  startDate: "START_DATE",
  endDate: "COMPLETED_DATE",
  lastBurned: "LAST_BURNED",
  objective: "OBJECTIVE",
  notes: "COMMENTS",
  lastUpdated: "LAST_UPDATED"
}
```

After loading the layer, the application reconciles these against actual REST field names and aliases. It uses coded-value domains, including subtype-specific domains, to populate:

- Park Unit;
- Locality / County;
- State;
- Status;
- Priority;
- Burn Window;
- Primary Fuel; and
- Ignition Method.

Open the browser console and look for `RxBurns_Poly field mapping:`. Confirm every semantic key maps to the intended field. Automatic matching is a safeguard, not a substitute for verifying the authoritative schema.

## 6. Direct REST verification

While signed in as a normal intended user, open the actual layer URL and run **Query** with:

```text
where: 1=1
returnCountOnly: true
```

Expected results:

- a count greater than zero means the view is accessible and contains records;
- zero means the layer is accessible but the view/filter contains no records;
- token required or permission denied means sharing/authentication is incomplete;
- layer not found means the service URL or layer number is wrong.

Also verify that the REST layer page lists the intended coded-value domains and editing capabilities.

## 7. Why the Burn List previously displayed zero records

The previous filter logic converted blank year fields with `Number("")`, which produces `0`. The blank **Last Burned Year (To)** field therefore behaved as year zero and rejected every normal record. Version 3.2 treats blank years as `null` and only applies the year comparison when the user enters a value.

## 8. Production data still needing related tables

`RxBurns_Poly` can be the authoritative burn-unit geometry and attributes layer. Durable production storage should use related hosted tables for:

- preferred weather prescriptions;
- forecast snapshots and scores;
- burn events and actual weather;
- notification subscribers and delivery status.

Use GlobalID-to-GUID relationships and authenticated edits. Subscriber email addresses should be handled through an approved secured service rather than exposed or retained only in browser memory.

## Troubleshooting

1. Confirm the app is served over HTTP/HTTPS, not `file:///`.
2. Confirm the OAuth redirect URI exactly matches the deployed application URL.
3. Confirm the user belongs to the organization/group sharing every dependency.
4. Confirm `RxBurns_Poly` is the intended layer or view and the URL ends in `/FeatureServer/<layerId>`.
5. Confirm add/update capability with the same non-admin user.
6. Open Developer Tools and inspect Console and Network requests for `/query`, `/applyEdits`, `/sharing/rest/oauth2/authorize`, and NWS `/points/` requests.
7. Confirm the web map does not contain a second similarly named burn layer that could be selected unintentionally.
