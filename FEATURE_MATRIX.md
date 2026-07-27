
## Version 3.5 targeted corrections

* Default ArcGIS popup disabled; custom Map Tools identification remains the authoritative feature-detail interface.
* Map Tools drawer initially collapsed and keyboard/ARIA state synchronized.
* Dashboard KPI labels and values centered.
* California NWS fire-weather retrieval uses state and Western Region fallback paths and awaits park-unit impact results.

# Feature Matrix — Version 3.5

| Capability | Version 3.5 implementation | Production dependency |
|---|---|---|
| Burn-unit map/list | Reads `RxBurns_Poly`; custom score overlay | Correct sharing, query access, verified field mapping |
| Burn-unit add/update | `FeatureLayer.applyEdits()` with capability checks | OAuth, staff edit privileges, approved layer/view settings |
| Domain-driven forms | Runtime field aliases and coded/subtype domains | Correct domains in `RxBurns_Poly`; verify contingent-value requirements |
| Burn List filters | Runtime domain choices; fixed blank-year logic | Authoritative values and view definition expression |
| Point forecast | NWS points, hourly, daily, and grid endpoints | Internet access to `api.weather.gov`; operational verification |
| Seven-day burn score | Compares available forecast values with preferred ranges | Approved scoring policy and persistent preferred-condition table |
| NWS alerts | Active CA fire-weather alerts and statewide park-unit intersection screening | Reliable park-boundary service and operational verification |
| NWS Spot Forecast | Direct official request link | Planner enters/validates operational request information |
| Smoke display | Conceptual screening wedge and sample sensitive points | Validated smoke model and authoritative receptor layers |
| Burn events | Client interface and current-session records | Related hosted table and GlobalID/GUID relationship |
| Preferred conditions | Client interface and current-session unit state | Related hosted table or mapped persistent fields |
| Notifications | Client interface only | Approved subscriber store, mail service, opt-out, audit trail |
| Accessibility | Semantic structure, keyboard controls, reflow, contrast support | Formal testing with production content and supported assistive technology |

## Version 3.4 alert analysis and selection controls

| Capability | Implementation |
|---|---|
| Clear selected burn unit | Map Tools Identify tab resets unit state and overlay symbology |
| Clear point forecast | Removes the forecast marker and restores the empty point-forecast panel |
| Preserve drawings | Does not cancel SketchViewModel or clear the sketch layer |
| Keyboard access | Escape clears the active map selection when no modal dialog is open |
