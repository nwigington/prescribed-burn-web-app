# Release Notes — Version 3.10

## Burn-event and actual-weather completion

Version 3.10 completes the burn-event form work started after Version 3.9 and uses the fields already present in the supplied `CVD_PrescribedFire_StagingMap_FL.gdb` schema.

### Burn Events

The burn-event dialog now persists and reloads:

- Burn Boss (`BURN_BOSS`)
- Permit / Authorization (`PERMIT_REF`)
- NWS Spot Forecast ID (`SPOT_FORECAST_ID`)
- NWS Spot Forecast URL (`SPOT_FORECAST_URL`)
- Observed Fire Intensity (`INTENSITY_CLASS`)
- Coverage (%) (`COVERAGE_PCT`)
- Effectiveness (`EFFECTIVENESS`)
- Follow-Up Needs (`FOLLOW_UP`)
- Smoke Conditions and Impacts (`SMOKE_NOTES`)
- Burn Event Notes (`EVENT_NOTES`)

The fire-intensity list is read from the ArcGIS Online coded-value domain when available. The file-geodatabase fallback values are Low, Moderate, High, and Extreme.

### Actual Weather and Fire Behavior

`ACTUAL_WEATHER_FIELDS` is now a definition-based structure rather than a two-value array. The form builder can create number inputs, coded direction lists, and multiline text controls from those definitions.

Newly exposed fields include:

- Flame Length (`FLAME_LENGTH_FT`)
- Rate of Spread (`ROS_FT_MIN`)
- Observed Smoke Direction (`SMOKE_DIR`)
- Smoke Behavior (`SMOKE_BEHAVIOR`)
- Observation Notes (`OBS_NOTES`)

Wind and smoke direction controls use the published coded-value domain when available, including Calm and Variable.

The existing web-app Probability of Precipitation value is retained through `OBS_NOTES` because the supplied `Actual_Weather_and_Fire_Behavior` table does not contain a dedicated `POP_PCT` field. Version 3.10 separates that generated note from user-entered observation notes when records are loaded again.

### NWS Spot Forecast

When a user pastes a URL such as `https://spot.weather.gov/forecasts/2600999`, the numeric Spot Forecast ID is extracted automatically. If only the numeric ID is entered, the forecast URL is constructed when the event is saved.

### Validation

- `app.js` passes `node --check`.
- `config.js` passes `node --check`.
- No duplicate HTML IDs were detected.
- All HTML label targets and `aria-controls` targets resolve.
- All cached DOM references resolve to existing elements.
- Stylesheet brace validation passes.
- `config.js` and `styles.css` are unchanged from Version 3.9.
