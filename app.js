const APP_CONFIG = window.SAFEROUTE_CONFIG || {};
const RAW_SCHOOLS = Array.isArray(window.NANTOU_SCHOOL_DATA) ? window.NANTOU_SCHOOL_DATA : [];
const FIXED_REFRESH_MS = 15000;
const CAMERA_FRAME_REFRESH_MS = 5000;
const CAMERA_LOOKUP_REFRESH_MS = 60000;
const GPS_SAMPLE_WINDOW_MS = 18000;
const GPS_NAV_RECALC_MS = 8000;
const GPS_NAV_MIN_MOVE_KM = 0.008;
const GPS_IDLE_MIN_MOVE_KM = 0.02;
const GPS_ARRIVAL_RADIUS_KM = 0.06;
const GPS_WARMUP_INTERVAL_MS = 3500;
const GPS_NAV_PULSE_INTERVAL_MS = 9000;
const GPS_IDLE_MAX_ACCURACY_M = 220;
const GPS_NAV_MAX_ACCURACY_M = 140;
const GPS_HARD_REJECT_ACCURACY_M = 650;
const GPS_IMPOSSIBLE_SPEED_KMH = 170;

const STAGE_LABELS = {
  all: "全部學制",
  kindergarten: "幼兒園",
  elementary: "國小",
  senior: "高中職",
  junior: "國中",
  university: "大學"
};

const STAGE_COLORS = {
  kindergarten: "#f59e0b",
  elementary: "#3c7cc4",
  senior: "#d45d30",
  junior: "#2f7f5f",
  university: "#7c3aed"
};

const COMMUTE = {
  walk: { label: "步行", speed: 4.6, risk: 4, buffer: 2 },
  bike: { label: "自行車", speed: 12, risk: 8, buffer: 1 },
  scooter: { label: "機車", speed: 26, risk: 13, buffer: 2 },
  car: { label: "開車", speed: 32, risk: 10, buffer: 3 },
  bus: { label: "公車", speed: 18, risk: 7, buffer: 7 }
};

const MODE = {
  safe: { label: "安全優先", risk: -6, time: 1.12 },
  fast: { label: "時間優先", risk: 6, time: 0.92 }
};

const COMMUTE_TUNING = {
  walk: { access: 3.5, min: 6, max: 95, turnCost: 0.34, peakCost: 0.45, hillCost: 0.85, uncertainty: 2.2, stageCost: 0.6 },
  bike: { access: 2.5, min: 5, max: 75, turnCost: 0.24, peakCost: 0.6, hillCost: 0.62, uncertainty: 2.4, stageCost: 0.42 },
  scooter: { access: 4, min: 5, max: 58, turnCost: 0.18, peakCost: 0.95, hillCost: 0.26, uncertainty: 2.8, stageCost: 0.25 },
  car: { access: 5, min: 4, max: 55, turnCost: 0.14, peakCost: 1.05, hillCost: 0.2, uncertainty: 2.6, stageCost: 0.22 },
  bus: { access: 8.5, min: 12, max: 92, turnCost: 0.08, peakCost: 1.18, hillCost: 0.22, uncertainty: 4.5, stageCost: 0.3, waitBase: 6 }
};

const ROUTE_STRATEGIES = {
  walk: {
    profile: "foot",
    source: "步行友善路網",
    safeSource: "步行安全優先路網",
    geometryBias: 0.72,
    distanceFactor: { safe: 1.08, fast: 1.01 },
    riskNote: "人行空間、路口穿越與照明"
  },
  bike: {
    profile: "bike",
    source: "自行車路網",
    safeSource: "自行車安全優先路網",
    geometryBias: 0.56,
    distanceFactor: { safe: 1.06, fast: 0.99 },
    riskNote: "坡度、轉彎與混合車流"
  },
  scooter: {
    profile: "motor_scooter",
    source: "機車道路路網",
    safeSource: "機車避開高風險路口路網",
    geometryBias: -0.34,
    distanceFactor: { safe: 1.04, fast: 0.98 },
    riskNote: "主要幹道、轉彎與車流速度"
  },
  car: {
    profile: "driving",
    source: "開車道路路網",
    safeSource: "開車校門接送路網",
    geometryBias: -0.58,
    distanceFactor: { safe: 1.03, fast: 0.97 },
    riskNote: "校門臨停、迴轉與尖峰車流"
  },
  bus: {
    profile: "driving",
    source: "公車接駁路網",
    safeSource: "公車步行接駁安全路網",
    geometryBias: 0.42,
    distanceFactor: { safe: 1.1, fast: 1.02 },
    riskNote: "步行到站、候車與下車後接駁"
  }
};

const TRANSIT_SEARCH = {
  originRadius: 1200,
  schoolRadius: 1200,
  maxStops: 12,
  maxRoutes: 12,
  maxCandidates: 6,
  cacheMs: 60 * 60 * 1000,
  staleCacheMs: 24 * 60 * 60 * 1000,
  endpoint: "https://overpass-api.de/api/interpreter"
};

const els = {};
[
  "heroSchoolCount", "heroHotspotCount", "heroAdviceMode", "liveModeLabel", "runningStateLabel",
  "hostWarningText", "refreshValue", "schoolSearch",
  "schoolSelect", "filterSummary", "commuteMode", "displayMode", "toggleRunButton",
  "manualRefreshButton", "locateMeButton", "clearLocationButton", "openNavigationButton", "openNavigationSecondaryButton", "locationStatusText",
  "locationPermissionText", "routeDistanceValue", "routeEstimateValue", "countdownValue",
  "schoolStageLabel", "schoolTownLabel", "schoolFocusText", "baseDataLabel", "liveDataLabel",
  "dataSyncLabel", "mapSchoolCount", "mapTownCount", "mapSelectedTown", "overviewStage",
  "lastUpdated", "countyMap", "detailMapSvg", "detailGroundLayer", "detailRoadBaseLayer",
  "detailCrosswalkLayer", "detailStreetLayer", "routeLayer", "incidentLayer", "cameraLayer",
  "schoolMarker", "schoolPulse", "schoolLabel", "detailScenePattern", "detailSceneHazard",
  "detailSceneCoverage", "overviewSchoolCount", "overviewMode", "overviewFrequency",
  "riskScore", "riskLevelText", "commuteTime", "routeModeText", "recentEvents",
  "weatherText", "weatherTemperature", "weatherRain", "weatherSummary", "weatherUpdated",
  "mapWeatherSummary", "mapWeatherTemperature", "mapWeatherRain", "mapNavigationOverlay", "mapModeNotice",
  "mapTransitPanel", "mapTransitStatus", "mapTransitRoute", "mapTransitStops", "mapTransitList", "mapTransitDetail",
  "mapNavStatus", "mapNavSpeed", "mapNavAccuracy", "mapNavHeading", "mapNavRemaining", "mapNavEta", "mapFollowButton",
  "mapLocateButton", "mapLocateLabel", "mapOrientationButton", "mapOrientationLabel", "mapControlStatus",
  "weatherRiskBadge", "weatherDecisionSummary", "weatherDecisionUpdated", "weatherDecisionTemp",
  "weatherDecisionRain", "weatherRiskText", "weatherRiskBars", "weatherAdviceTitle", "weatherAdviceText",
  "hotspots", "cameraText", "futureTrafficText", "factorText", "actionText",
  "alertMessage", "recommendedRoute", "riskSourceText", "safetyTag", "timeTag",
  "navigationModeTag", "navStartText", "navDestinationText", "navDistanceTimeText", "navigationStepList",
  "navLiveStatusText", "navProgressText", "navArrivalText",
  "stageAverageRisk", "stageSchoolCount", "stageFocusAction", "recentList",
  "selectedRiskBadge", "selectedSchoolMeta", "selectedSchoolName", "improvementText",
  "selectedSchoolAddress", "selectedSchoolPhone", "detailRouteName", "audienceText",
  "recommendationList", "incidentList", "monitorCongestion", "monitorWatchCount",
  "monitorTravelWindow", "cameraScreenA", "cameraScreenB", "cameraLinkA", "cameraLinkB",
  "cameraImageA", "cameraImageB", "cameraVideoA", "cameraVideoB", "cameraFallbackA", "cameraFallbackB", "cameraTitleA",
  "cameraMetaA", "cameraStatusA", "cameraTitleB", "cameraMetaB", "cameraStatusB",
  "trafficBars", "trafficFlowLabel", "routeLogicTitle", "routeLogicText", "routeReasonList",
  "aiRiskLevel", "aiRiskReason", "aiSuggestion", "safeRouteTime", "safeRouteDistance",
  "safeRouteRisk", "safeRouteReason", "fastRouteTime", "fastRouteDistance", "fastRouteRisk",
  "fastRouteReason",
  "stageSummaryGrid", "impactSchoolCount", "impactTownCount", "impactExposureValue", "impactEarlyValue", "impactDecisionValue",
  "demoModeButton", "demoStatusText", "demoSteps"
].forEach((id) => {
  els[id] = document.getElementById(id);
});

const schools = RAW_SCHOOLS
  .filter((school) => Number.isFinite(Number(school.lat)) && Number.isFinite(Number(school.lng)))
  .map((school, index) => ({
    ...school,
    id: school.id || `school-${index + 1}`,
    lat: Number(school.lat),
    lng: Number(school.lng),
    address: cleanAddress(school.address || ""),
    riskBase: getStableRisk(school)
  }));

const state = {
  selectedId: schools[0]?.id || null,
  stage: "all",
  query: "",
  commute: "walk",
  mode: "safe",
  refreshMs: FIXED_REFRESH_MS,
  running: true,
  remainingMs: FIXED_REFRESH_MS,
  userLocation: null,
  route: null,
  cameras: [],
  map: null,
  markers: new Map(),
  routeLine: null,
  userMarker: null,
  userAccuracyCircle: null,
  navigationActive: false,
  navigationArrived: false,
  navigationFollowUser: true,
  navigationLastRouteAt: 0,
  navigationLastDistanceKm: null,
  navigationLastRouteOrigin: null,
  navigationStartedAt: 0,
  navigationSpeedKmh: null,
  navigationHeading: null,
  deviceHeading: null,
  mapOrientation: "north",
  orientationListening: false,
  focusLocationWhenReady: false,
  mapFocusUserRequested: false,
  mapControlStatusTimer: null,
  locationLastAcceptedAt: 0,
  wakeLock: null,
  timers: [],
  locationWatchId: null,
  locationRefineTimer: null,
  locationWarmupTimer: null,
  locationSamples: [],
  cameraLastUpdated: 0,
  cameraCacheKey: "",
  cameraLookupInFlight: false,
  cameraPlayers: [null, null],
  cameraFrameVersion: 0,
  updateInFlight: false,
  pendingUpdate: false,
  pendingForceCamera: false,
  routeRequestId: 0,
  weatherCache: new Map(),
  transitPlan: null,
  selectedTransitCandidateIndex: 0,
  transitCache: new Map(),
  transitRequestId: 0,
  transitRequestKey: "",
  transitTimeoutId: null,
  demoMode: false,
  demoStep: 0,
  demoTimerId: null,
  transitMarkers: []
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  if (!schools.length) {
    showFatal("找不到可用的學校資料。");
    return;
  }

  if (location.protocol === "file:" && els.hostWarningText) {
    els.hostWarningText.hidden = false;
  }

  repairStaticChineseText();
  applyDeviceMode();
  window.addEventListener("resize", applyDeviceMode, { passive: true });
  window.addEventListener("orientationchange", applyDeviceMode);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  bindEvents();
  setupMobileNavigation();
  initMap();
  renderStageSummary();
  renderSchoolOptions();
  selectSchool(state.selectedId);
  startTimers();
  setupLocalAutoReload();
  registerPwaRuntime();
}

function detectMobileWeb() {
  return window.matchMedia("(max-width: 860px)").matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function detectIosWeb() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function detectStandaloneWeb() {
  return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

function applyDeviceMode() {
  const mobile = detectMobileWeb();
  const ios = detectIosWeb();
  const standalone = detectStandaloneWeb();
  document.body.dataset.device = mobile ? "mobile" : "desktop";
  document.body.dataset.platform = ios ? "ios" : "web";
  document.body.dataset.displayMode = standalone ? "standalone" : "browser";
  document.body.classList.toggle("is-mobile-web", mobile);
  document.body.classList.toggle("is-desktop-web", !mobile);
  document.body.classList.toggle("is-ios-web", ios);
  document.body.classList.toggle("is-standalone-web", standalone);
  document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);

  if (!state.userLocation && els.locationStatusText && window.isSecureContext) {
    setText(
      "locationStatusText",
      mobile
        ? "可在手機上點選定位，允許後會持續微調座標並重算路線。"
        : "可開啟定位，系統會依你的目前位置重算路線。"
    );
  }
}

function registerPwaRuntime() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.getRegistrations?.()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .then(() => caches?.keys?.())
    .then((keys) => Promise.all((keys || []).map((key) => caches.delete(key))))
    .catch(() => {});
}

function repairStaticChineseText() {
  document.title = "SafeRoute NT：用 AI 幫南投學生找到更安全的通學路線";

  const set = (selector, value) => {
    const node = document.getElementById(selector) || document.querySelector(selector);
    if (node) node.textContent = value;
  };
  const setHtml = (selector, value) => {
    const node = document.getElementById(selector) || document.querySelector(selector);
    if (node) node.innerHTML = value;
  };
  const setAll = (selector, values) => {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (values[index] !== undefined) node.textContent = values[index];
    });
  };
  const setLeadingAll = (selector, values) => {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (values[index] === undefined) return;
      const first = node.firstChild;
      if (first && first.nodeType === Node.TEXT_NODE) {
        first.nodeValue = values[index];
      } else {
        node.insertBefore(document.createTextNode(values[index]), first || null);
      }
    });
  };
  const setTrailingAll = (selector, values) => {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (values[index] === undefined) return;
      const textNode = Array.from(node.childNodes).reverse().find((child) => child.nodeType === Node.TEXT_NODE);
      if (textNode) textNode.nodeValue = values[index];
      else node.appendChild(document.createTextNode(values[index]));
    });
  };

  setHtml(".brand-block h1", 'SafeRoute NT：用 AI<span class="mobile-title-break"> 幫南投學生找到更安全的通學路線</span>');
  set(".hero-subtitle", "整合學校位置、通學方式、路線風險、時段變化與公開交通影像，協助學生、家長與學校判斷每日通學安全。");
  setAll(".summary-pill span", ["學校", "熱點", "模式"]);
  set("heroAdviceMode", "安全優先");
  set("liveModeLabel", "即時分流更新");
  set("runningStateLabel", "自動更新中");

  set(".mobile-menu-copy span", "功能選單");
  set("mobileMenuLabel", "地圖");
  const tabLabels = { map: "地圖", insight: "洞察", controls: "地圖設定", monitor: "監視", info: "資料" };
  document.querySelectorAll(".mobile-tabbar__link").forEach((link) => {
    const label = tabLabels[link.dataset.mobilePage] || link.textContent.trim();
    link.dataset.mobileLabel = label;
    const textNode = link.querySelector(":scope > span:last-child");
    if (textNode) textNode.textContent = label;
  });
  const mobileNav = document.getElementById("mobilePageMenu");
  if (mobileNav) mobileNav.setAttribute("aria-label", "手機頁面導覽");

  set("#mobileControlsSection .panel-title-row h2", "路線設定");
  set("hostWarningText", "若直接用檔案開啟，定位與部分即時資料可能無法使用；建議使用 HTTPS 或本機伺服器瀏覽。");
  const stageLabels = { all: "全部", kindergarten: "幼兒園", elementary: "國小", junior: "國中", senior: "高中職", university: "大學" };
  document.querySelectorAll(".stage-button").forEach((button) => {
    button.textContent = stageLabels[button.dataset.stage] || button.textContent;
  });
  set("#mobileControlsSection > label.field:nth-of-type(1) span", "搜尋學校");
  const search = document.getElementById("schoolSearch");
  if (search) search.placeholder = "輸入學校、鄉鎮或地址";
  set("#mobileControlsSection > label.field:nth-of-type(2) span", "選擇學校");
  set("filterSummary", "正在載入學校資料");
  set("#mobileControlsSection .field-grid label:nth-child(1) span", "通學方式");
  set("#mobileControlsSection .field-grid label:nth-child(2) span", "路線模式");
  const optionLabels = { walk: "步行", bike: "自行車", scooter: "機車", car: "開車", bus: "公車", safe: "安全優先", fast: "時間優先" };
  document.querySelectorAll("option").forEach((option) => {
    if (optionLabels[option.value]) option.textContent = optionLabels[option.value];
  });
  set("toggleRunButton", "暫停更新");
  set("manualRefreshButton", "立即更新");
  set("locateMeButton", "取得我的定位");
  set("clearLocationButton", "清除定位");
  set("openNavigationButton", "啟用站內導航");
  set("locationStatusText", "尚未使用定位，會先以學校周邊基準路徑估算。");
  setAll(".location-summary .location-item span", ["定位", "距離", "時間"]);
  set("locationPermissionText", "尚未授權");
  set("routeDistanceValue", "等待定位");
  set("routeEstimateValue", "等待定位");
  set(".refresh-box span", "統計更新頻率");
  set("refreshValue", "15 秒");
  set(".countdown-block span", "下次更新");
  set("countdownValue", "15.0 秒");
  set(".school-profile .section-label", "學校資訊");
  set("schoolStageLabel", "尚未選定");
  set("schoolFocusText", "正在整理選定學校的通學安全資訊。");
  set(".data-policy .section-label", "資料狀態");
  setAll(".data-policy .policy-item strong", ["學校", "影像", "路線"]);
  set("baseDataLabel", "南投縣學校資料");
  set("liveDataLabel", "公開交通影像");
  set("dataSyncLabel", "地圖路線同步");

  set(".map-header h2", "南投學校地圖");
  set(".map-header p", "顯示南投各級學校位置、即時路線與通學安全判斷。");
  set("lastUpdated", "尚未更新");
  setLeadingAll(".map-chip", ["學校 ", "鄉鎮 ", "目前 ", "學制 "]);
  set("overviewStage", "全部學制");
  set(".mobile-weather-info-card span", "選定學校天氣");
  set("mapWeatherSummary", "天氣載入中");
  setTrailingAll(".mobile-weather-stats span", [" 溫度", " 降雨"]);
  const countyMap = document.getElementById("countyMap");
  if (countyMap) countyMap.setAttribute("aria-label", "南投縣學校互動地圖");
  setHtml(".map-legend", `
    <div class="legend-item"><span class="legend-swatch school-senior"></span>高中職</div>
    <div class="legend-item"><span class="legend-swatch school-junior"></span>國中</div>
    <div class="legend-item"><span class="legend-swatch school-elementary"></span>國小</div>
    <div class="legend-item"><span class="legend-swatch school-kindergarten"></span>幼兒園</div>
    <div class="legend-item"><span class="legend-swatch school-university"></span>大學</div>
    <div class="legend-item"><span class="legend-swatch school-selected"></span>選定學校</div>
  `);

  set("#mobileInsightSection .panel-title-row h2", "即時洞察");
  setAll("#mobileInsightSection .metric-card p", ["風險", "時間", "事件", "監看"]);
  set("riskLevelText", "載入中");
  set("commuteTime", "等待資料");
  set("routeModeText", "等待路線");
  set("weatherText", "載入中");
  set("cameraText", "等待影像");
  setAll("#mobileInsightSection .mini-card p", ["時段", "主要因素"]);
  set("actionText", "載入中");
  set("#mobileInsightSection .alert-card .section-label", "安全判斷");
  set("alertMessage", "正在整理選定學校的通學風險。");
  set(".weather-card .section-label", "選定學校天氣");
  setLeadingAll(".weather-grid span", ["溫度 ", "降雨 ", "概況 "]);
  set("weatherUpdated", "Open-Meteo 即時天氣資料載入中");
  set(".route-card .section-label", "建議路線");
  set("recommendedRoute", "等待路線資料");
  set("riskSourceText", "開啟定位後可依你的目前位置重算。");
  set("safetyTag", "安全判斷");
  set("timeTag", "等待時間");
  set(".in-app-navigation-card .section-label", "站內安全導航");
  setAll(".navigation-summary-grid span", ["起點", "目的地", "距離 / 時間"]);
  set("navStartText", "校區周邊");
  set("navDestinationText", "--");
  set("navDistanceTimeText", "--");
  set("navLiveStatusText", "尚未啟用即時追蹤");
  set("navProgressText", "等待定位");
  set("navArrivalText", "抵達後自動停止追蹤");
  set("openNavigationSecondaryButton", "在地圖中顯示路線");
  setAll(".integration-card p", ["學制平均風險", "學校數", "改善重點"]);
  set("stageFocusAction", "載入中");
  set(".panel-title-row.minor h2", "路線動態");

  set(".weather-decision-panel h2", "天氣安全資訊卡");
  setAll(".weather-hero-grid span", ["目前天氣", "溫度", "降雨"]);
  set("weatherDecisionSummary", "天氣載入中");
  set("weatherDecisionUpdated", "Open-Meteo 即時資料");
  setAll(".weather-hero-grid small", ["選定學校周邊", "影響通學體感", "影響煞車與視線"]);
  set(".weather-chart-card .section-label", "未來 4 小時天氣風險");
  set("weatherRiskText", "載入中");
  set("weatherAdviceTitle", "天氣建議");
  set("weatherAdviceText", "系統會依溫度、降雨與時段更新通學安全建議。");
  set(".detail-map-panel h2", "學校周邊動線");
  set("selectedRiskBadge", "分析中");
  const detailSvg = document.getElementById("detailMapSvg");
  if (detailSvg) detailSvg.setAttribute("aria-label", "學校周邊動線示意");
  set("schoolLabel", "學校");
  setAll(".detail-scene-strip span", ["動線", "風險", "覆蓋"]);
  set("detailScenePattern", "等待定位");
  set("detailSceneHazard", "等待分析");
  set("detailSceneCoverage", "等待影像");
  set(".school-detail-panel h2", "學校資料");
  setAll(".detail-highlight span", ["選定學校", "建議策略"]);
  set("selectedSchoolName", "尚未選定");
  set("improvementText", "載入中");
  setAll(".school-meta-grid .meta-item span", ["地址", "電話", "路線距離", "使用者"]);
  setAll(".detail-summary-grid .detail-card .section-label", ["安全建議", "風險提醒"]);

  set(".traffic-monitor-panel h2", "路口公開影像");
  setAll(".monitor-stat span", ["時段", "影像", "時間"]);
  set("monitorCongestion", "載入中");
  set("monitorTravelWindow", "載入中");
  setAll(".camera-placeholder strong", ["等待可用影像", "等待可用影像"]);
  setAll(".camera-placeholder span", ["若附近無公開影像，系統會顯示資料狀態。", "若附近無公開影像，系統會顯示資料狀態。"]);
  setAll(".camera-fallback strong", ["等待可用影像", "等待可用影像"]);
  setAll(".camera-fallback span", ["若附近無公開影像，系統會顯示資料狀態。", "若附近無公開影像，系統會顯示資料狀態。"]);
  set("cameraTitleA", "等待影像");
  set("cameraTitleB", "等待影像");
  set("cameraStatusA", "尚未載入");
  set("cameraStatusB", "尚未載入");
  set(".traffic-bars-card .section-label", "未來車流推估");
  set(".route-logic-card .section-label", "即時交通推估");
  set("trafficFlowLabel", "載入中");
  set("routeLogicTitle", "路線邏輯說明");
  set("routeLogicText", "系統會整合距離、通學方式、時段、天氣與路口複雜度估算風險。");

  set(".stage-summary-panel h2", "學制總覽");
  set(".pain-points-panel h2", "南投通學痛點");
  setAll(".pain-list article strong", ["山城地形", "缺少數據輔助", "學校難掌握", "最快不等於安全"]);
  setAll(".pain-list article span", [
    "南投地形多山，通學可能受山路、彎道、車流與天候影響。",
    "家長多靠經驗判斷路線安全，缺少即時數據輔助。",
    "學校難以掌握周邊通學熱點與高風險路段。",
    "一般導航多以最快路線為主，不一定最安全。"
  ]);
  set(".ai-assistant-panel h2", "AI 安全判斷助手");
  set(".ai-assistant-panel span:not(.panel-badge)", "目前風險");
  set("aiRiskLevel", "載入中");
  set("aiRiskReason", "系統會依選定學校、通學方式、路線、天氣與時段分析主要風險。");
  set("aiSuggestion", "建議會依即時條件更新，例如提早出門、避開主要車流路口或改走較安全路線。");
  set(".route-compare-panel h2", "安全路線 vs 最快路線");
  setAll(".route-compare-grid article p", ["安全路線", "最快路線"]);
  set("safeRouteReason", "優先降低路口與車流風險。");
  set("fastRouteReason", "時間較短，但可能增加通學風險。");
  set(".compare-note", "本平台不是取代 Google Maps，而是補上通學安全判斷。");
  set(".data-model-panel h2", "資料來源與模型邏輯");
  setAll(".data-source-list span", ["南投縣學校資料", "地圖路網資料", "公開交通影像或路口監視器資訊", "使用者定位資料", "時段與通學方式參數"]);
  set(".formula-text", "風險分數 = 車流風險 + 路口複雜度 + 距離時間 + 監看覆蓋 + 時段風險");
  set(".data-model-panel strong", "展示定位");
  set(".data-model-panel .source-note span", "作品以可解釋模型呈現，讓學生、家長與學校理解每次通學建議的原因。");
  set(".award-strategy-panel h2", "黑客松展示亮點");
  setAll(".award-strategy-panel article strong", ["站內即時導航", "不只是最快", "可展示可驗證", "可持續擴充"]);
  setAll(".award-strategy-panel article span", [
    "在網站內顯示路線、剩餘距離與定位狀態，不外開其他地圖。",
    "補上最快路線沒有處理的通學安全、時段與天候判斷。",
    "整合學校、地圖、天氣與公開影像，展示流程完整。",
    "未來可串接更多路口影像、事故資料與學校回報。"
  ]);
  set(".impact-panel h2", "預期效益");
  setAll(".impact-grid span", ["南投學校與幼兒園資料", "涵蓋主要鄉鎮", "公開影像快速更新", "核心資料維度"]);
  set(".impact-grid article:nth-child(3) strong", "5 秒");
  setAll(".outcome-grid span", ["高風險路口暴露可降低", "雨天/尖峰提早出門建議", "學生、家長、學校共同決策"]);
  set(".impact-note", "這不是只做漂亮頁面，而是把定位、學校資料、天氣、路線與安全風險邏輯串成可展示的通學安全平台。");
  set(".demo-flow-panel h2", "3 分鐘 Demo 流程");
  set("demoModeButton", "啟動評審模式");
  set("demoStatusText", "依照 10 分鐘簡報節奏快速展示核心價值。");
  setHtml(".demo-steps", `
    <li><strong>30 秒</strong>說明南投通學痛點，為什麼最快路線不等於最安全。</li>
    <li><strong>60 秒</strong>選定學校，展示天氣、風險、監看與路線建議。</li>
    <li><strong>60 秒</strong>切換安全路線與最快路線，說明 AI 判斷原因。</li>
    <li><strong>30 秒</strong>收斂到可擴充資料來源與對學校、家長的實際價值。</li>
  `);
  set(".sdg-panel h2", "SDGs 與社會影響");
  setAll(".sdg-grid article span", [
    "降低通學事故風險，支持健康與福祉。",
    "讓學生能更安全地抵達學校。",
    "提升山城交通與校園周邊安全韌性。",
    "把天候變化納入每日通學決策。"
  ]);
}

function bindEvents() {
  document.querySelectorAll(".stage-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.stage = button.dataset.stage || "all";
      document.querySelectorAll(".stage-button").forEach((item) => item.classList.toggle("active", item === button));
      renderSchoolOptions();
      updateAll();
    });
  });

  els.schoolSearch?.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderSchoolOptions();
    updateAll();
  });

  els.schoolSelect?.addEventListener("change", (event) => selectSchool(event.target.value));
  els.commuteMode?.addEventListener("change", async (event) => {
    state.commute = event.target.value;
    state.route = null;
    state.transitPlan = null;
    updateAll();
    if (isValidLatLng(state.userLocation)) {
      await fetchRoute();
      updateAll();
    }
  });
  els.displayMode?.addEventListener("change", async (event) => {
    state.mode = event.target.value;
    state.route = null;
    updateAll();
    if (isValidLatLng(state.userLocation)) {
      await fetchRoute();
      updateAll();
    }
  });

  els.toggleRunButton?.addEventListener("click", () => {
    state.running = !state.running;
    els.toggleRunButton.textContent = state.running ? "暫停更新" : "繼續更新";
    els.runningStateLabel.textContent = state.running ? "自動更新中" : "已暫停更新";
  });

  els.manualRefreshButton?.addEventListener("click", () => {
    state.remainingMs = state.refreshMs;
    updateAll(true);
  });
  els.demoModeButton?.addEventListener("click", startJudgeDemoMode);
  els.locateMeButton?.addEventListener("click", requestLocation);
  els.openNavigationButton?.addEventListener("click", activateInAppNavigation);
  els.openNavigationSecondaryButton?.addEventListener("click", activateInAppNavigation);
  els.mapFollowButton?.addEventListener("click", () => {
    state.navigationFollowUser = !state.navigationFollowUser;
    updateAll();
  });
  els.mapLocateButton?.addEventListener("click", focusMapOnUser);
  els.mapOrientationButton?.addEventListener("click", toggleMapOrientation);
  els.mapTransitList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-transit-candidate]");
    if (!button) return;
    state.selectedTransitCandidateIndex = Number(button.dataset.transitCandidate) || 0;
    renderTransitPanel();
    renderTransitMarkers();
    if (state.commute === "bus" && isValidLatLng(state.userLocation)) {
      fetchRoute().then(() => updateAll()).catch(() => {});
    }
  });
  els.clearLocationButton?.addEventListener("click", () => {
    stopLocationTracking();
    state.userLocation = null;
    state.route = null;
    state.transitPlan = null;
    state.selectedTransitCandidateIndex = 0;
    state.navigationSpeedKmh = null;
    state.navigationHeading = null;
    state.navigationFollowUser = true;
    state.navigationActive = false;
    state.navigationArrived = false;
    state.navigationLastRouteAt = 0;
    state.navigationLastDistanceKm = null;
    state.navigationLastRouteOrigin = null;
    state.navigationStartedAt = 0;
    state.locationLastAcceptedAt = 0;
    els.mapLocateButton?.classList.remove("is-active", "is-loading");
    setText("mapLocateLabel", "我的位置");
    setText("locationPermissionText", "已清除");
    setText("locationStatusText", "已清除定位，改用學校周邊基準估算。");
    updateAll();
  });
}

function setupMobileNavigation() {
  const menu = document.getElementById("mobilePageMenu");
  const button = document.getElementById("mobileMenuButton");
  const label = document.getElementById("mobileMenuLabel");
  const links = Array.from(document.querySelectorAll(".mobile-tabbar__link[data-mobile-section]"));
  if (!links.length) return;

  const pageBySection = {
    mobileMapSection: "map",
    mobileInsightSection: "insight",
    mobileControlsSection: "controls",
    mobileMonitorSection: "monitor",
    mobileInfoSection: "info"
  };
  const labelByPage = {
    map: "地圖",
    insight: "分析",
    controls: "地圖設定",
    monitor: "監看",
    info: "展示"
  };

  links.forEach((link) => {
    const sectionId = link.dataset.mobileSection || (link.getAttribute("href") || "").replace("#", "");
    const page = link.dataset.mobilePage || pageBySection[sectionId] || "map";
    link.dataset.mobileSection = sectionId;
    link.dataset.mobilePage = page;
    link.dataset.mobileLabel = link.dataset.mobileLabel || labelByPage[page] || link.textContent.trim();
  });

  const setActivePage = (page, shouldScroll = true) => {
    const activePage = page || "map";
    document.body.dataset.mobilePage = activePage;

    links.forEach((link) => {
      const active = link.dataset.mobilePage === activePage;
      link.classList.toggle("active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const activeLink = links.find((link) => link.dataset.mobilePage === activePage);
    const section = activeLink ? document.getElementById(activeLink.dataset.mobileSection || "") : null;
    if (label) label.textContent = activeLink?.dataset.mobileLabel || labelByPage[activePage] || "地圖";
    button?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-menu-open");

    if (shouldScroll && section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    if (activePage === "map" || activePage === "controls") window.setTimeout(() => state.map?.invalidateSize(), 280);
  };

  button?.addEventListener("click", () => {
    const open = !document.body.classList.contains("mobile-menu-open");
    document.body.classList.toggle("mobile-menu-open", open);
    button.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("mobile-menu-open")) return;
    if (menu?.contains(event.target) || button?.contains(event.target)) return;
    document.body.classList.remove("mobile-menu-open");
    button?.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.body.classList.remove("mobile-menu-open");
    button?.setAttribute("aria-expanded", "false");
  });

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setActivePage(link.dataset.mobilePage || "map");
    });
  });

  setActivePage(document.body.dataset.mobilePage || "map", false);
}

function initMap() {
  if (!els.countyMap || !window.L) return;

  state.map = L.map(els.countyMap, {
    zoomControl: true,
    attributionControl: true,
    rotate: true,
    bearing: 0,
    rotateControl: false,
    shiftKeyRotate: false,
    touchRotate: false
  }).setView([23.85, 120.9], 10);

  L.tileLayer(APP_CONFIG.tileUrl || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: APP_CONFIG.tileAttribution || "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(state.map);

  setTimeout(() => state.map?.invalidateSize(), 150);
}

async function focusMapOnUser() {
  state.navigationFollowUser = true;
  state.mapFocusUserRequested = true;
  if (isValidLatLng(state.userLocation)) {
    centerMapOnUser();
    els.mapLocateButton?.classList.add("is-active");
    setMapControlStatus(`已顯示目前位置，GPS 精度約 ${Math.round(Number(state.userLocation.accuracy) || 0)} 公尺`, "success");
    updateAll();
    return;
  }
  state.focusLocationWhenReady = true;
  els.mapLocateButton?.classList.add("is-loading");
  setText("mapLocateLabel", "定位中");
  setMapControlStatus("正在請求定位權限並搜尋目前位置…", "loading", 0);
  setText("locationStatusText", "正在取得定位，完成後會自動顯示你的所在位置。");
  await requestLocation({ keepTracking: state.navigationActive });
}

function centerMapOnUser() {
  if (!state.map || !isValidLatLng(state.userLocation)) return;
  state.map.setView(
    [state.userLocation.lat, state.userLocation.lng],
    Math.max(state.map.getZoom(), 16),
    { animate: true }
  );
}

async function toggleMapOrientation() {
  state.mapOrientation = state.mapOrientation === "north" ? "heading" : "north";
  if (state.mapOrientation === "heading") {
    await startDeviceOrientationTracking();
    if (!isValidLatLng(state.userLocation)) void requestLocation({ keepTracking: state.navigationActive });
  }
  applyMapOrientation();
  const bearing = Number(state.map?.getBearing?.()) || 0;
  setMapControlStatus(
    state.mapOrientation === "north"
      ? "已切換為北朝上"
      : `已切換為方向朝上（目前 ${Math.round(bearing)}°）`,
    "success"
  );
}

async function startDeviceOrientationTracking() {
  if (state.orientationListening) return;
  try {
    if (typeof window.DeviceOrientationEvent?.requestPermission === "function") {
      const permission = await window.DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") return;
    }
    window.addEventListener("deviceorientationabsolute", handleDeviceOrientation, { passive: true });
    window.addEventListener("deviceorientation", handleDeviceOrientation, { passive: true });
    state.orientationListening = true;
  } catch {
    // GPS movement heading remains available if compass permission is unavailable.
  }
}

function handleDeviceOrientation(event) {
  let heading = Number(event.webkitCompassHeading);
  if (!Number.isFinite(heading) && event.absolute && hasFiniteValue(event.alpha)) {
    heading = 360 - Number(event.alpha);
  }
  if (!Number.isFinite(heading)) return;
  state.deviceHeading = smoothHeading(state.deviceHeading, normalizeDegrees(heading), 0.28);
  if (state.mapOrientation === "heading") applyMapOrientation();
}

function applyMapOrientation(context = null) {
  if (!state.map || typeof state.map.setBearing !== "function") return;
  const heading = getMapHeading(context);
  const hasHeading = Number.isFinite(heading);
  const bearing = state.mapOrientation === "heading" && hasHeading ? normalizeDegrees(heading) : 0;
  state.map.setBearing(bearing);
  if (els.mapOrientationButton) {
    const headingMode = state.mapOrientation === "heading";
    els.mapOrientationButton.classList.toggle("is-active", headingMode);
    els.mapOrientationButton.setAttribute("aria-pressed", String(headingMode));
    els.mapOrientationButton.setAttribute(
      "aria-label",
      headingMode
        ? "目前為使用者方向朝上，點擊切換為北朝上"
        : "目前為北朝上，點擊切換為使用者方向朝上"
    );
  }
  setText("mapOrientationLabel", state.mapOrientation === "north" ? "北朝上" : hasHeading ? "方向朝上" : "等待方向");
  const compass = els.mapOrientationButton?.querySelector(".map-compass-icon");
  if (compass) compass.style.transform = `rotate(${-bearing}deg)`;
}

function getMapHeading(context = null) {
  if (hasFiniteValue(state.deviceHeading)) return Number(state.deviceHeading);
  if (hasFiniteValue(state.navigationHeading)) return Number(state.navigationHeading);
  if (context) return getNavigationHeading(context);
  const school = getSelectedSchool();
  if (school && isValidLatLng(state.userLocation)) {
    return bearingDegrees(state.userLocation.lat, state.userLocation.lng, school.lat, school.lng);
  }
  const coordinates = state.route?.coordinates;
  if (Array.isArray(coordinates) && coordinates.length >= 2) {
    const [firstLng, firstLat] = coordinates[0];
    const [nextLng, nextLat] = coordinates[Math.min(1, coordinates.length - 1)];
    if ([firstLat, firstLng, nextLat, nextLng].every((value) => Number.isFinite(Number(value)))) {
      return bearingDegrees(firstLat, firstLng, nextLat, nextLng);
    }
  }
  return null;
}

function setMapControlStatus(message, kind = "", hideAfterMs = 3200) {
  if (!els.mapControlStatus) return;
  if (state.mapControlStatusTimer) clearTimeout(state.mapControlStatusTimer);
  state.mapControlStatusTimer = null;
  els.mapControlStatus.hidden = !message;
  els.mapControlStatus.textContent = message || "";
  els.mapControlStatus.className = `map-control-status${kind ? ` is-${kind}` : ""}`;
  if (message && hideAfterMs > 0) {
    state.mapControlStatusTimer = setTimeout(() => {
      if (els.mapControlStatus) els.mapControlStatus.hidden = true;
    }, hideAfterMs);
  }
}

function normalizeDegrees(value) {
  return ((Number(value) % 360) + 360) % 360;
}

function hasFiniteValue(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function smoothHeading(previous, next, weight) {
  if (!hasFiniteValue(previous)) return next;
  const previousRad = normalizeDegrees(previous) * Math.PI / 180;
  const nextRad = normalizeDegrees(next) * Math.PI / 180;
  const x = Math.cos(previousRad) * (1 - weight) + Math.cos(nextRad) * weight;
  const y = Math.sin(previousRad) * (1 - weight) + Math.sin(nextRad) * weight;
  return normalizeDegrees(Math.atan2(y, x) * 180 / Math.PI);
}

function renderSchoolOptions() {
  const filtered = getFilteredSchools();
  const townCount = new Set(filtered.map((school) => school.town)).size;
  const hotspotCount = filtered.filter((school) => school.riskBase >= 68).length;
  if (els.schoolSelect) {
    els.schoolSelect.innerHTML = filtered
      .map((school) => `<option value="${escapeHtml(school.id)}">${escapeHtml(school.name)} - ${escapeHtml(school.town)}</option>`)
      .join("");
  }

  if (!filtered.some((school) => school.id === state.selectedId)) {
    state.selectedId = filtered[0]?.id || schools[0].id;
  }
  if (els.schoolSelect) els.schoolSelect.value = state.selectedId;

  setText("filterSummary", `目前顯示 ${filtered.length} 所學校`);
  setText("heroHotspotCount", hotspotCount);
  setText("mapSchoolCount", filtered.length);
  setText("mapTownCount", townCount);
  setText("overviewSchoolCount", filtered.length);
  setText("overviewStage", STAGE_LABELS[state.stage] || "全部學制");
  renderMarkers(filtered);
}

function renderMarkers(filtered) {
  if (!state.map || !window.L) return;

  for (const [id, marker] of state.markers) {
    marker.remove();
    state.markers.delete(id);
  }

  filtered.forEach((school) => {
    const marker = L.circleMarker([school.lat, school.lng], {
      radius: school.id === state.selectedId ? 9 : 6,
      color: school.id === state.selectedId ? "#12243e" : "#ffffff",
      weight: school.id === state.selectedId ? 3 : 2,
      fillColor: STAGE_COLORS[school.stage] || "#3c7cc4",
      fillOpacity: 0.92
    }).addTo(state.map);

    marker.bindPopup(`<strong>${escapeHtml(school.name)}</strong><br>${escapeHtml(school.town)}<br>${escapeHtml(school.address)}`);
    marker.on("click", () => selectSchool(school.id));
    state.markers.set(school.id, marker);
  });
}

async function selectSchool(id) {
  state.selectedId = id || schools[0].id;
  if (els.schoolSelect) els.schoolSelect.value = state.selectedId;
  state.route = null;
  state.transitPlan = null;
  renderSchoolOptions();
  if (isValidLatLng(state.userLocation)) await fetchRoute();
  await updateAll();
  void refreshCameras(true);

  const school = getSelectedSchool();
  if (state.map && school) {
    state.map.setView([school.lat, school.lng], Math.max(state.map.getZoom(), 13), { animate: true });
  }
}

async function updateAll(forceCamera = false) {
  if (forceCamera) void refreshCameras(true);
  if (state.updateInFlight) {
    state.pendingUpdate = true;
    state.pendingForceCamera = state.pendingForceCamera || forceCamera;
    const pendingSchool = getSelectedSchool();
    if (pendingSchool) renderCoreViews(buildContext(pendingSchool));
    return;
  }

  state.updateInFlight = true;
  const school = getSelectedSchool();
  if (!school) {
    state.updateInFlight = false;
    return;
  }
  renderCoreViews(buildContext(school));

  try {
    await updateWeather(school);
    if (getSelectedSchool()?.id !== school.id) return;
    const shouldLoadTransitInBackground = state.commute === "bus";
    if (shouldLoadTransitInBackground) {
      if (!state.transitPlan || state.transitPlan.status !== "ready") {
        state.transitPlan = { status: isValidLatLng(state.userLocation) ? "loading" : "need-location" };
        renderTransitPanel();
        renderTransitMarkers();
      }
    } else {
      await updateTransitPlan(school);
    }
    const context = buildContext(school);
    renderCoreViews(context);
    if (shouldLoadTransitInBackground) {
      updateTransitPlan(school).then(() => {
        if (getSelectedSchool()?.id !== school.id || state.commute !== "bus") return;
        renderCoreViews(buildContext(school));
      }).catch(() => {});
    }

    renderCameras(context);

  setText("lastUpdated", `更新於 ${new Date().toLocaleTimeString("zh-TW", { hour12: false })}`);
  } finally {
    state.updateInFlight = false;
    if (state.pendingUpdate || state.pendingForceCamera) {
      const shouldForceCamera = state.pendingForceCamera;
      state.pendingUpdate = false;
      state.pendingForceCamera = false;
      updateAll(shouldForceCamera);
    }
  }
}

function renderCoreViews(context) {
  renderTopLevel(context);
  renderDetailMap(context);
  renderLists(context);
  renderTraffic(context);
  updateMapRoute(context);
}

function buildContext(school) {
  const commute = COMMUTE[state.commute] || COMMUTE.walk;
  const mode = MODE[state.mode] || MODE.safe;
  const timeBand = getTimeBand();
  const filtered = getFilteredSchools();
  const stageSchools = schools.filter((item) => item.stage === school.stage);
  const route = normalizeRoute(state.route || buildFallbackRoute(school), school);
  const distanceKm = route.distanceKm;
  const hillPenalty = getHillPenalty(school);
  const routeReliability = getRouteReliability(route);
  const weather = getSchoolWeather(school);
  const weatherRisk = getWeatherRisk(weather);
  const estimatedMinutes = estimateCommuteMinutes({
    school,
    commuteKey: state.commute,
    commute,
    modeKey: state.mode,
    mode,
    timeBand,
    route,
    distanceKm,
    hillPenalty,
    routeReliability,
    weatherRisk
  });
  const transitTiming = state.commute === "bus"
    ? estimateTransitCandidateTiming(getSelectedTransitCandidate(), { school, timeBand, weatherRisk })
    : null;
  const minutes = transitTiming?.totalMinutes || estimatedMinutes;
  const cameraCount = state.cameras.length;
  const risk = clamp(Math.round(school.riskBase + commute.risk + mode.risk + timeBand.risk + weatherRisk + hillPenalty * 1.8 + route.turns * 1.2 - cameraCount * 2), 18, 96);

  return {
    school,
    commute,
    mode,
    filtered,
    stageSchools,
    route,
    distanceKm,
    minutes,
    cameraCount,
    timeBand,
    weather,
    weatherRisk,
    risk,
    riskLabel: getRiskLabel(risk),
    factors: getFactors(school, commute, mode, timeBand, route, weather)
  };
}

function renderTopLevel(context) {
  const { school, commute, mode, filtered, stageSchools, route, risk, riskLabel, minutes, cameraCount, timeBand, weather } = context;
  const townCount = new Set(filtered.map((item) => item.town)).size;
  const averageRisk = Math.round(stageSchools.reduce((sum, item) => sum + item.riskBase, 0) / Math.max(stageSchools.length, 1));
  const hotspotCount = filtered.filter((item) => item.riskBase >= 68).length;
  const comparison = buildRouteComparison(context);

  setText("heroSchoolCount", schools.length);
  setText("impactSchoolCount", schools.length);
  setText("impactTownCount", new Set(schools.map((item) => item.town)).size);
  setText("heroHotspotCount", hotspotCount);
  setText("heroAdviceMode", mode.label);
  setText("schoolStageLabel", STAGE_LABELS[school.stage] || "學校");
  setText("schoolTownLabel", school.town);
  setText("schoolFocusText", `${school.name} 位於 ${school.town}，目前以 ${commute.label} 和 ${mode.label} 估算。`);
  setText("mapSchoolCount", filtered.length);
  setText("mapTownCount", townCount);
  setText("mapSelectedTown", school.town);
  setText("overviewStage", STAGE_LABELS[state.stage] || "全部學制");
  setText("overviewSchoolCount", filtered.length);
  setText("overviewMode", mode.label);
  setText("overviewFrequency", `即時 / ${Math.round(state.refreshMs / 1000)} 秒`);
  setText("riskScore", risk);
  setText("riskLevelText", riskLabel.text);
  setText("commuteTime", `${minutes} 分鐘`);
  setText("routeModeText", route.source);
  setText("recentEvents", context.factors.length);
  setText("weatherText", weather?.summary || timeBand.label);
  setText("weatherTemperature", weather ? `${Math.round(weather.temperature)}°C` : "--");
  setText("weatherRain", weather ? `${weather.precipitation.toFixed(1)} mm` : "--");
  setText("weatherSummary", weather?.summary || "天氣載入中");
  setText("weatherUpdated", weather?.updatedAt ? `更新 ${new Date(weather.updatedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}` : "Open-Meteo 即時天氣資料載入中");
  setText("mapWeatherTemperature", weather ? `${Math.round(weather.temperature)}°C` : "--");
  setText("mapWeatherRain", weather ? `${weather.precipitation.toFixed(1)} mm` : "--");
  setText("mapWeatherSummary", weather?.summary || "天氣載入中");
  setText("weatherRiskBadge", context.weatherRisk > 7 ? "Weather High" : context.weatherRisk > 0 ? "Weather Watch" : "Weather");
  setText("weatherDecisionSummary", weather?.summary || "天氣載入中");
  setText("weatherDecisionUpdated", weather?.updatedAt ? `更新 ${new Date(weather.updatedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}` : "Open-Meteo 即時資料");
  setText("weatherDecisionTemp", weather ? `${Math.round(weather.temperature)}°C` : "--");
  setText("weatherDecisionRain", weather ? `${weather.precipitation.toFixed(1)} mm` : "--");
  setText("weatherRiskText", getWeatherRiskText(context));
  setText("weatherAdviceTitle", context.weatherRisk > 0 ? "天候提高通學風險" : "天候穩定，維持路線判斷");
  setText("weatherAdviceText", makeWeatherAdvice(context));
  renderWeatherRiskBars(context);
  setText("hotspots", cameraCount);
  setText("cameraText", cameraCount ? `${cameraCount} 支附近公開鏡頭` : "尚未找到附近鏡頭");
  setText("futureTrafficText", timeBand.label);
  setText("factorText", context.factors[0] || "校園周邊路況");
  setText("actionText", risk > 72 ? "提前出門並避開主要車流" : "維持目前建議路線");
  setText("alertMessage", `${school.name} 目前為${riskLabel.text}，預估 ${minutes} 分鐘，距離約 ${formatDistance(context.distanceKm)}。`);
  setText("recommendedRoute", `${mode.label}路線，${route.turns} 個轉折點`);
  setText("riskSourceText", isValidLatLng(state.userLocation) ? "依照你的目前位置重算。" : "未定位時使用學校周邊基準路徑。");
  setText("safetyTag", risk > 72 ? "需提高注意" : "風險可控");
  setText("timeTag", `${minutes} 分鐘`);
  setText("stageAverageRisk", averageRisk);
  setText("stageSchoolCount", stageSchools.length);
  setText("stageFocusAction", risk > averageRisk ? "優先改善路口穿越" : "維持監看與提醒");
  setText("selectedRiskBadge", riskLabel.text);
  els.selectedRiskBadge?.classList.toggle("is-high", risk >= 72);
  els.selectedRiskBadge?.classList.toggle("is-medium", risk >= 50 && risk < 72);
  els.selectedRiskBadge?.classList.toggle("is-low", risk < 50);
  setText("selectedSchoolMeta", `${STAGE_LABELS[school.stage]} / ${school.town}`);
  setText("selectedSchoolName", school.name);
  setText("improvementText", risk > 72 ? "建議避開尖峰與大型路口" : "建議維持目前路線");
  setText("selectedSchoolAddress", school.address);
  setText("selectedSchoolPhone", school.phone || "未提供");
  setText("detailRouteName", `${formatDistance(context.distanceKm)} / ${minutes} 分鐘`);
  setText("audienceText", `${commute.label}通學者`);
  setText("routeDistanceValue", formatDistance(context.distanceKm));
  setText("routeEstimateValue", `${minutes} 分鐘`);
  setText("detailScenePattern", isValidLatLng(state.userLocation) ? "定位到校路線" : "校區周邊基準路線");
  setText("detailSceneHazard", context.factors[0] || "路口穿越");
  setText("detailSceneCoverage", cameraCount ? `${cameraCount} 支鏡頭` : "查無附近鏡頭");
  setText("monitorCongestion", timeBand.label);
  setText("monitorWatchCount", cameraCount);
  setText("monitorTravelWindow", `${minutes} 分鐘`);
  setText("routeLogicTitle", `${commute.label} / ${mode.label}`);
  setText("routeLogicText", getRouteLogicText(context));
  setText("navigationModeTag", mode.label);
  els.navigationModeTag?.classList.toggle("is-active", state.navigationActive);
  setText("navStartText", isValidLatLng(state.userLocation) ? "你的目前位置" : "校區周邊基準點");
  setText("navDestinationText", school.name);
  setText("navDistanceTimeText", `${formatDistance(context.distanceKm)} / ${minutes} 分鐘`);
  renderMapNavigationOverlay(context);
  renderNavigationLiveStatus(context);
  renderNavigationSteps(context);
  setText("openNavigationButton", state.navigationActive ? "更新站內導航" : "啟用站內導航");
  setText("openNavigationSecondaryButton", state.navigationActive ? "重新整理地圖路線" : "在地圖中顯示路線");
  setText("aiRiskLevel", riskLabel.text);
  setText("aiRiskReason", `${context.factors.slice(0, 2).join("；")}。`);
  setText("aiSuggestion", makeAiSuggestion(context));
  setText("safeRouteTime", `${comparison.safe.minutes} 分鐘`);
  setText("safeRouteDistance", formatDistance(comparison.safe.distanceKm));
  setText("safeRouteRisk", comparison.safe.riskLabel);
  setText("safeRouteReason", comparison.safe.reason);
  setText("fastRouteTime", `${comparison.fast.minutes} 分鐘`);
  setText("fastRouteDistance", formatDistance(comparison.fast.distanceKm));
  setText("fastRouteRisk", comparison.fast.riskLabel);
  setText("fastRouteReason", comparison.fast.reason);
  renderImpactOutcomes(context, comparison);
  renderDemoModeState(context);

  syncRefreshUi();
}

function renderLists(context) {
  const recommendations = [
    `以 ${context.commute.label} 前往 ${context.school.name}`,
    `目前策略：${context.mode.label}`,
    `尖峰狀態：${context.timeBand.label}`,
    context.weather ? `選定學校天氣：${context.weather.summary}，${Math.round(context.weather.temperature)}°C` : "天氣資料載入中",
    isValidLatLng(state.userLocation) ? "已使用你的定位重算路線" : "可開啟定位取得個人化路線"
  ];
  renderList(els.recommendationList, recommendations);
  renderList(els.incidentList, context.factors);
  renderList(els.routeReasonList, [
    `路線距離 ${formatDistance(context.distanceKm)}`,
    `轉折數 ${context.route.turns}`,
    `學校位置來源：${context.school.geoSource || "校址資料"}`
  ]);
  renderList(els.recentList, context.factors.map((factor) => `${context.school.town}：${factor}`), "feed-item");
}

function renderImpactOutcomes(context, comparison = buildRouteComparison(context)) {
  const exposureReduction = clamp(
    Math.round((comparison.fast.distanceKm - comparison.safe.distanceKm + context.route.turns * 0.045 + context.cameraCount * 0.04) * 8 + 14),
    8,
    32
  );
  const earlyMinutes = Math.max(6, Math.round(context.minutes * (context.weatherRisk > 0 ? 0.2 : 0.14)));
  const decisionParties = context.cameraCount > 0 || isValidLatLng(state.userLocation) ? 3 : 2;
  setText("impactExposureValue", `${exposureReduction}%`);
  setText("impactEarlyValue", `${earlyMinutes} 分`);
  setText("impactDecisionValue", `${decisionParties} 方`);
}

function renderDemoModeState(context) {
  const steps = Array.from(els.demoSteps?.querySelectorAll("li") || []);
  steps.forEach((step, index) => step.classList.toggle("active", state.demoMode && index === state.demoStep));
  if (els.demoModeButton) els.demoModeButton.textContent = state.demoMode ? "重新播放評審模式" : "啟動評審模式";
  if (!els.demoStatusText) return;
  if (!state.demoMode) {
    els.demoStatusText.textContent = "依照 10 分鐘簡報節奏快速展示核心價值。";
    return;
  }
  const status = [
    `Demo ${state.demoStep + 1}/4：先說明南投山城通學痛點。`,
    `Demo ${state.demoStep + 1}/4：展示 ${context.school.name} 的天氣、風險與路線。`,
    `Demo ${state.demoStep + 1}/4：比較安全路線與最快路線的差異。`,
    `Demo ${state.demoStep + 1}/4：收斂到資料可信度、效益與可擴充性。`
  ];
  els.demoStatusText.textContent = status[state.demoStep] || status[0];
}

async function startJudgeDemoMode() {
  if (state.demoTimerId) {
    clearInterval(state.demoTimerId);
    state.demoTimerId = null;
  }
  state.demoMode = true;
  state.demoStep = 0;
  state.mode = "safe";
  if (els.displayMode) els.displayMode.value = "safe";
  if (state.commute === "bus") {
    state.commute = "walk";
    if (els.commuteMode) els.commuteMode.value = "walk";
    state.transitPlan = null;
  }
  state.navigationActive = true;
  state.navigationFollowUser = true;
  if (isValidLatLng(state.userLocation)) await fetchRoute();
  await updateAll(true);
  renderDemoModeState(buildContext(getSelectedSchool()));
  scrollToDemoStepTarget(0);
  state.demoTimerId = setInterval(() => {
    const school = getSelectedSchool();
    if (!school) return;
    state.demoStep = (state.demoStep + 1) % 4;
    renderDemoModeState(buildContext(school));
    scrollToDemoStepTarget(state.demoStep);
  }, 4200);
}

function scrollToDemoStepTarget(step) {
  const targets = [
    ".pain-points-panel",
    "#mobileMapSection",
    ".route-compare-panel",
    ".data-model-panel"
  ];
  const selector = targets[step] || "#mobileMapSection";
  document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (step === 1 || step === 2) window.setTimeout(() => state.map?.invalidateSize(), 260);
}

function buildRouteComparison(context) {
  const common = {
    school: context.school,
    commuteKey: state.commute,
    commute: context.commute,
    timeBand: context.timeBand,
    route: context.route,
    hillPenalty: getHillPenalty(context.school),
    routeReliability: getRouteReliability(context.route),
    weatherRisk: context.weatherRisk
  };
  const safeDistanceKm = context.distanceKm * 1.06;
  const fastDistanceKm = Math.max(0.35, context.distanceKm * 0.96);
  const safeRisk = clamp(context.risk - 8, 12, 90);
  const fastRisk = clamp(context.risk + 9, 18, 96);
  return {
    safe: {
      minutes: estimateCommuteMinutes({ ...common, modeKey: "safe", mode: MODE.safe, distanceKm: safeDistanceKm }),
      distanceKm: safeDistanceKm,
      riskLabel: getRiskLabel(safeRisk).text,
      reason: "避開主要車流路口，優先選擇監看覆蓋較高的通學動線。"
    },
    fast: {
      minutes: estimateCommuteMinutes({ ...common, modeKey: "fast", mode: MODE.fast, distanceKm: fastDistanceKm }),
      distanceKm: fastDistanceKm,
      riskLabel: getRiskLabel(fastRisk).text,
      reason: "時間較短，但路口穿越與尖峰車流權重較高。"
    }
  };
}

function makeAiSuggestion(context) {
  const suggestions = [];
  if (context.risk >= 72) suggestions.push(`提早 ${Math.max(6, Math.round(context.minutes * 0.18))} 分鐘出門`);
  if (context.cameraCount < 1) suggestions.push("選擇較多人行穿越或照明較完整路段");
  if (context.weatherRisk > 0) suggestions.push("雨天放慢速度並避開急彎與大路口");
  if (context.route.turns >= 8) suggestions.push("避開轉折過多的小巷動線");
  if (!suggestions.length) suggestions.push("維持安全路線並在尖峰前完成通學");
  suggestions.push("改走校門東側或車流較低側路線");
  return suggestions.slice(0, 3).join("、");
}

function renderDetailMap(context) {
  const routePoints = context.route.detailPoints;
  setSvg(els.detailGroundLayer, `
    <rect x="595" y="170" width="220" height="210" rx="24" class="detail-campus-zone"></rect>
    <rect x="628" y="208" width="145" height="82" rx="12" class="detail-campus-block"></rect>
    <ellipse cx="165" cy="105" rx="92" ry="46" class="detail-greenery"></ellipse>
    <ellipse cx="260" cy="455" rx="120" ry="54" class="detail-greenery"></ellipse>
  `);
  setSvg(els.detailRoadBaseLayer, `
    <path d="M55 330 C205 300 290 250 418 278 S615 344 845 285" class="road-major"></path>
    <path d="M390 50 C420 165 410 255 430 360 S500 500 530 560" class="road-sub"></path>
    <path d="M110 170 C270 190 365 195 512 160 S718 128 840 170" class="road-sub"></path>
  `);
  setSvg(els.detailCrosswalkLayer, `
    <rect x="566" y="294" width="86" height="12" class="detail-crosswalk-stripe"></rect>
    <rect x="570" y="318" width="86" height="12" class="detail-crosswalk-stripe"></rect>
    <rect x="575" y="342" width="86" height="12" class="detail-crosswalk-stripe"></rect>
  `);
  setSvg(els.detailStreetLayer, `
    <text x="124" y="302" class="detail-label">主要通學道路</text>
    <text x="620" y="190" class="detail-label">校園入口</text>
  `);

  const path = routePoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  setSvg(els.routeLayer, `
    <path d="${path}" class="route-line base-route"></path>
    <path d="${path}" class="route-line ${state.mode === "fast" ? "fast" : "safe"}"></path>
  `);
  setSvg(els.incidentLayer, `
    <circle cx="430" cy="282" r="13" class="incident-dot medium"></circle>
    <circle cx="610" cy="318" r="13" class="incident-dot ${context.risk > 72 ? "danger" : "low"}"></circle>
  `);
  setSvg(els.cameraLayer, `
    <path d="M520 214 h28 v18 h-28 z" class="camera-icon"></path>
    <path d="M705 338 h28 v18 h-28 z" class="camera-icon"></path>
  `);
}

function renderTraffic(context) {
  if (!els.trafficBars) return;
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(Math.floor(now.getMinutes() / 15) * 15);
  const bars = Array.from({ length: 8 }, (_, index) => {
    const slot = new Date(start.getTime() + index * 15 * 60000);
    const hour = slot.getHours();
    const minute = slot.getMinutes();
    const base = context.risk + index * 3 + (hour >= 7 && hour <= 9 ? 18 : 0) + (hour >= 16 && hour <= 18 ? 14 : 0);
    const height = clamp(base, 28, 96);
    return `<div class="traffic-bar" style="--bar-height:${height}%"><span>${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}</span></div>`;
  }).join("");
  els.trafficBars.innerHTML = bars;
  setText("trafficFlowLabel", context.risk > 72 ? "車流偏高" : "車流穩定");
}

function renderWeatherRiskBars(context) {
  if (!els.weatherRiskBars) return;
  const labels = ["現在", "+1h", "+2h", "+3h"];
  const base = context.weatherRisk + context.timeBand.risk * 0.35 + getHillPenalty(context.school) * 0.8;
  const bars = labels.map((label, index) => {
    const wave = index % 2 === 0 ? 3 : 7;
    const risk = clamp(Math.round(base + wave + index * 2), 8, 92);
    return `<div class="weather-risk-bar" style="--risk-height:${risk}%"><span>${label}</span></div>`;
  }).join("");
  els.weatherRiskBars.innerHTML = bars;
}

function renderNavigationLiveStatus(context) {
  const school = context.school;
  const hasUserLocation = isValidLatLng(state.userLocation);
  const remainingKm = hasUserLocation && isValidLatLng(school)
    ? haversineKm(state.userLocation.lat, state.userLocation.lng, school.lat, school.lng)
    : null;

  if (state.navigationArrived) {
    setText("navLiveStatusText", "已抵達目的地附近");
    setText("navProgressText", "抵達");
    setText("navArrivalText", "即時追蹤已自動停止，可重新啟用導航再次規劃。");
    return;
  }

  if (state.navigationActive && hasUserLocation) {
    const accuracy = Number(state.userLocation.accuracy);
    setText("navLiveStatusText", "即時導航追蹤中");
    setText("navProgressText", `剩餘 ${formatDistance(remainingKm ?? context.distanceKm)}`);
    setText(
      "navArrivalText",
      Number.isFinite(accuracy)
        ? `定位精度約 ${Math.round(accuracy)} 公尺，會持續跟隨到校門附近。`
        : "會持續跟隨使用者位置，直到接近學校。"
    );
    return;
  }

  if (state.navigationActive) {
    setText("navLiveStatusText", "站內導航已啟用");
    setText("navProgressText", "等待定位");
    setText("navArrivalText", "允許定位後會切換成即時跟隨路線。");
    return;
  }

  setText("navLiveStatusText", "尚未啟用即時追蹤");
  setText("navProgressText", hasUserLocation ? `距學校 ${formatDistance(remainingKm ?? context.distanceKm)}` : "等待定位");
  setText("navArrivalText", "按下站內導航後，路線會隨使用者位置重新規劃。");
}

function renderMapNavigationOverlay(context) {
  const hasUserLocation = isValidLatLng(state.userLocation);
  const remainingKm = hasUserLocation && isValidLatLng(context.school)
    ? haversineKm(state.userLocation.lat, state.userLocation.lng, context.school.lat, context.school.lng)
    : null;
  const speedKmh = getNavigationSpeedKmh();
  const accuracy = Number(state.userLocation?.accuracy);

  els.mapNavigationOverlay?.classList.toggle("is-active", state.navigationActive);
  els.mapNavigationOverlay?.classList.toggle("is-following", state.navigationActive && state.navigationFollowUser && hasUserLocation);

  if (state.navigationArrived) {
    setText("mapNavStatus", "已抵達");
    setText("mapNavRemaining", "抵達目的地");
    setText("mapNavEta", "已完成");
  } else if (state.navigationActive && hasUserLocation) {
    setText("mapNavStatus", state.navigationFollowUser ? "導航中 / 跟隨位置" : "導航中 / 手動瀏覽");
    setText("mapNavRemaining", formatDistance(remainingKm ?? context.distanceKm));
    setText("mapNavEta", `${estimateLiveEtaMinutes(remainingKm ?? context.distanceKm, context)} 分鐘`);
  } else if (state.navigationActive) {
    setText("mapNavStatus", "導航中 / 等待定位");
    setText("mapNavRemaining", "請允許定位");
    setText("mapNavEta", "--");
  } else {
    setText("mapNavStatus", "尚未導航");
    setText("mapNavRemaining", hasUserLocation ? formatDistance(remainingKm ?? context.distanceKm) : "等待定位");
    setText("mapNavEta", `${context.minutes} 分鐘`);
  }

  setText("mapNavSpeed", Number.isFinite(speedKmh) ? `時速 ${Math.round(speedKmh)} km/h` : "時速 --");
  setText("mapNavAccuracy", Number.isFinite(accuracy) ? `GPS ±${Math.round(accuracy)}m` : "GPS --");
  setText("mapNavHeading", formatHeadingText(getNavigationHeading(context)));
  setText("mapFollowButton", state.navigationFollowUser ? "跟隨中" : "回到定位");
  if (els.mapModeNotice) {
    const notice =
      state.commute === "bus"
        ? "公車：已查詢附近站牌；即時班次未接入時不顯示假班表"
        : state.commute === "car"
          ? "開車：已提高尖峰車流與校門停靠風險權重"
          : "";
    els.mapModeNotice.hidden = !notice;
    els.mapModeNotice.textContent = notice;
  }
  renderTransitPanel();
}

function renderTransitPanel() {
  if (!els.mapTransitPanel) return;
  const setTransitItems = (items = []) => {
    if (!els.mapTransitList) return;
    els.mapTransitList.innerHTML = items
      .slice(0, TRANSIT_SEARCH.maxCandidates)
      .map((item, index) => {
        if (typeof item === "string") return `<li>${escapeHtml(item)}</li>`;
        const active = index === state.selectedTransitCandidateIndex ? " is-active" : "";
        return `<li><button type="button" class="map-transit-option${active}" data-transit-candidate="${index}">${escapeHtml(item.label)}</button></li>`;
      })
      .join("");
  };
  const hideTransitDetail = () => {
    if (!els.mapTransitDetail) return;
    els.mapTransitDetail.hidden = true;
    els.mapTransitDetail.innerHTML = "";
  };
  if (state.commute !== "bus") {
    els.mapTransitPanel.hidden = true;
    setTransitItems();
    hideTransitDetail();
    return;
  }

  const plan = state.transitPlan;
  els.mapTransitPanel.hidden = false;
  if (!isValidLatLng(state.userLocation)) {
    setText("mapTransitStatus", "需要定位");
    setText("mapTransitRoute", "允許定位後查詢最近上車站");
    setText("mapTransitStops", "終點會使用所選學校附近站牌，不會產生假公車班次。");
    setTransitItems();
    hideTransitDetail();
    return;
  }
  if (!plan || plan.status === "loading") {
    setText("mapTransitStatus", "查詢公車站中");
    setText("mapTransitRoute", "正在掃描附近站牌與可用公車路線");
    setText("mapTransitStops", "會比對多個起點站牌與學校附近站牌，不只查最近一站。");
    setTransitItems();
    hideTransitDetail();
    return;
  }
  if (plan.status === "error") {
    setText("mapTransitStatus", "公車站查詢暫不可用");
    setText("mapTransitRoute", "目前無法連線到公開站牌資料");
    setText("mapTransitStops", "仍保留候車緩衝估算，不顯示未確認班次。");
    setTransitItems();
    hideTransitDetail();
    return;
  }
  if (plan.status === "timeout") {
    setText("mapTransitStatus", "公車查詢逾時");
    setText("mapTransitRoute", "公開站牌資料回應過慢，請稍後重試");
    setText("mapTransitStops", "可先改用步行、開車，或重新點選公車模式再查詢。");
    setTransitItems();
    hideTransitDetail();
    return;
  }
  if (!plan.originStops?.length || !plan.schoolStops?.length) {
    setText("mapTransitStatus", "站牌資料不足");
    setText("mapTransitRoute", "附近未找到足夠站牌資料");
    setText("mapTransitStops", "可改用步行、開車或稍後再查詢公車資料。");
    setTransitItems();
    hideTransitDetail();
    return;
  }

  if (plan.candidates?.length) {
    state.selectedTransitCandidateIndex = clamp(state.selectedTransitCandidateIndex || 0, 0, plan.candidates.length - 1);
    const labels = plan.candidates.map((candidate) => candidate.routeLabel);
    const selectedTiming = estimateTransitCandidateTiming(plan.candidates[state.selectedTransitCandidateIndex]);
    setText(
      "mapTransitStatus",
      plan.isStale
        ? `使用最近成功資料：${plan.candidates.length} 組公車候選`
        : `找到 ${plan.candidates.length} 組公車候選`
    );
    setText("mapTransitRoute", `可搭候選：${labels.slice(0, 4).join(" / ")}`);
    setText(
      "mapTransitStops",
      selectedTiming
        ? `上車 ${selectedTiming.originStopName} ${selectedTiming.boardTimeText}；下車 ${selectedTiming.schoolStopName} ${selectedTiming.alightTimeText}；約 ${selectedTiming.totalMinutes} 分到校。`
        : `已掃描起點附近 ${plan.originStops.length} 站、學校附近 ${plan.schoolStops.length} 站；未含即時到站時間。`
    );
    setTransitItems(plan.candidates.map((candidate) => ({
      label: `${candidate.routeLabel}｜約 ${estimateTransitCandidateTiming(candidate)?.totalMinutes || "--"} 分：${candidate.originStop.name} → ${candidate.schoolStop.name}`
    })));
    renderTransitCandidateDetail(plan.candidates[state.selectedTransitCandidateIndex]);
    return;
  }

  const originRoutes = plan.originRoutes.map((route) => route.label).slice(0, 5);
  const schoolRoutes = plan.schoolRoutes.map((route) => route.label).slice(0, 5);
  setText("mapTransitStatus", "暫無直達，已整理可用轉乘方向");
  const routeText = originRoutes.length || schoolRoutes.length
    ? `起點路線：${originRoutes.join(" / ") || "不足"}；學校周邊：${schoolRoutes.join(" / ") || "不足"}`
    : "站牌缺少路線代碼，無法確認直達車";
  setText("mapTransitRoute", routeText);
  setText(
    "mapTransitStops",
    `最近上車 ${plan.originStops[0].name}（${Math.round(plan.originStops[0].distanceM)}m）→ 學校附近 ${plan.schoolStops[0].name}（${Math.round(plan.schoolStops[0].distanceM)}m）`
  );
  setTransitItems([
    ...plan.originStops.slice(0, 3).map((stop) => `起點附近：${stop.name}（${Math.round(stop.distanceM)}m）`),
    ...plan.schoolStops.slice(0, 3).map((stop) => `學校附近：${stop.name}（${Math.round(stop.distanceM)}m）`)
  ]);
  hideTransitDetail();
}

function renderTransitCandidateDetail(candidate) {
  if (!els.mapTransitDetail || !candidate) return;
  const school = getSelectedSchool();
  const timing = estimateTransitCandidateTiming(candidate);
  const toBoardMinutes = timing?.walkToBoardMinutes || estimateWalkMinutesFromMeters(candidate.originStop.distanceM);
  const toSchoolMinutes = timing?.walkToSchoolMinutes || estimateWalkMinutesFromMeters(candidate.schoolStop.distanceM);
  const routeLine = candidate.type === "transfer"
    ? `搭乘 ${candidate.originRouteLabel}，再轉乘 ${candidate.schoolRouteLabel}`
    : `搭乘 ${candidate.routeLabel}`;
  els.mapTransitDetail.hidden = false;
  els.mapTransitDetail.innerHTML = `
    <strong>${escapeHtml(candidate.routeLabel)} 詳細步驟</strong>
    ${timing ? `
      <div class="transit-time-grid" aria-label="公車預估時程">
        <span><b>上車站</b>${escapeHtml(timing.originStopName)}<em>${timing.boardTimeText}</em></span>
        <span><b>下車站</b>${escapeHtml(timing.schoolStopName)}<em>${timing.alightTimeText}</em></span>
        <span><b>抵達學校</b>${escapeHtml(school?.name || "所選學校")}<em>${timing.arrivalTimeText}</em></span>
        <span><b>預估全程</b>步行＋候車＋乘車<em>${timing.totalMinutes} 分</em></span>
      </div>
    ` : ""}
    <span>1. 從目前位置步行約 ${Math.round(candidate.originStop.distanceM)} 公尺（約 ${toBoardMinutes} 分）到「${escapeHtml(candidate.originStop.name)}」，預估 ${timing?.boardTimeText || "稍後"} 上車。</span>
    <span>2. ${escapeHtml(routeLine)}，預估乘車約 ${timing?.rideMinutes || "--"} 分。</span>
    <span>3. 預估 ${timing?.alightTimeText || "稍後"} 在「${escapeHtml(candidate.schoolStop.name)}」下車。</span>
    <span>4. 下車後步行約 ${Math.round(candidate.schoolStop.distanceM)} 公尺（約 ${toSchoolMinutes} 分）到「${escapeHtml(school?.name || "所選學校")}」，約 ${timing?.arrivalTimeText || "稍後"} 抵達。</span>
    <span>提醒：目前是依站距、步行、候車緩衝與尖峰狀態推估；尚未接入即時到站班表。</span>
  `;
  const activeOption = els.mapTransitList?.querySelector(".map-transit-option.is-active");
  const activeItem = activeOption?.closest("li");
  if (activeItem) activeItem.appendChild(els.mapTransitDetail);
}

function getSelectedTransitCandidate() {
  const candidates = state.transitPlan?.candidates || [];
  if (!candidates.length) return null;
  return candidates[state.selectedTransitCandidateIndex] || candidates[0] || null;
}

function getTransitCandidateForRouting() {
  const selected = getSelectedTransitCandidate();
  if (selected) return selected;
  const originStop = state.transitPlan?.originStops?.[0];
  const schoolStop = state.transitPlan?.schoolStops?.[0];
  if (!originStop || !schoolStop) return null;
  return {
    routeKey: "nearest-stop-estimate",
    routeLabel: "站牌接駁預估",
    type: "unconfirmed",
    originStop,
    schoolStop,
    confidence: 3,
    walkM: (originStop.distanceM || 9999) + (schoolStop.distanceM || 9999)
  };
}

function estimateTransitCandidateTiming(candidate, options = {}) {
  if (!candidate?.originStop || !candidate?.schoolStop) return null;
  const school = options.school || getSelectedSchool();
  const timeBand = options.timeBand || getTimeBand();
  const weatherRisk = Number.isFinite(options.weatherRisk) ? options.weatherRisk : getWeatherRisk(getSchoolWeather(school));
  const now = options.now instanceof Date ? options.now : new Date();
  const walkToBoardMinutes = estimateWalkMinutesFromMeters(candidate.originStop.distanceM);
  const walkToSchoolMinutes = estimateWalkMinutesFromMeters(candidate.schoolStop.distanceM);
  const waitMinutes = estimateTransitWaitMinutes(candidate, timeBand, weatherRisk);
  const rideMinutes = estimateTransitRideMinutes(candidate, timeBand, weatherRisk);
  const totalMinutes = clamp(walkToBoardMinutes + waitMinutes + rideMinutes + walkToSchoolMinutes, 8, 120);
  const boardAt = addMinutes(now, walkToBoardMinutes + waitMinutes);
  const alightAt = addMinutes(boardAt, rideMinutes);
  const arrivalAt = addMinutes(alightAt, walkToSchoolMinutes);
  return {
    originStopName: candidate.originStop.name || "建議上車站",
    schoolStopName: candidate.schoolStop.name || "學校附近下車站",
    walkToBoardMinutes,
    waitMinutes,
    rideMinutes,
    walkToSchoolMinutes,
    totalMinutes,
    boardTimeText: `約 ${formatClockTime(boardAt)}`,
    alightTimeText: `約 ${formatClockTime(alightAt)}`,
    arrivalTimeText: `約 ${formatClockTime(arrivalAt)}`
  };
}

function estimateWalkMinutesFromMeters(meters) {
  return Math.max(1, Math.round((Number(meters) || 0) / 75));
}

function estimateTransitWaitMinutes(candidate, timeBand, weatherRisk) {
  const base = COMMUTE_TUNING.bus.waitBase || 6;
  const transferCost = candidate.type === "transfer" ? 4 : 0;
  const confidenceCost = Math.max(0, Number(candidate.confidence) || 0) * 2;
  return clamp(Math.round(base + timeBand.delay * 0.45 + weatherRisk * 0.12 + transferCost + confidenceCost), 5, 28);
}

function estimateTransitRideMinutes(candidate, timeBand, weatherRisk) {
  const routeKm = estimateTransitRideDistanceKm(candidate);
  const transferCost = candidate.type === "transfer" ? 8 : 0;
  const busSpeedKmh = clamp(23 - timeBand.delay * 0.35 - weatherRisk * 0.08, 15, 25);
  const stopCost = Math.min(12, Math.max(2, routeKm * 0.9));
  return clamp(Math.round((routeKm / busSpeedKmh) * 60 + stopCost + transferCost), 4, 85);
}

function estimateTransitRideDistanceKm(candidate) {
  const origin = candidate.originStop;
  const destination = candidate.schoolStop;
  if (!isValidLatLng(origin) || !isValidLatLng(destination)) return 1.2;
  const roadFactor = candidate.type === "transfer" ? 1.45 : 1.28;
  return Math.max(0.8, haversineKm(origin.lat, origin.lng, destination.lat, destination.lng) * roadFactor);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function formatClockTime(date) {
  return date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getNavigationSpeedKmh() {
  if (Number.isFinite(state.navigationSpeedKmh)) return state.navigationSpeedKmh;
  const metersPerSecond = Number(state.userLocation?.speed);
  if (Number.isFinite(metersPerSecond)) return metersPerSecond * 3.6;
  return null;
}

function estimateLiveEtaMinutes(distanceKm, context) {
  const speedKmh = getNavigationSpeedKmh();
  const minimumSpeed = Math.max(3.2, (COMMUTE[state.commute]?.speed || context.commute.speed) * 0.45);
  const usableSpeed = Number.isFinite(speedKmh) && speedKmh >= 1.5
    ? clamp(speedKmh, minimumSpeed, Math.max(minimumSpeed, context.commute.speed * 1.6))
    : context.commute.speed;
  const movingMinutes = distanceKm / Math.max(usableSpeed, 1) * 60;
  const buffer = COMMUTE_TUNING[state.commute]?.access || 2;
  return clamp(Math.round(movingMinutes + buffer + context.timeBand.risk * 0.08), 1, 120);
}

function getNavigationHeading(context) {
  if (hasFiniteValue(state.navigationHeading)) return Number(state.navigationHeading);
  if (isValidLatLng(state.userLocation) && isValidLatLng(context.school)) {
    return bearingDegrees(state.userLocation.lat, state.userLocation.lng, context.school.lat, context.school.lng);
  }
  return null;
}

function formatHeadingText(heading) {
  if (!hasFiniteValue(heading)) return "方向 --";
  const directions = ["北", "東北", "東", "東南", "南", "西南", "西", "西北"];
  const index = Math.round((((Number(heading) % 360) + 360) % 360) / 45) % directions.length;
  return `方向 ${directions[index]} ${Math.round(heading)}°`;
}

function renderNavigationSteps(context) {
  if (!els.navigationStepList) return;
  const schoolGate = context.school.stage === "kindergarten" || context.school.stage === "elementary" ? "校門接送區" : "主要校門";
  const steps = [
    {
      title: "出發前確認",
      text: context.weather ? `${context.weather.summary}，${Math.round(context.weather.temperature)}°C；${context.timeBand.label}需保留緩衝。` : `${context.timeBand.label}，建議先確認天候。`
    },
    {
      title: "選擇安全通學主線",
      text: context.mode.label === "安全優先" ? "優先走監看覆蓋較高、轉折較少的路段。" : "時間優先時仍避開大型路口與車流密集點。"
    },
    {
      title: "沿線風險提醒",
      text: `${context.factors[0] || "路口穿越"}；目前估計 ${context.route.turns} 個轉折點。`
    },
    {
      title: `抵達 ${schoolGate}`,
      text: `距離約 ${formatDistance(context.distanceKm)}，預估 ${context.minutes} 分鐘，抵達前降低速度並注意校門口人車交會。`
    }
  ];
  els.navigationStepList.innerHTML = steps.map((step, index) => `
    <li>
      <span>${index + 1}</span>
      <div>
        <strong>${escapeHtml(step.title)}</strong>
        <p>${escapeHtml(step.text)}</p>
      </div>
    </li>
  `).join("");
}

function getWeatherRiskText(context) {
  if (!context.weather) return "天氣載入中";
  if (context.weatherRisk >= 10) return "天候風險偏高";
  if (context.weatherRisk > 0) return "需留意天候";
  return "天候穩定";
}

function makeWeatherAdvice(context) {
  if (!context.weather) return "目前正在讀取選定學校周邊天氣，完成後會更新通學建議。";
  if (context.weather.precipitation >= 4) return "降雨明顯，建議提早出門、避免急彎與大型路口，步行或自行車需放慢速度。";
  if (context.weather.precipitation > 0) return "短暫降雨會增加濕滑與視線風險，建議選擇照明與監看覆蓋較好的路線。";
  if (context.weather.summary.includes("霧")) return "能見度較低，建議避開山路彎道與車速較快路段。";
  return "天候目前穩定，可依安全路線與尖峰時段建議出發。";
}

function renderStageSummary() {
  if (!els.stageSummaryGrid) return;
  const groups = ["kindergarten", "elementary", "junior", "senior", "university"].map((stage) => {
    const items = schools.filter((school) => school.stage === stage);
    const townCount = new Set(items.map((item) => item.town)).size;
    return { stage, count: items.length, townCount };
  });
  els.stageSummaryGrid.innerHTML = groups.map((group) => `
    <article class="integration-card">
      <p>${STAGE_LABELS[group.stage]}</p>
      <strong>${group.count} 所</strong>
      <span>分布 ${group.townCount} 個鄉鎮</span>
    </article>
  `).join("");
}

async function requestLocationLegacy() {
  if (!window.isSecureContext) {
    setText("locationPermissionText", "需要 HTTPS");
    setText("locationStatusText", "手機瀏覽器需要 HTTPS 網址才能要求定位權限。");
    return;
  }

  if (!navigator.geolocation) {
    setText("locationPermissionText", "無法使用");
    setText("locationStatusText", "這個瀏覽器不支援定位。");
    return;
  }

  if (!window.isSecureContext) {
    setText("locationPermissionText", "需要 HTTPS");
    setText("locationStatusText", "手機瀏覽器需要 HTTPS 網址才能要求定位權限。");
    return;
  }
  if (!navigator.geolocation) {
    setText("locationPermissionText", "不支援");
    setText("locationStatusText", "目前瀏覽器不支援定位。");
    return;
  }

  setText("locationPermissionText", "請求中");
  setText("locationStatusText", "正在請求定位權限。");
  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 30000
  };

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      if (!Number.isFinite(position.coords.latitude) || !Number.isFinite(position.coords.longitude)) {
        setText("locationPermissionText", "定位失敗");
        setText("locationStatusText", "定位資料無法使用。");
        return;
      }
      state.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      setText("locationPermissionText", "已取得");
      setText("locationStatusText", `定位精度約 ${Math.round(position.coords.accuracy)} 公尺，正在重算路線。`);
      await fetchRoute();
      updateAll(true);
    },
    (error) => {
      setText("locationPermissionText", "未授權");
      setText("locationStatusText", error.message || "定位被拒絕或暫時不可用。");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  );
}

async function requestLocation(options = {}) {
  const keepTracking = Boolean(options.keepTracking || state.navigationActive);
  if (!window.isSecureContext) {
    setText("locationPermissionText", "需要 HTTPS");
    setText("locationStatusText", "手機瀏覽器需要 HTTPS 網址才能要求定位權限。");
    finishMapLocationRequest(false, "定位需要使用 HTTPS 正式網址");
    return;
  }

  if (!navigator.geolocation) {
    setText("locationPermissionText", "無法使用");
    setText("locationStatusText", "這個瀏覽器不支援定位。");
    finishMapLocationRequest(false, "目前瀏覽器不支援定位功能");
    return;
  }

  stopLocationTracking();
  state.locationSamples = [];
  state.locationLastAcceptedAt = 0;
  setText("locationPermissionText", "定位中");
  setText("locationStatusText", "正在取得定位，並持續微調精度…");

  const geoOptions = {
    enableHighAccuracy: true,
    timeout: keepTracking ? 22000 : 15000,
    maximumAge: 0
  };

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      await ingestLocationFix(position, false);
    },
    (error) => {
      if (state.userLocation) return;
      setText("locationPermissionText", "定位失敗");
      setText("locationStatusText", error.message || "目前無法取得定位。");
      finishMapLocationRequest(false, getLocationErrorMessage(error));
    },
    geoOptions
  );

  state.locationWatchId = navigator.geolocation.watchPosition(
    async (position) => {
      await ingestLocationFix(position, true);
    },
    () => {
    },
    geoOptions
  );

  if (keepTracking) {
    requestNavigationWakeLock();
    setText("locationStatusText", "即時導航追蹤中：網頁開啟時會持續更新位置與路線。");
    scheduleHighAccuracyPulse(true);
  } else {
    scheduleHighAccuracyPulse(false);
  }

  if (!keepTracking) {
    state.locationRefineTimer = setTimeout(() => {
    if (state.userLocation?.accuracy) {
      setText("locationStatusText", `定位已校正，精度約 ${Math.round(state.userLocation.accuracy)} 公尺。`);
    }
    stopLocationTracking();
    }, 12000);
  }
}

function stopLocationTracking() {
  if (state.locationWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(state.locationWatchId);
  }
  state.locationWatchId = null;
  if (state.locationRefineTimer) {
    clearTimeout(state.locationRefineTimer);
  }
  state.locationRefineTimer = null;
  if (state.locationWarmupTimer) {
    clearTimeout(state.locationWarmupTimer);
  }
  state.locationWarmupTimer = null;
  state.locationSamples = [];
  releaseNavigationWakeLock();
}

function scheduleHighAccuracyPulse(keepTracking, count = 0) {
  if (!navigator.geolocation || state.locationWatchId === null) return;
  const maxCount = keepTracking ? Infinity : 3;
  if (count >= maxCount) return;
  const delay = keepTracking ? GPS_NAV_PULSE_INTERVAL_MS : GPS_WARMUP_INTERVAL_MS;
  state.locationWarmupTimer = setTimeout(() => {
    if (!navigator.geolocation || state.locationWatchId === null) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        ingestLocationFix(position, true).catch(() => {});
        scheduleHighAccuracyPulse(keepTracking, count + 1);
      },
      () => {
        scheduleHighAccuracyPulse(keepTracking, count + 1);
      },
      {
        enableHighAccuracy: true,
        timeout: keepTracking ? 18000 : 10000,
        maximumAge: 0
      }
    );
  }, delay);
}

async function requestNavigationWakeLock() {
  if (!state.navigationActive || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  if (state.wakeLock) return;
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
    state.wakeLock.addEventListener?.("release", () => {
      state.wakeLock = null;
    });
  } catch {
    state.wakeLock = null;
  }
}

function releaseNavigationWakeLock() {
  const lock = state.wakeLock;
  state.wakeLock = null;
  lock?.release?.().catch(() => {});
}

function handleVisibilityChange() {
  if (document.visibilityState !== "visible") return;
  refreshCameraFrames();
  void refreshCameras();
  if (!state.navigationActive) return;
  requestNavigationWakeLock();
  if (state.locationWatchId === null) {
    requestLocation({ keepTracking: true }).catch(() => {});
  }
}

async function ingestLocationFix(position, isRefining) {
  if (!Number.isFinite(position?.coords?.latitude) || !Number.isFinite(position?.coords?.longitude)) {
    if (!isRefining) {
      setText("locationPermissionText", "定位失敗");
      setText("locationStatusText", "定位資料格式異常。");
    }
    return;
  }

  const sample = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: clamp(Number(position.coords.accuracy) || 999, 5, 999),
    heading: hasFiniteValue(position.coords.heading) ? Number(position.coords.heading) : null,
    speed: hasFiniteValue(position.coords.speed) ? Math.max(0, Number(position.coords.speed)) : null,
    timestamp: Date.now()
  };
  if (shouldWaitForBetterGpsFix(sample, isRefining)) {
    return;
  }
  if (isLikelyGpsDrift(sample)) {
    if (!isRefining) {
      setText("locationStatusText", "定位訊號不穩，正在等待更準確的位置。");
    }
    return;
  }

  state.locationSamples = [sample, ...state.locationSamples]
    .filter((item) => sample.timestamp - item.timestamp <= GPS_SAMPLE_WINDOW_MS)
    .slice(0, 10);

  const refined = buildRefinedLocation();
  const shouldUpdate = shouldAcceptLocationUpdate(refined);

  if (!shouldUpdate && isRefining) return;

  const previousLocation = state.userLocation && isValidLatLng(state.userLocation)
    ? { ...state.userLocation }
    : null;
  if (hasFiniteValue(refined.speed)) {
    state.navigationSpeedKmh = clamp(Number(refined.speed) * 3.6, 0, 140);
  } else if (previousLocation?.timestamp && refined.timestamp > previousLocation.timestamp) {
    const deltaHours = (refined.timestamp - previousLocation.timestamp) / 3600000;
    const movedKm = haversineKm(refined.lat, refined.lng, previousLocation.lat, previousLocation.lng);
    const noiseFloorKm = Math.max(0.006, (Number(refined.accuracy) + Number(previousLocation.accuracy || 0)) / 1000 * 0.18);
    if (deltaHours > 0 && movedKm >= noiseFloorKm) state.navigationSpeedKmh = clamp(movedKm / deltaHours, 0, 140);
  }
  state.navigationHeading = hasFiniteValue(refined.heading)
    ? Number(refined.heading)
    : previousLocation ? bearingDegrees(previousLocation.lat, previousLocation.lng, refined.lat, refined.lng) : null;

  state.userLocation = refined;
  state.locationLastAcceptedAt = Date.now();
  els.mapLocateButton?.classList.add("is-active");
  if (state.focusLocationWhenReady) {
    state.focusLocationWhenReady = false;
    state.mapFocusUserRequested = true;
    centerMapOnUser();
    finishMapLocationRequest(true, `定位成功，精度約 ${Math.round(refined.accuracy)} 公尺`);
  }
  applyMapOrientation();
  setText("locationPermissionText", "已定位");
  setText(
    "locationStatusText",
    isRefining
      ? `定位精度約 ${Math.round(refined.accuracy)} 公尺，持續校正中。`
      : `定位精度約 ${Math.round(refined.accuracy)} 公尺。`
  );
  await handleLiveNavigationAfterLocationFix();
}

function finishMapLocationRequest(success, message) {
  state.focusLocationWhenReady = false;
  els.mapLocateButton?.classList.remove("is-loading");
  els.mapLocateButton?.classList.toggle("is-active", success);
  setText("mapLocateLabel", "我的位置");
  setMapControlStatus(message, success ? "success" : "error", success ? 3200 : 5200);
}

function getLocationErrorMessage(error) {
  if (error?.code === 1) return "定位權限未開啟，請允許網站存取位置後再試一次";
  if (error?.code === 2) return "目前收不到 GPS 位置，請移到較空曠處後再試一次";
  if (error?.code === 3) return "定位等待逾時，請確認定位服務已開啟後重試";
  return error?.message || "目前無法取得定位";
}

async function handleLiveNavigationAfterLocationFix() {
  const school = getSelectedSchool();
  const hasDestination = school && isValidLatLng(school);

  if (!state.navigationActive || !hasDestination || !isValidLatLng(state.userLocation)) {
    await fetchRoute();
    updateAll(true);
    return;
  }

  const remainingKm = haversineKm(state.userLocation.lat, state.userLocation.lng, school.lat, school.lng);
  const previousDistance = state.navigationLastDistanceKm;
  state.navigationLastDistanceKm = remainingKm;

  if (remainingKm <= GPS_ARRIVAL_RADIUS_KM) {
    state.navigationArrived = true;
    state.navigationActive = false;
    await fetchRoute();
    updateAll(true);
    setText("locationStatusText", `已抵達 ${school.name} 附近，導航追蹤已自動停止。`);
    stopLocationTracking();
    return;
  }

  const now = Date.now();
  const movedFromRouteOrigin = state.navigationLastRouteOrigin
    ? haversineKm(state.userLocation.lat, state.userLocation.lng, state.navigationLastRouteOrigin.lat, state.navigationLastRouteOrigin.lng)
    : Infinity;
  const movedEnough =
    movedFromRouteOrigin >= GPS_NAV_MIN_MOVE_KM ||
    previousDistance === null ||
    Math.abs(previousDistance - remainingKm) >= GPS_NAV_MIN_MOVE_KM;
  const routeExpired = !state.navigationLastRouteAt || now - state.navigationLastRouteAt >= GPS_NAV_RECALC_MS;

  if (movedEnough || routeExpired || !state.route) {
    await fetchRoute();
    state.navigationLastRouteAt = now;
    state.navigationLastRouteOrigin = { lat: state.userLocation.lat, lng: state.userLocation.lng };
    updateAll(true);
    return;
  }

  updateAll();
}

function isLikelyGpsDrift(sample) {
  if (!state.userLocation || !isValidLatLng(state.userLocation)) return false;
  const currentAccuracy = Number(state.userLocation.accuracy) || 999;
  const jumpKm = haversineKm(sample.lat, sample.lng, state.userLocation.lat, state.userLocation.lng);
  const elapsedHours = Math.max((sample.timestamp - Number(state.userLocation.timestamp || 0)) / 3600000, 1 / 3600000);
  const impliedSpeedKmh = jumpKm / elapsedHours;
  const poorAccuracy = sample.accuracy > Math.max(state.navigationActive ? 80 : 110, currentAccuracy * 2.6);
  const impossibleJump = jumpKm > Math.max(state.navigationActive ? 0.11 : 0.18, sample.accuracy / 1000 * 2.2);
  const impossibleSpeed = impliedSpeedKmh > GPS_IMPOSSIBLE_SPEED_KMH && jumpKm > Math.max(0.05, sample.accuracy / 1000);
  return (poorAccuracy && impossibleJump) || impossibleSpeed;
}

function shouldWaitForBetterGpsFix(sample, isRefining) {
  if (!sample || !isValidLatLng(sample)) return true;
  if (sample.accuracy >= GPS_HARD_REJECT_ACCURACY_M && state.userLocation) {
    if (!isRefining) setText("locationStatusText", "GPS 訊號太弱，正在等待更準確的位置。");
    return true;
  }
  // Show the first valid fix immediately, then let watchPosition refine it.
  // Waiting for several high-accuracy samples made location and routes appear missing indoors.
  return false;
}

function shouldAcceptLocationUpdate(refined) {
  if (!refined || !isValidLatLng(refined)) return false;
  if (!state.userLocation || !isValidLatLng(state.userLocation)) return true;

  const movedKm = haversineKm(refined.lat, refined.lng, state.userLocation.lat, state.userLocation.lng);
  const minMoveKm = state.navigationActive ? GPS_NAV_MIN_MOVE_KM : GPS_IDLE_MIN_MOVE_KM;
  const oldAccuracy = Number(state.userLocation.accuracy) || 999;
  const newAccuracy = Number(refined.accuracy) || 999;
  const improved = newAccuracy <= oldAccuracy * 0.82 || newAccuracy + 6 < oldAccuracy;
  const movedEnough = movedKm >= minMoveKm;
  const staleEnough = Date.now() - (state.locationLastAcceptedAt || 0) >= (state.navigationActive ? 3500 : 10000);
  return improved || movedEnough || staleEnough;
}

function buildRefinedLocation() {
  const now = Date.now();
  const recentSamples = state.locationSamples.filter((sample) => isValidLatLng(sample) && now - sample.timestamp <= GPS_SAMPLE_WINDOW_MS);
  const samples = recentSamples.length ? recentSamples : state.locationSamples.filter((sample) => isValidLatLng(sample));
  if (!samples.length) return state.userLocation;

  const best = samples.reduce((current, sample) => (sample.accuracy < current.accuracy ? sample : current), samples[0]);
  const latest = samples[0];
  const cluster = samples.filter((sample) => {
    const radiusKm = Math.max(state.navigationActive ? 0.018 : 0.03, best.accuracy / 1000 * (state.navigationActive ? 2.8 : 2.2));
    return haversineKm(sample.lat, sample.lng, best.lat, best.lng) <= radiusKm && sample.accuracy <= Math.max(best.accuracy * 1.8, state.navigationActive ? 45 : 60);
  });
  const stableCluster = cluster.length ? cluster : [best];

  let latSum = 0;
  let lngSum = 0;
  let weightSum = 0;
  stableCluster.forEach((sample) => {
    const weight = 1 / Math.max(sample.accuracy, 5) ** 2;
    latSum += sample.lat * weight;
    lngSum += sample.lng * weight;
    weightSum += weight;
  });

  const averageAccuracy = stableCluster.reduce((sum, sample) => sum + sample.accuracy, 0) / stableCluster.length;
  const latestIsUsableForNavigation =
    state.navigationActive &&
    latest &&
    latest.accuracy <= Math.max(best.accuracy * 1.55, 35) &&
    haversineKm(latest.lat, latest.lng, latSum / weightSum, lngSum / weightSum) <= Math.max(0.025, latest.accuracy / 1000 * 1.7);
  if (latestIsUsableForNavigation) {
    return {
      lat: latest.lat * 0.72 + (latSum / weightSum) * 0.28,
      lng: latest.lng * 0.72 + (lngSum / weightSum) * 0.28,
      accuracy: Math.max(5, Math.min(latest.accuracy, averageAccuracy * 0.95)),
      heading: latest.heading ?? best.heading ?? null,
      speed: latest.speed ?? best.speed ?? null,
      timestamp: latest.timestamp || now
    };
  }
  return {
    lat: latSum / weightSum,
    lng: lngSum / weightSum,
    accuracy: Math.max(5, Math.min(best.accuracy, averageAccuracy * 0.92)),
    heading: latest.heading ?? best.heading ?? null,
    speed: latest.speed ?? best.speed ?? null,
    timestamp: latest.timestamp || now
  };
}

async function fetchRoute() {
  const school = getSelectedSchool();
  if (!school || !isValidLatLng(state.userLocation) || !isValidLatLng(school)) return;

  const requestId = ++state.routeRequestId;
  const strategy = getRouteStrategy(state.commute);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    if (state.commute === "bus") {
      const transitCandidate = getTransitCandidateForRouting();
      if (!transitCandidate || !state.transitPlan?.candidates?.length) {
        state.route = buildFallbackRoute(school);
        return;
      }
      const transitRoute = await buildTransitCompositeRoute(transitCandidate, school, controller.signal);
      if (requestId !== state.routeRequestId || getSelectedSchool()?.id !== school.id) return;
      if (transitRoute) {
        state.route = transitRoute;
        return;
      }
      throw new Error("no confirmed transit route");
    }

    const { routeChoice, route } = await fetchRoadRouteBetween(
      state.userLocation,
      school,
      strategy.profile,
      state.commute,
      state.mode,
      controller.signal
    );
    if (requestId !== state.routeRequestId || getSelectedSchool()?.id !== school.id) return;
    const rawCoordinates = route.geometry?.coordinates || [];
    const coordinates = buildCommuteRouteCoordinates(rawCoordinates, school, state.commute, state.mode, routeChoice);
    const distanceFactor = strategy.distanceFactor?.[state.mode] || 1;
    const modeDistanceFactor = getRouteChoiceDistanceFactor(routeChoice, state.mode);
    state.route = {
      source: getRouteSourceLabel(state.commute, state.mode, true),
      profile: strategy.profile,
      commuteKey: state.commute,
      modeKey: state.mode,
      destinationSchoolId: school.id,
      distanceKm: Math.max(0.35, (route.distance / 1000) * distanceFactor * modeDistanceFactor),
      turns: estimateTurns(coordinates),
      coordinates,
      detailPoints: makeDetailPoints(coordinates)
    };
  } catch {
    if (requestId !== state.routeRequestId || getSelectedSchool()?.id !== school.id) return;
    const canKeepCurrentRoute =
      state.route?.destinationSchoolId === school.id &&
      state.route?.commuteKey === state.commute &&
      state.route?.modeKey === state.mode &&
      Array.isArray(state.route?.coordinates) &&
      state.route.coordinates.length >= 2;
    if (!canKeepCurrentRoute) state.route = buildFallbackRoute(school);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRoadRouteBetween(origin, destination, profile, commuteKey = state.commute, modeKey = state.mode, signal = undefined) {
  if (!isValidLatLng(origin) || !isValidLatLng(destination)) throw new Error("invalid route endpoint");
  if (commuteKey === "scooter") {
    return fetchValhallaScooterRoute(origin, destination, modeKey, signal);
  }
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const template = getRoutingUrlTemplate(commuteKey);
  const url = template
    .replace("{profile}", profile)
    .replace("{coordinates}", coords)
    .replace("{query}", "overview=full&geometries=geojson&steps=true&alternatives=3");
  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`route ${response.status}`);
  const payload = await response.json();
  const routeChoice = chooseRouteForCommute(payload.routes || [], commuteKey, modeKey);
  const route = routeChoice?.route;
  if (!route) throw new Error("no route");
  if (isRestrictedRoadRoute(routeChoice, commuteKey)) throw new Error("restricted road for commute mode");
  return { routeChoice, route };
}

async function fetchValhallaScooterRoute(origin, destination, modeKey, signal) {
  const payload = {
    locations: [
      { lat: origin.lat, lon: origin.lng },
      { lat: destination.lat, lon: destination.lng }
    ],
    costing: "motor_scooter",
    units: "kilometers",
    directions_options: { units: "kilometers" },
    costing_options: {
      motor_scooter: {
        shortest: modeKey === "fast",
        use_highways: 0
      }
    }
  };
  const url = `https://valhalla1.openstreetmap.de/route?json=${encodeURIComponent(JSON.stringify(payload))}`;
  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`scooter route ${response.status}`);
  const data = await response.json();
  if (Number(data?.trip?.status) !== 0 || !Array.isArray(data.trip.legs) || !data.trip.legs.length) {
    throw new Error("no scooter route");
  }
  const coordinates = mergeRouteCoordinates(data.trip.legs.map((leg) => decodePolyline6(leg.shape || "")));
  if (coordinates.length < 2) throw new Error("invalid scooter geometry");
  const route = {
    distance: Number(data.trip.summary?.length || 0) * 1000,
    duration: Number(data.trip.summary?.time || 0),
    geometry: { coordinates },
    legs: data.trip.legs.map((leg) => ({
      steps: (leg.maneuvers || []).map((maneuver) => ({ name: maneuver.street_names?.join(" ") || maneuver.instruction || "" }))
    }))
  };
  return {
    route,
    routeChoice: {
      route,
      distanceKm: route.distance / 1000,
      turns: estimateRouteTurns(route),
      curveRisk: estimateRouteCurveRisk(coordinates),
      restrictedRisk: 0,
      rank: 0,
      candidateCount: 1
    }
  };
}

function decodePolyline6(encoded) {
  if (!encoded) return [];
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    const values = [];
    for (let coordinateIndex = 0; coordinateIndex < 2; coordinateIndex += 1) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        if (index >= encoded.length) return coordinates;
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      values.push((result & 1) ? ~(result >> 1) : (result >> 1));
    }
    lat += values[0];
    lng += values[1];
    coordinates.push([lng / 1e6, lat / 1e6]);
  }
  return coordinates;
}

function getRoutingUrlTemplate(commuteKey) {
  if (commuteKey === "walk") {
    return "https://routing.openstreetmap.de/routed-foot/route/v1/driving/{coordinates}?{query}";
  }
  if (commuteKey === "bike") {
    return "https://routing.openstreetmap.de/routed-bike/route/v1/driving/{coordinates}?{query}";
  }
  return APP_CONFIG.routingUrlTemplate || "https://router.project-osrm.org/route/v1/{profile}/{coordinates}?{query}";
}

async function buildTransitCompositeRoute(candidate, school, signal = undefined) {
  if (!candidate?.originStop || !candidate?.schoolStop || !isValidLatLng(state.userLocation) || !isValidLatLng(school)) return null;
  const accessProfile = getRouteStrategy("walk").profile;
  const busProfile = getRouteStrategy("bus").profile;
  const [accessToStop, rideToSchoolStop, accessToSchool] = await Promise.all([
    fetchRoadRouteBetween(state.userLocation, candidate.originStop, accessProfile, "walk", "safe", signal),
    fetchRoadRouteBetween(candidate.originStop, candidate.schoolStop, busProfile, "bus", state.mode, signal),
    fetchRoadRouteBetween(candidate.schoolStop, school, accessProfile, "walk", "safe", signal)
  ]);
  const segments = [accessToStop, rideToSchoolStop, accessToSchool].map((segment) => segment.route);
  const coordinates = mergeRouteCoordinates(segments.map((route) => route.geometry?.coordinates || []));
  if (coordinates.length < 2) return null;
  const distanceKm = segments.reduce((sum, route) => sum + Math.max(0, Number(route.distance) || 0) / 1000, 0);
  return {
    source: "公車分段路線（步行接駁 + 公車行駛路網）",
    profile: "transit",
    commuteKey: "bus",
    modeKey: state.mode,
    distanceKm: Math.max(0.35, distanceKm),
    turns: clamp(segments.reduce((sum, route) => sum + estimateRouteTurns(route), 0), 0, 24),
    coordinates,
    detailPoints: makeDetailPoints(coordinates),
    transitCandidateKey: candidate.routeKey,
    destinationSchoolId: school.id
  };
}

function mergeRouteCoordinates(routeCoordinateSets) {
  const merged = [];
  routeCoordinateSets.forEach((coordinates) => {
    const safeCoordinates = Array.isArray(coordinates)
      ? coordinates.filter((point) => Array.isArray(point) && point.length >= 2 && point.every((value) => Number.isFinite(Number(value))))
      : [];
    safeCoordinates.forEach((point) => {
      const last = merged[merged.length - 1];
      if (last && Math.abs(last[0] - point[0]) < 0.000001 && Math.abs(last[1] - point[1]) < 0.000001) return;
      merged.push(point);
    });
  });
  return merged;
}

async function updateTransitPlan(school) {
  if (state.commute !== "bus") {
    state.transitPlan = null;
    renderTransitPanel();
    renderTransitMarkers();
    return;
  }

  if (!school || !isValidLatLng(school)) return;
  if (!isValidLatLng(state.userLocation)) {
    state.transitPlan = { status: "need-location" };
    renderTransitPanel();
    renderTransitMarkers();
    return;
  }

  const origin = state.userLocation;
  const cacheKey = [
    school.id,
    origin.lat.toFixed(3),
    origin.lng.toFixed(3),
    school.lat.toFixed(3),
    school.lng.toFixed(3)
  ].join(":");
  const cached = state.transitCache.get(cacheKey);
  if (cached && Date.now() - cached.updatedAt < TRANSIT_SEARCH.cacheMs) {
    state.transitPlan = cached.plan;
    renderTransitPanel();
    renderTransitMarkers();
    return;
  }

  // The 15-second dashboard refresh must not duplicate an identical Overpass request.
  if (state.transitRequestKey === cacheKey && state.transitPlan?.status === "loading") return;

  const requestId = ++state.transitRequestId;
  state.transitRequestKey = cacheKey;
  if (state.transitTimeoutId) clearTimeout(state.transitTimeoutId);
  state.transitPlan = { status: "loading" };
  renderTransitPanel();
  state.transitTimeoutId = setTimeout(() => {
    if (requestId !== state.transitRequestId || state.commute !== "bus") return;
    if (state.transitPlan?.status !== "loading") return;
    state.transitPlan = { status: "timeout" };
    renderTransitPanel();
    renderTransitMarkers();
  }, 12000);

  try {
    const [originArea, schoolArea] = await Promise.all([
      fetchTransitArea(origin, TRANSIT_SEARCH.originRadius),
      fetchTransitArea(school, TRANSIT_SEARCH.schoolRadius)
    ]);
    if (requestId !== state.transitRequestId || state.commute !== "bus") return;

    const candidates = buildTransitCandidates(originArea, schoolArea);
    const plan = {
      status: "ready",
      originStops: originArea.stops,
      schoolStops: schoolArea.stops,
      originRoutes: originArea.routes,
      schoolRoutes: schoolArea.routes,
      candidates,
      updatedAt: Date.now()
    };
    state.selectedTransitCandidateIndex = 0;
    state.transitPlan = plan;
    state.transitCache.set(cacheKey, { plan, updatedAt: Date.now() });
    if ((plan.candidates?.length || (plan.originStops?.length && plan.schoolStops?.length)) && isValidLatLng(state.userLocation)) {
      await fetchRoute();
    }
  } catch {
    if (requestId !== state.transitRequestId || state.commute !== "bus") return;
    const canUseRecentSuccess = cached && Date.now() - cached.updatedAt < TRANSIT_SEARCH.staleCacheMs;
    state.transitPlan = canUseRecentSuccess
      ? { ...cached.plan, status: "ready", isStale: true }
      : { status: "error" };
  } finally {
    if (requestId === state.transitRequestId) {
      state.transitRequestKey = "";
      if (state.transitTimeoutId) {
        clearTimeout(state.transitTimeoutId);
        state.transitTimeoutId = null;
      }
    }
  }
  renderTransitPanel();
  renderTransitMarkers();
}

async function fetchTransitArea(point, radiusMeters) {
  const query = `
    [out:json][timeout:8];
    (
      node(around:${Math.round(radiusMeters)},${point.lat},${point.lng})["highway"="bus_stop"];
      node(around:${Math.round(radiusMeters)},${point.lat},${point.lng})["public_transport"]["bus"!="no"];
      relation(around:${Math.round(radiusMeters)},${point.lat},${point.lng})["route"="bus"];
    );
    out body ${TRANSIT_SEARCH.maxStops * 5};
  `;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8500);
  try {
    const response = await fetch(TRANSIT_SEARCH.endpoint, {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`transit ${response.status}`);
    const payload = await response.json();
    const stops = (payload.elements || [])
      .filter((item) => item.type === "node" && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)))
      .map((item) => normalizeBusStop(item, point))
      .sort((a, b) => a.distanceM - b.distanceM);
    const routes = (payload.elements || [])
      .filter((item) => item.type === "relation")
      .map(normalizeBusRoute)
      .filter((route) => route.key)
      .filter((route, index, all) => all.findIndex((item) => item.key === route.key) === index)
      .slice(0, TRANSIT_SEARCH.maxRoutes);
    return {
      stops: attachConfirmedRoutesToStops(stops, routes).slice(0, TRANSIT_SEARCH.maxStops),
      routes
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeBusStop(item, point) {
  const tags = item.tags || {};
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  return {
    id: String(item.id),
    name: tags.name || tags["name:zh"] || tags["name:zh-TW"] || tags.ref || "未命名站牌",
    lat,
    lng,
    distanceM: haversineKm(point.lat, point.lng, lat, lng) * 1000,
    routes: extractBusRouteRefs(tags).map((route) => ({
      key: normalizeTransitRouteKey(route),
      label: route
    })).filter((route) => route.key)
  };
}

function normalizeBusRoute(item) {
  const tags = item.tags || {};
  const ref = tags.ref || tags.route_ref || tags["ref:zh"] || "";
  const name = tags.name || tags["name:zh"] || tags["name:zh-TW"] || "";
  const label = ref && name && !name.includes(ref) ? `${ref} ${name}` : ref || name;
  return {
    id: String(item.id),
    key: normalizeTransitRouteKey(ref || name),
    label: label || "未命名路線",
    ref,
    name,
    memberNodeIds: (item.members || [])
      .filter((member) => member.type === "node")
      .map((member) => String(member.ref))
  };
}

function attachConfirmedRoutesToStops(stops, routes) {
  const routesByStopId = new Map();
  routes.forEach((route) => {
    (route.memberNodeIds || []).forEach((stopId) => {
      if (!routesByStopId.has(stopId)) routesByStopId.set(stopId, []);
      routesByStopId.get(stopId).push({ key: route.key, label: route.label });
    });
  });
  return stops.map((stop) => {
    const confirmed = routesByStopId.get(stop.id) || [];
    const merged = [...(stop.routes || []), ...confirmed]
      .filter((route) => route.key)
      .filter((route, index, all) => all.findIndex((item) => item.key === route.key) === index);
    return { ...stop, routes: merged };
  });
}

function extractBusRouteRefs(tags) {
  const text = [
    tags.route_ref,
    tags.routes,
    tags.ref,
    tags["bus:ref"],
    tags.description
  ].filter(Boolean).join(";");
  return [...new Set(text
    .split(/[;,、，/| ]+/)
    .map((item) => item.trim())
    .filter((item) => item && item.length <= 12 && /[0-9A-Za-z\u4e00-\u9fff]/.test(item)))];
}

function normalizeTransitRouteKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[路線公車客運]/g, "")
    .trim();
}

function buildTransitCandidates(originArea, schoolArea) {
  const originRouteMap = buildRouteMap(originArea);
  const schoolRouteMap = buildRouteMap(schoolArea);
  const sharedKeys = [...originRouteMap.keys()].filter((key) => schoolRouteMap.has(key));

  const directCandidates = sharedKeys.map((key) => {
    const originRoute = originRouteMap.get(key);
    const schoolRoute = schoolRouteMap.get(key);
    const originStop = findBestStopForRoute(originArea.stops, key) || originArea.stops[0];
    const schoolStop = findBestStopForRoute(schoolArea.stops, key) || schoolArea.stops[0];
    const confidence = (originStop?.routes || []).some((route) => route.key === key) && (schoolStop?.routes || []).some((route) => route.key === key)
      ? 0
      : 1;
    return {
      routeKey: key,
      routeLabel: originRoute.label || schoolRoute.label || key,
      type: "direct",
      originStop,
      schoolStop,
      confidence,
      walkM: (originStop?.distanceM || 9999) + (schoolStop?.distanceM || 9999)
    };
  })
    .filter((candidate) => candidate.originStop && candidate.schoolStop)
    .sort((a, b) => a.confidence - b.confidence || a.walkM - b.walkM)
    .slice(0, TRANSIT_SEARCH.maxCandidates);

  if (directCandidates.length) return directCandidates;

  const originRoutes = [...originRouteMap.values()].slice(0, 3);
  const schoolRoutes = [...schoolRouteMap.values()].slice(0, 3);
  const transferCandidates = [];
  originRoutes.forEach((originRoute) => {
    schoolRoutes.forEach((schoolRoute) => {
      const originStop = findBestStopForRoute(originArea.stops, originRoute.key) || originArea.stops[0];
      const schoolStop = findBestStopForRoute(schoolArea.stops, schoolRoute.key) || schoolArea.stops[0];
      if (!originStop || !schoolStop) return;
      transferCandidates.push({
        routeKey: `${originRoute.key}-${schoolRoute.key}`,
        routeLabel: `${originRoute.label} → ${schoolRoute.label}`,
        originRouteLabel: originRoute.label,
        schoolRouteLabel: schoolRoute.label,
        type: "transfer",
        originStop,
        schoolStop,
        confidence: 2,
        walkM: (originStop.distanceM || 9999) + (schoolStop.distanceM || 9999)
      });
    });
  });
  return transferCandidates
    .sort((a, b) => a.walkM - b.walkM)
    .slice(0, TRANSIT_SEARCH.maxCandidates);
}

function buildRouteMap(area) {
  const routes = new Map();
  (area.routes || []).forEach((route) => {
    if (route.key && !routes.has(route.key)) routes.set(route.key, route);
  });
  (area.stops || []).forEach((stop) => {
    (stop.routes || []).forEach((route) => {
      if (route.key && !routes.has(route.key)) routes.set(route.key, route);
    });
  });
  return routes;
}

function findBestStopForRoute(stops, routeKey) {
  return stops.find((stop) => (stop.routes || []).some((route) => route.key === routeKey));
}

async function updateWeather(school) {
  if (!school || !isValidLatLng(school)) return;
  const key = `${school.id}:${school.lat.toFixed(3)},${school.lng.toFixed(3)}`;
  const cached = state.weatherCache.get(key);
  if (cached && Date.now() - cached.updatedAt < 10 * 60 * 1000) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${school.lat}&longitude=${school.lng}&current=temperature_2m,precipitation,weather_code&timezone=Asia%2FTaipei`;
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`weather ${response.status}`);
    const payload = await response.json();
    const current = payload.current || {};
    state.weatherCache.set(key, {
      temperature: Number(current.temperature_2m),
      precipitation: Math.max(0, Number(current.precipitation) || 0),
      code: Number(current.weather_code),
      summary: getWeatherSummary(Number(current.weather_code), Number(current.precipitation) || 0),
      updatedAt: Date.now()
    });
  } catch {
    if (!cached) {
      state.weatherCache.set(key, {
        temperature: null,
        precipitation: 0,
        code: null,
        summary: "天氣暫不可用",
        updatedAt: Date.now(),
        unavailable: true
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

function getSchoolWeather(school) {
  if (!school || !isValidLatLng(school)) return null;
  const key = `${school.id}:${school.lat.toFixed(3)},${school.lng.toFixed(3)}`;
  const weather = state.weatherCache.get(key);
  if (!weather || weather.unavailable || !Number.isFinite(weather.temperature)) return null;
  return weather;
}

function getWeatherSummary(code, precipitation = 0) {
  if (precipitation >= 4) return "明顯降雨";
  if (precipitation > 0) return "短暫降雨";
  if ([0, 1].includes(code)) return "晴到少雲";
  if ([2, 3].includes(code)) return "多雲";
  if ([45, 48].includes(code)) return "霧或低能見度";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "降雨機率高";
  if ([95, 96, 99].includes(code)) return "雷雨風險";
  return "天氣穩定";
}

function getWeatherRisk(weather) {
  if (!weather) return 0;
  if (weather.summary.includes("雷雨")) return 12;
  if (weather.precipitation >= 4) return 10;
  if (weather.precipitation > 0) return 5;
  if (weather.summary.includes("霧")) return 6;
  return 0;
}

async function activateInAppNavigation() {
  const school = getSelectedSchool();
  if (!school || !isValidLatLng(school)) return;
  state.navigationActive = true;
  state.navigationArrived = false;
  state.navigationStartedAt = Date.now();
  state.navigationLastRouteAt = 0;
  state.navigationLastDistanceKm = null;
  state.navigationLastRouteOrigin = isValidLatLng(state.userLocation)
    ? { lat: state.userLocation.lat, lng: state.userLocation.lng }
    : null;
  state.navigationFollowUser = true;
  if (isValidLatLng(state.userLocation)) {
    await fetchRoute();
    state.navigationLastRouteAt = Date.now();
  }
  requestNavigationWakeLock();
  requestLocation({ keepTracking: true }).catch(() => {});
  await updateAll(true);
  if (isValidLatLng(state.userLocation)) {
    state.map?.setView([state.userLocation.lat, state.userLocation.lng], Math.max(state.map.getZoom(), 16), { animate: true });
  } else {
    state.map?.setView([school.lat, school.lng], Math.max(state.map.getZoom(), 14), { animate: true });
  }
  document.getElementById("mobileMapSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  setText("locationStatusText", isValidLatLng(state.userLocation)
    ? "站內導航已依你的目前位置重算。"
    : "站內導航已使用校區周邊基準起點；可按「取得我的定位」改用個人位置。"
  );
}

function updateMapRoute(context) {
  if (!state.map || !window.L) return;
  applyMapOrientation(context);
  if (state.routeLine) {
    state.routeLine.remove();
    state.routeLine = null;
  }
  if (state.userMarker) {
    state.userMarker.remove();
    state.userMarker = null;
  }
  if (state.userAccuracyCircle) {
    state.userAccuracyCircle.remove();
    state.userAccuracyCircle = null;
  }

  const school = context.school;
  state.markers.forEach((marker, id) => {
    const markerSchool = schools.find((item) => item.id === id);
    marker.setStyle({
      radius: id === school.id ? 9 : 6,
      color: id === school.id ? "#12243e" : "#ffffff",
      weight: id === school.id ? 3 : 2,
      fillColor: STAGE_COLORS[markerSchool?.stage] || "#3c7cc4"
    });
  });
  const selectedMarker = state.markers.get(school.id);
  selectedMarker?.setStyle({ radius: 9, color: "#12243e", weight: 3 });

  const routePoints = context.route.coordinates?.length
    ? context.route.coordinates.map(([lng, lat]) => [lat, lng])
    : [];
  const safePoints = routePoints.filter(([lat, lng]) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)));

  if (isValidLatLng(state.userLocation)) {
    const userPoint = [state.userLocation.lat, state.userLocation.lng];
    const originLabel = "你的目前位置";
    if (state.navigationActive && isValidLatLng(state.userLocation)) {
      const heading = hasFiniteValue(state.navigationHeading)
        ? Number(state.navigationHeading)
        : bearingDegrees(state.userLocation.lat, state.userLocation.lng, school.lat, school.lng) || 0;
      const markerHeading = normalizeDegrees(heading - (Number(state.map?.getBearing?.()) || 0));
      state.userMarker = L.marker(userPoint, {
        interactive: true,
        icon: L.divIcon({
          className: "navigation-user-marker-shell",
          html: `<div class="navigation-user-marker" style="--heading:${markerHeading}deg"><span></span></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(state.map).bindPopup(originLabel);
    } else {
      state.userMarker = L.circleMarker(userPoint, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#0f172a",
        fillOpacity: 0.95
      }).addTo(state.map).bindPopup(originLabel);
    }

    if (Number.isFinite(Number(state.userLocation.accuracy))) {
      state.userAccuracyCircle = L.circle([state.userLocation.lat, state.userLocation.lng], {
        radius: clamp(Number(state.userLocation.accuracy), 8, 180),
        color: "#2563eb",
        weight: 1,
        opacity: 0.28,
        fillColor: "#2563eb",
        fillOpacity: 0.08,
        interactive: false
      }).addTo(state.map);
    }
  }

  if (safePoints.length >= 2) {
    const lineStyle = getRouteLineStyle(state.commute, state.mode);
    state.routeLine = L.polyline(safePoints, {
      className: "commute-route-line",
      color: lineStyle.color,
      weight: state.navigationActive ? 7 : 5,
      opacity: state.navigationActive ? 0.95 : 0.82,
      dashArray: lineStyle.dashArray
    }).addTo(state.map);
  }

  if (state.mapFocusUserRequested && isValidLatLng(state.userLocation)) {
    centerMapOnUser();
    state.mapFocusUserRequested = false;
  } else if (state.navigationActive && isValidLatLng(state.userLocation) && state.navigationFollowUser) {
    centerMapOnUser();
  } else if (!state.navigationActive && isValidLatLng(state.userLocation) && state.routeLine) {
    state.map.fitBounds(state.routeLine.getBounds().pad(0.2));
  }
  renderTransitMarkers();
}

function getRouteLineStyle(commuteKey = state.commute, modeKey = state.mode) {
  const colors = {
    walk: "#16815c",
    bike: "#2563eb",
    scooter: "#d97706",
    car: "#334155",
    bus: "#7c3aed"
  };
  const dashByMode = modeKey === "fast" ? "12 10" : null;
  const dashByCommute = commuteKey === "bus" ? "6 8" : commuteKey === "bike" ? "14 7" : dashByMode;
  return {
    color: colors[commuteKey] || colors.walk,
    dashArray: dashByMode || dashByCommute
  };
}

function renderTransitMarkers() {
  if (!state.map || !window.L) return;
  state.transitMarkers.forEach((marker) => marker.remove());
  state.transitMarkers = [];
  if (state.commute !== "bus" || !state.transitPlan) return;
  const selectedCandidate = state.transitPlan.candidates?.[state.selectedTransitCandidateIndex] || state.transitPlan.candidates?.[0];

  const stops = [
    { stop: selectedCandidate?.originStop || state.transitPlan.originStops?.[0], label: "建議上車站", color: "#2563eb" },
    { stop: selectedCandidate?.schoolStop || state.transitPlan.schoolStops?.[0], label: "學校附近下車站", color: "#0f8b76" }
  ];
  stops.forEach(({ stop, label, color }) => {
    if (!stop || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) return;
    const marker = L.circleMarker([stop.lat, stop.lng], {
      radius: 7,
      color: "#ffffff",
      weight: 3,
      fillColor: color,
      fillOpacity: 0.92
    }).addTo(state.map).bindPopup(`${label}<br>${escapeHtml(stop.name)}`);
    state.transitMarkers.push(marker);
  });
}

async function updateCameras(context) {
  const target = { lat: context.school.lat, lng: context.school.lng };
  const endpoint = APP_CONFIG.cameraLookupEndpoint || "/__camera_lookup.json";
  const cameraKey = getCameraCacheKey(context.school, target);
  try {
    const response = await fetch(`${endpoint}?lat=${target.lat.toFixed(6)}&lng=${target.lng.toFixed(6)}`, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("application/json")) throw new Error("Camera API unavailable");
    const payload = await response.json();
    if (!Array.isArray(payload.cameras)) throw new Error("Invalid camera response");
    state.cameras = payload.cameras;
    state.cameraCacheKey = cameraKey;
    state.cameraLastUpdated = Date.now();
  } catch {
    // Keep the last valid feed visible when the public data service briefly fails.
  }
  renderCameras(context);
}

function renderCameras(context) {
  const cards = [
    { screen: els.cameraScreenA, link: els.cameraLinkA, img: els.cameraImageA, video: els.cameraVideoA, title: els.cameraTitleA, meta: els.cameraMetaA, status: els.cameraStatusA },
    { screen: els.cameraScreenB, link: els.cameraLinkB, img: els.cameraImageB, video: els.cameraVideoB, title: els.cameraTitleB, meta: els.cameraMetaB, status: els.cameraStatusB }
  ];

  cards.forEach((card, index) => {
    const camera = state.cameras[index];
    if (!camera) {
      resetCameraMedia(card, index);
      card.screen?.classList.remove("has-live", "is-loading", "is-error");
      card.screen?.classList.add("is-empty");
      if (card.link) card.link.removeAttribute("href");
      setNodeText(card.title, index === 0 ? "附近尚無公開影像" : "等待其他公開來源");
      setNodeText(card.meta, context.school.town);
      setNodeText(card.status, "系統會持續查詢，不會以模擬畫面替代");
      return;
    }

    const mediaKey = `${camera.id || index}:${camera.imageUrl || camera.streamUrl || "none"}`;
    if (card.screen?.dataset.cameraMediaKey !== mediaKey) {
      resetCameraMedia(card, index);
      if (card.screen) card.screen.dataset.cameraMediaKey = mediaKey;
      setupCameraMedia(card, camera, index);
    }
    if (card.link) card.link.href = camera.pageUrl || camera.imageUrl || camera.streamUrl || "#";
    setNodeText(card.title, camera.shortTitle || camera.title || `公開鏡頭 ${index + 1}`);
    setNodeText(card.meta, camera.sourceName || "公開交通影像");
    setNodeText(card.status, camera.statusText || (Number.isFinite(camera.distanceKm) ? `距學校 ${formatCameraDistance(camera.distanceKm)}` : "即時影像載入中"));
  });
}

function setupCameraMedia(card, camera, index) {
  card.screen?.classList.remove("has-live", "is-error", "is-empty");
  card.screen?.classList.add("is-loading");
  const label = camera.shortTitle || camera.title || `公開鏡頭 ${index + 1}`;

  if (card.img && camera.imageUrl) {
    card.img.hidden = false;
    if (card.video) card.video.hidden = true;
    card.img.alt = label;
    card.img.onload = () => markCameraReady(card);
    card.img.onerror = () => markCameraError(card);
    card.img.src = withCacheBuster(camera.imageUrl, state.cameraFrameVersion);
    return;
  }

  if (card.video && camera.streamUrl) {
    card.video.hidden = false;
    if (card.img) card.img.hidden = true;
    card.video.onplaying = () => markCameraReady(card);
    card.video.oncanplay = () => markCameraReady(card);
    card.video.onerror = () => markCameraError(card);
    if (card.video.canPlayType("application/vnd.apple.mpegurl")) {
      card.video.src = camera.streamUrl;
      card.video.play().catch(() => {});
    } else if (window.Hls?.isSupported()) {
      const player = new window.Hls({ liveSyncDurationCount: 2, liveMaxLatencyDurationCount: 5 });
      state.cameraPlayers[index] = player;
      player.on(window.Hls.Events.MANIFEST_PARSED, () => card.video.play().catch(() => {}));
      player.on(window.Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) markCameraError(card);
      });
      player.loadSource(camera.streamUrl);
      player.attachMedia(card.video);
    } else {
      markCameraError(card);
    }
    return;
  }

  markCameraError(card);
}

function resetCameraMedia(card, index) {
  const player = state.cameraPlayers[index];
  if (player) player.destroy();
  state.cameraPlayers[index] = null;
  if (card.img) {
    card.img.onload = null;
    card.img.onerror = null;
    card.img.removeAttribute("src");
    card.img.hidden = false;
  }
  if (card.video) {
    card.video.onplaying = null;
    card.video.oncanplay = null;
    card.video.onerror = null;
    card.video.pause();
    card.video.removeAttribute("src");
    card.video.load();
    card.video.hidden = true;
  }
  if (card.screen) delete card.screen.dataset.cameraMediaKey;
}

function markCameraReady(card) {
  card.screen?.classList.remove("is-loading", "is-error", "is-empty");
  card.screen?.classList.add("has-live");
}

function markCameraError(card) {
  card.screen?.classList.remove("is-loading", "has-live");
  card.screen?.classList.add("is-error");
}

function refreshCameraFrames() {
  state.cameraFrameVersion += 1;
  const images = [els.cameraImageA, els.cameraImageB];
  state.cameras.slice(0, 2).forEach((camera, index) => {
    const image = images[index];
    if (image && camera.imageUrl) image.src = withCacheBuster(camera.imageUrl, state.cameraFrameVersion);
  });
}

async function refreshCameras(force = false) {
  const school = getSelectedSchool();
  if (!school || state.cameraLookupInFlight || (!force && !shouldRefreshCameras(school))) return;
  state.cameraLookupInFlight = true;
  try {
    await updateCameras(buildContext(school));
    if (getSelectedSchool()?.id !== school.id) return;
    const context = buildContext(school);
    renderTopLevel(context);
    renderLists(context);
    renderTraffic(context);
  } finally {
    state.cameraLookupInFlight = false;
  }
}

function withCacheBuster(url, version) {
  try {
    const parsed = new URL(url, location.href);
    parsed.searchParams.set("saferoute_refresh", String(version));
    return parsed.href;
  } catch {
    return url;
  }
}

function formatCameraDistance(distanceKm) {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} 公尺` : `${distanceKm.toFixed(1)} 公里`;
}

function startTimers() {
  state.timers.forEach((timer) => clearInterval(timer));
  state.timers = [];
  state.timers.push(setInterval(() => {
    if (!state.running) return;
    state.remainingMs -= 250;
    if (state.remainingMs <= 0) {
      state.remainingMs = state.refreshMs;
      updateAll();
    }
    setText("countdownValue", `${Math.max(0, state.remainingMs / 1000).toFixed(1)} 秒`);
  }, 250));
  state.timers.push(setInterval(() => {
    if (state.running && document.visibilityState !== "hidden") refreshCameraFrames();
  }, CAMERA_FRAME_REFRESH_MS));
  state.timers.push(setInterval(() => {
    if (state.running && document.visibilityState !== "hidden") void refreshCameras();
  }, CAMERA_LOOKUP_REFRESH_MS));
}

function setupLocalAutoReload() {
  if (!APP_CONFIG.enableLocalAutoReload || !isLocalDevelopmentHost()) return;
  let token = null;
  setInterval(async () => {
    try {
      const response = await fetch(`/__codex_reload.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      if (token && payload.token && payload.token !== token) location.reload();
      token = payload.token || token;
    } catch {
    }
  }, APP_CONFIG.localAutoReloadIntervalMs || 1500);
}

function isLocalDevelopmentHost() {
  return location.protocol === "file:" || ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
}

function getFilteredSchools() {
  const query = normalize(state.query);
  return schools.filter((school) => {
    const stageOk = state.stage === "all" || school.stage === state.stage;
    const text = normalize(`${school.name} ${school.town} ${school.address}`);
    return stageOk && (!query || text.includes(query));
  });
}

function getSelectedSchool() {
  return schools.find((school) => school.id === state.selectedId) || schools[0];
}

function getStableRisk(school) {
  const text = `${school.name}${school.town}${school.address}`;
  let hash = 0;
  for (let index = 0; index < text.length; index++) hash = (hash * 31 + text.charCodeAt(index)) % 997;
  const stageRisk =
    school.stage === "kindergarten" ? 10 :
    school.stage === "elementary" ? 8 :
    school.stage === "junior" ? 5 :
    school.stage === "university" ? 2 :
    3;
  const mountainRisk = ["仁愛鄉", "信義鄉", "鹿谷鄉", "魚池鄉"].includes(school.town) ? 9 : 0;
  return 38 + (hash % 20) + stageRisk + mountainRisk;
}

function getTimeBand() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 8) return { label: "上學尖峰", risk: 13, delay: 4 };
  if (hour >= 15 && hour <= 18) return { label: "放學尖峰", risk: 11, delay: 3 };
  if (hour >= 21 || hour <= 5) return { label: "夜間低照度", risk: 8, delay: 1 };
  return { label: "一般時段", risk: 0, delay: 0 };
}

function getHillPenalty(school) {
  if (["仁愛鄉", "信義鄉"].includes(school.town)) return 5;
  if (["鹿谷鄉", "魚池鄉", "國姓鄉"].includes(school.town)) return 3;
  return 1;
}

function estimateCommuteMinutes({ school, commuteKey, commute, modeKey = state.mode, mode, timeBand, route, distanceKm, hillPenalty, routeReliability, weatherRisk = 0 }) {
  const tuning = COMMUTE_TUNING[commuteKey] || COMMUTE_TUNING.walk;
  const movingMinutes = (distanceKm / Math.max(2, commute.speed)) * 60;
  const turnMinutes = route.turns * tuning.turnCost;
  const peakMinutes = timeBand.delay * tuning.peakCost;
  const hillMinutes = hillPenalty * tuning.hillCost;
  const stageMinutes = getStageTimeCost(school.stage) * tuning.stageCost;
  const townMinutes = getTownTimeComplexity(school);
  const waitMinutes = commuteKey === "bus" ? (tuning.waitBase || 0) + peakMinutes * 0.35 : 0;
  const uncertaintyMinutes = routeReliability * tuning.uncertainty + (isValidLatLng(state.userLocation) ? 0 : 1.2);
  const safeModeMinutes = modeKey === "safe" ? Math.min(5.5, distanceKm * 0.65 + route.turns * 0.07) : 0;
  const weatherMinutes = weatherRisk * (commuteKey === "walk" ? 0.18 : commuteKey === "bike" ? 0.14 : commuteKey === "car" ? 0.05 : 0.08);
  const estimate = (movingMinutes + tuning.access + turnMinutes + peakMinutes + hillMinutes + stageMinutes + townMinutes + waitMinutes + uncertaintyMinutes + safeModeMinutes + weatherMinutes) * mode.time;
  return clamp(Math.round(estimate), tuning.min, tuning.max);
}

function getRouteLogicText(context) {
  const base = `距離 ${formatDistance(context.distanceKm)}，依 ${context.route.source} 與 ${context.route.turns} 個轉折點估算。`;
  if (state.commute === "bus") {
    return `${base} 公車班次資料尚未接入，先以步行接駁、候車緩衝與道路距離估算，不提供假班次選項。`;
  }
  if (state.commute === "car") {
    return `${base} 開車模式會提高尖峰車流與校門周邊停靠風險權重。`;
  }
  return base;
}

function getStageTimeCost(stage) {
  if (stage === "kindergarten") return 2.6;
  if (stage === "elementary") return 2.2;
  if (stage === "junior") return 1.4;
  if (stage === "university") return 0.4;
  return 0.8;
}

function getTownTimeComplexity(school) {
  const spread = (school.riskBase % 8) * 0.28;
  const stageBias =
    school.stage === "kindergarten" ? 0.95 :
    school.stage === "elementary" ? 0.8 :
    school.stage === "junior" ? 0.45 :
    school.stage === "university" ? 0.12 :
    0.2;
  return spread + stageBias;
}

function getRouteReliability(route) {
  if (Array.isArray(route.coordinates) && route.coordinates.length >= 2) return 0.8;
  if (isValidLatLng(state.userLocation)) return 1.5;
  return 1.2;
}

function getFactors(school, commute, mode, timeBand, route, weather) {
  const factors = [
    `${timeBand.label}會影響通學時間`,
    `${commute.label}模式需注意路口穿越`,
    `${mode.label}會改變風險與時間權重`,
    `${school.town}周邊地形與道路密度已納入估算`,
    `目前路線約 ${route.turns} 個轉折點`
  ];
  if (state.commute === "bus") factors.unshift("公車班次資料尚未接入，目前只做候車與接駁時間估算");
  if (state.commute === "car") factors.unshift("開車需注意校門臨停、迴轉與尖峰車流");
  if (weather?.precipitation > 0) factors.unshift(`降雨 ${weather.precipitation.toFixed(1)} mm，濕滑與視線風險提高`);
  if (isValidLatLng(state.userLocation)) factors.unshift("已依使用者定位重算");
  return factors;
}

function getRouteStrategy(commuteKey = state.commute) {
  return ROUTE_STRATEGIES[commuteKey] || ROUTE_STRATEGIES.walk;
}

function getRouteSourceLabel(commuteKey = state.commute, modeKey = state.mode, roadNetwork = false) {
  const strategy = getRouteStrategy(commuteKey);
  const label = modeKey === "safe" ? strategy.safeSource : strategy.source;
  if (commuteKey === "bus") return roadNetwork ? `${label}（含站牌接駁估算）` : `${label}（未含即時班次）`;
  return roadNetwork ? label : `${label}備援估算`;
}

function chooseRouteForCommute(routes, commuteKey = state.commute, modeKey = state.mode) {
  const candidates = routes
    .filter((route) => route && Number.isFinite(Number(route.distance)) && Array.isArray(route.geometry?.coordinates))
    .map((route, sourceIndex) => ({
      route,
      sourceIndex,
      distanceKm: route.distance / 1000,
      durationMinutes: Number.isFinite(Number(route.duration)) ? Number(route.duration) / 60 : route.distance / 1000,
      turns: estimateRouteTurns(route),
      curveRisk: estimateRouteCurveRisk(route.geometry.coordinates),
      restrictedRisk: getRestrictedRoadRisk(route, commuteKey)
    }));
  if (!candidates.length) return null;
  const usableCandidates = ["walk", "bike", "scooter"].includes(commuteKey)
    ? candidates.filter((candidate) => candidate.restrictedRisk <= 0)
    : candidates;
  const scoringCandidates = usableCandidates.length ? usableCandidates : candidates;
  const scored = scoringCandidates.map((candidate) => {
    const distanceScore = candidate.distanceKm;
    const timeScore = candidate.durationMinutes / 12;
    const turnScore = candidate.turns * 0.12;
    const curveScore = candidate.curveRisk * 0.22;
    const commuteSafetyWeight =
      commuteKey === "walk" ? 1.18 :
      commuteKey === "bike" ? 1.05 :
      commuteKey === "bus" ? 0.88 :
      commuteKey === "car" ? 0.72 :
      0.82;
    const fastScore = distanceScore * 1.15 + timeScore + turnScore * 0.28;
    const safeScore = distanceScore * 0.7 + (turnScore + curveScore + candidate.restrictedRisk * 8) * commuteSafetyWeight;
    return {
      route: candidate.route,
      distanceKm: candidate.distanceKm,
      turns: candidate.turns,
      curveRisk: candidate.curveRisk,
      restrictedRisk: candidate.restrictedRisk,
      score: modeKey === "fast" ? fastScore : safeScore
    };
  }).sort((a, b) => a.score - b.score);
  const chosen = scored[0];
  return {
    route: chosen.route,
    distanceKm: chosen.distanceKm,
    turns: chosen.turns,
    curveRisk: chosen.curveRisk,
    restrictedRisk: chosen.restrictedRisk,
    rank: chosen.sourceIndex,
    candidateCount: scored.length
  };
}

function isRestrictedRoadRoute(routeChoice, commuteKey = state.commute) {
  return ["walk", "bike", "scooter"].includes(commuteKey) && Number(routeChoice?.restrictedRisk || 0) > 0;
}

function getRestrictedRoadRisk(route, commuteKey = state.commute) {
  if (!["walk", "bike", "scooter"].includes(commuteKey)) return 0;
  const text = collectRouteStepText(route).toLowerCase();
  if (!text) return 0;
  const strictPattern = /(motorway|freeway|controlled_access|國道|高速公路|交流道|匝道)/i;
  const walkBikePattern = /(trunk|expressway|快速道路|快速公路|高架道路|高架橋|環道)/i;
  const bikeExtraPattern = /(禁止自行車|禁行自行車)/i;
  const walkExtraPattern = /(禁止行人|禁行行人|行人禁止)/i;
  let risk = strictPattern.test(text) ? 1 : 0;
  if (["walk", "bike"].includes(commuteKey) && walkBikePattern.test(text)) risk += 1;
  if (commuteKey === "scooter" && /(expressway|快速道路|快速公路)/i.test(text)) risk += 1;
  if (commuteKey === "bike" && bikeExtraPattern.test(text)) risk += 1;
  if (commuteKey === "walk" && walkExtraPattern.test(text)) risk += 1;
  return risk;
}

function collectRouteStepText(route) {
  const parts = [];
  const visit = (value) => {
    if (value == null) return;
    if (typeof value === "string" || typeof value === "number") {
      parts.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      ["name", "ref", "destinations", "exits", "rotary_name", "classes", "mode"].forEach((key) => visit(value[key]));
      if (value.maneuver) visit(value.maneuver);
      if (Array.isArray(value.intersections)) value.intersections.forEach(visit);
      if (Array.isArray(value.steps)) value.steps.forEach(visit);
      if (Array.isArray(value.legs)) value.legs.forEach(visit);
    }
  };
  visit(route);
  return parts.join(" ");
}

function estimateRouteTurns(route) {
  const steps = (route?.legs || []).flatMap((leg) => Array.isArray(leg?.steps) ? leg.steps : []);
  if (steps.length) {
    const meaningfulSteps = steps.filter((step) => {
      const type = String(step?.maneuver?.type || "").toLowerCase();
      return !["depart", "arrive"].includes(type) && Number(step?.distance || 0) >= 5;
    });
    return clamp(meaningfulSteps.length, 0, 24);
  }
  return estimateTurns(route?.geometry?.coordinates || []);
}

function getRouteChoiceDistanceFactor(routeChoice, modeKey = state.mode) {
  return 1;
}

function estimateRouteCurveRisk(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 3) return 0;
  const sampled = [coordinates[0]];
  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const previous = sampled[sampled.length - 1];
    const current = coordinates[index];
    if (haversineKm(previous[1], previous[0], current[1], current[0]) >= 0.04) sampled.push(current);
  }
  sampled.push(coordinates[coordinates.length - 1]);
  if (sampled.length < 3) return 0;
  let risk = 0;
  for (let index = 1; index < sampled.length - 1; index++) {
    const previous = sampled[index - 1];
    const current = sampled[index];
    const next = sampled[index + 1];
    if (!previous || !current || !next) continue;
    const before = bearingDegrees(previous[1], previous[0], current[1], current[0]);
    const after = bearingDegrees(current[1], current[0], next[1], next[0]);
    if (!Number.isFinite(before) || !Number.isFinite(after)) continue;
    const delta = Math.abs(((after - before + 540) % 360) - 180);
    if (delta > 20) risk += Math.min(2.5, (delta - 20) / 45);
  }
  return risk;
}

function buildCommuteRouteCoordinates(rawCoordinates, school, commuteKey = state.commute, modeKey = state.mode, routeChoice = null) {
  const base = Array.isArray(rawCoordinates) && rawCoordinates.length >= 2
    ? rawCoordinates.filter((point) => Array.isArray(point) && point.length >= 2 && point.every((value) => Number.isFinite(Number(value))))
    : [];
  if (base.length < 2) return [];
  return base;
}

function normalizeRoute(route, school) {
  const fallback = buildFallbackRoute(school);
  const distanceKm = Number(route?.distanceKm);
  const turns = Number(route?.turns);
  const coordinates = Array.isArray(route?.coordinates)
    ? route.coordinates.filter((point) => Array.isArray(point) && point.length >= 2 && point.every((value) => Number.isFinite(Number(value))))
    : [];
  const detailPoints = Array.isArray(route?.detailPoints) && route.detailPoints.length
    ? route.detailPoints
    : fallback.detailPoints;

  return {
    ...fallback,
    ...route,
    distanceKm: Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : fallback.distanceKm,
    turns: Number.isFinite(turns) ? clamp(Math.round(turns), 0, 24) : fallback.turns,
    coordinates,
    detailPoints
  };
}

function buildFallbackRoute(school) {
  const hasUserLocation = isValidLatLng(state.userLocation);
  const baseDistance = getPlanningDistanceKm(school, hasUserLocation);
  const distanceFactor = getRouteStrategy(state.commute).distanceFactor?.[state.mode] || 1;
  return {
    source: isValidLatLng(state.userLocation) ? "尚未取得可沿道路行走的路線" : "開啟定位後才會顯示真實道路路線",
    profile: getRouteStrategy(state.commute).profile,
    commuteKey: state.commute,
    modeKey: state.mode,
    distanceKm: Math.max(0.4, baseDistance * distanceFactor),
    turns: 0,
    coordinates: [],
    detailPoints: [
      { x: 95, y: 355 },
      { x: 245, y: 318 },
      { x: 390, y: 276 },
      { x: 540, y: 314 },
      { x: 690, y: 285 }
    ]
  };
}

function getPlanningDistanceKm(school, hasUserLocation = isValidLatLng(state.userLocation)) {
  if (hasUserLocation) {
    const directKm = haversineKm(state.userLocation.lat, state.userLocation.lng, school.lat, school.lng);
    const stageFactor = school.stage === "kindergarten" ? 0.1 : school.stage === "elementary" ? 0.08 : school.stage === "university" ? 0.16 : 0.14;
    const roadFactor = 1.22 + getHillPenalty(school) * 0.04 + stageFactor;
    return clamp(directKm * roadFactor, 0.5, 24);
  }

  const stageBase =
    school.stage === "kindergarten" ? 0.35 :
    school.stage === "elementary" ? 0.45 :
    school.stage === "junior" ? 0.7 :
    school.stage === "university" ? 1.25 :
    1.0;
  const variation = (school.riskBase % 10) * 0.08;
  return clamp(stageBase + variation + getHillPenalty(school) * 0.1, 0.4, 2.2);
}

function makeDetailPoints(coordinates) {
  if (!coordinates.length) return buildFallbackRoute(getSelectedSchool()).detailPoints;
  const picks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => coordinates[Math.min(coordinates.length - 1, Math.floor((coordinates.length - 1) * ratio))]);
  return picks.map((point, index) => ({
    x: 90 + index * 150 + (index % 2 ? 18 : -8),
    y: 350 - index * 14 + (index % 2 ? -36 : 24)
  })).concat([{ x: 690, y: 285 }]).slice(0, 6);
}

function estimateTurns(coordinates) {
  if (!coordinates.length) return 5;
  return clamp(Math.round(coordinates.length / 18), 2, 18);
}

function shouldRefreshCameras(school = getSelectedSchool()) {
  const target = { lat: school?.lat, lng: school?.lng };
  const nextKey = getCameraCacheKey(school, target);
  if (nextKey !== state.cameraCacheKey) return true;
  if (!state.cameraLastUpdated) return true;
  return Date.now() - state.cameraLastUpdated >= CAMERA_LOOKUP_REFRESH_MS;
}

function getCameraCacheKey(school, target) {
  const lat = Number(target?.lat);
  const lng = Number(target?.lng);
  const roundedLat = Number.isFinite(lat) ? lat.toFixed(4) : "na";
  const roundedLng = Number.isFinite(lng) ? lng.toFixed(4) : "na";
  return `${school?.id || "unknown"}:${roundedLat},${roundedLng}`;
}

function syncRefreshUi() {
  setText("refreshValue", `${Math.round(state.refreshMs / 1000)} 秒`);
  setText("overviewFrequency", `即時 / ${Math.round(state.refreshMs / 1000)} 秒`);
}

function renderList(node, items, className = "") {
  if (!node) return;
  const safeItems = Array.isArray(items) ? items : [];
  node.innerHTML = safeItems.map((item, index) => `<li class="${className}${index === 0 && className ? " latest" : ""}">${escapeHtml(item)}</li>`).join("");
}

function setText(id, value) {
  setNodeText(els[id], value);
}

function setNodeText(node, value) {
  if (node) node.textContent = String(value);
}

function setSvg(node, html) {
  if (node) node.innerHTML = html;
}

function showFatal(message) {
  document.body.innerHTML = `<main class="page-shell"><section class="panel"><h1>網站暫時無法載入</h1><p>${escapeHtml(message)}</p></section></main>`;
}

function cleanAddress(address) {
  return String(address).replace(/^\[[0-9]+\]/, "").trim();
}

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isValidLatLng(point) {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng));
}

function toRad(value) {
  return value * Math.PI / 180;
}

function bearingDegrees(lat1, lng1, lat2, lng2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) return null;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const lambdaDelta = toRad(lng2 - lng1);
  const y = Math.sin(lambdaDelta) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambdaDelta);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} 公尺`;
  return `${km.toFixed(1)} 公里`;
}

function getRiskLabel(risk) {
  if (risk >= 72) return { text: "高風險" };
  if (risk >= 50) return { text: "中風險" };
  return { text: "低風險" };
}
