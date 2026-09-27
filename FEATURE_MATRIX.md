# Feature Matrix — Version 3.8

| Capability | Version 3.8 implementation | Production dependency |
|---|---|---|
| Burn-unit map/list | Reads authoritative `RxBurns_Poly`; separate forecast-score overlay | Correct sharing, query access, verified field mapping |
| Burn-unit add/update | `FeatureLayer.applyEdits()` with capability checks | OAuth, staff edit privileges, approved layer/view settings |
| Domain-driven forms | Runtime field aliases and coded/subtype domains | Correct domains in `RxBurns_Poly` |
| Burn List filters | Runtime domain choices and persisted forecast-score display | Authoritative values and view definition expression |
| Preferred conditions | Loads/upserts `Preferred_Weather_Prescriptions` | Table published in same feature service; Add/Update enabled |
| Forecast history | Creates `Forecast_Runs` and child `Forecast_Periods_and_Scores` | Tables published/editable; OAuth user can add records |
| Seven-day burn score | Scores NWS periods and persists score fields | Approved scoring policy and usable forecast values |
| Burn events | Loads/upserts `Burn_Events` | Related table published/editable |
| Actual weather/fire behavior | Loads/upserts `Actual_Weather_and_Fire_Behavior` | Related table published/editable |
| Notification subscriptions | Loads/adds/deactivates `Notification_Subscriptions` | Restricted table; OAuth; approved subscriber-management policy |
| Notification delivery log | Read/export support only | Approved server-side notification service writes delivery records |
| Fire-effects report export | JSON export of burn units, geometry, prescriptions, forecasts/scores, events, and actual weather | Read access to source layer and related tables |
| Notification PII in report export | Excluded by default; opt-in administrative export | Restricted handling approval if enabled |
| Point forecast | NWS points, hourly, daily, and grid endpoints | Internet access to `api.weather.gov`; operational verification |
| NWS alerts | CA fire-weather alerts and statewide park-unit intersection screening | Reliable park-boundary service |
| NWS Spot Forecast | Direct official request link | Planner validates/enters operational request information |
| Smoke display | Conceptual screening wedge and sensitive-area display | Validated smoke model and authoritative receptor layers for operational use |
| Clear selection | Clears selected unit/forecast point without deleting features or sketches | None |
| Responsive application shell | Resizable desktop split, compact-laptop mode, tablet stack, phone bottom sheet | Production browser testing |
| Accessibility | Semantic structure, keyboard controls, reflow, contrast/reduced-motion support | Formal testing with production content and assistive technology |

## Related-table schema reviewed for v3.8

`RxBurns_Poly.GlobalID` is the parent key for `BURNUNIT_GUID` in `Preferred_Weather_Prescriptions`, `Forecast_Runs`, `Burn_Events`, and `Notification_Subscriptions`. Forecast periods, actual weather, and notification delivery use the supplied second-level GlobalID/GUID relationships. See `FGDB_SCHEMA_REVIEW_v3_8.md`.
