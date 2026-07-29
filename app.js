const CONFIG = window.APP_CONFIG;

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const DEFAULT_NWS_HAZARD_COLORS = {
  "Red Flag Warning": "#FF1493",
  "Fire Weather Watch": "#FFDEAD",
  "Extreme Fire Danger": "#E9967A",
  "Fire Warning": "#A0522D"
};

const CONDITION_DEFINITIONS = [
  { key: "temperature", label: "Temperature (°F)", min: true, max: true },
  { key: "relativeHumidity", label: "Relative humidity (%)", min: true, max: true },
  { key: "windSpeed", label: "Wind speed (mph)", min: true, max: true },
  { key: "windGust", label: "Wind gust (mph)", min: true, max: true },
  { key: "quantitativePrecipitation", label: "Quantitative precipitation (in)", min: true, max: true },
  { key: "probabilityPrecipitation", label: "Probability of precipitation (%)", min: true, max: true },
  { key: "transportWindSpeed", label: "Transport wind speed (mph)", min: true, max: true },
  { key: "dispersionIndex", label: "Dispersion index", min: true, max: true },
  { key: "mixingHeight", label: "Mixing height (ft)", min: true, max: true },
  { key: "lvori", label: "LVORI", min: true, max: true }
];

const ACTUAL_WEATHER_FIELDS = [
  ["temperature", "Temperature (°F)"],
  ["relativeHumidity", "Relative humidity (%)"],
  ["windSpeed", "Wind speed (mph)"],
  ["windDirection", "Wind direction"],
  ["windGust", "Wind gust (mph)"],
  ["quantitativePrecipitation", "Quantitative precipitation (in)"],
  ["probabilityPrecipitation", "Probability of precipitation (%)"],
  ["transportWindSpeed", "Transport wind speed (mph)"],
  ["transportWindDirection", "Transport wind direction"],
  ["dispersionIndex", "Dispersion index"],
  ["mixingHeight", "Mixing height (ft)"],
  ["lvori", "LVORI"]
];


const BURN_FIELD_CANDIDATES = {
  name: ["BURN_UNIT", "BURNUNIT", "BURN_UNIT_NAME", "UNIT_NAME", "BURN NAME", "BURN UNIT NAME", "NAME"],
  parkUnit: ["PARK_UNIT", "PARKUNIT", "UNITNAME", "UNIT_NAME", "PARK", "PARK UNIT", "PARK NAME"],
  locality: ["LOCALITY", "COUNTY", "COUNTY_NAME", "COUNTYNAME", "LOCALITY / COUNTY", "LOCALITY COUNTY"],
  state: ["STATE", "STATE_NAME", "STATENAME"],
  status: ["STATUS", "BURN_STATUS", "BURNSTATUS", "ACTIVITY_STATUS", "ACTIVE_STATUS"],
  priority: ["PRIORITY", "BURN_PRIORITY", "BURNPRIORITY"],
  burnWindow: ["BURN_WINDOW", "BURNWINDOW", "BURN SEASON", "BURN_SEASON", "WINDOW"],
  fuel: ["FUEL_TYPE", "FUELTYPE", "PRIMARY_FUEL", "PRIMARY FUEL", "FUELS", "FUEL"],
  ignitionMethod: ["IGNITION_METHOD", "IGNITIONMETHOD", "IGNITION METHOD", "IGNITION", "FIRING_METHOD"],
  acres: ["ACRES_BURNED", "ACRES", "DRAWN_ACRES", "GIS_ACRES", "SHAPE_ACRES", "ACREAGE"],
  startDate: ["START_DATE", "PLANNED_DATE", "PLANNED_BURN_DATE", "DATE_CREATED", "CREATED_DATE"],
  endDate: ["COMPLETED_DATE", "END_DATE", "ACTUAL_DATE", "ACTUAL_BURN_DATE"],
  lastBurned: ["LAST_BURNED", "LAST_BURN_DATE", "DATE_LAST_BURNED", "LASTBURNED"],
  objective: ["OBJECTIVE", "PRIMARY_OBJECTIVE", "BURN_OBJECTIVE", "MANAGEMENT_OBJECTIVE"],
  notes: ["COMMENTS", "NOTES", "REMARKS", "DESCRIPTION"],
  lastUpdated: ["LAST_UPDATED", "LASTUPDATE", "EDITDATE", "LAST_EDITED_DATE"]
};

const FALLBACK_DOMAIN_VALUES = {
  status: ["Active", "Inactive"],
  priority: ["High", "Normal", "Low"],
  burnWindow: ["Growing", "Dormant", "Year-Round"],
  fuel: ["Grass", "Shrubs", "Litter", "Slash", "Timber"],
  ignitionMethod: ["Backing/Spot", "Head/Aerial"],
  state: ["California"]
};

const state = {
  mapElement: null,
  view: null,
  modules: {},
  layers: {},
  sourceLayer: null,
  alertParkLayer: null,
  oauthInfo: null,
  portal: null,
  credential: null,
  authMode: "apiKey",
  user: null,
  dataLoadError: null,
  units: [],
  filteredUnits: [],
  selectedUnitId: null,
  selectedGraphic: null,
  pendingGraphic: null,
  editingUnitId: null,
  drawingMode: null,
  currentTool: "identify",
  currentPanel: "overview",
  isDemo: true,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  weatherAbortController: null,
  forecastCache: new Map(),
  nwsZoneGeometryCache: new Map(),
  lastPointForecast: null,
  page: 1,
  rowsPerPage: 25,
  sortDirection: "asc",
  confirmCallback: null,
  fieldSchema: {},
  domainOptions: {},
  sourceLayerInWebMap: false,
  sourceCanEdit: false
};

const dom = {};

const OPERATIONS_PANEL_STORAGE_KEY =
  "cvd-prescribed-fire-operations-panel-collapsed";

/**
 * Expands or collapses the desktop operations panel.
 *
 * @param {boolean} collapsed
 */
function setOperationsPanelCollapsed(collapsed) {
  if (
    !dom.workspace ||
    !dom.operationsPanel ||
    !dom.operationsPanelToggle ||
    !dom.operationsPanelArrow ||
    !dom.operationsPanelToggleText
  ) {
    return;
  }

  dom.workspace.classList.toggle(
    "is-operations-collapsed",
    collapsed
  );

  dom.operationsPanelToggle.setAttribute(
    "aria-expanded",
    String(!collapsed)
  );

  dom.operationsPanel.setAttribute(
    "aria-hidden",
    String(collapsed)
  );

  dom.operationsPanelArrow.textContent = collapsed ? "‹" : "›";

  const actionText = collapsed
    ? "Expand operations panel"
    : "Collapse operations panel";

  dom.operationsPanelToggleText.textContent = actionText;
  dom.operationsPanelToggle.title = actionText;

  window.setTimeout(() => {
    const mapView = state.view || state.mapElement?.view;
    if (mapView && typeof mapView.resize === "function") {
      mapView.resize();
    }
  }, state.reducedMotion ? 0 : 260);
}

function initializeOperationsPanelToggle() {
  if (!dom.operationsPanelToggle || !dom.workspace) return;

  dom.operationsPanelToggle.addEventListener("click", () => {
    const isCurrentlyCollapsed =
      dom.workspace.classList.contains("is-operations-collapsed");
    const newCollapsedState = !isCurrentlyCollapsed;

    setOperationsPanelCollapsed(newCollapsedState);

    try {
      localStorage.setItem(
        OPERATIONS_PANEL_STORAGE_KEY,
        String(newCollapsedState)
      );
    } catch (error) {
      console.warn(
        "Operations panel preference could not be saved.",
        error
      );
    }
  });

  let savedOperationsPanelState = false;
  try {
    savedOperationsPanelState =
      localStorage.getItem(OPERATIONS_PANEL_STORAGE_KEY) === "true";
  } catch (error) {
    console.warn(
      "Operations panel preference could not be read.",
      error
    );
  }

  setOperationsPanelCollapsed(savedOperationsPanelState);
}

initialize().catch((error) => {
  console.error(error);
  const badge = document.getElementById("dataModeBadge");
  if (badge) badge.textContent = "Load error";
  announce("The application could not finish loading.");
});

async function initialize() {
  cacheDom();
  initializeOperationsPanelToggle();
  applyBrandingAndLinks();
  buildConditionForms();
  populateDirectionOptions();
  initializeNavigation();
  initializeCollapsibleSections();
  initializeDialogs();
  initializeFormsAndControls();
  initializeMapToolTabs();
  initializeUnitSubnavigation();

  const [
    Graphic,
    GraphicsLayer,
    FeatureLayer,
    Polygon,
    Point,
    SketchViewModel,
    geometryEngine,
    esriRequest,
    OAuthInfo,
    identityManager,
    Portal,
    webMercatorUtils
  ] = await $arcgis.import([
    "@arcgis/core/Graphic.js",
    "@arcgis/core/layers/GraphicsLayer.js",
    "@arcgis/core/layers/FeatureLayer.js",
    "@arcgis/core/geometry/Polygon.js",
    "@arcgis/core/geometry/Point.js",
    "@arcgis/core/widgets/Sketch/SketchViewModel.js",
    "@arcgis/core/geometry/geometryEngine.js",
    "@arcgis/core/request.js",
    "@arcgis/core/identity/OAuthInfo.js",
    "@arcgis/core/identity/IdentityManager.js",
    "@arcgis/core/portal/Portal.js",
    "@arcgis/core/geometry/support/webMercatorUtils.js"
  ]);

  Object.assign(state.modules, {
    Graphic,
    GraphicsLayer,
    FeatureLayer,
    Polygon,
    Point,
    SketchViewModel,
    geometryEngine,
    esriRequest,
    OAuthInfo,
    identityManager,
    Portal,
    webMercatorUtils
  });

  await initializeAuthentication();

  await customElements.whenDefined("arcgis-map");
  configureMapElement();
  await state.mapElement.viewOnReady();
  state.view = state.mapElement.view;
  configureMapAccessibility();
  configureMapPopupBehavior();

  createOperationalLayers();
  await resolveParkLayer();
  await resolveAlertImpactLayer();
  initializeSketch();
  initializeMapInteractions();

  // Start the NWS request independently so a secured or misconfigured ArcGIS
  // layer cannot leave the alert section spinning indefinitely.
  const alertsPromise = loadFireWeatherAlerts();
  await loadUnitsSafely();
  buildSensitiveAreaGraphics();
  renderAll();
  await alertsPromise;
  updateRefreshTimestamp();
  announce("Prescribed Fire Operations Hub loaded.");
}

function cacheDom() {
  const ids = [
    "app", "appTitle", "appSubtitle", "brandLogo", "refreshButton", "lastUpdated", "accountButton",
    "map", "operations-panel", "operationsPanelToggle", "operationsPanelArrow", "operationsPanelToggleText", "demoBanner", "dataModeBadge",
    "mapToolsToggle", "mapToolsDrawer", "closeMapTools",
    "identifyEmpty", "identifyContent", "identifyName", "identifyScore", "identifyDetails",
    "identifyConditions", "manageSelectedUnit", "updateSelectedForecast", "clearMapSelectionButton", "drawSquareButton",
    "drawPolygonButton", "clearDrawingButton", "saveDrawingButton", "drawnAcres", "drawInstructions",
    "layerToggles", "kpiTotalBurns", "kpiActiveBurns", "kpiPlannedAcres", "kpiGoDays",
    "weatherAlerts", "alertStatus", "overviewBurnList", "openMapToolsFromPanel", "burnFilters",
    "burnSearch", "filterStatusOptions", "filterPriorityOptions", "filterBurnWindowOptions",
    "parkFilter", "fuelFilter", "ignitionFilter", "filterGoDays", "lastBurnedFrom",
    "lastBurnedTo", "localityFilter", "resetFilters", "burnResultCount", "burnTableBody",
    "burnCardList", "rowsPerPage", "prevPage", "nextPage", "pageStatus", "unitTitle",
    "backToListButton", "unitDetailsSection", "unitWeatherSection", "unitEventsSection",
    "unitDetailsGrid", "editUnitDetailsButton", "editBurnAreaButton", "toggleUnitStatusButton",
    "notificationToggle", "subscriberList", "subscriberForm", "subscriberName", "subscriberEmail",
    "preferredConditionsSummary", "editConditionsButton", "editConditionsButton2", "smokeToggle",
    "transportDirection", "directionalDegrees", "plumeDistance", "resetSmokeButton",
    "sensitiveAreaSummary", "forecastUpdated", "refreshUnitForecastButton", "forecastMatrixHead",
    "forecastMatrixBody", "addBurnEventButton", "eventTableBody", "weatherLoading", "weatherEmpty",
    "weatherContent", "weatherCoordinates", "weatherLocation", "weatherTemperature",
    "weatherShortForecast", "weatherHumidity", "weatherWind", "weatherGust", "weatherPrecip",
    "hourlyForecastRows", "focusMapButton", "supportContact", "helpButton", "helpDialog",
    "helpContact", "unitDialog", "unitForm", "unitDialogTitle", "unitId", "unitName", "unitPark", "saveUnitButton",
    "unitBurnWindow", "unitAcres", "unitState", "unitLocality", "unitStatus", "unitPriority",
    "unitFuel", "unitIgnition", "unitObjective", "unitNotes", "conditionsDialog",
    "conditionsForm", "conditionsFields", "eventDialog", "eventForm", "eventDialogTitle", "eventId",
    "plannedBurnDate", "actualBurnDate", "burnCanceled", "treatmentType", "plannedAcres",
    "actualAcres", "eventNotes", "actualWeatherFields", "confirmDialog", "confirmTitle",
    "confirmMessage", "confirmCancel", "confirmAction", "liveRegion", "spotForecastDashboardLink",
    "nwsFireWeatherLink", "watchDutyLink", "burnProLink", "spotForecastUnitLink", "pointForecastLink",
    "fireWeatherDashboardUnitLink", "spotForecastPlannerLink", "forecastOfficeLink", "accountDialog", "accountStatus", "accountUser", "arcgisSignInButton", "logoutButton"
  ];

  for (const id of ids) dom[id] = document.getElementById(id);
  dom.workspace = document.querySelector(".workspace");
  dom.operationsPanel = dom["operations-panel"];
  state.mapElement = dom.map;
}

function applyBrandingAndLinks() {
  document.title = CONFIG.appTitle;
  dom.appTitle.textContent = CONFIG.appTitle;
  dom.appSubtitle.textContent = CONFIG.appSubtitle;

  if (CONFIG.brandLogoUrl) {
    dom.brandLogo.src = CONFIG.brandLogoUrl;
    dom.brandLogo.alt = CONFIG.brandLogoAlt || "Agency emblem";
    dom.brandLogo.addEventListener("error", () => { dom.brandLogo.hidden = true; }, { once: true });
  } else {
    dom.brandLogo.hidden = true;
  }

  if (CONFIG.supportEmail) {
    const link = document.createElement("a");
    link.href = `mailto:${CONFIG.supportEmail}`;
    link.textContent = CONFIG.supportEmail;
    dom.supportContact.append("Questions or access issues: ", link);

    const helpLink = link.cloneNode(true);
    dom.helpContact.textContent = "Contact ";
    dom.helpContact.append(helpLink, " and describe the page, control, assistive technology, browser, and the result you expected.");
  }

  const links = CONFIG.externalLinks;
  const assignments = [
    [dom.spotForecastDashboardLink, links.nwsSpotForecastRequest],
    [dom.spotForecastUnitLink, links.nwsSpotForecastRequest],
    [dom.spotForecastPlannerLink, links.nwsSpotForecastRequest],
    [dom.nwsFireWeatherLink, links.nwsFireWeather],
    [dom.fireWeatherDashboardUnitLink, links.nwsFireWeather],
    [dom.watchDutyLink, links.watchDuty],
    [dom.burnProLink, links.burnPro3D],
    [dom.forecastOfficeLink, links.nwsHome]
  ];
  for (const [element, href] of assignments) {
    if (element) element.href = href;
  }
}

function getAuthenticationConfig() {
  return CONFIG.authentication || {};
}

function hasOAuthConfiguration() {
  const auth = getAuthenticationConfig();
  const mode = String(auth.mode || "auto").toLowerCase();
  return ["auto", "oauth"].includes(mode) &&
    typeof auth.oauthAppId === "string" &&
    auth.oauthAppId.trim().length > 10;
}

async function initializeAuthentication() {
  const auth = getAuthenticationConfig();
  state.authMode = hasOAuthConfiguration() ? "oauth" : "apiKey";

  if (state.authMode !== "oauth") {
    updateAccountUi();
    return;
  }

  const portalUrl = String(auth.oauthPortalUrl || CONFIG.arcgis.portalUrl || "https://www.arcgis.com").replace(/\/$/, "");
  const info = new state.modules.OAuthInfo({
    appId: auth.oauthAppId.trim(),
    portalUrl,
    popup: Boolean(auth.popup),
    preserveUrlHash: !Boolean(auth.popup),
    flowType: "auto"
  });
  state.oauthInfo = info;
  state.modules.identityManager.registerOAuthInfos([info]);

  try {
    const sharingUrl = `${portalUrl}/sharing`;
    if (auth.requireSignIn !== false) {
      state.credential = await state.modules.identityManager.getCredential(sharingUrl);
    } else {
      state.credential = await state.modules.identityManager.checkSignInStatus(sharingUrl).catch(() => null);
    }

    if (state.credential) await loadSignedInPortal(portalUrl);
  } catch (error) {
    console.warn("ArcGIS user authentication was not completed.", error);
    updateAccountUi(error);
  }
}

async function loadSignedInPortal(portalUrl) {
  const portal = new state.modules.Portal({ url: portalUrl, authMode: "immediate" });
  await portal.load();

  const allowedOrganizationId = String(getAuthenticationConfig().allowedOrganizationId || "").trim();
  const userOrganizationId = portal.user?.orgId || portal.id || "";
  if (allowedOrganizationId && userOrganizationId !== allowedOrganizationId) {
    state.modules.identityManager.destroyCredentials();
    state.credential = null;
    state.portal = null;
    state.user = null;
    throw new Error("The signed-in ArcGIS account is not a member of the authorized organization.");
  }

  state.portal = portal;
  state.user = portal.user || null;
  updateAccountUi();
}

async function signInUser() {
  if (!hasOAuthConfiguration()) {
    dom.accountStatus.textContent = "OAuth is not configured";
    dom.accountUser.textContent = "Enter an ArcGIS OAuth application ID in config.js, then reload the application.";
    return;
  }

  try {
    const portalUrl = String(getAuthenticationConfig().oauthPortalUrl || CONFIG.arcgis.portalUrl).replace(/\/$/, "");
    state.credential = await state.modules.identityManager.getCredential(`${portalUrl}/sharing`);
    await loadSignedInPortal(portalUrl);
    dom.accountDialog.close();
    window.location.reload();
  } catch (error) {
    console.error("ArcGIS sign-in failed.", error);
    updateAccountUi(error);
  }
}

function signOutUser() {
  state.modules.identityManager?.destroyCredentials();
  state.credential = null;
  state.portal = null;
  state.user = null;
  updateAccountUi();
  window.location.reload();
}

function updateAccountUi(error = null) {
  if (!dom.accountStatus || !dom.accountUser) return;

  if (state.user) {
    const displayName = state.user.fullName || state.user.username || "ArcGIS user";
    dom.accountStatus.textContent = "Signed in";
    dom.accountUser.textContent = `${displayName}${state.user.username && state.user.fullName ? ` (${state.user.username})` : ""}`;
    dom.accountButton.textContent = state.user.username || "Account";
    dom.arcgisSignInButton.disabled = true;
    dom.logoutButton.disabled = false;
    return;
  }

  dom.accountStatus.textContent = error ? "Sign-in required" : (state.authMode === "oauth" ? "Not signed in" : "API key mode");
  dom.accountUser.textContent = error
    ? safeText(error.message, "ArcGIS sign-in did not complete.")
    : (state.authMode === "oauth"
      ? "Sign in with an authorized California State Parks ArcGIS account."
      : "OAuth is not configured. Public or API-key-authorized items only can load.");
  dom.accountButton.textContent = "Account";
  dom.arcgisSignInButton.disabled = state.authMode !== "oauth";
  dom.logoutButton.disabled = true;
}

function configureMapElement() {
  const authRequiredButUnavailable =
    state.authMode === "oauth" &&
    getAuthenticationConfig().requireSignIn !== false &&
    !state.credential;

  if (CONFIG.arcgis.webMapItemId && !authRequiredButUnavailable) {
    state.mapElement.itemId = CONFIG.arcgis.webMapItemId;
  } else {
    state.mapElement.basemap = CONFIG.arcgis.basemap;
    state.mapElement.center = CONFIG.arcgis.center;
    state.mapElement.zoom = CONFIG.arcgis.zoom;
  }
  state.mapElement.animationsDisabled = state.reducedMotion;
}

function configureMapAccessibility() {
  state.mapElement.aria = {
    label: "Prescribed fire planning and operations map",
    description: "Map showing prescribed burn units, conceptual smoke-screening polygons, and sensitive areas. Use the Burn list for a text alternative."
  };
}

function configureMapPopupBehavior() {
  // This application presents selected-feature details in the accessible Map
  // Tools drawer. Disable the ArcGIS default popup so it cannot cover the
  // drawer, map controls, or operational side panel.
  state.mapElement.popupDisabled = true;
  if (!state.view) return;
  state.view.popupEnabled = false;
  try {
    state.view.closePopup();
  } catch (error) {
    console.debug("The ArcGIS popup was not open during initialization.", error);
  }
  try {
    state.view.popup = null;
  } catch (error) {
    console.debug("The ArcGIS popup instance could not be cleared.", error);
  }
}

function createOperationalLayers() {
  const { GraphicsLayer } = state.modules;
  // These are temporary application overlays, not authoritative web-map layers.
  // Keep them out of the ArcGIS Layer List and expose them through the custom
  // Map Tools legend/toggles instead.
  state.layers.burn = new GraphicsLayer({ title: "Prescribed burn score overlay", listMode: "hide" });
  state.layers.burnMarkers = new GraphicsLayer({ title: "Burn unit marker overlay", listMode: "hide" });
  state.layers.sensitive = new GraphicsLayer({ title: "Smoke-sensitive area overlay", visible: false, listMode: "hide" });
  state.layers.smoke = new GraphicsLayer({ title: "Conceptual smoke-screening overlay", visible: true, listMode: "hide" });
  state.layers.sketch = new GraphicsLayer({ title: "Burn unit drawing", listMode: "hide" });
  state.layers.marker = new GraphicsLayer({ title: "Forecast location", listMode: "hide" });

  state.mapElement.map.addMany([
    state.layers.burn,
    state.layers.burnMarkers,
    state.layers.sensitive,
    state.layers.smoke,
    state.layers.sketch,
    state.layers.marker
  ]);
}

async function resolveParkLayer() {
  const parkConfig = CONFIG.parkBoundaries;
  const { FeatureLayer } = state.modules;
  let layer = null;

  try {
    if (CONFIG.arcgis.webMapItemId) {
      const configuredUrl = normalizeServiceLayerUrl(parkConfig.serviceUrl);
      layer = state.mapElement.map.allLayers.find((item) =>
        normalize(item.title) === normalize(parkConfig.webMapLayerTitle)
        || (configuredUrl && normalizeServiceLayerUrl(item.url) === configuredUrl)
      ) || null;
      if (layer) await layer.load();
    }

    if (!layer && parkConfig.serviceUrl) {
      const url = await resolveFeatureLayerUrl(
        parkConfig.serviceUrl,
        parkConfig.layerId,
        parkConfig.webMapLayerTitle
      );
      layer = new FeatureLayer({
        url,
        title: parkConfig.webMapLayerTitle || "Park Boundaries",
        definitionExpression: parkConfig.definitionExpression || undefined,
        outFields: ["*"],
        opacity: 0.72,
        popupEnabled: false,
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: [75, 145, 192, 0.05],
            outline: { color: [115, 183, 230, 0.95], width: 1.4 }
          }
        }
      });
      state.mapElement.map.add(layer, 0);
      await layer.load();
    }

    if (layer) layer.visible = Boolean(parkConfig.initiallyVisible);
    state.layers.parks = layer;
  } catch (error) {
    console.warn("The configured park-boundary layer could not be loaded.", error);
    state.layers.parks = null;
  }
}

async function resolveAlertImpactLayer() {
  const impactConfig = CONFIG.alertImpacts || {};
  const serviceUrl = impactConfig.parkBoundaryServiceUrl;
  if (!serviceUrl) {
    state.alertParkLayer = state.layers.parks || null;
    return;
  }

  try {
    const { FeatureLayer } = state.modules;
    const url = await resolveFeatureLayerUrl(
      serviceUrl,
      impactConfig.parkBoundaryLayerId,
      "State Park boundaries for alert screening"
    );
    const layer = new FeatureLayer({
      url,
      title: "State Park boundaries for alert screening",
      outFields: [impactConfig.parkNameField || "UNITNAME"],
      definitionExpression: impactConfig.definitionExpression || undefined,
      popupEnabled: false,
      listMode: "hide"
    });
    await layer.load();
    state.alertParkLayer = layer;
  } catch (error) {
    console.warn("State Park alert-screening boundaries could not be loaded; using the map boundary layer when available.", error);
    state.alertParkLayer = state.layers.parks || null;
  }
}

function initializeSketch() {
  const { SketchViewModel } = state.modules;
  state.sketchVM = new SketchViewModel({
    view: state.view,
    layer: state.layers.sketch,
    polygonSymbol: editingPolygonSymbol(),
    updateOnGraphicClick: false,
    defaultUpdateOptions: {
      tool: "reshape",
      enableRotation: false,
      enableScaling: true,
      preserveAspectRatio: false,
      toggleToolOnClick: false
    }
  });

  state.sketchVM.on("create", (event) => {
    if (event.state === "active") updateDrawnAcres(event.graphic?.geometry);
    if (event.state === "complete") {
      state.pendingGraphic = event.graphic;
      state.drawingMode = null;
      updateDrawnAcres(event.graphic.geometry);
      dom.saveDrawingButton.disabled = false;
      dom.drawInstructions.textContent = "Adjust vertices as needed. Select Save drawing when the boundary is complete.";
      announce("Polygon drawing complete. Save drawing is available.");
    }
    if (event.state === "cancel") state.drawingMode = null;
  });

  state.sketchVM.on("update", (event) => {
    const graphic = event.graphics?.[0];
    if (graphic) {
      state.pendingGraphic = graphic;
      updateDrawnAcres(graphic.geometry);
    }
    if (event.state === "complete") {
      dom.saveDrawingButton.disabled = false;
      announce("Burn unit geometry updated. Select Save drawing to keep the change.");
    }
  });
}

function initializeMapInteractions() {
  state.view.on("click", async (event) => {
    if (state.drawingMode === "polygon") return;
    if (state.drawingMode === "square") {
      createSimpleSquare(event.mapPoint);
      return;
    }

    const response = await state.view.hitTest(event);
    const hit = response.results.find((result) => {
      const graphic = result.graphic;
      return graphic?.attributes?.layerType === "burn" || graphic?.attributes?.layerType === "burn-marker";
    });

    if (hit) {
      const id = hit.graphic.attributes.unitId;
      await selectUnit(id, { zoom: true, openPanel: false });
      activateMapTool("identify");
      return;
    }

    const point = event.mapPoint;
    if (point) {
      // A point forecast becomes the active map selection. Clear prior map
      // selection state without touching an unfinished burn-unit sketch.
      clearMapSelection({ clearForecast: true, announceChange: false, preservePanel: true });
      await selectWeatherLocation(point, true);
    }
  });

  state.view.watch("scale", updateScaleVisibility);
}

async function loadUnitsSafely() {
  try {
    state.dataLoadError = null;
    await loadUnits();
    return true;
  } catch (error) {
    console.error("Prescribed burn units could not be loaded.", error);
    state.sourceLayer = null;
    state.dataLoadError = error;

    if (CONFIG.prescribedBurns.fallbackToDemoOnLoadError) {
      state.isDemo = true;
      state.units = buildDemoUnits();
      setDataMode("Sample fallback", true);
      setDataBanner(
        "Burn layer unavailable — sample records shown",
        `${safeText(error.message, "The prescribed-burn layer could not be loaded.")} Check OAuth, item sharing, layer ID, service URL, and field mappings.`
      );
    } else {
      state.isDemo = false;
      state.units = [];
      setDataMode("Burn layer unavailable", true);
      setDataBanner(
        "Prescribed burn layer unavailable",
        `${safeText(error.message, "The prescribed-burn layer could not be loaded.")} NWS alerts and public planning resources remain available.`
      );
    }
    return false;
  }
}

function setDataBanner(title, message) {
  const heading = dom.demoBanner?.querySelector("strong");
  const detail = dom.demoBanner?.querySelector("span");
  if (heading) heading.textContent = title;
  if (detail) detail.textContent = message;
  if (dom.demoBanner) dom.demoBanner.hidden = false;
}

async function loadUnits() {
  const configuredLayer = await resolveSourceBurnLayer();
  if (configuredLayer) {
    state.sourceLayer = configuredLayer;
    const query = configuredLayer.createQuery();
    query.where = CONFIG.prescribedBurns.definitionExpression || "1=1";
    query.outFields = ["*"];
    query.returnGeometry = true;
    const result = await configuredLayer.queryFeatures(query);
    state.units = result.features.map(unitFromFeature).filter(Boolean);
    populateUnitFormOptions();
    populateBurnFilterOptions();
    state.isDemo = false;
    setDataMode("Live ArcGIS layer", false);
    dom.demoBanner.hidden = true;
    return;
  }

  if (!CONFIG.prescribedBurns.useDemoWhenUnconfigured) {
    state.isDemo = false;
    state.units = [];
    setDataMode("No burn layer configured", true);
    setDataBanner(
      "No prescribed-burn layer configured",
      "Set prescribedBurns.serviceUrl and prescribedBurns.layerId in config.js."
    );
    return;
  }

  state.isDemo = true;
  setDataMode("Sample records", true);
  dom.demoBanner.hidden = true;
  const saved = loadLocalUnits();
  state.units = saved?.length ? saved : buildDemoUnits();
  persistLocalUnits();
}

async function resolveSourceBurnLayer() {
  const burnConfig = CONFIG.prescribedBurns;
  const { FeatureLayer } = state.modules;

  if (state.authMode === "oauth" && getAuthenticationConfig().requireSignIn !== false && !state.credential) {
    throw new Error("ArcGIS sign-in is required before the prescribed-burn layer can be loaded.");
  }

  // Prefer the authoritative layer already contained in the configured web map.
  // This avoids a duplicate service layer and preserves the web map's item,
  // sharing, popup, and editing configuration.
  if (CONFIG.arcgis.webMapItemId) {
    const mapLayer = findBurnLayerInWebMap();
    if (mapLayer) {
      await mapLayer.load();
      state.sourceLayerInWebMap = true;
      mapLayer.popupEnabled = false;
      mapLayer.listMode = "show";
      mapLayer.visible = false;
      reconcileBurnFieldMap(mapLayer);
      configureSchemaDrivenUi(mapLayer);
      updateSourceEditCapability(mapLayer);
      return mapLayer;
    }
  }

  if (burnConfig.serviceUrl) {
    const url = await resolveFeatureLayerUrl(
      burnConfig.serviceUrl,
      burnConfig.layerId,
      burnConfig.webMapLayerTitle
    );
    const layer = new FeatureLayer({
      url,
      title: burnConfig.webMapLayerTitle || "RxBurns_Poly",
      outFields: ["*"],
      definitionExpression: burnConfig.definitionExpression || undefined,
      visible: false,
      popupEnabled: false,
      listMode: "show"
    });
    await layer.load();
    // Add the authoritative source layer to the map so it is represented in the
    // ArcGIS Layer List. The custom burn-score overlay remains the visible map
    // display and writes edits back to this layer.
    if (!state.mapElement.map.allLayers.includes(layer)) state.mapElement.map.add(layer, 1);
    state.sourceLayerInWebMap = false;
    reconcileBurnFieldMap(layer);
    configureSchemaDrivenUi(layer);
    updateSourceEditCapability(layer);
    return layer;
  }

  return null;
}

function findBurnLayerInWebMap() {
  const burnConfig = CONFIG.prescribedBurns || {};
  const layers = state.mapElement?.map?.allLayers?.toArray?.() || [...(state.mapElement?.map?.allLayers || [])];
  const preferredTitle = normalize(burnConfig.webMapLayerTitle);
  const configuredUrl = normalizeServiceLayerUrl(burnConfig.serviceUrl);

  if (preferredTitle) {
    const exactTitle = layers.find((layer) => normalize(layer.title) === preferredTitle);
    if (exactTitle) return exactTitle;
  }
  if (configuredUrl) {
    const exactUrl = layers.find((layer) => normalizeServiceLayerUrl(layer.url) === configuredUrl);
    if (exactUrl) return exactUrl;
  }
  return layers.find((layer) => {
    const title = normalize(layer.title);
    return layer.type === "feature" && (title.includes("rxburn") || title.includes("prescribed burn"));
  }) || null;
}

function normalizeServiceLayerUrl(url) {
  return String(url || "").replace(/\/$/, "").toLowerCase();
}

async function resolveFeatureLayerUrl(serviceUrl, configuredLayerId, preferredTitle) {
  const cleanUrl = String(serviceUrl || "").replace(/\/$/, "");
  if (/\/FeatureServer\/\d+$/i.test(cleanUrl) || /\/MapServer\/\d+$/i.test(cleanUrl)) return cleanUrl;
  if (!/\/(FeatureServer|MapServer)$/i.test(cleanUrl)) return cleanUrl;

  if (Number.isInteger(Number(configuredLayerId)) && configuredLayerId !== null && configuredLayerId !== "") {
    return `${cleanUrl}/${Number(configuredLayerId)}`;
  }

  const response = await state.modules.esriRequest(cleanUrl, {
    query: { f: "json" },
    responseType: "json"
  });
  const metadata = response.data || {};
  if (metadata.error) throw new Error(metadata.error.message || "The feature service metadata request failed.");
  const layers = Array.isArray(metadata.layers) ? metadata.layers : [];
  if (layers.length === 1) return `${cleanUrl}/${layers[0].id}`;

  const titleMatch = layers.find((layer) => normalize(layer.name) === normalize(preferredTitle));
  if (titleMatch) return `${cleanUrl}/${titleMatch.id}`;

  throw new Error(
    `The prescribed-burn service contains ${layers.length || "multiple"} layers. Set prescribedBurns.layerId in config.js or provide a URL ending in /FeatureServer/<layer id>.`
  );
}

function reconcileBurnFieldMap(layer) {
  const configured = CONFIG.prescribedBurns.fields;
  const layerFields = Array.isArray(layer.fields) ? layer.fields : [];

  state.fieldSchema = {};
  if (layer.objectIdField) configured.objectId = layer.objectIdField;
  if (layer.globalIdField) configured.globalId = layer.globalIdField;

  for (const [key, requestedName] of Object.entries(configured)) {
    if (key === "objectId" || key === "globalId") continue;
    let field = findLayerField(layerFields, requestedName);
    if (!field) field = findSemanticLayerField(layerFields, key);
    if (field) {
      configured[key] = field.name;
      state.fieldSchema[key] = field;
    }
  }

  state.fieldSchema.objectId = findLayerField(layerFields, configured.objectId);
  state.fieldSchema.globalId = findLayerField(layerFields, configured.globalId);

  const missing = Object.entries(configured)
    .filter(([key, name]) => key !== "globalId" && name && !layerFields.some((field) => field.name === name))
    .map(([key, name]) => `${key}: ${name}`);
  if (missing.length) {
    console.warn(
      "Some prescribed-burn field mappings could not be reconciled. Update config.js if the automatic alias matching selected the wrong field:",
      missing.join(", "),
      "Available fields:",
      layerFields.map((field) => `${field.name} (${field.alias || field.name})`).join(", ")
    );
  }

  console.info(
    "RxBurns_Poly field mapping:",
    Object.fromEntries(Object.entries(CONFIG.prescribedBurns.fields).map(([key, value]) => [key, value || null]))
  );
}

function findLayerField(fields, requestedName) {
  if (!requestedName) return null;
  const requested = normalizeFieldToken(requestedName);
  return fields.find((field) => normalizeFieldToken(field.name) === requested)
    || fields.find((field) => normalizeFieldToken(field.alias) === requested)
    || null;
}

function findSemanticLayerField(fields, key) {
  const candidates = BURN_FIELD_CANDIDATES[key] || [];
  for (const candidate of candidates) {
    const match = findLayerField(fields, candidate);
    if (match) return match;
  }
  const semantic = normalizeFieldToken(key);
  return fields.find((field) => {
    const name = normalizeFieldToken(field.name);
    const alias = normalizeFieldToken(field.alias);
    return name.includes(semantic) || alias.includes(semantic);
  }) || null;
}

function normalizeFieldToken(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function configureSchemaDrivenUi(layer) {
  state.domainOptions = {};
  for (const key of ["parkUnit", "locality", "state", "status", "priority", "burnWindow", "fuel", "ignitionMethod"]) {
    const field = state.fieldSchema[key];
    state.domainOptions[key] = codedDomainOptionsForField(layer, field);
  }
  applySchemaLabels();
  populateUnitFormOptions();
  populateBurnFilterOptions();
}

function codedDomainOptionsForField(layer, field) {
  if (!field) return [];
  const candidates = [];
  if (Array.isArray(field.domain?.codedValues)) candidates.push(...field.domain.codedValues);
  for (const type of layer.types || []) {
    const domain = type?.domains?.[field.name];
    if (Array.isArray(domain?.codedValues)) candidates.push(...domain.codedValues);
  }
  const seen = new Set();
  return candidates
    .filter((entry) => {
      const token = `${typeof entry.code}:${String(entry.code)}`;
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    })
    .map((entry) => ({ code: entry.code, name: String(entry.name) }));
}

function applySchemaLabels() {
  const controls = {
    unitName: ["name", true], unitPark: ["parkUnit", true], unitLocality: ["locality", true],
    unitState: ["state", true], unitStatus: ["status", true], unitPriority: ["priority", true],
    unitBurnWindow: ["burnWindow", true], unitFuel: ["fuel", true], unitIgnition: ["ignitionMethod", true],
    unitAcres: ["acres", false], unitObjective: ["objective", false], unitNotes: ["notes", false]
  };
  for (const [controlId, [key, required]] of Object.entries(controls)) {
    const label = document.querySelector(`label[for="${controlId}"]`);
    const alias = state.fieldSchema[key]?.alias;
    if (!label || !alias) continue;
    label.textContent = alias;
    if (required) {
      label.append(document.createTextNode(" "));
      const mark = document.createElement("span");
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "*";
      label.append(mark);
    }
  }
  const filterLabels = [
    [dom.filterStatusOptions, "status"],
    [dom.filterPriorityOptions, "priority"],
    [dom.filterBurnWindowOptions, "burnWindow"]
  ];
  for (const [container, key] of filterLabels) {
    const legend = container?.closest("fieldset")?.querySelector("legend");
    const alias = state.fieldSchema[key]?.alias;
    if (legend && alias) legend.textContent = alias;
  }
  const simpleFilterLabels = { parkFilter: "parkUnit", localityFilter: "locality", fuelFilter: "fuel", ignitionFilter: "ignitionMethod" };
  for (const [controlId, key] of Object.entries(simpleFilterLabels)) {
    const label = document.querySelector(`label[for="${controlId}"]`);
    const alias = state.fieldSchema[key]?.alias;
    if (label && alias) label.textContent = alias;
  }
}

function updateSourceEditCapability(layer) {
  const operations = layer.capabilities?.operations || {};
  state.sourceCanEdit = Boolean(
    layer.effectiveEditingEnabled
    || layer.editingEnabled
    || operations.supportsAdd
    || operations.supportsUpdate
    || operations.supportsDelete
  );
}

function domainOptionsFor(key) {
  const options = state.domainOptions[key] || [];
  if (options.length) return options;
  const fallback = FALLBACK_DOMAIN_VALUES[key] || [];
  const unitValues = state.units
    .map((unit) => unit?.[key])
    .filter((value) => value != null && String(value).trim())
    .map((value) => String(value));
  const values = [...new Set([...fallback, ...unitValues])];
  return values.map((value) => ({ code: value, name: value }));
}

function decodeDomainValue(key, rawValue) {
  if (rawValue == null || rawValue === "") return "";
  const option = (state.domainOptions[key] || []).find((entry) => String(entry.code) === String(rawValue));
  return option ? option.name : String(rawValue);
}

function rawDomainValue(key, submittedValue) {
  const option = (state.domainOptions[key] || []).find((entry) => String(entry.code) === String(submittedValue));
  return option ? option.code : submittedValue;
}

function populateSelect(select, key, placeholder, values = null) {
  if (!select) return;
  const previous = select.value;
  select.replaceChildren();
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = placeholder;
  select.append(blank);
  const options = values || domainOptionsFor(key);
  for (const entry of options) {
    const option = document.createElement("option");
    option.value = String(entry.code);
    option.textContent = entry.name;
    select.append(option);
  }
  if ([...select.options].some((option) => option.value === previous)) select.value = previous;
}

function populateUnitFormOptions() {
  populateSelect(dom.unitPark, "parkUnit", "Select park unit");
  populateSelect(dom.unitLocality, "locality", "Select locality / county");
  populateSelect(dom.unitState, "state", "Select state");
  populateSelect(dom.unitStatus, "status", "Select status");
  populateSelect(dom.unitPriority, "priority", "Select priority");
  populateSelect(dom.unitBurnWindow, "burnWindow", "Select burn window");
  populateSelect(dom.unitFuel, "fuel", "Select primary fuel");
  populateSelect(dom.unitIgnition, "ignitionMethod", "Select ignition method");
}

function populateBurnFilterOptions() {
  populateFilterCheckboxes(dom.filterStatusOptions, "filterStatus", domainOptionsFor("status"), true);
  populateFilterCheckboxes(dom.filterPriorityOptions, "filterPriority", domainOptionsFor("priority"), false);
  populateFilterCheckboxes(dom.filterBurnWindowOptions, "filterBurnWindow", domainOptionsFor("burnWindow"), false);
  populateSelect(dom.parkFilter, "parkUnit", "All park units");
  populateSelect(dom.localityFilter, "locality", "All localities");
  populateSelect(dom.fuelFilter, "fuel", "All fuel types");
  populateSelect(dom.ignitionFilter, "ignitionMethod", "All ignition methods");
}

function populateFilterCheckboxes(container, name, options, defaultActiveOnly) {
  if (!container) return;
  container.replaceChildren();
  const inputs = [];
  for (const entry of options) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = name;
    input.value = entry.name;
    input.checked = defaultActiveOnly ? isActiveStatusValue(entry.name) : false;
    inputs.push(input);
    label.append(input, document.createTextNode(` ${entry.name}`));
    container.append(label);
  }
  if (defaultActiveOnly && inputs.length && !inputs.some((input) => input.checked)) inputs.forEach((input) => { input.checked = true; });
}

function setDomainSelectFromUnit(select, key, unitValue, rawValue) {
  if (!select) return;
  const options = domainOptionsFor(key);
  const rawCandidate = rawValue != null ? String(rawValue) : null;
  const byRaw = rawCandidate != null && options.find((entry) => String(entry.code) === rawCandidate);
  const byName = options.find((entry) => normalize(entry.name) === normalize(unitValue));
  const selected = byRaw || byName;
  if (selected) select.value = String(selected.code);
  else if (unitValue) {
    const option = document.createElement("option");
    option.value = String(unitValue);
    option.textContent = String(unitValue);
    select.append(option);
    select.value = String(unitValue);
  } else {
    select.value = "";
  }
}

function unitFromFeature(feature) {
  const f = CONFIG.prescribedBurns.fields;
  const a = feature.attributes || {};
  const idValue = a[f.globalId] || a[f.objectId] || crypto.randomUUID();
  if (!feature.geometry) return null;
  const geometry = feature.geometry.toJSON ? feature.geometry.toJSON() : feature.geometry;
  const centroid = geometryCentroid(feature.geometry);
  const sourceValues = {};
  for (const key of ["parkUnit", "locality", "state", "status", "priority", "burnWindow", "fuel", "ignitionMethod"]) {
    sourceValues[key] = a[f[key]];
  }

  return normalizeUnit({
    id: String(idValue),
    sourceObjectId: a[f.objectId] ?? null,
    sourceValues,
    name: a[f.name],
    parkUnit: decodeDomainValue("parkUnit", a[f.parkUnit]),
    locality: decodeDomainValue("locality", a[f.locality]),
    state: decodeDomainValue("state", a[f.state]) || "California",
    status: decodeDomainValue("status", a[f.status]),
    priority: decodeDomainValue("priority", a[f.priority]),
    burnWindow: decodeDomainValue("burnWindow", a[f.burnWindow]),
    fuel: decodeDomainValue("fuel", a[f.fuel]),
    ignitionMethod: decodeDomainValue("ignitionMethod", a[f.ignitionMethod]),
    acres: Number(a[f.acres]),
    startDate: a[f.startDate],
    endDate: a[f.endDate],
    lastBurned: a[f.lastBurned],
    objective: a[f.objective],
    notes: a[f.notes],
    lastUpdated: a[f.lastUpdated],
    geometry,
    latitude: centroid.latitude,
    longitude: centroid.longitude
  });
}

function buildDemoUnits() {
  const units = [
    {
      id: "demo-calaveras-north-grove",
      name: "North Grove Fuel Reduction Unit",
      parkUnit: "Calaveras Big Trees State Park",
      locality: "Calaveras County",
      status: "Active",
      priority: "High",
      burnWindow: "Dormant",
      fuel: "Litter",
      ignitionMethod: "Backing/Spot",
      objective: "Reduce surface fuels and restore frequent-fire forest conditions.",
      notes: "Coordinate with district fire management and local air district before implementation.",
      geometry: rectangleGeometry(-120.284, 38.276, 0.032, 0.022),
      lastBurned: "2021-11-04",
      forecastScores: [82, 77, 64, 48, 35, 81, 74]
    },
    {
      id: "demo-great-valley-grasslands",
      name: "Grassland Habitat Burn Unit A",
      parkUnit: "Great Valley Grasslands State Park",
      locality: "Merced County",
      status: "Active",
      priority: "High",
      burnWindow: "Growing",
      fuel: "Grass",
      ignitionMethod: "Backing/Spot",
      objective: "Reduce invasive annual biomass and support native grassland habitat objectives.",
      notes: "Evaluate nesting bird constraints, burn window, and air-district authorization.",
      geometry: rectangleGeometry(-120.833, 37.267, 0.045, 0.025),
      lastBurned: "2022-05-18",
      forecastScores: [68, 74, 83, 79, 42, 31, 57]
    },
    {
      id: "demo-caswell-riparian",
      name: "Riparian Boundary Pile Units",
      parkUnit: "Caswell Memorial State Park",
      locality: "San Joaquin County",
      status: "Active",
      priority: "Normal",
      burnWindow: "Dormant",
      fuel: "Slash",
      ignitionMethod: "Backing/Spot",
      objective: "Dispose of vegetation-management debris while protecting adjacent riparian resources.",
      notes: "Hand pile ignition only; confirm smoke dispersal and staffing.",
      geometry: rectangleGeometry(-121.181, 37.702, 0.018, 0.013),
      lastBurned: null,
      forecastScores: [34, 45, 61, 78, 86, 70, 39]
    },
    {
      id: "demo-carnegie-range",
      name: "Carnegie Range Improvement Unit",
      parkUnit: "Carnegie State Vehicular Recreation Area",
      locality: "Alameda County",
      status: "Inactive",
      priority: "Low",
      burnWindow: "Year-Round",
      fuel: "Grass",
      ignitionMethod: "Head/Aerial",
      objective: "Maintain strategic fuel breaks and improve grassland condition.",
      notes: "Inactive pending plan revision and interagency coordination.",
      geometry: rectangleGeometry(-121.633, 37.633, 0.036, 0.021),
      lastBurned: "2019-10-12",
      forecastScores: [null, null, null, null, null, null, null]
    }
  ];

  return units.map((unit, index) => {
    const normalized = normalizeUnit(unit);
    normalized.acres = calculateGeometryAcres(normalized.geometry);
    normalized.latitude = geometryCentroid(normalized.geometry).latitude;
    normalized.longitude = geometryCentroid(normalized.geometry).longitude;
    normalized.events = index === 0 ? [
      {
        id: crypto.randomUUID(),
        plannedDate: "2026-11-12",
        actualDate: "",
        canceled: false,
        treatmentType: "Broadcast burn",
        plannedAcres: normalized.acres,
        actualAcres: "",
        notes: "Preliminary planning event; update after implementation.",
        actualWeather: {}
      }
    ] : [];
    return normalized;
  });
}

function normalizeUnit(unit) {
  const defaultScores = Array.isArray(unit.forecastScores) ? unit.forecastScores.slice(0, 7) : [null, null, null, null, null, null, null];
  while (defaultScores.length < 7) defaultScores.push(null);
  return {
    id: String(unit.id || crypto.randomUUID()),
    sourceObjectId: unit.sourceObjectId ?? null,
    sourceValues: { ...(unit.sourceValues || {}) },
    name: safeText(unit.name, "Unnamed burn unit"),
    parkUnit: safeText(unit.parkUnit, "Park unit not listed"),
    locality: safeText(unit.locality, "Locality not listed"),
    state: safeText(unit.state, "California"),
    status: safeText(unit.status, "Active"),
    priority: safeText(unit.priority, "Normal"),
    burnWindow: safeText(unit.burnWindow, "Dormant"),
    fuel: safeText(unit.fuel, "Litter"),
    ignitionMethod: safeText(unit.ignitionMethod, "Backing/Spot"),
    acres: Number.isFinite(Number(unit.acres)) ? Number(unit.acres) : 0,
    startDate: unit.startDate || "",
    endDate: unit.endDate || "",
    lastBurned: unit.lastBurned || "",
    objective: unit.objective || "",
    notes: unit.notes || "",
    lastUpdated: unit.lastUpdated || new Date().toISOString(),
    geometry: unit.geometry,
    latitude: Number(unit.latitude),
    longitude: Number(unit.longitude),
    preferred: normalizePreferred(unit.preferred || defaultPreferredConditions()),
    forecastScores: defaultScores,
    notificationsEnabled: Boolean(unit.notificationsEnabled),
    subscribers: Array.isArray(unit.subscribers) ? unit.subscribers : [],
    events: Array.isArray(unit.events) ? unit.events : []
  };
}

function defaultPreferredConditions() {
  return {
    temperature: { min: 45, max: 82 },
    relativeHumidity: { min: 28, max: 60 },
    windSpeed: { min: 2, max: 12 },
    windDirection: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    windGust: { min: 0, max: 20 },
    quantitativePrecipitation: { min: 0, max: 0.1 },
    probabilityPrecipitation: { min: 0, max: 30 },
    transportWindSpeed: { min: 5, max: 20 },
    transportWindDirection: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    dispersionIndex: { min: 41, max: 100 },
    mixingHeight: { min: 1800, max: 10000 },
    lvori: { min: 1, max: 3 }
  };
}

function normalizePreferred(preferred) {
  const normalized = {};
  for (const definition of CONDITION_DEFINITIONS) {
    const value = preferred[definition.key] || {};
    normalized[definition.key] = {
      min: toNullableNumber(value.min),
      max: toNullableNumber(value.max)
    };
  }
  normalized.windDirection = Array.isArray(preferred.windDirection) ? preferred.windDirection.filter((value) => DIRECTIONS.includes(value)) : [];
  normalized.transportWindDirection = Array.isArray(preferred.transportWindDirection) ? preferred.transportWindDirection.filter((value) => DIRECTIONS.includes(value)) : [];
  return normalized;
}

function loadLocalUnits() {
  if (!CONFIG.prescribedBurns.useLocalStorageInDemo) return null;
  try {
    const raw = localStorage.getItem(CONFIG.prescribedBurns.localStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeUnit) : null;
  } catch (error) {
    console.warn("Local sample data could not be read.", error);
    return null;
  }
}

function persistLocalUnits() {
  if (!state.isDemo || !CONFIG.prescribedBurns.useLocalStorageInDemo) return;
  try {
    localStorage.setItem(CONFIG.prescribedBurns.localStorageKey, JSON.stringify(state.units));
  } catch (error) {
    console.warn("Local sample data could not be saved.", error);
  }
}

function setDataMode(label, isDemo) {
  dom.dataModeBadge.textContent = label;
  dom.dataModeBadge.classList.toggle("is-demo", isDemo);
  dom.dataModeBadge.classList.toggle("is-live", !isDemo);
}

function renderAll() {
  refreshBurnGraphics();
  applyBurnFilters();
  updateKpis();
  renderOverviewBurns();
  renderLayerToggles();
  if (state.selectedUnitId) renderSelectedUnit();
}

function refreshBurnGraphics() {
  const { Graphic, Polygon, Point } = state.modules;
  state.layers.burn.removeAll();
  state.layers.burnMarkers.removeAll();

  for (const unit of state.units) {
    if (!unit.geometry) continue;
    const polygon = new Polygon(unit.geometry);
    unit.acres = unit.acres || calculateGeometryAcres(polygon);
    const center = geometryCentroid(polygon);
    unit.latitude = center.latitude;
    unit.longitude = center.longitude;

    const polygonGraphic = new Graphic({
      geometry: polygon,
      attributes: { unitId: unit.id, layerType: "burn", name: unit.name, parkUnit: unit.parkUnit, status: unit.status, priority: unit.priority, acres: unit.acres },
      symbol: burnPolygonSymbol(unit, unit.id === state.selectedUnitId),
      popupTemplate: buildUnitPopupTemplate(unit)
    });
    const markerGraphic = new Graphic({
      geometry: new Point({ longitude: unit.longitude, latitude: unit.latitude, spatialReference: { wkid: 4326 } }),
      attributes: { unitId: unit.id, layerType: "burn-marker", name: unit.name, parkUnit: unit.parkUnit, status: unit.status, priority: unit.priority, acres: unit.acres },
      symbol: burnMarkerSymbol(unit, unit.id === state.selectedUnitId),
      popupTemplate: buildUnitPopupTemplate(unit)
    });
    state.layers.burn.add(polygonGraphic);
    state.layers.burnMarkers.add(markerGraphic);
  }
  updateScaleVisibility();
}

function buildUnitPopupTemplate(unit) {
  return {
    title: unit.name,
    content: [{
      type: "fields",
      fieldInfos: [
        { fieldName: "parkUnit", label: "Park unit" },
        { fieldName: "status", label: "Status" },
        { fieldName: "priority", label: "Priority" },
        { fieldName: "acres", label: "Acres" }
      ]
    }],
    outFields: ["*"]
  };
}

function burnPolygonSymbol(unit, selected = false) {
  const band = scoreBand(currentUnitScore(unit), unit.status);
  const colors = {
    high: [57, 157, 91, 0.55],
    medium: [221, 181, 44, 0.56],
    low: [211, 52, 62, 0.55],
    unknown: [118, 128, 139, 0.42]
  };
  return {
    type: "simple-fill",
    color: colors[band],
    outline: {
      color: selected ? [255, 244, 177, 1] : [222, 241, 249, 0.96],
      width: selected ? 3.2 : 1.6
    }
  };
}

function burnMarkerSymbol(unit, selected = false) {
  const band = scoreBand(currentUnitScore(unit), unit.status);
  const colors = {
    high: [57, 157, 91, 0.95],
    medium: [221, 181, 44, 0.95],
    low: [211, 52, 62, 0.95],
    unknown: [118, 128, 139, 0.95]
  };
  return {
    type: "simple-marker",
    style: "circle",
    size: selected ? 18 : 14,
    color: colors[band],
    outline: { color: [255,255,255,0.96], width: selected ? 3 : 1.8 }
  };
}

function editingPolygonSymbol() {
  return {
    type: "simple-fill",
    color: [69, 205, 141, 0.38],
    outline: { color: [95, 237, 226, 1], width: 2.5 }
  };
}

function isActiveStatusValue(value) {
  const text = normalize(value);
  if (!text) return true;
  if (text.includes("inactive") || text.includes("closed") || text.includes("retired") || text.includes("archived")) return false;
  return text.includes("active") || text.includes("open") || text === "yes" || text === "y" || text === "1";
}

function isUnitActive(unit) {
  return isActiveStatusValue(unit?.status);
}

function currentUnitScore(unit) {
  if (!isUnitActive(unit)) return null;
  return Array.isArray(unit.forecastScores) ? unit.forecastScores[0] : null;
}

function scoreBand(score, status = "Active") {
  if (!isActiveStatusValue(status) || !Number.isFinite(Number(score))) return "unknown";
  if (Number(score) >= 75) return "high";
  if (Number(score) >= 40) return "medium";
  return "low";
}

function updateScaleVisibility() {
  if (!state.view || !state.layers.burn) return;
  const showMarkers = state.view.scale > 450000;
  state.layers.burnMarkers.visible = showMarkers;
  state.layers.burn.visible = !showMarkers;
}

function updateKpis() {
  const active = state.units.filter(isUnitActive);
  const acres = active.reduce((sum, unit) => sum + (Number(unit.acres) || 0), 0);
  const goDays = active.reduce((sum, unit) => sum + unit.forecastScores.filter((score) => Number(score) >= 75).length, 0);
  dom.kpiTotalBurns.textContent = String(state.units.length);
  dom.kpiActiveBurns.textContent = String(active.length);
  dom.kpiPlannedAcres.textContent = formatNumber(acres, 0);
  dom.kpiGoDays.textContent = String(goDays);
}

function renderOverviewBurns() {
  dom.overviewBurnList.replaceChildren();
  const units = [...state.units]
    .filter(isUnitActive)
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || (currentUnitScore(b) ?? -1) - (currentUnitScore(a) ?? -1))
    .slice(0, 5);

  if (!units.length) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "No active burn units are available.";
    dom.overviewBurnList.append(message);
    return;
  }

  for (const unit of units) {
    const score = currentUnitScore(unit);
    const band = scoreBand(score, unit.status);
    const card = document.createElement("article");
    card.className = `compact-card priority-card priority-card--${band}`;

    const heading = document.createElement("h4");
    heading.textContent = unit.name;

    const details = document.createElement("p");
    details.textContent = `${unit.parkUnit} · ${unit.priority} management priority`;

    const footer = document.createElement("div");
    footer.className = "priority-card-footer";

    const scoreLabel = document.createElement("span");
    scoreLabel.className = "priority-score-label";
    scoreLabel.textContent = Number.isFinite(Number(score))
      ? `${capitalize(band)} burn score · ${Math.round(score)}% conditions met`
      : "Forecast score not available";

    const action = document.createElement("button");
    action.className = "text-button priority-card-action";
    action.type = "button";
    action.textContent = "Manage unit";
    action.addEventListener("click", () => selectUnit(unit.id, { zoom: true, openPanel: true }));

    footer.append(action, scoreLabel);
    card.append(heading, details, footer);
    dom.overviewBurnList.append(card);
  }
}

function applyBurnFilters(event) {
  event?.preventDefault?.();
  const search = normalize(dom.burnSearch.value);
  const statusSelections = new Set([...document.querySelectorAll('input[name="filterStatus"]:checked')].map((input) => input.value));
  const prioritySelections = new Set([...document.querySelectorAll('input[name="filterPriority"]:checked')].map((input) => input.value));
  const windowSelections = new Set([...document.querySelectorAll('input[name="filterBurnWindow"]:checked')].map((input) => input.value));
  const parkUnit = normalize(dom.parkFilter.value ? decodeDomainValue("parkUnit", dom.parkFilter.value) : "");
  const fuel = normalize(dom.fuelFilter.value ? decodeDomainValue("fuel", dom.fuelFilter.value) : "");
  const ignition = normalize(dom.ignitionFilter.value ? decodeDomainValue("ignitionMethod", dom.ignitionFilter.value) : "");
  const locality = normalize(dom.localityFilter.value ? decodeDomainValue("locality", dom.localityFilter.value) : "");
  const goDays = dom.filterGoDays.checked;
  const yearFrom = toNullableNumber(dom.lastBurnedFrom.value);
  const yearTo = toNullableNumber(dom.lastBurnedTo.value);

  state.filteredUnits = state.units.filter((unit) => {
    if (statusSelections.size && !statusSelections.has(unit.status)) return false;
    if (search && ![unit.name, unit.parkUnit, unit.locality].some((value) => normalize(value).includes(search))) return false;
    if (parkUnit && normalize(unit.parkUnit) !== parkUnit) return false;
    if (prioritySelections.size && !prioritySelections.has(unit.priority)) return false;
    if (windowSelections.size && !windowSelections.has(unit.burnWindow)) return false;
    if (fuel && normalize(unit.fuel) !== fuel) return false;
    if (ignition && normalize(unit.ignitionMethod) !== ignition) return false;
    if (goDays && !unit.forecastScores.some((score) => Number(score) >= 75)) return false;
    if (locality && normalize(unit.locality) !== locality) return false;
    const year = unit.lastBurned ? new Date(unit.lastBurned).getFullYear() : null;
    if (yearFrom != null && (!year || year < yearFrom)) return false;
    if (yearTo != null && (!year || year > yearTo)) return false;
    return true;
  });

  state.filteredUnits.sort((a, b) => {
    const result = a.name.localeCompare(b.name);
    return state.sortDirection === "asc" ? result : -result;
  });

  state.page = Math.min(state.page, Math.max(1, Math.ceil(state.filteredUnits.length / state.rowsPerPage)));
  renderBurnList();
  updateVisibleBurnGraphics();
}

function renderBurnList() {
  dom.burnTableBody.replaceChildren();
  dom.burnCardList.replaceChildren();
  const count = state.filteredUnits.length;
  dom.burnResultCount.textContent = `${count} ${count === 1 ? "record" : "records"}`;

  const totalPages = Math.max(1, Math.ceil(count / state.rowsPerPage));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * state.rowsPerPage;
  const pageUnits = state.filteredUnits.slice(start, start + state.rowsPerPage);

  if (!pageUnits.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.className = "empty-message";
    cell.textContent = "No burn units match the selected filters.";
    row.append(cell);
    dom.burnTableBody.append(row);

    const item = document.createElement("li");
    item.className = "empty-message";
    item.textContent = "No burn units match the selected filters.";
    dom.burnCardList.append(item);
  } else {
    for (const unit of pageUnits) {
      dom.burnTableBody.append(buildBurnTableRow(unit));
      dom.burnCardList.append(buildBurnMobileCard(unit));
    }
  }

  dom.pageStatus.textContent = `Page ${state.page} of ${totalPages}`;
  dom.prevPage.disabled = state.page <= 1;
  dom.nextPage.disabled = state.page >= totalPages;
}

function buildBurnTableRow(unit) {
  const row = document.createElement("tr");
  const values = [unit.name, unit.status, null, unit.locality, unit.priority, formatNumber(unit.acres, 2), unit.lastBurned ? formatDate(unit.lastBurned) : "n/a", null];

  values.forEach((value, index) => {
    const cell = document.createElement("td");
    if (index === 2) cell.append(buildForecastChips(unit));
    else if (index === 7) cell.append(buildUnitActionLinks(unit));
    else cell.textContent = value;
    row.append(cell);
  });
  return row;
}

function buildBurnMobileCard(unit) {
  const item = document.createElement("li");
  item.className = "burn-card-mobile";
  const title = document.createElement("h3");
  title.textContent = unit.name;
  const details = document.createElement("dl");
  const entries = [
    ["Status", unit.status], ["Priority", unit.priority], ["Locality", unit.locality],
    ["Acres", formatNumber(unit.acres, 2)], ["Last burned", unit.lastBurned ? formatDate(unit.lastBurned) : "n/a"]
  ];
  for (const [term, description] of entries) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = description;
    details.append(dt, dd);
  }
  const forecastLabel = document.createElement("p");
  forecastLabel.className = "panel-help";
  forecastLabel.textContent = "Seven-day burn forecast";
  item.append(title, details, forecastLabel, buildForecastChips(unit), buildUnitActionLinks(unit));
  return item;
}

function buildForecastChips(unit) {
  const wrapper = document.createElement("div");
  wrapper.className = "forecast-chips";
  const start = new Date();
  for (let index = 0; index < 7; index += 1) {
    const score = isUnitActive(unit) ? unit.forecastScores[index] : null;
    const band = scoreBand(score, unit.status);
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const chip = document.createElement("span");
    chip.className = `forecast-chip forecast-chip--${band}`;
    const description = Number.isFinite(Number(score)) ? `${Math.round(score)}% of preferred conditions met` : "not scored";
    chip.title = `${formatDate(date)}: ${description}`;
    chip.setAttribute("role", "img");
    chip.setAttribute("aria-label", chip.title);
    wrapper.append(chip);
  }
  return wrapper;
}

function buildUnitActionLinks(unit) {
  const wrapper = document.createElement("div");
  wrapper.className = "action-links";
  const view = document.createElement("button");
  view.type = "button";
  view.textContent = "View on map";
  view.addEventListener("click", () => selectUnit(unit.id, { zoom: true, openPanel: false }));
  const manage = document.createElement("button");
  manage.type = "button";
  manage.textContent = "Manage unit";
  manage.addEventListener("click", () => selectUnit(unit.id, { zoom: false, openPanel: true }));
  wrapper.append(view, manage);
  return wrapper;
}

function updateVisibleBurnGraphics() {
  const visibleIds = new Set(state.filteredUnits.map((unit) => unit.id));
  const filtersActive = state.currentPanel === "list";
  for (const graphic of state.layers.burn.graphics) graphic.visible = !filtersActive || visibleIds.has(graphic.attributes.unitId);
  for (const graphic of state.layers.burnMarkers.graphics) graphic.visible = !filtersActive || visibleIds.has(graphic.attributes.unitId);
}

async function selectUnit(id, options = {}) {
  const unit = getUnit(id);
  if (!unit) return;

  // A burn unit becomes the active map selection. Remove any standalone
  // point-forecast marker and stale popup context.
  state.layers.marker?.removeAll();
  state.lastPointForecast = null;
  resetPointForecastPanel();
  closeMapPopup();

  state.selectedUnitId = unit.id;
  renderSelectedUnit();
  refreshBurnGraphics();
  if (options.zoom) {
    const graphic = findUnitGraphic(unit.id);
    if (graphic) {
      await state.view.goTo({ target: graphic.geometry, padding: 90 }, { animate: !state.reducedMotion }).catch(() => {});
    }
  }
  if (options.openPanel) activatePanel("unit");
  announce(`${unit.name} selected.`);
}

function renderSelectedUnit() {
  const unit = selectedUnit();
  if (!unit) {
    dom.identifyEmpty.hidden = false;
    dom.identifyContent.hidden = true;
    updateMapSelectionControls();
    return;
  }

  dom.identifyEmpty.hidden = true;
  dom.identifyContent.hidden = false;
  dom.identifyName.textContent = unit.name;
  const score = currentUnitScore(unit);
  const band = scoreBand(score, unit.status);
  dom.identifyScore.className = `score-badge score-${band}`;
  dom.identifyScore.textContent = Number.isFinite(Number(score)) ? `${Math.round(score)}% met` : "Not scored";
  renderDefinitionList(dom.identifyDetails, [
    ["Status", unit.status], ["Locality", unit.locality], ["Burn window", unit.burnWindow],
    ["Acres", formatNumber(unit.acres, 2)], ["Last burned", unit.lastBurned ? formatDate(unit.lastBurned) : "n/a"],
    ["Fuel", unit.fuel], ["Ignition", unit.ignitionMethod], ["Center", `${formatNumber(unit.latitude, 4)}, ${formatNumber(unit.longitude, 4)}`]
  ]);
  renderDefinitionList(dom.identifyConditions, preferredSummaryEntries(unit.preferred));

  dom.unitTitle.textContent = unit.name;
  renderDefinitionList(dom.unitDetailsGrid, [
    ["Burn unit name", unit.name], ["Park unit", unit.parkUnit], ["Locality", unit.locality], ["State", unit.state],
    ["Status", unit.status], ["Priority", unit.priority], ["Burn window", unit.burnWindow], ["Primary fuel", unit.fuel],
    ["Ignition method", unit.ignitionMethod], ["Drawn acres", formatNumber(unit.acres, 2)],
    ["Latitude", formatNumber(unit.latitude, 5)], ["Longitude", formatNumber(unit.longitude, 5)],
    ["Last burned", unit.lastBurned ? formatDate(unit.lastBurned) : "n/a"],
    ["Objective", unit.objective || "Not entered"], ["Notes", unit.notes || "Not entered"]
  ]);
  dom.toggleUnitStatusButton.textContent = isUnitActive(unit) ? "Inactivate burn unit" : "Reactivate burn unit";
  dom.toggleUnitStatusButton.classList.toggle("danger-button", isUnitActive(unit));
  dom.toggleUnitStatusButton.classList.toggle("primary-button", !isUnitActive(unit));
  dom.notificationToggle.checked = unit.notificationsEnabled;
  renderSubscribers(unit);
  renderPreferredConditions(unit);
  renderEvents(unit);
  renderForecastMatrix(unit);
  updateSmokeScreening();
  updateUnitExternalLinks(unit);
  updateMapSelectionControls();
}

function renderDefinitionList(container, entries) {
  container.replaceChildren();
  for (const [term, value] of entries) {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = safeText(value, "—");
    wrapper.append(dt, dd);
    container.append(wrapper);
  }
}

function renderPreferredConditions(unit) {
  renderDefinitionList(dom.preferredConditionsSummary, preferredSummaryEntries(unit.preferred));
}

function preferredSummaryEntries(preferred) {
  const entries = CONDITION_DEFINITIONS.map((definition) => [definition.label, formatRange(preferred[definition.key])]);
  entries.splice(3, 0, ["Wind direction", preferred.windDirection.length ? preferred.windDirection.join(", ") : "Any / not set"]);
  entries.splice(9, 0, ["Transport wind direction", preferred.transportWindDirection.length ? preferred.transportWindDirection.join(", ") : "Any / not set"]);
  return entries;
}

function renderSubscribers(unit) {
  dom.subscriberList.replaceChildren();
  if (!unit.subscribers.length) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "No additional subscribers.";
    dom.subscriberList.append(message);
    return;
  }
  for (const subscriber of unit.subscribers) {
    const item = document.createElement("div");
    item.className = "subscriber-item";
    const text = document.createElement("span");
    text.textContent = `${subscriber.name} · ${subscriber.email}`;
    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${subscriber.name} from subscribers`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      unit.subscribers = unit.subscribers.filter((itemValue) => itemValue.id !== subscriber.id);
      saveUnitState(unit);
      renderSubscribers(unit);
      announce(`${subscriber.name} removed from subscribers.`);
    });
    item.append(text, remove);
    dom.subscriberList.append(item);
  }
}

function initializeNavigation() {
  const tabs = [...document.querySelectorAll('[role="tab"][data-panel]')];
  for (const tab of tabs) {
    tab.addEventListener("click", () => activatePanel(tab.dataset.panel));
    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      let next = null;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      tabs[next].focus();
      activatePanel(tabs[next].dataset.panel);
    });
  }

  document.querySelectorAll("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => activatePanel(button.dataset.openPanel));
  });
  document.querySelectorAll("[data-map-tool]").forEach((button) => {
    button.addEventListener("click", () => {
      activatePanel("map");
      openMapTools();
      activateMapTool(button.dataset.mapTool);
    });
  });
}

function initializeCollapsibleSections() {
  document.querySelectorAll(".section-collapse-button[aria-controls]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.getAttribute("aria-controls"));
      if (!target) return;
      const expanded = button.getAttribute("aria-expanded") === "true";
      const nextExpanded = !expanded;
      button.setAttribute("aria-expanded", String(nextExpanded));
      target.hidden = !nextExpanded;
      button.closest(".collapsible-section")?.classList.toggle("is-collapsed", !nextExpanded);

      const label = button.dataset.collapseLabel || "Section";
      const icon = button.querySelector('[aria-hidden="true"]');
      const accessibleText = button.querySelector(".sr-only");
      if (icon) icon.textContent = nextExpanded ? "−" : "+";
      if (accessibleText) accessibleText.textContent = `${nextExpanded ? "Collapse" : "Expand"} ${label}`;
      announce(`${label} ${nextExpanded ? "expanded" : "collapsed"}.`);
    });
  });
}

function activatePanel(panelName) {
  state.currentPanel = panelName;
  const visiblePanelName = panelName;
  document.querySelectorAll(".panel-view[data-view]").forEach((panel) => {
    panel.hidden = panel.dataset.view !== visiblePanelName;
  });

  const selectedTabPanel = panelName === "unit" ? "list" : panelName;
  document.querySelectorAll('[role="tab"][data-panel]').forEach((tab) => {
    const selected = tab.dataset.panel === selectedTabPanel;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  dom.app.dataset.panel = panelName;
  updateVisibleBurnGraphics();
  announce(`${panelHeading(panelName)} opened.`);
}

function panelHeading(panelName) {
  const labels = { overview: "Dashboard", map: "Burn map", list: "Burn list", planner: "Weather and smoke", unit: "Burn unit overview" };
  return labels[panelName] || capitalize(panelName);
}

function initializeMapToolTabs() {
  const tabs = [...document.querySelectorAll(".drawer-tab[data-tool]")];
  for (const tab of tabs) {
    tab.addEventListener("click", () => activateMapTool(tab.dataset.tool));
    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      let next = null;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      tabs[next].focus();
      activateMapTool(tabs[next].dataset.tool);
    });
  }
}

function activateMapTool(toolName) {
  state.currentTool = toolName;
  document.querySelectorAll(".drawer-tab[data-tool]").forEach((tab) => {
    const active = tab.dataset.tool === toolName;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll("[data-tool-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.toolPanel !== toolName;
  });
  openMapTools();
}

function openMapTools() {
  dom.mapToolsDrawer.hidden = false;
  dom.mapToolsToggle.setAttribute("aria-expanded", "true");
  dom.mapToolsToggle.classList.add("is-pressed");
}

function closeMapTools() {
  dom.mapToolsDrawer.hidden = true;
  dom.mapToolsToggle.setAttribute("aria-expanded", "false");
  dom.mapToolsToggle.classList.remove("is-pressed");
}

function initializeUnitSubnavigation() {
  document.querySelectorAll(".unit-subnav-button").forEach((button) => {
    button.addEventListener("click", () => activateUnitSection(button.dataset.unitSection));
  });
}

function activateUnitSection(section) {
  document.querySelectorAll(".unit-subnav-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.unitSection === section);
  });
  document.querySelectorAll("[data-unit-section-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.unitSectionPanel !== section;
  });
  if (section === "weather") updateSmokeScreening();
  announce(`${capitalize(section)} section opened.`);
}

function initializeDialogs() {
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
  });
  [dom.unitDialog, dom.conditionsDialog, dom.eventDialog, dom.confirmDialog, dom.helpDialog, dom.accountDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (outside) dialog.close();
    });
  });
  dom.confirmCancel.addEventListener("click", () => closeDialog("confirmDialog"));
  dom.confirmAction.addEventListener("click", async () => {
    const callback = state.confirmCallback;
    closeDialog("confirmDialog");
    state.confirmCallback = null;
    if (callback) await callback();
  });
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog?.open) dialog.close();
}

function showConfirmation(title, message, actionLabel, callback) {
  dom.confirmTitle.textContent = title;
  dom.confirmMessage.textContent = message;
  dom.confirmAction.textContent = actionLabel;
  state.confirmCallback = callback;
  dom.confirmDialog.showModal();
  dom.confirmCancel.focus();
}

function initializeFormsAndControls() {
  dom.refreshButton.addEventListener("click", refreshAllData);
  dom.helpButton.addEventListener("click", () => dom.helpDialog.showModal());
  dom.accountButton.addEventListener("click", () => dom.accountDialog.showModal());
  dom.arcgisSignInButton.addEventListener("click", signInUser);
  dom.logoutButton.addEventListener("click", signOutUser);
  dom.mapToolsToggle.addEventListener("click", () => dom.mapToolsDrawer.hidden ? openMapTools() : closeMapTools());
  dom.closeMapTools.addEventListener("click", closeMapTools);
  dom.openMapToolsFromPanel.addEventListener("click", openMapTools);


  dom.drawSquareButton.addEventListener("click", beginSimpleSquare);
  dom.drawPolygonButton.addEventListener("click", beginComplexPolygon);
  dom.clearDrawingButton.addEventListener("click", clearDrawing);
  dom.saveDrawingButton.addEventListener("click", savePendingDrawing);

  dom.manageSelectedUnit.addEventListener("click", () => {
    if (!selectedUnit()) return;
    activatePanel("unit");
    activateUnitSection("details");
  });
  dom.updateSelectedForecast.addEventListener("click", refreshSelectedUnitForecast);
  dom.clearMapSelectionButton.addEventListener("click", () => clearMapSelection());

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.querySelector("dialog[open]")) return;
    if (!hasMapSelection()) return;
    clearMapSelection();
  });

  dom.burnFilters.addEventListener("submit", (event) => {
    state.page = 1;
    applyBurnFilters(event);
  });
  dom.burnFilters.addEventListener("reset", () => {
    window.setTimeout(() => {
      for (const input of document.querySelectorAll('input[name="filterStatus"]')) input.checked = isActiveStatusValue(input.value);
      for (const input of document.querySelectorAll('input[name="filterPriority"], input[name="filterBurnWindow"]')) input.checked = false;
      state.page = 1;
      applyBurnFilters();
    }, 0);
  });
  document.querySelector("[data-sort='name']").addEventListener("click", () => {
    state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
    applyBurnFilters();
  });
  dom.rowsPerPage.addEventListener("change", () => {
    state.rowsPerPage = Number(dom.rowsPerPage.value) || 25;
    state.page = 1;
    renderBurnList();
  });
  dom.prevPage.addEventListener("click", () => { if (state.page > 1) { state.page -= 1; renderBurnList(); } });
  dom.nextPage.addEventListener("click", () => {
    const total = Math.max(1, Math.ceil(state.filteredUnits.length / state.rowsPerPage));
    if (state.page < total) { state.page += 1; renderBurnList(); }
  });

  dom.backToListButton.addEventListener("click", () => activatePanel("list"));
  dom.editUnitDetailsButton.addEventListener("click", () => openUnitDialog(selectedUnit()));
  dom.editBurnAreaButton.addEventListener("click", beginEditBurnArea);
  dom.toggleUnitStatusButton.addEventListener("click", toggleSelectedUnitStatus);
  dom.notificationToggle.addEventListener("change", () => {
    const unit = selectedUnit();
    if (!unit) return;
    unit.notificationsEnabled = dom.notificationToggle.checked;
    saveUnitState(unit);
    announce(`Email notifications ${unit.notificationsEnabled ? "enabled" : "disabled"} for ${unit.name}.`);
  });
  dom.subscriberForm.addEventListener("submit", addSubscriber);

  [dom.editConditionsButton, dom.editConditionsButton2].forEach((button) => button.addEventListener("click", openConditionsDialog));
  dom.smokeToggle.addEventListener("change", updateSmokeScreening);
  dom.transportDirection.addEventListener("change", updateSmokeScreening);
  dom.directionalDegrees.addEventListener("change", updateSmokeScreening);
  dom.plumeDistance.addEventListener("change", updateSmokeScreening);
  dom.resetSmokeButton.addEventListener("click", () => {
    dom.transportDirection.value = "S";
    dom.directionalDegrees.value = "30";
    dom.plumeDistance.value = "10";
    dom.smokeToggle.checked = true;
    updateSmokeScreening();
  });
  dom.refreshUnitForecastButton.addEventListener("click", refreshSelectedUnitForecast);
  dom.addBurnEventButton.addEventListener("click", () => openEventDialog());

  dom.focusMapButton.addEventListener("click", () => {
    activatePanel("map");
    window.requestAnimationFrame(() => {
      state.mapElement.scrollIntoView?.({ block: "nearest", behavior: state.reducedMotion ? "auto" : "smooth" });
      state.mapElement.focus();
    });
  });
  dom.unitForm.addEventListener("submit", handleUnitFormSubmit);
  dom.conditionsForm.addEventListener("submit", handleConditionsFormSubmit);
  dom.eventForm.addEventListener("submit", handleEventFormSubmit);
}

function beginSimpleSquare() {
  clearDrawing(false);
  activateMapTool("draw");
  state.drawingMode = "square";
  dom.drawInstructions.textContent = "Click the center of the proposed unit. A square of approximately 10 acres will be created and can then be reshaped.";
  announce("Simple square drawing started. Click the center of the proposed burn unit.");
}

function createSimpleSquare(mapPoint) {
  const coordinates = geographicCoordinates(mapPoint);
  if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) {
    announce("The selected map location could not be converted to geographic coordinates.");
    return;
  }
  const { Graphic, Polygon } = state.modules;
  const geometryJson = squareGeometryFromCenter(coordinates.longitude, coordinates.latitude, 10);
  const graphic = new Graphic({ geometry: new Polygon(geometryJson), symbol: editingPolygonSymbol() });
  state.layers.sketch.removeAll();
  state.layers.sketch.add(graphic);
  state.pendingGraphic = graphic;
  state.drawingMode = null;
  dom.saveDrawingButton.disabled = false;
  updateDrawnAcres(graphic.geometry);
  dom.drawInstructions.textContent = "Drag the square or its vertices to refine the burn area, then select Save drawing.";
  Promise.resolve(state.sketchVM.update(graphic)).catch(() => {});
  announce("Simple square created. Adjust it as needed, then save the drawing.");
}

function beginComplexPolygon() {
  clearDrawing(false);
  activateMapTool("draw");
  state.drawingMode = "polygon";
  dom.drawInstructions.textContent = "Click to add each boundary vertex. Double-click to complete the polygon.";
  state.sketchVM.create("polygon");
  announce("Complex polygon drawing started. Click to add vertices and double-click to finish.");
}

function clearDrawing(announceChange = true) {
  state.sketchVM?.cancel();
  state.layers.sketch?.removeAll();
  state.pendingGraphic = null;
  state.drawingMode = null;
  dom.drawnAcres.textContent = "0.00";
  dom.saveDrawingButton.disabled = true;
  dom.saveDrawingButton.textContent = "Save drawing";
  if (state.editingUnitId) {
    const original = findUnitGraphic(state.editingUnitId);
    if (original) original.visible = true;
  }
  state.editingUnitId = null;
  if (announceChange) announce("Drawing cleared.");
}

function updateDrawnAcres(geometry) {
  dom.drawnAcres.textContent = formatNumber(calculateGeometryAcres(geometry), 2);
}

function savePendingDrawing() {
  if (!state.pendingGraphic?.geometry) return;
  const acres = calculateGeometryAcres(state.pendingGraphic.geometry);
  if (acres < 1 || acres > 100000) {
    announce("The burn unit must be between 1 and 100,000 acres.");
    dom.drawInstructions.textContent = `The current shape is ${formatNumber(acres, 2)} acres. Adjust it to between 1 and 100,000 acres.`;
    return;
  }

  if (state.editingUnitId) {
    const unit = getUnit(state.editingUnitId);
    if (!unit) return;
    showConfirmation(
      "Update burn unit shape",
      `Save the edited shape for ${unit.name}? The acreage and center coordinates will be recalculated.`,
      "Save edit",
      async () => {
        unit.geometry = state.pendingGraphic.geometry.toJSON();
        unit.acres = acres;
        const center = geometryCentroid(state.pendingGraphic.geometry);
        unit.latitude = center.latitude;
        unit.longitude = center.longitude;
        unit.lastUpdated = new Date().toISOString();
        await saveUnitState(unit, "update");
        clearDrawing(false);
        renderAll();
        await selectUnit(unit.id, { zoom: true, openPanel: true });
        announce("Burn unit shape updated.");
      }
    );
    return;
  }

  openUnitDialog(null, state.pendingGraphic);
}

function beginEditBurnArea() {
  const unit = selectedUnit();
  if (!unit) return;
  const graphic = findUnitGraphic(unit.id);
  if (!graphic) return;
  clearDrawing(false);
  const clone = graphic.clone();
  clone.symbol = editingPolygonSymbol();
  state.layers.sketch.add(clone);
  state.pendingGraphic = clone;
  state.editingUnitId = unit.id;
  graphic.visible = false;
  dom.saveDrawingButton.disabled = false;
  dom.saveDrawingButton.textContent = "Save edit";
  updateDrawnAcres(clone.geometry);
  activatePanel("map");
  activateMapTool("draw");
  dom.drawInstructions.textContent = "Move the polygon or drag vertices to edit the boundary. Select Save edit when complete.";
  Promise.resolve(state.sketchVM.update(clone)).catch(() => {});
  announce(`Editing the shape for ${unit.name}.`);
}

function openUnitDialog(unit = null, pendingGraphic = null) {
  dom.unitForm.reset();
  populateUnitFormOptions();
  dom.unitDialogTitle.textContent = unit ? "Edit burn unit details" : "Save burn unit details";
  dom.unitId.value = unit?.id || "";
  dom.unitName.value = unit?.name || "";
  const geometry = pendingGraphic?.geometry || (unit?.geometry ? new state.modules.Polygon(unit.geometry) : null);
  dom.unitAcres.value = formatNumber(unit?.acres || calculateGeometryAcres(geometry), 2).replace(/,/g, "");
  dom.unitObjective.value = unit?.objective || "";
  dom.unitNotes.value = unit?.notes || "";

  setDomainSelectFromUnit(dom.unitPark, "parkUnit", unit?.parkUnit || "", unit?.sourceValues?.parkUnit);
  setDomainSelectFromUnit(dom.unitLocality, "locality", unit?.locality || "", unit?.sourceValues?.locality);
  setDomainSelectFromUnit(dom.unitState, "state", unit?.state || "California", unit?.sourceValues?.state);
  setDomainSelectFromUnit(dom.unitStatus, "status", unit?.status || statusValueForActiveState(true), unit?.sourceValues?.status);
  setDomainSelectFromUnit(dom.unitPriority, "priority", unit?.priority || preferredDomainName("priority", "Normal"), unit?.sourceValues?.priority);
  setDomainSelectFromUnit(dom.unitBurnWindow, "burnWindow", unit?.burnWindow || preferredDomainName("burnWindow", "Dormant"), unit?.sourceValues?.burnWindow);
  setDomainSelectFromUnit(dom.unitFuel, "fuel", unit?.fuel || preferredDomainName("fuel", "Litter"), unit?.sourceValues?.fuel);
  setDomainSelectFromUnit(dom.unitIgnition, "ignitionMethod", unit?.ignitionMethod || preferredDomainName("ignitionMethod", "Backing/Spot"), unit?.sourceValues?.ignitionMethod);

  dom.unitDialog.showModal();
  dom.unitName.focus();
}

function preferredDomainName(key, preferredText) {
  const options = domainOptionsFor(key);
  const exact = options.find((entry) => normalize(entry.name) === normalize(preferredText));
  const partial = options.find((entry) => normalize(entry.name).includes(normalize(preferredText)) || normalize(preferredText).includes(normalize(entry.name)));
  return (exact || partial || options[0])?.name || preferredText;
}

function statusValueForActiveState(active) {
  const options = domainOptionsFor("status");
  const match = options.find((entry) => isActiveStatusValue(entry.name) === active);
  return match?.name || (active ? "Active" : "Inactive");
}

async function handleUnitFormSubmit(event) {
  event.preventDefault();
  if (!dom.unitForm.reportValidity()) return;

  const existing = dom.unitId.value ? getUnit(dom.unitId.value) : null;
  const geometry = existing?.geometry || state.pendingGraphic?.geometry?.toJSON();
  if (!geometry) {
    announce("A burn unit boundary is required.");
    return;
  }

  const selectionValues = {
    parkUnit: dom.unitPark.value,
    locality: dom.unitLocality.value,
    state: dom.unitState.value,
    status: dom.unitStatus.value,
    priority: dom.unitPriority.value,
    burnWindow: dom.unitBurnWindow.value,
    fuel: dom.unitFuel.value,
    ignitionMethod: dom.unitIgnition.value
  };
  const sourceValues = { ...(existing?.sourceValues || {}) };
  for (const [key, value] of Object.entries(selectionValues)) sourceValues[key] = rawDomainValue(key, value);

  const center = geometryCentroid(geometry);
  const unit = normalizeUnit({
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    sourceValues,
    name: dom.unitName.value,
    parkUnit: decodeDomainValue("parkUnit", sourceValues.parkUnit),
    locality: decodeDomainValue("locality", sourceValues.locality),
    state: decodeDomainValue("state", sourceValues.state) || "California",
    status: decodeDomainValue("status", sourceValues.status),
    priority: decodeDomainValue("priority", sourceValues.priority),
    burnWindow: decodeDomainValue("burnWindow", sourceValues.burnWindow),
    fuel: decodeDomainValue("fuel", sourceValues.fuel),
    ignitionMethod: decodeDomainValue("ignitionMethod", sourceValues.ignitionMethod),
    acres: Number(dom.unitAcres.value),
    objective: dom.unitObjective.value,
    notes: dom.unitNotes.value,
    geometry,
    latitude: center.latitude,
    longitude: center.longitude,
    lastUpdated: new Date().toISOString(),
    preferred: existing?.preferred || defaultPreferredConditions(),
    forecastScores: existing?.forecastScores || [null, null, null, null, null, null, null],
    notificationsEnabled: existing?.notificationsEnabled || false,
    subscribers: existing?.subscribers || [],
    events: existing?.events || []
  });

  dom.saveUnitButton.disabled = true;
  dom.saveUnitButton.setAttribute("aria-busy", "true");
  try {
    await saveUnitState(unit, existing ? "update" : "add");
    if (existing) Object.assign(existing, unit);
    else state.units.push(unit);

    dom.unitDialog.close();
    clearDrawing(false);
    populateBurnFilterOptions();
    renderAll();
    await selectUnit(unit.id, { zoom: true, openPanel: true });
    activateUnitSection("details");
    announce(`${unit.name} saved.`);
  } catch (error) {
    console.error("Burn unit could not be saved.", error);
    announce(`Burn unit was not saved. ${safeText(error.message, "Verify ArcGIS editing permissions.")}`);
    window.alert(`Burn unit was not saved. ${safeText(error.message, "Verify the RxBurns_Poly editing configuration and your ArcGIS permissions.")}`);
  } finally {
    dom.saveUnitButton.disabled = false;
    dom.saveUnitButton.removeAttribute("aria-busy");
  }
}

async function saveUnitState(unit, operation = "update") {
  unit.lastUpdated = new Date().toISOString();
  if (state.isDemo) {
    persistLocalUnits();
    return;
  }

  if (!state.sourceLayer || !CONFIG.prescribedBurns.allowFeatureServiceEdits) return;
  if (CONFIG.prescribedBurns.requireOAuthForEdits !== false && state.authMode !== "oauth") {
    throw new Error("Permanent RxBurns_Poly edits require ArcGIS OAuth sign-in. Configure authentication.oauthAppId and sign in with an authorized State Parks account.");
  }
  if (CONFIG.prescribedBurns.requireOAuthForEdits !== false && !state.credential) {
    throw new Error("Sign in with an authorized California State Parks ArcGIS Online account before editing RxBurns_Poly.");
  }
  if (!state.sourceCanEdit) {
    throw new Error("The signed-in user or hosted feature layer does not permit editing.");
  }
  const operations = state.sourceLayer.capabilities?.operations || {};
  if (operation === "add" && operations.supportsAdd === false) {
    throw new Error("RxBurns_Poly does not permit adding new features for this user.");
  }
  if (operation === "update" && operations.supportsUpdate === false) {
    throw new Error("RxBurns_Poly does not permit updating features for this user.");
  }

  const { Graphic, Polygon } = state.modules;
  const attributes = unitToSourceAttributes(unit);
  if (operation === "update" && unit.sourceObjectId != null) {
    attributes[CONFIG.prescribedBurns.fields.objectId] = unit.sourceObjectId;
  }
  const graphic = new Graphic({ geometry: new Polygon(unit.geometry), attributes });
  const edits = operation === "add" ? { addFeatures: [graphic] } : { updateFeatures: [graphic] };
  const result = await state.sourceLayer.applyEdits(edits);
  const editResult = operation === "add" ? result.addFeatureResults?.[0] : result.updateFeatureResults?.[0];
  if (editResult?.error) throw new Error(editResult.error.message || "ArcGIS rejected the feature edit.");
  if (operation === "add" && editResult?.objectId != null) unit.sourceObjectId = editResult.objectId;
}

function unitToSourceAttributes(unit) {
  const f = CONFIG.prescribedBurns.fields;
  const values = {
    name: unit.name,
    parkUnit: unit.sourceValues?.parkUnit ?? rawDomainValue("parkUnit", unit.parkUnit),
    locality: unit.sourceValues?.locality ?? rawDomainValue("locality", unit.locality),
    state: unit.sourceValues?.state ?? rawDomainValue("state", unit.state),
    status: unit.sourceValues?.status ?? rawDomainValue("status", unit.status),
    priority: unit.sourceValues?.priority ?? rawDomainValue("priority", unit.priority),
    burnWindow: unit.sourceValues?.burnWindow ?? rawDomainValue("burnWindow", unit.burnWindow),
    fuel: unit.sourceValues?.fuel ?? rawDomainValue("fuel", unit.fuel),
    ignitionMethod: unit.sourceValues?.ignitionMethod ?? rawDomainValue("ignitionMethod", unit.ignitionMethod),
    acres: unit.acres,
    startDate: unit.startDate || null,
    endDate: unit.endDate || null,
    lastBurned: unit.lastBurned || null,
    objective: unit.objective,
    notes: unit.notes,
    lastUpdated: new Date().getTime()
  };
  const attributes = {};
  for (const [key, value] of Object.entries(values)) {
    const fieldName = f[key];
    const field = state.fieldSchema[key];
    if (!fieldName || !field) continue;
    if (field.editable === false) continue;
    attributes[fieldName] = coerceValueForArcGISField(field, value);
  }
  return attributes;
}

function coerceValueForArcGISField(field, value) {
  if (value == null || value === "") return null;
  if (field.type === "date") {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (["double", "single", "integer", "small-integer", "long", "big-integer"].includes(field.type)) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return value;
}

function toggleSelectedUnitStatus() {
  const unit = selectedUnit();
  if (!unit) return;
  const activating = !isUnitActive(unit);
  showConfirmation(
    activating ? "Reactivate burn unit" : "Inactivate burn unit",
    activating
      ? `Reactivate ${unit.name} and include it in active-unit forecasts and filters?`
      : `Inactivate ${unit.name}? Burn events and planning records will remain available.`,
    activating ? "Reactivate" : "Inactivate",
    async () => {
      const nextStatus = statusValueForActiveState(activating);
      unit.status = nextStatus;
      const option = domainOptionsFor("status").find((entry) => normalize(entry.name) === normalize(nextStatus));
      unit.sourceValues = { ...(unit.sourceValues || {}), status: option?.code ?? nextStatus };
      await saveUnitState(unit);
      renderAll();
      renderSelectedUnit();
      announce(`${unit.name} ${activating ? "reactivated" : "inactivated"}.`);
    }
  );
}

function addSubscriber(event) {
  event.preventDefault();
  const unit = selectedUnit();
  if (!unit || !dom.subscriberForm.reportValidity()) return;
  const subscriber = {
    id: crypto.randomUUID(),
    name: dom.subscriberName.value.trim(),
    email: dom.subscriberEmail.value.trim()
  };
  unit.subscribers.push(subscriber);
  saveUnitState(unit);
  dom.subscriberForm.reset();
  renderSubscribers(unit);
  announce(`${subscriber.name} added as a subscriber.`);
}

function buildConditionForms() {
  dom.conditionsFields.replaceChildren();
  for (const definition of CONDITION_DEFINITIONS) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "field-group";
    const legend = document.createElement("legend");
    legend.textContent = definition.label;
    const range = document.createElement("div");
    range.className = "condition-range";
    range.append(
      buildNumberInput(`${definition.key}Min`, "Minimum"),
      buildNumberInput(`${definition.key}Max`, "Maximum")
    );
    fieldset.append(legend, range);
    dom.conditionsFields.append(fieldset);

    if (definition.key === "windSpeed") dom.conditionsFields.append(buildDirectionFieldset("windDirection", "Wind direction"));
    if (definition.key === "transportWindSpeed") dom.conditionsFields.append(buildDirectionFieldset("transportWindDirection", "Transport wind direction"));
  }

  dom.actualWeatherFields.replaceChildren();
  for (const [key, label] of ACTUAL_WEATHER_FIELDS) {
    const group = document.createElement("div");
    group.className = "field-group";
    const inputLabel = document.createElement("label");
    inputLabel.htmlFor = `actual-${key}`;
    inputLabel.textContent = label;
    let input;
    if (key.toLowerCase().includes("direction")) {
      input = document.createElement("select");
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "Not entered";
      input.append(empty);
      DIRECTIONS.forEach((direction) => {
        const option = document.createElement("option");
        option.value = direction;
        option.textContent = direction;
        input.append(option);
      });
    } else {
      input = document.createElement("input");
      input.type = "number";
      input.step = "any";
    }
    input.id = `actual-${key}`;
    input.dataset.actualWeather = key;
    group.append(inputLabel, input);
    dom.actualWeatherFields.append(group);
  }
}

function buildNumberInput(id, placeholder) {
  const input = document.createElement("input");
  input.id = id;
  input.type = "number";
  input.step = "any";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", placeholder);
  return input;
}

function buildDirectionFieldset(key, label) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "field-group field-group--wide";
  const legend = document.createElement("legend");
  legend.textContent = label;
  const grid = document.createElement("div");
  grid.className = "direction-grid";
  DIRECTIONS.forEach((direction) => {
    const item = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = key;
    input.value = direction;
    item.append(input, document.createTextNode(direction));
    grid.append(item);
  });
  fieldset.append(legend, grid);
  return fieldset;
}

function populateDirectionOptions() {
  dom.transportDirection.replaceChildren();
  DIRECTIONS.forEach((direction) => {
    const option = document.createElement("option");
    option.value = direction;
    option.textContent = direction;
    dom.transportDirection.append(option);
  });
  dom.transportDirection.value = "S";
}

function openConditionsDialog() {
  const unit = selectedUnit();
  if (!unit) {
    announce("Select a burn unit before editing preferred weather conditions.");
    return;
  }
  for (const definition of CONDITION_DEFINITIONS) {
    const value = unit.preferred[definition.key] || {};
    document.getElementById(`${definition.key}Min`).value = value.min ?? "";
    document.getElementById(`${definition.key}Max`).value = value.max ?? "";
  }
  document.querySelectorAll('input[name="windDirection"]').forEach((input) => {
    input.checked = unit.preferred.windDirection.includes(input.value);
  });
  document.querySelectorAll('input[name="transportWindDirection"]').forEach((input) => {
    input.checked = unit.preferred.transportWindDirection.includes(input.value);
  });
  dom.conditionsDialog.showModal();
  document.getElementById("temperatureMin").focus();
}

function handleConditionsFormSubmit(event) {
  event.preventDefault();
  const unit = selectedUnit();
  if (!unit) return;
  const preferred = {};
  for (const definition of CONDITION_DEFINITIONS) {
    preferred[definition.key] = {
      min: toNullableNumber(document.getElementById(`${definition.key}Min`).value),
      max: toNullableNumber(document.getElementById(`${definition.key}Max`).value)
    };
    if (preferred[definition.key].min != null && preferred[definition.key].max != null && preferred[definition.key].min > preferred[definition.key].max) {
      announce(`${definition.label}: the minimum cannot be greater than the maximum.`);
      document.getElementById(`${definition.key}Min`).focus();
      return;
    }
  }
  preferred.windDirection = [...document.querySelectorAll('input[name="windDirection"]:checked')].map((input) => input.value);
  preferred.transportWindDirection = [...document.querySelectorAll('input[name="transportWindDirection"]:checked')].map((input) => input.value);
  unit.preferred = normalizePreferred(preferred);
  const cached = state.forecastCache.get(unit.id);
  if (cached) updateUnitScoresFromForecast(unit, cached.daily);
  saveUnitState(unit);
  dom.conditionsDialog.close();
  renderAll();
  renderSelectedUnit();
  announce("Preferred weather conditions saved.");
}

function openEventDialog(eventRecord = null) {
  const unit = selectedUnit();
  if (!unit) return;
  dom.eventForm.reset();
  dom.eventDialogTitle.textContent = eventRecord ? "Edit burn event" : "Add burn event";
  dom.eventId.value = eventRecord?.id || "";
  dom.plannedBurnDate.value = eventRecord?.plannedDate || "";
  dom.actualBurnDate.value = eventRecord?.actualDate || "";
  dom.burnCanceled.checked = Boolean(eventRecord?.canceled);
  dom.treatmentType.value = eventRecord?.treatmentType || "";
  dom.plannedAcres.value = eventRecord?.plannedAcres ?? formatNumber(unit.acres, 2).replace(/,/g, "");
  dom.actualAcres.value = eventRecord?.actualAcres ?? "";
  dom.eventNotes.value = eventRecord?.notes || "";
  document.querySelectorAll("[data-actual-weather]").forEach((input) => {
    input.value = eventRecord?.actualWeather?.[input.dataset.actualWeather] ?? "";
  });
  dom.eventDialog.showModal();
  dom.plannedBurnDate.focus();
}

function handleEventFormSubmit(event) {
  event.preventDefault();
  const unit = selectedUnit();
  if (!unit || !dom.eventForm.reportValidity()) return;
  const actualWeather = {};
  document.querySelectorAll("[data-actual-weather]").forEach((input) => {
    actualWeather[input.dataset.actualWeather] = input.value;
  });
  const record = {
    id: dom.eventId.value || crypto.randomUUID(),
    plannedDate: dom.plannedBurnDate.value,
    actualDate: dom.actualBurnDate.value,
    canceled: dom.burnCanceled.checked,
    treatmentType: dom.treatmentType.value,
    plannedAcres: toNullableNumber(dom.plannedAcres.value),
    actualAcres: toNullableNumber(dom.actualAcres.value),
    notes: dom.eventNotes.value,
    actualWeather
  };
  const index = unit.events.findIndex((item) => item.id === record.id);
  if (index >= 0) unit.events[index] = record;
  else unit.events.push(record);
  if (record.actualDate && !record.canceled) unit.lastBurned = record.actualDate;
  saveUnitState(unit);
  dom.eventDialog.close();
  renderAll();
  renderSelectedUnit();
  activateUnitSection("events");
  announce("Burn event saved.");
}

function renderEvents(unit) {
  dom.eventTableBody.replaceChildren();
  const events = [...unit.events].sort((a, b) => String(b.plannedDate).localeCompare(String(a.plannedDate)));
  if (!events.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "empty-message";
    cell.textContent = "No burn events have been recorded.";
    row.append(cell);
    dom.eventTableBody.append(row);
    return;
  }
  for (const eventRecord of events) {
    const row = document.createElement("tr");
    const values = [
      eventRecord.plannedDate ? formatDate(eventRecord.plannedDate) : "—",
      eventRecord.actualDate ? formatDate(eventRecord.actualDate) : "—",
      eventRecord.canceled ? "Yes" : "No",
      eventRecord.treatmentType || "—",
      formatNumber(eventRecord.plannedAcres, 2),
      formatNumber(eventRecord.actualAcres, 2)
    ];
    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    const actionCell = document.createElement("td");
    const edit = document.createElement("button");
    edit.className = "text-button";
    edit.type = "button";
    edit.textContent = "More details";
    edit.addEventListener("click", () => openEventDialog(eventRecord));
    actionCell.append(edit);
    row.append(actionCell);
    dom.eventTableBody.append(row);
  }
}

async function refreshSelectedUnitForecast() {
  const unit = selectedUnit();
  if (!unit) {
    announce("Select a burn unit before updating forecast data.");
    return;
  }

  const center = geometryCentroid(unit.geometry);
  if (Number.isFinite(center.latitude) && Number.isFinite(center.longitude)) {
    unit.latitude = center.latitude;
    unit.longitude = center.longitude;
  }
  if (!Number.isFinite(unit.latitude) || !Number.isFinite(unit.longitude)) {
    showWeatherError("The burn unit does not have a valid geographic center. Verify its geometry and spatial reference.");
    activatePanel("unit");
    activateUnitSection("weather");
    return;
  }

  const buttons = [dom.refreshUnitForecastButton, dom.updateSelectedForecast].filter(Boolean);
  const labels = buttons.map((button) => button.textContent);
  buttons.forEach((button) => { button.disabled = true; button.textContent = "Updating…"; button.setAttribute("aria-busy", "true"); });

  try {
    const { Point } = state.modules;
    const point = new Point({ longitude: unit.longitude, latitude: unit.latitude, spatialReference: { wkid: 4326 } });
    await selectWeatherLocation(point, false, unit.id);
    activatePanel("unit");
    activateUnitSection("weather");
  } finally {
    buttons.forEach((button, index) => { button.disabled = false; button.textContent = labels[index]; button.removeAttribute("aria-busy"); });
  }
}

function hasMapSelection() {
  const hasForecastMarker = Boolean(state.layers.marker?.graphics?.length);
  return Boolean(state.selectedUnitId || hasForecastMarker || state.lastPointForecast);
}

function updateMapSelectionControls() {
  if (!dom.clearMapSelectionButton) return;
  dom.clearMapSelectionButton.disabled = !hasMapSelection();
}

function closeMapPopup() {
  try {
    state.view?.closePopup?.();
  } catch (error) {
    console.debug("The map popup could not be closed.", error);
  }

  try {
    state.view?.popup?.clear?.();
  } catch (error) {
    console.debug("The map popup contents could not be cleared.", error);
  }
}

function resetPointForecastPanel() {
  if (!dom.weatherEmpty || !dom.weatherContent) return;

  dom.weatherContent.hidden = true;
  dom.weatherEmpty.hidden = false;
  const heading = dom.weatherEmpty.querySelector("h3");
  const description = dom.weatherEmpty.querySelector("p");
  if (heading) heading.textContent = "No Location Selected";
  if (description) {
    description.textContent = "Click a location on the map or select a burn unit to retrieve a National Weather Service forecast.";
  }

  dom.weatherCoordinates.textContent = "";
  dom.weatherLocation.textContent = "Selected location";
  dom.weatherTemperature.textContent = "—";
  dom.weatherShortForecast.textContent = "—";
  dom.weatherHumidity.textContent = "—";
  dom.weatherWind.textContent = "—";
  dom.weatherGust.textContent = "—";
  dom.weatherPrecip.textContent = "—";
  dom.hourlyForecastRows.replaceChildren();
  setWeatherLoading(false, "Select a Location");
}

function clearMapSelection(options = {}) {
  const {
    clearForecast = true,
    announceChange = true,
    preservePanel = false
  } = options;

  state.weatherAbortController?.abort();
  state.weatherAbortController = null;
  state.selectedUnitId = null;
  state.selectedGraphic = null;
  closeMapPopup();

  state.layers.marker?.removeAll();
  if (clearForecast) {
    state.lastPointForecast = null;
    resetPointForecastPanel();
  }

  renderSelectedUnit();
  refreshBurnGraphics();
  updateMapSelectionControls();

  // The unit overview cannot remain meaningful after its unit is deselected.
  if (!preservePanel && state.currentPanel === "unit") activatePanel("map");

  if (announceChange) announce("Map selection cleared.");
}

async function selectWeatherLocation(point, openPanel = true, unitId = null) {
  const { Graphic, Point } = state.modules;
  const coordinates = geographicCoordinates(point);
  const latitude = coordinates.latitude;
  const longitude = coordinates.longitude;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    setWeatherLoading(false, "Invalid location");
    showWeatherError("The selected map geometry could not be converted to latitude and longitude.");
    announce("The selected location could not be converted to geographic coordinates.");
    return;
  }

  const geographicPoint = new Point({ longitude, latitude, spatialReference: { wkid: 4326 } });
  state.layers.marker.removeAll();
  state.layers.marker.add(new Graphic({
    geometry: geographicPoint,
    symbol: {
      type: "simple-marker",
      size: 11,
      color: [244, 201, 93, 0.96],
      outline: { color: [12, 21, 29, 1], width: 2 }
    },
    attributes: { title: "Forecast location" },
    popupTemplate: { title: "Forecast location", content: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }
  }));
  updateMapSelectionControls();

  if (openPanel) activatePanel("planner");
  await loadPointForecast(latitude, longitude, unitId);
}

async function loadPointForecast(latitude, longitude, unitId = null) {
  state.weatherAbortController?.abort();
  state.weatherAbortController = new AbortController();
  const signal = state.weatherAbortController.signal;
  setWeatherLoading(true, "Loading forecast…");
  dom.weatherEmpty.hidden = true;
  dom.weatherContent.hidden = true;

  try {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      throw new Error("The requested forecast coordinates are outside the valid latitude/longitude range.");
    }
    const pointUrl = `${CONFIG.weather.nwsApiRoot}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointData = await fetchJson(pointUrl, signal);
    const hourlyUrl = pointData.properties?.forecastHourly;
    const dailyUrl = pointData.properties?.forecast;
    const gridUrl = pointData.properties?.forecastGridData;
    if (!hourlyUrl || !dailyUrl) throw new Error("The NWS point response did not include required forecast URLs.");

    const gridPromise = gridUrl
      ? fetchJson(gridUrl, signal).catch((error) => {
          console.warn("NWS grid forecast data could not be loaded; basic forecast values will still be shown.", error);
          return null;
        })
      : Promise.resolve(null);
    const [hourlyData, dailyData, gridData] = await Promise.all([
      fetchJson(hourlyUrl, signal),
      fetchJson(dailyUrl, signal),
      gridPromise
    ]);
    const hourly = hourlyData.properties?.periods || [];
    const basicDaily = (dailyData.properties?.periods || []).filter((period) => period.isDaytime).slice(0, 7);
    const daily = enrichDailyForecastPeriods(basicDaily, gridData?.properties || {});
    if (!hourly.length) throw new Error("No hourly forecast periods were returned.");

    const payload = { latitude, longitude, pointData, hourly, daily, updated: new Date().toISOString() };
    state.lastPointForecast = payload;
    renderPointForecast(payload);
    if (unitId) {
      state.forecastCache.set(unitId, payload);
      const unit = getUnit(unitId);
      if (unit) {
        updateUnitScoresFromForecast(unit, daily);
        unit.lastUpdated = payload.updated;
        try {
          await saveUnitState(unit);
        } catch (saveError) {
          console.warn("Forecast loaded, but forecast metadata could not be written to the hosted layer.", saveError);
        }
        renderAll();
        renderSelectedUnit();
      }
    }
    setWeatherLoading(false, "Forecast loaded");
    announce(`Forecast loaded for ${latitude.toFixed(3)}, ${longitude.toFixed(3)}.`);
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("NWS point forecast request failed.", error);
    showWeatherError(safeText(error.message, "The National Weather Service forecast could not be retrieved."));
    setWeatherLoading(false, "Forecast error");
    announce("The point forecast could not be retrieved.");
  }
}

function showWeatherError(message) {
  dom.weatherContent.hidden = true;
  dom.weatherEmpty.hidden = false;
  dom.weatherEmpty.querySelector("h3").textContent = "Forecast unavailable";
  dom.weatherEmpty.querySelector("p").textContent = `${message} Select Go To Map and choose another California location, or try again.`;
}

function renderPointForecast({ latitude, longitude, pointData, hourly }) {
  const first = hourly[0];
  const relativeLocation = pointData.properties?.relativeLocation?.properties;
  const cityState = [relativeLocation?.city, relativeLocation?.state].filter(Boolean).join(", ");
  dom.weatherCoordinates.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  dom.weatherLocation.textContent = cityState || "Selected map location";
  dom.weatherTemperature.textContent = `${safeText(first.temperature, "—")}°${safeText(first.temperatureUnit, "")}`;
  dom.weatherShortForecast.textContent = safeText(first.shortForecast, "Forecast not described");
  dom.weatherHumidity.textContent = formatPercent(first.relativeHumidity?.value);
  dom.weatherWind.textContent = `${safeText(first.windDirection, "—")} ${formatWind(first.windSpeed)}`.trim();
  dom.weatherGust.textContent = formatWind(first.windGust);
  dom.weatherPrecip.textContent = formatPercent(first.probabilityOfPrecipitation?.value);
  dom.hourlyForecastRows.replaceChildren();
  for (const period of hourly.slice(0, CONFIG.weather.forecastHours)) {
    const row = document.createElement("tr");
    const values = [
      formatTime(period.startTime),
      safeText(period.shortForecast, "—"),
      `${safeText(period.temperature, "—")}°${safeText(period.temperatureUnit, "")}`,
      formatPercent(period.relativeHumidity?.value),
      `${safeText(period.windDirection, "—")} ${formatWind(period.windSpeed)}`.trim(),
      formatWind(period.windGust)
    ];
    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    dom.hourlyForecastRows.append(row);
  }
  const mapClickUrl = `https://forecast.weather.gov/MapClick.php?lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`;
  dom.pointForecastLink.href = mapClickUrl;
  dom.weatherEmpty.querySelector("h3").textContent = "No location selected";
  dom.weatherEmpty.querySelector("p").textContent = "Click a location on the map or select a burn unit to retrieve a National Weather Service forecast.";
  dom.weatherEmpty.hidden = true;
  dom.weatherContent.hidden = false;
}

function enrichDailyForecastPeriods(periods, gridProperties) {
  return periods.map((period) => {
    const referenceTime = new Date(period.startTime);
    return {
      ...period,
      grid: {
        quantitativePrecipitation: getGridValueAt(gridProperties.quantitativePrecipitation, referenceTime, "in"),
        transportWindSpeed: getGridValueAt(gridProperties.transportWindSpeed, referenceTime, "mph"),
        transportWindDirectionDegrees: getGridValueAt(gridProperties.transportWindDirection, referenceTime, "degree"),
        mixingHeight: getGridValueAt(gridProperties.mixingHeight, referenceTime, "ft"),
        windGust: getGridValueAt(gridProperties.windGust, referenceTime, "mph")
      }
    };
  }).map((period) => ({
    ...period,
    grid: {
      ...period.grid,
      transportWindDirection: Number.isFinite(period.grid.transportWindDirectionDegrees)
        ? degreesToDirection(period.grid.transportWindDirectionDegrees)
        : null
    }
  }));
}

function getGridValueAt(property, referenceTime, targetUnit) {
  if (!property || !Array.isArray(property.values) || !Number.isFinite(referenceTime?.getTime?.())) return null;
  const reference = referenceTime.getTime();
  let selected = null;
  let selectedDistance = Number.POSITIVE_INFINITY;
  for (const entry of property.values) {
    const interval = parseNwsValidTime(entry.validTime);
    if (!interval) continue;
    if (reference >= interval.start && reference < interval.end) {
      selected = entry;
      break;
    }
    const distance = Math.abs(reference - interval.start);
    if (distance < selectedDistance) { selected = entry; selectedDistance = distance; }
  }
  const value = Number(selected?.value);
  if (!Number.isFinite(value)) return null;
  return convertNwsGridValue(value, property.uom, targetUnit);
}

function parseNwsValidTime(validTime) {
  if (!validTime || typeof validTime !== "string") return null;
  const [startText, durationText = "PT1H"] = validTime.split("/");
  const start = new Date(startText).getTime();
  if (!Number.isFinite(start)) return null;
  const durationMatch = durationText.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/);
  const duration = durationMatch
    ? ((Number(durationMatch[1]) || 0) * 86400000 + (Number(durationMatch[2]) || 0) * 3600000 + (Number(durationMatch[3]) || 0) * 60000)
    : 3600000;
  return { start, end: start + Math.max(duration, 1) };
}

function convertNwsGridValue(value, unitCode, targetUnit) {
  const unit = String(unitCode || "").toLowerCase();
  if (targetUnit === "in") {
    if (unit.includes("mm")) return value / 25.4;
    if (unit.includes("cm")) return value / 2.54;
    if (unit.endsWith(":m") || unit.includes("wmoUnit:m".toLowerCase())) return value * 39.3701;
  }
  if (targetUnit === "mph") {
    if (unit.includes("km_h") || unit.includes("km/h")) return value / 1.609344;
    if (unit.includes("m_s") || unit.includes("m/s")) return value * 2.236936;
    if (unit.includes("kn")) return value * 1.150779;
  }
  if (targetUnit === "ft") {
    if (unit.endsWith(":m") || unit.includes("wmoUnit:m".toLowerCase())) return value * 3.28084;
  }
  return value;
}

function degreesToDirection(degrees) {
  const normalizedDegrees = ((Number(degrees) % 360) + 360) % 360;
  return DIRECTIONS[Math.round(normalizedDegrees / 45) % DIRECTIONS.length];
}

function updateUnitScoresFromForecast(unit, daily) {
  const scores = daily.map((period) => scoreForecastPeriod(period, unit.preferred));
  while (scores.length < 7) scores.push(null);
  unit.forecastScores = scores.slice(0, 7);
}

function scoreForecastPeriod(period, preferred) {
  const available = {
    temperature: Number(period.temperature),
    relativeHumidity: Number(period.relativeHumidity?.value),
    windSpeed: parseWindNumber(period.windSpeed),
    windDirection: period.windDirection,
    windGust: Number.isFinite(Number(period.grid?.windGust)) ? Number(period.grid.windGust) : parseWindNumber(period.windGust),
    quantitativePrecipitation: Number(period.grid?.quantitativePrecipitation),
    probabilityPrecipitation: Number(period.probabilityOfPrecipitation?.value),
    transportWindSpeed: Number(period.grid?.transportWindSpeed),
    transportWindDirection: period.grid?.transportWindDirection,
    mixingHeight: Number(period.grid?.mixingHeight)
  };
  let considered = 0;
  let matched = 0;
  for (const key of ["temperature", "relativeHumidity", "windSpeed", "windGust", "quantitativePrecipitation", "probabilityPrecipitation", "transportWindSpeed", "mixingHeight"]) {
    const range = preferred[key];
    const value = available[key];
    const hasRange = range && (range.min != null || range.max != null);
    if (!hasRange || !Number.isFinite(value)) continue;
    considered += 1;
    if ((range.min == null || value >= range.min) && (range.max == null || value <= range.max)) matched += 1;
  }
  if (preferred.windDirection?.length && available.windDirection) {
    considered += 1;
    if (preferred.windDirection.includes(available.windDirection)) matched += 1;
  }
  if (preferred.transportWindDirection?.length && available.transportWindDirection) {
    considered += 1;
    if (preferred.transportWindDirection.includes(available.transportWindDirection)) matched += 1;
  }
  return considered ? Math.round((matched / considered) * 100) : null;
}

function renderForecastMatrix(unit) {
  const cached = state.forecastCache.get(unit.id);
  const daily = cached?.daily || [];
  dom.forecastUpdated.textContent = cached ? `Last updated ${formatDateTime(cached.updated)}` : "Forecast not yet updated for this unit";
  dom.forecastMatrixHead.replaceChildren();
  dom.forecastMatrixBody.replaceChildren();

  const headerRow = document.createElement("tr");
  ["Conditions", "Preferred", ...Array.from({ length: 7 }, (_, index) => daily[index] ? formatDate(daily[index].startTime) : relativeDateLabel(index))].forEach((label) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headerRow.append(th);
  });
  dom.forecastMatrixHead.append(headerRow);

  const rows = [
    ["Burn forecast score", "—", (period, index) => unit.forecastScores[index] == null ? "n/a" : `${unit.forecastScores[index]}%`],
    ["Temperature (°F)", formatRange(unit.preferred.temperature), (period) => period ? safeText(period.temperature, "n/a") : "n/a"],
    ["Relative humidity (%)", formatRange(unit.preferred.relativeHumidity), (period) => period ? formatNullable(period.relativeHumidity?.value) : "n/a"],
    ["Wind speed (mph)", formatRange(unit.preferred.windSpeed), (period) => period ? safeText(period.windSpeed, "n/a") : "n/a"],
    ["Wind direction", unit.preferred.windDirection.join(", ") || "Any", (period) => period ? safeText(period.windDirection, "n/a") : "n/a"],
    ["Wind gust (mph)", formatRange(unit.preferred.windGust), (period) => period ? formatNullable(period.grid?.windGust ?? parseWindNumber(period.windGust), 1) : "n/a"],
    ["Quantitative precipitation (in)", formatRange(unit.preferred.quantitativePrecipitation), (period) => period ? formatNullable(period.grid?.quantitativePrecipitation, 2) : "n/a"],
    ["Probability of precipitation (%)", formatRange(unit.preferred.probabilityPrecipitation), (period) => period ? formatNullable(period.probabilityOfPrecipitation?.value) : "n/a"],
    ["Transport wind speed (mph)", formatRange(unit.preferred.transportWindSpeed), (period) => period ? formatNullable(period.grid?.transportWindSpeed, 1) : "n/a"],
    ["Transport wind direction", unit.preferred.transportWindDirection.join(", ") || "Any", (period) => period ? safeText(period.grid?.transportWindDirection, "n/a") : "n/a"],
    ["Dispersion index", formatRange(unit.preferred.dispersionIndex), () => "n/a"],
    ["Mixing height (ft)", formatRange(unit.preferred.mixingHeight), (period) => period ? formatNullable(period.grid?.mixingHeight, 0) : "n/a"],
    ["LVORI", formatRange(unit.preferred.lvori), () => "n/a"]
  ];

  for (const [label, preferred, valueFn] of rows) {
    const row = document.createElement("tr");
    const first = document.createElement("th");
    first.scope = "row";
    first.textContent = label;
    row.append(first);
    const preferredCell = document.createElement("td");
    preferredCell.textContent = preferred;
    row.append(preferredCell);
    for (let index = 0; index < 7; index += 1) {
      const cell = document.createElement("td");
      cell.textContent = valueFn(daily[index], index);
      row.append(cell);
    }
    dom.forecastMatrixBody.append(row);
  }
}

function updateUnitExternalLinks(unit) {
  const pointUrl = `https://forecast.weather.gov/MapClick.php?lat=${Number(unit.latitude).toFixed(4)}&lon=${Number(unit.longitude).toFixed(4)}`;
  dom.pointForecastLink.href = pointUrl;
}

function buildSensitiveAreaGraphics() {
  const { Graphic, Point } = state.modules;
  const points = [
    [-120.270, 38.289, "Structures", "Park housing cluster"],
    [-120.301, 38.265, "Transportation", "State Route corridor"],
    [-120.249, 38.278, "Medical response", "Emergency response facility"],
    [-120.814, 37.281, "Structures", "Rural residences"],
    [-120.858, 37.250, "Schools", "School facility"],
    [-120.792, 37.265, "Transportation", "Highway corridor"],
    [-121.168, 37.714, "Structures", "Residential area"],
    [-121.201, 37.696, "Law enforcement", "Public safety facility"],
    [-121.620, 37.647, "Structures", "Ranch structures"],
    [-121.654, 37.619, "Transportation", "Road corridor"]
  ];
  const symbols = {
    Structures: [232, 180, 84, 0.95],
    Schools: [116, 185, 236, 0.95],
    "Medical response": [229, 89, 89, 0.95],
    "Law enforcement": [155, 124, 224, 0.95],
    Transportation: [218, 218, 218, 0.95]
  };
  state.layers.sensitive.removeAll();
  for (const [longitude, latitude, category, name] of points) {
    state.layers.sensitive.add(new Graphic({
      geometry: new Point({ longitude, latitude, spatialReference: { wkid: 4326 } }),
      attributes: { category, name, layerType: "sensitive" },
      symbol: {
        type: "simple-marker",
        size: 9,
        color: symbols[category] || [255,255,255,0.9],
        outline: { color: [8,16,23,1], width: 1.5 }
      },
      popupTemplate: { title: name, content: category }
    }));
  }
}

function updateSmokeScreening() {
  const unit = selectedUnit();
  state.layers.smoke.removeAll();
  if (!unit || !dom.smokeToggle.checked) {
    state.layers.smoke.visible = false;
    state.layers.sensitive.visible = false;
    renderSensitiveAreaSummary([]);
    return;
  }

  state.layers.smoke.visible = true;
  state.layers.sensitive.visible = true;
  const windFrom = directionToDegrees(dom.transportDirection.value);
  const plumeHeading = (windFrom + 180) % 360;
  const spread = Number(dom.directionalDegrees.value) || 30;
  const distance = Number(dom.plumeDistance.value) || 10;
  const outer = sectorGeometry(unit.longitude, unit.latitude, plumeHeading, spread, distance);
  const inner = sectorGeometry(unit.longitude, unit.latitude, plumeHeading, Math.max(10, spread * 0.65), distance * 0.45);
  const { Graphic, Polygon } = state.modules;
  const outerPolygon = new Polygon(outer);
  const innerPolygon = new Polygon(inner);

  state.layers.smoke.addMany([
    new Graphic({
      geometry: outerPolygon,
      attributes: { layerType: "smoke", severity: "screening" },
      symbol: { type: "simple-fill", color: [238, 207, 72, 0.27], outline: { color: [255, 221, 78, 0.95], width: 1.5 } }
    }),
    new Graphic({
      geometry: innerPolygon,
      attributes: { layerType: "smoke", severity: "higher potential" },
      symbol: { type: "simple-fill", color: [239, 126, 51, 0.34], outline: { color: [255, 145, 61, 1], width: 1.8 } }
    })
  ]);

  const impacts = [];
  for (const graphic of state.layers.sensitive.graphics) {
    let severity = null;
    try {
      if (state.modules.geometryEngine.contains(innerPolygon, graphic.geometry)) severity = "Higher-potential area";
      else if (state.modules.geometryEngine.contains(outerPolygon, graphic.geometry)) severity = "Screening area";
    } catch {
      severity = pointSectorSeverity(graphic.geometry, unit, plumeHeading, spread, distance);
    }
    graphic.visible = Boolean(severity);
    if (severity) impacts.push({ category: graphic.attributes.category, name: graphic.attributes.name, severity });
  }
  renderSensitiveAreaSummary(impacts);
}

function renderSensitiveAreaSummary(impacts) {
  dom.sensitiveAreaSummary.replaceChildren();
  if (!impacts.length) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "No configured sample sensitive-area points fall within the current screening plume.";
    dom.sensitiveAreaSummary.append(message);
    return;
  }
  const grouped = new Map();
  for (const impact of impacts) {
    if (!grouped.has(impact.category)) grouped.set(impact.category, []);
    grouped.get(impact.category).push(impact);
  }
  for (const [category, items] of grouped) {
    const wrapper = document.createElement("div");
    wrapper.className = "sensitive-item";
    const label = document.createElement("span");
    const higherCount = items.filter((item) => item.severity === "Higher-potential area").length;
    label.textContent = `${category}${higherCount ? ` · ${higherCount} higher-potential` : ""}`;
    const count = document.createElement("span");
    count.className = "sensitive-count";
    count.textContent = String(items.length);
    wrapper.append(label, count);
    dom.sensitiveAreaSummary.append(wrapper);
  }
}

function renderLayerToggles() {
  dom.layerToggles.replaceChildren();
  const items = [
    { label: "Burn units", get: () => state.layers.burn.visible || state.layers.burnMarkers.visible, set: (value) => { state.layers.burn.visible = value; state.layers.burnMarkers.visible = value; } },
    { label: "Park boundaries", disabled: !state.layers.parks, get: () => Boolean(state.layers.parks?.visible), set: (value) => { if (state.layers.parks) state.layers.parks.visible = value; } },
    { label: "Smoke-sensitive areas", get: () => state.layers.sensitive.visible, set: (value) => { state.layers.sensitive.visible = value; } },
    { label: "Conceptual smoke screening", get: () => state.layers.smoke.visible, set: (value) => { state.layers.smoke.visible = value; dom.smokeToggle.checked = value; } }
  ];
  for (const item of items) {
    const wrapper = document.createElement("div");
    wrapper.className = "layer-toggle";
    const label = document.createElement("label");
    const text = document.createElement("span");
    text.textContent = item.label;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = item.get();
    input.disabled = Boolean(item.disabled);
    input.addEventListener("change", () => {
      item.set(input.checked);
      announce(`${item.label} ${input.checked ? "shown" : "hidden"}.`);
    });
    label.append(text, input);
    wrapper.append(label);
    dom.layerToggles.append(wrapper);
  }
}

async function loadFireWeatherAlerts() {
  dom.alertStatus.textContent = "Checking…";
  dom.weatherAlerts.replaceChildren();
  try {
    const alerts = await fetchCaliforniaFireWeatherAlerts();
    if (!alerts.length) {
      dom.alertStatus.textContent = "None active";
      const message = document.createElement("p");
      message.className = "empty-message";
      message.textContent = "No active NWS fire-weather alerts affecting California were returned.";
      dom.weatherAlerts.append(message);
      return;
    }

    const maxAlerts = Math.max(1, Number(CONFIG.weather.maxAlertsToDisplay) || 6);
    const displayedAlerts = alerts.slice(0, maxAlerts);
    const impactTasks = [];
    for (const alert of displayedAlerts) {
      const card = buildAlertCard(alert);
      dom.weatherAlerts.append(card);
      impactTasks.push(
        updateAlertParkImpacts(alert, card).catch((error) => {
          console.warn("Park-unit alert-impact screening did not complete.", error);
          const impact = card.querySelector("[data-alert-park-impact]");
          if (impact) impact.textContent = "Park-unit overlap could not be determined.";
          return { status: "unavailable", names: [] };
        })
      );
    }

    // Do not report the alert section as fully loaded while the park-impact
    // labels are still spinning. Each analysis has its own finite timeout.
    await Promise.allSettled(impactTasks);
    dom.alertStatus.textContent = `${displayedAlerts.length} active${alerts.length > displayedAlerts.length ? ` of ${alerts.length}` : ""}`;
  } catch (error) {
    console.error("NWS fire-weather alerts could not be loaded.", error);
    dom.alertStatus.textContent = "Unavailable";
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "Fire-weather alerts could not be retrieved from the National Weather Service.";
    dom.weatherAlerts.append(message);
  }
}

async function fetchCaliforniaFireWeatherAlerts() {
  const root = String(CONFIG.weather.nwsApiRoot || "https://api.weather.gov").replace(/\/$/, "");
  const stateCode = String(CONFIG.weather.alertStateCode || "CA").trim().toUpperCase();
  const regionCode = String(CONFIG.weather.alertRegionCode || "WR").trim().toUpperCase();
  const stateEndpoints = [
    `${root}/alerts/active/area/${encodeURIComponent(stateCode)}`,
    `${root}/alerts/active?area=${encodeURIComponent(stateCode)}`
  ];

  let stateFeatures = [];
  let successfulStateRequest = false;
  let lastStateError = null;
  for (const endpoint of stateEndpoints) {
    try {
      const data = await fetchJson(endpoint);
      successfulStateRequest = true;
      stateFeatures = Array.isArray(data?.features) ? data.features : [];
      // A non-empty response is authoritative. When the path endpoint returns
      // an unexpected empty collection, retry the documented query form.
      if (stateFeatures.length) break;
    } catch (error) {
      lastStateError = error;
      console.warn(`NWS state-alert request failed: ${endpoint}`, error);
    }
  }

  // Some multi-state fire-weather products are issued by western offices and
  // may not be consistently returned by every state endpoint. Merge western
  // region alerts that explicitly contain California UGC/SAME metadata.
  let regionalFeatures = [];
  let regionalRequestSucceeded = false;
  if (regionCode) {
    try {
      const regionalData = await fetchJson(`${root}/alerts/active/region/${encodeURIComponent(regionCode)}`);
      regionalRequestSucceeded = true;
      regionalFeatures = (regionalData?.features || []).filter((feature) =>
        isCaliforniaAlertByMetadata(feature, stateCode)
      );
    } catch (error) {
      console.warn("The NWS western-region alert fallback was unavailable.", error);
    }
  }

  if (!successfulStateRequest && !regionalRequestSucceeded) {
    throw lastStateError || new Error("No NWS alert endpoint completed successfully.");
  }

  const configuredEvents = new Set((CONFIG.weather.fireWeatherEvents || []).map(normalize));
  const merged = deduplicateAlertFeatures([...stateFeatures, ...regionalFeatures]);
  const alerts = merged
    .filter((feature) => isConfiguredFireWeatherAlert(feature, configuredEvents))
    .sort(compareAlertFeatures);

  console.info("NWS fire-weather alert diagnostics", {
    stateCode,
    stateFeatures: stateFeatures.length,
    regionalCaliforniaFeatures: regionalFeatures.length,
    fireWeatherAlerts: alerts.length
  });
  return alerts;
}

function isConfiguredFireWeatherAlert(feature, configuredEvents) {
  const event = normalize(feature?.properties?.event);
  return configuredEvents.has(event) || event.includes("fire weather") || event.includes("red flag");
}

function isCaliforniaAlertByMetadata(feature, stateCode = "CA") {
  const properties = feature?.properties || {};
  const geocode = properties.geocode || {};
  const ugcValues = toStringArray(geocode.UGC || geocode.ugc);
  if (ugcValues.some((value) => value.toUpperCase().startsWith(stateCode))) return true;

  const sameValues = toStringArray(geocode.SAME || geocode.same);
  // California's state FIPS code is 06; SAME values are commonly six digits.
  if (stateCode === "CA" && sameValues.some((value) => /^006/.test(value.replace(/\D/g, "")))) return true;

  const areaDescription = normalize(properties.areaDesc);
  return areaDescription.includes("california");
}

function toStringArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (value == null || value === "") return [];
  return String(value).split(/[;,\s]+/).map((item) => item.trim()).filter(Boolean);
}

function deduplicateAlertFeatures(features) {
  const unique = new Map();
  for (const feature of features || []) {
    const properties = feature?.properties || {};
    const key = safeText(
      feature?.id || properties["@id"] || properties.id,
      `${properties.event || "alert"}|${properties.sent || properties.effective || ""}|${properties.areaDesc || ""}`
    );
    if (!unique.has(key)) unique.set(key, feature);
  }
  return [...unique.values()];
}

function compareAlertFeatures(first, second) {
  const firstTime = toDate(first?.properties?.sent || first?.properties?.effective)?.getTime() || 0;
  const secondTime = toDate(second?.properties?.sent || second?.properties?.effective)?.getTime() || 0;
  return secondTime - firstTime;
}

function buildAlertCard(feature) {
  const properties = feature.properties || {};
  const eventName = safeText(properties.event, "Fire-weather alert");
  const hazardColor = getNwsHazardColor(eventName);
  const rgb = hexToRgb(hazardColor);
  const borderRgb = rgb.map((value) => Math.max(0, Math.round(value * 0.58)));
  const accentRgb = rgb.map((value) => Math.min(255, Math.round(value + (255 - value) * 0.28)));

  const card = document.createElement("article");
  card.className = "alert-card";
  card.style.setProperty("--alert-rgb", rgb.join(", "));
  card.style.setProperty("--alert-border-rgb", borderRgb.join(", "));
  card.style.setProperty("--alert-accent-rgb", accentRgb.join(", "));

  const heading = document.createElement("h4");
  heading.textContent = eventName;

  const area = document.createElement("p");
  area.className = "alert-area";
  area.textContent = safeText(properties.areaDesc, "Area not specified");

  const timing = document.createElement("p");
  timing.className = "alert-timing";
  timing.textContent = `Expires: ${formatDateTime(properties.expires)}`;

  const footer = document.createElement("div");
  footer.className = "alert-card-footer";

  const impact = document.createElement("span");
  impact.className = "alert-park-impact";
  impact.dataset.alertParkImpact = "";
  impact.textContent = "Checking park-unit impacts…";

  const alertUrl = getAlertUrl(feature);
  if (alertUrl) {
    const link = document.createElement("a");
    link.className = "alert-source-link";
    link.href = alertUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View NWS alert ↗";
    footer.append(link);
  }
  footer.append(impact);

  card.append(heading, area, timing, footer);
  return card;
}

async function updateAlertParkImpacts(feature, card) {
  const impactElement = card.querySelector("[data-alert-park-impact]");
  if (!impactElement) return;

  const timeoutMs = Math.max(5000, Number(CONFIG.alertImpacts?.analysisTimeoutMs) || 20000);
  const result = await withTimeout(
    findAffectedParkUnits(feature),
    timeoutMs,
    `Park-unit overlap analysis exceeded ${Math.round(timeoutMs / 1000)} seconds.`
  );

  if (result.status === "unavailable") {
    impactElement.textContent = "Park-unit overlap unavailable for this alert.";
    return result;
  }

  if (!result.names.length) {
    impactElement.textContent = "No park units intersect this alert.";
    return result;
  }

  const maxNames = Math.max(1, Number(CONFIG.alertImpacts?.maxDisplayedParkNames) || 12);
  const shown = result.names.slice(0, maxNames);
  const remainder = result.names.length - shown.length;
  const noun = result.names.length === 1 ? "unit" : "units";
  impactElement.textContent = `${result.names.length} park ${noun} affected: ${shown.join("; ")}${remainder > 0 ? `; and ${remainder} more` : ""}`;
  impactElement.title = result.names.join("; ");
  return result;
}

async function findAffectedParkUnits(feature) {
  const layer = state.alertParkLayer || state.layers.parks;
  if (!layer) return { status: "unavailable", names: [] };

  try {
    await layer.load();
  } catch (error) {
    console.warn("The park-boundary analysis layer is not available.", error);
    return { status: "unavailable", names: [] };
  }

  const nameField = resolveParkNameField(layer);
  if (!nameField) return { status: "unavailable", names: [] };

  const directGeometries = geoJsonToArcGISPolygons(feature.geometry);
  if (directGeometries.length) {
    const directResult = await queryAffectedParkNames(layer, nameField, directGeometries);
    if (directResult.status === "available" && directResult.names.length) return directResult;

    // Some CAP alerts include a geometry that is generalized or unsuitable
    // for the layer query. Retry with the alert's linked NWS zone polygons.
    const zoneGeometries = await fetchAlertZoneGeometries(feature.properties?.affectedZones);
    if (zoneGeometries.length) {
      const zoneResult = await queryAffectedParkNames(layer, nameField, zoneGeometries);
      if (zoneResult.status === "available") return zoneResult;
    }
    return directResult;
  }

  const zoneGeometries = await fetchAlertZoneGeometries(feature.properties?.affectedZones);
  if (!zoneGeometries.length) return { status: "unavailable", names: [] };
  return queryAffectedParkNames(layer, nameField, zoneGeometries);
}

async function queryAffectedParkNames(layer, nameField, geometries) {
  const prepared = geometries
    .map((geometry) => prepareAlertGeometryForLayer(geometry, layer))
    .filter(Boolean);
  if (!prepared.length) return { status: "unavailable", names: [] };

  const queryGeometries = groupAlertQueryGeometries(prepared, 8);
  const concurrency = Math.max(1, Number(CONFIG.alertImpacts?.spatialQueryConcurrency) || 3);
  const queryResults = await mapWithConcurrency(
    queryGeometries,
    concurrency,
    (geometry) => queryParkNamesByGeometry(layer, nameField, geometry)
  );

  const names = new Set();
  let successfulQueries = 0;
  for (const result of queryResults) {
    if (result.status !== "fulfilled") {
      console.warn("A park-unit spatial query failed.", result.reason);
      continue;
    }
    successfulQueries += 1;
    for (const name of result.value) names.add(name);
  }

  return {
    status: successfulQueries ? "available" : "unavailable",
    names: [...names].sort((a, b) => a.localeCompare(b))
  };
}

function groupAlertQueryGeometries(geometries, chunkSize = 8) {
  const grouped = [];
  const size = Math.max(1, Number(chunkSize) || 8);
  for (let index = 0; index < geometries.length; index += size) {
    const chunk = geometries.slice(index, index + size);
    if (chunk.length === 1) {
      grouped.push(chunk[0]);
      continue;
    }
    try {
      const unioned = state.modules.geometryEngine.union(chunk);
      if (unioned) {
        grouped.push(unioned);
        continue;
      }
    } catch (error) {
      console.warn("A group of NWS alert-zone geometries could not be unioned; querying the individual geometries instead.", error);
    }
    grouped.push(...chunk);
  }
  return grouped;
}

function prepareAlertGeometryForLayer(geometry, layer) {
  if (!geometry) return null;
  let prepared = geometry;
  try {
    prepared = state.modules.geometryEngine.simplify(geometry) || geometry;
  } catch (error) {
    console.warn("An NWS alert geometry could not be simplified.", error);
  }

  const targetSpatialReference = layer?.spatialReference;
  const sourceSpatialReference = prepared.spatialReference;
  if (!targetSpatialReference || !sourceSpatialReference || spatialReferencesMatch(sourceSpatialReference, targetSpatialReference)) {
    return prepared;
  }

  const sourceWkid = getSpatialReferenceWkid(sourceSpatialReference);
  const targetWkid = getSpatialReferenceWkid(targetSpatialReference);
  const sourceIsWgs84 = sourceWkid === 4326;
  const targetIsWgs84 = targetWkid === 4326;
  const sourceIsWebMercator = [3857, 102100, 102113].includes(sourceWkid);
  const targetIsWebMercator = [3857, 102100, 102113].includes(targetWkid);

  try {
    if (sourceIsWgs84 && targetIsWebMercator) {
      return state.modules.webMercatorUtils.geographicToWebMercator(prepared) || prepared;
    }
    if (sourceIsWebMercator && targetIsWgs84) {
      return state.modules.webMercatorUtils.webMercatorToGeographic(prepared) || prepared;
    }
  } catch (error) {
    console.warn("An NWS alert geometry could not be projected for the park-boundary query.", error);
  }

  // FeatureLayer.queryFeatures includes the input spatial reference in the
  // request, so the service can project other supported coordinate systems.
  return prepared;
}

function spatialReferencesMatch(first, second) {
  if (!first || !second) return false;
  if (typeof first.equals === "function") return first.equals(second);
  return getSpatialReferenceWkid(first) === getSpatialReferenceWkid(second);
}

function getSpatialReferenceWkid(spatialReference) {
  return Number(spatialReference?.latestWkid || spatialReference?.wkid || 0);
}

async function queryParkNamesByGeometry(layer, nameField, geometry) {
  const query = layer.createQuery();
  query.where = "1=1";
  query.geometry = geometry;
  query.spatialRelationship = "intersects";
  query.returnGeometry = false;
  query.outFields = [nameField];

  const results = await layer.queryFeatures(query);
  const names = new Set();
  for (const park of results.features || []) {
    const name = safeText(park.attributes?.[nameField], "").trim();
    if (name) names.add(name);
  }
  return [...names];
}

async function fetchAlertZoneGeometries(zoneUrls) {
  const urls = Array.isArray(zoneUrls)
    ? [...new Set(zoneUrls.filter((url) => typeof url === "string" && url.startsWith("https://")))]
    : [];
  const limit = Math.max(1, Number(CONFIG.alertImpacts?.maxAffectedZonesToFetch) || 50);
  const concurrency = Math.max(1, Number(CONFIG.alertImpacts?.zoneFetchConcurrency) || 6);
  const results = await mapWithConcurrency(
    urls.slice(0, limit),
    concurrency,
    fetchCachedAlertZoneGeometries
  );
  return results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
}

function fetchCachedAlertZoneGeometries(url) {
  if (!state.nwsZoneGeometryCache.has(url)) {
    const request = fetchJson(url)
      .then((data) => geoJsonToArcGISPolygons(data?.geometry))
      .catch((error) => {
        console.warn(`NWS zone geometry could not be loaded: ${url}`, error);
        return [];
      });
    state.nwsZoneGeometryCache.set(url, request);
  }
  return state.nwsZoneGeometryCache.get(url);
}

function geoJsonToArcGISPolygons(geometry) {
  if (!geometry || !state.modules.Polygon) return [];
  const { Polygon } = state.modules;
  const spatialReference = { wkid: 4326 };

  const makePolygon = (rings) => {
    if (!Array.isArray(rings) || !rings.length) return null;
    const normalizedRings = rings
      .map((ring, index) => normalizeGeoJsonRing(ring, index === 0))
      .filter(Boolean);
    if (!normalizedRings.length) return null;
    return new Polygon({ rings: normalizedRings, spatialReference });
  };

  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    const polygon = makePolygon(geometry.coordinates);
    return polygon ? [polygon] : [];
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.map(makePolygon).filter(Boolean);
  }
  if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
    return geometry.geometries.flatMap(geoJsonToArcGISPolygons);
  }
  return [];
}

function normalizeGeoJsonRing(ring, isExterior) {
  if (!Array.isArray(ring)) return null;
  const coordinates = ring
    .filter((coordinate) => Array.isArray(coordinate) && Number.isFinite(Number(coordinate[0])) && Number.isFinite(Number(coordinate[1])))
    .map((coordinate) => [Number(coordinate[0]), Number(coordinate[1])]);
  if (coordinates.length < 3) return null;

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coordinates.push([...first]);
  if (coordinates.length < 4) return null;

  // GeoJSON and ArcGIS use opposite ring-orientation conventions. ArcGIS
  // expects exterior rings clockwise and holes counterclockwise.
  const isCounterClockwise = signedRingArea(coordinates) > 0;
  const shouldBeCounterClockwise = !isExterior;
  if (isCounterClockwise !== shouldBeCounterClockwise) coordinates.reverse();
  return coordinates;
}

function signedRingArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    area += (x1 * y2) - (x2 * y1);
  }
  return area / 2;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(items.length, Math.max(1, Number(concurrency) || 1));

  async function runWorker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      try {
        results[index] = { status: "fulfilled", value: await worker(items[index], index) };
      } catch (error) {
        results[index] = { status: "rejected", reason: error };
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

function resolveParkNameField(layer) {
  const configured = CONFIG.alertImpacts?.parkNameField || CONFIG.parkBoundaries?.nameField;
  if (configured && layer.fields?.some((field) => field.name === configured)) return configured;
  const preferredNames = ["UNITNAME", "PARK_NAME", "PARKNAME", "NAME"];
  for (const candidate of preferredNames) {
    const match = layer.fields?.find((field) => field.name.toUpperCase() === candidate);
    if (match) return match.name;
  }
  return layer.displayField || null;
}

function getNwsHazardColor(eventName) {
  const configured = CONFIG.weather?.hazardColors || {};
  const exact = configured[eventName] || DEFAULT_NWS_HAZARD_COLORS[eventName];
  if (exact) return exact;
  const normalized = normalize(eventName);
  const key = Object.keys({ ...DEFAULT_NWS_HAZARD_COLORS, ...configured }).find((name) => normalize(name) === normalized);
  return key ? (configured[key] || DEFAULT_NWS_HAZARD_COLORS[key]) : "#708090";
}

function hexToRgb(hex) {
  const normalizedHex = String(hex || "#708090").replace("#", "").trim();
  const expanded = normalizedHex.length === 3 ? normalizedHex.split("").map((value) => value + value).join("") : normalizedHex;
  const parsed = Number.parseInt(expanded, 16);
  if (!Number.isFinite(parsed)) return [112, 128, 144];
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

function getAlertUrl(feature) {
  const candidates = [feature?.id, feature?.properties?.["@id"], feature?.properties?.id];
  return candidates.find((value) => typeof value === "string" && value.startsWith("https://")) || "";
}

async function refreshAllData() {
  dom.refreshButton.disabled = true;
  dom.refreshButton.setAttribute("aria-busy", "true");
  announce("Refreshing prescribed fire and weather data.");
  try {
    const tasks = [loadFireWeatherAlerts()];
    if (!state.isDemo || state.sourceLayer || CONFIG.prescribedBurns.serviceUrl) tasks.push(loadUnitsSafely());
    if (selectedUnit()) tasks.push(refreshSelectedUnitForecast());
    await Promise.allSettled(tasks);
    renderAll();
    updateRefreshTimestamp();
    announce("Data refresh complete.");
  } catch (error) {
    console.error(error);
    announce("The data refresh did not complete.");
  } finally {
    dom.refreshButton.disabled = false;
    dom.refreshButton.removeAttribute("aria-busy");
  }
}

function setWeatherLoading(isLoading, message) {
  dom.weatherLoading.textContent = message;
  dom.weatherLoading.setAttribute("aria-busy", String(isLoading));
}

function updateRefreshTimestamp() {
  const now = new Date();
  dom.lastUpdated.dateTime = now.toISOString();
  dom.lastUpdated.textContent = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }).format(now);
}

async function fetchJson(url, signal) {
  const timeoutController = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, CONFIG.weather.requestTimeoutMs);
  const combinedController = new AbortController();
  const abortCombined = () => combinedController.abort();
  timeoutController.signal.addEventListener("abort", abortCombined, { once: true });
  signal?.addEventListener("abort", abortCombined, { once: true });
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/geo+json, application/json" },
      cache: "no-store",
      signal: combinedController.signal
    });
    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = body?.detail || body?.title || body?.message || "";
      } catch {
        // The status code is still sufficient when no JSON error body exists.
      }
      throw new Error(`NWS request failed with status ${response.status}${detail ? `: ${detail}` : "."}`);
    }
    return await response.json();
  } catch (error) {
    if (timedOut && error?.name === "AbortError") {
      throw new Error(`The National Weather Service request timed out after ${Math.round(CONFIG.weather.requestTimeoutMs / 1000)} seconds.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    timeoutController.signal.removeEventListener("abort", abortCombined);
    signal?.removeEventListener("abort", abortCombined);
  }
}

function rectangleGeometry(centerLon, centerLat, widthDegrees, heightDegrees) {
  const halfW = widthDegrees / 2;
  const halfH = heightDegrees / 2;
  return {
    rings: [[
      [centerLon - halfW, centerLat - halfH],
      [centerLon + halfW, centerLat - halfH],
      [centerLon + halfW, centerLat + halfH],
      [centerLon - halfW, centerLat + halfH],
      [centerLon - halfW, centerLat - halfH]
    ]],
    spatialReference: { wkid: 4326 }
  };
}

function squareGeometryFromCenter(longitude, latitude, acres) {
  const sideMeters = Math.sqrt(acres * 4046.8564224);
  const halfLat = (sideMeters / 2) / 111320;
  const halfLon = (sideMeters / 2) / (111320 * Math.cos(latitude * Math.PI / 180));
  return rectangleGeometry(longitude, latitude, halfLon * 2, halfLat * 2);
}

function calculateGeometryAcres(geometry) {
  if (!geometry) return 0;
  try {
    const polygon = geometry.type ? geometry : new state.modules.Polygon(geometry);
    const area = state.modules.geometryEngine?.geodesicArea(polygon, "acres");
    if (Number.isFinite(area)) return Math.abs(area);
  } catch {
    // Fall through to an approximate local projection calculation.
  }

  const json = geometry.toJSON ? geometry.toJSON() : geometry;
  const ring = json.rings?.[0] || [];
  if (ring.length < 3) return 0;
  const meanLat = ring.reduce((sum, coordinate) => sum + coordinate[1], 0) / ring.length;
  const metersPerLon = 111320 * Math.cos(meanLat * Math.PI / 180);
  const metersPerLat = 111320;
  let twiceArea = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    twiceArea += (x1 * metersPerLon) * (y2 * metersPerLat) - (x2 * metersPerLon) * (y1 * metersPerLat);
  }
  return Math.abs(twiceArea / 2) / 4046.8564224;
}

function geometryCentroid(geometry) {
  if (!geometry) return { longitude: NaN, latitude: NaN };
  try {
    const polygon = geometry.type ? geometry : new state.modules.Polygon(geometry);
    const center = polygon.centroid || polygon.extent?.center;
    return geographicCoordinates(center);
  } catch (error) {
    console.warn("Could not calculate a geographic burn-unit center.", error);
    return { longitude: NaN, latitude: NaN };
  }
}

function geographicCoordinates(point) {
  if (!point) return { longitude: NaN, latitude: NaN };

  const directLongitude = Number(point.longitude);
  const directLatitude = Number(point.latitude);
  if (Number.isFinite(directLongitude) && Number.isFinite(directLatitude)
      && Math.abs(directLongitude) <= 180 && Math.abs(directLatitude) <= 90) {
    return { longitude: directLongitude, latitude: directLatitude };
  }

  let candidate = point;
  try {
    const spatialReference = point.spatialReference;
    if (spatialReference?.isWebMercator || [3857, 102100, 102113].includes(Number(spatialReference?.wkid))) {
      candidate = state.modules.webMercatorUtils.webMercatorToGeographic(point);
    }
  } catch (error) {
    console.warn("Web Mercator coordinate conversion failed.", error);
  }

  const longitude = Number(candidate?.longitude ?? candidate?.x);
  const latitude = Number(candidate?.latitude ?? candidate?.y);
  if (Number.isFinite(longitude) && Number.isFinite(latitude)
      && Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90) {
    return { longitude, latitude };
  }
  return { longitude: NaN, latitude: NaN };
}

function sectorGeometry(longitude, latitude, headingDegrees, spreadDegrees, distanceMiles) {
  const ring = [[longitude, latitude]];
  const start = headingDegrees - spreadDegrees;
  const end = headingDegrees + spreadDegrees;
  const steps = Math.max(12, Math.ceil((spreadDegrees * 2) / 4));
  for (let index = 0; index <= steps; index += 1) {
    const bearing = start + ((end - start) * index / steps);
    ring.push(destinationPoint(longitude, latitude, bearing, distanceMiles));
  }
  ring.push([longitude, latitude]);
  return { rings: [ring], spatialReference: { wkid: 4326 } };
}

function destinationPoint(longitude, latitude, bearingDegrees, distanceMiles) {
  const earthRadiusMiles = 3958.8;
  const angularDistance = distanceMiles / earthRadiusMiles;
  const bearing = bearingDegrees * Math.PI / 180;
  const lat1 = latitude * Math.PI / 180;
  const lon1 = longitude * Math.PI / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) + Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing));
  const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1), Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));
  return [lon2 * 180 / Math.PI, lat2 * 180 / Math.PI];
}

function pointSectorSeverity(point, unit, heading, spread, distanceMiles) {
  const distance = haversineMiles(unit.latitude, unit.longitude, point.latitude, point.longitude);
  if (distance > distanceMiles) return null;
  const bearing = bearingBetween(unit.latitude, unit.longitude, point.latitude, point.longitude);
  const delta = angularDifference(bearing, heading);
  if (delta > spread) return null;
  if (distance <= distanceMiles * 0.45 && delta <= Math.max(10, spread * 0.65)) return "Higher-potential area";
  return "Screening area";
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => value * Math.PI / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingBetween(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => value * Math.PI / 180;
  const toDegrees = (value) => value * 180 / Math.PI;
  const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) - Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(toRadians(lon2 - lon1));
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function angularDifference(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

function directionToDegrees(direction) {
  return { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }[direction] ?? 0;
}

function findUnitGraphic(id) {
  return state.layers.burn.graphics.find((graphic) => graphic.attributes?.unitId === id) || null;
}

function getUnit(id) {
  return state.units.find((unit) => unit.id === String(id)) || null;
}

function selectedUnit() {
  return state.selectedUnitId ? getUnit(state.selectedUnitId) : null;
}

function priorityRank(priority) {
  const value = normalize(priority);
  if (value.includes("high") || value.includes("urgent") || value.includes("critical")) return 0;
  if (value.includes("normal") || value.includes("medium") || value.includes("moderate")) return 1;
  if (value.includes("low")) return 2;
  return 9;
}

function setRadioValue(name, value) {
  const input = document.querySelector(`input[name="${name}"][value="${CSS.escape(value)}"]`);
  if (input) input.checked = true;
}

function getRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function parseWindNumber(value) {
  if (value == null || value === "") return NaN;
  if (typeof value === "object" && Number.isFinite(Number(value.value))) {
    const numeric = Number(value.value);
    return String(value.unitCode || "").includes("m_s-1") ? numeric * 2.23694 : numeric;
  }
  const matches = String(value).match(/-?\d+(?:\.\d+)?/g);
  if (!matches?.length) return NaN;
  const numbers = matches.map(Number).filter(Number.isFinite);
  return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
}

function formatWind(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  const numeric = Number(value.value);
  if (!Number.isFinite(numeric)) return "—";
  const unitCode = String(value.unitCode || "");
  if (unitCode.includes("m_s-1")) return `${Math.round(numeric * 2.23694)} mph`;
  return `${Math.round(numeric)} ${unitCode.split(":").pop() || ""}`.trim();
}

function formatRange(range) {
  if (!range || (range.min == null && range.max == null)) return "Not set";
  if (range.min != null && range.max != null) return `${range.min}–${range.max}`;
  if (range.min != null) return `≥ ${range.min}`;
  return `≤ ${range.max}`;
}

function relativeDateLabel(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDate(date);
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNullable(value, decimals = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  const places = Number.isInteger(decimals) ? Math.max(0, Math.min(decimals, 4)) : 1;
  return number.toLocaleString(undefined, {
    minimumFractionDigits: places,
    maximumFractionDigits: places
  });
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function safeText(value, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "Not listed";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(date);
}

function formatTime(value) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric" }).format(date);
}

function toDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatNumber(value, decimals = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(number);
}

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number)}%` : "—";
}

function capitalize(value) {
  const text = String(value || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function announce(message) {
  if (!dom.liveRegion) return;
  dom.liveRegion.textContent = "";
  window.setTimeout(() => { dom.liveRegion.textContent = message; }, 20);
}
