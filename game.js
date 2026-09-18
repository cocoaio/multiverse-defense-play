const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const COMPAT_ASSET_MODE = /MicroMessenger|MQQBrowser|UCBrowser|baiduboxapp|Android/i.test(navigator.userAgent);
function createAssetImage(src, eager = false, fallbackSrc = "") {
  const image = new Image();
  image.decoding = "async";
  image.fetchPriority = eager ? "high" : "auto";
  image.dataset.primarySrc = src;
  image.dataset.fallbackSrc = fallbackSrc;
  image.dataset.src = COMPAT_ASSET_MODE && fallbackSrc ? fallbackSrc : src;
  image.dataset.alternateSrc = image.dataset.src === src ? fallbackSrc : src;
  image.dataset.assetState = "idle";
  image.addEventListener("load", () => {
    image.dataset.assetState = "ready";
    image.dispatchEvent(new Event("assetready"));
  });
  image.addEventListener("error", () => {
    if (image.dataset.alternateSrc && image.dataset.alternateTried !== "true") {
      image.dataset.alternateTried = "true";
      image.src = image.dataset.alternateSrc;
      return;
    }
    image.dataset.assetState = "failed";
    image.dispatchEvent(new Event("assetfailed"));
  });
  if (eager) {
    image.dataset.assetState = "loading";
    image.src = image.dataset.src;
  }
  return image;
}

function ensureImageLoaded(image) {
  if (image && !image.src) {
    image.dataset.assetState = "loading";
    image.src = image.dataset.src;
  }
  return image;
}

function waitForAsset(image, timeout = 8500) {
  ensureImageLoaded(image);
  if (image?.complete && image.naturalWidth) return image.decode?.().catch(() => {}).then(() => true) || Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ready) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      image.removeEventListener("assetready", onReady);
      image.removeEventListener("assetfailed", onFailed);
      resolve(ready);
    };
    const onReady = () => image.decode?.().catch(() => {}).finally(() => finish(Boolean(image.naturalWidth))) || finish(Boolean(image.naturalWidth));
    const onFailed = () => finish(false);
    image.addEventListener("assetready", onReady);
    image.addEventListener("assetfailed", onFailed);
    const timer = setTimeout(() => finish(Boolean(image.complete && image.naturalWidth)), timeout);
  });
}

const heroAtlas = createAssetImage("./assets/posters/original/hero-archetypes-v1.webp", false, "./assets/fallback/posters/original/hero-archetypes-v1.png");
const enemyAtlas = createAssetImage("./assets/enemy-worlds-v1.webp", false, "./assets/fallback/enemy-worlds-v1.png");
const cityZombieAtlas = createAssetImage("./assets/city-zombies-v2.png", true, "./assets/fallback/city-zombies-v2.png");
const cultivatorHeroAtlas = createAssetImage("./assets/posters/original/cultivator-heroes-v1.webp", false, "./assets/fallback/posters/original/cultivator-heroes-v1.png");
const cultivatorEnemyAtlas = createAssetImage("./assets/cultivator-enemies-v3.png", false, "./assets/fallback/cultivator-enemies-v3.png");
const hospitalHeroAtlas = createAssetImage("./assets/posters/original/hospital-heroes-v1.webp", false, "./assets/fallback/posters/original/hospital-heroes-v1.png");
const hospitalBattlefield = createAssetImage("./assets/hospital-battlefield-v1.webp", false, "./assets/fallback/hospital-battlefield-v1.jpg");
const cityBattlefield = createAssetImage("./assets/city-battlefield-v1.webp", true, "./assets/fallback/city-battlefield-v1.jpg");
const snowBattlefield = createAssetImage("./assets/snow-battlefield-v1.webp", false, "./assets/fallback/snow-battlefield-v1.jpg");
const orbitBattlefield = createAssetImage("./assets/orbit-battlefield-v1.webp", false, "./assets/fallback/orbit-battlefield-v1.jpg");
const marsBattlefield = createAssetImage("./assets/mars-battlefield-v1.webp", false, "./assets/fallback/mars-battlefield-v1.jpg");
const moonBattlefield = createAssetImage("./assets/moon-battlefield-v1.webp", false, "./assets/fallback/moon-battlefield-v1.jpg");
const cultivationBattlefield = createAssetImage("./assets/cultivation-battlefield-v1.webp", false, "./assets/fallback/cultivation-battlefield-v1.jpg");
const cityHeroAtlas = createAssetImage("./assets/posters/original/city-heroes-v1.webp", true, "./assets/fallback/posters/original/city-heroes-v1.png");
const snowHeroAtlas = createAssetImage("./assets/posters/original/snow-heroes-v1.webp", false, "./assets/fallback/posters/original/snow-heroes-v1.png");
const orbitShipAtlas = createAssetImage("./assets/posters/original/orbit-ships-v1.webp", false, "./assets/fallback/posters/original/orbit-ships-v1.png");
const marsHeroAtlas = createAssetImage("./assets/posters/original/mars-heroes-v1.webp", false, "./assets/fallback/posters/original/mars-heroes-v1.png");
const moonHeroAtlas = createAssetImage("./assets/posters/original/moon-heroes-v1.webp", false, "./assets/fallback/posters/original/moon-heroes-v1.png");
const companionAtlas = createAssetImage("./assets/companions-v1.png", true);
const battlefieldTextures = { city: cityBattlefield, snow: snowBattlefield, hospital: hospitalBattlefield, orbit: orbitBattlefield, mars: marsBattlefield, moon: moonBattlefield, cultivation: cultivationBattlefield };
const sceneHeroAtlases = { city: cityHeroAtlas, snow: snowHeroAtlas, hospital: hospitalHeroAtlas, orbit: orbitShipAtlas, mars: marsHeroAtlas, moon: moonHeroAtlas, cultivation: cultivatorHeroAtlas };
function ensureSceneAssets(sceneId) {
  const assets = [
    battlefieldTextures[sceneId],
    sceneHeroAtlases[sceneId],
    sceneId === "cultivation" ? cultivatorEnemyAtlas : sceneId === "city" ? cityZombieAtlas : enemyAtlas,
    companionAtlas,
  ].filter(Boolean);
  assets.forEach(ensureImageLoaded);
  return assets;
}
async function prepareSceneAssets(sceneId) {
  const results = await Promise.all(ensureSceneAssets(sceneId).map((asset) => waitForAsset(asset)));
  return results.every(Boolean);
}
const W = 390;
const H = 844;
const DPR = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * DPR;
canvas.height = H * DPR;
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

const $ = (selector) => document.querySelector(selector);
const ui = {
  login: $("#loginScreen"),
  guestLogin: $("#guestLoginButton"),
  hud: $("#hud"),
  home: $("#homeScreen"),
  upgrade: $("#upgradeScreen"),
  result: $("#resultScreen"),
  pauseOverlay: $("#pauseOverlay"),
  pauseResume: $("#pauseResumeButton"),
  pauseExit: $("#pauseExitButton"),
  start: $("#startButton"),
  retry: $("#retryButton"),
  homeButton: $("#homeButton"),
  pause: $("#pauseButton"),
  mute: $("#muteButton"),
  adminBadge: $("#adminBadge"),
  commanderRole: $("#commanderRoleText"),
  energyButton: $("#energyButton"),
  energyText: $("#energyText"),
  pulse: $("#pulseButton"),
  pulseCooldown: $("#pulseCooldown"),
  pulseHint: $("#pulseHint"),
  pulseName: $("#pulseName"),
  wave: $("#waveText"),
  mission: $("#missionText"),
  timer: $("#timerText"),
  runCoins: $("#runCoinText"),
  healthFill: $("#healthFill"),
  healthText: $("#healthText"),
  defenseLabel: $("#defenseLabel"),
  xpFill: $("#xpFill"),
  xpText: $("#xpText"),
  level: $("#levelText"),
  combo: $("#combo"),
  comboText: $("#comboText"),
  bossHud: $("#bossHud"),
  bossName: $("#bossName"),
  bossFill: $("#bossFill"),
  livesText: $("#livesText"),
  choices: $("#upgradeChoices"),
  metaUpgrades: $("#metaUpgrades"),
  clearedLevels: $("#clearedLevelText"),
  wins: $("#winsText"),
  bankCoins: $("#bankCoinText"),
  unlockedScenes: $("#unlockedSceneText"),
  commandTab: $("#commandTab"),
  worldTab: $("#worldTab"),
  baseTab: $("#baseTab"),
  armoryTab: $("#armoryTab"),
  commandPanel: $("#commandPanel"),
  worldPanel: $("#worldPanel"),
  basePanel: $("#basePanel"),
  armoryPanel: $("#armoryPanel"),
  gearCollection: $("#gearCollection"),
  petRoster: $("#petRoster"),
  divineGearCard: $("#divineGearCard"),
  equippedGear: $("#equippedGear"),
  armoryAvatarPreview: $("#armoryAvatarPreview"),
  wardrobeHeroName: $("#wardrobeHeroName"),
  wardrobeGearSet: $("#wardrobeGearSet"),
  wardrobeClassSwitch: $("#wardrobeClassSwitch"),
  gearInventory: $("#gearInventory"),
  inventoryCount: $("#inventoryCount"),
  unequipAllGear: $("#unequipAllGear"),
  gearPowerSummary: $("#gearPowerSummary"),
  gearPowerText: $("#gearPowerText"),
  gearBonusList: $("#gearBonusList"),
  accountLevel: $("#accountLevelText"),
  accountTitle: $("#accountTitleText"),
  accountProgress: $("#accountProgressFill"),
  lobbyChapter: $("#lobbyChapterText"),
  lobbyMission: $("#lobbyMissionText"),
  lobbyProgress: $("#lobbyProgressText"),
  lobbyHero: $("#lobbyHero"),
  lobbyClass: $("#lobbyClassName"),
  lobbyPower: $("#lobbyPowerText"),
  equippedCount: $("#equippedCountText"),
  openMap: $("#openMapButton"),
  quickArmory: $("#quickArmoryButton"),
  nextObjective: $("#nextObjectiveButton"),
  coinStoreButton: $("#coinStoreButton"),
  coinStoreModal: $("#coinStoreModal"),
  coinPacks: $("#coinPacks"),
  freeCoinAdButton: $("#freeCoinAdButton"),
  adModal: $("#adModal"),
  adTitle: $("#adTitle"),
  adCountdown: $("#adCountdown"),
  claimAdReward: $("#claimAdReward"),
  retentionModal: $("#retentionModal"),
  retentionKicker: $("#retentionKicker"),
  retentionTitle: $("#retentionTitle"),
  retentionContent: $("#retentionContent"),
  dailyRailBadge: $("#dailyRailBadge"),
  eventRailBadge: $("#eventRailBadge"),
  dungeonRailBadge: $("#dungeonRailBadge"),
  skinRailBadge: $("#skinRailBadge"),
  loadoutModal: $("#loadoutModal"),
  classChoices: $("#classChoices"),
  reviveModal: $("#reviveModal"),
  reviveKicker: $("#reviveKicker"),
  reviveTitle: $("#reviveTitle"),
  reviveDescription: $("#reviveDescription"),
  reviveAdButton: $("#reviveAdButton"),
  endEndlessButton: $("#endEndlessButton"),
  previousScene: $("#previousScene"),
  nextScene: $("#nextScene"),
  sceneCard: $("#sceneCard"),
  sceneIcon: $("#homeSceneIcon"),
  chapter: $("#chapterText"),
  sceneStatus: $("#sceneStatus"),
  sceneName: $("#sceneName"),
  sceneDescription: $("#sceneDescription"),
  sceneHero: $("#sceneHero"),
  sceneProgressFill: $("#sceneProgressFill"),
  sceneProgressText: $("#sceneProgressText"),
  levelGrid: $("#levelGrid"),
  levelModifier: $("#levelModifier"),
  startText: $("#startButtonText"),
  startHint: $("#startButtonHint"),
  resultBadge: $("#resultBadge"),
  resultTitle: $("#resultTitle"),
  resultSubtitle: $("#resultSubtitle"),
  resultTime: $("#resultTime"),
  resultKills: $("#resultKills"),
  resultCoins: $("#resultCoins"),
  resultLevel: $("#resultLevel"),
  resultLoot: $("#resultLoot"),
  resultActionText: $("#resultActionText"),
  toast: $("#toast"),
};

const TOTAL_WAVES = 6;
const LEVELS_PER_SCENE = 12;
const QA_MODE = new URLSearchParams(location.search).get("qa") === "internal";
const ADMIN_MODE = location.protocol === "file:" || new URLSearchParams(location.search).get("admin") === "owner";
const STORAGE_KEY = ADMIN_MODE ? "multiverse-defense-admin-v1" : "multiverse-defense-save-v5";
const BASE_Y = 752;
const EFFECT_LIMITS = { particles: 420, floaters: 70, bursts: 96, shockwaves: 72, corpses: 110, xpDrops: 170, medkits: 28, bullets: 220 };
const ENEMY_GRID_SIZE = 128;
const enemyGridKey = (x, y) => (x + 32768) * 65536 + y + 32768;

const scenes = [
  {
    id: "city", chapter: "第一章", name: "沦陷都市", shortName: "都市", icon: "☣", hero: "♜",
    description: "沿街区推进，夺回被感染者占领的城市核心。",
    player: "自动炮台", enemy: "感染者", boss: "变异暴君", defense: "城墙", pulse: "电磁脉冲", pulseIcon: "ϟ",
    colors: { top: "#07130e", mid: "#172b1d", bottom: "#08110c", grid: "#8db875", wall: "#53665a", dark: "#18241c", shot: "#efff8b", hit: "#a8e767" },
    palette: ["#78bd58", "#d2ae55", "#8a8068", "#9f73c9", "#b985d9", "#b9433d"],
  },
  {
    id: "snow", chapter: "第二章", name: "极地雪原", shortName: "雪原", icon: "❄", hero: "☃",
    description: "穿越暴风雪营地，由雪球先锋守住极地补给线。",
    player: "雪球先锋", enemy: "冰原异变体", boss: "冰封巨兽", defense: "补给线", pulse: "雪崩冲击", pulseIcon: "❄",
    colors: { top: "#081824", mid: "#284a5c", bottom: "#d9edf1", grid: "#c7eaf1", wall: "#d8edf0", dark: "#183444", shot: "#eafbff", hit: "#a7efff" },
    palette: ["#79c8dd", "#e9d58d", "#7896a8", "#9ab7ef", "#c0ddff", "#477da4"],
  },
  {
    id: "hospital", chapter: "第三章", name: "隔离医院", shortName: "医院", icon: "✚", hero: "⚕",
    description: "进入污染病区，医生用抗体弹药清除变异病原体。",
    player: "白衣医生", enemy: "变异病原体", boss: "超级病毒株", defense: "隔离门", pulse: "强效消杀", pulseIcon: "✚",
    colors: { top: "#061714", mid: "#16423a", bottom: "#d8e9e3", grid: "#76b9aa", wall: "#dbe9e3", dark: "#15332c", shot: "#7fffd4", hit: "#58e3b5" },
    palette: ["#55d3ad", "#ffca68", "#4f9e91", "#da70b1", "#f2a7d3", "#a83b75"],
  },
  {
    id: "orbit", chapter: "第四章", name: "近地轨道", shortName: "轨道", icon: "✦", hero: "▲",
    description: "驾驶曙光号离开大气层，拦截逼近空间站的虫群。",
    player: "曙光飞船", enemy: "虚空虫群", boss: "星噬母舰", defense: "空间站", pulse: "引力震荡", pulseIcon: "◎",
    colors: { top: "#030510", mid: "#10143a", bottom: "#090c20", grid: "#6767ca", wall: "#384064", dark: "#11152c", shot: "#8df5ff", hit: "#9d8dff" },
    palette: ["#7d74d6", "#58d5df", "#676baa", "#bd61d6", "#d28bea", "#7b3ea6"],
  },
  {
    id: "mars", chapter: "第五章", name: "火星前哨", shortName: "火星", icon: "◉", hero: "♢",
    description: "在赤色沙暴中启动探路者炮车，击退火星原生族群。",
    player: "探路者炮车", enemy: "火星原生体", boss: "赤岩酋长", defense: "前哨站", pulse: "太阳风暴", pulseIcon: "☀",
    colors: { top: "#180805", mid: "#61291f", bottom: "#8b4930", grid: "#c67a50", wall: "#83472f", dark: "#321711", shot: "#ffd075", hit: "#ff9d5d" },
    palette: ["#74a75a", "#e5b45b", "#8e6e4b", "#9d69b8", "#c98ce0", "#6e9b45"],
  },
  {
    id: "moon", chapter: "第六章", name: "月面遗迹", shortName: "月面", icon: "☾", hero: "♙",
    description: "深入静海遗迹，月兔机甲迎战苏醒的远古守卫。",
    player: "月兔机甲", enemy: "月面守卫", boss: "静海泰坦", defense: "月面基地", pulse: "月震波", pulseIcon: "◌",
    colors: { top: "#070711", mid: "#23233b", bottom: "#55556b", grid: "#9c9bbd", wall: "#69697b", dark: "#222232", shot: "#f0edff", hit: "#c9c4ff" },
    palette: ["#a6a5c4", "#d8c67f", "#72718f", "#8d80bf", "#bbb2df", "#625995"],
  },
  {
    id: "cultivation", chapter: "无尽之境", name: "太虚仙域", shortName: "仙域", icon: "☯", hero: "剑",
    description: "修为无限增长，在宗门战场迎战源源不断的剑修、符修与高阶宗主。",
    player: "御剑修士", enemy: "太虚修士", boss: "太虚宗主", defense: "护山大阵", pulse: "万剑归宗", pulseIcon: "剑", endless: true,
    colors: { top: "#061311", mid: "#17443c", bottom: "#9ab7a4", grid: "#87caaa", wall: "#557468", dark: "#142a24", shot: "#d7ffbd", hit: "#83efbd" },
    palette: ["#67b98c", "#e8d27c", "#698f83", "#a878d0", "#d495bd", "#b7594d"],
  },
];

const cultivationDomains = [
  { name: "宗门外山门", boss: "守山剑魁", accent: "#9be8ba", motif: "gate" },
  { name: "云海试剑台", boss: "飞虹剑尊", accent: "#b9fff2", motif: "swords" },
  { name: "镇魔野岭", boss: "赤煞魔君", accent: "#ff806d", motif: "wild" },
  { name: "飞升大殿", boss: "九霄殿主", accent: "#ffe39a", motif: "hall" },
  { name: "太虚星渊", boss: "星罗道祖", accent: "#c9a7ff", motif: "stars" },
  { name: "天门劫海", boss: "万劫天尊", accent: "#b7dcff", motif: "storm" },
];

const levelModifiers = [
  { max: 3, name: "前沿侦察", detail: "标准敌群", hp: 1, speed: 1, spawn: 1 },
  { max: 6, name: "疾行增援", detail: "移动速度提高", hp: 1.03, speed: 1.13, spawn: 1.04 },
  { max: 9, name: "重甲压境", detail: "重型单位增多", hp: 1.12, speed: 1, spawn: 1.07 },
  { max: 11, name: "精英浪潮", detail: "双重增援", hp: 1.16, speed: 1.06, spawn: 1.16 },
  { max: 12, name: "章节决战", detail: "首领全面强化", hp: 1.22, speed: 1.08, spawn: 1.18 },
];

const classWeaponVisuals = {
  melee: { id: "class-melee", name: "职业近战武器", visual: "blade" },
  ranger: { id: "class-ranger", name: "职业远程武器", visual: "pulse" },
  mage: { id: "class-mage", name: "职业施法媒介", visual: "magic" },
};

const classDefinitions = [
  { id: "melee", icon: "⚔", name: "战士 · 裂刃", color: "#ff8a64", ultimateName: "裁决圣剑", ultimateIcon: "剑", description: "生命 +42%，伤害均衡；短射程环斩，依靠走位贴身清场。", health: 1.42, damage: 1.08, moveSpeed: 142, interval: .7, count: 5, pierce: 3, explosion: 0, radius: 48, slow: 0, crit: .03, speed: 540, life: .28, spread: .34, style: "blade" },
  { id: "ranger", icon: "⌖", name: "远战 · 追猎", color: "#77eeff", ultimateName: "天穹飞艇", ultimateIcon: "✈", description: "生命均衡、单发伤害较低；拥有最高射程和稳定穿透。", health: 1, damage: .74, moveSpeed: 156, interval: .88, count: 1, pierce: 2, explosion: .05, radius: 50, slow: 0, crit: .1, speed: 680, life: 2.1, spread: .04, style: "shot" },
  { id: "mage", icon: "✧", name: "法师 · 星咒", color: "#c993ff", ultimateName: "星界禁咒", ultimateIcon: "✧", description: "生命 -32%，伤害 +68%；中等射程，擅长范围爆破与减速。", health: .68, damage: 1.68, moveSpeed: 148, interval: 1.12, count: 3, pierce: 0, explosion: .3, radius: 72, slow: .22, crit: .08, speed: 430, life: 1.3, spread: .12, style: "orb" },
];

const sceneClassProfiles = {
  city: {
    melee: { name: "破障突击员", short: "突击员", description: "动力刃近身破阵，高生命并能震退感染群。", color: "#ff8a64", fx: "powerArc", ultimateType: "breach", ultimateName: "天罚动力刃", ultimateIcon: "刃" },
    ranger: { name: "街区神射手", short: "神射手", description: "磁轨步枪远距点杀，以贯穿弹清理尸潮。", color: "#77eeff", fx: "tracer", ultimateType: "droneBarrage", ultimateName: "无人机火力网", ultimateIcon: "机" },
    mage: { name: "电弧工程师", short: "工程师", description: "部署高压电弧核心，范围连锁但自身防护较弱。", color: "#c8a2ff", fx: "tesla", ultimateType: "teslaStorm", ultimateName: "全城电涌", ultimateIcon: "电" },
  },
  snow: {
    melee: { name: "极地破冰手", short: "破冰手", description: "挥动寒冰重锤近身破阵，落锤打散冻原敌群。", color: "#dff8ff", fx: "snowball", ultimateType: "avalanche", ultimateName: "雪崩重锤", ultimateIcon: "雪" },
    ranger: { name: "雪原投掷手", short: "投掷手", description: "远距投射高速冰矛，射程最长且稳定穿透。", color: "#87e7ff", fx: "icicle", ultimateType: "auroraSpears", ultimateName: "极光冰矛阵", ultimateIcon: "冰" },
    mage: { name: "低温工程师", short: "低温师", description: "释放冷凝爆弹和液氮云，擅长范围冻结。", color: "#a8c8ff", fx: "cryo", ultimateType: "blizzard", ultimateName: "零度暴风眼", ultimateIcon: "零" },
  },
  hospital: {
    melee: { name: "隔离区重装员", short: "重装员", description: "防爆盾配合高压消杀棍，顶住病原体冲击。", color: "#9ff4e1", fx: "disinfectant", ultimateType: "deconRush", ultimateName: "强压消杀冲锋", ultimateIcon: "盾" },
    ranger: { name: "抗体战地医生", short: "战地医生", description: "注射步枪精准投送抗体，安全距离持续净化。", color: "#73eaff", fx: "antibody", ultimateType: "antibodyRain", ultimateName: "抗体蜂群投送", ultimateIcon: "抗" },
    mage: { name: "生化研究员", short: "研究员", description: "混合裂解试剂形成反应区，高伤害但防护较低。", color: "#72ffd0", fx: "serum", ultimateType: "sterilePurge", ultimateName: "全域净化协议", ultimateIcon: "净" },
  },
  orbit: {
    melee: { name: "星核重载舰", short: "重载舰", description: "舰体保持稳定，由可收缩星系球环绕撞击虫群。", color: "#82dcff", fx: "galaxyOrbit", ultimateType: "galaxyOverdrive", ultimateName: "星系潮汐过载", ultimateIcon: "星", life: .34, count: 1 },
    ranger: { name: "磁轨歼击舰", short: "歼击舰", description: "超远距舰载磁轨齐射，贯穿虫群编队。", color: "#77eeff", fx: "laser", ultimateType: "railSalvo", ultimateName: "轨道炮齐射", ultimateIcon: "轨" },
    mage: { name: "蜂群无人母舰", short: "无人母舰", description: "释放智能无人机和脉冲雷，覆盖大范围空域。", color: "#bda0ff", fx: "drone", ultimateType: "swarmProtocol", ultimateName: "蜂群湮灭协议", ultimateIcon: "群" },
  },
  mars: {
    melee: { name: "赤砂装甲兵", short: "装甲兵", description: "挥动热能战斧近身清场，厚重装甲适合硬撼。", color: "#ff9d69", fx: "flameArc", ultimateType: "faultline", ultimateName: "熔岩断层", ultimateIcon: "岩" },
    ranger: { name: "荒原轨炮手", short: "轨炮手", description: "火星合金弹远程贯穿，保持机动火力。", color: "#ffd276", fx: "rail", ultimateType: "marsBarrage", ultimateName: "前哨饱和轰炸", ultimateIcon: "炮" },
    mage: { name: "等离子技师", short: "等离子师", description: "投射不稳定等离子团，制造高热范围爆破。", color: "#ff8fc7", fx: "plasma", ultimateType: "solarCore", ultimateName: "太阳风暴核心", ultimateIcon: "核" },
  },
  moon: {
    melee: { name: "月兔重锤机", short: "重锤机", description: "挥动引力重锤近战，落锤冲击可击退月面守卫。", color: "#e9e8ff", fx: "gravityArc", ultimateType: "moonQuake", ultimateName: "月震裁决", ultimateIcon: "震" },
    ranger: { name: "静海巡猎者", short: "巡猎者", description: "真空脉冲枪超远锁定，弹道稳定而清晰。", color: "#aeeaff", fx: "lunarBolt", ultimateType: "lunarSupport", ultimateName: "环月火力支援", ultimateIcon: "月" },
    mage: { name: "重力场技师", short: "重力师", description: "操纵局部重力井牵制敌人，以坍缩波范围杀伤。", color: "#c4b7ff", fx: "graviton", ultimateType: "gravityCollapse", ultimateName: "静海重力坍缩", ultimateIcon: "引" },
  },
  cultivation: {
    melee: { name: "重剑修 · 镇岳", short: "重剑修", description: "高血量、短距离挥动镇岳重剑，贴身破阵。", color: "#ffd27a", fx: "qiArc", ultimateType: "heavenBlade", ultimateName: "镇岳天剑", ultimateIcon: "剑" },
    ranger: { name: "剑修 · 飞虹", short: "剑修", description: "挥剑斩出飞虹剑气，远距离连续穿敌。", color: "#a9ffe0", fx: "flyingSword", ultimateType: "swordRain", ultimateName: "万剑归宗", ultimateIcon: "卍" },
    mage: { name: "法修 · 星罗", short: "法修", description: "低血量、高法伤，结阵引动范围术法。", color: "#d5b4ff", fx: "spell", ultimateType: "thunderTribulation", ultimateName: "九霄雷劫", ultimateIcon: "雷" },
  },
};

function getSceneClassProfile(scene, classId) {
  const combatClass = classDefinitions.find((entry) => entry.id === classId) || classDefinitions[1];
  return { ...combatClass, ...(sceneClassProfiles[scene.id]?.[combatClass.id] || {}) };
}

const gearDefinitions = {
  helmet: { name: "战术头盔", icon: "◒", stat: "crit", statLabel: "暴击率", base: .018, suffix: "%" },
  armor: { name: "复合护甲", icon: "⬟", stat: "health", statLabel: "城墙生命", base: 12, suffix: "" },
  gloves: { name: "增幅手套", icon: "✤", stat: "damage", statLabel: "攻击力", base: .055, suffix: "%" },
  boots: { name: "相位战靴", icon: "»", stat: "haste", statLabel: "攻击速度", base: .045, suffix: "%" },
  relic: { name: "回响遗物", icon: "☼", stat: "coins", statLabel: "补给币", base: .08, suffix: "%" },
  chip: { name: "战术芯片", icon: "▦", stat: "pulse", statLabel: "终极伤害", base: .09, suffix: "%" },
};

const gearSlots = ["helmet", "armor", "gloves", "boots", "relic", "chip"];
const rarityDefinitions = {
  common: { name: "普通", color: "#aab5ad", multiplier: 1 },
  rare: { name: "稀有", color: "#62bfff", multiplier: 1.65 },
  epic: { name: "史诗", color: "#c381ff", multiplier: 2.55 },
  legendary: { name: "传说", color: "#ffb54f", multiplier: 3.8 },
};

const skinDefinitions = [
  { id: "default", name: "原生蓝", detail: "纯蓝大招，不附加装扮特效", primary: "#66bfff", secondary: "#d8f3ff", price: 0, tier: 0 },
  { id: "frost", name: "寒月流光", detail: "冰蓝碎晶拖尾 · 解锁极地雪原", primary: "#d9f7ff", secondary: "#55b8ff", price: 360, tier: 1, motif: "shard", unlockScene: "snow" },
  { id: "antibody", name: "澄澈抗体", detail: "青绿净化脉冲 · 解锁隔离医院", primary: "#9effdc", secondary: "#35cfa3", price: 520, tier: 1, motif: "cross", unlockScene: "hospital" },
  { id: "void", name: "虚空星痕", detail: "紫曜星环与深空余辉 · 解锁近地轨道", primary: "#e4c4ff", secondary: "#895cff", price: 680, tier: 2, motif: "orbit", unlockScene: "orbit" },
  { id: "ember", name: "赤霄战意", detail: "赤金焰纹与爆燃星芒 · 解锁火星前哨", primary: "#ffcf6b", secondary: "#ff5d52", price: 880, tier: 2, motif: "flare", unlockScene: "mars" },
  { id: "lunar", name: "月蚀圣辉", detail: "银白月轮与引力光带 · 解锁月面遗迹", primary: "#f4f0ff", secondary: "#8f8bff", price: 1080, tier: 3, motif: "eclipse", unlockScene: "moon" },
  { id: "immortal", name: "太虚仙辉", detail: "多层剑印、仙光长虹与专属大招外观", primary: "#eaffd6", secondary: "#7df2c3", price: 1380, tier: 3, motif: "sigil" },
  { id: "jade_avatar", name: "青霄流光", detail: "活动青蓝配色，不附加额外造型特效", primary: "#8fffd2", secondary: "#42bfff", price: null, tier: 0 },
];

const sceneSkinRequirements = { snow: "frost", hospital: "antibody", orbit: "void", mars: "ember", moon: "lunar" };
const classGearPrefixes = { melee: "先锋", ranger: "猎隼", mage: "秘术" };
const divineGearDefinitions = {
  melee: { icon: "⚔", name: "天罚战神核心", attack: "裁决武装" },
  ranger: { icon: "✧", name: "星穹猎神装", attack: "超限磁轨" },
  mage: { icon: "✦", name: "万象神谕法典", attack: "万象增幅" },
};

const petDefinitions = [
  { id: "emberFox", icon: "狐", spriteIndex: 0, name: "赤焰灵狐", detail: "焰尾追踪 · 均衡输出", color: "#ff9a63", interval: .9, damage: .46, style: "orb" },
  { id: "warHound", icon: "獒", spriteIndex: 1, name: "玄甲战獒", detail: "玄甲重击 · 高额单伤", color: "#8de5ff", interval: 1.35, damage: .82, style: "blade" },
  { id: "herbSprite", icon: "药", spriteIndex: 2, name: "青萝药灵", detail: "疗愈花种 · 血包掉率 15%", color: "#7dffb0", interval: 1.55, damage: .3, style: "orb", medkitBonus: .05 },
];

const defaultMeta = {
  coins: 0,
  bestWave: 0,
  wins: 0,
  upgrades: { damage: 0, wall: 0, crit: 0, drone: 0, magnet: 0, recovery: 0, pulse: 0, mobility: 0 },
  progress: Object.fromEntries(scenes.map((scene) => [scene.id, 0])),
  currentScene: 0,
  currentLevel: 1,
  selectedClass: "ranger",
  equipment: [],
  classGear: Object.fromEntries(classDefinitions.map((entry) => [entry.id, Object.fromEntries(gearSlots.map((slot) => [slot, null]))])),
  divineGear: Object.fromEntries(classDefinitions.map((entry) => [entry.id, { unlocked: false, level: 1, trialRuns: 0, trialStages: [] }])),
  gearSystemVersion: 0,
  adState: { date: "", watched: 0 },
  daily: { date: "", runs: 0, kills: 0, xp: 0, ads: 0, claimed: {} },
  dungeon: { date: "", entries: 3, clears: 0 },
  activities: { date: "", signIn: false, gearAd: false, avatarAd: false, dungeonGift: false },
  skins: { owned: ["default"], equipped: "default" },
  pet: { selected: "emberFox" },
  energy: { date: "", current: 8, max: 8, adRestores: 0 },
};

function loadMeta() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...defaultMeta,
      ...saved,
      upgrades: { ...defaultMeta.upgrades, ...(saved?.upgrades || {}) },
      progress: { ...defaultMeta.progress, ...(saved?.progress || {}) },
      equipment: Array.isArray(saved?.equipment) ? saved.equipment : [],
      classGear: Object.fromEntries(classDefinitions.map((entry) => [entry.id, { ...defaultMeta.classGear[entry.id], ...(saved?.classGear?.[entry.id] || {}) }])),
      divineGear: Object.fromEntries(classDefinitions.map((entry) => [entry.id, {
        ...defaultMeta.divineGear[entry.id],
        ...(saved?.divineGear?.[entry.id] || {}),
        trialStages: Array.isArray(saved?.divineGear?.[entry.id]?.trialStages) ? saved.divineGear[entry.id].trialStages : [],
      }])),
      adState: { ...defaultMeta.adState, ...(saved?.adState || {}) },
      daily: { ...defaultMeta.daily, ...(saved?.daily || {}), claimed: { ...(saved?.daily?.claimed || {}) } },
      dungeon: { ...defaultMeta.dungeon, ...(saved?.dungeon || {}) },
      activities: { ...defaultMeta.activities, ...(saved?.activities || {}) },
      skins: { ...defaultMeta.skins, ...(saved?.skins || {}), owned: Array.isArray(saved?.skins?.owned) ? saved.skins.owned : ["default"] },
      pet: { ...defaultMeta.pet, ...(saved?.pet || {}) },
      energy: { ...defaultMeta.energy, ...(saved?.energy || {}) },
    };
  } catch {
    return structuredClone(defaultMeta);
  }
}

let meta = loadMeta();
if (ADMIN_MODE) {
  meta.coins = 999999;
  meta.energy = { date: todayKey(), current: 99, max: 99, adRestores: 0 };
  meta.skins.owned = skinDefinitions.map((skin) => skin.id);
  for (const scene of scenes) meta.progress[scene.id] = scene.endless ? 0 : LEVELS_PER_SCENE;
  for (const id of Object.keys(meta.upgrades)) meta.upgrades[id] = 10;
  for (const state of Object.values(meta.divineGear)) { state.unlocked = true; state.level = Math.max(12, state.level || 1); }
}
if (meta.gearSystemVersion !== 2) {
  const legacyClass = classDefinitions.some((entry) => entry.id === meta.selectedClass) ? meta.selectedClass : "ranger";
  if (meta.equippedGear) meta.classGear[legacyClass] = { ...meta.classGear[legacyClass], ...meta.equippedGear };
  meta.equipment = meta.equipment.map((item) => ({ ...item, classId: item.classId || legacyClass, level: item.level || 0 }));
  meta.gearSystemVersion = 2;
}
refreshDailyState();
saveMeta();
let game = null;
let mode = QA_MODE || ADMIN_MODE ? "home" : "login";
let paused = false;
let manuallyPaused = false;
let muted = false;
let lastFrame = performance.now();
let ambienceTime = 0;
let nextId = 1;
let toastTimer = 0;
let audioContext = null;
let adTimer = null;
let pendingAdReward = null;
let selectedRunClass = meta.selectedClass || "ranger";
let pendingRunType = "main";
let assetLaunchPending = false;
let lastRunType = "main";
const movementKeys = new Set();
const pointerMove = { x: W / 2, y: H / 2, originX: W / 2, originY: H / 2, active: false, touchId: null, touchMode: false };
let selectedSceneIndex = Math.max(0, Math.min(scenes.length - 1, meta.currentScene || 0));
let selectedLevel = Math.max(1, Math.min(LEVELS_PER_SCENE, meta.currentLevel || 1));

const metaDefinitions = [
  { id: "damage", icon: "✦", name: "火力校准", detail: "每级基础伤害 +7%", costs: [110, 145, 185, 235, 295, 365, 445, 535, 635, 750] },
  { id: "wall", icon: "▰", name: "合金城墙", detail: "每级城墙生命 +8%", costs: [100, 135, 175, 225, 285, 350, 430, 520, 620, 730] },
  { id: "crit", icon: "⌁", name: "弱点扫描", detail: "每级暴击率 +1.5%", costs: [120, 155, 200, 250, 315, 385, 465, 560, 665, 780] },
  { id: "drone", icon: "◉", name: "环卫无人机群", detail: "非修仙地图召唤环绕无人机；等级提高数量与射速", costs: [150, 205, 275, 360, 460, 580, 715, 870] },
  { id: "magnet", icon: "⌁", name: "战利品磁场", detail: "每级经验拾取半径 +12", costs: [90, 125, 170, 225, 290, 365, 450, 550] },
  { id: "recovery", icon: "+", name: "击破修复", detail: "每次击杀恢复少量生命，首领恢复更多", costs: [135, 180, 235, 300, 375, 465, 570, 690] },
  { id: "pulse", icon: "ϟ", name: "终极循环器", detail: "每级缩短大招冷却 3.5%", costs: [165, 220, 290, 375, 475, 590, 720, 870] },
  { id: "mobility", icon: "»", name: "机动外骨骼", detail: "每级移动速度 +2.5%", costs: [105, 145, 195, 255, 330, 415, 515, 630] },
];

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function refreshDailyAds() {
  if (meta.adState.date !== todayKey()) meta.adState = { date: todayKey(), watched: 0 };
}

function refreshDailyState() {
  const today = todayKey();
  refreshDailyAds();
  if (meta.daily.date !== today) meta.daily = { date: today, runs: 0, kills: 0, xp: 0, ads: 0, claimed: {} };
  if (meta.dungeon.date !== today) meta.dungeon = { date: today, entries: 3, clears: 0 };
  if (meta.activities.date !== today) meta.activities = { date: today, signIn: false, gearAd: false, avatarAd: false, dungeonGift: false };
  if (meta.energy.date !== today) meta.energy = { date: today, current: meta.energy.max || 8, max: meta.energy.max || 8, adRestores: 0 };
  meta.energy.current = Math.max(0, Math.min(meta.energy.max, meta.energy.current));
  if (!meta.skins.owned.includes("default")) meta.skins.owned.unshift("default");
  if (!meta.skins.owned.includes(meta.skins.equipped)) meta.skins.equipped = "default";
}

function getEquippedSkin() {
  return skinDefinitions.find((skin) => skin.id === meta.skins.equipped) || skinDefinitions[0];
}

function getClassWeaponVisual(combatClass) {
  const base = classWeaponVisuals[combatClass.id] || classWeaponVisuals.ranger;
  return { ...base, color: combatClass.color };
}

function getSelectedPet() {
  return petDefinitions.find((pet) => pet.id === meta.pet.selected) || petDefinitions[0];
}

function getGearById(id) {
  return meta.equipment.find((item) => item.id === id) || null;
}

function getClassGear(classId = selectedRunClass) {
  return meta.classGear[classId] || meta.classGear.ranger;
}

function getGearValue(item) {
  return item.value * (1 + Math.min(10, item.level || 0) * .12);
}

function getDivineGearState(classId = selectedRunClass) {
  return meta.divineGear[classId] || meta.divineGear.ranger;
}

function getDivineGearStats(level = 1) {
  const safeLevel = Math.max(1, Math.floor(level));
  return {
    damage: .65 + safeLevel * .35,
    health: 90 + safeLevel * 55,
    crit: .04 + safeLevel * .018,
    pulse: .08 + safeLevel * .04,
    supportedChapter: safeLevel + 1,
  };
}

function getDivineTrialStats(sceneIndex = selectedSceneIndex, missionLevel = selectedLevel) {
  const isCityFinale = sceneIndex === 0 && missionLevel === LEVELS_PER_SCENE;
  const attenuation = isCityFinale ? .22 : sceneIndex === 0 && missionLevel >= 9 ? .52 : 1;
  return {
    damage: 1.8 * attenuation,
    health: Math.round(220 * attenuation),
    crit: .2 * attenuation,
    pulse: .55 * attenuation,
    synchronization: attenuation,
  };
}

function getDivineGearCombatStats(level = 1, sceneIndex = selectedSceneIndex) {
  const stats = getDivineGearStats(level);
  const chapter = Math.max(1, sceneIndex + 1);
  const gap = Math.max(0, chapter - stats.supportedChapter);
  const synchronization = gap > 0 ? .55 ** gap : 1;
  return {
    ...stats,
    damage: stats.damage * synchronization,
    health: Math.round(stats.health * synchronization),
    crit: stats.crit * synchronization,
    pulse: stats.pulse * synchronization,
    synchronization,
  };
}

function getDivineGearUpgradeCost(level = 1) {
  return Math.min(Number.MAX_SAFE_INTEGER, Math.round(180 * 2 ** Math.max(0, level - 1)));
}

function getEquippedBonuses(classId = selectedRunClass) {
  const totals = { health: 0, crit: 0, damage: 0, haste: 0, coins: 0, pulse: 0 };
  for (const id of Object.values(getClassGear(classId))) {
    const item = getGearById(id);
    if (item && item.classId === classId) totals[item.stat] += getGearValue(item);
  }
  return totals;
}

function getGearResonance(classId = selectedRunClass) {
  const equipped = Object.values(getClassGear(classId)).map(getGearById).filter((item) => item?.classId === classId);
  const legendary = equipped.filter((item) => item.rarity === "legendary").length;
  const fullRedSet = legendary === gearSlots.length;
  return {
    legendary,
    fullRedSet,
    damage: legendary * .035 + (fullRedSet ? .18 : 0),
    health: legendary * .04 + (fullRedSet ? .16 : 0),
    pulse: legendary * .025 + (fullRedSet ? .12 : 0),
  };
}

function getAccountProgress() {
  const cleared = scenes.filter((scene) => !scene.endless).reduce((total, scene) => total + (meta.progress[scene.id] || 0), 0);
  const level = 1 + Math.floor(cleared / 2);
  const intoLevel = cleared % 2;
  const titles = ["新晋守卫者", "战区先遣官", "多界指挥官", "维度守望者", "七界统御者"];
  return { cleared, level, ratio: intoLevel / 2, title: titles[Math.min(titles.length - 1, Math.floor(level / 8))] };
}

function getCombatPower(classId = selectedRunClass) {
  const gear = getEquippedBonuses(classId);
  const resonance = getGearResonance(classId);
  const divineState = getDivineGearState(classId);
  const divine = divineState.unlocked ? getDivineGearCombatStats(divineState.level) : { damage: 0, health: 0, crit: 0, pulse: 0 };
  const permanent = meta.upgrades.damage * 18 + meta.upgrades.wall * 14 + meta.upgrades.crit * 12 + meta.upgrades.drone * 14 + meta.upgrades.magnet * 7 + meta.upgrades.recovery * 9 + meta.upgrades.pulse * 12 + meta.upgrades.mobility * 7;
  const equipment = gear.health * .45 + gear.damage * 165 + gear.crit * 130 + gear.haste * 120 + gear.pulse * 150 + resonance.damage * 190 + resonance.health * 130 + resonance.pulse * 120 + divine.health * .8 + divine.damage * 260 + divine.crit * 220 + divine.pulse * 180;
  return Math.round(100 + permanent + equipment);
}

function getSceneRequirement(index) {
  if (index <= 0 || QA_MODE || ADMIN_MODE) return null;
  const scene = scenes[index];
  if (scene.endless) return null;
  const skinId = sceneSkinRequirements[scene.id];
  const skin = skinDefinitions.find((entry) => entry.id === skinId);
  return { scene, skin, previous: scenes[index - 1], chapterReady: (meta.progress[scenes[index - 1].id] || 0) >= LEVELS_PER_SCENE, skinReady: Boolean(skin && meta.skins.owned.includes(skin.id)) };
}

function getRunEnergyCost(runType = "main") {
  return scenes[selectedSceneIndex].endless && runType !== "resource" ? 2 : 1;
}

function getSceneLockedMessage(index = selectedSceneIndex) {
  const requirement = getSceneRequirement(index);
  if (!requirement) return "当前战区尚未开放";
  if (!requirement.chapterReady) return `先通关「${requirement.previous.name}」全部 ${LEVELS_PER_SCENE} 关`;
  if (!requirement.skinReady) return `前往商城解锁「${requirement.skin?.name || "主题装扮"}」`;
  return "当前战区尚未开放";
}

function formatBonusSummary(bonuses) {
  const entries = [
    ["生命", bonuses.health, false], ["伤害", bonuses.damage, true], ["暴击", bonuses.crit, true],
    ["攻速", bonuses.haste, true], ["金币", bonuses.coins, true], ["大招", bonuses.pulse, true],
  ];
  return entries.filter(([, value]) => value > 0).map(([label, value, percent]) => `${label} +${percent ? Math.round(value * 100) + "%" : Math.round(value)}`);
}

function formatGearStat(item) {
  const percent = ["crit", "damage", "haste", "coins", "pulse"].includes(item.stat);
  const value = getGearValue(item);
  return `+${percent ? Math.round(value * 100) + "%" : Math.round(value)} ${item.statLabel}`;
}

function createGear(enemyType = "grunt", classId = game?.player?.combatClass?.id || selectedRunClass) {
  const slot = gearSlots[Math.floor(Math.random() * gearSlots.length)];
  const definition = gearDefinitions[slot];
  const roll = Math.random();
  const boss = enemyType === "boss";
  const stage = selectedSceneIndex * LEVELS_PER_SCENE + selectedLevel;
  let rarity = "common";
  const legendaryChance = stage < 28 ? 0 : Math.min(boss ? .12 : .018, (stage - 27) * (boss ? .006 : .00075));
  const epicChance = stage < 10 ? 0 : Math.min(boss ? .48 : .12, (stage - 9) * (boss ? .024 : .004));
  const rareChance = stage < 4 ? 0 : Math.min(boss ? .86 : .38, (stage - 3) * (boss ? .052 : .013));
  if (roll < legendaryChance) rarity = "legendary";
  else if (roll < legendaryChance + epicChance) rarity = "epic";
  else if (roll < legendaryChance + epicChance + rareChance) rarity = "rare";
  const rarityInfo = rarityDefinitions[rarity];
  const levelScale = 1 + selectedSceneIndex * .18 + (selectedLevel - 1) * .035;
  const value = definition.base * rarityInfo.multiplier * levelScale;
  return {
    id: `gear-${Date.now()}-${nextId++}`,
    slot,
    rarity,
    name: `${classGearPrefixes[classId]}·${rarityInfo.name}${definition.name}`,
    icon: definition.icon,
    stat: definition.stat,
    statLabel: definition.statLabel,
    value,
    classId,
    level: 0,
  };
}

function createGuaranteedGear(rarity = "rare", classId = game?.player?.combatClass?.id || selectedRunClass) {
  const item = createGear("boss", classId);
  const definition = gearDefinitions[item.slot];
  const rarityInfo = rarityDefinitions[rarity];
  const levelScale = 1 + selectedSceneIndex * .18 + (selectedLevel - 1) * .035;
  return { ...item, rarity, name: `${classGearPrefixes[classId]}·${rarityInfo.name}${definition.name}`, value: definition.base * rarityInfo.multiplier * levelScale };
}

const upgradeDefinitions = [
  {
    id: "power",
    icon: "✦",
    name: "能量增幅",
    description: "投射物伤害提高 28%",
    max: 5,
    apply: (player) => { player.damage *= 1.28; },
  },
  {
    id: "haste",
    icon: "»",
    name: "快速补给",
    description: "攻击间隔缩短 16%",
    max: 5,
    apply: (player) => { player.fireInterval *= 0.84; },
  },
  {
    id: "multi",
    icon: "⋔",
    name: "并行投射",
    description: "每次额外发射 1 枚投射物",
    max: 3,
    apply: (player) => { player.bulletCount += 1; },
  },
  {
    id: "pierce",
    icon: "➜",
    name: "高能穿透",
    description: "投射物额外穿透 1 个目标",
    max: 3,
    apply: (player) => { player.pierce += 1; },
  },
  {
    id: "grenade",
    icon: "✺",
    name: "范围爆破",
    description: "提高范围攻击概率与作用半径",
    max: 3,
    apply: (player) => { player.explosionChance += 0.16; player.explosionRadius += 7; },
  },
  {
    id: "frost",
    icon: "❄",
    name: "低温抑制",
    description: "命中有 20% 概率冻结目标",
    max: 3,
    apply: (player) => { player.slowChance += 0.2; },
  },
  {
    id: "crit",
    icon: "⌖",
    name: "弱点瞄准",
    description: "暴击率提高 10%",
    max: 4,
    apply: (player) => { player.critChance += 0.1; },
  },
  {
    id: "repair",
    icon: "+",
    name: "战地急救",
    description: "生命上限 +35，并立即恢复生命",
    max: 4,
    apply: (player) => {
      game.maxHealth += 35;
      game.health = Math.min(game.maxHealth, game.health + 55);
    },
  },
  {
    id: "bladeReach", icon: "⚔", name: "环刃领域", description: "战士环斩距离 +28%，伤害 +18%", max: 4, classes: ["melee"],
    apply: (player) => { player.projectileLife *= 1.28; player.damage *= 1.18; },
  },
  {
    id: "hunter", icon: "⌖", name: "猎手专注", description: "远程暴击率 +14%，额外穿透 1 个目标", max: 4, classes: ["ranger"],
    apply: (player) => { player.critChance += .14; player.pierce += 1; },
  },
  {
    id: "arcane", icon: "✧", name: "奥术共鸣", description: "法术爆破范围 +18，减速概率 +12%", max: 4, classes: ["mage"],
    apply: (player) => { player.explosionRadius += 18; player.slowChance += .12; },
  },
  {
    id: "spiritPet", icon: "狐", name: "御兽真经", description: "召来灵宠巡游护主，自动追击附近修士", max: 6, cultivationOnly: true,
    apply: (player) => { player.spiritPetLevel += 1; player.spiritPets = Math.min(3, 1 + Math.floor((player.spiritPetLevel - 1) / 2)); },
  },
  {
    id: "flyingSword", icon: "剑", name: "万剑匣", description: "蕴养护身飞剑，攻击时追加追魂剑气", max: 8, cultivationOnly: true,
    apply: (player) => { player.swordCount += 1; },
  },
  {
    id: "righteousWard", icon: "阵", name: "浩然护体阵", description: "展开正气法阵，减免伤害并持续恢复气血", max: 7, cultivationOnly: true,
    apply: (player) => { player.wardLevel += 1; game.maxHealth += 18; game.health = Math.min(game.maxHealth, game.health + 32); },
  },
  {
    id: "tribulation", icon: "雷", name: "九天雷劫", description: "定期召下天雷，优先轰击高修为敌人", max: 7, cultivationOnly: true,
    apply: (player) => { player.tribulationLevel += 1; },
  },
  {
    id: "lotus", icon: "莲", name: "功德金莲", description: "击败敌人积攒功德，持续回复角色生命", max: 7, cultivationOnly: true,
    apply: (player) => { player.lotusLevel += 1; },
  },
  {
    id: "talisman", icon: "符", name: "两仪符域", description: "符箓环绕战场，提高爆破概率与法域范围", max: 7, cultivationOnly: true,
    apply: (player) => { player.talismanLevel += 1; player.explosionChance = Math.min(.82, player.explosionChance + .06); player.explosionRadius += 7; },
  },
];

const cultivationUpgradeNames = {
  power: { name: "真元淬体", description: "凝练真元，所有攻击伤害提高 28%" },
  haste: { name: "御剑行气", description: "周天运转加快，攻击间隔缩短 16%" },
  multi: { name: "剑影分光", description: "分化一道灵光，每次额外发射 1 枚投射物" },
  pierce: { name: "破罡剑意", description: "剑意洞穿护体罡气，额外贯穿 1 个目标" },
  grenade: { name: "九霄雷引", description: "攻击有更高概率引动范围天雷" },
  frost: { name: "玄冰封脉", description: "命中有 20% 概率冻结敌人经脉" },
  crit: { name: "灵台明鉴", description: "洞察气机破绽，暴击率提高 10%" },
  repair: { name: "青木回春", description: "生命上限 +35，并立即恢复生命" },
  bladeReach: { name: "横扫八荒", description: "刀罡范围 +28%，近战伤害 +18%" },
  hunter: { name: "百步穿杨", description: "暴击率 +14%，箭芒额外贯穿 1 个目标" },
  arcane: { name: "紫府星诀", description: "星咒范围 +18，封脉概率 +12%" },
};

const classUpgradeNames = {
  melee: {
    power: { name: "战意沸腾", description: "怒意灌注兵刃，近战伤害提高 28%" },
    haste: { name: "疾风连斩", description: "重整架势，攻击间隔缩短 16%" },
    multi: { name: "剑刃风暴", description: "每轮多斩出 1 道旋刃" },
    pierce: { name: "破甲重击", description: "剑锋额外贯穿 1 个目标" },
    grenade: { name: "震地余波", description: "斩击更易触发震荡范围伤害" },
    frost: { name: "寒铁压制", description: "命中有 20% 概率冻结敌人" },
    crit: { name: "处决洞察", description: "抓住破绽，暴击率提高 10%" },
    repair: { name: "不屈战魂", description: "生命上限 +35，并立即恢复生命" },
    bladeReach: { name: "环刃领域", description: "环斩距离 +28%，近战伤害 +18%" },
  },
  ranger: {
    power: { name: "超导弹芯", description: "更换超导弹芯，弹药伤害提高 28%" },
    haste: { name: "极速装填", description: "自动供弹，攻击间隔缩短 16%" },
    multi: { name: "分裂弹匣", description: "每轮额外发射 1 枚弹药" },
    pierce: { name: "钨芯穿甲", description: "弹药额外贯穿 1 个目标" },
    grenade: { name: "集束弹头", description: "提高爆破概率与杀伤半径" },
    frost: { name: "冷冻弹头", description: "命中有 20% 概率冻结目标" },
    crit: { name: "鹰眼校准", description: "锁定薄弱部位，暴击率提高 10%" },
    repair: { name: "战术医疗", description: "生命上限 +35，并立即恢复生命" },
    hunter: { name: "猎手专注", description: "暴击率 +14%，额外贯穿 1 个目标" },
  },
  mage: {
    power: { name: "魔力潮汐", description: "魔力涌动，法术伤害提高 28%" },
    haste: { name: "快速咏唱", description: "缩短咒式，攻击间隔缩短 16%" },
    multi: { name: "三相法球", description: "每轮额外凝聚 1 枚法球" },
    pierce: { name: "灵魂穿透", description: "法术额外贯穿 1 个目标" },
    grenade: { name: "星爆术", description: "扩大法术爆破概率与作用半径" },
    frost: { name: "霜缚咒", description: "命中有 20% 概率冻结目标" },
    crit: { name: "命运洞察", description: "窥见命运裂隙，暴击率提高 10%" },
    repair: { name: "生命汲取", description: "生命上限 +35，并立即恢复生命" },
    arcane: { name: "奥术共鸣", description: "法术范围 +18，封锁概率 +12%" },
  },
};

const sceneSpecialistUpgradeNames = {
  city: {
    power: ["电容增压", "提高电弧输出，所有攻击伤害提高 28%"], haste: ["脉冲超频", "缩短充能周期，攻击间隔缩短 16%"], multi: ["三相线圈", "每轮额外释放 1 道电弧"], pierce: ["跳跃传导", "电弧额外贯穿 1 个目标"], grenade: ["电网过载", "提高爆破概率与作用半径"], frost: ["低温电阻", "命中有 20% 概率冻结目标"], crit: ["弱点测算", "暴击率提高 10%"], repair: ["应急电源", "生命上限 +35，并立即恢复生命"], arcane: ["特斯拉共振", "电场范围 +18，控制概率 +12%"],
  },
  snow: {
    power: ["液氮增压", "冷凝攻击伤害提高 28%"], haste: ["极速冷凝", "攻击间隔缩短 16%"], multi: ["多管喷射", "每轮额外喷射 1 枚冷凝弹"], pierce: ["冰晶穿透", "冰弹额外贯穿 1 个目标"], grenade: ["低温爆裂", "提高爆破概率与作用半径"], frost: ["深度冷冻", "命中有 20% 概率冻结目标"], crit: ["温差测算", "暴击率提高 10%"], repair: ["恒温救生服", "生命上限 +35，并立即恢复生命"], arcane: ["零度共振", "冷冻范围 +18，冻结概率 +12%"],
  },
  hospital: {
    power: ["裂解浓度", "提升试剂浓度，攻击伤害提高 28%"], haste: ["快速配液", "自动混合试剂，攻击间隔缩短 16%"], multi: ["复合试剂组", "每轮额外发射 1 枚反应剂"], pierce: ["细胞穿透", "试剂额外穿透 1 个病原体"], grenade: ["扩散反应", "扩大裂解概率与净化半径"], frost: ["低温抑制", "命中有 20% 概率冻结病原体"], crit: ["毒株测序", "锁定病毒结构，暴击率提高 10%"], repair: ["应急血清", "生命上限 +35，并立即恢复生命"], arcane: ["反应域增幅", "净化范围 +18，抑制概率 +12%"],
  },
  orbit: {
    power: ["蜂群增幅", "无人机攻击伤害提高 28%"], haste: ["母舰超频", "无人机出舱间隔缩短 16%"], multi: ["多机编队", "每轮额外释放 1 架攻击机"], pierce: ["相位弹头", "攻击额外贯穿 1 个目标"], grenade: ["脉冲雷阵", "提高爆破概率与作用半径"], frost: ["滞速射线", "命中有 20% 概率冻结目标"], crit: ["轨道测算", "暴击率提高 10%"], repair: ["自愈装甲", "生命上限 +35，并立即恢复生命"], arcane: ["蜂群协议", "无人机覆盖范围 +18，控制概率 +12%"],
  },
  mars: {
    power: ["等离子增压", "热能攻击伤害提高 28%"], haste: ["磁约束超频", "攻击间隔缩短 16%"], multi: ["多核喷射", "每轮额外发射 1 枚等离子体"], pierce: ["熔穿射流", "射流额外贯穿 1 个目标"], grenade: ["热核爆裂", "提高爆破概率与作用半径"], frost: ["骤冷冲击", "命中有 20% 概率冻结目标"], crit: ["热斑定位", "暴击率提高 10%"], repair: ["装甲密封", "生命上限 +35，并立即恢复生命"], arcane: ["磁场共振", "等离子范围 +18，控制概率 +12%"],
  },
  moon: {
    power: ["重力增幅", "坍缩攻击伤害提高 28%"], haste: ["曲率超频", "攻击间隔缩短 16%"], multi: ["多重引力井", "每轮额外生成 1 枚引力核"], pierce: ["曲率穿透", "引力核额外贯穿 1 个目标"], grenade: ["坍缩爆发", "提高爆破概率与作用半径"], frost: ["时间迟滞", "命中有 20% 概率冻结目标"], crit: ["质量测算", "暴击率提高 10%"], repair: ["生命维持舱", "生命上限 +35，并立即恢复生命"], arcane: ["引力共振", "力场范围 +18，控制概率 +12%"],
  },
};

// Each world/class owns a three-piece growth path. The UI never exposes the
// recipe; taking the core and linked skill together awakens the named reaction.
const sceneSkillGroups = {
  city: {
    melee: { core: "bladeReach", link: "grenade", aux: "power", synergy: "超载破城", color: "#ff9a57", labels: { bladeReach: ["破障蓄能", "扩大动力刃横扫范围并强化近战压制"], grenade: ["震荡刃压", "斩击在接触点留下二次震荡"], power: ["反应堆增压", "稳定提高动力武装的基础输出"] } },
    ranger: { core: "hunter", link: "haste", aux: "pierce", synergy: "穿城弹链", color: "#70eaff", labels: { hunter: ["猎手专注", "校准感染体弱点并提高贯穿能力"], haste: ["极速装填", "压缩供弹周期，维持连续火力"], pierce: ["钨芯穿甲", "让磁轨弹继续穿过后排目标"] } },
    mage: { core: "arcane", link: "multi", aux: "crit", synergy: "电磁风暴", color: "#c8a2ff", labels: { arcane: ["高压线圈", "扩大电弧反应区与感应范围"], multi: ["三相电网", "额外并联一道高压电弧"], crit: ["短路测算", "锁定电阻最低的致命节点"] } },
  },
  snow: {
    melee: { core: "bladeReach", link: "frost", aux: "power", synergy: "永冻碎岳", color: "#dff9ff", labels: { bladeReach: ["冰川抡击", "扩大重锤挥舞半径与破冰伤害"], frost: ["霜甲侵蚀", "重击累积深寒并迟滞雪怪"], power: ["极寒蓄力", "强化每一次冰锤落点的冲击"] } },
    ranger: { core: "hunter", link: "multi", aux: "pierce", synergy: "极光贯星", color: "#8cecff", labels: { hunter: ["极地校准", "在风雪中锁定目标薄弱部位"], multi: ["冰矛分光", "一次投射分化额外冰晶长矛"], pierce: ["冰脊穿透", "长矛贯穿更多冻结目标"] } },
    mage: { core: "arcane", link: "frost", aux: "grenade", synergy: "绝对零域", color: "#a8c8ff", labels: { arcane: ["寒潮核心", "扩大冷凝场并稳定液氮反应"], frost: ["深度冷冻", "持续积累冻结强度"], grenade: ["冰晶爆裂", "冻裂时产生更大的碎晶范围"] } },
  },
  hospital: {
    melee: { core: "bladeReach", link: "grenade", aux: "repair", synergy: "无菌封锁", color: "#8dffe0", labels: { bladeReach: ["隔离推进", "扩大盾棍清扫范围与正面压制"], grenade: ["净化余波", "接触病原体时扩散消杀冲击"], repair: ["应急血清", "提高生命上限并补充应急状态"] } },
    ranger: { core: "hunter", link: "haste", aux: "pierce", synergy: "链式免疫", color: "#73eaff", labels: { hunter: ["抗体标记", "标记高危病原并提高精准贯穿"], haste: ["快速注射", "缩短抗体弹装填与注射周期"], pierce: ["细胞穿透", "抗体弹连续穿透多个病原体"] } },
    mage: { core: "arcane", link: "grenade", aux: "frost", synergy: "全域灭活", color: "#72ffd0", labels: { arcane: ["裂解反应", "扩大试剂反应区与抑制强度"], grenade: ["催化扩散", "触发更强的链式灭活爆发"], frost: ["低温封存", "延缓病原活动并延长反应窗口"] } },
  },
  orbit: {
    melee: { core: "bladeReach", link: "pierce", aux: "power", synergy: "群星潮汐", color: "#82dcff", labels: { bladeReach: ["星核环轨", "扩大星系球公转轨道与撞击范围"], pierce: ["引力贯穿", "星体沿轨道连续碾过虫群"], power: ["恒星增质", "提高环绕星体的质量与伤害"] } },
    ranger: { core: "hunter", link: "haste", aux: "pierce", synergy: "光速贯阵", color: "#77eeff", labels: { hunter: ["磁轨校准", "锁定虫群阵列的结构缺口"], haste: ["超导装填", "降低舰炮冷却并连续齐射"], pierce: ["相位弹芯", "炮弹继续贯穿后续编队"] } },
    mage: { core: "arcane", link: "multi", aux: "grenade", synergy: "指数蜂群", color: "#bda0ff", labels: { arcane: ["蜂群协议", "扩大无人机协同与锁敌半径"], multi: ["并行机库", "额外释放一组攻击无人机"], grenade: ["脉冲雷阵", "无人机命中后展开脉冲爆破"] } },
  },
  mars: {
    melee: { core: "bladeReach", link: "grenade", aux: "power", synergy: "行星裂解", color: "#ff9d69", labels: { bladeReach: ["熔斧蓄热", "扩大热能战斧挥砍范围"], grenade: ["断层余震", "斧刃落点引发赤砂震爆"], power: ["聚变刃芯", "提高战斧温度与基础伤害"] } },
    ranger: { core: "hunter", link: "pierce", aux: "haste", synergy: "赤砂贯星", color: "#ffd276", labels: { hunter: ["荒原猎标", "标记装甲缝隙并提高暴击"], pierce: ["钨核熔穿", "合金弹贯穿更多火星敌军"], haste: ["磁轨复位", "缩短炮轨复位与供弹时间"] } },
    mage: { core: "arcane", link: "grenade", aux: "multi", synergy: "日冕失控", color: "#ff8fc7", labels: { arcane: ["等离子共振", "扩大高热磁约束反应区"], grenade: ["日冕爆裂", "等离子命中后引发二次爆燃"], multi: ["多核喷射", "额外投射一枚不稳定等离子核"] } },
  },
  moon: {
    melee: { core: "bladeReach", link: "grenade", aux: "power", synergy: "月震奇点", color: "#e9e8ff", labels: { bladeReach: ["重力蓄势", "扩大重锤引力场与挥击范围"], grenade: ["坍缩半径", "锤击后形成短暂局部奇点"], power: ["月核增重", "提高重锤质量与基础伤害"] } },
    ranger: { core: "hunter", link: "haste", aux: "crit", synergy: "寂静光轨", color: "#aeeaff", labels: { hunter: ["静海瞄准", "在真空中校正弹道弱点"], haste: ["真空装填", "缩短脉冲枪的散热周期"], crit: ["月影测距", "提高远距离致命命中率"] } },
    mage: { core: "arcane", link: "frost", aux: "grenade", synergy: "永夜坍缩", color: "#c4b7ff", labels: { arcane: ["引力共振", "扩大引力井并延长牵引"], frost: ["冻结时域", "让坍缩区内的时间进一步迟滞"], grenade: ["奇点爆发", "引力核终结时造成范围坍缩"] } },
  },
  cultivation: {
    melee: { core: "bladeReach", link: "grenade", aux: "power", synergy: "一剑镇九州", color: "#ffd27a", labels: { bladeReach: ["镇岳剑势", "重剑横扫更广，剑势愈发沉雄"], grenade: ["山河震气", "剑锋落处震开第二重罡气"], power: ["真元淬锋", "以真元持续温养镇岳重剑"] } },
    ranger: { core: "hunter", link: "haste", aux: "pierce", synergy: "飞虹连天", color: "#a9ffe0", labels: { hunter: ["剑心通明", "洞察气机，以剑气追索破绽"], haste: ["御剑行气", "周天流转加快，连续挥出剑气"], pierce: ["破罡剑意", "飞虹剑气洞穿更多护体罡气"] } },
    mage: { core: "arcane", link: "frost", aux: "tribulation", synergy: "星霜天劫", color: "#d5b4ff", labels: { arcane: ["紫府星诀", "扩大星咒法域与灵力共鸣"], frost: ["玄冰封脉", "冻结经脉，为雷法留下天劫印记"], tribulation: ["九天雷劫", "定期引雷轰击高修为敌人"] } },
  },
};

function getSceneSkillGroup(sceneId = game?.scene?.id, classId = game?.player?.combatClass?.id) {
  return sceneSkillGroups[sceneId]?.[classId] || null;
}

function getUpgradePresentation(definition) {
  const group = getSceneSkillGroup();
  const pathCopy = group?.labels?.[definition.id];
  if (pathCopy) return { name: pathCopy[0], description: pathCopy[1] };
  const specialistCopy = game.player.combatClass.id === "mage" ? sceneSpecialistUpgradeNames[game.scene.id]?.[definition.id] : null;
  const scenePresentation = specialistCopy ? { name: specialistCopy[0], description: specialistCopy[1] } : null;
  const classPresentation = scenePresentation || classUpgradeNames[game.player.combatClass.id]?.[definition.id];
  return game.scene.endless ? cultivationUpgradeNames[definition.id] || classPresentation || definition : classPresentation || definition;
}

function saveMeta() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
}

function getLevelModifier(level) {
  return levelModifiers.find((modifier) => level <= modifier.max) || levelModifiers.at(-1);
}

function isSceneUnlocked(index) {
  if (index <= 0 || QA_MODE || ADMIN_MODE) return true;
  if (scenes[index]?.endless) return true;
  const requirement = getSceneRequirement(index);
  return Boolean(requirement?.chapterReady && requirement?.skinReady);
}

function isLevelUnlocked(sceneIndex, level) {
  return isSceneUnlocked(sceneIndex) && (scenes[sceneIndex].endless || QA_MODE || ADMIN_MODE || level === 1 || meta.progress[scenes[sceneIndex].id] >= level - 1);
}

function makeGame(runType = "main") {
  const baseScene = scenes[selectedSceneIndex];
  const scene = runType === "resource" && baseScene.endless ? { ...baseScene, endless: false } : baseScene;
  const missionLevel = selectedLevel;
  const levelModifier = getLevelModifier(missionLevel);
  const combatClass = getSceneClassProfile(scene, selectedRunClass);
  const weapon = getClassWeaponVisual(combatClass);
  const gear = getEquippedBonuses(combatClass.id);
  const resonance = getGearResonance(combatClass.id);
  const divineState = getDivineGearState(combatClass.id);
  const divine = divineState.unlocked ? getDivineGearCombatStats(divineState.level, selectedSceneIndex) : { damage: 0, health: 0, crit: 0, pulse: 0 };
  const endlessNoviceGrace = scene.endless ? Math.max(0, Math.min(1, (360 - getCombatPower(combatClass.id)) / 260)) : 0;
  const maxHealth = Math.round((170 * (1 + meta.upgrades.wall * 0.08) + gear.health + divine.health) * combatClass.health * (1 + resonance.health) * (1 + endlessNoviceGrace * .45));
  const missionTarget = runType === "resource" ? 45 : scene.endless ? Infinity : 26 + selectedSceneIndex * 6 + missionLevel * 3;
  const isDivineTutorialStage = selectedSceneIndex === 0 && missionLevel <= 2;
  const shouldDeliverDivineGear = runType === "main" && isDivineTutorialStage && !divineState.unlocked;
  return {
    scene,
    sceneIndex: selectedSceneIndex,
    missionLevel,
    levelModifier,
    runType,
    difficulty: runType === "resource" ? .88 + selectedSceneIndex * .07 : scene.endless ? 1 : 1 + selectedSceneIndex * 0.11 + (missionLevel - 1) * 0.055,
    endlessNoviceGrace,
    waveSeconds: QA_MODE ? 2 : runType === "resource" ? 8.5 : 11.5 + Math.min(2.5, missionLevel * 0.22),
    elapsed: 0,
    wave: 1,
    maxHealth,
    health: maxHealth,
    enemies: [],
    enemyProjectiles: [],
    bossWarnings: [],
    bossScars: [],
    corpses: [],
    bullets: [],
    impactBursts: [],
    airstrikes: [],
    lightnings: [],
    particles: [],
    floaters: [],
    shockwaves: [],
    groundMarks: [],
    xpDrops: [],
    medkits: [],
    missionTarget,
    missionBossDefeated: false,
    missionCompleteQueued: false,
    divineDelivery: shouldDeliverDivineGear ? { time: 0, dropped: false, collected: false, dropX: 0, dropY: 0 } : null,
    divineTrialActive: false,
    divineAwakening: 0,
    divineOverdrive: 0,
    pendingDivineRevive: false,
    ultimate: null,
    world: { infinite: true, domainIndex: 0 },
    camera: { zoom: scene.id === "hospital" ? 1.19 : scene.endless ? 1.13 : 1.16 },
    move: { x: 0, y: 0 },
    director: 1,
    directorTimer: 0,
    spawnTimer: 0.45,
    shotTimer: 0.1,
    performance: { quality: 1, slowFrames: 0 },
    pulseTimer: 0,
    pulseMax: Math.max(14, 22 * (1 - meta.upgrades.pulse * .035)),
    kills: 0,
    pickedXp: 0,
    coins: 0,
    loot: [],
    combo: 0,
    comboTimer: 0,
    shake: 0,
    bossShock: 0,
    flash: 0,
    bossSpawned: false,
    lastBossWave: 0,
    boss: null,
    lives: scene.endless ? 3 : 1,
    invulnerable: 0,
    pendingLevels: 0,
    banner: { text: runType === "resource" ? "丰饶之境" : `${scene.shortName} ${String(missionLevel).padStart(2, "0")}`, sub: runType === "resource" ? `${combatClass.name} · 击破补给兽群，夺取装备与补给币` : scene.endless && endlessNoviceGrace > 0 ? `${combatClass.name} · 初入仙域获得护道加持，随重天逐步解除` : `${combatClass.name} · 指向移动，靠近拾取经验`, time: 2.3 },
    player: {
      weapon,
      combatClass,
      damage: 21 * (1 + meta.upgrades.damage * 0.07) * (1 + gear.damage) * (1 + resonance.damage) * (1 + divine.damage) * combatClass.damage * (scene.endless && combatClass.id === "ranger" ? 1.38 : 1) * (1 + endlessNoviceGrace * .35),
      fireInterval: 0.53 * combatClass.interval * (1 - Math.min(.35, gear.haste)) * (scene.endless && combatClass.id === "ranger" ? 1.58 : 1),
      bulletCount: combatClass.count,
      pierce: combatClass.pierce,
      explosionChance: combatClass.explosion,
      explosionRadius: combatClass.radius,
      slowChance: combatClass.slow,
      critChance: 0.08 + meta.upgrades.crit * 0.015 + gear.crit + divine.crit + combatClass.crit,
      coinBonus: gear.coins,
      pulseBonus: gear.pulse + resonance.pulse + divine.pulse,
      divineGearLevel: divineState.unlocked ? divineState.level : 0,
      projectileLife: combatClass.life,
      x: 0,
      y: 0,
      moveSpeed: combatClass.moveSpeed * (1 + meta.upgrades.mobility * .025),
      targetId: null,
      level: 1,
      xp: 0,
      xpNeeded: 34,
      upgrades: {},
      synergies: {},
      activeSynergy: null,
      aimAngle: -Math.PI / 2,
      muzzle: 0,
      attackAnim: 0,
      walkPhase: 0,
      lastFootstepPhase: 0,
      blockedPulse: 0,
      pickupRange: 96 + meta.upgrades.magnet * 12,
      supportDroneLevel: scene.id === "cultivation" ? 0 : meta.upgrades.drone,
      supportDroneTimer: .35,
      orbitCoreTimer: 0,
      staggerTimer: 0,
      companionPet: getSelectedPet(),
      companionPetTimer: .45,
      spiritPetLevel: QA_MODE && scene.endless ? 3 : 0,
      spiritPets: QA_MODE && scene.endless ? 2 : 0,
      petTimer: .5,
      swordCount: QA_MODE && scene.endless ? 3 : 0,
      wardLevel: QA_MODE && scene.endless ? 2 : 0,
      tribulationLevel: QA_MODE && scene.endless ? 2 : 0,
      tribulationTimer: 2.5,
      lotusLevel: 0,
      talismanLevel: 0,
    },
  };
}

function openLoadout(runType = "main") {
  if (!isLevelUnlocked(selectedSceneIndex, selectedLevel)) {
    showToast(getSceneLockedMessage());
    return;
  }
  refreshDailyState();
  const energyCost = getRunEnergyCost(runType);
  if (meta.energy.current < energyCost) { showToast("体力不足，点击顶部体力通过广告恢复"); return; }
  if (runType === "resource" && meta.dungeon.entries <= 0) { showToast("今日丰饶之境次数已用完"); return; }
  pendingRunType = runType;
  const scene = scenes[selectedSceneIndex];
  document.querySelector("#loadoutTitle").textContent = runType === "resource" ? "选择丰饶远征职业" : `选择${scene.name}职业`;
  document.querySelector(".loadout-hint").textContent = runType === "resource" ? `当前主题：${scene.name}；每个角色读取自己的装备方案。消耗 ${energyCost} 体力。` : `本场只提供符合「${scene.name}」世界观的职业；三名角色分别养成。消耗 ${energyCost} 体力。`;
  ui.classChoices.innerHTML = "";
  for (const combatClass of classDefinitions) {
    const themed = getSceneClassProfile(scene, combatClass.id);
    const button = document.createElement("button");
    button.className = "class-card";
    button.style.setProperty("--class-color", themed.color);
    const orbitGlyph = combatClass.id === "melee" ? "◆" : combatClass.id === "ranger" ? "▷" : "⬢";
    const gearCount = Object.values(getClassGear(combatClass.id)).filter(Boolean).length;
    button.innerHTML = `<i class="class-portrait class-${combatClass.id}${scene.id === "orbit" ? " orbit-craft" : ""}" aria-hidden="true">${scene.id === "orbit" ? orbitGlyph : ""}</i><span><b>${themed.name}</b><p>${themed.description}<br>战力 ${getCombatPower(combatClass.id)} · 装备 ${gearCount}/6</p></span><span>›</span>`;
    button.addEventListener("click", () => startGame(combatClass.id, runType), { once: true });
    ui.classChoices.append(button);
  }
  ui.loadoutModal.classList.remove("hidden");
}

async function startGame(classId = selectedRunClass, runType = pendingRunType) {
  if (assetLaunchPending) return;
  if (!isLevelUnlocked(selectedSceneIndex, selectedLevel)) {
    showToast(getSceneLockedMessage());
    return;
  }
  refreshDailyState();
  const energyCost = getRunEnergyCost(runType);
  if (meta.energy.current < energyCost) { ui.loadoutModal.classList.add("hidden"); showToast("体力不足，点击顶部体力恢复"); return; }
  assetLaunchPending = true;
  ui.loadoutModal.classList.add("asset-loading");
  ui.classChoices.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  document.querySelector("#loadoutTitle").textContent = "正在装载战场素材";
  document.querySelector(".loadout-hint").textContent = "正在校验角色、敌人、背景与灵宠资源；弱网会自动切换兼容素材。";
  let assetsReady = false;
  try {
    assetsReady = await prepareSceneAssets(scenes[selectedSceneIndex].id);
  } catch (error) {
    assetsReady = false;
  }
  assetLaunchPending = false;
  ui.loadoutModal.classList.remove("asset-loading");
  if (!assetsReady) showToast("部分素材仍在加载，已启用兼容占位并后台重试");
  unlockAudio();
  selectedRunClass = classId;
  lastRunType = runType;
  if (runType === "resource") {
    if (meta.dungeon.entries <= 0) { showToast("今日丰饶之境次数已用完"); return; }
    meta.dungeon.entries -= 1;
  }
  if (!QA_MODE && !ADMIN_MODE) meta.energy.current -= energyCost;
  meta.selectedClass = classId;
  saveMeta();
  ui.loadoutModal.classList.add("hidden");
  game = makeGame(runType);
  for (let index = 0; index < 5; index += 1) spawnEnemy(index === 4 ? "runner" : "grunt", null, null, index / 5 * Math.PI * 2 - Math.PI / 2);
  document.querySelector("#app").dataset.scene = game.scene.id;
  mode = "playing";
  paused = false;
  manuallyPaused = false;
  ui.home.classList.add("hidden");
  ui.result.classList.add("hidden");
  ui.retry.disabled = false;
  ui.upgrade.classList.add("hidden");
  ui.pauseOverlay.classList.add("hidden");
  ui.reviveModal.classList.add("hidden");
  ui.hud.classList.remove("hidden");
  ui.pause.textContent = "Ⅱ";
  const ultimate = game.player.combatClass;
  ui.pulseName.textContent = ultimate.ultimateName;
  ui.pulse.querySelector(".pulse-icon").textContent = ultimate.ultimateIcon;
  ui.pulse.dataset.classId = game.player.combatClass.id;
  ui.pulse.setAttribute("aria-label", `释放${ultimate.ultimateName}`);
  ui.bossName.textContent = game.scene.boss;
  syncHud();
  tone(225, 0.11, "sawtooth", 0.045, 1.5);
}

function finishGame(won) {
  if (mode !== "playing") return;
  mode = "result";
  paused = true;
  const resourceRun = game.runType === "resource";
  if (resourceRun && won) game.loot.push(createGuaranteedGear(game.sceneIndex >= 3 ? "epic" : "rare"));
  const clearBonus = resourceRun ? (won ? 120 + getAccountProgress().level * 6 : 18) : won ? 38 + game.missionLevel * 4 + game.sceneIndex * 10 : 10;
  let salvageCoins = 0;
  if (!QA_MODE) {
    for (const item of game.loot) {
      if (meta.equipment.length < 60) meta.equipment.push(item);
      else salvageCoins += rarityDefinitions[item.rarity].multiplier * 12;
    }
  }
  const earned = game.coins + clearBonus + Math.round(salvageCoins);
  let unlockedScene = null;
  if (!QA_MODE) {
    const divineState = getDivineGearState(game.player.combatClass.id);
    if (won && !resourceRun && game.divineTrialActive && !divineState.unlocked) {
      const trialStage = `${game.scene.id}-${game.missionLevel}`;
      if (!divineState.trialStages.includes(trialStage)) divineState.trialStages.push(trialStage);
      divineState.trialRuns = Math.min(2, divineState.trialStages.length);
    }
    meta.coins += earned;
    meta.bestWave = Math.max(meta.bestWave, game.wave);
    meta.daily.runs += 1;
    meta.daily.kills += game.kills;
    meta.daily.xp += game.pickedXp || 0;
    if (resourceRun && won) meta.dungeon.clears += 1;
    if (won && !game.scene.endless && !resourceRun) meta.wins += 1;
    if (won && !game.scene.endless && !resourceRun) {
      const previous = meta.progress[game.scene.id];
      meta.progress[game.scene.id] = Math.max(previous, game.missionLevel);
      if (game.missionLevel === LEVELS_PER_SCENE && previous < LEVELS_PER_SCENE && game.sceneIndex < scenes.length - 1 && !scenes[game.sceneIndex + 1].endless) {
        if (isSceneUnlocked(game.sceneIndex + 1)) unlockedScene = scenes[game.sceneIndex + 1];
      }
    }
    saveMeta();
  }

  if (resourceRun) {
    selectedSceneIndex = game.sceneIndex;
    selectedLevel = game.missionLevel;
  } else if (won && game.missionLevel < LEVELS_PER_SCENE) {
    selectedSceneIndex = game.sceneIndex;
    selectedLevel = game.missionLevel + 1;
  } else if (won && game.sceneIndex < scenes.length - 1) {
    selectedSceneIndex = game.sceneIndex + 1;
    selectedLevel = 1;
  } else {
    selectedSceneIndex = game.sceneIndex;
    selectedLevel = game.missionLevel;
  }
  meta.currentScene = selectedSceneIndex;
  meta.currentLevel = selectedLevel;
  if (!QA_MODE) saveMeta();

  ui.hud.classList.add("hidden");
  ui.upgrade.classList.add("hidden");
  ui.pauseOverlay.classList.add("hidden");
  ui.result.classList.remove("hidden");
  ui.resultBadge.textContent = resourceRun ? (won ? "丰饶远征 · 完成" : "丰饶远征 · 失利") : game.scene.endless ? `修行至 ${getRealmName(game.player.level)}` : won ? `${game.scene.shortName} ${String(game.missionLevel).padStart(2, "0")} · 完成` : "防线失守";
  ui.resultBadge.classList.toggle("fail", !won);
  ui.resultTitle.textContent = resourceRun ? (won ? "补给满载而归" : "整备后再出发") : game.scene.endless ? "本次修行结束" : won ? "区域已收复" : "防线被突破";
  ui.resultSubtitle.textContent = resourceRun ? `今日剩余 ${meta.dungeon.entries} 次 · 通关装备已送入军械库` : game.scene.endless ? `共跨越 ${game.wave} 重天，击败 ${game.kills} 名对手` : unlockedScene
    ? `新章节「${unlockedScene.name}」已经解锁`
    : won && game.missionLevel === LEVELS_PER_SCENE && game.sceneIndex < scenes.length - 1
      ? `${scenes[game.sceneIndex + 1].name}入口已发现 · ${getSceneLockedMessage(game.sceneIndex + 1)}`
    : won && game.missionLevel < LEVELS_PER_SCENE
      ? `${game.scene.boss}已被清除，下一关已经开放`
      : won ? "所有多元战区均已收复" : "强化基地后，再次夺回这个区域";
  ui.resultTime.textContent = formatTime(game.elapsed);
  ui.resultKills.textContent = game.kills;
  ui.resultCoins.textContent = `+${earned}`;
  ui.resultLevel.textContent = game.scene.endless ? getRealmName(game.player.level) : game.player.level;
  const divineState = getDivineGearState(game.player.combatClass.id);
  const divineReady = !divineState.unlocked && divineState.trialRuns >= 2;
  const lootMarkup = game.loot.length
    ? `<b>本局装备掉落${salvageCoins ? ` · 仓库已满，自动回收 ◆${Math.round(salvageCoins)}` : ""}</b>${game.loot.map((item) => `<span style="--rarity:${rarityDefinitions[item.rarity].color}">${item.icon} ${item.name}</span>`).join("")}`
    : "";
  const divineMarkup = divineReady ? `<b class="divine-result-title">神装试玩已完成</b><span style="--rarity:#ffd86b">${divineGearDefinitions[game.player.combatClass.id].icon} ${divineGearDefinitions[game.player.combatClass.id].name}可永久解锁</span><button id="resultDivineUnlock">▶ 看广告永久解锁</button>` : "";
  ui.resultLoot.classList.toggle("hidden", !lootMarkup && !divineMarkup);
  ui.resultLoot.innerHTML = lootMarkup + divineMarkup;
  ui.resultLoot.querySelector("#resultDivineUnlock")?.addEventListener("click", () => unlockDivineGearWithAd(game.player.combatClass.id));
  const autoOfferDivineUnlock = won && !resourceRun && game.sceneIndex === 0 && game.missionLevel === 2 && !divineState.unlocked;
  if (autoOfferDivineUnlock) {
    const classId = game.player.combatClass.id;
    setTimeout(() => {
      if (mode === "result" && !getDivineGearState(classId).unlocked) unlockDivineGearWithAd(classId, true, "stage2");
    }, 650);
  }
  const nextSceneIsLocked = won && !resourceRun && game.missionLevel === LEVELS_PER_SCENE && game.sceneIndex < scenes.length - 1 && !isSceneUnlocked(game.sceneIndex + 1);
  ui.resultActionText.textContent = resourceRun ? (meta.dungeon.entries > 0 ? "再次远征" : "今日次数已用完") : nextSceneIsLocked ? "前往解锁主题装扮" : game.scene.endless ? "再次修行" : won && (game.missionLevel < LEVELS_PER_SCENE || game.sceneIndex < scenes.length - 1) ? "进入下一关" : "再次挑战";
  ui.retry.disabled = resourceRun && meta.dungeon.entries <= 0;
  tone(won ? 523 : 120, won ? 0.35 : 0.5, won ? "triangle" : "sawtooth", 0.06, won ? 1.5 : 0.55);
  if (navigator.vibrate) navigator.vibrate(won ? [50, 50, 90] : [130, 70, 180]);
}

function returnHome() {
  mode = "home";
  paused = false;
  game = null;
  ui.result.classList.add("hidden");
  ui.hud.classList.add("hidden");
  ui.pauseOverlay.classList.add("hidden");
  ui.home.classList.remove("hidden");
  renderHome();
  switchHomePanel("command");
}

function update(dt) {
  game.elapsed += dt;
  game.flash = Math.max(0, game.flash - dt);
  game.divineAwakening = Math.max(0, game.divineAwakening - dt);
  updateDivineOverdrive(dt);
  game.invulnerable = Math.max(0, game.invulnerable - dt);
  game.shake = Math.max(0, game.shake - dt * 15);
  game.bossShock = Math.max(0, game.bossShock - dt);
  game.player.staggerTimer = Math.max(0, game.player.staggerTimer - dt);
  game.player.muzzle = Math.max(0, game.player.muzzle - dt * 8);
  const attackPlaybackRate = game.player.combatClass.id === "melee" ? 2.5 : 3.8;
  game.player.attackAnim = Math.max(0, game.player.attackAnim - dt * attackPlaybackRate);
  game.banner.time = Math.max(0, game.banner.time - dt);
  game.comboTimer -= dt;
  if (game.comboTimer <= 0) game.combo = 0;
  updatePlayerMovement(dt);
  updateDivineDelivery(dt);
  updateCultivationAbilities(dt);
  updateCompanionPet(dt);
  updateSupportDrones(dt);
  updateOrbitGalaxyDefense(dt);
  updateDirector(dt);

  const nextWave = game.scene.endless ? Math.floor(game.elapsed / game.waveSeconds) + 1 : Math.min(TOTAL_WAVES, Math.floor(game.elapsed / game.waveSeconds) + 1);
  if (nextWave !== game.wave) {
    game.wave = nextWave;
    if (game.scene.endless) game.world.domainIndex = Math.floor((nextWave - 1) / 4) % cultivationDomains.length;
    announceWave(nextWave);
  }

  if (!game.scene.endless && game.wave === TOTAL_WAVES && !game.bossSpawned) spawnBoss();
  if (game.scene.endless && game.wave % 5 === 0 && game.lastBossWave !== game.wave && !game.boss) {
    game.lastBossWave = game.wave;
    spawnBoss();
  }

  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0 && game.enemies.length < 92) {
    const reinforcementChance = 0.13 + (game.levelModifier.spawn - 1) * 1.6;
    const amount = game.wave >= 4 && Math.random() < reinforcementChance * game.director ? 2 : 1;
    for (let i = 0; i < amount; i += 1) spawnEnemy(pickEnemyType());
    const pressure = (0.98 - game.wave * 0.092 - Math.min(game.elapsed / 800, 0.1)) / game.levelModifier.spawn;
    game.spawnTimer = Math.max(0.24, pressure / game.director) * rand(0.8, 1.2);
  }

  game.shotTimer -= dt;
  if (game.shotTimer <= 0) {
    shoot();
    game.shotTimer = game.player.fireInterval;
  }

  game.pulseTimer = Math.max(0, game.pulseTimer - dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateEnemyProjectiles(dt);
  updateBossWarnings(dt);
  updateXpDrops(dt);
  updateMedkits(dt);
  updateEffects(dt);
  syncHud();
}

function updateXpDrops(dt) {
  const player = game.player;
  for (const drop of game.xpDrops) {
    drop.age += dt;
    const dx = player.x - drop.x;
    const dy = player.y - drop.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    if (drop.age > .22 && distance < player.pickupRange) {
      const pull = Math.min(720, 170 + (player.pickupRange - distance) * 7.5);
      drop.x += dx / distance * pull * dt;
      drop.y += dy / distance * pull * dt;
    }
    if (distance < 17) {
      drop.collected = true;
      game.pickedXp += 1;
      gainXp(drop.value);
      makeParticles(drop.x, drop.y, drop.color, 5, 70);
      tone(520 + Math.min(220, drop.value * 7), .045, "sine", .012, 1.3);
    }
  }
  game.xpDrops = game.xpDrops.filter((drop) => !drop.collected);
}

function updateMedkits(dt) {
  const player = game.player;
  for (const kit of game.medkits) {
    kit.age += dt;
    kit.pulse += dt * 4;
    const dx = player.x - kit.x;
    const dy = player.y - kit.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    if (game.health < game.maxHealth && distance < player.pickupRange * .7) {
      const pull = Math.min(540, 130 + (player.pickupRange - distance) * 5);
      kit.x += dx / distance * pull * dt;
      kit.y += dy / distance * pull * dt;
    }
    if (game.health < game.maxHealth && distance < 19) {
      kit.collected = true;
      const heal = Math.max(1, Math.round(game.maxHealth * .2));
      game.health = Math.min(game.maxHealth, game.health + heal);
      addFloater(player.x, player.y - 48, `血包 +${heal}`, "#7dffac", 13);
      game.shockwaves.push({ x: player.x, y: player.y, radius: 4, maxRadius: 52, life: .48, color: "#68ff9d" });
      makeParticles(kit.x, kit.y, "#78ffac", 14, 115);
      tone(640, .12, "sine", .03, 1.45);
    }
  }
  game.medkits = game.medkits.filter((kit) => !kit.collected && kit.age < 22);
}

function activateDivineGearTrial() {
  if (game.divineTrialActive) return;
  const player = game.player;
  const stats = getDivineTrialStats(game.sceneIndex, game.missionLevel);
  const definition = divineGearDefinitions[player.combatClass.id];
  const healthGain = Math.round(stats.health * player.combatClass.health * (1 + getGearResonance(player.combatClass.id).health));
  player.damage *= 1 + stats.damage;
  player.critChance += stats.crit;
  player.pulseBonus += stats.pulse;
  player.divineGearLevel = 1;
  game.maxHealth += healthGain;
  game.health = Math.min(game.maxHealth, game.health + healthGain);
  game.pulseTimer = 0;
  game.divineTrialActive = true;
  game.divineAwakening = 2.15;
  game.banner = { text: `${definition.name} · 神器降临`, sub: `伤害 +${Math.round(stats.damage * 100)}% · 生命 +${healthGain} · 暴击 +${Math.round(stats.crit * 100)}%`, time: 3.8 };
  addFloater(player.x, player.y - 58, `超神装备接入 · ${definition.attack}`, "#fff2a5", 14);
  for (let ring = 0; ring < 4; ring += 1) game.shockwaves.push({ x: player.x, y: player.y, radius: 8 + ring * 10, maxRadius: 110 + ring * 46, life: .85 + ring * .16, color: ring % 2 ? "#ffffff" : "#ffd66b" });
  makeDirectionalParticles(player.x, player.y, "#ffe38c", 76, 260, -Math.PI / 2, Math.PI * 2, "spark");
  makeDirectionalParticles(player.x, player.y - 25, "#ffffff", 34, 185, -Math.PI / 2, 1.8, "glyph");
  game.shake = Math.max(game.shake, 16);
  game.flash = Math.max(game.flash, .82);
  tone(330, .18, "triangle", .05, 1.8);
  setTimeout(() => tone(660, .24, "sine", .045, 1.55), 100);
}

function updateDivineOverdrive(dt) {
  if (!game?.divineOverdrive) return;
  game.divineOverdrive = Math.max(0, game.divineOverdrive - dt);
  game.divineOverdriveFx = (game.divineOverdriveFx || 0) - dt;
  if (game.divineOverdriveFx > 0) return;
  game.divineOverdriveFx = .085;
  const player = game.player;
  const angle = rand(0, Math.PI * 2);
  const radius = rand(22, 64);
  makeDirectionalParticles(player.x + Math.cos(angle) * radius, player.y + Math.sin(angle) * radius * .45, Math.random() < .5 ? "#fff5b0" : "#6ffff1", 3, 90, angle, .8, "spark");
}

function activateDivineRescueOverdrive() {
  if (!game) return;
  const player = game.player;
  game.health = game.maxHealth;
  game.invulnerable = 3.2;
  game.pulseTimer = 0;
  game.divineOverdrive = 18;
  player.damage *= 4.8;
  player.fireInterval *= .42;
  player.bulletCount += 2;
  player.pierce += 4;
  player.critChance = Math.max(player.critChance, .72);
  for (const enemy of [...game.enemies]) {
    if (enemy.type === "boss") {
      enemy.hp = Math.max(1, enemy.hp * .42);
      enemy.shield = 0;
    } else damageEnemy(enemy, enemy.maxHp * 2, true, true);
  }
  game.banner = { text: "神器完全解放 · 横推模式", sub: "本局神威：火力 ×4.8 · 极速连击 · 无限贯穿", time: 4.2 };
  for (let ring = 0; ring < 5; ring += 1) game.shockwaves.push({ x: player.x, y: player.y, radius: 12 + ring * 14, maxRadius: 180 + ring * 62, life: .9 + ring * .14, color: ring % 2 ? "#71fff0" : "#ffe177" });
  makeDirectionalParticles(player.x, player.y, "#fff0a0", 96, 360, -Math.PI / 2, Math.PI * 2, "spark");
  game.shake = 22;
  game.flash = 1;
}

function updateDivineDelivery(dt) {
  const delivery = game.divineDelivery;
  if (!delivery || delivery.collected) return;
  delivery.time += dt;
  if (!delivery.announced && delivery.time > .2) {
    delivery.announced = true;
    const state = getDivineGearState(game.player.combatClass.id);
    game.banner = {
      text: "战略无人机正在投送超神装备",
      sub: state.trialRuns >= 2 ? "未永久解锁，将继续为本局投送" : `限时体验进度 ${state.trialRuns}/2 · 靠近补给箱拾取`,
      time: 2.8,
    };
  }
  if (!delivery.dropped && delivery.time >= 1.65) {
    delivery.dropped = true;
    delivery.dropX = game.player.x + Math.cos(game.player.aimAngle + .7) * 76;
    delivery.dropY = game.player.y + Math.sin(game.player.aimAngle + .7) * 54;
    game.shockwaves.push({ x: delivery.dropX, y: delivery.dropY, radius: 3, maxRadius: 44, life: .62, color: "#ffd66b" });
    makeDirectionalParticles(delivery.dropX, delivery.dropY, "#bcecff", 15, 100, Math.PI / 2, .8, "spark");
    tone(190, .12, "square", .025, .72);
  }
  if (!delivery.dropped) return;
  let dx = game.player.x - delivery.dropX;
  let dy = game.player.y - delivery.dropY;
  let distance = Math.max(1, Math.hypot(dx, dy));
  if (delivery.time > 4 && distance > 32) {
    const pull = Math.min(230, 85 + (delivery.time - 4) * 42);
    delivery.dropX += dx / distance * pull * dt;
    delivery.dropY += dy / distance * pull * dt;
    dx = game.player.x - delivery.dropX;
    dy = game.player.y - delivery.dropY;
    distance = Math.hypot(dx, dy);
  }
  if (distance <= 32) {
    delivery.collected = true;
    activateDivineGearTrial();
  }
}

function updatePlayerMovement(dt) {
  const keyboardX = (movementKeys.has("ArrowRight") || movementKeys.has("KeyD") ? 1 : 0) - (movementKeys.has("ArrowLeft") || movementKeys.has("KeyA") ? 1 : 0);
  const keyboardY = (movementKeys.has("ArrowDown") || movementKeys.has("KeyS") ? 1 : 0) - (movementKeys.has("ArrowUp") || movementKeys.has("KeyW") ? 1 : 0);
  let moveX = keyboardX || game.move.x;
  let moveY = keyboardY || game.move.y;
  const length = Math.hypot(moveX, moveY);
  if (length > 0) {
    moveX /= Math.max(1, length);
    moveY /= Math.max(1, length);
    const staggerScale = game.player.staggerTimer > 0 ? .38 : 1;
    const nextX = game.player.x + moveX * game.player.moveSpeed * staggerScale * dt;
    const nextY = game.player.y + moveY * game.player.moveSpeed * staggerScale * dt;
    const canMoveBoth = !isWorldPositionBlocked(nextX, nextY);
    const canMoveX = !isWorldPositionBlocked(nextX, game.player.y);
    const canMoveY = !isWorldPositionBlocked(game.player.x, nextY);
    if (canMoveBoth) { game.player.x = nextX; game.player.y = nextY; }
    else if (canMoveX) game.player.x = nextX;
    else if (canMoveY) game.player.y = nextY;
    else game.player.blockedPulse = .18;
    game.player.walkPhase += dt * (8 + Math.min(4, length * 4));
    if (Math.floor(game.player.walkPhase / Math.PI) !== Math.floor(game.player.lastFootstepPhase / Math.PI)) {
      const side = Math.floor(game.player.walkPhase / Math.PI) % 2 ? -1 : 1;
      game.groundMarks.push({ x: game.player.x - moveY * side * 7, y: game.player.y + 25 + moveX * side * 7, angle: Math.atan2(moveY, moveX), life: game.scene.id === "snow" ? 5 : 1.7, maxLife: game.scene.id === "snow" ? 5 : 1.7 });
    }
    game.player.lastFootstepPhase = game.player.walkPhase;
  }
  game.player.blockedPulse = Math.max(0, game.player.blockedPulse - dt);
}

function isWorldPositionBlocked(x, y) {
  if (game.scene.id === "orbit") return false;
  const tile = game.scene.endless ? 1080 : 980;
  const localX = ((x + tile / 2) % tile + tile) % tile - tile / 2;
  const localY = ((y + tile / 2) % tile + tile) % tile - tile / 2;
  const edge = game.scene.id === "hospital" ? 390 : 405;
  const lane = game.scene.id === "city" ? 150 : game.scene.id === "hospital" ? 190 : 175;
  return (Math.abs(localX) > edge && Math.abs(localY) > lane) || (Math.abs(localY) > edge && Math.abs(localX) > lane);
}

function launchCultivationShot(x, y, target, damage, color, style = "orb") {
  const angle = Math.atan2(target.y - y, target.x - x);
  game.bullets.push({
    x, y, vx: Math.cos(angle) * 520, vy: Math.sin(angle) * 520,
    damage, pierceLeft: style === "blade" ? 2 : 0, explosive: false,
    color, accent: "#ffffff", visual: style === "blade" ? "pulse" : "magic", attackStyle: style,
    fx: style === "blade" ? "spiritSword" : "spiritPet", trail: [], age: 0,
    size: style === "blade" ? 4 : 5, hits: new Set(), dead: false, life: 1.5,
  });
}

function updateCultivationAbilities(dt) {
  if (!game.scene.endless) return;
  const player = game.player;
  if (player.wardLevel > 0) game.health = Math.min(game.maxHealth, game.health + game.maxHealth * (.00035 + player.wardLevel * .00008) * dt * 60);
  if (player.spiritPetLevel > 0) {
    player.petTimer -= dt;
    if (player.petTimer <= 0) {
      const targets = game.enemies.filter((enemy) => !enemy.dead).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
      for (let i = 0; i < Math.min(player.spiritPets, targets.length); i += 1) {
        const angle = ambienceTime * 1.7 + i / player.spiritPets * Math.PI * 2;
        launchCultivationShot(player.x + Math.cos(angle) * 48, player.y + Math.sin(angle) * 24 - 12, targets[i], player.damage * (.42 + player.spiritPetLevel * .055), "#ffd88a", "orb");
      }
      player.petTimer = Math.max(.34, 1.15 - player.spiritPetLevel * .055);
    }
  }
  if (player.tribulationLevel > 0) {
    player.tribulationTimer -= dt;
    if (player.tribulationTimer <= 0) {
      const targets = game.enemies.filter((enemy) => !enemy.dead).sort((a, b) => b.realm - a.realm || b.hp - a.hp).slice(0, Math.min(5, 1 + Math.floor(player.tribulationLevel / 2)));
      for (const enemy of targets) {
        damageEnemy(enemy, player.damage * (1.75 + player.tribulationLevel * .22), true, true);
        game.lightnings.push({ x: enemy.x, y: enemy.y, life: .28, maxLife: .28, seed: rand(0, 99) });
        game.shockwaves.push({ x: enemy.x, y: enemy.y, radius: 3, maxRadius: 44, life: .3, color: "#dfffa8" });
      }
      player.tribulationTimer = Math.max(1.55, 5.2 - player.tribulationLevel * .28);
      game.shake = Math.max(game.shake, 5);
      tone(105, .12, "sawtooth", .035, 2.6);
    }
  }
}

function getCompanionPetPosition() {
  const angle = ambienceTime * .9 + Math.PI * .72;
  return { x: game.player.x + Math.cos(angle) * 46, y: game.player.y + Math.sin(angle) * 24 + 8 };
}

function updateCompanionPet(dt) {
  const player = game.player;
  const pet = player.companionPet;
  if (!pet) return;
  player.companionPetTimer -= dt;
  if (player.companionPetTimer > 0) return;
  const origin = getCompanionPetPosition();
  const target = game.enemies.filter((enemy) => !enemy.dead).sort((a, b) => Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y))[0];
  if (target && Math.hypot(target.x - origin.x, target.y - origin.y) < 390) {
    launchCultivationShot(origin.x, origin.y - 8, target, player.damage * pet.damage, pet.color, pet.style);
    makeDirectionalParticles(origin.x, origin.y - 8, pet.color, 4, 72, Math.atan2(target.y - origin.y, target.x - origin.x), .7, "spark");
    player.companionPetTimer = pet.interval;
  } else player.companionPetTimer = .18;
}

function drawCompanionPet() {
  const pet = game.player.companionPet;
  if (!pet) return;
  const position = getCompanionPetPosition();
  const bob = Math.sin(ambienceTime * 5.2) * 2.5;
  ctx.save(); ctx.translate(position.x, position.y + bob);
  ctx.fillStyle = "rgba(0,0,0,.34)"; ctx.beginPath(); ctx.ellipse(0, 19 - bob, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 37);
  aura.addColorStop(0, colorAlpha(pet.color, .22)); aura.addColorStop(1, colorAlpha(pet.color, 0));
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 37, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  if (companionAtlas.complete && companionAtlas.naturalWidth) {
    const sourceWidth = companionAtlas.naturalWidth / 3;
    const facing = Math.cos(ambienceTime * .9 + Math.PI * .72) < 0 ? -1 : 1;
    const attackPulse = game.player.companionPetTimer > pet.interval - .16 ? Math.sin((pet.interval - game.player.companionPetTimer) / .16 * Math.PI) : 0;
    ctx.scale(facing, 1);
    ctx.rotate(Math.sin(ambienceTime * 3.1) * .025 - attackPulse * .07);
    ctx.shadowColor = pet.color; ctx.shadowBlur = 14 + attackPulse * 12;
    const width = pet.id === "warHound" ? 78 : 72;
    const height = pet.id === "herbSprite" ? 63 : 66;
    ctx.drawImage(companionAtlas, sourceWidth * pet.spriteIndex, 0, sourceWidth, companionAtlas.naturalHeight, -width / 2, -height * .69, width, height);
  } else {
    ctx.shadowColor = pet.color; ctx.shadowBlur = 12; ctx.fillStyle = colorAlpha(pet.color, .92);
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 10, -.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, -7, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = pet.color; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-11, 1, 18, 1.7, 4.8); ctx.stroke();
  }
  ctx.restore();
}

function updateDirector(dt) {
  game.directorTimer -= dt;
  if (game.directorTimer > 0) return;
  game.directorTimer = 1.2;
  const healthRatio = game.health / game.maxHealth;
  const crowd = game.enemies.length;
  let desired = .64 + healthRatio * .86;
  if (crowd > 34) desired -= .2;
  if (crowd < 12 && healthRatio > .65) desired += .1;
  desired = Math.max(.66, Math.min(1.5, desired));
  game.director += (desired - game.director) * .22;
  game.director = Math.max(.66, Math.min(1.5, game.director));
}

function pickEnemyType() {
  const r = Math.random();
  const heavyBonus = game.missionLevel >= 7 ? 0.07 : 0;
  if (game.wave >= 4 && r < 0.12 + heavyBonus) return "tank";
  if (game.wave >= 3 && r < 0.17 + heavyBonus) return "caster";
  if (game.wave >= 2 && r < 0.24 + heavyBonus) return "ranged";
  if (game.wave >= 3 && r < 0.43 + heavyBonus) return "splitter";
  if (game.wave >= 2 && r < 0.66) return "runner";
  return "grunt";
}

function enemyStats(type) {
  const pressureScale = game.scene.endless ? 1 + (game.wave - 1) * .085 + game.elapsed * .0006 : 1 + (game.wave - 1) * 0.18 + game.elapsed * 0.0015;
  const endlessOpeningScale = game.scene.endless ? (.72 + Math.min(.28, (game.wave - 1) * .04)) * (1 - game.endlessNoviceGrace * .1) : 1;
  const hpScale = pressureScale * game.difficulty * game.levelModifier.hp * endlessOpeningScale;
  const palette = game.scene.palette;
  const entries = {
    grunt: { hp: 68, speed: 38, size: 21, damage: 8, reward: 2, xp: 8, color: palette[0] },
    runner: { hp: 46, speed: 62, size: 17, damage: 7, reward: 2, xp: 7, color: palette[1] },
    tank: { hp: 235, speed: 24, size: 31, damage: 16, reward: 7, xp: 20, color: palette[2] },
    splitter: { hp: 108, speed: 34, size: 24, damage: 10, reward: 4, xp: 12, color: palette[3] },
    mini: { hp: 28, speed: 68, size: 12, damage: 5, reward: 1, xp: 4, color: palette[4] },
    ranged: { hp: 72, speed: 32, size: 20, damage: 8, reward: 3, xp: 9, color: palette[1] },
    caster: { hp: 96, speed: 27, size: 23, damage: 12, reward: 5, xp: 13, color: palette[4] },
    boss: { hp: QA_MODE ? 320 : 1320 + game.missionLevel * 52, speed: QA_MODE ? 76 : 25, size: 74, damage: 28, reward: 65 + game.missionLevel * 3, xp: 80, color: palette[5] },
  };
  const base = entries[type];
  const divineFinaleGate = type === "boss" && game.sceneIndex === 0 && game.missionLevel === LEVELS_PER_SCENE && !getDivineGearState(game.player.combatClass.id).unlocked;
  const bossScale = game.difficulty * (game.missionLevel === LEVELS_PER_SCENE ? 1.28 : 1) * (divineFinaleGate ? 2.55 : 1);
  const realmOffset = game.scene.endless
    ? type === "boss" ? (game.wave <= 5 ? 1 : Math.floor(rand(1, 4))) : game.wave >= 6 && Math.random() < .07 ? Math.floor(rand(2, 5)) : Math.floor(rand(-1, 2))
    : 0;
  const realm = game.scene.endless ? Math.max(1, game.player.level + realmOffset) : 1;
  const realmGap = game.scene.endless ? realm - game.player.level : 0;
  const realmScale = game.scene.endless
    ? (1 + (realm - 1) * .075) * Math.pow(1.48, Math.max(0, realmGap)) * Math.pow(.87, Math.max(0, -realmGap))
    : 1;
  const adaptiveScale = .62 + game.director * .46;
  const health = Math.round(base.hp * (type === "boss" ? bossScale : hpScale) * realmScale * adaptiveScale * (game.scene.endless && type === "boss" ? endlessOpeningScale : 1));
  const damageScale = game.scene.endless ? Math.pow(1.3, Math.max(0, realmGap)) : Math.sqrt(realmScale);
  const minionDamageBoost = type === "boss" ? 1 : 1.14;
  const damage = Math.round(base.damage * damageScale * (.68 + game.director * .38) * (divineFinaleGate ? 1.55 : 1) * endlessOpeningScale * minionDamageBoost);
  return { ...base, realm, divineFinaleGate, speed: base.speed * game.levelModifier.speed * (game.scene.endless ? Math.min(1.36, 1 + Math.max(0, realmGap) * .055) : 1), damage, hp: health, maxHp: health };
}

function spawnEnemy(type, x, y, forcedAngle) {
  if (x == null || y == null) {
    const angle = forcedAngle ?? rand(0, Math.PI * 2);
    const zoom = game.camera?.zoom || 1;
    const halfWidth = W / (2 * zoom);
    const halfHeight = H / (2 * zoom);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const edgeDistance = 1 / Math.max(Math.abs(cos) / halfWidth, Math.abs(sin) / halfHeight);
    const radius = edgeDistance + rand(14, 54);
    x = game.player.x + cos * radius;
    y = game.player.y + sin * radius;
  }
  const stats = enemyStats(type);
  const enemy = {
    id: nextId++,
    type,
    x,
    y,
    sway: rand(0, Math.PI * 2),
    curveSign: Math.random() < .5 ? -1 : 1,
    pursuitPhase: rand(0, Math.PI * 2),
    attackTimer: rand(0.2, 0.8),
    skillTimer: rand(2.4, 4.5),
    bossSkillIndex: 0,
    dashTimer: 0,
    slowTimer: 0,
    flash: 0,
    dead: false,
    ...stats,
  };
  if (type === "tank") enemy.shield = Math.round(enemy.maxHp * .28);
  game.enemies.push(enemy);
  return enemy;
}

function spawnBoss() {
  game.bossSpawned = true;
  game.boss = spawnEnemy("boss", game.player.x, game.player.y - (game.scene.endless ? 225 : 420));
  const bossName = game.scene.endless ? cultivationDomains[game.world.domainIndex].boss : game.scene.boss;
  ui.bossName.textContent = bossName;
  game.banner = game.boss.divineFinaleGate
    ? { text: "神性装甲 · 极限战力墙", sub: `${bossName}已完成终章进化，永久神器可击穿其核心`, time: 4.2 }
    : { text: "警告 · 首领来袭", sub: `${bossName}正在接近`, time: 3.2 };
  game.shake = 9;
  tone(85, 0.5, "sawtooth", 0.06, 0.65);
  if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
}

function announceWave(wave) {
  const names = ["前沿接触", "快速单位来袭", "敌群扩散", "重型目标出现", "最后防线", game.scene.boss];
  const domain = game.scene.endless ? cultivationDomains[game.world.domainIndex] : null;
  const enteringDomain = game.scene.endless && (wave - 1) % 4 === 0;
  const sub = game.scene.endless ? `${domain.name} · 修为 ${game.player.level} · 灵压继续增强` : names[wave - 1];
  game.banner = { text: enteringDomain ? `踏入 · ${domain.name}` : game.scene.endless ? `无尽 · 第 ${wave} 重天` : `第 ${wave} 波`, sub, time: enteringDomain ? 3 : 2.25 };
  tone(175 + wave * 28, 0.12, "triangle", 0.035, 1.4);
}

function launchSupportDroneShot(x, y, target, damage) {
  const angle = Math.atan2(target.y - y, target.x - x);
  game.bullets.push({
    x, y, vx: Math.cos(angle) * 610, vy: Math.sin(angle) * 610,
    damage, pierceLeft: 1, explosive: false, color: "#9ef4ff", accent: "#ffffff",
    visual: "pulse", attackStyle: "shot", contactAttack: false, attackId: nextId++,
    fx: "supportDrone", size: 3, hitRadius: 6, trail: [], age: 0, hits: new Set(), dead: false, life: 1.4,
  });
}

function updateSupportDrones(dt) {
  const player = game.player;
  if (!player.supportDroneLevel || game.scene.id === "cultivation") return;
  player.supportDroneTimer -= dt;
  if (player.supportDroneTimer > 0) return;
  const count = Math.min(5, 1 + Math.floor((player.supportDroneLevel - 1) / 2));
  const targets = game.enemies.filter((enemy) => !enemy.dead).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)).slice(0, count);
  for (let index = 0; index < targets.length; index += 1) {
    const angle = ambienceTime * 1.35 + index / count * Math.PI * 2;
    launchSupportDroneShot(player.x + Math.cos(angle) * 52, player.y + Math.sin(angle) * 25 - 13, targets[index], player.damage * (.28 + player.supportDroneLevel * .035));
  }
  player.supportDroneTimer = Math.max(.42, 1.35 - player.supportDroneLevel * .085);
}

function getOrbitGalaxyState() {
  const overdrive = game.ultimate?.type === "galaxyOverdrive";
  const breathe = .5 + .5 * Math.sin(game.elapsed * (overdrive ? 3.8 : 1.25));
  return {
    overdrive,
    count: Math.min(6, 3 + Math.floor((game.player.level - 1) / 3)),
    radius: (overdrive ? 128 : 82) + breathe * (overdrive ? 96 : 48),
    speed: overdrive ? 4.8 : 1.35,
  };
}

function updateOrbitGalaxyDefense(dt) {
  const player = game.player;
  if (game.scene.id !== "orbit" || player.combatClass.id !== "melee") return;
  player.orbitCoreTimer -= dt;
  if (player.orbitCoreTimer > 0) return;
  const state = getOrbitGalaxyState();
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    for (let index = 0; index < state.count; index += 1) {
      const angle = game.elapsed * state.speed + index / state.count * Math.PI * 2;
      const planetX = player.x + Math.cos(angle) * state.radius;
      const planetY = player.y + Math.sin(angle) * state.radius * .52;
      if (Math.hypot(enemy.x - planetX, enemy.y - planetY) > enemy.size + (state.overdrive ? 20 : 14)) continue;
      game.ultimateDamageActive = state.overdrive;
      damageEnemy(enemy, player.damage * (state.overdrive ? 1.15 : .58), false, true);
      game.ultimateDamageActive = false;
      enemy.slowTimer = Math.max(enemy.slowTimer, .45);
      makeParticles(planetX, planetY, index % 2 ? "#bca8ff" : "#73e9ff", 5, 82);
      break;
    }
  }
  player.orbitCoreTimer = state.overdrive ? .16 : .32;
}

function shoot() {
  const player = game.player;
  const maxRange = player.combatClass.speed * player.projectileLife;
  const zoom = game.camera?.zoom || 1;
  const visibleHalfWidth = W / (2 * zoom) + 32;
  const visibleHalfHeight = H / (2 * zoom) + 34;
  let target = null;
  let targetDistance = maxRange * maxRange;
  for (const enemy of game.enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    if (enemy.dead || Math.abs(dx) > visibleHalfWidth || Math.abs(dy) > visibleHalfHeight) continue;
    const distance = dx * dx + dy * dy;
    if (distance <= targetDistance) { target = enemy; targetDistance = distance; }
  }
  if (!target) return;
  const originX = player.x;
  const originY = player.y;
  const baseAngle = Math.atan2(target.y - originY, target.x - originX);
  player.targetId = target.id;
  player.aimAngle = baseAngle;
  player.muzzle = 1;
  player.attackAnim = 1;
  if (game.scene.id === "orbit" && player.combatClass.id === "melee") return;

  const count = game.player.bulletCount;
  const weapon = game.player.weapon;
  const combatClass = game.player.combatClass;
  const attackId = nextId++;
  const identityPierce = { icicle: 1, laser: 2, rail: 3, flyingSword: 2, spell: 1 }[combatClass.fx] || 0;
  for (let i = 0; i < count; i += 1) {
    const angle = baseAngle + (i - (count - 1) / 2) * combatClass.spread;
    game.bullets.push({
      x: originX + Math.cos(angle) * 27,
      y: originY + Math.sin(angle) * 27,
      vx: Math.cos(angle) * combatClass.speed,
      vy: Math.sin(angle) * combatClass.speed,
      damage: game.player.damage,
      pierceLeft: game.player.pierce + identityPierce,
      explosive: Math.random() < game.player.explosionChance,
      color: combatClass.color,
      accent: weapon.color,
      visual: weapon.visual,
      attackStyle: game.scene.endless ? (combatClass.id === "mage" ? "orb" : "blade") : combatClass.style,
      contactAttack: combatClass.id === "melee",
      attackId,
      fx: combatClass.fx,
      size: combatClass.fx === "flyingSword" ? 18 : weapon.id === "starbreaker" ? 8 : weapon.visual === "magic" ? 5 : 3,
      hitRadius: combatClass.fx === "flyingSword" ? 24 : 5,
      trail: [],
      age: 0,
      hits: new Set(),
      dead: false,
      life: game.player.projectileLife,
    });
  }
  if (game.scene.endless && player.swordCount > 0) {
    const swords = Math.min(6, 1 + Math.floor(player.swordCount / 2));
    for (let i = 0; i < swords; i += 1) {
      const orbit = ambienceTime * 2.1 + i / swords * Math.PI * 2;
      launchCultivationShot(originX + Math.cos(orbit) * 42, originY + Math.sin(orbit) * 22 - 14, target, player.damage * (.3 + player.swordCount * .035), "#dffff0", "blade");
    }
  }
  const muzzleX = originX + Math.cos(baseAngle) * 38;
  const muzzleY = originY + Math.sin(baseAngle) * 38;
  if (combatClass.id !== "melee") {
    game.shockwaves.push({ x: muzzleX, y: muzzleY, radius: 2, maxRadius: 20, life: .18, color: combatClass.color });
    makeDirectionalParticles(muzzleX, muzzleY, combatClass.color, weapon.id === "starbreaker" ? 10 : 4, weapon.id === "starbreaker" ? 150 : 85, baseAngle + Math.PI, .62, "spark");
  }
  game.shake = Math.max(game.shake, combatClass.id === "melee" ? 2.4 : weapon.id === "starbreaker" ? 3.2 : 1.1);
  tone(weapon.id === "starbreaker" ? 92 : combatClass.id === "mage" ? 410 : 245, weapon.id === "starbreaker" ? .11 : 0.026, combatClass.id === "mage" ? "sine" : "square", weapon.id === "starbreaker" ? .035 : 0.012, weapon.id === "starbreaker" ? .52 : .72);
}

function buildEnemySpatialIndex() {
  const buckets = new Map();
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    const gx = Math.floor(enemy.x / ENEMY_GRID_SIZE);
    const gy = Math.floor(enemy.y / ENEMY_GRID_SIZE);
    const key = enemyGridKey(gx, gy);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(enemy);
    else buckets.set(key, [enemy]);
  }
  game.enemySpatialIndex = buckets;
}

function queryNearbyEnemies(x, y, radius) {
  const buckets = game.enemySpatialIndex;
  if (!buckets) return game.enemies;
  const minX = Math.floor((x - radius) / ENEMY_GRID_SIZE);
  const maxX = Math.floor((x + radius) / ENEMY_GRID_SIZE);
  const minY = Math.floor((y - radius) / ENEMY_GRID_SIZE);
  const maxY = Math.floor((y + radius) / ENEMY_GRID_SIZE);
  const results = [];
  for (let gx = minX; gx <= maxX; gx += 1) {
    for (let gy = minY; gy <= maxY; gy += 1) {
      const bucket = buckets.get(enemyGridKey(gx, gy));
      if (bucket) results.push(...bucket);
    }
  }
  return results;
}

function findClosestLivingEnemy(x, y) {
  let closest = null;
  let closestDistance = Infinity;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const distance = dx * dx + dy * dy;
    if (distance < closestDistance) { closest = enemy; closestDistance = distance; }
  }
  return closest;
}

function updateBullets(dt) {
  buildEnemySpatialIndex();
  for (const bullet of game.bullets) {
    if (bullet.visual === "swarm" || bullet.fx === "drone") {
      const target = findClosestLivingEnemy(bullet.x, bullet.y);
      if (target) {
        const speed = Math.hypot(bullet.vx, bullet.vy);
        const angle = Math.atan2(target.y - bullet.y, target.x - bullet.x);
        bullet.vx += (Math.cos(angle) * speed - bullet.vx) * Math.min(1, dt * 4.5);
        bullet.vy += (Math.sin(angle) * speed - bullet.vy) * Math.min(1, dt * 4.5);
      }
    }
    bullet.trail ||= [];
    bullet.trailTimer = (bullet.trailTimer || 0) - dt;
    if (!bullet.contactAttack && bullet.fx !== "flyingSword" && bullet.trailTimer <= 0) {
      bullet.trail.unshift({ x: bullet.x, y: bullet.y });
      if (bullet.trail.length > (bullet.fx === "laser" || bullet.fx === "rail" ? 14 : 9)) bullet.trail.pop();
      bullet.trailTimer = .026;
    }
    bullet.age = (bullet.age || 0) + dt;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    if (bullet.life <= 0) bullet.dead = true;

    for (const enemy of queryNearbyEnemies(bullet.x, bullet.y, 112)) {
      if (bullet.dead || enemy.dead || bullet.hits.has(enemy.id)) continue;
      if (bullet.contactAttack && enemy.lastContactAttackId === bullet.attackId) continue;
      const dx = enemy.x - bullet.x;
      const dy = enemy.y - bullet.y;
      if (dx * dx + dy * dy > (enemy.size + (bullet.hitRadius || 5)) ** 2) continue;

      bullet.hits.add(enemy.id);
      if (bullet.contactAttack) enemy.lastContactAttackId = bullet.attackId;
      const critical = Math.random() < game.player.critChance;
      const dealt = bullet.damage * (critical ? 2 : 1);
      const impactAngle = Math.atan2(bullet.vy, bullet.vx);
      const surfaceDistance = enemy.size * (game.scene.endless ? 1.05 : .76);
      const impactX = enemy.x - Math.cos(impactAngle) * surfaceDistance;
      const impactY = enemy.y - Math.sin(impactAngle) * surfaceDistance;
      damageEnemy(enemy, dealt, critical);
      const piercingThrough = bullet.pierceLeft > 0;
      spawnImpactBurst(impactX, impactY, bullet, critical, enemy, piercingThrough && !critical);
      enemy.hitAngle = impactAngle;
      enemy.hitKick = bullet.contactAttack ? 9 : critical ? 6 : 3.5;
      if (!enemy.dead) {
        const knockback = bullet.contactAttack ? (enemy.type === "boss" ? 3 : 9) : critical ? 3 : 0;
        enemy.x += Math.cos(impactAngle) * knockback;
        enemy.y += Math.sin(impactAngle) * knockback;
      }
      applyAttackIdentity(bullet, enemy, impactX, impactY, impactAngle);
      if (Math.random() < game.player.slowChance) enemy.slowTimer = Math.max(enemy.slowTimer, 2.5);
      if (bullet.explosive) explode(impactX, impactY, enemy);

      if (bullet.pierceLeft > 0) bullet.pierceLeft -= 1;
      else bullet.dead = true;
    }
  }
  game.bullets = game.bullets.filter((bullet) => !bullet.dead);
  if (game.bullets.length > EFFECT_LIMITS.bullets) game.bullets.splice(0, game.bullets.length - EFFECT_LIMITS.bullets);
}

function applyAttackIdentity(bullet, enemy, x, y, angle) {
  const livingNearby = (radius) => queryNearbyEnemies(x, y, radius + 82).filter((entry) => entry !== enemy && !entry.dead && Math.hypot(entry.x - x, entry.y - y) <= radius + entry.size);
  const splash = (radius, multiplier, color = bullet.color) => {
    for (const entry of livingNearby(radius)) damageEnemy(entry, bullet.damage * multiplier, false, true);
    game.shockwaves.push({ x, y, radius: 2, maxRadius: radius, life: .22, color });
  };
  const pull = (radius, strength) => {
    for (const entry of livingNearby(radius)) {
      const pullAngle = Math.atan2(y - entry.y, x - entry.x);
      const amount = entry.type === "boss" ? strength * .25 : strength;
      entry.x += Math.cos(pullAngle) * amount;
      entry.y += Math.sin(pullAngle) * amount;
      entry.slowTimer = Math.max(entry.slowTimer, 1.2);
    }
  };

  if (["snowball", "icicle", "cryo"].includes(bullet.fx) && !enemy.dead) {
    enemy.slowTimer = Math.max(enemy.slowTimer, bullet.fx === "cryo" ? 3.2 : 1.8);
  }

  switch (bullet.fx) {
    case "powerArc":
      if (!enemy.dead) enemy.hitKick = Math.max(enemy.hitKick || 0, enemy.type === "boss" ? 7 : 13);
      break;
    case "tesla":
    case "ionArc": {
      const chained = livingNearby(bullet.fx === "tesla" ? 128 : 82).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      if (chained) {
        damageEnemy(chained, bullet.damage * (bullet.fx === "tesla" ? .42 : .28), false, true);
        const chainAngle = Math.atan2(chained.y - y, chained.x - x);
        makeDirectionalParticles(x, y, bullet.color, 7, 150, chainAngle, .16, "spark");
        game.shockwaves.push({ x: chained.x, y: chained.y, radius: 2, maxRadius: 15, life: .17, color: bullet.color });
      }
      break;
    }
    case "disinfectant":
      splash(42, .18, "#89ffe1");
      break;
    case "antibody":
      game.health = Math.min(game.maxHealth, game.health + Math.max(.35, bullet.damage * .018));
      break;
    case "serum":
      splash(58, .3, "#72ffd0");
      for (const entry of livingNearby(58)) entry.slowTimer = Math.max(entry.slowTimer, 1.35);
      break;
    case "flameArc":
      splash(47, .24, "#ff9d55");
      break;
    case "plasma":
      splash(68, .38, "#ff7fc7");
      makeDirectionalParticles(x, y, "#ffd28a", 9, 135, angle, 1.15, "spark");
      break;
    case "gravityArc":
      pull(70, 11);
      break;
    case "lunarBolt":
      if (!enemy.dead) {
        const push = enemy.type === "boss" ? 2 : 7;
        enemy.x += Math.cos(angle) * push;
        enemy.y += Math.sin(angle) * push;
      }
      break;
    case "graviton":
      pull(96, 16);
      splash(54, .2, "#c4b7ff");
      break;
    case "qiArc":
      if (!enemy.dead) enemy.slowTimer = Math.max(enemy.slowTimer, .55);
      makeDirectionalParticles(x, y, "#ffe6a2", 6, 105, angle, .38, "glyph");
      break;
    case "flyingSword":
      splash(62, .28, "#b9ffe5");
      break;
    case "spell":
      splash(44, .2, "#d5b4ff");
      break;
    default:
      break;
  }

  const synergy = game.player.activeSynergy;
  if (!synergy || bullet.synergyTriggered) return;
  bullet.synergyTriggered = true;
  const classId = game.player.combatClass.id;
  if (classId === "melee") {
    const radius = 58 + game.player.explosionRadius * .18;
    splash(radius, .3, synergy.color);
    for (const entry of livingNearby(radius)) {
      const pushAngle = Math.atan2(entry.y - y, entry.x - x);
      const push = entry.type === "boss" ? 3 : 12;
      entry.x += Math.cos(pushAngle) * push;
      entry.y += Math.sin(pushAngle) * push;
    }
    makeDirectionalParticles(x, y, synergy.color, 10, 145, angle, 1.05, "shard");
  } else if (classId === "ranger") {
    const chained = livingNearby(125).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (chained) {
      damageEnemy(chained, bullet.damage * .46, false, true);
      const chainAngle = Math.atan2(chained.y - y, chained.x - x);
      makeDirectionalParticles(x, y, synergy.color, 8, 190, chainAngle, .22, "spark");
      game.shockwaves.push({ x: chained.x, y: chained.y, radius: 2, maxRadius: 20, life: .2, color: synergy.color });
    }
  } else {
    const radius = 72 + game.player.explosionRadius * .16;
    splash(radius, .34, synergy.color);
    for (const entry of livingNearby(radius)) entry.slowTimer = Math.max(entry.slowTimer, 2.1);
    makeDirectionalParticles(x, y, synergy.color, 12, 125, angle, 1.4, "glyph");
  }
}

function getBossImpactSpec(sceneId = game.scene.id) {
  return {
    city: { name: "楼体坍塌", scar: "ruins", color: "#ff744f", particle: "chip" },
    snow: { name: "冰原崩陷", scar: "snowCrater", color: "#9cecff", particle: "shard" },
    hospital: { name: "污染爆破", scar: "bioBreach", color: "#ff5d78", particle: "shard" },
    orbit: { name: "舰体贯穿", scar: "hullBreach", color: "#ff8a62", particle: "chip" },
    mars: { name: "熔岩轰击", scar: "moltenCrater", color: "#ff743d", particle: "shard" },
    moon: { name: "月壤震爆", scar: "lunarCrater", color: "#d9d5ff", particle: "shard" },
    cultivation: { name: "道场碎裂", scar: "spiritRift", color: "#ffd16f", particle: "glyph" },
  }[sceneId] || { name: "毁灭轰击", scar: "ruins", color: "#ff684f", particle: "shard" };
}

function updateEnemies(dt) {
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.hitKick = Math.max(0, (enemy.hitKick || 0) - dt * 62);
    enemy.rangedFlash = Math.max(0, (enemy.rangedFlash || 0) - dt);
    enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    enemy.skillTimer -= dt;
    enemy.dashTimer = Math.max(0, enemy.dashTimer - dt);
    const playerDx = game.player.x - enemy.x;
    const playerDy = game.player.y - enemy.y;
    const playerDistance = Math.max(1, Math.hypot(playerDx, playerDy));
    if (enemy.type === "runner" && enemy.skillTimer <= 0 && playerDistance < 300) {
      enemy.dashTimer = .48;
      enemy.skillTimer = rand(2.8, 4.2);
      game.shockwaves.push({ x: enemy.x, y: enemy.y, radius: 2, maxRadius: 22, life: .25, color: enemy.color });
    }
    if (enemy.type === "boss" && enemy.skillTimer <= 0 && playerDistance < 430) {
      enemy.skillTimer = rand(4.8, 6.4);
      enemy.bossSkillIndex = (enemy.bossSkillIndex || 0) + 1;
      const radius = game.scene.endless ? 118 : game.scene.id === "hospital" ? 104 : 112;
      const lead = Math.min(42, Math.hypot(game.move.x, game.move.y) * 38);
      const impact = getBossImpactSpec();
      game.bossWarnings.push({
        x: game.player.x + game.move.x * lead,
        y: game.player.y + game.move.y * lead,
        radius,
        delay: 1.18,
        maxDelay: 1.18,
        life: 0,
        sourceId: enemy.id,
        damage: Math.max(50, Math.round(enemy.damage * 1.65)),
        color: impact.color,
        impactName: impact.name,
        scarType: impact.scar,
        particleShape: impact.particle,
        sceneId: game.scene.id,
        detonated: false,
      });
      if (enemy.bossSkillIndex % 2 === 0) spawnEnemy(Math.random() < .5 ? "ranged" : "caster", enemy.x + rand(-42, 42), enemy.y + rand(-30, 22));
      const bossName = game.scene.endless ? cultivationDomains[game.world.domainIndex].boss : game.scene.boss;
      game.banner = { text: `${bossName} · ${impact.name}`, sub: `命中损失 ${Math.max(50, Math.round(enemy.damage * 1.65))} 生命并陷入重创`, time: 1.45 };
    }
    const slow = enemy.slowTimer > 0 ? 0.5 : 1;
    const dash = enemy.dashTimer > 0 ? 2.7 : 1;
    const rage = enemy.type === "boss" && enemy.hp < enemy.maxHp * .42 ? 1.38 : 1;
    const isRanged = enemy.type === "ranged" || enemy.type === "caster";
    const preferredRange = enemy.type === "caster" ? 238 : 188;
    const attackDistance = enemy.size + 22;

    if (isRanged) {
      const pressureRelief = game.health / game.maxHealth < .28 ? .78 : 1;
      const stride = enemy.speed * slow * rage * pressureRelief * dt;
      if (playerDistance > preferredRange + 28) {
        enemy.x += playerDx / playerDistance * stride;
        enemy.y += playerDy / playerDistance * stride;
      } else if (playerDistance < preferredRange - 42) {
        enemy.x -= playerDx / playerDistance * stride * .82;
        enemy.y -= playerDy / playerDistance * stride * .82;
      } else {
        const orbitDirection = Math.sin(enemy.sway) > 0 ? 1 : -1;
        enemy.x += -playerDy / playerDistance * stride * .62 * orbitDirection;
        enemy.y += playerDx / playerDistance * stride * .62 * orbitDirection;
      }
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0 && playerDistance < preferredRange + 90) {
        fireEnemyProjectile(enemy);
        enemy.attackTimer = enemy.type === "caster" ? rand(3.1, 4.0) : rand(2.45, 3.25);
      }
    } else if (playerDistance > attackDistance) {
      const pressureRelief = game.health / game.maxHealth < .28 ? .78 : 1;
      const stride = enemy.speed * slow * dash * rage * pressureRelief * dt;
      enemy.pursuitPhase += dt * (enemy.type === "runner" ? 2.1 : 1.05);
      const arcStrength = (enemy.type === "runner" ? .38 : .22) * (playerDistance > 135 ? 1 : playerDistance / 135);
      const arc = (enemy.curveSign * .65 + Math.sin(enemy.pursuitPhase + enemy.sway) * .35) * arcStrength;
      const forward = Math.sqrt(Math.max(.68, 1 - arc * arc));
      enemy.x += (playerDx / playerDistance * forward + -playerDy / playerDistance * arc) * stride;
      enemy.y += (playerDy / playerDistance * forward + playerDx / playerDistance * arc) * stride;
    } else {
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.type === "boss" ? 0.72 : 1.05;
        damagePlayer(enemy.damage, enemy.x, enemy.y, enemy.type === "boss");
      }
    }
  }
  game.enemies = game.enemies.filter((enemy) => !enemy.dead);
}

function fireEnemyProjectile(enemy) {
  const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
  const caster = enemy.type === "caster";
  const speed = caster ? 132 : 172;
  const damage = Math.round((caster ? 64 : 55) * (0.9 + game.difficulty * .1) * (.92 + game.director * .08));
  game.enemyProjectiles.push({
    x: enemy.x,
    y: enemy.y - enemy.size * .35,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    life: 3.4,
    damage,
    radius: caster ? 9 : 5,
    style: caster ? (game.scene.endless ? "talisman" : "spell") : "arrow",
    color: caster ? game.scene.colors.hit : game.scene.colors.shot,
    dead: false,
  });
  enemy.rangedFlash = .24;
}

function updateEnemyProjectiles(dt) {
  for (const projectile of game.enemyProjectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    if (projectile.life <= 0) projectile.dead = true;
    if (projectile.dead || Math.hypot(projectile.x - game.player.x, projectile.y - game.player.y) > 19 + projectile.radius) continue;
    projectile.dead = true;
    damagePlayer(projectile.damage, projectile.x, projectile.y, false);
  }
  game.enemyProjectiles = game.enemyProjectiles.filter((projectile) => !projectile.dead);
}

function createBossScar(warning) {
  game.bossScars.push({
    x: warning.x,
    y: warning.y,
    radius: warning.radius * rand(.88, 1.08),
    rotation: rand(-Math.PI, Math.PI),
    seed: rand(1, 999),
    type: warning.scarType,
    sceneId: warning.sceneId,
    life: 75,
    maxLife: 75,
  });
  if (game.bossScars.length > 18) game.bossScars.splice(0, game.bossScars.length - 18);
}

function updateBossWarnings(dt) {
  for (const warning of game.bossWarnings) {
    if (!warning.detonated) {
      warning.delay -= dt;
      if (warning.delay > 0) continue;
      warning.detonated = true;
      warning.life = .68;
      createBossScar(warning);
      game.shockwaves.push({ x: warning.x, y: warning.y, radius: 8, maxRadius: warning.radius + 18, life: .72, color: warning.color });
      game.shockwaves.push({ x: warning.x, y: warning.y, radius: 18, maxRadius: warning.radius * .72, life: .48, color: "#ffffff" });
      makeDirectionalParticles(warning.x, warning.y, warning.color, 42, 290, -Math.PI / 2, Math.PI, warning.particleShape);
      if (Math.hypot(game.player.x - warning.x, game.player.y - warning.y) <= warning.radius + 13) damagePlayer(warning.damage, warning.x, warning.y, true);
      game.shake = Math.max(game.shake, 19);
      game.bossShock = .78;
      game.flash = Math.max(game.flash, .32);
      if (navigator.vibrate) navigator.vibrate([55, 25, 95]);
      tone(62, .2, "sawtooth", .06, .38);
    } else warning.life -= dt;
  }
  game.bossWarnings = game.bossWarnings.filter((warning) => !warning.detonated || warning.life > 0);
}

function damagePlayer(rawDamage, sourceX, sourceY, heavy = false) {
  if (game.invulnerable > 0 || game.health <= 0) return false;
  const wardReduction = game.scene.endless ? Math.min(.58, game.player.wardLevel * .065) : 0;
  const damage = Math.max(1, Math.round(rawDamage * (1 - wardReduction)));
  game.health = Math.max(0, game.health - damage);
  if (heavy) game.player.staggerTimer = Math.max(game.player.staggerTimer || 0, .62);
  game.shake = Math.max(game.shake, heavy ? 11 : 4);
  game.flash = heavy ? .23 : .15;
  addFloater(game.player.x, game.player.y - 34, `-${damage}`, "#ff7169", heavy ? 17 : 14);
  const angle = Math.atan2(game.player.y - sourceY, game.player.x - sourceX);
  makeDirectionalParticles(game.player.x, game.player.y, "#ff7a68", heavy ? 11 : 5, heavy ? 130 : 75, angle, .85, "spark");
  tone(heavy ? 82 : 105, heavy ? .09 : .055, "sawtooth", heavy ? .03 : .02, .65);
  if (game.health <= 0) handlePlayerDeath();
  return true;
}

function handlePlayerDeath() {
  if (!game.scene.endless) {
    const divineState = getDivineGearState(game.player.combatClass.id);
    const isLockedCityFinale = game.sceneIndex === 0 && game.missionLevel === LEVELS_PER_SCENE && !divineState.unlocked;
    if (isLockedCityFinale) {
      game.pendingDivineRevive = true;
      paused = true;
      ui.reviveKicker.textContent = "ARTIFACT AWAKENING";
      ui.reviveTitle.textContent = "神器权限尚未解锁";
      ui.reviveDescription.textContent = `观看广告永久解锁「${divineGearDefinitions[game.player.combatClass.id].name}」，立即满血复活并开启本局横推神威。`;
      ui.reviveAdButton.querySelector("span").textContent = "▶ 解锁神器并复活";
      ui.endEndlessButton.textContent = "放弃本局";
      ui.reviveModal.classList.remove("hidden");
      return;
    }
    finishGame(false);
    return;
  }
  game.lives -= 1;
  game.invulnerable = 1.8;
  if (game.lives > 0) {
    game.health = game.maxHealth;
    for (const enemy of game.enemies) {
      const angle = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x);
      enemy.x += Math.cos(angle) * 180;
      enemy.y += Math.sin(angle) * 180;
    }
    game.banner = { text: `命数重塑 · 余 ${game.lives}`, sub: "护山大阵已暂时击退近身敌人", time: 2.4 };
    game.shockwaves.push({ x: game.player.x, y: game.player.y, radius: 10, maxRadius: 360, life: .8, color: game.scene.colors.shot });
    return;
  }
  paused = true;
  ui.reviveKicker.textContent = "FATE INTERRUPTED";
  ui.reviveTitle.textContent = "三道命数已尽";
  ui.reviveDescription.textContent = "观看一次演示广告，可重塑一道命数并继续本次修行。";
  ui.reviveAdButton.querySelector("span").textContent = "▶ 看广告复活";
  ui.endEndlessButton.textContent = "结束本次修行";
  ui.reviveModal.classList.remove("hidden");
}

function damageEnemy(enemy, amount, critical = false, secondary = false) {
  if (enemy.dead) return;
  if (enemy.shield > 0) {
    const absorbed = Math.min(enemy.shield, amount);
    enemy.shield -= absorbed;
    amount -= absorbed;
    addFloater(enemy.x, enemy.y - enemy.size, `盾 ${Math.round(absorbed)}`, "#79dfff", 9);
    if (amount <= 0) return;
  }
  enemy.hp -= amount;
  enemy.flash = 0.075;
  if (!secondary || Math.random() < 0.3) {
    addFloater(enemy.x + rand(-4, 4), enemy.y - enemy.size, Math.round(amount), critical ? "#fff46a" : "#eef6dc", critical ? 15 : 10);
  }
  if (critical) {
    makeParticles(enemy.x, enemy.y, "#fff36a", 3, 90);
    game.shake = Math.max(game.shake, 2.5);
  } else if (secondary) {
    makeParticles(enemy.x, enemy.y, game.scene.colors.hit, 2, 62);
  }
  if (enemy.hp <= 0) killEnemy(enemy);
}

function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  game.kills += 1;
  game.coins += Math.max(1, Math.round(enemy.reward * (1 + game.player.coinBonus)));
  game.combo = game.comboTimer > 0 ? game.combo + 1 : 1;
  game.comboTimer = 1.4;
  const permanentRecovery = meta.upgrades.recovery || 0;
  if (permanentRecovery > 0) {
    const recovery = Math.max(1, Math.round(game.maxHealth * permanentRecovery * (enemy.type === "boss" ? .012 : .0011)));
    game.health = Math.min(game.maxHealth, game.health + recovery);
  }
  if (game.ultimateDamageActive) {
    const ultimateHeal = Math.max(1, Math.round(game.maxHealth * (enemy.type === "boss" ? .1 : .012)));
    game.health = Math.min(game.maxHealth, game.health + ultimateHeal);
    if (enemy.type === "boss" || game.combo % 8 === 0) addFloater(game.player.x, game.player.y - 48, `终极汲取 +${ultimateHeal}`, "#73ffd1", 10);
  }
  const shardCount = enemy.type === "boss" ? 6 : enemy.xp >= 18 ? 3 : 1;
  const xpColor = game.scene.id === "hospital" ? "#78ffd1" : game.scene.id === "mars" ? "#ffc26d" : game.scene.id === "cultivation" ? "#ffe6a2" : game.scene.colors.shot;
  if (game.xpDrops.length + shardCount > EFFECT_LIMITS.xpDrops) {
    const pooled = game.xpDrops[game.kills % Math.max(1, game.xpDrops.length)];
    if (pooled) { pooled.value += enemy.xp; pooled.x = enemy.x; pooled.y = enemy.y; pooled.age = 0; pooled.color = xpColor; }
  } else {
    let remainingXp = enemy.xp;
    for (let index = 0; index < shardCount; index += 1) {
      const value = index === shardCount - 1 ? remainingXp : Math.max(1, Math.floor(enemy.xp / shardCount));
      remainingXp -= value;
      const angle = index / shardCount * Math.PI * 2 + enemy.sway;
      game.xpDrops.push({
        x: enemy.x + Math.cos(angle) * (8 + index * 3),
        y: enemy.y + Math.sin(angle) * (6 + index * 2),
        value,
        age: 0,
        seed: Math.random() * Math.PI * 2,
        color: xpColor,
        collected: false,
      });
    }
  }
  if (game.scene.endless && game.player.lotusLevel > 0) {
    const lotusHeal = Math.max(1, Math.round(game.maxHealth * (.0025 + game.player.lotusLevel * .0007)));
    game.health = Math.min(game.maxHealth, game.health + lotusHeal);
    if (enemy.type === "boss") addFloater(game.player.x, game.player.y - 47, `金莲 +${lotusHeal}`, "#ffe79a", 10);
  }
  const medkitChance = .1 + (game.player.companionPet?.medkitBonus || 0);
  if (game.medkits.length < EFFECT_LIMITS.medkits && (enemy.type === "boss" || Math.random() < medkitChance)) {
    game.medkits.push({ x: enemy.x + rand(-9,9), y: enemy.y + rand(-7,7), age: 0, pulse: rand(0, Math.PI * 2), collected: false });
    addFloater(enemy.x, enemy.y - enemy.size - 4, "急救血包", "#7dffac", 9);
  }
  if (game.corpses.length >= EFFECT_LIMITS.corpses) game.corpses.shift();
  game.corpses.push({
    x: enemy.x,
    y: enemy.y,
    size: enemy.size,
    type: enemy.type,
    color: enemy.color,
    sceneId: game.scene.id,
    rotation: rand(-.45, .45),
    life: enemy.type === "boss" ? 6 : 4.2,
    maxLife: enemy.type === "boss" ? 6 : 4.2,
    seed: Math.random() * 100,
  });
  makeParticles(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 36 : 10, enemy.type === "boss" ? 180 : 105);

  const stage = game.sceneIndex * LEVELS_PER_SCENE + game.missionLevel;
  const baseDropChance = enemy.type === "boss" ? Math.min(.92, .68 + stage * .004) : Math.min(.032, .009 + stage * .00034);
  const dropChance = game.runType === "resource" ? Math.min(.96, baseDropChance * (enemy.type === "boss" ? 1 : 3.5)) : baseDropChance;
  const lootCapacityAvailable = game.runType !== "resource" || game.loot.length < 1;
  if (lootCapacityAvailable && Math.random() < dropChance) {
    const item = createGear(enemy.type);
    game.loot.push(item);
    const rarity = rarityDefinitions[item.rarity];
    addFloater(enemy.x, enemy.y - enemy.size - 8, `${item.icon} ${rarity.name}装备`, rarity.color, 11);
    game.shockwaves.push({ x: enemy.x, y: enemy.y, radius: 3, maxRadius: 28, life: .45, color: rarity.color });
    tone(item.rarity === "legendary" ? 690 : 540, .13, "triangle", .03, 1.45);
  }

  if (enemy.type === "splitter") {
    spawnEnemy("mini", enemy.x - 8, enemy.y);
    spawnEnemy("mini", enemy.x + 8, enemy.y - 4);
  }

  if (enemy.type === "boss") {
    game.boss = null;
    game.shake = 18;
    game.flash = 0.35;
    if (game.scene.endless) {
      game.banner = { text: "宗主败退", sub: "更高阶的修士正在踏入战场", time: 2.6 };
      game.bossSpawned = false;
    } else {
      game.missionBossDefeated = true;
      if (game.kills >= game.missionTarget) { game.missionCompleteQueued = true; setTimeout(() => finishGame(true), 650); }
      else game.banner = { text: "首领已击败", sub: `继续完成任务：还需击杀 ${game.missionTarget - game.kills} 名敌人`, time: 3.1 };
    }
  } else if (!game.scene.endless && game.missionBossDefeated && !game.missionCompleteQueued && game.kills >= game.missionTarget) {
    game.missionCompleteQueued = true;
    setTimeout(() => finishGame(true), 450);
  } else if (game.combo % 15 === 0) {
    tone(420 + Math.min(game.combo, 60) * 3, 0.06, "triangle", 0.022, 1.3);
  }
}

function explode(x, y, directTarget) {
  const radius = game.player.explosionRadius;
  const burstColor = game.scene.id === "city" || game.scene.id === "mars" ? "#ffb34f" : game.scene.colors.shot;
  const impactAngle = Math.atan2(y - game.player.y, x - game.player.x);
  game.shockwaves.push({ x, y, radius: 3, maxRadius: radius, life: 0.3, color: burstColor });
  makeDirectionalParticles(x, y, burstColor, 15, 190, impactAngle, 1.28, game.scene.id === "snow" ? "shard" : "spark");
  game.shake = Math.max(game.shake, 4);
  for (const enemy of game.enemies) {
    if (enemy.dead || enemy === directTarget) continue;
    const distance = Math.hypot(enemy.x - x, enemy.y - y);
    if (distance <= radius + enemy.size) damageEnemy(enemy, game.player.damage * 0.62, false, true);
  }
  tone(90, 0.06, "sawtooth", 0.024, 0.6);
}

function spawnImpactBurst(x, y, bullet, critical = false, enemy = null, lightweight = false) {
  const angle = Math.atan2(bullet.vy, bullet.vx);
  if (!lightweight || game.impactBursts.length < EFFECT_LIMITS.bursts * .65) game.impactBursts.push({
    x,
    y,
    color: critical ? "#fff47a" : bullet.color,
    accent: bullet.accent || bullet.color,
    fx: bullet.fx || "tracer",
    angle,
    contactAttack: Boolean(bullet.contactAttack),
    targetId: enemy?.id ?? null,
    offsetX: enemy ? x - enemy.x : 0,
    offsetY: enemy ? y - enemy.y : 0,
    life: critical ? .38 : bullet.contactAttack ? .32 : .27,
    maxLife: critical ? .38 : bullet.contactAttack ? .32 : .27,
    critical,
  });
  const particleShape = ["snowball", "icicle", "cryo"].includes(bullet.fx) ? "shard"
    : ["powerArc", "flameArc", "flyingSword", "spiritSword", "spiritPet", "rail", "tracer"].includes(bullet.fx) ? "spark"
      : ["spell", "serum"].includes(bullet.fx) ? "glyph" : "chip";
  const debrisColor = bullet.fx === "flameArc" || bullet.fx === "plasma" ? "#ffb04f" : critical ? "#fff47a" : bullet.color;
  makeDirectionalParticles(x, y, debrisColor, lightweight ? 2 : critical ? 10 : bullet.contactAttack ? 7 : 5, critical ? 185 : 125, angle, .95, particleShape);
  if (!lightweight && (critical || ["serum", "plasma", "tesla", "graviton", "cryo"].includes(bullet.fx))) {
    game.shockwaves.push({ x, y, radius: 2, maxRadius: critical ? 34 : 22, life: .25, color: critical ? "#fff47a" : bullet.color });
  }
}

function damageUltimateArea(x, y, radius, normalMultiplier, bossMultiplier, knockback = 0) {
  for (const enemy of [...game.enemies]) {
    if (enemy.dead) continue;
    const distance = Math.hypot(enemy.x - x, enemy.y - y);
    if (distance > radius + enemy.size) continue;
    game.ultimateDamageActive = true;
    damageEnemy(enemy, game.player.damage * (enemy.type === "boss" ? bossMultiplier : normalMultiplier) * (1 + game.player.pulseBonus), false, true);
    game.ultimateDamageActive = false;
    if (knockback > 0 && !enemy.dead) {
      const angle = Math.atan2(enemy.y - y, enemy.x - x);
      enemy.x += Math.cos(angle) * (enemy.type === "boss" ? knockback * .3 : knockback);
      enemy.y += Math.sin(angle) * (enemy.type === "boss" ? knockback * .3 : knockback);
      enemy.slowTimer = Math.max(enemy.slowTimer, 2.8);
    }
  }
}

function detonateAirstrike(strike) {
  if (strike.exploded) return;
  strike.exploded = true;
  strike.life = .7;
  const type = game.ultimate?.type;
  const radius = type === "railSalvo" ? 138 : type === "swarmProtocol" ? 82 : 112;
  damageUltimateArea(strike.x, strike.y, radius, type === "railSalvo" ? 7.1 : 6.1, type === "railSalvo" ? 3.8 : 3.2, 38);
  const color = type === "antibodyRain" ? "#72ffd0" : type === "marsBarrage" ? "#ff8350" : type === "auroraSpears" ? "#bdefff" : game.player.combatClass.color;
  game.shockwaves.push({ x: strike.x, y: strike.y, radius: 8, maxRadius: radius + 12, life: .58, color });
  makeParticles(strike.x, strike.y, color, 28, 260);
  makeParticles(strike.x, strike.y, type === "antibodyRain" ? "#effff9" : type === "swordRain" ? "#efffea" : "#ffdb7a", 17, 205);
  if (type === "auroraSpears") for (const enemy of game.enemies) if (Math.hypot(enemy.x - strike.x, enemy.y - strike.y) < radius) enemy.slowTimer = Math.max(enemy.slowTimer, 3.5);
  game.shake = Math.max(game.shake, type === "railSalvo" || type === "marsBarrage" ? 13 : 9);
  tone(88, .09, "sawtooth", .035, .55);
}

function activatePulse() {
  if (mode !== "playing" || paused || game.pulseTimer > 0) return;
  game.pulseTimer = game.pulseMax;
  const player = game.player;
  const type = player.combatClass.ultimateType;
  const impactTypes = new Set(["breach", "avalanche", "deconRush", "faultline", "moonQuake", "heavenBlade"]);
  const fieldTypes = new Set(["teslaStorm", "blizzard", "sterilePurge", "solarCore", "gravityCollapse", "thunderTribulation"]);
  const subtitles = {
    breach: "动力外骨骼超载 · 三段破阵", droneBarrage: "四机编队升空 · 交叉封锁尸潮", teslaStorm: "城市电网重启 · 高压节点连锁",
    avalanche: "冰镐震裂冻土 · 雪崩正面推进", auroraSpears: "极光定位完成 · 冰矛覆盖全场", blizzard: "低温设备满载 · 暴风眼形成",
    deconRush: "防爆盾推进 · 高压消杀走廊", antibodyRain: "医疗无人机编队 · 抗体精准投送", sterilePurge: "裂解试剂雾化 · 病区全面净化",
    galaxyOverdrive: "星系球自由收缩 · 潮汐轨道全速运转", railSalvo: "主炮阵列充能 · 贯穿射界开放", swarmProtocol: "无人机全舱释放 · 自主猎杀协议",
    faultline: "热能战斧过载 · 熔岩裂谷撕开", marsBarrage: "殖民地炮群响应 · 饱和火力覆盖", solarCore: "磁约束解除 · 等离子核心临界",
    moonQuake: "重力锤蓄满 · 月壤冲击环扩散", lunarSupport: "环月卫星响应 · 光矛坐标锁定", gravityCollapse: "引力透镜展开 · 区域质量坍缩",
    heavenBlade: "法天象地 · 镇岳剑势落成", swordRain: "剑开天门 · 万锋听令", thunderTribulation: "九霄云门洞开 · 雷劫锁定群敌",
  };
  if (type === "galaxyOverdrive") {
    game.ultimate = { type, family: "orbit", variant: player.combatClass.fx, x: player.x, y: player.y, time: 4.5, maxTime: 4.5 };
    tone(86, .42, "sine", .07, 3.2);
  } else if (impactTypes.has(type)) {
    const target = game.enemies.find((enemy) => enemy.type === "boss" && !enemy.dead)
      || game.enemies.filter((enemy) => !enemy.dead).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
    const distance = target ? Math.min(260, Math.hypot(target.x - player.x, target.y - player.y)) : 120;
    const angle = target ? Math.atan2(target.y - player.y, target.x - player.x) : player.aimAngle;
    game.ultimate = { type, family: "impact", variant: player.combatClass.fx, angle, x: player.x + Math.cos(angle) * distance, y: player.y + Math.sin(angle) * distance, time: 2.15, maxTime: 2.15, triggered: false };
    tone(120, .28, "sawtooth", .06, 1.8);
  } else if (fieldTypes.has(type)) {
    game.ultimate = { type, family: "field", variant: player.combatClass.fx, x: player.x, y: player.y, time: 2.8, maxTime: 2.8, triggered: false };
    tone(330, .38, "sine", .06, 2.2);
  } else {
    const enemies = game.enemies.filter((enemy) => !enemy.dead).sort((a, b) => b.maxHp - a.maxHp);
    const strikeCount = type === "swordRain" || type === "swarmProtocol" ? 18 : 14;
    const targets = Array.from({ length: strikeCount }, (_, index) => {
      const enemy = enemies[index % Math.max(1, enemies.length)];
      const angle = index / strikeCount * Math.PI * 2;
      return {
        x: enemy ? enemy.x + rand(-38, 38) : player.x + Math.cos(angle) * rand(110, 300),
        y: enemy ? enemy.y + rand(-38, 38) : player.y + Math.sin(angle) * rand(110, 300),
        delay: .48 + index * .095,
        exploded: false,
        life: 0,
      };
    });
    game.airstrikes = targets;
    game.ultimate = { type, family: "barrage", variant: player.combatClass.fx, x: player.x, y: player.y, time: 3.1, maxTime: 3.1 };
    tone(155, .22, "square", .045, 1.5);
  }
  game.banner = { text: player.combatClass.ultimateName, sub: subtitles[type] || "终极系统已启动", time: 2.65 };
  game.shake = Math.max(game.shake, 7);
  game.flash = .18;
  if (navigator.vibrate) navigator.vibrate([45, 35, 80]);
}

function gainXp(amount) {
  const player = game.player;
  player.xp += amount;
  let levelsGained = 0;
  while (player.xp >= player.xpNeeded) {
    player.xp -= player.xpNeeded;
    player.level += 1;
    player.xpNeeded = Math.round(34 + player.level * 18 + player.level ** 1.32);
    game.pendingLevels += 1;
    levelsGained += 1;
  }
  if (levelsGained > 0) {
    game.pulseTimer = 0;
    game.flash = Math.max(game.flash, .34);
    addFloater(player.x, player.y - 62, `突破 LV.${player.level}`, "#e5fff2", 14);
    addFloater(player.x, player.y - 39, "大招立即就绪 · 寻找血包恢复生命", "#72ffb8", 10);
    game.shockwaves.push({ x: player.x, y: player.y, radius: 8, maxRadius: 88, life: .72, color: "#78ffd0" });
    game.shockwaves.push({ x: player.x, y: player.y, radius: 18, maxRadius: 54, life: .48, color: "#ffffff" });
    makeDirectionalParticles(player.x, player.y + 18, "#72ffb8", 24, 155, -Math.PI / 2, 1.15, "spark");
    tone(440, .16, "sine", .04, 1.7);
    setTimeout(() => tone(660, .2, "sine", .035, 1.45), 90);
  }
  if (game.pendingLevels > 0 && !paused) showUpgradeChoices();
}

function showUpgradeChoices() {
  paused = true;
  ui.upgrade.classList.remove("hidden");
  const available = upgradeDefinitions.filter((entry) =>
    (!entry.cultivationOnly || game.scene.endless)
    && (!entry.classes || entry.classes.includes(game.player.combatClass.id))
    && (game.scene.endless || (game.player.upgrades[entry.id] || 0) < entry.max));
  const group = getSceneSkillGroup();
  const pathIds = group ? [group.core, group.link, group.aux] : [];
  const classPath = available.filter((entry) => entry.classes);
  const cultivationPath = available.filter((entry) => entry.cultivationOnly).sort(() => Math.random() - 0.5);
  const commonPath = available.filter((entry) => !entry.classes && !entry.cultivationOnly).sort(() => Math.random() - 0.5);
  const pathPriority = !group ? []
    : game.player.upgrades[group.core] ? (game.player.upgrades[group.link] ? [group.core, group.link, group.aux] : [group.link, group.core, group.aux])
    : [group.core, group.aux, group.link];
  const pathChoice = pathPriority.map((id) => available.find((entry) => entry.id === id)).find(Boolean);
  const shuffled = [];
  if (pathChoice) shuffled.push(pathChoice);
  if (game.scene.endless) {
    const cultivationChoice = cultivationPath.find((entry) => !shuffled.includes(entry));
    if (cultivationChoice) shuffled.push(cultivationChoice);
  } else {
    const classChoice = classPath.sort(() => Math.random() - 0.5).find((entry) => !shuffled.includes(entry));
    if (classChoice) shuffled.push(classChoice);
  }
  const secondaryPool = [...commonPath, ...cultivationPath, ...classPath].filter((entry) => !shuffled.includes(entry));
  for (const entry of secondaryPool) {
    if (shuffled.length >= 3) break;
    shuffled.push(entry);
  }
  ui.choices.innerHTML = "";

  for (const definition of shuffled) {
    const current = game.player.upgrades[definition.id] || 0;
    const presentation = getUpgradePresentation(definition);
    const visiblePips = Math.min(5, definition.max);
    const nextRank = current + 1;
    const button = document.createElement("button");
    button.className = "upgrade-card";
    if (pathIds.includes(definition.id)) button.dataset.pathSkill = "true";
    button.innerHTML = `
      <span class="upgrade-icon">${definition.icon}</span>
      <span>
        <h3>${presentation.name}</h3>
        <p>${presentation.description}</p>
        <span class="upgrade-level">${Array.from({ length: visiblePips }, (_, index) => `<i class="${index < Math.min(nextRank, visiblePips) ? "on" : ""}"></i>`).join("")}${game.scene.endless ? `<em>第 ${nextRank} 重</em>` : ""}</span>
      </span>`;
    button.addEventListener("click", () => chooseUpgrade(definition), { once: true });
    ui.choices.append(button);
  }
}

function chooseUpgrade(definition) {
  const player = game.player;
  const nextRank = (player.upgrades[definition.id] || 0) + 1;
  player.upgrades[definition.id] = nextRank;
  if (game.scene.endless && nextRank > definition.max && !definition.cultivationOnly) applyEndlessOverflow(definition.id, player);
  else definition.apply(player);
  activateHiddenSkillSynergy(player);
  game.pendingLevels -= 1;
  tone(460, 0.12, "triangle", 0.04, 1.6);
  if (game.pendingLevels > 0) showUpgradeChoices();
  else {
    ui.upgrade.classList.add("hidden");
    paused = false;
  }
}

function activateHiddenSkillSynergy(player) {
  const group = getSceneSkillGroup();
  if (!group || !player.upgrades[group.core] || !player.upgrades[group.link] || player.synergies[group.synergy]) return;
  player.synergies[group.synergy] = true;
  player.activeSynergy = group;
  if (player.combatClass.id === "melee") {
    player.damage *= 1.12;
    player.explosionRadius += 16;
  } else if (player.combatClass.id === "ranger") {
    player.fireInterval = Math.max(.13, player.fireInterval * .78);
    player.pierce += 2;
    player.damage *= 1.08;
  } else {
    player.explosionChance = Math.min(.86, player.explosionChance + .2);
    player.explosionRadius += 20;
    player.slowChance = Math.min(.9, player.slowChance + .12);
  }
  game.banner = { text: group.synergy, sub: "技能共鸣已发生质变", time: 2.2 };
  game.flash = Math.max(game.flash, .34);
  game.shockwaves.push({ x: player.x, y: player.y, radius: 8, maxRadius: 108, life: .82, color: group.color });
  makeParticles(player.x, player.y - 10, group.color, 24, 190);
  tone(330, .12, "sine", .045, 1.7);
  setTimeout(() => tone(660, .18, "triangle", .04, 1.45), 90);
}

function applyEndlessOverflow(id, player) {
  if (["power", "multi", "pierce", "bladeReach", "hunter", "arcane"].includes(id)) player.damage *= 1.1;
  else if (id === "haste") player.fireInterval = Math.max(.12, player.fireInterval * .96);
  else if (id === "grenade") { player.explosionChance = Math.min(.85, player.explosionChance + .035); player.explosionRadius += 5; }
  else if (id === "frost") { player.slowChance = Math.min(.9, player.slowChance + .04); player.damage *= 1.035; }
  else if (id === "crit") { player.critChance = Math.min(.82, player.critChance + .025); player.damage *= 1.025; }
  else if (id === "repair") { game.maxHealth += 24; game.health = Math.min(game.maxHealth, game.health + 38); }
}

function updateEffects(dt) {
  if (game.ultimate) {
    game.ultimate.time -= dt;
    const ultimate = game.ultimate;
    if (ultimate.family === "orbit") { ultimate.x = game.player.x; ultimate.y = game.player.y; }
    const ultimateColor = getEquippedSkin().primary;
    if (ultimate.family === "impact" && !ultimate.triggered && ultimate.time <= 1.05) {
      ultimate.triggered = true;
      const radius = 215;
      damageUltimateArea(ultimate.x, ultimate.y, radius, 8.5, 4.35, 82);
      for (const ring of [90, 155, radius]) game.shockwaves.push({ x: ultimate.x, y: ultimate.y, radius: 8, maxRadius: ring, life: .72, color: ultimateColor });
      makeParticles(ultimate.x, ultimate.y, ultimateColor, 46, 310);
      game.shake = 19;
      tone(72, .22, "sawtooth", .07, .42);
    }
    if (ultimate.family === "field" && !ultimate.triggered && ultimate.time <= 1.45) {
      ultimate.triggered = true;
      damageUltimateArea(ultimate.x, ultimate.y, 420, 7.25, 3.85, 58);
      for (const radius of [135, 260, 390, 455]) game.shockwaves.push({ x: ultimate.x, y: ultimate.y, radius: 18, maxRadius: radius, life: 1.05, color: ultimateColor });
      makeParticles(ultimate.x, ultimate.y, ultimateColor, 64, 360);
      if (ultimate.type === "thunderTribulation" || ultimate.type === "teslaStorm") {
        for (const enemy of game.enemies.filter((entry) => !entry.dead).slice(0, 12)) game.lightnings.push({ x: enemy.x, y: enemy.y, life: .45, maxLife: .45, seed: rand(0, 99) });
      }
      game.shake = 16;
      tone(92, .42, "sine", .075, 3.4);
    }
    if (ultimate.family === "barrage") {
      for (const strike of game.airstrikes) {
        if (!strike.exploded) {
          strike.delay -= dt;
          if (strike.delay <= 0) detonateAirstrike(strike);
        } else strike.life -= dt;
      }
      game.airstrikes = game.airstrikes.filter((strike) => !strike.exploded || strike.life > 0);
    }
    if (ultimate.time <= 0 && (ultimate.family !== "barrage" || game.airstrikes.length === 0)) game.ultimate = null;
  }
  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += (particle.gravity || 0) * dt;
    particle.rotation = (particle.rotation || 0) + (particle.spin || 0) * dt;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.life -= dt;
  }
  for (const floater of game.floaters) {
    floater.y -= 31 * dt;
    floater.life -= dt;
  }
  for (const wave of game.shockwaves) {
    wave.life -= dt;
    wave.radius += (wave.maxRadius - wave.radius) * Math.min(1, dt * 9);
  }
  for (const corpse of game.corpses) corpse.life -= dt;
  for (const lightning of game.lightnings) lightning.life -= dt;
  for (const burst of game.impactBursts) {
    if (burst.targetId != null) {
      const target = game.enemies.find((enemy) => enemy.id === burst.targetId && !enemy.dead);
      if (target) { burst.x = target.x + burst.offsetX; burst.y = target.y + burst.offsetY; }
    }
    burst.life -= dt;
  }
  for (const mark of game.groundMarks) mark.life -= dt;
  for (const scar of game.bossScars) scar.life -= dt;
  game.particles = game.particles.filter((particle) => particle.life > 0);
  game.floaters = game.floaters.filter((floater) => floater.life > 0);
  game.shockwaves = game.shockwaves.filter((wave) => wave.life > 0);
  game.corpses = game.corpses.filter((corpse) => corpse.life > 0);
  game.lightnings = game.lightnings.filter((lightning) => lightning.life > 0);
  game.impactBursts = game.impactBursts.filter((burst) => burst.life > 0);
  game.groundMarks = game.groundMarks.filter((mark) => mark.life > 0);
  game.bossScars = game.bossScars.filter((scar) => scar.life > 0);
  if (game.particles.length > EFFECT_LIMITS.particles) game.particles.splice(0, game.particles.length - EFFECT_LIMITS.particles);
  if (game.impactBursts.length > EFFECT_LIMITS.bursts) game.impactBursts.splice(0, game.impactBursts.length - EFFECT_LIMITS.bursts);
  if (game.shockwaves.length > EFFECT_LIMITS.shockwaves) game.shockwaves.splice(0, game.shockwaves.length - EFFECT_LIMITS.shockwaves);
}

function makeParticles(x, y, color, count, speed) {
  const quality = game?.performance?.quality || 1;
  const allowed = Math.max(0, Math.min(Math.ceil(count * quality), EFFECT_LIMITS.particles - game.particles.length));
  for (let i = 0; i < allowed; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const velocity = rand(speed * 0.25, speed);
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color,
      size: rand(1.2, 3.7),
      life: rand(0.18, 0.48),
      maxLife: 0.48,
    });
  }
}

function makeDirectionalParticles(x, y, color, count, speed, angle, spread = .9, shape = "spark") {
  const quality = game?.performance?.quality || 1;
  const allowed = Math.max(0, Math.min(Math.ceil(count * quality), EFFECT_LIMITS.particles - game.particles.length));
  for (let i = 0; i < allowed; i += 1) {
    const particleAngle = angle + rand(-spread, spread);
    const velocity = rand(speed * .38, speed);
    game.particles.push({
      x,
      y,
      vx: Math.cos(particleAngle) * velocity,
      vy: Math.sin(particleAngle) * velocity,
      color,
      size: rand(1.4, shape === "shard" ? 4.8 : 3.4),
      shape,
      rotation: particleAngle,
      spin: rand(-9, 9),
      gravity: shape === "chip" || shape === "shard" ? 72 : 18,
      life: rand(.2, .44),
      maxLife: .44,
    });
  }
}

function addFloater(x, y, text, color, size) {
  if (game.floaters.length >= EFFECT_LIMITS.floaters) game.floaters.splice(0, game.floaters.length - EFFECT_LIMITS.floaters + 1);
  game.floaters.push({ x, y, text, color, size, life: 0.58 });
}

function syncHud() {
  if (!game) return;
  const player = game.player;
  const remaining = game.scene.endless ? game.elapsed : Math.max(0, TOTAL_WAVES * game.waveSeconds - game.elapsed);
  ui.mission.textContent = game.scene.endless ? `${game.scene.shortName} · 击杀 ${game.kills}` : `${game.scene.shortName} ${String(game.missionLevel).padStart(2, "0")} · 击杀 ${Math.min(game.kills, game.missionTarget)}/${game.missionTarget}`;
  ui.defenseLabel.textContent = "角色生命";
  ui.wave.textContent = game.scene.endless ? `${game.wave} / ∞` : `${game.wave} / ${TOTAL_WAVES}`;
  ui.timer.textContent = formatTime(remaining);
  ui.timer.previousElementSibling.textContent = game.scene.endless ? "本次修行" : "本轮结束";
  ui.livesText.classList.toggle("hidden", !game.scene.endless);
  ui.livesText.textContent = `命数 ${"♥".repeat(Math.max(0, game.lives))}${"♡".repeat(Math.max(0, 3 - game.lives))}`;
  ui.runCoins.textContent = game.coins;
  ui.healthFill.style.width = `${Math.max(0, game.health / game.maxHealth) * 100}%`;
  ui.healthText.textContent = `${Math.ceil(game.health)}/${game.maxHealth}`;
  ui.level.textContent = game.scene.endless ? getRealmName(player.level) : `LV.${player.level}`;
  ui.xpFill.style.width = `${Math.min(100, player.xp / player.xpNeeded * 100)}%`;
  ui.xpText.textContent = `${Math.floor(player.xp)}/${player.xpNeeded}`;
  ui.combo.classList.toggle("hidden", game.combo < 5);
  ui.comboText.textContent = game.combo;

  const bossAlive = game.boss && !game.boss.dead;
  ui.bossHud.classList.toggle("hidden", !bossAlive);
  if (bossAlive) ui.bossFill.style.width = `${Math.max(0, game.boss.hp / game.boss.maxHp) * 100}%`;

  const ratio = game.pulseTimer / game.pulseMax;
  ui.pulse.disabled = game.pulseTimer > 0;
  ui.pulse.classList.toggle("ready", game.pulseTimer <= 0);
  ui.pulseCooldown.style.height = `${ratio * 100}%`;
  ui.pulseHint.textContent = game.pulseTimer > 0 ? `${game.pulseTimer.toFixed(1)} 秒` : "点击 / SPACE";
}

function togglePause(force) {
  if (mode !== "playing" || !ui.upgrade.classList.contains("hidden")) return;
  manuallyPaused = typeof force === "boolean" ? force : !manuallyPaused;
  paused = manuallyPaused;
  ui.pauseOverlay.classList.toggle("hidden", !manuallyPaused);
  ui.pause.textContent = manuallyPaused ? "▶" : "Ⅱ";
}

function renderMeta() {
  const totalCleared = Object.values(meta.progress).reduce((sum, value) => sum + value, 0);
  const unlockedCount = scenes.filter((_, index) => isSceneUnlocked(index)).length;
  ui.clearedLevels.textContent = totalCleared;
  const accountLevel = Math.max(1, 1 + Math.floor(totalCleared / 2));
  ui.wins.textContent = accountLevel;
  ui.bankCoins.textContent = meta.coins;
  ui.unlockedScenes.textContent = `${unlockedCount}/${scenes.length}`;
  ui.accountLevel.textContent = `LV.${accountLevel}`;
  ui.accountTitle.textContent = accountLevel >= 30 ? "多元防线统帅" : accountLevel >= 18 ? "跨界先锋" : accountLevel >= 8 ? "资深守卫者" : "新晋守卫者";
  ui.accountProgress.style.width = `${(totalCleared % 2) * 50 + 18}%`;
  ui.metaUpgrades.innerHTML = "";

  for (const definition of metaDefinitions) {
    const level = meta.upgrades[definition.id];
    const maxed = level >= definition.costs.length;
    const cost = maxed ? null : definition.costs[level];
    const card = document.createElement("div");
    card.className = "meta-card";
    card.innerHTML = `
      <span class="meta-icon">${definition.icon}</span>
      <span class="meta-copy">
        <b>${definition.name}</b>
        <small>${definition.detail}</small>
        <span class="level-pips">${Array.from({ length: definition.costs.length }, (_, index) => `<i class="${index < level ? "on" : ""}"></i>`).join("")}</span>
      </span>
      <button class="buy-button" ${maxed ? "disabled" : ""}>${maxed ? "已满级" : `◆ ${cost}`}</button>`;
    const button = card.querySelector("button");
    button.addEventListener("click", () => buyMetaUpgrade(definition));
    ui.metaUpgrades.append(card);
  }
}

function formatSupplyCost(value) {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}万亿`;
  if (value >= 1e8) return `${(value / 1e8).toFixed(1)}亿`;
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)}万`;
  return String(value);
}

function grantDivineGearUnlock(classId = selectedRunClass) {
  const state = getDivineGearState(classId);
  const definition = divineGearDefinitions[classId];
  state.unlocked = true;
  state.level = Math.max(1, state.level || 1);
  saveMeta();
  const resultButton = document.querySelector("#resultDivineUnlock");
  if (resultButton) { resultButton.disabled = true; resultButton.textContent = "已永久解锁"; }
  showToast(`${definition.name}已永久解锁 · 可无限强化`);
}

function unlockDivineGearWithAd(classId = selectedRunClass, force = false, source = "manual") {
  const state = getDivineGearState(classId);
  const definition = divineGearDefinitions[classId];
  if (state.unlocked) return;
  if (!force && state.trialRuns < 2) {
    showToast(`还需完成 ${2 - state.trialRuns} 局神装体验`);
    return;
  }
  openAdDemo(() => {
    grantDivineGearUnlock(classId);
    renderHome();
  }, false, {
    title: source === "stage2" ? "第二关奖励 · 永久解锁" : "永久解锁神器",
    icon: definition.icon,
    headline: definition.name,
    detail: "完整观看后永久拥有；后续可使用补给币无限升阶",
    claimLabel: "永久解锁神器",
  });
}

function upgradeDivineGear(classId = selectedRunClass) {
  const state = getDivineGearState(classId);
  if (!state.unlocked) return;
  const cost = getDivineGearUpgradeCost(state.level);
  if (meta.coins < cost) {
    showToast(`神装强化还差 ${formatSupplyCost(cost - meta.coins)} 补给币`);
    return;
  }
  const before = getCombatPower(classId);
  meta.coins -= cost;
  state.level += 1;
  saveMeta();
  renderHome();
  showToast(`${divineGearDefinitions[classId].name}升至 ${state.level} 阶 · 战力 +${getCombatPower(classId) - before}`);
  tone(720, .22, "triangle", .055, 1.7);
}

function renderDivineGearCard() {
  if (!ui.divineGearCard) return;
  const classId = selectedRunClass;
  const definition = divineGearDefinitions[classId];
  const state = getDivineGearState(classId);
  const level = Math.max(1, state.level || 1);
  const stats = getDivineGearStats(level);
  const combatStats = getDivineGearCombatStats(level, selectedSceneIndex);
  const syncNote = combatStats.synchronization < 1 ? `当前第 ${selectedSceneIndex + 1} 章同步率 ${Math.round(combatStats.synchronization * 100)}%，建议立即升阶。` : `当前章节同步率 100%。`;
  if (state.unlocked) {
    const cost = getDivineGearUpgradeCost(level);
    ui.divineGearCard.className = "divine-gear-card unlocked";
    ui.divineGearCard.innerHTML = `<span class="divine-gear-icon">${definition.icon}</span><span class="divine-gear-copy"><small>已永久解锁 · 无限成长神装</small><b>${definition.name} · ${level} 阶</b><p>伤害 +${Math.round(stats.damage * 100)}% · 生命 +${stats.health} · 暴击 +${(stats.crit * 100).toFixed(1)}%<br>推荐支撑至第 ${stats.supportedChapter} 章；${syncNote}</p></span><button>强化<br><small>◆${formatSupplyCost(cost)}</small></button>`;
    ui.divineGearCard.querySelector("button").addEventListener("click", () => upgradeDivineGear(classId));
  } else {
    const ready = state.trialRuns >= 2;
    const trialStats = getDivineTrialStats(selectedSceneIndex, selectedLevel);
    ui.divineGearCard.className = `divine-gear-card trial${ready ? " ready" : ""}`;
    ui.divineGearCard.innerHTML = `<span class="divine-gear-icon">${definition.icon}</span><span class="divine-gear-copy"><small>战略无人机限时投送 · 每局继续推送</small><b>${definition.name}</b><p>本章体验：伤害 +${Math.round(trialStats.damage * 100)}% · 生命 +${trialStats.health}<br>试玩进度 ${Math.min(2, state.trialRuns)}/2，${ready ? "观看广告即可永久解锁" : `再完成 ${2 - state.trialRuns} 局体验`}</p></span><button ${ready ? "" : "disabled"}>${ready ? "▶ 永久解锁" : `${state.trialRuns}/2`}</button>`;
    ui.divineGearCard.querySelector("button").addEventListener("click", () => unlockDivineGearWithAd(classId));
  }
}

function renderPetRoster() {
  if (!ui.petRoster) return;
  ui.petRoster.innerHTML = petDefinitions.map((pet) => `<button class="pet-card${meta.pet.selected === pet.id ? " active" : ""}" data-pet="${pet.id}" style="--pet-color:${pet.color};--pet-x:${pet.spriteIndex * 50}%"><i class="pet-portrait pet-${pet.id}" aria-hidden="true"></i><b>${pet.name}</b><small>${pet.detail}</small></button>`).join("");
  for (const button of ui.petRoster.querySelectorAll(".pet-card")) {
    button.addEventListener("click", () => {
      meta.pet.selected = button.dataset.pet;
      saveMeta();
      renderPetRoster();
      showToast(`${getSelectedPet().name}已设为随行宠物`);
      tone(610, .1, "triangle", .025, 1.4);
    });
  }
}

function renderArmory() {
  refreshDailyAds();
  const classId = selectedRunClass;
  const classGear = getClassGear(classId);
  const bonuses = getEquippedBonuses(classId);
  const resonance = getGearResonance(classId);
  renderDivineGearCard();
  renderPetRoster();
  ui.gearPowerText.textContent = getCombatPower(classId);
  const bonusLabels = formatBonusSummary(bonuses);
  if (resonance.legendary > 0) bonusLabels.push(`红装共鸣 ${resonance.legendary}/6 · 伤害 +${Math.round(resonance.damage * 100)}%`);
  if (resonance.fullRedSet) bonusLabels.push("满红套装 · 生命/大招额外强化");
  ui.gearBonusList.innerHTML = bonusLabels.length ? bonusLabels.map((label) => `<i>${label}</i>`).join("") : "<i>尚未获得装备加成</i>";
  renderArmoryAvatarPreview();

  ui.equippedGear.innerHTML = gearSlots.map((slot) => {
    const definition = gearDefinitions[slot];
    const item = getGearById(classGear[slot]);
    const rarity = item ? rarityDefinitions[item.rarity] : null;
    return `<button class="gear-slot${item ? " filled" : ""}" data-slot="${slot}" style="--rarity:${rarity?.color || "#59645d"}" ${item ? "" : "disabled"}><span>${definition.icon} ${definition.name.replace(/战术|复合|增幅|相位|回响/, "")}</span><b>${item ? item.name : "未装备"}</b></button>`;
  }).join("");
  for (const slot of ui.equippedGear.querySelectorAll(".gear-slot.filled")) {
    slot.addEventListener("click", () => unequipGearSlot(slot.dataset.slot));
  }

  const classItems = meta.equipment.filter((item) => item.classId === classId);
  ui.inventoryCount.textContent = `${meta.equipment.length} / 60`;
  ui.gearInventory.innerHTML = "";
  if (!classItems.length) {
    ui.gearInventory.innerHTML = '<div class="empty-inventory">该角色还没有专属装备<br>使用这个角色战斗，掉落会自动绑定其职业</div>';
  } else {
    const items = [...classItems].sort((a, b) => rarityDefinitions[b.rarity].multiplier - rarityDefinitions[a.rarity].multiplier || (b.level || 0) - (a.level || 0));
    for (const item of items) {
      const rarity = rarityDefinitions[item.rarity];
      const equipped = classGear[item.slot] === item.id;
      const level = item.level || 0;
      const upgradeCost = getGearUpgradeCost(item);
      const row = document.createElement("div");
      row.className = `gear-item${equipped ? " equipped" : ""}`;
      row.style.setProperty("--rarity", rarity.color);
      row.innerHTML = `<span class="gear-item-icon">${item.icon}</span><span><b>${item.name} ${level ? `+${level}` : ""}</b><small>${formatGearStat(item)} · ${level >= 10 ? "强化已满" : `强化 ◆${upgradeCost}`}</small></span><span class="gear-item-actions"><button ${level >= 10 ? "disabled" : ""}>强化</button><button>${equipped ? "卸下" : "装备"}</button></span>`;
      const [upgradeButton, equipButton] = row.querySelectorAll("button");
      upgradeButton.addEventListener("click", () => upgradeGear(item));
      equipButton.addEventListener("click", () => toggleGear(item));
      ui.gearInventory.append(row);
    }
  }
}

function renderArmoryAvatarPreview() {
  const preview = ui.armoryAvatarPreview;
  if (!preview) return;
  const pctx = preview.getContext("2d");
  const scene = scenes[selectedSceneIndex];
  const combatClass = getSceneClassProfile(scene, selectedRunClass);
  const classIndex = combatClass.id === "melee" ? 0 : combatClass.id === "ranger" ? 1 : 2;
  const gradient = pctx.createLinearGradient(0, 0, 0, preview.height);
  gradient.addColorStop(0, scene.colors.mid); gradient.addColorStop(1, scene.colors.top);
  pctx.clearRect(0, 0, preview.width, preview.height); pctx.fillStyle = gradient; pctx.fillRect(0, 0, preview.width, preview.height);
  pctx.strokeStyle = colorAlpha(scene.colors.grid, .12); pctx.lineWidth = 1;
  for (let y = 34; y < preview.height; y += 32) { pctx.beginPath(); pctx.moveTo(0, y); pctx.lineTo(preview.width, y); pctx.stroke(); }
  const atlas = sceneHeroAtlases[scene.id] || heroAtlas;
  if (atlas.complete && atlas.naturalWidth) {
    const sourceWidth = atlas.naturalWidth / 3;
    const width = scene.endless ? 120 : scene.id === "hospital" ? 106 : 92;
    const height = scene.endless ? 160 : scene.id === "hospital" ? 142 : 128;
    pctx.save(); pctx.shadowColor = combatClass.color; pctx.shadowBlur = 18;
    pctx.drawImage(atlas, sourceWidth * classIndex, 0, sourceWidth, atlas.naturalHeight, 160 - width / 2, 8, width, height); pctx.restore();
  }
  const classGear = getClassGear(selectedRunClass);
  const gear = Object.fromEntries(gearSlots.map((slot) => [slot, getGearById(classGear[slot])]));
  const showGearCosmetics = false;
  const rarityColor = (item) => item ? rarityDefinitions[item.rarity].color : null;
  if (showGearCosmetics) {
  if (showGearCosmetics && gear.armor) {
    const color = rarityColor(gear.armor); const plate = pctx.createLinearGradient(139, 68, 181, 118); plate.addColorStop(0, colorAlpha("#ffffff", .38)); plate.addColorStop(.35, colorAlpha(scene.colors.shot, .44)); plate.addColorStop(1, colorAlpha(scene.colors.dark, .55));
    pctx.fillStyle = plate; pctx.strokeStyle = colorAlpha(scene.colors.shot, .84); pctx.lineWidth = 1.4; pctx.shadowColor = scene.colors.shot; pctx.shadowBlur = 5;
    for (const side of [-1, 1]) { pctx.beginPath(); pctx.moveTo(160 + side * 8, 73); pctx.lineTo(160 + side * 24, 76); pctx.lineTo(160 + side * 28, 85); pctx.lineTo(160 + side * 17, 89); pctx.lineTo(160 + side * 7, 83); pctx.closePath(); pctx.fill(); pctx.stroke(); }
    pctx.beginPath(); pctx.moveTo(148, 79); pctx.lineTo(149, 104); pctx.lineTo(160, 112); pctx.lineTo(171, 104); pctx.lineTo(172, 79); pctx.stroke();
    pctx.strokeStyle = colorAlpha(scene.colors.shot, .62); pctx.beginPath(); pctx.moveTo(152, 92); pctx.lineTo(168, 92); pctx.moveTo(151, 100); pctx.lineTo(169, 100); pctx.stroke(); pctx.shadowBlur = 0;
    if (scene.id === "hospital") { pctx.fillStyle = "#effff9"; pctx.fillRect(158.5, 86, 3, 12); pctx.fillRect(154, 90, 12, 3); }
  }
  if (showGearCosmetics && gear.helmet) {
    const color = rarityColor(gear.helmet); pctx.strokeStyle = color; pctx.fillStyle = colorAlpha(color, .27); pctx.lineWidth = 3; pctx.shadowColor = color; pctx.shadowBlur = 7;
    pctx.beginPath(); pctx.moveTo(141, 54); pctx.quadraticCurveTo(160, 25, 179, 54); pctx.lineTo(175, 63); pctx.quadraticCurveTo(160, 51, 145, 63); pctx.closePath(); pctx.fill(); pctx.stroke();
    pctx.strokeStyle = colorAlpha(scene.colors.shot, .95); pctx.lineWidth = 2; pctx.beginPath(); pctx.moveTo(147, 52); pctx.quadraticCurveTo(160, 60, 173, 52); pctx.stroke();
    if (scene.id === "hospital") { pctx.fillStyle = "#effff9"; pctx.fillRect(158, 34, 4, 14); pctx.fillRect(153, 39, 14, 4); }
    pctx.shadowBlur = 0;
  }
  if (gear.gloves) { const color = rarityColor(gear.gloves); pctx.fillStyle = colorAlpha(color, .66); pctx.strokeStyle = color; pctx.lineWidth = 1.5; for (const x of [129, 191]) { pctx.beginPath(); pctx.roundRect(x - 7, 86, 14, 18, 5); pctx.fill(); pctx.stroke(); pctx.strokeStyle = colorAlpha("#ffffff", .55); for (let y = 91; y < 100; y += 4) { pctx.beginPath(); pctx.moveTo(x - 5, y); pctx.lineTo(x + 5, y); pctx.stroke(); } pctx.strokeStyle = color; } }
  if (gear.boots) { pctx.strokeStyle = colorAlpha(scene.colors.shot, .86); pctx.lineWidth = 2.5; pctx.shadowColor = scene.colors.shot; pctx.shadowBlur = 5; for (const side of [-1, 1]) { pctx.beginPath(); pctx.moveTo(160 + side * 7, 145); pctx.lineTo(160 + side * 20, 146); pctx.lineTo(160 + side * 24, 150); pctx.stroke(); } pctx.shadowBlur = 0; }
  if (gear.relic) { const color = rarityColor(gear.relic); pctx.save(); pctx.translate(216, 76); pctx.fillStyle = colorAlpha(color, .78); pctx.strokeStyle = "#ffffff"; pctx.shadowColor = color; pctx.shadowBlur = 11; if (scene.id === "hospital") { pctx.roundRect(-8, -12, 16, 24, 5); pctx.fill(); pctx.stroke(); pctx.fillStyle = "#effff9"; pctx.fillRect(-2, -7, 4, 14); pctx.fillRect(-6, -3, 12, 4); } else { pctx.beginPath(); pctx.moveTo(0, -12); pctx.lineTo(9, -2); pctx.lineTo(5, 10); pctx.lineTo(-5, 10); pctx.lineTo(-9, -2); pctx.closePath(); pctx.fill(); pctx.stroke(); } pctx.restore(); }
  if (gear.chip) { const color = rarityColor(gear.chip); pctx.fillStyle = "rgba(5,12,15,.84)"; pctx.strokeStyle = color; pctx.lineWidth = 1.5; pctx.roundRect(151, 101, 18, 13, 3); pctx.fill(); pctx.stroke(); pctx.fillStyle = color; for (let x = 154; x <= 164; x += 5) pctx.fillRect(x, 105, 2, 5); }
  }
  ui.wardrobeHeroName.textContent = combatClass.name;
  ui.wardrobeGearSet.textContent = `装备 ${Object.values(classGear).filter(Boolean).length} / ${gearSlots.length}`;
  ui.wardrobeClassSwitch.innerHTML = "";
  for (const entry of classDefinitions) {
    const themedEntry = getSceneClassProfile(scene, entry.id);
    const button = document.createElement("button"); button.className = entry.id === selectedRunClass ? "active" : "";
    button.textContent = themedEntry.short;
    button.addEventListener("click", () => { selectedRunClass = entry.id; meta.selectedClass = entry.id; saveMeta(); renderArmory(); renderCommandCenter(); });
    ui.wardrobeClassSwitch.append(button);
  }
}

function getGearUpgradeCost(item) {
  const rarity = rarityDefinitions[item.rarity]?.multiplier || 1;
  return Math.round((32 + (item.level || 0) * 24) * rarity);
}

function upgradeGear(item) {
  const level = item.level || 0;
  if (level >= 10) return;
  const cost = getGearUpgradeCost(item);
  if (meta.coins < cost) { showToast(`强化还差 ${cost - meta.coins} 枚补给币`); return; }
  const beforePower = getCombatPower(item.classId);
  meta.coins -= cost;
  item.level = level + 1;
  saveMeta();
  renderHome();
  showToast(`${item.name}强化至 +${item.level} · 战力 +${Math.max(1, getCombatPower(item.classId) - beforePower)}`);
  tone(610, .16, "triangle", .045, 1.8);
}

function toggleGear(item) {
  if (item.classId !== selectedRunClass) { showToast("这件装备属于其他角色"); return; }
  const classGear = getClassGear(item.classId);
  const beforePower = getCombatPower(item.classId);
  const equipping = classGear[item.slot] !== item.id;
  classGear[item.slot] = classGear[item.slot] === item.id ? null : item.id;
  saveMeta();
  renderArmory();
  renderCommandCenter();
  const delta = getCombatPower(item.classId) - beforePower;
  ui.gearPowerSummary.classList.remove("changed");
  requestAnimationFrame(() => ui.gearPowerSummary.classList.add("changed"));
  showToast(equipping ? `${item.name}已装备 · ${formatGearStat(item)} · 战力 +${Math.max(1, delta)}` : `${item.name}已卸下 · 战力 ${delta}`);
  tone(equipping ? 580 : 220, .13, "triangle", .035, equipping ? 1.7 : .75);
}

function unequipGearSlot(slot) {
  const classGear = getClassGear(selectedRunClass);
  const item = getGearById(classGear[slot]);
  if (!item) return;
  classGear[slot] = null;
  saveMeta();
  renderArmory();
  renderCommandCenter();
  showToast(`${item.name}已卸下 · ${formatGearStat(item)} 已移除`);
}

function unequipAllGear() {
  const classGear = getClassGear(selectedRunClass);
  const count = Object.values(classGear).filter(Boolean).length;
  if (!count) {
    showToast("当前没有已穿戴装备");
    return;
  }
  meta.classGear[selectedRunClass] = Object.fromEntries(gearSlots.map((slot) => [slot, null]));
  saveMeta();
  renderArmory();
  renderCommandCenter();
  showToast(`已卸下 ${count} 件装备`);
}

function renderCoinStore() {
  refreshDailyState();
  const packs = [
    { coins: 600, price: "¥6" },
    { coins: 3300, price: "¥30" },
    { coins: 6800, price: "¥60" },
  ];
  ui.coinPacks.innerHTML = "";
  for (const pack of packs) {
    const card = document.createElement("div");
    card.className = "coin-pack";
    card.innerHTML = `<span>◆</span><b>${pack.coins}</b><button>${pack.price} · 测试</button>`;
    card.querySelector("button").addEventListener("click", () => testPurchase(pack));
    ui.coinPacks.append(card);
  }
  const remaining = Math.max(0, 3 - meta.adState.watched);
  ui.freeCoinAdButton.disabled = remaining === 0;
  ui.freeCoinAdButton.querySelector("small").textContent = remaining ? `获得 80 补给币 · 今日剩余 ${remaining} 次` : "今日演示奖励已领完";
}

const dailyTaskDefinitions = [
  { id: "runs", icon: "⚔", name: "完成 1 场战斗", target: 1, reward: "◆40", value: () => meta.daily.runs, grant: () => { meta.coins += 40; } },
  { id: "kills", icon: "◎", name: "击破 80 名敌人", target: 80, reward: "◆60", value: () => meta.daily.kills, grant: () => { meta.coins += 60; } },
  { id: "xp", icon: "✦", name: "拾取 30 枚经验晶体", target: 30, reward: "稀有装备", value: () => meta.daily.xp, grant: () => addRewardGear("rare") },
  { id: "ads", icon: "▶", name: "观看 1 次奖励广告", target: 1, reward: "◆50", value: () => meta.daily.ads, grant: () => { meta.coins += 50; } },
];

function addRewardGear(rarity) {
  const item = createGuaranteedGear(rarity, selectedRunClass);
  if (meta.equipment.length < 60) meta.equipment.push(item);
  else meta.coins += Math.round(rarityDefinitions[rarity].multiplier * 18);
  return item;
}

function dailyCompletionCount() {
  return dailyTaskDefinitions.filter((task) => task.value() >= task.target).length;
}

function renderCommandSidebar() {
  refreshDailyState();
  const complete = dailyCompletionCount();
  const claimable = dailyTaskDefinitions.filter((task) => task.value() >= task.target && !meta.daily.claimed[task.id]).length;
  ui.dailyRailBadge.textContent = `${complete}/4`;
  ui.dailyRailBadge.classList.toggle("ready", claimable > 0);
  const eventReady = !meta.activities.signIn || (!meta.activities.dungeonGift && meta.dungeon.clears > 0);
  ui.eventRailBadge.textContent = eventReady ? "可领取" : "进行中";
  ui.eventRailBadge.classList.toggle("ready", eventReady);
  ui.dungeonRailBadge.textContent = `${meta.dungeon.entries}/3`;
  ui.skinRailBadge.textContent = meta.skins.owned.includes("jade_avatar") ? "颜色已领" : "免费颜色";
  ui.skinRailBadge.classList.toggle("ready", !meta.skins.owned.includes("jade_avatar"));
}

function retentionItem({ icon, color = "var(--acid)", name, detail, progress, action, label, disabled = false, secondary = false, swatch = null }) {
  return `<article class="retention-item" style="--item-color:${color}">${swatch || `<i>${icon}</i>`}<div class="retention-copy"><b>${name}</b><small>${detail}</small>${progress ? `<div class="retention-progress"><i style="width:${progress}%"></i></div>` : ""}</div><button data-retention-action="${action}" class="${secondary ? "secondary" : ""}" ${disabled ? "disabled" : ""}>${label}</button></article>`;
}

function openRetentionPanel(panel = "daily") {
  refreshDailyState();
  const titles = {
    daily: ["DAILY OPERATIONS", "每日任务"], events: ["LIMITED EVENTS", "活动中心"],
    dungeon: ["RESOURCE EXPEDITION", "丰饶之境"], skins: ["COSMETIC STORE", "幻装商城"],
  };
  [ui.retentionKicker.textContent, ui.retentionTitle.textContent] = titles[panel] || titles.daily;
  if (panel === "daily") renderDailyPanel();
  else if (panel === "events") renderEventsPanel();
  else if (panel === "dungeon") renderDungeonPanel();
  else renderSkinsPanel();
  ui.retentionModal.dataset.panel = panel;
  ui.retentionModal.classList.remove("hidden");
}

function renderDailyPanel() {
  const completed = dailyCompletionCount();
  ui.retentionContent.innerHTML = `<div class="retention-summary"><b>今日战备 ${completed} / 4</b><p>每日 00:00 刷新。任务进度来自实际战斗与主动拾取，不要求连续在线。</p></div>` + dailyTaskDefinitions.map((task) => {
    const value = Math.min(task.target, task.value());
    const claimed = Boolean(meta.daily.claimed[task.id]);
    return retentionItem({ icon: task.icon, name: task.name, detail: `${value} / ${task.target} · 奖励 ${task.reward}`, progress: value / task.target * 100, action: `daily:${task.id}`, label: claimed ? "已领取" : value >= task.target ? "领取" : "未完成", disabled: claimed || value < task.target });
  }).join("");
  bindRetentionActions();
}

function renderEventsPanel() {
  const entries = [
    { icon: "☀", name: "每日登录补给", detail: "今日首次进入指挥中心 · ◆40", action: "event:sign", label: meta.activities.signIn ? "已领取" : "领取", disabled: meta.activities.signIn },
    { icon: "▦", color: "#8bd0ff", name: "战备广告箱", detail: "自愿观看演示广告 · 稀有装备 1 件", action: "event:gearAd", label: meta.activities.gearAd ? "已领取" : "观看领取", disabled: meta.activities.gearAd },
    { icon: "青", color: "#88ffd2", name: "青霄流光", detail: "免费解锁青蓝大招颜色，不附加额外角色模型", action: "event:avatarAd", label: meta.skins.owned.includes("jade_avatar") ? "已拥有" : "观看解锁", disabled: meta.skins.owned.includes("jade_avatar") },
    { icon: "⌁", color: "#ffd879", name: "丰饶首胜礼", detail: "今日通关丰饶之境 1 次 · 史诗装备", action: "event:dungeon", label: meta.activities.dungeonGift ? "已领取" : meta.dungeon.clears > 0 ? "领取" : "未达成", disabled: meta.activities.dungeonGift || meta.dungeon.clears <= 0 },
  ];
  ui.retentionContent.innerHTML = `<div class="retention-summary"><b>短周期活动</b><p>奖励广告完全自愿；不看广告也能正常推进主线和资源副本。</p></div>${entries.map(retentionItem).join("")}`;
  bindRetentionActions();
}

function renderDungeonPanel() {
  ui.retentionContent.innerHTML = `<div class="dungeon-gate"><i>⌁</i><b>丰饶之境</b><p>独立资源副本 · 每日 3 次 · 约 55 秒。敌人按当前章节动态匹配，通关必得稀有以上装备与大量补给币。</p><button data-retention-action="dungeon:enter" ${meta.dungeon.entries <= 0 ? "disabled" : ""}>进入远征 · 今日 ${meta.dungeon.entries} / 3</button></div><div class="retention-summary"><b>掉落规则</b><p>前 3 章保底稀有装备，第 4 章起保底史诗装备；装备属性仍随章节梯度成长。</p></div>`;
  bindRetentionActions();
}

function renderSkinsPanel() {
  ui.retentionContent.innerHTML = `<div class="retention-summary"><b>大招装扮 · 不增加数值</b><p>原生蓝无附加装扮；价格越高，光层、粒子与释放纹样越丰富。主题装扮同时作为下一战区通行证。</p></div>` + skinDefinitions.map((skin) => {
    const owned = meta.skins.owned.includes(skin.id);
    const equipped = meta.skins.equipped === skin.id;
    const label = equipped ? "使用中" : owned ? "装备" : skin.price == null ? "活动获取" : `◆${skin.price}`;
    const tierLabel = skin.tier ? ` · 特效 ${"★".repeat(skin.tier)}` : " · 纯色";
    return retentionItem({ swatch: `<span class="skin-swatch" style="--skin-a:${skin.primary};--skin-b:${skin.secondary}"></span>`, name: skin.name, detail: `${skin.detail}${tierLabel}`, action: `skin:${skin.id}`, label, disabled: equipped || (!owned && skin.price == null), secondary: owned && !equipped });
  }).join("");
  bindRetentionActions();
}

function bindRetentionActions() {
  ui.retentionContent.querySelectorAll("[data-retention-action]").forEach((button) => button.addEventListener("click", () => handleRetentionAction(button.dataset.retentionAction)));
}

function handleRetentionAction(action) {
  const [type, id] = action.split(":");
  if (type === "daily") {
    const task = dailyTaskDefinitions.find((entry) => entry.id === id);
    if (!task || task.value() < task.target || meta.daily.claimed[id]) return;
    task.grant(); meta.daily.claimed[id] = true; saveMeta(); renderDailyPanel(); renderCommandSidebar(); renderHome(); showToast(`已领取 ${task.reward}`);
  } else if (type === "event" && id === "sign") {
    meta.activities.signIn = true; meta.coins += 40; saveMeta(); renderEventsPanel(); renderHome(); showToast("登录补给到账 ◆40");
  } else if (type === "event" && id === "gearAd") {
    openAdDemo(() => { meta.activities.gearAd = true; const item = addRewardGear("rare"); saveMeta(); renderEventsPanel(); renderHome(); showToast(`获得 ${item.name}`); }, false);
  } else if (type === "event" && id === "avatarAd") {
    openAdDemo(() => { meta.activities.avatarAd = true; if (!meta.skins.owned.includes("jade_avatar")) meta.skins.owned.push("jade_avatar"); meta.skins.equipped = "jade_avatar"; saveMeta(); renderEventsPanel(); renderHome(); showToast("青霄流光已解锁：大招改为青蓝色"); }, false);
  } else if (type === "event" && id === "dungeon" && meta.dungeon.clears > 0) {
    meta.activities.dungeonGift = true; const item = addRewardGear("epic"); saveMeta(); renderEventsPanel(); renderHome(); showToast(`首胜礼：${item.name}`);
  } else if (type === "dungeon" && id === "enter") {
    ui.retentionModal.classList.add("hidden"); openLoadout("resource");
  } else if (type === "skin") {
    const skin = skinDefinitions.find((entry) => entry.id === id); if (!skin) return;
    if (meta.skins.owned.includes(id)) meta.skins.equipped = id;
    else if (skin.price != null && meta.coins >= skin.price) { meta.coins -= skin.price; meta.skins.owned.push(id); meta.skins.equipped = id; }
    else { showToast(skin.price == null ? "请从活动中心免费解锁" : `还差 ◆${Math.max(0, skin.price - meta.coins)}`); return; }
    saveMeta(); renderSkinsPanel(); renderHome(); showToast(`已装备 ${skin.name}`);
  }
}

function testPurchase(pack) {
  if (!window.confirm(`测试购买 ${pack.coins} 补给币？\n这是原型模拟，不会扣款。`)) return;
  meta.coins += pack.coins;
  saveMeta();
  ui.coinStoreModal.classList.add("hidden");
  renderHome();
  showToast(`测试到账 ◆${pack.coins}`);
}

function openAdDemo(reward, usesDailyLimit = true, presentation = {}) {
  refreshDailyAds();
  if (usesDailyLimit && meta.adState.watched >= 3) {
    showToast("今日演示广告次数已用完");
    return;
  }
  pendingAdReward = { reward, usesDailyLimit };
  ui.adTitle.textContent = presentation.title || "演示广告";
  const adVisual = ui.adModal.querySelector(".ad-visual");
  adVisual.querySelector("span").textContent = presentation.icon || "✦";
  adVisual.querySelector("b").textContent = presentation.headline || "星际补给站";
  adVisual.querySelector("small").textContent = presentation.detail || "此处将由正式广告 SDK 提供内容";
  ui.adModal.classList.remove("hidden");
  ui.claimAdReward.disabled = true;
  ui.claimAdReward.querySelector("span").textContent = "等待广告结束";
  let remaining = 3;
  ui.adCountdown.textContent = `${remaining} 秒后可领取奖励`;
  clearInterval(adTimer);
  adTimer = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) ui.adCountdown.textContent = `${remaining} 秒后可领取奖励`;
    else {
      clearInterval(adTimer);
      ui.adCountdown.textContent = "演示结束，奖励已准备";
      ui.claimAdReward.disabled = false;
      ui.claimAdReward.querySelector("span").textContent = presentation.claimLabel || "领取奖励";
    }
  }, 1000);
}

function renderHome() {
  refreshDailyState();
  ensureSceneAssets(scenes[selectedSceneIndex].id);
  ui.adminBadge?.classList.toggle("hidden", !ADMIN_MODE);
  if (ui.commanderRole) ui.commanderRole.textContent = ADMIN_MODE ? "网页管理员" : "游客指挥官";
  if (ui.energyText) ui.energyText.textContent = `${meta.energy.current}/${meta.energy.max}`;
  renderMeta();
  renderArmory();
  renderCoinStore();
  renderSceneMap();
  renderCommandCenter();
  renderCommandSidebar();
}

function renderCommandCenter() {
  const scene = scenes[selectedSceneIndex];
  const cleared = meta.progress[scene.id] || 0;
  const combatClass = getSceneClassProfile(scene, selectedRunClass);
  const nextLevel = scene.endless ? "无尽修行" : getLevelModifier(selectedLevel).name;
  ui.lobbyHero.dataset.classId = selectedRunClass;
  ui.sceneHero.dataset.classId = selectedRunClass;
  ui.lobbyChapter.textContent = `${scene.chapter} · ${scene.name}`;
  ui.lobbyMission.textContent = isSceneUnlocked(selectedSceneIndex) ? `待命：${nextLevel}` : "战区入口受限";
  ui.lobbyProgress.textContent = scene.endless ? "六大修行地域循环 · 首领无限轮换" : `区域攻略 ${cleared} / ${LEVELS_PER_SCENE}`;
  ui.lobbyClass.textContent = combatClass.name;
  ui.lobbyPower.textContent = `战力 ${getCombatPower(selectedRunClass)}`;
  ui.equippedCount.textContent = `${Object.values(getClassGear(selectedRunClass)).filter(Boolean).length} / ${gearSlots.length} 已装备`;
  const readyTasks = dailyTaskDefinitions.filter((task) => task.value() >= task.target && !meta.daily.claimed[task.id]).length;
  ui.nextObjective.querySelector("small").textContent = readyTasks ? `${readyTasks} 项奖励可领取` : `今日战备 ${dailyCompletionCount()} / 4`;
}

function renderSceneMap() {
  const scene = scenes[selectedSceneIndex];
  ensureSceneAssets(scene.id);
  const cleared = meta.progress[scene.id];
  const unlocked = isSceneUnlocked(selectedSceneIndex);
  const modifier = getLevelModifier(selectedLevel);
  document.querySelector("#app").dataset.scene = scene.id;
  if (ui.sceneIcon) ui.sceneIcon.textContent = scene.icon;
  ui.chapter.textContent = scene.chapter;
  ui.sceneName.textContent = scene.name;
  ui.sceneDescription.textContent = scene.description;
  ui.sceneHero.textContent = "";
  ui.sceneHero.dataset.classId = selectedRunClass;
  ui.sceneStatus.textContent = !unlocked ? "装扮门槛" : scene.endless ? "无尽开放" : cleared >= LEVELS_PER_SCENE ? "章节完成" : cleared ? `推进 ${cleared}/${LEVELS_PER_SCENE}` : "新战区";
  ui.sceneCard.classList.toggle("locked", !unlocked);
  ui.sceneProgressFill.style.width = `${cleared / LEVELS_PER_SCENE * 100}%`;
  ui.sceneProgressText.textContent = scene.endless ? "∞" : `${cleared} / ${LEVELS_PER_SCENE}`;
  ui.previousScene.disabled = selectedSceneIndex === 0;
  ui.nextScene.disabled = selectedSceneIndex === scenes.length - 1;
  ui.levelModifier.textContent = scene.endless ? "三命修行 · 无限灵压" : `${String(selectedLevel).padStart(2, "0")} · ${modifier.name}`;
  ui.levelGrid.innerHTML = "";
  ui.levelGrid.classList.toggle("endless-grid", Boolean(scene.endless));

  for (let level = 1; level <= (scene.endless ? 1 : LEVELS_PER_SCENE); level += 1) {
    const completed = level <= cleared;
    const levelUnlocked = isLevelUnlocked(selectedSceneIndex, level);
    const button = document.createElement("button");
    button.className = `level-node${completed ? " completed" : ""}${level === selectedLevel ? " selected" : ""}${!levelUnlocked ? " locked" : ""}`;
    button.textContent = scene.endless ? "∞ 进入无尽修行" : String(level).padStart(2, "0");
    button.disabled = !levelUnlocked;
    button.setAttribute("aria-label", `${scene.name}第${level}关${completed ? "，已完成" : levelUnlocked ? "" : "，未解锁"}`);
    if (levelUnlocked) button.addEventListener("click", () => selectLevel(level));
    ui.levelGrid.append(button);
  }

  ui.start.disabled = !isLevelUnlocked(selectedSceneIndex, selectedLevel);
  ui.startText.textContent = unlocked ? (scene.endless ? "踏入太虚仙域" : `开始 ${String(selectedSceneIndex + 1).padStart(2, "0")}-${String(selectedLevel).padStart(2, "0")}`) : "章节尚未解锁";
  const energyCost = getRunEnergyCost("main");
  const missionTarget = 26 + selectedSceneIndex * 6 + selectedLevel * 3;
  ui.startHint.textContent = unlocked ? (scene.endless ? `消耗 ${energyCost} 体力 · 三条命 · 无尽挑战` : `消耗 ${energyCost} 体力 · 任务击杀 ${missionTarget} · ${modifier.name}`) : getSceneLockedMessage(selectedSceneIndex);
}

function selectScene(index) {
  if (index < 0 || index >= scenes.length) return;
  selectedSceneIndex = index;
  const cleared = meta.progress[scenes[index].id];
  selectedLevel = isSceneUnlocked(index) ? Math.min(LEVELS_PER_SCENE, cleared + 1) : 1;
  if (isSceneUnlocked(index) && !QA_MODE) {
    meta.currentScene = index;
    meta.currentLevel = selectedLevel;
    saveMeta();
  }
  renderSceneMap();
  renderCommandCenter();
  tone(250 + index * 35, 0.06, "triangle", 0.018, 1.25);
}

function selectLevel(level) {
  if (!isLevelUnlocked(selectedSceneIndex, level)) return;
  selectedLevel = level;
  if (!QA_MODE) {
    meta.currentScene = selectedSceneIndex;
    meta.currentLevel = selectedLevel;
    saveMeta();
  }
  renderSceneMap();
  renderCommandCenter();
}

function switchHomePanel(panel) {
  const showCommand = panel === "command";
  const showWorld = panel === "world";
  const showBase = panel === "base";
  const showArmory = panel === "armory";
  ui.commandPanel.classList.toggle("hidden", !showCommand);
  ui.worldPanel.classList.toggle("hidden", !showWorld);
  ui.basePanel.classList.toggle("hidden", !showBase);
  ui.armoryPanel.classList.toggle("hidden", !showArmory);
  ui.commandTab.classList.toggle("active", showCommand);
  ui.worldTab.classList.toggle("active", showWorld);
  ui.baseTab.classList.toggle("active", showBase);
  ui.armoryTab.classList.toggle("active", showArmory);
  ui.start.classList.toggle("hidden", !showWorld);
  if (showCommand) renderCommandCenter();
  if (showArmory) renderArmory();
}

function buyMetaUpgrade(definition) {
  const level = meta.upgrades[definition.id];
  if (level >= definition.costs.length) return;
  const cost = definition.costs[level];
  if (meta.coins < cost) {
    showToast(`还差 ${cost - meta.coins} 枚补给币`);
    tone(130, 0.08, "square", 0.025, 0.8);
    return;
  }
  meta.coins -= cost;
  meta.upgrades[definition.id] += 1;
  saveMeta();
  renderHome();
  showToast(`${definition.name} 已升至 ${level + 1} 级`);
  tone(420, 0.11, "triangle", 0.035, 1.5);
}

function showToast(text) {
  clearTimeout(toastTimer);
  ui.toast.textContent = text;
  ui.toast.classList.remove("hidden");
  toastTimer = setTimeout(() => ui.toast.classList.add("hidden"), 1500);
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  if (game) {
    ctx.save();
    if (game.shake > 0) ctx.translate(rand(-game.shake, game.shake), rand(-game.shake, game.shake));
    drawBattlefield();
    ctx.restore();
    drawBattleAtmosphere();
    drawBossScreenShock();
    drawMovementGuide();
    drawBanner();
    drawDivineAwakeningOverlay();
    if (game.flash > 0) {
      ctx.fillStyle = `rgba(${game.health <= 0 ? "255,55,45" : "138,255,211"},${game.flash * 0.25})`;
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    drawHomeSilhouettes();
  }
}

function drawBossScreenShock() {
  if (!game.bossShock) return;
  const strength = Math.min(1, game.bossShock / .78);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = colorAlpha(game.scene.colors.hit, .5 * strength);
  ctx.lineWidth = 5 * strength;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath(); ctx.arc(W / 2, H / 2, (1 - strength) * 230 + 38 + i * 34, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = .15 * strength;
  ctx.fillStyle = game.scene.colors.hit;
  for (let y = 0; y < H; y += 18) ctx.fillRect((y % 36 ? -1 : 1) * strength * 10, y, W, 3);
  ctx.restore();
}

function drawBattleAtmosphere() {
  const sceneId = game.scene.id;
  ctx.save();
  if (sceneId === "hospital") {
    const scanY = 145 + (ambienceTime * 32) % 560;
    const scan = ctx.createLinearGradient(0, scanY - 22, 0, scanY + 22);
    scan.addColorStop(0, "rgba(87,255,207,0)"); scan.addColorStop(.5, "rgba(87,255,207,.055)"); scan.addColorStop(1, "rgba(87,255,207,0)");
    ctx.fillStyle = scan; ctx.fillRect(0, scanY - 22, W, 44);
    ctx.strokeStyle = "rgba(150,255,229,.12)"; ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(W, scanY); ctx.stroke();
  } else if (sceneId === "snow") {
    ctx.fillStyle = "rgba(236,251,255,.5)";
    for (let i = 0; i < 20; i += 1) {
      const x = (i * 61 + ambienceTime * (7 + i % 4)) % (W + 30) - 15;
      const y = (i * 97 + ambienceTime * (38 + i % 7)) % H;
      ctx.beginPath(); ctx.arc(x, y, 1 + i % 3 * .45, 0, Math.PI * 2); ctx.fill();
    }
  } else if (sceneId === "mars") {
    ctx.fillStyle = "rgba(219,116,65,.035)";
    for (let i = 0; i < 5; i += 1) ctx.fillRect(0, 215 + ((i * 137 + ambienceTime * 23) % 570), W, 2 + i % 2);
  } else if (sceneId === "cultivation") {
    const mist = ctx.createLinearGradient(0, H * .45, W, H * .7);
    mist.addColorStop(0, "rgba(175,233,203,0)"); mist.addColorStop(.5, "rgba(175,233,203,.045)"); mist.addColorStop(1, "rgba(175,233,203,0)");
    ctx.fillStyle = mist; ctx.fillRect(0, H * .35, W, H * .42);
  }
  const vignette = ctx.createRadialGradient(W / 2, H * .49, H * .2, W / 2, H * .49, H * .61);
  vignette.addColorStop(.58, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.42)");
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  const topShade = ctx.createLinearGradient(0, 90, 0, 250);
  topShade.addColorStop(0, "rgba(0,0,0,.32)"); topShade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topShade; ctx.fillRect(0, 90, W, 180);
  ctx.restore();
}

function drawDivineAwakeningOverlay() {
  if (!game.divineAwakening && !game.divineOverdrive) return;
  const awakening = game.divineAwakening > 0;
  const intensity = awakening ? Math.min(1, game.divineAwakening / .65) : .42 + Math.sin(ambienceTime * 8) * .08;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createRadialGradient(W / 2, H * .51, 18, W / 2, H * .51, awakening ? 260 : 190);
  halo.addColorStop(0, `rgba(255,247,181,${.2 * intensity})`);
  halo.addColorStop(.35, `rgba(255,201,65,${.11 * intensity})`);
  halo.addColorStop(1, "rgba(255,190,45,0)");
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H * .51);
  ctx.rotate(ambienceTime * (awakening ? 1.4 : .45));
  const rays = awakening ? 18 : 10;
  for (let index = 0; index < rays; index += 1) {
    ctx.rotate(Math.PI * 2 / rays);
    const ray = ctx.createLinearGradient(38, 0, awakening ? 245 : 165, 0);
    ray.addColorStop(0, `rgba(255,244,169,${.26 * intensity})`);
    ray.addColorStop(1, "rgba(102,255,232,0)");
    ctx.fillStyle = ray;
    ctx.beginPath(); ctx.moveTo(35, -2); ctx.lineTo(awakening ? 255 : 175, -8); ctx.lineTo(awakening ? 255 : 175, 8); ctx.lineTo(35, 2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawMovementGuide() {
  if (!pointerMove.active || paused) return;
  const distance = Math.hypot(pointerMove.x - (pointerMove.touchMode ? pointerMove.originX : W / 2), pointerMove.y - (pointerMove.touchMode ? pointerMove.originY : H / 2));
  if (distance < 24) return;
  ctx.save(); ctx.translate(pointerMove.x, pointerMove.y);
  ctx.strokeStyle = colorAlpha(game.player.combatClass.color, .55); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 9 + Math.sin(ambienceTime * 6) * 2, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 4; i += 1) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(20, 0); ctx.stroke(); }
  ctx.fillStyle = colorAlpha(game.player.combatClass.color, .7); ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBackground() {
  const scene = game?.scene || scenes[selectedSceneIndex];
  const colors = scene.colors;
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, colors.top);
  gradient.addColorStop(0.52, colors.mid);
  gradient.addColorStop(1, colors.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  if (!game) {
    if (scene.id === "city") drawCityBackdrop();
    if (scene.id === "snow") drawSnowBackdrop();
    if (scene.id === "hospital") drawHospitalBackdrop();
    if (scene.id === "orbit") drawOrbitBackdrop();
    if (scene.id === "mars") drawMarsBackdrop();
    if (scene.id === "moon") drawMoonBackdrop();
    if (scene.id === "cultivation") drawCultivationBackdrop();
    drawPerspectiveGrid(colors.grid, scene.id === "hospital" ? 44 : 52);
  } else {
    const floorGlow = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, H * .58);
    floorGlow.addColorStop(0, colorAlpha(colors.grid, .1));
    floorGlow.addColorStop(1, "rgba(0,0,0,.28)");
    ctx.fillStyle = floorGlow; ctx.fillRect(0, 0, W, H);
  }

  ctx.save();
  for (let i = 0; i < 32; i += 1) {
    const x = (i * 71.7 + Math.sin(i * 2.4) * 23) % W;
    const y = (i * 109 + ambienceTime * (scene.id === "snow" ? 18 + i % 7 : 4 + i % 4)) % H;
    ctx.fillStyle = colorAlpha(colors.grid, scene.id === "snow" ? 0.16 : 0.045 + (i % 3) * 0.015);
    ctx.beginPath();
    ctx.arc(x, y, scene.id === "snow" ? 1.5 + i % 2 : 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPerspectiveGrid(color, step) {
  ctx.save();
  ctx.strokeStyle = colorAlpha(color, 0.095);
  ctx.lineWidth = 1;
  for (let y = 136; y < BASE_Y; y += step) {
    const perspective = (y - 95) / (BASE_Y - 95);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    if (perspective > 0.16) {
      for (const direction of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(W / 2, 92);
        ctx.lineTo(W / 2 + direction * perspective * 230, y);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawCityBackdrop() {
  ctx.save();
  ctx.fillStyle = "rgba(2,8,5,.52)";
  const buildings = [[0,58,92],[48,80,128],[112,57,104],[166,74,139],[234,48,111],[281,65,151],[344,54,99]];
  for (const [x, width, height] of buildings) {
    ctx.fillRect(x, 118, width, height);
    ctx.fillStyle = "rgba(174,230,92,.08)";
    for (let wy = 133; wy < 118 + height - 9; wy += 18) {
      for (let wx = x + 8; wx < x + width - 5; wx += 17) ctx.fillRect(wx, wy, 5, 7);
    }
    ctx.fillStyle = "rgba(2,8,5,.52)";
  }
  ctx.strokeStyle = "rgba(137,192,109,.12)";
  ctx.beginPath();
  ctx.moveTo(74, 220); ctx.lineTo(105, 176); ctx.lineTo(115, 222);
  ctx.moveTo(304, 250); ctx.lineTo(328, 196); ctx.lineTo(342, 249);
  ctx.stroke();
  ctx.restore();
}

function drawSnowBackdrop() {
  ctx.save();
  ctx.fillStyle = "rgba(214,241,247,.16)";
  ctx.beginPath();
  ctx.moveTo(0, 280); ctx.lineTo(70, 170); ctx.lineTo(118, 242); ctx.lineTo(193, 125); ctx.lineTo(278, 251); ctx.lineTo(336, 181); ctx.lineTo(W, 260); ctx.lineTo(W, 330); ctx.lineTo(0, 330); ctx.fill();
  ctx.fillStyle = "rgba(238,252,255,.18)";
  ctx.beginPath();
  ctx.moveTo(139, 208); ctx.lineTo(193, 125); ctx.lineTo(233, 188); ctx.lineTo(196, 170); ctx.lineTo(174, 193); ctx.fill();
  ctx.fillStyle = "rgba(238,252,255,.09)";
  for (let i = 0; i < 7; i += 1) {
    const x = 18 + i * 61;
    ctx.beginPath(); ctx.moveTo(x, 315); ctx.lineTo(x + 18, 265 - (i % 2) * 18); ctx.lineTo(x + 36, 315); ctx.fill();
  }
  ctx.restore();
}

function drawHospitalBackdrop() {
  ctx.save();
  ctx.fillStyle = "rgba(220,244,236,.085)";
  ctx.fillRect(0, 122, W, 210);
  ctx.fillStyle = "rgba(5,24,20,.45)";
  ctx.fillRect(20, 157, 82, 157);
  ctx.fillRect(W - 102, 157, 82, 157);
  ctx.strokeStyle = "rgba(126,255,213,.18)";
  ctx.strokeRect(33, 174, 55, 93);
  ctx.strokeRect(W - 88, 174, 55, 93);
  ctx.fillStyle = "rgba(127,255,212,.28)";
  ctx.fillRect(52, 207, 17, 5); ctx.fillRect(58, 201, 5, 17);
  ctx.fillRect(W - 69, 207, 17, 5); ctx.fillRect(W - 63, 201, 5, 17);
  ctx.fillStyle = "rgba(226,255,246,.075)";
  ctx.fillRect(119, 140, 152, 18);
  ctx.restore();
}

function drawOrbitBackdrop() {
  ctx.save();
  for (let i = 0; i < 58; i += 1) {
    const x = (i * 83) % W;
    const y = 100 + (i * 47) % 430;
    ctx.fillStyle = `rgba(220,230,255,${0.18 + (i % 4) * .08})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 1.8 : 1, i % 7 === 0 ? 1.8 : 1);
  }
  const planet = ctx.createRadialGradient(305, 167, 4, 305, 167, 93);
  planet.addColorStop(0, "rgba(90,190,225,.42)");
  planet.addColorStop(.72, "rgba(42,91,164,.28)");
  planet.addColorStop(1, "rgba(42,91,164,0)");
  ctx.fillStyle = planet;
  ctx.beginPath(); ctx.arc(305, 167, 93, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(170,184,255,.12)";
  ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(305, 167, 112, 30, -.35, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawMarsBackdrop() {
  ctx.save();
  ctx.fillStyle = "rgba(60,18,11,.5)";
  ctx.beginPath();
  ctx.moveTo(0, 287); ctx.lineTo(55, 228); ctx.lineTo(89, 258); ctx.lineTo(143, 171); ctx.lineTo(201, 254); ctx.lineTo(263, 203); ctx.lineTo(322, 263); ctx.lineTo(W, 220); ctx.lineTo(W, 330); ctx.lineTo(0, 330); ctx.fill();
  ctx.fillStyle = "rgba(255,157,91,.09)";
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath(); ctx.ellipse(25 + i * 47, 340 + (i % 3) * 53, 12 + i % 4 * 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawMoonBackdrop() {
  ctx.save();
  for (let i = 0; i < 44; i += 1) {
    ctx.fillStyle = `rgba(236,236,255,${.15 + (i % 3) * .08})`;
    ctx.fillRect((i * 91) % W, 97 + (i * 53) % 380, 1, 1);
  }
  const earth = ctx.createRadialGradient(78, 172, 3, 78, 172, 48);
  earth.addColorStop(0, "rgba(163,232,255,.75)"); earth.addColorStop(.68, "rgba(70,129,206,.45)"); earth.addColorStop(1, "rgba(60,105,190,0)");
  ctx.fillStyle = earth; ctx.beginPath(); ctx.arc(78, 172, 48, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(17,17,30,.23)";
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath(); ctx.ellipse(30 + i * 51, 341 + (i % 3) * 82, 15 + i % 3 * 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawCultivationBackdrop() {
  ctx.save();
  const moon = ctx.createRadialGradient(302, 158, 4, 302, 158, 62);
  moon.addColorStop(0, "rgba(232,255,208,.7)"); moon.addColorStop(.7, "rgba(182,229,194,.22)"); moon.addColorStop(1, "rgba(182,229,194,0)");
  ctx.fillStyle = moon; ctx.beginPath(); ctx.arc(302, 158, 62, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(4,20,16,.58)";
  ctx.beginPath(); ctx.moveTo(0,305); ctx.quadraticCurveTo(54,212,108,275); ctx.quadraticCurveTo(170,164,229,272); ctx.quadraticCurveTo(305,205,390,284); ctx.lineTo(390,370); ctx.lineTo(0,370); ctx.fill();
  ctx.strokeStyle = "rgba(190,255,213,.2)"; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) { const y = 235 + i * 38; ctx.beginPath(); ctx.moveTo(-20, y); ctx.bezierCurveTo(90, y - 24, 224, y + 25, 420, y - 7); ctx.stroke(); }
  ctx.fillStyle = "rgba(219,255,226,.16)";
  for (let i = 0; i < 13; i += 1) { const x = (i * 71) % W; const y = 130 + (i * 47) % 320; ctx.beginPath(); ctx.ellipse(x, y, 22, 4, -.25, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

function drawBattlefield() {
  ctx.save();
  const zoom = game.camera?.zoom || 1;
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-game.player.x, -game.player.y);
  drawWorldDecor();
  for (const scar of game.bossScars) drawBossScar(scar);
  for (const wave of game.shockwaves) {
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
    ctx.strokeStyle = colorAlpha(wave.color, Math.min(0.8, wave.life * 1.6));
    ctx.lineWidth = wave.color === "#66f5d2" ? 5 : 3;
    ctx.stroke();
  }

  for (const mark of game.groundMarks) drawGroundMark(mark);
  for (const corpse of game.corpses) drawCorpse(corpse);
  for (const drop of game.xpDrops) drawXpDrop(drop);
  for (const kit of game.medkits) drawMedkit(kit);
  drawDivineDelivery();
  for (const warning of game.bossWarnings) drawBossWarning(warning);
  // Player and enemies share one Canvas2D actor layer. Sorting by their
  // ground-contact point makes feet, shadows and bodies occlude naturally.
  const petPosition = game.player.companionPet ? getCompanionPetPosition() : null;
  const companionActor = petPosition ? { companion: true, ...petPosition } : null;
  const actors = [...game.enemies, game.player, ...(companionActor ? [companionActor] : [])];
  actors.sort((a, b) => {
    const aDepth = a === game.player ? a.y + 30 : a.companion ? a.y + 19 : a.y + a.size * .92;
    const bDepth = b === game.player ? b.y + 30 : b.companion ? b.y + 19 : b.y + b.size * .92;
    return aDepth - bDepth;
  });
  for (const actor of actors) {
    if (actor === game.player) drawBase();
    else if (actor.companion) drawCompanionPet();
    else drawEnemy(actor);
  }
  for (const projectile of game.enemyProjectiles) drawEnemyProjectile(projectile);
  for (const bullet of game.bullets) drawBullet(bullet);
  for (const burst of game.impactBursts) drawImpactBurst(burst);
  for (const lightning of game.lightnings) drawLightning(lightning);
  drawUltimateEffect();
  const particleStep = game.performance?.quality < .65 ? 2 : 1;
  for (let index = 0; index < game.particles.length; index += particleStep) drawCombatParticle(game.particles[index]);
  ctx.globalAlpha = 1;
  for (const floater of game.floaters) drawFloater(floater);
  ctx.restore();
}

function drawCombatParticle(particle) {
  const alpha = Math.min(1, particle.life / .18);
  ctx.save(); ctx.translate(particle.x, particle.y); ctx.rotate(particle.rotation || 0); ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color; ctx.strokeStyle = particle.color; ctx.shadowColor = particle.color; ctx.shadowBlur = particle.shape ? 6 : 2;
  if (particle.shape === "spark") {
    ctx.lineWidth = Math.max(1, particle.size * .55); ctx.beginPath(); ctx.moveTo(-particle.size * 2.6, 0); ctx.lineTo(particle.size * 2.6, 0); ctx.stroke();
  } else if (particle.shape === "shard") {
    ctx.beginPath(); ctx.moveTo(particle.size * 2.1, 0); ctx.lineTo(-particle.size, -particle.size * .72); ctx.lineTo(-particle.size * .45, particle.size * .8); ctx.closePath(); ctx.fill();
  } else if (particle.shape === "glyph") {
    ctx.fillRect(-particle.size * 1.5, -particle.size * .45, particle.size * 3, particle.size * .9);
  } else if (particle.shape === "chip") {
    ctx.fillRect(-particle.size, -particle.size * .55, particle.size * 2, particle.size * 1.1);
  } else {
    ctx.beginPath(); ctx.arc(0, 0, particle.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function scarNoise(seed, index) {
  return Math.sin(seed * 12.9898 + index * 78.233) * .5 + .5;
}

function drawBossScar(scar) {
  const r = scar.radius;
  const fade = scar.life < 9 ? scar.life / 9 : 1;
  ctx.save();
  ctx.translate(scar.x, scar.y);
  ctx.rotate(scar.rotation);
  ctx.globalAlpha = Math.max(0, fade);

  const crater = (inner, rim, stretch = .68) => {
    const gradient = ctx.createRadialGradient(-r * .12, -r * .12, r * .08, 0, 0, r);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(.56, colorAlpha(inner, .92));
    gradient.addColorStop(.74, colorAlpha(rim, .72));
    gradient.addColorStop(1, colorAlpha(rim, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * stretch, 0, 0, Math.PI * 2); ctx.fill();
  };
  const cracks = (color, count = 11, length = 1) => {
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, r * .018);
    for (let i = 0; i < count; i += 1) {
      const angle = i / count * Math.PI * 2 + scarNoise(scar.seed, i) * .34;
      const start = r * (.36 + scarNoise(scar.seed, i + 20) * .12);
      const end = r * (.72 + scarNoise(scar.seed, i + 40) * .28) * length;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start * .68);
      const mid = (start + end) * .56;
      ctx.lineTo(Math.cos(angle + .09) * mid, Math.sin(angle + .09) * mid * .68);
      ctx.lineTo(Math.cos(angle - .04) * end, Math.sin(angle - .04) * end * .68);
      ctx.stroke();
    }
  };

  if (scar.type === "snowCrater") {
    crater("#173c54", "#dff8ff", .62);
    ctx.strokeStyle = "rgba(244,253,255,.92)"; ctx.lineWidth = r * .12;
    ctx.beginPath(); ctx.ellipse(0, -r * .04, r * .82, r * .49, 0, Math.PI * .08, Math.PI * .92); ctx.stroke();
    ctx.strokeStyle = "rgba(89,150,178,.76)"; ctx.lineWidth = r * .035;
    for (let i = 0; i < 7; i += 1) {
      const a = i / 7 * Math.PI * 2; const d = r * (.7 + scarNoise(scar.seed, i) * .18);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d * .61); ctx.lineTo(Math.cos(a) * d * 1.16, Math.sin(a) * d * .72); ctx.stroke();
    }
  } else if (scar.type === "ruins") {
    crater("#090b0b", "#625c52", .67);
    cracks("rgba(13,15,15,.94)", 13, 1.18);
    for (let i = 0; i < 14; i += 1) {
      const a = i / 14 * Math.PI * 2 + scarNoise(scar.seed, i) * .45;
      const d = r * (.54 + scarNoise(scar.seed, i + 9) * .38);
      const size = r * (.07 + scarNoise(scar.seed, i + 31) * .09);
      ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d * .66); ctx.rotate(a + scarNoise(scar.seed, i + 55));
      ctx.fillStyle = i % 3 ? "#504d45" : "#777267"; ctx.fillRect(-size, -size * .38, size * 2, size * .76);
      if (i % 4 === 0) { ctx.strokeStyle = "#b8644b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 1.5, -size * .7); ctx.stroke(); }
      ctx.restore();
    }
  } else if (scar.type === "hullBreach") {
    crater("#02030a", "#586076", .7);
    ctx.fillStyle = "#02040a"; ctx.beginPath(); ctx.ellipse(0, 0, r * .48, r * .34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,122,73,.78)"; ctx.lineWidth = r * .045; ctx.shadowColor = "#ff633d"; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.ellipse(0, 0, r * .53, r * .38, 0, .15, Math.PI * 1.86); ctx.stroke(); ctx.shadowBlur = 0;
    cracks("rgba(117,192,255,.7)", 12, 1.12);
    for (let i = 0; i < 10; i += 1) {
      const a = i / 10 * Math.PI * 2; const d = r * .65;
      ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d * .68); ctx.rotate(a);
      ctx.fillStyle = i % 2 ? "#97a6c2" : "#3b4459";
      ctx.beginPath(); ctx.moveTo(-r * .12, -r * .07); ctx.lineTo(r * .16, 0); ctx.lineTo(-r * .1, r * .08); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.strokeStyle = "rgba(255,197,77,.66)"; ctx.lineWidth = 3; ctx.setLineDash([8, 7]);
    ctx.beginPath(); ctx.ellipse(0, 0, r * .9, r * .6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  } else if (scar.type === "bioBreach") {
    crater("#24101b", "#6c3048", .66);
    cracks("rgba(255,104,139,.76)", 12, 1.08);
    ctx.strokeStyle = "rgba(106,255,211,.6)"; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(0, 0, r * (.26 + i * .16), i * .8, i * .8 + Math.PI * 1.25); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,69,115,.48)";
    for (let i = 0; i < 9; i += 1) { const a = scarNoise(scar.seed, i) * Math.PI * 2; const d = scarNoise(scar.seed, i + 14) * r * .64; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d * .65, r * (.025 + scarNoise(scar.seed, i + 38) * .045), 0, Math.PI * 2); ctx.fill(); }
  } else if (scar.type === "moltenCrater") {
    crater("#180908", "#71321f", .65);
    cracks("rgba(255,91,38,.84)", 14, 1.12);
    ctx.strokeStyle = "#ff9e43"; ctx.lineWidth = r * .035; ctx.shadowColor = "#ff5228"; ctx.shadowBlur = 14;
    for (let i = 0; i < 5; i += 1) { const a = i * 1.21; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .12, Math.sin(a) * r * .08); ctx.quadraticCurveTo(Math.cos(a + .35) * r * .36, Math.sin(a + .35) * r * .22, Math.cos(a) * r * .58, Math.sin(a) * r * .38); ctx.stroke(); }
  } else if (scar.type === "lunarCrater") {
    crater("#171824", "#8c8d9d", .63);
    ctx.strokeStyle = "rgba(225,226,240,.58)"; ctx.lineWidth = r * .09;
    ctx.beginPath(); ctx.ellipse(-r * .03, -r * .04, r * .76, r * .43, 0, Math.PI * 1.08, Math.PI * 1.88); ctx.stroke();
    cracks("rgba(35,35,51,.8)", 10, 1.1);
  } else {
    crater("#071410", "#49725c", .68);
    cracks("rgba(255,216,115,.56)", 12, 1.05);
    ctx.strokeStyle = "rgba(255,219,123,.74)"; ctx.lineWidth = 3; ctx.shadowColor = "#ffe191"; ctx.shadowBlur = 9;
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(0, 0, r * (.24 + i * .18), i * .55, i * .55 + Math.PI * 1.45); ctx.stroke(); }
    for (let i = 0; i < 8; i += 1) { const a = i / 8 * Math.PI * 2; ctx.save(); ctx.translate(Math.cos(a) * r * .55, Math.sin(a) * r * .37); ctx.rotate(a); ctx.fillStyle = "rgba(255,231,155,.8)"; ctx.fillRect(-5, -2, 10, 4); ctx.restore(); }
  }
  ctx.restore();
}

function drawBossWarning(warning) {
  const charge = warning.detonated ? 1 : Math.max(0, 1 - warning.delay / warning.maxDelay);
  const pulse = .55 + Math.sin(ambienceTime * 24) * .22;
  ctx.save(); ctx.translate(warning.x, warning.y);
  const dangerGradient = ctx.createRadialGradient(0, 0, 3, 0, 0, warning.radius);
  dangerGradient.addColorStop(0, colorAlpha(warning.color, warning.detonated ? .5 : .08 + charge * .24));
  dangerGradient.addColorStop(.72, colorAlpha(warning.color, warning.detonated ? .26 : .05 + charge * .14));
  dangerGradient.addColorStop(1, colorAlpha(warning.color, warning.detonated ? .08 : .01));
  ctx.fillStyle = dangerGradient;
  ctx.beginPath(); ctx.arc(0, 0, warning.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = colorAlpha(warning.color, warning.detonated ? .95 : pulse + charge * .2);
  ctx.shadowColor = warning.color; ctx.shadowBlur = 8 + charge * 16;
  ctx.lineWidth = warning.detonated ? 9 : 4; ctx.setLineDash(warning.detonated ? [] : [12, 8]);
  ctx.beginPath(); ctx.arc(0, 0, warning.radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  if (!warning.detonated) {
    ctx.strokeStyle = colorAlpha("#ffffff", .65 + charge * .25); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, warning.radius * (.82 - charge * .68), 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i += 1) {
      const angle = i / 12 * Math.PI * 2 + ambienceTime * .35;
      ctx.save(); ctx.rotate(angle); ctx.translate(warning.radius + 7, 0);
      ctx.fillStyle = colorAlpha(warning.color, .72 + charge * .25);
      ctx.beginPath(); ctx.moveTo(-7, -5); ctx.lineTo(3, 0); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.shadowBlur = 0; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(7,8,12,.82)"; ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colorAlpha(warning.color, .88); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.font = "900 18px system-ui"; ctx.fillText(Math.max(0, warning.delay).toFixed(1), 0, -7);
    ctx.fillStyle = warning.color; ctx.font = "900 10px system-ui"; ctx.fillText(warning.impactName, 0, 11);
    ctx.fillStyle = "rgba(255,255,255,.94)"; ctx.font = "800 10px system-ui";
    ctx.fillText(`命中 -${warning.damage} · 重创减速`, 0, warning.radius * .58);
  }
  ctx.restore();
}

function drawEnemyProjectile(projectile) {
  ctx.save(); ctx.translate(projectile.x, projectile.y); ctx.rotate(projectile.angle);
  ctx.shadowColor = projectile.color; ctx.shadowBlur = 15; ctx.strokeStyle = projectile.color; ctx.fillStyle = projectile.color;
  if (projectile.style === "arrow") {
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(16, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(11, -7); ctx.lineTo(11, 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = colorAlpha("#ffffff", .84); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-21, 0); ctx.lineTo(-29, -7); ctx.moveTo(-21, 0); ctx.lineTo(-29, 7); ctx.stroke();
  } else if (projectile.style === "talisman") {
    ctx.fillStyle = "#f0d391"; ctx.fillRect(-10, -5, 20, 10); ctx.fillStyle = "#b43c38";
    ctx.fillRect(-5, -3, 2, 6); ctx.fillRect(0, -4, 2, 8); ctx.fillRect(5, -2, 2, 5);
  } else {
    ctx.strokeStyle = colorAlpha(projectile.color, .9); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(12, 0); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(15, 0); ctx.stroke();
  }
  ctx.restore();
}

function drawXpDrop(drop) {
  const bob = Math.sin(ambienceTime * 4.8 + drop.seed) * 3;
  const pulse = 1 + Math.sin(ambienceTime * 7 + drop.seed) * .12;
  ctx.save(); ctx.translate(drop.x, drop.y + bob); ctx.scale(pulse, pulse);
  ctx.shadowColor = drop.color; ctx.shadowBlur = 13;
  ctx.fillStyle = colorAlpha(drop.color, .22); ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = drop.color;
  if (game.scene.id === "cultivation") {
    ctx.rotate(Math.PI / 4); rr(-5, -5, 10, 10, 2); ctx.fill(); ctx.fillStyle = "#fff8cf"; rr(-2, -2, 4, 4, 1); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, -2); ctx.lineTo(4, 8); ctx.lineTo(-4, 8); ctx.lineTo(-7, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.beginPath(); ctx.arc(-2, -3, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawMedkit(kit) {
  const bob = Math.sin(kit.pulse) * 3;
  const glow = .72 + Math.sin(kit.pulse * 1.6) * .18;
  ctx.save(); ctx.translate(kit.x, kit.y + bob);
  ctx.shadowColor = "#70ff9f"; ctx.shadowBlur = 15;
  ctx.fillStyle = `rgba(75,255,135,${.15 * glow})`; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#eafff0"; rr(-11,-9,22,18,4); ctx.fill();
  ctx.fillStyle = "#43dc78"; ctx.fillRect(-2.5,-7,5,14); ctx.fillRect(-8,-2.5,16,5);
  ctx.strokeStyle = "rgba(93,255,145,.9)";ctx.lineWidth=2;rr(-11,-9,22,18,4);ctx.stroke();
  ctx.restore();
}

function drawDivineDelivery() {
  const delivery = game.divineDelivery;
  if (!delivery || delivery.collected) return;
  const player = game.player;
  const definition = divineGearDefinitions[player.combatClass.id];
  const flight = Math.min(1, delivery.time / 2.3);
  const droneX = player.x - 290 + flight * 430;
  const droneY = player.y - 172 - Math.sin(flight * Math.PI) * 35;
  ctx.save(); ctx.translate(droneX, droneY);
  ctx.shadowColor = "#8fe8ff"; ctx.shadowBlur = 16;
  ctx.strokeStyle = "rgba(148,234,255,.88)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-55, 3); ctx.moveTo(28, 0); ctx.lineTo(55, 3); ctx.stroke();
  for (const x of [-57, 57]) {
    ctx.save(); ctx.translate(x, 3); ctx.rotate(ambienceTime * 18 * Math.sign(x));
    ctx.strokeStyle = "rgba(223,251,255,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke(); ctx.restore();
  }
  const body = ctx.createLinearGradient(-25, -12, 28, 13); body.addColorStop(0, "#dff8ff"); body.addColorStop(.42, "#508fac"); body.addColorStop(1, "#172d40");
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-31, -5); ctx.lineTo(-9, -16); ctx.lineTo(26, -10); ctx.lineTo(36, 2); ctx.lineTo(19, 13); ctx.lineTo(-24, 11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffe16f"; ctx.beginPath(); ctx.arc(7, -1, 5 + Math.sin(ambienceTime * 8), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(143,232,255,.45)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-38, 9); ctx.lineTo(-96, 19); ctx.stroke();
  if (!delivery.dropped && delivery.time > 1.05) {
    ctx.strokeStyle = "rgba(255,224,113,.68)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(0, 75); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();

  if (!delivery.dropped) return;
  const pulse = 1 + Math.sin(ambienceTime * 7) * .07;
  ctx.save(); ctx.translate(delivery.dropX, delivery.dropY); ctx.scale(pulse, pulse);
  ctx.fillStyle = "rgba(255,215,92,.12)"; ctx.beginPath(); ctx.arc(0, 0, 39, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,226,126,.76)"; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.shadowColor = "#ffd65b"; ctx.shadowBlur = 18;
  const crate = ctx.createLinearGradient(-18, -15, 20, 16); crate.addColorStop(0, "#fff2ac"); crate.addColorStop(.38, "#c78926"); crate.addColorStop(1, "#4b2c13");
  ctx.fillStyle = crate; rr(-22, -16, 44, 32, 7); ctx.fill();
  ctx.strokeStyle = "#fff0a5"; ctx.lineWidth = 2; rr(-22, -16, 44, 32, 7); ctx.stroke();
  ctx.fillStyle = "#241609"; ctx.font = "900 17px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(definition.icon, 0, 1);
  ctx.shadowBlur = 0; ctx.fillStyle = "rgba(5,8,12,.82)"; rr(-54, 24, 108, 19, 8); ctx.fill();
  ctx.fillStyle = "#ffe995"; ctx.font = "900 9px system-ui"; ctx.fillText("靠近拾取 · 限时神装", 0, 34);
  ctx.restore();
}

function drawGroundMark(mark) {
  const alpha = Math.max(0, mark.life / mark.maxLife) * .34;
  ctx.save(); ctx.translate(mark.x, mark.y); ctx.rotate(mark.angle + Math.PI / 2); ctx.globalAlpha = alpha;
  if (game.scene.id === "snow") {
    ctx.fillStyle = "rgba(57,98,117,.72)"; ctx.beginPath(); ctx.ellipse(0, 0, 4, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(236,251,255,.45)"; ctx.beginPath(); ctx.ellipse(0, -2, 2, 5, 0, 0, Math.PI * 2); ctx.fill();
  } else if (game.scene.id === "mars" || game.scene.id === "moon") {
    ctx.strokeStyle = game.scene.id === "mars" ? "#6f2d20" : "#343445"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 5, 9, 0, 0, Math.PI * 2); ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(10,14,16,.78)"; ctx.beginPath(); ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawLightning(lightning) {
  const alpha = Math.max(0, lightning.life / lightning.maxLife);
  ctx.save(); ctx.strokeStyle = colorAlpha("#efffb6", alpha); ctx.lineWidth = 4.5 + alpha * 4; ctx.shadowColor = "#d6ff81"; ctx.shadowBlur = 24;
  const points = [{ x: lightning.x - 18, y: lightning.y - 430 }];
  for (let i = 1; i <= 9; i += 1) points.push({ x: lightning.x + (i === 9 ? 0 : Math.sin(lightning.seed * 1.7 + i * 9.31) * 22), y: lightning.y - 430 + i / 9 * 430 });
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y); ctx.stroke();
  ctx.strokeStyle = colorAlpha("#ffffff", alpha * .9); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y); ctx.stroke();
  for (let i = 3; i < points.length - 1; i += 2) { const point = points[i]; ctx.strokeStyle = colorAlpha("#c8ff91", alpha * .7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(point.x + Math.sin(lightning.seed + i) * 38, point.y + 28); ctx.stroke(); }
  ctx.fillStyle = colorAlpha("#efffb6", alpha * .3); ctx.beginPath(); ctx.arc(lightning.x, lightning.y, 34 + (1 - alpha) * 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawTargetLock() {
  const target = game.enemies.find((enemy) => enemy.id === game.player.targetId && !enemy.dead);
  if (!target) return;
  ctx.save();
  ctx.strokeStyle = colorAlpha(game.player.weapon.color, .32);
  ctx.setLineDash([4, 7]);
  ctx.beginPath(); ctx.moveTo(game.player.x, game.player.y); ctx.lineTo(target.x, target.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = colorAlpha(game.player.weapon.color, .75);
  ctx.beginPath(); ctx.arc(target.x, target.y, target.size + 7 + Math.sin(ambienceTime * 7) * 2, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawWorldDecor() {
  const scene = game.scene;
  const zoom = game.camera?.zoom || 1;
  const left = game.player.x - W / (2 * zoom) - 90;
  const right = game.player.x + W / (2 * zoom) + 90;
  const top = game.player.y - H / (2 * zoom) - 90;
  const bottom = game.player.y + H / (2 * zoom) + 90;
  const texture = battlefieldTextures[scene.id];
  if (texture?.complete && texture.naturalWidth) {
    drawWorldTexture(texture, left, right, top, bottom, scene.id);
    if (scene.id === "cultivation") drawCultivationDomainDecor(left, right, top, bottom);
    return;
  }
  ctx.save();
  ctx.strokeStyle = colorAlpha(scene.colors.grid, .1);
  ctx.lineWidth = 1;
  if (scene.id === "city") {
    const road = 240;
    for (let x = Math.floor(left / road) * road; x < right; x += road) {
      ctx.fillStyle = "rgba(5,10,8,.16)"; ctx.fillRect(x - 34, top, 68, bottom - top);
      ctx.setLineDash([18, 22]); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); ctx.setLineDash([]);
    }
    for (let y = Math.floor(top / 170) * 170; y < bottom; y += 170) {
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
    }
  } else if (scene.id === "snow") {
    for (let y = Math.floor(top / 72) * 72; y < bottom; y += 72) {
      ctx.beginPath();
      for (let x = left - 30; x <= right + 30; x += 24) {
        const yy = y + Math.sin(x * .018 + y * .007) * 10;
        if (x === left - 30) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  } else if (scene.id === "hospital") {
    const arenaSize = 980;
    if (hospitalBattlefield.complete && hospitalBattlefield.naturalWidth) {
      ctx.save(); ctx.globalAlpha = .86;
      const startX = Math.floor((left + arenaSize / 2) / arenaSize);
      const endX = Math.floor((right + arenaSize / 2) / arenaSize);
      const startY = Math.floor((top + arenaSize / 2) / arenaSize);
      const endY = Math.floor((bottom + arenaSize / 2) / arenaSize);
      for (let gx = startX; gx <= endX; gx += 1) {
        for (let gy = startY; gy <= endY; gy += 1) {
          const x = gx * arenaSize - arenaSize / 2;
          const y = gy * arenaSize - arenaSize / 2;
          ctx.save(); ctx.translate(x + arenaSize / 2, y + arenaSize / 2); ctx.scale(gx % 2 ? -1 : 1, gy % 2 ? -1 : 1);
          ctx.drawImage(hospitalBattlefield, -arenaSize / 2, -arenaSize / 2, arenaSize, arenaSize); ctx.restore();
        }
      }
      ctx.restore();
    }
    const tile = 68;
    for (let gx = Math.floor(left / tile); gx <= Math.ceil(right / tile); gx += 1) {
      for (let gy = Math.floor(top / tile); gy <= Math.ceil(bottom / tile); gy += 1) {
        ctx.fillStyle = (gx + gy) % 2 ? "rgba(210,244,235,.018)" : "rgba(13,57,47,.025)";
        ctx.fillRect(gx * tile + 1, gy * tile + 1, tile - 2, tile - 2);
      }
    }
    ctx.strokeStyle = colorAlpha("#9aead5", .055);
    for (let x = Math.floor(left / tile) * tile; x < right; x += tile) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); }
    for (let y = Math.floor(top / tile) * tile; y < bottom; y += tile) { ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); }
    const corridor = 272;
    for (let y = Math.floor(top / corridor) * corridor; y < bottom; y += corridor) {
      ctx.fillStyle = "rgba(230,255,248,.018)"; ctx.fillRect(left, y - 34, right - left, 68);
      ctx.strokeStyle = "rgba(255,196,92,.12)"; ctx.lineWidth = 3; ctx.setLineDash([18, 12]);
      ctx.beginPath(); ctx.moveTo(left, y - 30); ctx.lineTo(right, y - 30); ctx.moveTo(left, y + 30); ctx.lineTo(right, y + 30); ctx.stroke(); ctx.setLineDash([]);
    }
  } else if (scene.id === "orbit") {
    const cell = 104;
    for (let gx = Math.floor(left / cell); gx < Math.ceil(right / cell); gx += 1) for (let gy = Math.floor(top / cell); gy < Math.ceil(bottom / cell); gy += 1) {
      const x = gx * cell; const y = gy * cell;
      ctx.beginPath(); ctx.moveTo(x - 34, y); ctx.lineTo(x - 17, y - 29); ctx.lineTo(x + 17, y - 29); ctx.lineTo(x + 34, y); ctx.lineTo(x + 17, y + 29); ctx.lineTo(x - 17, y + 29); ctx.closePath(); ctx.stroke();
    }
  } else if (scene.id === "mars") {
    ctx.strokeStyle = colorAlpha("#df8d5d", .13);
    for (let y = Math.floor(top / 94) * 94; y < bottom; y += 94) {
      ctx.beginPath(); ctx.moveTo(left, y);
      for (let x = left; x <= right; x += 28) ctx.quadraticCurveTo(x + 14, y + Math.sin((x + y) * .013) * 16, x + 28, y);
      ctx.stroke();
    }
  } else if (scene.id === "moon") {
    for (let x = Math.floor(left / 160) * 160; x < right; x += 160) for (let y = Math.floor(top / 150) * 150; y < bottom; y += 150) {
      const seed = Math.abs(Math.sin(x * 1.7 + y * 2.3));
      ctx.beginPath(); ctx.ellipse(x + seed * 40, y + seed * 30, 15 + seed * 18, 7 + seed * 8, seed, 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    ctx.strokeStyle = colorAlpha("#9fe7bd", .13);
    for (let y = Math.floor(top / 92) * 92; y < bottom; y += 92) {
      ctx.beginPath();
      for (let x = left - 40; x <= right + 40; x += 32) { const yy = y + Math.sin(x * .012 + ambienceTime * .45) * 15; if (x === left - 40) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
    }
  }
  ctx.restore();

  const cell = scene.id === "hospital" ? 154 : 190;
  for (let gx = Math.floor(left / cell); gx <= Math.ceil(right / cell); gx += 1) {
    for (let gy = Math.floor(top / cell); gy <= Math.ceil(bottom / cell); gy += 1) {
      const hash = Math.abs(Math.sin(gx * 91.73 + gy * 47.19));
      if (hash < (scene.id === "hospital" ? .3 : .46)) continue;
      const x = gx * cell + hash * 74;
      const y = gy * cell + Math.abs(Math.cos(gx * 33.1 - gy * 61.7)) * 68;
      drawSceneProp(scene.id, x, y, hash, gx, gy);
    }
  }
}

function drawWorldTexture(texture, left, right, top, bottom, sceneId) {
  const arenaSize = sceneId === "cultivation" ? 1080 : 980;
  const startX = Math.floor((left + arenaSize / 2) / arenaSize);
  const endX = Math.floor((right + arenaSize / 2) / arenaSize);
  const startY = Math.floor((top + arenaSize / 2) / arenaSize);
  const endY = Math.floor((bottom + arenaSize / 2) / arenaSize);
  ctx.save();
  ctx.globalAlpha = sceneId === "snow" || sceneId === "moon" ? .9 : .94;
  for (let gx = startX; gx <= endX; gx += 1) {
    for (let gy = startY; gy <= endY; gy += 1) {
      const x = gx * arenaSize - arenaSize / 2;
      const y = gy * arenaSize - arenaSize / 2;
      ctx.save();
      ctx.translate(x + arenaSize / 2, y + arenaSize / 2);
      ctx.scale(gx % 2 ? -1 : 1, gy % 2 ? -1 : 1);
      ctx.drawImage(texture, -arenaSize / 2, -arenaSize / 2, arenaSize, arenaSize);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawCultivationDomainDecor(left, right, top, bottom) {
  const domain = cultivationDomains[game.world.domainIndex] || cultivationDomains[0];
  ctx.save();
  const veil = ctx.createRadialGradient(game.player.x, game.player.y, 30, game.player.x, game.player.y, 480);
  veil.addColorStop(0, colorAlpha(domain.accent, .035)); veil.addColorStop(1, colorAlpha(domain.accent, .14));
  ctx.fillStyle = veil; ctx.fillRect(left, top, right - left, bottom - top);
  const spacing = 230;
  for (let gx = Math.floor(left / spacing); gx <= Math.ceil(right / spacing); gx += 1) {
    for (let gy = Math.floor(top / spacing); gy <= Math.ceil(bottom / spacing); gy += 1) {
      if ((Math.abs(gx * 7 + gy * 11) % 4) !== 0) continue;
      const x = gx * spacing + ((gy * 37) % 61), y = gy * spacing + ((gx * 29) % 53);
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = .34;
      if (domain.motif === "gate" || domain.motif === "hall") {
        ctx.fillStyle = colorAlpha(domain.accent, .45); ctx.fillRect(-22, -5, 44, 6); ctx.fillRect(-18, -38, 5, 39); ctx.fillRect(13, -38, 5, 39);
        ctx.strokeStyle = colorAlpha("#fff0ba", .5); ctx.beginPath(); ctx.moveTo(-29,-39);ctx.lineTo(0,-52);ctx.lineTo(29,-39);ctx.stroke();
      } else if (domain.motif === "swords") {
        ctx.fillStyle = domain.accent; for(let i=-1;i<=1;i+=1){ctx.save();ctx.translate(i*14,0);ctx.rotate(i*.16);ctx.fillRect(-1.5,-28,3,44);ctx.fillRect(-8,8,16,3);ctx.restore();}
      } else if (domain.motif === "wild") {
        ctx.strokeStyle = colorAlpha(domain.accent,.65);ctx.lineWidth=5;for(let i=0;i<4;i+=1){ctx.beginPath();ctx.moveTo(-22+i*14,17);ctx.quadraticCurveTo(-30+i*17,-9,-15+i*15,-28-i*4);ctx.stroke();}
      } else if (domain.motif === "stars") {
        ctx.fillStyle=domain.accent;for(let i=0;i<7;i+=1){const a=i/7*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(a)*31,Math.sin(a)*18,2+i%2,0,Math.PI*2);ctx.fill();}
      } else {
        ctx.strokeStyle=colorAlpha(domain.accent,.65);ctx.lineWidth=2;for(let i=-2;i<=2;i+=1){ctx.beginPath();ctx.moveTo(i*13-7,-42);ctx.lineTo(i*13+8,-12);ctx.lineTo(i*13,18);ctx.stroke();}
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawSceneProp(sceneId, x, y, hash, gx, gy) {
  const variant = Math.floor(hash * 10) % 3;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((hash - .5) * .34);
  ctx.globalAlpha = .58;
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.beginPath(); ctx.ellipse(2, 12, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
  if (sceneId === "city") {
    if (variant === 0) {
      ctx.fillStyle = "#af6b35"; rr(-27, -10, 54, 18, 3); ctx.fill();
      ctx.fillStyle = "#f0d16d"; for (let stripe = -20; stripe < 22; stripe += 15) { ctx.save(); ctx.translate(stripe, -1); ctx.rotate(-.55); ctx.fillRect(-3, -9, 6, 18); ctx.restore(); }
      ctx.fillStyle = "#443229"; ctx.fillRect(-21, 8, 5, 11); ctx.fillRect(16, 8, 5, 11);
    } else {
      ctx.fillStyle = "#283b32"; rr(-18, -14, 36, 27, 4); ctx.fill(); ctx.strokeStyle = "#748879"; ctx.strokeRect(-12, -9, 24, 16);
      ctx.fillStyle = "rgba(204,255,132,.35)"; ctx.fillRect(-8, -5, 16, 3);
    }
  } else if (sceneId === "snow") {
    if (variant === 0) {
      ctx.fillStyle = "#edf9fb"; ctx.beginPath(); ctx.moveTo(-25, 13); ctx.lineTo(-5, -23); ctx.lineTo(8, -2); ctx.lineTo(20, -17); ctx.lineTo(28, 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(112,181,202,.28)"; ctx.beginPath(); ctx.moveTo(-5, -23); ctx.lineTo(8, -2); ctx.lineTo(0, 13); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = "#315e6f"; rr(-20, -11, 40, 23, 3); ctx.fill(); ctx.strokeStyle = "#d6f4f8"; ctx.strokeRect(-15, -7, 30, 15); ctx.fillStyle = "#f1d77a"; ctx.fillRect(-2, -11, 4, 23);
    }
  } else if (sceneId === "hospital") {
    if (variant === 0) {
      ctx.fillStyle = "#dce9e5"; rr(-32, -11, 64, 22, 5); ctx.fill();
      ctx.strokeStyle = "#8db7ad"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#4cc8a1"; ctx.fillRect(-26, -7, 52, 5);
      ctx.fillStyle = "#516b66"; for (const wheel of [-22, 22]) { ctx.beginPath(); ctx.arc(wheel, 14, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = "#a8d8cc"; ctx.beginPath(); ctx.moveTo(-25, 10); ctx.lineTo(-25, 15); ctx.moveTo(25, 10); ctx.lineTo(25, 15); ctx.stroke();
    } else if (variant === 1) {
      ctx.strokeStyle = "#a6c7c0"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(0, 15); ctx.moveTo(-11, -31); ctx.lineTo(11, -31); ctx.stroke();
      ctx.fillStyle = "rgba(111,238,202,.55)"; rr(-9, -26, 18, 22, 5); ctx.fill();
      ctx.strokeStyle = "rgba(198,255,239,.8)"; ctx.stroke(); ctx.fillStyle = "#dffff7"; ctx.fillRect(-1.5, -21, 3, 11); ctx.fillRect(-5, -17, 10, 3);
      ctx.fillStyle = "#607873"; ctx.beginPath(); ctx.arc(0, 17, 5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = "rgba(255,181,82,.18)"; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,196,96,.72)"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(255,209,122,.8)"; ctx.font = "900 19px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("☣", 0, 1);
    }
  } else if (sceneId === "orbit") {
    ctx.fillStyle = variant === 0 ? "#343c67" : "#252c4d"; rr(-28, -12, 56, 24, 4); ctx.fill();
    ctx.strokeStyle = "rgba(146,179,255,.65)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "rgba(97,229,255,.65)"; for (let lamp = -18; lamp <= 18; lamp += 12) ctx.fillRect(lamp, -2, 6, 4);
    if (variant === 2) { ctx.strokeStyle = "rgba(255,186,75,.65)"; ctx.beginPath(); ctx.moveTo(-23, 8); ctx.lineTo(23, -8); ctx.stroke(); }
  } else if (sceneId === "mars") {
    ctx.fillStyle = "#7a412e"; ctx.beginPath(); ctx.ellipse(0, 2, 28, 13, .15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#b76a43"; ctx.beginPath(); ctx.ellipse(-6, -2, 12, 6, -.2, 0, Math.PI * 2); ctx.fill();
  } else if (sceneId === "moon") {
    if (variant === 0) {
      ctx.fillStyle = "rgba(183,190,215,.26)"; ctx.beginPath(); ctx.ellipse(0, 3, 29, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(221,228,248,.45)"; ctx.beginPath(); ctx.ellipse(0, 0, 24, 9, 0, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.strokeStyle = "#aeb8d0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(0, -25); ctx.lineTo(17, -12); ctx.stroke();
      ctx.fillStyle = "rgba(124,161,221,.55)"; ctx.beginPath(); ctx.moveTo(2, -25); ctx.lineTo(21, -19); ctx.lineTo(2, -11); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#aeb8d0"; ctx.beginPath(); ctx.arc(0, 18, 5, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    ctx.strokeStyle = "#92d5ad"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,18); ctx.quadraticCurveTo(-15,-2,0,-24); ctx.quadraticCurveTo(15,-2,0,18); ctx.stroke();
  }
  ctx.restore();
}

function drawCorpse(corpse) {
  const fade = Math.min(1, corpse.life / 1.35);
  const dissolve = 1 - corpse.life / corpse.maxLife;
  const s = corpse.size;
  ctx.save();
  ctx.globalAlpha = fade * .86;
  ctx.translate(corpse.x, corpse.y + s * .65);
  ctx.rotate(corpse.rotation);

  if (corpse.sceneId === "city" || corpse.sceneId === "snow") {
    const flesh = corpse.sceneId === "snow" ? "#6e91a0" : "#763c36";
    ctx.fillStyle = "rgba(80,16,15,.38)";
    ctx.beginPath(); ctx.ellipse(0, 3, s * 1.15, s * .34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flesh;
    ctx.beginPath(); ctx.ellipse(-s * .28, -2, s * .56, s * .28, -.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * .54, -2, s * .24, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(flesh, 24); ctx.lineWidth = Math.max(2, s * .13); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-s * .55, -2); ctx.lineTo(-s * .95, -s * .18); ctx.moveTo(s * .05, 2); ctx.lineTo(s * .45, s * .28); ctx.stroke();
  } else if (corpse.sceneId === "hospital") {
    ctx.fillStyle = colorAlpha(corpse.color, .48);
    ctx.beginPath(); ctx.ellipse(0, 2, s * 1.05, s * .42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colorAlpha(game.scene.colors.shot, .38); ctx.lineWidth = 1.4;
    for (let i = 0; i < 7; i += 1) { const a = i / 7 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * .45, Math.sin(a) * s * .15); ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s * .38); ctx.stroke(); }
  } else if (["orbit", "moon"].includes(corpse.sceneId)) {
    ctx.fillStyle = shade(corpse.color, -28);
    ctx.beginPath(); ctx.moveTo(-s, s * .18); ctx.lineTo(-s * .25, -s * .35); ctx.lineTo(s * .15, 0); ctx.lineTo(s * .82, -s * .18); ctx.lineTo(s * .42, s * .35); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ff9a55"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * .18, -s * .1); ctx.lineTo(s * .08, s * .15); ctx.stroke();
  } else if (corpse.sceneId === "cultivation") {
    ctx.strokeStyle = colorAlpha(corpse.color, .72); ctx.lineWidth = Math.max(2, s * .12);
    ctx.beginPath(); ctx.arc(0, 0, s * (.8 - dissolve * .3), Math.PI * .08, Math.PI * .92); ctx.stroke();
    ctx.fillStyle = colorAlpha(game.scene.colors.shot, .38); ctx.beginPath(); ctx.ellipse(0, 4, s, s * .24, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = colorAlpha(corpse.color, .55); ctx.beginPath(); ctx.ellipse(0, 2, s, s * .34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(corpse.color, -30); ctx.fillRect(-s * .7, -s * .12, s * .5, s * .24); ctx.fillRect(s * .12, -s * .2, s * .62, s * .28);
  }

  for (let i = 0; i < 8; i += 1) {
    const a = corpse.seed + i * 2.17;
    const distance = s * (.25 + dissolve * (1.1 + (i % 3) * .25));
    ctx.globalAlpha = fade * (1 - i / 11);
    ctx.fillStyle = corpse.sceneId === "city" ? "#984943" : corpse.color;
    ctx.beginPath(); ctx.arc(Math.cos(a) * distance, Math.sin(a) * distance - dissolve * s * .6, Math.max(1, s * .045), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(enemy) {
  const s = enemy.size;
  const frozen = enemy.slowTimer > 0;
  ctx.save();
  const kick = enemy.hitKick || 0;
  const kickAngle = enemy.hitAngle || 0;
  ctx.translate(enemy.x + Math.cos(kickAngle) * kick, enemy.y + Math.sin(kickAngle) * kick);
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.92, s * 0.88, s * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(Math.sin(game.elapsed * 5 + enemy.sway) * (enemy.type === "runner" ? 0.12 : 0.06));
  if (kick > 0) ctx.transform(1 - Math.min(.14, kick * .009), 0, 0, 1 + Math.min(.11, kick * .007), 0, 0);
  if (game.scene.id === "cultivation") drawCultivationEnemy(enemy, s, frozen);
  else if (game.scene.id === "city" && cityZombieAtlas.complete && cityZombieAtlas.naturalWidth) drawCityZombieEnemy(enemy, s, frozen);
  else if (enemyAtlas.complete && enemyAtlas.naturalWidth) drawAtlasEnemy(enemy, s, frozen);
  else {
    if (game.scene.id === "city" || game.scene.id === "snow") drawHumanoidEnemy(enemy, s, frozen, game.scene.id === "snow");
    if (game.scene.id === "hospital") drawPathogenEnemy(enemy, s, frozen);
    if (game.scene.id === "orbit") drawVoidEnemy(enemy, s, frozen);
    if (game.scene.id === "mars") drawMartianEnemy(enemy, s, frozen);
    if (game.scene.id === "moon") drawLunarEnemy(enemy, s, frozen);
  }
  if (enemy.type === "ranged" || enemy.type === "caster") drawEnemyWeaponRole(enemy, s);

  if (frozen) {
    ctx.strokeStyle = "rgba(151,235,255,.72)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, s * 1.02, 0, Math.PI * 2); ctx.stroke();
  }
  if (enemy.shield > 0 && game.scene.id !== "cultivation") {
    ctx.strokeStyle = "rgba(112,217,255,.72)";
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(0, 0, s * 1.16, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();

  if ((enemy.type === "tank" || enemy.type === "boss") && enemy.hp < enemy.maxHp) {
    const width = s * 1.65;
    const barY = game.scene.endless ? enemy.y - s * (enemy.type === "boss" ? 2.15 : 2.62) : enemy.y - s * 1.48;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(enemy.x - width / 2, barY, width, 4);
    ctx.fillStyle = enemy.type === "boss" ? "#ff5e52" : "#c6f476";
    ctx.fillRect(enemy.x - width / 2, barY, width * Math.max(0, enemy.hp / enemy.maxHp), 4);
  }
  if (game.scene.endless) {
    ctx.fillStyle = enemy.realm > game.player.level + 2 ? "#ff9c7d" : "rgba(226,255,221,.72)";
    ctx.font = "700 7px system-ui"; ctx.textAlign = "center";
    ctx.fillText(getRealmName(enemy.realm), enemy.x, enemy.y - s * (enemy.type === "boss" ? 2.26 : 2.76));
  }
}

function drawCityZombieEnemy(enemy, s, frozen) {
  const variants = { grunt: 0, shield: 1, runner: 2, mini: 2, tank: 3, splitter: 3, ranged: 4, caster: 4, boss: 5 };
  const variant = variants[enemy.type] ?? 0;
  const sourceWidth = cityZombieAtlas.naturalWidth / 6;
  const stride = Math.sin(game.elapsed * (enemy.type === "runner" ? 13 : 7) + enemy.sway);
  const scale = enemy.type === "boss" ? 1.08 : enemy.type === "tank" ? 1.03 : enemy.type === "mini" ? .72 : 1;
  const width = s * 2.42 * scale;
  const height = s * 3.28 * scale;
  ctx.save();
  ctx.translate(stride * s * .075, -Math.abs(stride) * s * .055);
  ctx.rotate(stride * (enemy.type === "runner" ? .075 : .025));
  if (frozen) ctx.filter = "saturate(.45) hue-rotate(145deg) brightness(1.18)";
  if (enemy.flash > 0) ctx.filter = "brightness(2.25) saturate(.22)";
  ctx.drawImage(cityZombieAtlas, sourceWidth * variant, 0, sourceWidth, cityZombieAtlas.naturalHeight, -width / 2, -height * .73, width, height);
  ctx.filter = "none";
  if (enemy.type === "runner") {
    ctx.strokeStyle = "rgba(180,235,220,.46)"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(-width * .3 - i * 7, height * .13 + i * 4); ctx.lineTo(-width * .56 - i * 10, height * .15 + i * 4); ctx.stroke(); }
  }
  if (enemy.type === "boss") {
    const aura = ctx.createRadialGradient(0, 0, s * .35, 0, 0, s * 1.55);
    aura.addColorStop(0, "rgba(255,74,46,0)"); aura.addColorStop(1, "rgba(255,74,46,.28)");
    ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, s * 1.55, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawAtlasEnemy(enemy, s, frozen) {
  const sceneIndex = Math.max(0, Math.min(5, game.sceneIndex));
  const sourceWidth = enemyAtlas.naturalWidth / 6;
  const scale = enemy.type === "runner" ? .88 : enemy.type === "tank" ? 1.14 : enemy.type === "boss" ? 1.06 : 1;
  const width = s * 2.35 * scale;
  const height = s * 3.05 * scale;
  const stride = Math.sin(game.elapsed * (enemy.type === "runner" ? 13 : 7) + enemy.sway) * s * .08;
  ctx.save();
  const grounded = !["hospital", "orbit"].includes(game.scene.id);
  ctx.translate(grounded ? stride * .55 : 0, grounded ? Math.abs(stride) * -.08 : stride * .55);
  if (grounded) ctx.rotate(stride * (enemy.type === "runner" ? .006 : .003));
  if (frozen) ctx.filter = "saturate(.5) hue-rotate(145deg) brightness(1.2)";
  if (enemy.flash > 0) ctx.filter = "brightness(2.2) saturate(.2)";
  ctx.drawImage(enemyAtlas, sourceWidth * sceneIndex, 0, sourceWidth, enemyAtlas.naturalHeight, -width / 2, -height * .69, width, height);
  ctx.filter = "none";
  if (enemy.type === "splitter") {
    ctx.fillStyle = colorAlpha(enemy.color, .7);
    for (const a of [0, 2.1, 4.2]) { ctx.beginPath(); ctx.arc(Math.cos(a) * s * .72, Math.sin(a) * s * .52, s * .13, 0, Math.PI * 2); ctx.fill(); }
  }
  if (enemy.type === "runner") {
    ctx.strokeStyle = colorAlpha(game.scene.colors.shot, .5); ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(-width * .25 - i * 8, height * .12 + i * 4); ctx.lineTo(-width * .52 - i * 12, height * .15 + i * 4); ctx.stroke(); }
  }
  if (enemy.type === "tank") {
    ctx.strokeStyle = colorAlpha("#ffffff", .36); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -height * .18, width * .42, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  }
  if (enemy.type === "boss") {
    const bossAura = ctx.createRadialGradient(0, 0, s * .35, 0, 0, s * 1.45);
    bossAura.addColorStop(0, "rgba(255,75,50,0)"); bossAura.addColorStop(1, "rgba(255,75,50,.24)");
    ctx.fillStyle = bossAura; ctx.beginPath(); ctx.arc(0, 0, s * 1.45, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawCultivationEnemy(enemy, s, frozen) {
  const variants = { grunt: 0, runner: 1, mini: 1, tank: 2, splitter: 3, ranged: 4, caster: 4, boss: 5 };
  const variant = variants[enemy.type] ?? 4;
  const sourceWidth = cultivatorEnemyAtlas.naturalWidth / 6;
  const stride = Math.sin(game.elapsed * (enemy.type === "runner" ? 12 : 7) + enemy.sway);
  const scale = enemy.type === "boss" ? .92 : enemy.type === "tank" ? 1.04 : enemy.type === "mini" ? .78 : 1;
  const width = s * 2.15 * scale;
  const height = s * 3.55 * scale;
  ctx.save();
  ctx.translate(stride * s * .06, -Math.abs(stride) * s * .08);
  ctx.rotate(stride * (enemy.type === "runner" ? .08 : .035));
  const aura = ctx.createRadialGradient(0, -s * .25, s * .2, 0, -s * .25, s * 1.45);
  aura.addColorStop(0, colorAlpha(enemy.color, .18)); aura.addColorStop(1, colorAlpha(enemy.color, 0));
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, -s * .2, s * 1.45, 0, Math.PI * 2); ctx.fill();
  if (cultivatorEnemyAtlas.complete && cultivatorEnemyAtlas.naturalWidth) {
    if (frozen) ctx.filter = "saturate(.45) hue-rotate(125deg) brightness(1.15)";
    if (enemy.flash > 0) ctx.filter = "brightness(2.25) saturate(.25)";
    ctx.drawImage(cultivatorEnemyAtlas, sourceWidth * variant, 0, sourceWidth, cultivatorEnemyAtlas.naturalHeight, -width / 2, -height * .76, width, height);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = enemy.color; ctx.fillRect(-s * .35, -s * 1.4, s * .7, s * 2.1);
  }
  if (enemy.type === "runner") {
    ctx.strokeStyle = colorAlpha("#dfffea", .72); ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(-s * (1.1 + i * .22), s * (.1 + i * .14)); ctx.lineTo(-s * (.35 + i * .08), s * (.1 + i * .14)); ctx.stroke(); }
  }
  if (enemy.type === "splitter") {
    ctx.strokeStyle = colorAlpha("#ff7570", .68); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -s * .42, s * (1.05 + Math.sin(ambienceTime * 4) * .08), 0, Math.PI * 2); ctx.stroke();
  }
  if (enemy.shield > 0) {
    ctx.strokeStyle = colorAlpha("#8beac8", .82); ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.arc(0, -s * .25, s * 1.25, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  if (enemy.type === "boss") {
    ctx.save(); ctx.rotate(-ambienceTime * .38); ctx.strokeStyle = colorAlpha("#ffd889", .58); ctx.lineWidth = 3; ctx.setLineDash([15, 8]);
    ctx.beginPath(); ctx.arc(0, -s * .25, s * 1.34, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

function drawEnemyWeaponRole(enemy, s) {
  const charging = Math.min(1, (enemy.rangedFlash || 0) / .24);
  ctx.save(); ctx.rotate(Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x));
  ctx.shadowColor = game.scene.colors.hit; ctx.shadowBlur = 6 + charging * 12;
  if (enemy.type === "ranged") {
    const weaponColor = game.scene.endless ? "#d8b778" : game.scene.id === "snow" ? "#d9f7ff" : "#d3dfdf";
    ctx.strokeStyle = weaponColor; ctx.lineWidth = Math.max(1.5, s * .09);
    ctx.beginPath(); ctx.arc(s * .18, 0, s * .58, -1.08, 1.08); ctx.stroke();
    ctx.strokeStyle = colorAlpha("#ffffff", .7); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(s * .45, -s * .5); ctx.lineTo(s * (.58 + charging * .1), 0); ctx.lineTo(s * .45, s * .5); ctx.stroke();
    ctx.strokeStyle = game.scene.colors.shot; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s * .2, 0); ctx.lineTo(s * 1.03, 0); ctx.stroke();
  } else {
    ctx.strokeStyle = game.scene.endless ? "#cba96b" : "#738a96"; ctx.lineWidth = Math.max(2, s * .12);
    ctx.beginPath(); ctx.moveTo(-s * .12, 0); ctx.lineTo(s * .82, 0); ctx.stroke();
    ctx.fillStyle = game.scene.colors.hit; ctx.beginPath(); ctx.arc(s * .92, 0, s * (.14 + charging * .08), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colorAlpha("#ffffff", .78); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(s * .92, 0, s * (.25 + charging * .12), -.9, .9); ctx.stroke();
  }
  ctx.restore();
}

function drawHumanoidEnemy(enemy, s, frozen, snowVariant) {
  const body = enemy.flash > 0 ? "#ffffff" : frozen ? "#76c9dc" : enemy.color;
  const skin = enemy.flash > 0 ? "#ffffff" : frozen ? "#a5e6ee" : snowVariant ? "#a8cdd2" : shade(enemy.color, 19);
  const step = Math.sin(game.elapsed * (enemy.type === "runner" ? 10 : 6) + enemy.sway) * s * 0.17;
  ctx.lineCap = "round";

  ctx.strokeStyle = shade(enemy.color, -37);
  ctx.lineWidth = Math.max(3, s * .2);
  ctx.beginPath();
  ctx.moveTo(-s * .22, s * .48); ctx.lineTo(-s * .3 + step, s * .95);
  ctx.moveTo(s * .22, s * .48); ctx.lineTo(s * .31 - step, s * .95);
  ctx.stroke();

  ctx.strokeStyle = frozen ? "#83e8ff" : shade(enemy.color, -20);
  ctx.lineWidth = Math.max(3.2, s * .2);
  ctx.beginPath();
  ctx.moveTo(-s * .42, -s * .07); ctx.lineTo(-s * .85, s * .2 + step * .25); ctx.lineTo(-s * .72, s * .38);
  ctx.moveTo(s * .42, -s * .06); ctx.lineTo(s * .88, s * .13 - step * .25); ctx.lineTo(s * .8, s * .34);
  ctx.stroke();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-s * .47, -s * .25); ctx.quadraticCurveTo(-s * .65, s * .2, -s * .39, s * .62);
  ctx.lineTo(s * .38, s * .62); ctx.quadraticCurveTo(s * .64, s * .15, s * .45, -s * .25); ctx.closePath(); ctx.fill();

  ctx.fillStyle = snowVariant ? "rgba(235,250,255,.5)" : "rgba(25,35,29,.32)";
  ctx.fillRect(-s * .05, -s * .23, s * .1, s * .78);
  ctx.fillRect(-s * .41, s * .28, s * .8, s * .1);
  if (!snowVariant) {
    ctx.fillStyle = "rgba(143,44,42,.6)";
    ctx.beginPath(); ctx.arc(-s * .28, s * .03, s * .11, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-s * .42, -s * .9); ctx.quadraticCurveTo(0, -s * 1.13, s * .45, -s * .82);
  ctx.lineTo(s * .38, -s * .43); ctx.quadraticCurveTo(0, -s * .27, -s * .43, -s * .5); ctx.closePath(); ctx.fill();

  if (snowVariant) {
    ctx.strokeStyle = "rgba(235,252,255,.82)";
    ctx.lineWidth = s * .13;
    ctx.beginPath(); ctx.arc(0, -s * .7, s * .52, Math.PI * .95, Math.PI * 2.06); ctx.stroke();
    ctx.fillStyle = "#eaf7fa"; ctx.fillRect(-s * .5, -s * .35, s, s * .13);
  } else {
    ctx.fillStyle = shade(enemy.color, -48);
    ctx.beginPath(); ctx.moveTo(-s*.42,-s*.88); ctx.lineTo(-s*.2,-s*1.12); ctx.lineTo(0,-s*.96); ctx.lineTo(s*.2,-s*1.1); ctx.lineTo(s*.42,-s*.87); ctx.closePath(); ctx.fill();
  }

  ctx.fillStyle = enemy.type === "boss" ? "#fff16a" : "#eaff89";
  ctx.beginPath(); ctx.arc(-s * .17, -s * .72, Math.max(1.5, s * .075), 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * .18, -s * .69, Math.max(1.5, s * .075), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shade(enemy.color, -53);
  ctx.beginPath(); ctx.moveTo(-s*.2,-s*.48); ctx.lineTo(-s*.08,-s*.37); ctx.lineTo(s*.21,-s*.46); ctx.lineTo(s*.14,-s*.28); ctx.lineTo(-s*.18,-s*.31); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(238,240,208,.72)";
  for (let i = -1; i <= 1; i += 1) ctx.fillRect(i * s * .11 - 1, -s * .43, 2, s * .1);

  if (enemy.type === "tank") {
    ctx.strokeStyle = snowVariant ? "#dceef4" : "#b8aa86"; ctx.lineWidth = 3;
    ctx.strokeRect(-s * .55, -s * .24, s * 1.1, s * .78);
    ctx.fillStyle = "rgba(25,35,40,.45)"; ctx.fillRect(-s * .47, -s * .17, s * .94, s * .2);
  }
  if (enemy.type === "splitter") {
    ctx.fillStyle = colorAlpha(enemy.color, .78);
    for (const [x, y] of [[-.52,-.16],[.48,.05],[-.34,.43]]) { ctx.beginPath(); ctx.arc(x*s,y*s,s*.18,0,Math.PI*2); ctx.fill(); }
  }
  if (enemy.type === "boss") {
    ctx.fillStyle = shade(enemy.color, -30);
    ctx.beginPath();
    ctx.moveTo(-s*.33,-s*.98); ctx.lineTo(-s*.77,-s*1.48); ctx.lineTo(-s*.08,-s*1.08);
    ctx.moveTo(s*.33,-s*.98); ctx.lineTo(s*.77,-s*1.48); ctx.lineTo(s*.08,-s*1.08); ctx.fill();
    ctx.strokeStyle = colorAlpha(game.scene.colors.shot,.65); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,s*.8,0,Math.PI*2); ctx.stroke();
  }
}

function drawPathogenEnemy(enemy, s, frozen) {
  const spikes = enemy.type === "boss" ? 16 : enemy.type === "tank" ? 12 : 9;
  ctx.save(); ctx.rotate(ambienceTime * (enemy.type === "runner" ? 2.5 : .8) + enemy.sway);
  ctx.strokeStyle = enemy.flash > 0 ? "#fff" : frozen ? "#9beaff" : shade(enemy.color, -8);
  ctx.lineWidth = Math.max(2, s * .1);
  for (let i = 0; i < spikes; i += 1) {
    const angle = i / spikes * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(Math.cos(angle)*s*.65,Math.sin(angle)*s*.65); ctx.lineTo(Math.cos(angle)*s*1.08,Math.sin(angle)*s*1.08); ctx.stroke();
    ctx.fillStyle = enemy.color; ctx.beginPath(); ctx.arc(Math.cos(angle)*s*1.1,Math.sin(angle)*s*1.1,s*.1,0,Math.PI*2); ctx.fill();
  }
  const membrane = ctx.createRadialGradient(-s*.22,-s*.3,s*.08,0,0,s*.76);
  membrane.addColorStop(0,"rgba(255,255,255,.72)"); membrane.addColorStop(.18,enemy.flash>0?"#fff":enemy.color); membrane.addColorStop(1,shade(enemy.color,-34));
  ctx.fillStyle = membrane; ctx.beginPath(); ctx.arc(0,0,s*.72,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = colorAlpha(game.scene.colors.shot,.62); ctx.beginPath(); ctx.ellipse(s*.12,s*.03,s*.27,s*.19,.6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.58)";
  for (const [x,y,r] of [[-.28,-.2,.08],[.28,-.31,.06],[-.13,.29,.1]]) { ctx.beginPath(); ctx.arc(x*s,y*s,r*s,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
}

function drawVoidEnemy(enemy, s, frozen) {
  const color = enemy.flash > 0 ? "#fff" : frozen ? "#8ee9ff" : enemy.color;
  ctx.strokeStyle = shade(enemy.color,-18); ctx.lineWidth = Math.max(2,s*.12); ctx.lineCap="round";
  for (const side of [-1,1]) {
    ctx.beginPath(); ctx.moveTo(side*s*.35,-s*.15); ctx.lineTo(side*s*.92,-s*.55); ctx.lineTo(side*s*1.12,-s*.22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(side*s*.42,s*.1); ctx.lineTo(side*s*.9,s*.58); ctx.lineTo(side*s*1.12,s*.38); ctx.stroke();
  }
  ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(0,-s*.9); ctx.lineTo(s*.55,-s*.13); ctx.lineTo(s*.34,s*.68); ctx.lineTo(0,s*.88); ctx.lineTo(-s*.34,s*.68); ctx.lineTo(-s*.55,-s*.13); ctx.closePath(); ctx.fill();
  ctx.fillStyle=shade(enemy.color,-38); ctx.beginPath(); ctx.moveTo(0,-s*.57); ctx.lineTo(s*.27,s*.08); ctx.lineTo(0,s*.45); ctx.lineTo(-s*.27,s*.08); ctx.closePath(); ctx.fill();
  ctx.fillStyle=game.scene.colors.shot; ctx.beginPath(); ctx.ellipse(0,-s*.19,s*.18,s*.28,0,0,Math.PI*2); ctx.fill();
  if(enemy.type==="boss") { ctx.strokeStyle=colorAlpha(game.scene.colors.shot,.7);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,s*1.2,s*.42,ambienceTime,0,Math.PI*2);ctx.stroke(); }
}

function drawMartianEnemy(enemy, s, frozen) {
  const color = enemy.flash > 0 ? "#fff" : frozen ? "#83dce6" : enemy.color;
  ctx.strokeStyle=shade(enemy.color,-28);ctx.lineWidth=Math.max(2.5,s*.16);ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(-s*.25,s*.36);ctx.lineTo(-s*.38,s*.91);ctx.moveTo(s*.25,s*.36);ctx.lineTo(s*.38,s*.91);ctx.stroke();
  ctx.fillStyle=shade(color,-15);ctx.beginPath();ctx.ellipse(0,s*.17,s*.48,s*.65,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=shade(enemy.color,-15);ctx.lineWidth=s*.09;ctx.beginPath();ctx.moveTo(-s*.38,-s*.05);ctx.lineTo(-s*.82,s*.2);ctx.moveTo(s*.38,-s*.05);ctx.lineTo(s*.82,s*.2);ctx.stroke();
  ctx.fillStyle="rgba(157,224,235,.24)";ctx.strokeStyle="rgba(210,249,255,.62)";ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,-s*.55,s*.58,s*.52,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,-s*.53,s*.39,s*.34,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#fff26f";ctx.beginPath();ctx.ellipse(-s*.16,-s*.58,s*.08,s*.13,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(s*.16,-s*.58,s*.08,s*.13,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-s*.86);ctx.lineTo(0,-s*1.2);ctx.stroke();ctx.fillStyle=game.scene.colors.shot;ctx.beginPath();ctx.arc(0,-s*1.25,s*.09,0,Math.PI*2);ctx.fill();
  if(enemy.type==="boss") {ctx.strokeStyle="#ffbd6b";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-s*.55,s*.73,Math.PI,Math.PI*2);ctx.stroke();}
}

function drawLunarEnemy(enemy, s, frozen) {
  const color=enemy.flash>0?"#fff":frozen?"#9fe6f4":enemy.color;
  const step=Math.sin(game.elapsed*6+enemy.sway)*s*.14;
  ctx.strokeStyle=shade(enemy.color,-30);ctx.lineWidth=Math.max(3,s*.18);ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(-s*.2,s*.35);ctx.lineTo(-s*.34+step,s*.92);ctx.moveTo(s*.2,s*.35);ctx.lineTo(s*.34-step,s*.92);ctx.stroke();
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-s*.95);ctx.lineTo(s*.5,-s*.35);ctx.lineTo(s*.39,s*.59);ctx.lineTo(0,s*.72);ctx.lineTo(-s*.39,s*.59);ctx.lineTo(-s*.5,-s*.35);ctx.closePath();ctx.fill();
  ctx.fillStyle=shade(enemy.color,-38);ctx.beginPath();ctx.moveTo(-s*.34,-s*.52);ctx.lineTo(0,-s*.88);ctx.lineTo(s*.34,-s*.52);ctx.lineTo(s*.25,-s*.15);ctx.lineTo(-s*.25,-s*.15);ctx.closePath();ctx.fill();
  ctx.fillStyle=game.scene.colors.shot;ctx.fillRect(-s*.2,-s*.56,s*.4,s*.08);
  ctx.strokeStyle=shade(enemy.color,-20);ctx.lineWidth=2;for(const side of[-1,1]){ctx.beginPath();ctx.moveTo(side*s*.42,-s*.2);ctx.lineTo(side*s*.86,-s*.48);ctx.stroke();}
  if(enemy.type==="boss"||enemy.type==="splitter"){ctx.fillStyle=colorAlpha(game.scene.colors.shot,.65);for(let i=0;i<5;i+=1){const a=i/5*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*s*.55,Math.sin(a)*s*.55);ctx.lineTo(Math.cos(a)*s*1.15,Math.sin(a)*s*1.15);ctx.lineTo(Math.cos(a+.18)*s*.62,Math.sin(a+.18)*s*.62);ctx.fill();}}
}

function drawProjectileTrail(bullet) {
  if (!bullet.trail?.length) return;
  const accent = bullet.accent || bullet.color;
  ctx.save(); ctx.lineCap = "round";
  for (let i = bullet.trail.length - 1; i >= 1; i -= 1) {
    const from = bullet.trail[i]; const to = bullet.trail[i - 1]; const alpha = (1 - i / bullet.trail.length) * .62;
    ctx.strokeStyle = colorAlpha(i % 2 ? bullet.color : accent, alpha);
    ctx.lineWidth = Math.max(.6, (bullet.size + 2) * (1 - i / bullet.trail.length));
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
  }
  ctx.restore();
}

function drawBullet(bullet) {
  if (bullet.contactAttack) return;
  drawProjectileTrail(bullet);
  const angle = Math.atan2(bullet.vy, bullet.vx);
  const pulse = 1 + Math.sin((bullet.age || 0) * 18) * .12;
  ctx.save(); ctx.translate(bullet.x, bullet.y); ctx.rotate(angle);
  ctx.shadowColor = bullet.explosive ? "#ff9e45" : bullet.color;
  ctx.shadowBlur = bullet.visual === "starbreaker" ? 22 : 13;
  ctx.fillStyle = bullet.explosive ? "#ffb54f" : bullet.color;

  if (bullet.fx === "tracer") {
    const casing = ctx.createLinearGradient(-18, 0, 12, 0); casing.addColorStop(0, colorAlpha("#ff9b46", 0)); casing.addColorStop(.55, "#ffc66b"); casing.addColorStop(1, "#ffffff");
    ctx.fillStyle = casing; rr(-22, -2.1, 36, 4.2, 2); ctx.fill(); ctx.fillStyle = "#ff743d"; ctx.fillRect(6, -3, 8, 6);
  } else if (bullet.fx === "icicle") {
    ctx.fillStyle = "#eaffff"; ctx.strokeStyle = "#7fdfff"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-8, -5); ctx.lineTo(-14, 0); ctx.lineTo(-8, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(7, 0); ctx.lineTo(-4, 8); ctx.stroke();
  } else if (bullet.fx === "antibody") {
    ctx.fillStyle = "#e9ffff"; rr(-15, -3.4, 25, 6.8, 2); ctx.fill(); ctx.fillStyle = bullet.color; ctx.fillRect(-9, -2.3, 11, 4.6); ctx.fillStyle = "#ffffff"; ctx.fillRect(10, -1.1, 10, 2.2);
    ctx.strokeStyle = bullet.accent; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-15, -7); ctx.lineTo(-15, 7); ctx.stroke();
  } else if (bullet.fx === "laser") {
    ctx.fillStyle = colorAlpha(bullet.color, .32); rr(-35, -6, 52, 12, 5); ctx.fill(); ctx.fillStyle = "#f3ffff"; rr(-32, -1.5, 53, 3, 1.5); ctx.fill();
  } else if (bullet.fx === "rail") {
    ctx.fillStyle = "#fff2c4"; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-7, -3); ctx.lineTo(-18, 0); ctx.lineTo(-7, 3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ff8b4d"; ctx.lineWidth = 1.5; for (const offset of [-6, 6]) { ctx.beginPath(); ctx.moveTo(-26, offset); ctx.lineTo(9, offset * .3); ctx.stroke(); }
  } else if (bullet.fx === "lunarBolt") {
    ctx.strokeStyle = "#c8c6ff"; ctx.lineWidth = 3; for (let ring = 0; ring < 3; ring += 1) { ctx.beginPath(); ctx.ellipse(-ring * 7, 0, 8 + ring * 2, 12 - ring * 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = "#efffff"; ctx.fillRect(1, -2, 17, 4);
  } else if (bullet.fx === "flyingSword") {
    ctx.strokeStyle = colorAlpha("#b9ffe5", .28); ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, 26, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = "#eafff3"; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.arc(0, 0, 27, -1.16, 1.16); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 31, -1.03, 1.03); ctx.stroke();
    ctx.globalAlpha = .34; ctx.strokeStyle = bullet.color; ctx.lineWidth = 3;
    for (const offset of [10, 34]) { ctx.beginPath(); ctx.arc(-offset, 0, 25, -1.08, 1.08); ctx.stroke(); }
    ctx.globalAlpha = 1;
  } else if (bullet.fx === "spiritSword") {
    ctx.fillStyle = "#f6fff8"; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(-7, -3.2); ctx.lineTo(-12, 0); ctx.lineTo(-7, 3.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#d5ac5d"; ctx.fillRect(-12, -7, 3, 14); ctx.fillStyle = "#6e4c27"; ctx.fillRect(-18, -2, 7, 4);
  } else if (bullet.fx === "spiritPet") {
    ctx.strokeStyle = "#ffe6a2"; ctx.lineWidth = 2.8;
    for (const offset of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(-14, offset); ctx.quadraticCurveTo(0, offset - 5, 17, offset * .7); ctx.stroke(); }
  } else if (bullet.fx === "tesla") {
    ctx.fillStyle = colorAlpha(bullet.color, .72); ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(0, -9); ctx.lineTo(10, 0); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-21, 5); ctx.lineTo(-10, -5); ctx.lineTo(-2, 4); ctx.lineTo(7, -6); ctx.lineTo(21, 2); ctx.stroke();
  } else if (bullet.fx === "cryo") {
    ctx.strokeStyle = "#efffff"; ctx.lineWidth = 2.2; ctx.save(); ctx.rotate((bullet.age || 0) * 5);
    for (let arm = 0; arm < 6; arm += 1) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(13, 0); ctx.lineTo(9, -4); ctx.moveTo(9, 0); ctx.lineTo(12, 4); ctx.stroke(); } ctx.restore();
  } else if (bullet.fx === "serum") {
    ctx.fillStyle = "#effff9"; rr(-13, -5, 27, 10, 5); ctx.fill(); ctx.fillStyle = bullet.color; rr(-9, -3, 13, 6, 3); ctx.fill();
    ctx.strokeStyle = "#2c9778"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-7, -2); ctx.bezierCurveTo(0, 5, 2, -5, 9, 2); ctx.stroke();
  } else if (bullet.fx === "supportDrone") {
    ctx.strokeStyle = colorAlpha("#73e9ff", .42); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(15, 0); ctx.stroke();
  } else if (bullet.fx === "drone") {
    ctx.fillStyle = "#dffaff"; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(2, -7); ctx.lineTo(-10, -5); ctx.lineTo(-5, 0); ctx.lineTo(-10, 5); ctx.lineTo(2, 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = bullet.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-3, 8); ctx.stroke();
  } else if (bullet.fx === "plasma") {
    const heat = ctx.createLinearGradient(-24, 0, 18, 0); heat.addColorStop(0, colorAlpha("#ff493f", 0)); heat.addColorStop(.5, "#ff5a49"); heat.addColorStop(.82, "#ffd071"); heat.addColorStop(1, "#ffffff");
    ctx.fillStyle = heat; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-24, -8); ctx.lineTo(-10, 0); ctx.lineTo(-24, 8); ctx.closePath(); ctx.fill();
  } else if (bullet.fx === "graviton") {
    ctx.strokeStyle = "#eeeaff"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, 14 * pulse, -1.2, 1.2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 14 * pulse, Math.PI - 1.2, Math.PI + 1.2); ctx.stroke();
    ctx.fillStyle = "#a8f5ff"; ctx.beginPath(); ctx.ellipse(0, 0, 11, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  } else if (bullet.fx === "spell") {
    ctx.rotate(Math.sin((bullet.age || 0) * 8) * .15); ctx.fillStyle = "#f4dea0"; ctx.fillRect(-12, -6, 25, 12); ctx.fillStyle = "#b64b43"; ctx.fillRect(-6, -3.5, 2, 7); ctx.fillRect(-1, -4, 2, 8); ctx.fillRect(4, -3, 2, 6);
  } else if (bullet.visual === "swarm") {
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -4); ctx.lineTo(-1, 0); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, bullet.explosive ? 5.2 : 3.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawImpactBurst(burst) {
  const progress = 1 - burst.life / burst.maxLife;
  const alpha = Math.max(0, 1 - progress);
  ctx.save(); ctx.translate(burst.x, burst.y); ctx.rotate(burst.angle);
  ctx.globalAlpha = alpha; ctx.shadowColor = burst.color; ctx.shadowBlur = 12; ctx.lineCap = "round";
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(1, 0, 7 * (1 - progress) + 2, 12 * (1 - progress) + 2, 0, 0, Math.PI * 2); ctx.fill();
  const slashFx = ["powerArc", "flameArc", "qiArc", "flyingSword", "spiritSword", "spiritPet"].includes(burst.fx);
  const shieldFx = ["disinfectant", "ionArc"].includes(burst.fx);
  const heavyFx = ["snowball", "gravityArc"].includes(burst.fx);
  const ballisticFx = ["tracer", "laser", "rail", "lunarBolt", "antibody"].includes(burst.fx);
  if (slashFx) {
    ctx.strokeStyle = burst.fx === "flameArc" ? "#ff9d4e" : burst.fx === "snowball" ? "#c9f6ff" : burst.color; ctx.lineWidth = 7 - progress * 4;
    ctx.beginPath(); ctx.arc(-5, 0, 18 + progress * 25, -1.15, 1.15); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-4, 0, 24 + progress * 30, -.9, .9); ctx.stroke();
  } else if (heavyFx) {
    ctx.strokeStyle = burst.fx === "snowball" ? "#d8faff" : "#c9c3ff"; ctx.lineWidth = 6 - progress * 3;
    ctx.beginPath(); ctx.arc(0, 4, 13 + progress * 34, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.moveTo(2, i * 5); ctx.lineTo(24 + progress * 31, i * (8 + progress * 5)); ctx.stroke(); }
  } else if (shieldFx) {
    ctx.strokeStyle = burst.color; ctx.lineWidth = 8 - progress * 5; ctx.beginPath(); ctx.arc(-9, 0, 20 + progress * 22, -1.3, 1.3); ctx.stroke();
    ctx.strokeStyle = colorAlpha("#ffffff", .85); ctx.lineWidth = 2; for (const y of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(-4 + progress * 8, y); ctx.lineTo(18 + progress * 25, y * 1.45); ctx.stroke(); }
  } else if (ballisticFx) {
    for (let i = -3; i <= 3; i += 1) { const spread = i * .19; ctx.save(); ctx.rotate(spread); ctx.strokeStyle = i ? burst.color : "#ffffff"; ctx.lineWidth = i ? 1.5 : 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20 + progress * (28 + Math.abs(i) * 5), 0); ctx.stroke(); ctx.restore(); }
  } else if (burst.fx === "tesla") {
    ctx.strokeStyle = "#f7eeff"; ctx.lineWidth = 2.2; for (let branch = -2; branch <= 2; branch += 1) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, branch * 5); ctx.lineTo(19 + progress * 18, branch * 9 - 4); ctx.lineTo(31 + progress * 22, branch * 12 + 3); ctx.stroke(); }
  } else if (burst.fx === "cryo" || burst.fx === "icicle") {
    ctx.fillStyle = "#eaffff"; for (let i = 0; i < 7; i += 1) { const a = -1.2 + i * .4; ctx.save(); ctx.rotate(a); ctx.translate(10 + progress * 25, 0); ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -3); ctx.lineTo(-3, 4); ctx.closePath(); ctx.fill(); ctx.restore(); }
  } else if (burst.fx === "serum") {
    ctx.strokeStyle = "#effff9"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 9 + progress * 22, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = burst.color; ctx.fillRect(-2, -9, 4, 18); ctx.fillRect(-9, -2, 18, 4);
  } else if (burst.fx === "plasma") {
    ctx.strokeStyle = "#ff8956"; ctx.lineWidth = 5 - progress * 3; ctx.beginPath(); ctx.ellipse(0, 0, 11 + progress * 34, 20 + progress * 12, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#ffe7a1"; ctx.lineWidth = 1.5; for (let i = 0; i < 8; i += 1) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.lineTo(Math.cos(a) * (22 + progress * 30), Math.sin(a) * (22 + progress * 30)); ctx.stroke(); }
  } else if (burst.fx === "graviton") {
    ctx.strokeStyle = "#d9d5ff"; ctx.lineWidth = 2.2; for (let ring = 0; ring < 3; ring += 1) { ctx.beginPath(); ctx.ellipse(0, 0, 12 + progress * (18 + ring * 8), 24 - ring * 5, ring * .7, 0, Math.PI * 2); ctx.stroke(); }
  } else if (burst.fx === "spell") {
    ctx.fillStyle = "#f4d997"; for (let i = 0; i < 6; i += 1) { const a = i / 6 * Math.PI * 2; ctx.save(); ctx.rotate(a); ctx.translate(9 + progress * 28, 0); ctx.rotate(progress * 2); ctx.fillRect(-5, -2, 10, 4); ctx.restore(); }
  } else if (burst.fx === "drone") {
    ctx.strokeStyle = "#baf5ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -15); ctx.lineTo(16 + progress * 22, -5); ctx.moveTo(-4, 15); ctx.lineTo(16 + progress * 22, 5); ctx.stroke();
  }
  if (burst.critical) { ctx.strokeStyle = "#fff36a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 17 + progress * 28, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

function drawThemedUltimate(ultimate) {
  const progress = 1 - Math.max(0, ultimate.time) / ultimate.maxTime;
  const power = Math.sin(Math.min(1, progress * 1.8) * Math.PI);
  const skin = getEquippedSkin();
  const color = skin.primary;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawUltimateSkinCosmetic(ultimate, progress, skin);
  if (ultimate.family === "impact") {
    ctx.translate(ultimate.x, ultimate.y);
    ctx.rotate(ultimate.angle || 0);
    const impact = Math.min(1, progress / .52);
    const burst = Math.max(0, 1 - Math.abs(progress - .52) * 4.5);
    const trail = ctx.createLinearGradient(-260, 0, 120, 0);
    trail.addColorStop(0, colorAlpha(color, 0)); trail.addColorStop(.7, colorAlpha(color, .22 + power * .3)); trail.addColorStop(1, colorAlpha("#ffffff", .82));
    ctx.fillStyle = trail;
    ctx.beginPath(); ctx.moveTo(-260, -16); ctx.lineTo(65, -46 - power * 22); ctx.lineTo(138, 0); ctx.lineTo(65, 46 + power * 22); ctx.lineTo(-260, 16); ctx.closePath(); ctx.fill();
    if (ultimate.type === "breach") {
      for (let i = 0; i < 3; i += 1) { ctx.strokeStyle = colorAlpha(i === 1 ? "#ffffff" : color, .35 + burst * .6); ctx.lineWidth = 4 + i * 4; ctx.beginPath(); ctx.arc(8 + i * 16, 0, 72 + impact * 88 + i * 18, -.78, .78); ctx.stroke(); }
      ctx.fillStyle = "#fff4d2"; for (let i = 0; i < 16; i += 1) { const a = -1.05 + i / 15 * 2.1; ctx.fillRect(Math.cos(a) * (75 + impact * 120), Math.sin(a) * (75 + impact * 120), 14 + burst * 17, 2); }
    } else if (ultimate.type === "avalanche") {
      ctx.rotate(-(ultimate.angle || 0));
      ctx.fillStyle = colorAlpha("#eaffff", .72); ctx.strokeStyle = colorAlpha("#7cdaff", .9); ctx.lineWidth = 2;
      for (let i = -5; i <= 5; i += 1) { const x = i * 28; const h = 38 + (5 - Math.abs(i)) * 9 + impact * 60; ctx.beginPath(); ctx.moveTo(x - 16, 46); ctx.lineTo(x, 46 - h); ctx.lineTo(x + 15, 46); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = colorAlpha("#ffffff", .22); ctx.beginPath(); ctx.arc(0, 0, 70 + impact * 160, 0, Math.PI * 2); ctx.fill();
    } else if (ultimate.type === "deconRush") {
      ctx.strokeStyle = colorAlpha("#eafff8", .82); ctx.lineWidth = 9;
      for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.moveTo(-220 + impact * 180, i * 24); ctx.lineTo(150, i * 34); ctx.stroke(); }
      ctx.fillStyle = colorAlpha("#72ffd0", .5); for (let i = 0; i < 7; i += 1) { ctx.save(); ctx.translate(-130 + i * 46, 0); ctx.beginPath(); ctx.moveTo(-12,-22);ctx.lineTo(15,0);ctx.lineTo(-12,22);ctx.closePath();ctx.fill();ctx.restore(); }
    } else if (ultimate.type === "faultline") {
      ctx.rotate(-(ultimate.angle || 0)); ctx.strokeStyle = "#ffb34f"; ctx.shadowColor="#ff4a1f";ctx.shadowBlur=20;ctx.lineWidth=10;
      ctx.beginPath();ctx.moveTo(-210,45);for(let i=0;i<9;i+=1)ctx.lineTo(-180+i*47,45+Math.sin(i*4.7)*30);ctx.stroke();
      ctx.strokeStyle="#fff0a8";ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle=colorAlpha("#ff5b29",.35);ctx.beginPath();ctx.ellipse(0,38,220*impact,66,0,0,Math.PI*2);ctx.fill();
    } else if (ultimate.type === "moonQuake") {
      ctx.rotate(-(ultimate.angle || 0));
      for(let i=0;i<5;i+=1){ctx.strokeStyle=colorAlpha(i%2?"#ffffff":"#b8b5ff",.7-i*.1);ctx.lineWidth=8-i;ctx.beginPath();ctx.ellipse(0,0,45+impact*(70+i*35),18+impact*(23+i*12),0,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle="#ecebff";for(let i=0;i<18;i+=1){const a=i/18*Math.PI*2;const r=45+impact*(60+(i%4)*22);ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.55,3+i%3,0,Math.PI*2);ctx.fill();}
    } else {
      ctx.rotate(-(ultimate.angle || 0));
      for(let i=0;i<9;i+=1){const a=i/9*Math.PI*2+ambienceTime*.35;ctx.save();ctx.rotate(a);ctx.translate(52+impact*115,0);ctx.rotate(Math.PI/2);ctx.fillStyle=colorAlpha(i===0?"#ffffff":"#ffd77d",.85);ctx.fillRect(-3,-54,6,82);ctx.beginPath();ctx.moveTo(0,-74);ctx.lineTo(-9,-51);ctx.lineTo(9,-51);ctx.closePath();ctx.fill();ctx.restore();}
      ctx.strokeStyle=colorAlpha("#ffe6a1",.9);ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,62+impact*150,0,Math.PI*2);ctx.stroke();
    }
  } else if (ultimate.family === "field") {
    ctx.translate(ultimate.x, ultimate.y);
    const radius = 65 + Math.min(1, progress / .55) * 380;
    if (ultimate.type === "teslaStorm") {
      ctx.strokeStyle=colorAlpha("#d6f4ff",.82);ctx.lineWidth=2.5;
      const nodes=8;for(let i=0;i<nodes;i+=1){const a=i/nodes*Math.PI*2+ambienceTime*.18;const x=Math.cos(a)*radius*.72,y=Math.sin(a)*radius*.5;ctx.fillStyle=colorAlpha("#8ebdff",.8);ctx.fillRect(x-7,y-14,14,28);const next=(i+3)%nodes,nx=Math.cos(next/nodes*Math.PI*2+ambienceTime*.18)*radius*.72,ny=Math.sin(next/nodes*Math.PI*2+ambienceTime*.18)*radius*.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo((x+nx)/2+Math.sin(i*8+ambienceTime*12)*18,(y+ny)/2);ctx.lineTo(nx,ny);ctx.stroke();}
    } else if (ultimate.type === "blizzard") {
      const snow=58;for(let i=0;i<snow;i+=1){const a=i*.91+ambienceTime*(1.8+i%4*.16);const r=(i%snow)/snow*radius;ctx.fillStyle=colorAlpha(i%3?"#dff8ff":"#8cddff",.38+i%4*.12);ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.64,1.4+i%3,0,Math.PI*2);ctx.fill();}ctx.strokeStyle=colorAlpha("#eaffff",.6);ctx.lineWidth=18;ctx.beginPath();ctx.arc(0,0,radius*.62,0,Math.PI*1.65);ctx.stroke();
    } else if (ultimate.type === "sterilePurge") {
      const glow=ctx.createRadialGradient(0,0,4,0,0,radius);glow.addColorStop(0,colorAlpha("#ffffff",.5));glow.addColorStop(.55,colorAlpha("#72ffd0",.18));glow.addColorStop(1,colorAlpha("#72ffd0",0));ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
      for(let i=0;i<12;i+=1){const a=i/12*Math.PI*2;ctx.save();ctx.translate(Math.cos(a)*radius*.68,Math.sin(a)*radius*.68);ctx.rotate(a);ctx.fillStyle=colorAlpha("#eafff8",.82);ctx.fillRect(-4,-18,8,36);ctx.fillRect(-18,-4,36,8);ctx.restore();}
    } else if (ultimate.type === "solarCore") {
      const glow=ctx.createRadialGradient(0,0,2,0,0,radius);glow.addColorStop(0,"rgba(255,255,255,.95)");glow.addColorStop(.12,"rgba(255,224,104,.9)");glow.addColorStop(.42,"rgba(255,83,61,.34)");glow.addColorStop(1,"rgba(255,45,108,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();for(let i=0;i<9;i+=1){ctx.save();ctx.rotate(i/9*Math.PI*2+ambienceTime*.3);ctx.fillStyle=colorAlpha(i%2?"#ffdd73":"#ff6c94",.5);ctx.fillRect(radius*.15,-3,radius*.72,6);ctx.restore();}
    } else if (ultimate.type === "gravityCollapse") {
      const core=30+power*24;const lens=ctx.createRadialGradient(0,0,2,0,0,radius);lens.addColorStop(0,"rgba(0,0,0,.98)");lens.addColorStop(core/radius,"rgba(45,30,90,.92)");lens.addColorStop(.38,"rgba(159,135,255,.23)");lens.addColorStop(1,"rgba(110,90,255,0)");ctx.fillStyle=lens;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle=colorAlpha("#e4dcff",.8);ctx.lineWidth=4;for(let i=0;i<4;i+=1){ctx.beginPath();ctx.ellipse(0,0,core+35+i*34,(core+35+i*34)*.34,ambienceTime*(i%2?.45:-.35)+i,0,Math.PI*2);ctx.stroke();}
    } else {
      ctx.fillStyle=colorAlpha("#d8deee",.2);for(let i=0;i<8;i+=1){const a=i/8*Math.PI*2;ctx.beginPath();ctx.ellipse(Math.cos(a)*radius*.45-35,Math.sin(a)*radius*.2-150,120,46,a*.4,0,Math.PI*2);ctx.fill();}ctx.strokeStyle=colorAlpha("#fff4b5",.85);ctx.lineWidth=3;for(let i=0;i<7;i+=1){const x=-radius*.7+i*radius*.23;ctx.beginPath();ctx.moveTo(x-20,-430);ctx.lineTo(x+Math.sin(i*12+ambienceTime*20)*26,-110);ctx.lineTo(x,20);ctx.stroke();}
    }
  } else if (ultimate.family === "orbit") {
    ctx.translate(game.player.x, game.player.y);
    const state = getOrbitGalaxyState();
    const breathe = .5 + Math.sin(ambienceTime * 8) * .5;
    ctx.strokeStyle = colorAlpha(color, .45 + breathe * .35); ctx.lineWidth = 4;
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.beginPath(); ctx.ellipse(0, 0, state.radius + ring * 23, state.radius * .52 + ring * 11, ambienceTime * (ring % 2 ? -.35 : .45), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = colorAlpha("#eaf9ff", .18 + breathe * .16); ctx.beginPath(); ctx.arc(0, 0, 38 + breathe * 13, 0, Math.PI * 2); ctx.fill();
  } else if (ultimate.family === "barrage") {
    drawUltimateCarrier(ultimate, progress, color);
    for (let index = 0; index < game.airstrikes.length; index += 1) drawUltimateStrike(game.airstrikes[index], ultimate, index, color);
  }
  ctx.restore();
}

function drawUltimateSkinCosmetic(ultimate, progress, skin) {
  const tier = skin.tier || 0;
  if (!tier) return;
  const x = ultimate.family === "barrage" ? game.player.x : ultimate.x;
  const y = ultimate.family === "barrage" ? game.player.y : ultimate.y;
  const reveal = Math.sin(Math.min(1, progress * 1.45) * Math.PI);
  const radius = 58 + progress * (58 + tier * 34);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ambienceTime * (.16 + tier * .05));
  ctx.globalAlpha = .28 + reveal * .46;
  ctx.strokeStyle = skin.secondary; ctx.fillStyle = skin.primary; ctx.shadowColor = skin.primary; ctx.shadowBlur = 8 + tier * 7;
  if (["orbit", "eclipse", "sigil"].includes(skin.motif)) {
    ctx.lineWidth = 1.5 + tier * .75;
    for (let ring = 0; ring < tier + 1; ring += 1) {
      ctx.beginPath(); ctx.ellipse(0, 0, radius + ring * 24, (radius + ring * 24) * (.42 + ring * .06), ring * .72, 0, Math.PI * 2); ctx.stroke();
    }
  }
  const count = 5 + tier * 5;
  for (let i = 0; i < count; i += 1) {
    const angle = i / count * Math.PI * 2 + ambienceTime * (i % 2 ? -.5 : .65);
    const distance = radius * (.62 + (i % 3) * .18);
    ctx.save(); ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance * .68); ctx.rotate(angle);
    if (skin.motif === "shard") { ctx.beginPath(); ctx.moveTo(9 + tier * 2, 0); ctx.lineTo(-5, -3); ctx.lineTo(-2, 5); ctx.closePath(); ctx.fill(); }
    else if (skin.motif === "cross") { ctx.fillRect(-2, -8, 4, 16); ctx.fillRect(-8, -2, 16, 4); }
    else if (skin.motif === "flare") { ctx.fillRect(-2, -2, 15 + tier * 5, 4); }
    else if (skin.motif === "sigil") { ctx.strokeRect(-7, -7, 14, 14); ctx.rotate(Math.PI / 4); ctx.strokeRect(-5, -5, 10, 10); }
    else { ctx.beginPath(); ctx.arc(0, 0, 2 + tier, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  if (tier >= 3) {
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i += 1) { ctx.save(); ctx.rotate(i / 10 * Math.PI * 2); ctx.globalAlpha *= .65; ctx.beginPath(); ctx.moveTo(radius * .45, 0); ctx.lineTo(radius * 1.55, 0); ctx.stroke(); ctx.restore(); }
  }
  ctx.restore();
}

function drawUltimateCarrier(ultimate, progress, color) {
  const x = game.player.x - 330 + progress * 660;
  const y = game.player.y - 235 - Math.sin(progress * Math.PI) * 42;
  ctx.save();ctx.translate(x,y);ctx.shadowColor=color;ctx.shadowBlur=24;
  if (["droneBarrage","antibodyRain","swarmProtocol"].includes(ultimate.type)) {
    const count=ultimate.type==="swarmProtocol"?7:4;for(let i=0;i<count;i+=1){const ox=(i-(count-1)/2)*34,oy=Math.sin(i*3+ambienceTime*4)*9;ctx.save();ctx.translate(ox,oy);ctx.fillStyle=ultimate.type==="antibodyRain"?"#eafff8":color;ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(1,-9);ctx.lineTo(-16,-5);ctx.lineTo(-22,0);ctx.lineTo(-16,5);ctx.lineTo(1,9);ctx.closePath();ctx.fill();ctx.strokeStyle="#ffffff";ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(26,0);ctx.stroke();ctx.restore();}
  } else if (ultimate.type==="railSalvo") {
    ctx.fillStyle="#a8cbe0";ctx.beginPath();ctx.moveTo(112,0);ctx.lineTo(30,-28);ctx.lineTo(-100,-19);ctx.lineTo(-125,0);ctx.lineTo(-100,19);ctx.lineTo(30,28);ctx.closePath();ctx.fill();ctx.fillStyle="#ffffff";ctx.fillRect(-14,-4,132,8);
  } else if (ultimate.type==="lunarSupport") {
    ctx.strokeStyle="#e6e8ff";ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,31,-1.2,1.2);ctx.stroke();ctx.fillStyle="#b2f3ff";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#8c8dba";ctx.fillRect(-72,-9,46,18);ctx.fillRect(26,-9,46,18);
  } else if (ultimate.type==="marsBarrage") {
    ctx.fillStyle="#6b3828";for(let i=-2;i<=2;i+=1){ctx.save();ctx.translate(i*29,0);ctx.fillRect(-10,-20,20,40);ctx.fillStyle="#ffdf8a";ctx.beginPath();ctx.moveTo(-8,20);ctx.lineTo(0,37+Math.random()*8);ctx.lineTo(8,20);ctx.fill();ctx.restore();}
  } else if (ultimate.type==="swordRain") {
    ctx.strokeStyle=colorAlpha("#dffff0",.8);ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,120,27,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#f4fff4";for(let i=0;i<11;i+=1){ctx.save();ctx.translate((i-5)*19,0);ctx.fillRect(-2,-35,4,52);ctx.beginPath();ctx.moveTo(0,29);ctx.lineTo(-7,14);ctx.lineTo(7,14);ctx.closePath();ctx.fill();ctx.restore();}
  } else {
    ctx.strokeStyle=colorAlpha(color,.75);ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,84,0,Math.PI*2);ctx.stroke();ctx.fillStyle=colorAlpha(color,.35);ctx.beginPath();ctx.arc(0,0,58,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function drawUltimateStrike(strike, ultimate, index, color) {
  if (strike.exploded) return;
  const warning=.48+Math.sin(ambienceTime*20+index)*.35;const r=Math.max(13,43-Math.max(0,strike.delay)*16);
  ctx.save();ctx.translate(strike.x,strike.y);ctx.strokeStyle=colorAlpha(ultimate.type==="marsBarrage"?"#ff874a":ultimate.type==="antibodyRain"?"#72ffd0":color,warning);ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  const drop=-28-Math.max(0,strike.delay)*210;ctx.shadowColor=color;ctx.shadowBlur=16;
  if (["auroraSpears","swordRain"].includes(ultimate.type)){ctx.fillStyle=ultimate.type==="auroraSpears"?"#dffaff":"#eaffee";ctx.fillRect(-2,drop-38,4,55);ctx.beginPath();ctx.moveTo(0,drop+28);ctx.lineTo(-8,drop+12);ctx.lineTo(8,drop+12);ctx.closePath();ctx.fill();}
  else if (ultimate.type==="antibodyRain"){ctx.fillStyle="#effff8";ctx.fillRect(-4,drop-25,8,34);ctx.fillStyle="#72ffd0";ctx.fillRect(-3,drop-19,6,14);ctx.fillStyle="#ffffff";ctx.fillRect(-1,drop+8,2,15);}
  else {ctx.strokeStyle=ultimate.type==="railSalvo"?"#ffffff":color;ctx.lineWidth=ultimate.type==="railSalvo"?7:3;ctx.beginPath();ctx.moveTo(0,-460);ctx.lineTo(0,drop+24);ctx.stroke();ctx.fillStyle=ultimate.type==="marsBarrage"?"#ffb35a":color;ctx.beginPath();ctx.moveTo(0,drop+24);ctx.lineTo(-7,drop+5);ctx.lineTo(7,drop+5);ctx.closePath();ctx.fill();}
  ctx.restore();
}

function drawUltimateEffect() {
  const ultimate = game.ultimate;
  if (!ultimate) return;
  if (ultimate.family) { drawThemedUltimate(ultimate); return; }
  const progress = 1 - Math.max(0, ultimate.time) / ultimate.maxTime;
  ctx.save();
  if (ultimate.type === "greatsword" && ultimate.variant === "disinfectant") {
    const impact = Math.min(1, progress / .46);
    ctx.translate(ultimate.x, ultimate.y);
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 210);
    glow.addColorStop(0, colorAlpha("#edfff8", .46)); glow.addColorStop(1, colorAlpha("#72ffd0", 0));
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 210, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colorAlpha("#dffff5", .5 + impact * .45); ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(-18, 0, 72 + impact * 100, -1.15, 1.15); ctx.stroke();
    ctx.strokeStyle = colorAlpha("#72ffd0", .78); ctx.lineWidth = 3; for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(0, 0, 45 + impact * (45 + i * 27), 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#72ffd0"; ctx.shadowBlur = 25; ctx.fillRect(-8, -45, 16, 90); ctx.fillRect(-45, -8, 90, 16);
  } else if (ultimate.type === "greatsword") {
    const impact = Math.min(1, progress / .46);
    const pulse = 1 + Math.sin(ambienceTime * 16) * .08;
    ctx.translate(ultimate.x, ultimate.y);
    ctx.strokeStyle = colorAlpha("#ffd66e", .45 + impact * .4);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, (54 + impact * 128) * pulse, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const angle = i / 8 * Math.PI * 2 + .18;
      ctx.strokeStyle = colorAlpha("#fff0a3", .18 + impact * .42);
      ctx.lineWidth = 2 + impact * 3;
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 34, Math.sin(angle) * 34); ctx.lineTo(Math.cos(angle) * (70 + impact * 105), Math.sin(angle) * (70 + impact * 105)); ctx.stroke();
    }
    const swordY = -190 + impact * 190;
    ctx.translate(0, swordY);
    ctx.shadowColor = "#ffd66e"; ctx.shadowBlur = 28;
    const blade = ctx.createLinearGradient(-12, -110, 15, 70);
    blade.addColorStop(0, "#fffbe2"); blade.addColorStop(.48, "#ffd66e"); blade.addColorStop(1, "#ff8b3d");
    ctx.fillStyle = blade;
    ctx.beginPath(); ctx.moveTo(0, 82); ctx.lineTo(-18, 45); ctx.lineTo(-13, -92); ctx.lineTo(0, -122); ctx.lineTo(13, -92); ctx.lineTo(18, 45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff5b8"; ctx.fillRect(-42, 42, 84, 10);
    ctx.fillStyle = "#8d4826"; ctx.fillRect(-6, 49, 12, 52);
  } else if (ultimate.type === "spell" && ultimate.variant === "serum") {
    const grow = Math.min(1, progress / .5);
    const radius = 72 + grow * 350;
    ctx.translate(ultimate.x, ultimate.y);
    const sterileGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, radius);
    sterileGlow.addColorStop(0, colorAlpha("#effff9", .34)); sterileGlow.addColorStop(.55, colorAlpha("#72ffd0", .14)); sterileGlow.addColorStop(1, colorAlpha("#72ffd0", 0));
    ctx.fillStyle = sterileGlow; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    for (let ring = 0; ring < 4; ring += 1) {
      ctx.save(); ctx.rotate((ring % 2 ? -1 : 1) * ambienceTime * (.55 + ring * .2));
      ctx.strokeStyle = colorAlpha(ring % 2 ? "#ffffff" : "#72ffd0", .8 - ring * .12); ctx.lineWidth = 2.5; ctx.setLineDash(ring % 2 ? [10, 8] : [3, 7]);
      ctx.beginPath(); ctx.arc(0, 0, radius * (.24 + ring * .23), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    ctx.fillStyle = colorAlpha("#effff9", .85); for (let i = 0; i < 8; i += 1) { const a = i / 8 * Math.PI * 2; const r = radius * .66; ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.fillRect(-3, -13, 6, 26); ctx.fillRect(-13, -3, 26, 6); ctx.restore(); }
  } else if (ultimate.type === "spell") {
    const grow = Math.min(1, progress / .5);
    const radius = 72 + grow * 350;
    ctx.translate(ultimate.x, ultimate.y);
    const glow = ctx.createRadialGradient(0, 0, 12, 0, 0, radius);
    glow.addColorStop(0, colorAlpha("#efe0ff", .28)); glow.addColorStop(.55, colorAlpha("#ba67ff", .13)); glow.addColorStop(1, colorAlpha("#7c2fc7", 0));
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.save(); ctx.rotate((ring % 2 ? -1 : 1) * ambienceTime * (.8 + ring * .3));
      ctx.strokeStyle = colorAlpha(ring === 1 ? "#ffffff" : "#d69cff", .72 - ring * .12);
      ctx.lineWidth = 2 + (ring === 1 ? 1 : 0);
      ctx.setLineDash(ring === 1 ? [14, 9] : [3, 12]);
      ctx.beginPath(); ctx.arc(0, 0, radius * (.32 + ring * .29), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      const marks = 6 + ring * 2;
      for (let i = 0; i < marks; i += 1) {
        const angle = i / marks * Math.PI * 2;
        const r = radius * (.32 + ring * .29);
        ctx.save(); ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r); ctx.rotate(angle);
        ctx.fillStyle = colorAlpha("#f3ddff", .78); ctx.fillRect(-5, -1.5, 10, 3); ctx.restore();
      }
      ctx.restore();
    }
    ctx.strokeStyle = colorAlpha("#eed8ff", .72); ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i += 1) { const a = i * Math.PI * 4 / 6 - Math.PI / 2; const r = radius * .57; if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.stroke();
  } else if (ultimate.type === "airship" || ultimate.type === "swordrain") {
    if (ultimate.type === "airship" && ultimate.variant === "antibody") {
      const droneX = game.player.x - 270 + progress * 540;
      const droneY = game.player.y - 190 + Math.sin(progress * Math.PI) * -24;
      ctx.translate(droneX, droneY); ctx.shadowColor = "#72ffd0"; ctx.shadowBlur = 22;
      ctx.fillStyle = "#e9f7f4"; rr(-45, -15, 90, 30, 12); ctx.fill();
      ctx.strokeStyle = "#72d9c0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(58, 0); ctx.stroke();
      ctx.fillStyle = "#233a38"; for (const x of [-61, 61]) { ctx.beginPath(); ctx.ellipse(x, 0, 22, 5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "#25bf9a"; ctx.fillRect(-4, -10, 8, 20); ctx.fillRect(-10, -4, 20, 8);
      ctx.fillStyle = "#bffff0"; for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.arc(i * 13, 13, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore(); ctx.save();
    } else if (ultimate.type === "airship") {
      const shipX = game.player.x - 310 + progress * 620;
      const shipY = game.player.y - 225 + Math.sin(progress * Math.PI) * -32;
      ctx.translate(shipX, shipY);
      ctx.shadowColor = "#72efff"; ctx.shadowBlur = 22;
      ctx.fillStyle = "#152d43";
      ctx.beginPath(); ctx.moveTo(86, 0); ctx.lineTo(24, -22); ctx.lineTo(-72, -14); ctx.lineTo(-98, 0); ctx.lineTo(-65, 15); ctx.lineTo(28, 19); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#5ddff3"; ctx.beginPath(); ctx.moveTo(30, -17); ctx.lineTo(-15, -38); ctx.lineTo(-48, -31); ctx.lineTo(-20, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#9af6ff"; for (let i = -2; i <= 2; i += 1) ctx.fillRect(i * 20 - 6, -4, 12, 5);
      ctx.fillStyle = "#ffb85a"; ctx.beginPath(); ctx.moveTo(-94, -7); ctx.lineTo(-126 - Math.random() * 12, 0); ctx.lineTo(-94, 7); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.save();
    }
    for (const strike of game.airstrikes) {
      if (strike.exploded) continue;
      const warning = .55 + Math.sin(ambienceTime * 18) * .25;
      const strikeColor = ultimate.variant === "antibody" ? "#72ffd0" : ultimate.type === "swordrain" ? "#b7ffce" : "#ff6d63";
      ctx.strokeStyle = colorAlpha(strikeColor, warning); ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(strike.x, strike.y, 40 - Math.max(0, strike.delay) * 12, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = colorAlpha(ultimate.variant === "antibody" ? "#eafff8" : ultimate.type === "swordrain" ? "#dffff0" : "#8ff7ff", .65); ctx.beginPath(); ctx.moveTo(strike.x, strike.y - 180); ctx.lineTo(strike.x, strike.y - 12); ctx.stroke();
      const dropY = strike.y - 22 - Math.max(0, strike.delay) * 170;
      ctx.fillStyle = ultimate.variant === "antibody" ? "#eafff8" : ultimate.type === "swordrain" ? "#dffff0" : "#ffda73";
      if (ultimate.type === "swordrain") { ctx.fillRect(strike.x - 2, dropY - 24, 4, 30); ctx.fillRect(strike.x - 8, dropY, 16, 3); }
      else if (ultimate.variant === "antibody") { rr(strike.x - 3, dropY - 17, 6, 23, 2); ctx.fill(); ctx.fillStyle = "#72ffd0"; ctx.fillRect(strike.x - 2, dropY - 11, 4, 8); ctx.fillStyle = "#ffffff"; ctx.fillRect(strike.x - 1, dropY + 5, 2, 8); }
      else { ctx.beginPath(); ctx.moveTo(strike.x, dropY); ctx.lineTo(strike.x - 5, dropY - 15); ctx.lineTo(strike.x + 5, dropY - 15); ctx.closePath(); ctx.fill(); }
    }
  }
  ctx.restore();
}

function drawClassAttackAnimation(player, attack) {
  if (attack <= 0) return;
  const eased = Math.sin(Math.min(1, attack) * Math.PI);
  const color = player.combatClass.color;
  const fx = player.combatClass.fx;
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.aimAngle);
  if (game.scene.endless) {
    if (player.combatClass.id === "ranger") {
      const slash = ctx.createLinearGradient(18, 0, 132, 0);
      slash.addColorStop(0, colorAlpha("#eafff3", .9));
      slash.addColorStop(.48, colorAlpha(color, .72));
      slash.addColorStop(1, colorAlpha(color, 0));
      ctx.strokeStyle = slash; ctx.lineWidth = 12; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(5, 0, 72 + eased * 10, -1.02, .77); ctx.stroke();
      ctx.strokeStyle = colorAlpha("#ffffff", .72 + eased * .2); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(5, 0, 79 + eased * 14, -.93, .64); ctx.stroke();
      for (let i = 0; i < 4; i += 1) {
        const offset = 51 + i * 18 + eased * 8;
        ctx.save(); ctx.translate(offset, (i - 1.5) * 4); ctx.rotate(.04 * (i - 1.5));
        ctx.fillStyle = colorAlpha(color, .72 - i * .11); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-8, -3); ctx.lineTo(-3, 0); ctx.lineTo(-8, 3); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    } else if (player.combatClass.id === "melee") {
      ctx.strokeStyle = colorAlpha(color, .3 + eased * .65); ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(0, 0, 48 + eased * 34, -.92, .92); ctx.stroke();
      ctx.strokeStyle = colorAlpha("#fff3bf", .82); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 58 + eased * 38, -.8, .72); ctx.stroke();
    } else {
      ctx.strokeStyle = colorAlpha(color, .3 + eased * .65); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 45 + eased * 42, -.9, .9); ctx.stroke();
      ctx.save(); ctx.translate(48 + eased * 9, 0); ctx.rotate(ambienceTime * 3.5);
      ctx.strokeStyle = colorAlpha("#eaffee", .75); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 15 + eased * 7, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 5; i += 1) { const a = i / 5 * Math.PI * 2; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(Math.cos(a) * 19, Math.sin(a) * 19, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  } else if (game.scene.id === "orbit") {
    if (player.combatClass.id === "melee") {
      ctx.strokeStyle = colorAlpha("#dffbff", .18 + eased * .32); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 88 + eased * 34, 46 + eased * 16, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (player.combatClass.id === "ranger") {
      ctx.strokeStyle = colorAlpha(color, .46); ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(148, 0); ctx.stroke();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(168, 0); ctx.stroke();
    } else {
      for (let i = 0; i < 5; i += 1) { const a = i / 5 * Math.PI * 2 + ambienceTime * 2; ctx.save(); ctx.translate(48 + Math.cos(a) * 27, Math.sin(a) * 27); ctx.rotate(a); ctx.fillStyle = colorAlpha(color, .85); ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -4); ctx.lineTo(-3, 0); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.strokeStyle = colorAlpha(color, .65); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(48, 0, 31 + eased * 8, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (game.scene.id === "hospital") {
    const actionX = 51 + eased * 12;
    if (player.combatClass.id === "melee") {
      ctx.strokeStyle = colorAlpha("#eafff8", .35 + eased * .6); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(7, 0, 58 + eased * 19, -.93, .93); ctx.stroke();
      ctx.strokeStyle = colorAlpha(color, .72); ctx.lineWidth = 2;
      for (const offset of [-19, -7, 7, 19]) { ctx.beginPath(); ctx.moveTo(27 + eased * 18, offset); ctx.lineTo(92 + eased * 26, offset * 1.35); ctx.stroke(); }
    } else if (player.combatClass.id === "ranger") {
      ctx.strokeStyle = colorAlpha(color, .38 + eased * .6); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(103 + eased * 20, 0); ctx.stroke();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(124 + eased * 14, 0); ctx.stroke();
      for (let i = 0; i < 3; i += 1) { ctx.strokeStyle = colorAlpha(color, .8 - i * .2); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(actionX + i * 18, 0, 8 + eased * 7 + i * 3, 0, Math.PI * 2); ctx.stroke(); }
    } else {
      ctx.save(); ctx.translate(actionX, 0); ctx.rotate(ambienceTime * 4.2);
      ctx.strokeStyle = colorAlpha(color, .9); ctx.lineWidth = 2; ctx.setLineDash([7, 4]); ctx.beginPath(); ctx.arc(0, 0, 22 + eased * 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.rotate(-ambienceTime * 7.4); ctx.strokeStyle = "#effff9"; ctx.beginPath(); ctx.arc(0, 0, 11 + eased * 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = color; ctx.fillRect(-3, -16, 6, 32); ctx.fillRect(-16, -3, 32, 6); ctx.restore();
      ctx.strokeStyle = colorAlpha(color, .7); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -18); ctx.quadraticCurveTo(28, -31 - eased * 8, 43, -8); ctx.stroke();
    }
  } else if (["city", "snow", "mars", "moon"].includes(game.scene.id)) {
    drawSurfaceThemeAttack(player, eased);
  } else if (player.combatClass.id === "mage") {
    const castX = 54 + eased * 9;
    ctx.shadowColor = color; ctx.shadowBlur = 20;
    ctx.strokeStyle = colorAlpha(color, .45 + eased * .5); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(castX, 0, 19 + eased * 11, 0, Math.PI * 2); ctx.stroke();
    ctx.save(); ctx.translate(castX, 0); ctx.rotate(ambienceTime * 4.5);
    ctx.strokeStyle = colorAlpha(color, .82); ctx.lineWidth = 2;
    const sides = fx === "drone" ? 4 : fx === "plasma" ? 8 : 6;
    ctx.beginPath(); for (let i = 0; i <= sides; i += 1) { const a = i * Math.PI * 2 / sides; if (i === 0) ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); else ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); } ctx.stroke();
    for (let i = 0; i < sides; i += 1) { const a = i / sides * Math.PI * 2; ctx.fillStyle = "#f5faff"; ctx.beginPath(); ctx.arc(Math.cos(a) * 24, Math.sin(a) * 24, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = colorAlpha(color, .9); ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(4, -10); ctx.quadraticCurveTo(21, -24 - eased * 11, 40, -6); ctx.stroke();
  } else if (player.combatClass.id === "melee") {
    ctx.strokeStyle = colorAlpha(color, .22 + eased * .7); ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(5, 0, 65 + eased * 9, -1.05, .95); ctx.stroke();
    ctx.strokeStyle = colorAlpha("#ffffff", eased * .8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(5, 0, 70, -.92, .72); ctx.stroke();
    for (let i = 0; i < 4; i += 1) { const x = 38 + i * 13; ctx.fillStyle = colorAlpha(color, .55 - i * .1); ctx.fillRect(x, -2 - i, 9, 4 + i * 2); }
  } else {
    const recoil = eased * 11;
    ctx.strokeStyle = colorAlpha(color, .35 + eased * .6); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(36 - recoil, 0); ctx.lineTo(96 + eased * 24, 0); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(122 + eased * 20, 0); ctx.stroke();
    ctx.fillStyle = "#e8ffff";
    for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.arc(44 + i * 8 + Math.sin(i * 9) * 3, Math.sin(i * 4.3) * 8, 1.7 + i * .18, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

function drawSurfaceThemeAttack(player, eased) {
  const sceneId = game.scene.id;
  const classId = player.combatClass.id;
  const color = player.combatClass.color;
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 9 + eased * 12;

  if (sceneId === "snow") {
    if (classId === "melee") {
      ctx.strokeStyle = colorAlpha("#eaffff", .3 + eased * .7); ctx.lineWidth = 13;
      ctx.beginPath(); ctx.arc(4, 0, 61 + eased * 10, -1.08, .93); ctx.stroke();
      for (let i = 0; i < 8; i += 1) { const a = -.85 + i * .23; const radius = 68 + eased * 7; ctx.save(); ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius); ctx.rotate(a); ctx.fillStyle = i % 2 ? "#9ee8ff" : "#ffffff"; ctx.beginPath(); ctx.moveTo(8 + i % 3, 0); ctx.lineTo(-4, -2.5); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill(); ctx.restore(); }
    } else if (classId === "ranger") {
      ctx.strokeStyle = colorAlpha("#9be9ff", .42 + eased * .5); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(126 + eased * 24, 0); ctx.stroke();
      ctx.fillStyle = "#f8ffff"; for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.moveTo(53 + i * 21, 0); ctx.lineTo(40 + i * 21, -5); ctx.lineTo(40 + i * 21, 5); ctx.closePath(); ctx.fill(); }
    } else {
      ctx.save(); ctx.translate(55 + eased * 8, 0); ctx.rotate(ambienceTime * 2.1);
      ctx.strokeStyle = colorAlpha("#dffbff", .8); ctx.lineWidth = 2;
      for (let arm = 0; arm < 6; arm += 1) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(25 + eased * 9, 0); ctx.lineTo(19 + eased * 7, -6); ctx.moveTo(19 + eased * 7, 0); ctx.lineTo(24 + eased * 8, 6); ctx.stroke(); }
      ctx.restore();
    }
    return;
  }

  if (sceneId === "mars") {
    if (classId === "melee") {
      const flame = ctx.createLinearGradient(15, 0, 112, 0); flame.addColorStop(0, colorAlpha("#ffd06a", .8)); flame.addColorStop(.45, colorAlpha("#ff683c", .65)); flame.addColorStop(1, "rgba(255,55,20,0)");
      ctx.fillStyle = flame; ctx.beginPath(); ctx.moveTo(17, -9); ctx.quadraticCurveTo(68, -42 - eased * 12, 119, -17); ctx.lineTo(134, 0); ctx.lineTo(119, 17); ctx.quadraticCurveTo(68, 42 + eased * 12, 17, 9); ctx.closePath(); ctx.fill();
    } else if (classId === "ranger") {
      ctx.strokeStyle = colorAlpha("#ffac5d", .5); ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(139, 0); ctx.stroke();
      ctx.strokeStyle = "#fff0c5"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(168 + eased * 16, 0); ctx.stroke();
      ctx.fillStyle = "#ff6b42"; for (let i = 0; i < 5; i += 1) ctx.fillRect(45 + i * 18, (i % 2 ? -1 : 1) * (5 + eased * 4), 10, 2);
    } else {
      ctx.save(); ctx.translate(57 + eased * 8, 0);
      ctx.fillStyle = colorAlpha("#ff7a45", .18 + eased * .35); ctx.beginPath(); ctx.arc(0, 0, 29 + eased * 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffd88f"; ctx.lineWidth = 2.5; for (let ring = 0; ring < 3; ring += 1) { ctx.beginPath(); ctx.ellipse(0, 0, 17 + ring * 9, 7 + ring * 4, ambienceTime * (ring % 2 ? -.8 : .7), 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    }
    return;
  }

  if (sceneId === "moon") {
    if (classId === "melee") {
      ctx.strokeStyle = colorAlpha("#d8d7ff", .35 + eased * .55); ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(4, 0, 60 + eased * 13, -1.02, .92); ctx.stroke();
      ctx.strokeStyle = "#94f4ff"; ctx.lineWidth = 2; for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(8, 0, 48 + i * 13 + eased * 5, -.82, .7); ctx.stroke(); }
    } else if (classId === "ranger") {
      for (let lane = -1; lane <= 1; lane += 1) { ctx.strokeStyle = lane ? colorAlpha("#9ef5ff", .48) : "#ffffff"; ctx.lineWidth = lane ? 3 : 1.7; ctx.beginPath(); ctx.moveTo(36, lane * 7); ctx.lineTo(145 + eased * 24, lane * 3); ctx.stroke(); }
    } else {
      ctx.save(); ctx.translate(57 + eased * 8, 0);
      ctx.strokeStyle = colorAlpha("#c4bfff", .75); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 31 + eased * 10, 13 + eased * 5, ambienceTime, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 13 + eased * 5, 31 + eased * 10, -ambienceTime * .7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#efffff"; ctx.beginPath(); ctx.arc(0, 0, 7 + eased * 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    return;
  }

  if (classId === "melee") {
    ctx.strokeStyle = colorAlpha("#ffdf74", .25 + eased * .72); ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(4, 0, 65 + eased * 9, -1.04, .93); ctx.stroke();
    ctx.fillStyle = colorAlpha("#ff923d", .75); for (let i = 0; i < 5; i += 1) ctx.fillRect(43 + i * 12, -3 + Math.sin(i * 3) * 8, 9, 5);
  } else if (classId === "ranger") {
    ctx.strokeStyle = colorAlpha("#ffdf8c", .5); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(31, 0); ctx.lineTo(138 + eased * 22, 0); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(174, 0); ctx.stroke();
    ctx.fillStyle = "#ffd057"; ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(21, -9); ctx.lineTo(21, 9); ctx.closePath(); ctx.fill();
  } else {
    ctx.save(); ctx.translate(54 + eased * 10, 0); ctx.rotate(ambienceTime * 2.8);
    ctx.strokeStyle = colorAlpha("#83eaff", .82); ctx.lineWidth = 2.2; ctx.beginPath(); for (let i = 0; i <= 6; i += 1) { const a = i * Math.PI / 3; const radius = i % 2 ? 18 : 29 + eased * 7; if (!i) ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius); else ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius); } ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#f5ffff"; for (let i = 0; i < 4; i += 1) { const a = i * Math.PI / 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 24, Math.sin(a) * 24, 3, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
  }
}

function drawSceneHeroOverlay(sceneId, color) {
  ctx.save();
  if (sceneId === "snow") {
    ctx.strokeStyle = "rgba(231,250,255,.88)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, -31, 20, Math.PI * .92, Math.PI * 2.08); ctx.stroke();
    ctx.fillStyle = "#88cde0"; ctx.fillRect(-22, -13, 42, 7);
    ctx.fillStyle = "#d9f5fa"; ctx.beginPath(); ctx.moveTo(15, -9); ctx.lineTo(29, 13); ctx.lineTo(18, 17); ctx.closePath(); ctx.fill();
  } else if (sceneId === "hospital") {
    ctx.fillStyle = "rgba(224,248,241,.9)";
    ctx.beginPath(); ctx.moveTo(-21, -12); ctx.lineTo(-29, 43); ctx.lineTo(29, 43); ctx.lineTo(20, -12); ctx.lineTo(0, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#31c99b"; ctx.fillRect(10, 7, 4, 15); ctx.fillRect(4, 12, 16, 4);
    ctx.strokeStyle = "#5a8f83"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-11, 7, 7, 0, Math.PI * 2); ctx.stroke();
  } else if (sceneId === "orbit") {
    ctx.fillStyle = "rgba(105,224,247,.18)"; ctx.strokeStyle = "rgba(155,244,255,.82)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -31, 25, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(36,82,112,.78)"; ctx.beginPath(); ctx.ellipse(0, -34, 18, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#506c91"; ctx.fillRect(-31, 0, 9, 25); ctx.fillRect(22, 0, 9, 25);
  } else if (sceneId === "mars") {
    ctx.fillStyle = "rgba(131,59,39,.84)"; ctx.beginPath(); ctx.moveTo(-24, -7); ctx.lineTo(-34, 47); ctx.lineTo(-8, 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,188,103,.65)"; ctx.fillRect(-18, -37, 36, 7);
    ctx.fillStyle = "#43251e"; ctx.beginPath(); ctx.roundRect(-11, -27, 22, 12, 5); ctx.fill();
    ctx.strokeStyle = colorAlpha(color, .7); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -21, 7, 0, Math.PI * 2); ctx.stroke();
  } else if (sceneId === "moon") {
    ctx.fillStyle = "rgba(224,229,255,.1)"; ctx.strokeStyle = "rgba(223,227,255,.78)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -31, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(82,80,117,.68)"; ctx.beginPath(); ctx.ellipse(0, -33, 18, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#d9d6ff"; ctx.beginPath(); ctx.moveTo(17, -49); ctx.lineTo(26, -65); ctx.stroke();
    ctx.fillStyle = "#b5f7ff"; ctx.beginPath(); ctx.arc(27, -67, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawCultivationAvatar(player, attack, facing) {
  const cast = Math.sin(attack * Math.PI);
  const attackActive = attack > 0;
  const attackPhase = attackActive ? 1 - Math.min(1, attack) : 0;
  const attackSmooth = attackPhase * attackPhase * (3 - 2 * attackPhase);
  const realmTier = Math.floor((player.level - 1) / 3);
  const visualTier = Math.min(14, 1 + Math.floor(Math.sqrt(realmTier + 1) * 2));
  const classIndex = player.combatClass.id === "melee" ? 0 : player.combatClass.id === "ranger" ? 1 : 2;
  ctx.save();
  for (let ring = 0; ring < Math.min(5, 1 + Math.floor(visualTier / 3)); ring += 1) {
    ctx.strokeStyle = colorAlpha(player.weapon.color, .38 - ring * .045); ctx.lineWidth = 1.4 + ring * .22;
    ctx.setLineDash(ring % 2 ? [7, 6] : []);
    ctx.beginPath(); ctx.ellipse(0, 29, 34 + ring * 11, 10 + ring * 4, ambienceTime * ((ring % 2 ? -1 : 1) * (.2 + ring * .05)), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.setLineDash([]);
  if (cultivatorHeroAtlas.complete && cultivatorHeroAtlas.naturalWidth) {
    const sourceWidth = cultivatorHeroAtlas.naturalWidth / 3;
    const baseSway = Math.sin(player.walkPhase) * .035;
    const weaponMotion = player.combatClass.id === "mage" ? -cast * .035 : (-.13 + attackSmooth * .29) * (attackActive ? 1 : 0);
    const thrust = player.combatClass.id === "mage" ? cast * 2 : cast * 5;
    ctx.save();
    ctx.translate(thrust, -cast * 3);
    ctx.rotate(baseSway + weaponMotion);
    ctx.drawImage(cultivatorHeroAtlas, sourceWidth * classIndex, 0, sourceWidth, cultivatorHeroAtlas.naturalHeight, -46, -89 - cast * 3, 92, 124);
    ctx.restore();
  } else {
    ctx.fillStyle = player.combatClass.color; ctx.fillRect(-18, -60, 36, 96);
  }
  const bladeCount = Math.min(12, player.swordCount);
  for (let i = 0; i < bladeCount; i += 1) {
    const angle = ambienceTime * (.72 + visualTier * .018) + i / bladeCount * Math.PI * 2;
    const radius = 54 + Math.min(34, visualTier * 2.4) + Math.sin(ambienceTime * 3 + i) * 4;
    ctx.save(); ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius * .42 - 18); ctx.rotate(angle + Math.PI / 2);
    ctx.shadowColor = player.weapon.color; ctx.shadowBlur = 16;
    ctx.fillStyle = colorAlpha(player.weapon.color, .24); ctx.fillRect(-4, -18, 8, 34);
    ctx.fillStyle = "#f4fff7"; ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(3.2, 9); ctx.lineTo(0, 14); ctx.lineTo(-3.2, 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#d8ae61"; ctx.fillRect(-7, 9, 14, 2.5); ctx.fillStyle = "#6f4e2e"; ctx.fillRect(-1.5, 11, 3, 8);
    ctx.strokeStyle = colorAlpha(player.weapon.color, .52); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, 31 + cast * 9); ctx.stroke(); ctx.restore();
  }
  if (cast > .08 && player.combatClass.id === "mage") {
    ctx.save(); ctx.translate(player.combatClass.id === "mage" ? 43 : 36, -18); ctx.rotate(ambienceTime * 4);
    ctx.strokeStyle = colorAlpha(player.weapon.color, .88); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 17 + cast * 10, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i += 1) { const a = i / 6 * Math.PI * 2; ctx.fillStyle = "#eaffee"; ctx.beginPath(); ctx.arc(Math.cos(a) * (20 + cast * 7), Math.sin(a) * (20 + cast * 7), 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}

function drawCultivatorSwordArm(player, attack, cast) {
  const active = attack > 0;
  const phase = active ? 1 - Math.min(1, attack) : 0;
  const smooth = phase * phase * (3 - 2 * phase);
  const hand = {
    x: active ? 11 + smooth * 22 : 18,
    y: active ? -29 - Math.sin(smooth * Math.PI) * 13 + smooth * 10 : -25,
  };
  const bladeAngle = active ? -1.34 + smooth * 2.18 : -.56;
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.fillStyle = "#24463c"; ctx.beginPath(); ctx.arc(hand.x - 3, hand.y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#edc7a2"; ctx.beginPath(); ctx.arc(hand.x, hand.y, 4.2, 0, Math.PI * 2); ctx.fill();
  ctx.translate(hand.x, hand.y); ctx.rotate(bladeAngle);
  ctx.fillStyle = "#6d4a25"; rr(-8, -3, 19, 6, 2); ctx.fill();
  ctx.fillStyle = "#d8ad5e"; ctx.fillRect(7, -8, 4, 16);
  const swordGlow = ctx.createLinearGradient(10, 0, 77, 0);
  swordGlow.addColorStop(0, "#ffffff"); swordGlow.addColorStop(.55, player.weapon.color); swordGlow.addColorStop(1, "rgba(169,255,224,.2)");
  ctx.fillStyle = swordGlow; ctx.shadowColor = player.weapon.color; ctx.shadowBlur = 9 + cast * 14;
  ctx.beginPath(); ctx.moveTo(10, -3.8); ctx.lineTo(70, -2); ctx.lineTo(84, 0); ctx.lineTo(70, 2.7); ctx.lineTo(10, 3.8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = colorAlpha("#ffffff", .9); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(14, -1.5); ctx.lineTo(72, -.7); ctx.stroke();
  ctx.restore();
}

function drawMeleeWeaponAction(sceneId, attack, color) {
  const active = attack > 0;
  const phase = active ? 1 - Math.min(1, attack) : 0;
  const smooth = phase * phase * (3 - 2 * phase);
  const pushStyle = ["hospital", "moon", "cultivation"].includes(sceneId);
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (pushStyle) {
    const push = active ? Math.sin(Math.min(1, phase) * Math.PI * .82) : 0;
    const shieldX = 29 + push * 25;
    const armor = sceneId === "hospital" ? "#d9f4eb" : sceneId === "moon" ? "#d9dcf3" : "#e8d8a4";
    ctx.fillStyle = colorAlpha(armor, .95);
    for (const yOffset of [-10, 10]) { ctx.beginPath(); ctx.arc(shieldX - 8, -4 + yOffset, 5.5, 0, Math.PI * 2); ctx.fill(); }
    const shieldGradient = ctx.createLinearGradient(shieldX - 9, -35, shieldX + 15, 27);
    shieldGradient.addColorStop(0, colorAlpha("#ffffff", .92));
    shieldGradient.addColorStop(.38, colorAlpha(color, .82));
    shieldGradient.addColorStop(1, colorAlpha(sceneId === "hospital" ? "#145f55" : sceneId === "moon" ? "#39385f" : "#70582d", .9));
    ctx.fillStyle = shieldGradient; ctx.strokeStyle = colorAlpha("#ffffff", .78); ctx.lineWidth = 2.2; ctx.shadowColor = color; ctx.shadowBlur = 9 + push * 15;
    ctx.beginPath(); ctx.moveTo(shieldX - 7, -37); ctx.quadraticCurveTo(shieldX + 20, -30, shieldX + 20, -4); ctx.quadraticCurveTo(shieldX + 17, 25, shieldX - 7, 33); ctx.quadraticCurveTo(shieldX - 17, -2, shieldX - 7, -37); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = colorAlpha("#ffffff", .42); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(shieldX - 3, -27); ctx.lineTo(shieldX + 9, 20); ctx.stroke();
    if (sceneId === "hospital") { ctx.fillStyle = "#effff9"; ctx.fillRect(shieldX + 2, -13, 5, 21); ctx.fillRect(shieldX - 6, -5, 21, 5); }
    else if (sceneId === "moon") { ctx.strokeStyle = "#a9f6ff"; ctx.beginPath(); ctx.arc(shieldX + 3, -3, 11 + push * 4, 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.strokeStyle = "#fff0a8"; ctx.beginPath(); ctx.arc(shieldX + 3, -3, 13 + push * 6, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    return;
  }

  const hand = { x: active ? 12 + smooth * 21 : 19, y: active ? -23 - Math.sin(smooth * Math.PI) * 12 + smooth * 8 : -20 };
  const weaponAngle = active ? -1.38 + smooth * 2.24 : -.58;
  ctx.fillStyle = sceneId === "snow" ? "#d8eff4" : sceneId === "mars" ? "#714032" : "#4a5560"; ctx.beginPath(); ctx.arc(hand.x - 3, hand.y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d7a982"; ctx.beginPath(); ctx.arc(hand.x, hand.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.translate(hand.x, hand.y); ctx.rotate(weaponAngle);
  ctx.fillStyle = "#252b2c"; rr(-8, -3, 21, 6, 2); ctx.fill();
  ctx.fillStyle = sceneId === "mars" ? "#ffc06d" : sceneId === "snow" ? "#e8ffff" : "#e9f4f5"; ctx.fillRect(8, -7, 4, 14);
  const blade = ctx.createLinearGradient(11, 0, 74, 0);
  if (sceneId === "mars") { blade.addColorStop(0, "#fff2b0");blade.addColorStop(.55, "#ff7045");blade.addColorStop(1, "rgba(255,55,25,.15)"); }
  else if (sceneId === "snow") { blade.addColorStop(0, "#ffffff");blade.addColorStop(.55, "#8eeaff");blade.addColorStop(1, "rgba(130,230,255,.15)"); }
  else { blade.addColorStop(0, "#ffffff");blade.addColorStop(.52, color);blade.addColorStop(1, colorAlpha(color, .12)); }
  ctx.fillStyle = blade; ctx.shadowColor = color; ctx.shadowBlur = 8 + (active ? 12 : 0);
  ctx.beginPath(); ctx.moveTo(11, -4); ctx.lineTo(67, -2.2); ctx.lineTo(80, 0); ctx.lineTo(67, 2.8); ctx.lineTo(11, 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.82)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, -1.6); ctx.lineTo(69, -.7); ctx.stroke();
  ctx.restore();
}

function drawEquippedGearVisuals() {
  const classGear = getClassGear(game.player.combatClass.id);
  const equipped = Object.fromEntries(gearSlots.map((slot) => [slot, getGearById(classGear[slot])]));
  const rarityColor = (item) => rarityDefinitions[item.rarity].color;
  const sceneAccent = game.scene.colors.shot;
  ctx.save();
  if (game.scene.id === "hospital") ctx.scale(1.08, 1.08);
  if (equipped.armor) {
    const color = rarityColor(equipped.armor);
    const plate = ctx.createLinearGradient(-22, -10, 22, 24); plate.addColorStop(0, colorAlpha("#ffffff", .35)); plate.addColorStop(.35, colorAlpha(sceneAccent, .42)); plate.addColorStop(1, colorAlpha(game.scene.colors.dark, .56));
    ctx.fillStyle = plate; ctx.strokeStyle = colorAlpha(sceneAccent, .82); ctx.lineWidth = 1.25; ctx.shadowColor = sceneAccent; ctx.shadowBlur = 4;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 8, -11); ctx.lineTo(side * 24, -8); ctx.lineTo(side * 27, 0); ctx.lineTo(side * 17, 3); ctx.lineTo(side * 7, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(-11, 14); ctx.lineTo(0, 20); ctx.lineTo(11, 14); ctx.lineTo(12, -5); ctx.stroke();
    ctx.strokeStyle = colorAlpha(sceneAccent, .62); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(9, 4); ctx.moveTo(-10, 11); ctx.lineTo(10, 11); ctx.stroke();
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 5; ctx.beginPath(); ctx.arc(0, 8, 1.8, 0, Math.PI * 2); ctx.fill();
    if (game.scene.id === "hospital") { ctx.fillStyle = "#eafff8"; ctx.fillRect(-1, 1, 2, 8); ctx.fillRect(-4, 4, 8, 2); }
  }
  if (equipped.helmet) {
    const color = rarityColor(equipped.helmet);
    ctx.strokeStyle = colorAlpha(color, .95); ctx.fillStyle = colorAlpha(color, .28); ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(0, -35, 20, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, -38); ctx.quadraticCurveTo(0, -59, 18, -38); ctx.lineTo(14, -29); ctx.quadraticCurveTo(0, -39, -14, -29); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = colorAlpha(sceneAccent, .9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-13, -35); ctx.quadraticCurveTo(0, -28, 13, -35); ctx.stroke();
    if (game.scene.id === "hospital") { ctx.fillStyle = "#dffff8"; ctx.fillRect(-2, -53, 4, 12); ctx.fillRect(-6, -49, 12, 4); }
    else { ctx.fillStyle = sceneAccent; ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(5, -49); ctx.lineTo(0, -43); ctx.lineTo(-5, -49); ctx.closePath(); ctx.fill(); }
  }
  if (equipped.gloves) {
    const color = rarityColor(equipped.gloves);
    ctx.fillStyle = colorAlpha(color, .72); ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.shadowColor = color; ctx.shadowBlur = 7;
    for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * 27, 7); ctx.rotate(side * -.18); rr(-6, -7, 12, 15, 4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = colorAlpha("#ffffff", .6); for (let y = -3; y <= 4; y += 3.5) { ctx.beginPath(); ctx.moveTo(-4, y); ctx.lineTo(4, y); ctx.stroke(); } ctx.restore(); }
  }
  if (equipped.boots) {
    const color = rarityColor(equipped.boots);
    ctx.strokeStyle = colorAlpha(sceneAccent, .86); ctx.lineWidth = 2.2; ctx.shadowColor = sceneAccent; ctx.shadowBlur = 5;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 6, 42); ctx.lineTo(side * 18, 43); ctx.lineTo(side * 21, 47); ctx.stroke(); }
  }
  if (equipped.relic) {
    const color = rarityColor(equipped.relic);
    const angle = ambienceTime * 1.8; const rx = Math.cos(angle) * 37; const ry = Math.sin(angle) * 12 - 12;
    ctx.save();
    ctx.translate(rx, ry); ctx.rotate(angle); ctx.fillStyle = colorAlpha(color, .78); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.shadowColor = color; ctx.shadowBlur = 13;
    if (game.scene.id === "hospital") { rr(-7, -10, 14, 20, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#eafff8"; ctx.fillRect(-2, -6, 4, 12); ctx.fillRect(-5, -3, 10, 4); }
    else { ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(7, -2); ctx.lineTo(4, 8); ctx.lineTo(-4, 8); ctx.lineTo(-7, -2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = sceneAccent; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  if (equipped.chip) {
    const color = rarityColor(equipped.chip);
    ctx.fillStyle = colorAlpha("#091315", .86); ctx.strokeStyle = color; ctx.lineWidth = 1.2; rr(-8, 12, 16, 12, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; for (let x = -5; x <= 5; x += 5) ctx.fillRect(x, 15, 2, 5);
    ctx.strokeStyle = colorAlpha(color, .7); ctx.beginPath(); ctx.moveTo(-12, 15); ctx.lineTo(-8, 15); ctx.moveTo(8, 15); ctx.lineTo(12, 15); ctx.stroke();
  }
  ctx.restore();
}

function drawCultivationSystems(player) {
  ctx.save(); ctx.translate(player.x, player.y);
  if (player.wardLevel > 0) {
    const radius = 55 + Math.min(38, player.wardLevel * 5);
    const wardGlow = ctx.createRadialGradient(0, 0, 15, 0, 0, radius); wardGlow.addColorStop(0, colorAlpha("#fff4bc", .07)); wardGlow.addColorStop(.72, colorAlpha("#f5d97e", .13)); wardGlow.addColorStop(1, colorAlpha("#f5d97e", 0));
    ctx.fillStyle = wardGlow; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.rotate(ambienceTime * .5); ctx.strokeStyle = colorAlpha("#fff0a3", .7 + Math.sin(ambienceTime * 4) * .12); ctx.lineWidth = 3; ctx.setLineDash([13, 7]);
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = colorAlpha("#fff8d0", .62); ctx.lineWidth = 1.7; ctx.beginPath(); ctx.arc(0, 0, radius * .72, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i += 1) { const a = i / 8 * Math.PI * 2; ctx.save(); ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius); ctx.rotate(a); ctx.fillStyle = "#fff1a7"; ctx.shadowColor = "#ffe074"; ctx.shadowBlur = 12; ctx.fillRect(-7, -2.5, 14, 5); ctx.restore(); }
    ctx.restore();
  }
  if (player.tribulationLevel > 0) {
    const stormWidth = 46 + player.tribulationLevel * 3;
    ctx.save(); ctx.translate(0, -88);
    const cloud = ctx.createRadialGradient(0, 0, 2, 0, 0, stormWidth); cloud.addColorStop(0, colorAlpha("#eefbd8", .34)); cloud.addColorStop(.45, colorAlpha("#57677b", .52)); cloud.addColorStop(1, colorAlpha("#1a2032", 0));
    ctx.fillStyle = cloud; ctx.beginPath(); ctx.ellipse(0, 0, stormWidth, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colorAlpha("#efffb6", .72); ctx.lineWidth = 2.4; ctx.shadowColor = "#dbff9d"; ctx.shadowBlur = 12;
    for (let bolt = 0; bolt < Math.min(4, 1 + Math.floor(player.tribulationLevel / 2)); bolt += 1) {
      const bx = -stormWidth * .55 + bolt * stormWidth * .37 + Math.sin(ambienceTime * 5 + bolt) * 5;
      ctx.beginPath(); ctx.moveTo(bx, 5); ctx.lineTo(bx - 5, 16); ctx.lineTo(bx + 3, 24); ctx.lineTo(bx - 2, 36); ctx.stroke();
    }
    ctx.restore();
  }
  if (player.talismanLevel > 0) {
    const count = Math.min(6, 2 + Math.floor(player.talismanLevel / 2));
    for (let i = 0; i < count; i += 1) {
      const a = -ambienceTime * .8 + i / count * Math.PI * 2;
      ctx.save(); ctx.translate(Math.cos(a) * 64, Math.sin(a) * 24 - 18); ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = "#f4dda0"; ctx.fillRect(-3, -7, 6, 14); ctx.fillStyle = "#b84b42"; ctx.fillRect(-1, -4, 2, 8); ctx.restore();
    }
  }
  if (player.spiritPets > 0) {
    for (let i = 0; i < player.spiritPets; i += 1) {
      const a = ambienceTime * 1.7 + i / player.spiritPets * Math.PI * 2;
      const px = Math.cos(a) * 66; const py = Math.sin(a) * 31 - 16 + Math.sin(ambienceTime * 5 + i) * 4;
      ctx.save(); ctx.translate(px, py); if (Math.cos(a) < 0) ctx.scale(-1, 1);
      ctx.fillStyle = "#ffe1a0"; ctx.strokeStyle = "#fff4ca"; ctx.lineWidth = 1.5; ctx.shadowColor = "#ffca67"; ctx.shadowBlur = 17;
      ctx.beginPath(); ctx.ellipse(0, 4, 13, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(12, -4, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -10); ctx.lineTo(9, -20); ctx.lineTo(14, -11); ctx.lineTo(18, -19); ctx.lineTo(19, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#6c3d2f"; ctx.beginPath(); ctx.arc(15, -5, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffd07b"; ctx.lineWidth = 4; for (let tail = 0; tail < Math.min(3, player.spiritPetLevel); tail += 1) { ctx.beginPath(); ctx.moveTo(-11, 4); ctx.quadraticCurveTo(-25 - tail * 5, -7 + tail * 8, -31 - tail * 5, 4 + tail * 5); ctx.stroke(); }
      ctx.strokeStyle = colorAlpha("#ffe2a0", .35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-19, 3); ctx.lineTo(-45, 3); ctx.stroke();
      ctx.restore();
    }
  }
  if (player.lotusLevel > 0) {
    ctx.fillStyle = colorAlpha("#ffe9a6", .18 + Math.sin(ambienceTime * 3) * .05);
    for (let i = 0; i < 8; i += 1) { const a = i / 8 * Math.PI * 2; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 28, 8, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  }
  ctx.restore();
}

function drawSupportDroneSystems(player) {
  if (!player.supportDroneLevel || game.scene.id === "cultivation") return;
  const count = Math.min(5, 1 + Math.floor((player.supportDroneLevel - 1) / 2));
  ctx.save(); ctx.translate(player.x, player.y - 12);
  for (let index = 0; index < count; index += 1) {
    const angle = ambienceTime * 1.35 + index / count * Math.PI * 2;
    const x = Math.cos(angle) * 52, y = Math.sin(angle) * 25;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
    ctx.shadowColor = "#73e9ff"; ctx.shadowBlur = 11; ctx.fillStyle = "#dffbff";
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(1, -6); ctx.lineTo(-9, -4); ctx.lineTo(-5, 0); ctx.lineTo(-9, 4); ctx.lineTo(1, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#62d9ff"; ctx.fillRect(-2, -7, 4, 14); ctx.restore();
  }
  ctx.restore();
}

function drawOrbitGalaxyDefense(player) {
  if (game.scene.id !== "orbit" || player.combatClass.id !== "melee") return;
  const state = getOrbitGalaxyState();
  ctx.save(); ctx.translate(player.x, player.y);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = colorAlpha("#8feaff", state.overdrive ? .72 : .3); ctx.lineWidth = state.overdrive ? 3 : 1.5;
  ctx.beginPath(); ctx.ellipse(0, 0, state.radius, state.radius * .52, 0, 0, Math.PI * 2); ctx.stroke();
  for (let index = 0; index < state.count; index += 1) {
    const angle = game.elapsed * state.speed + index / state.count * Math.PI * 2;
    const x = Math.cos(angle) * state.radius, y = Math.sin(angle) * state.radius * .52;
    const size = (state.overdrive ? 14 : 10) + index % 3 * 2;
    const color = ["#75eaff", "#b69cff", "#ffe391"][index % 3];
    const planet = ctx.createRadialGradient(x - size * .3, y - size * .35, 1, x, y, size);
    planet.addColorStop(0, "#ffffff"); planet.addColorStop(.28, color); planet.addColorStop(1, colorAlpha(color, .08));
    ctx.fillStyle = planet; ctx.shadowColor = color; ctx.shadowBlur = state.overdrive ? 24 : 13;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colorAlpha("#ffffff", .65); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, size * 1.65, size * .42, angle, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawBase() {
  const player = game.player;
  const x = player.x;
  const y = player.y;
  const moving = Math.hypot(game.move.x, game.move.y) > .05 || movementKeys.size > 0;
  const stride = Math.sin(player.walkPhase);
  const staticOrbitCraft = game.scene.id === "orbit" && player.combatClass.id === "melee";
  const bob = staticOrbitCraft ? 0 : moving ? -Math.abs(Math.sin(player.walkPhase)) * .22 : Math.sin(game.elapsed * 2.5) * .38;
  const attack = player.attackAnim;
  const classIndex = player.combatClass.id === "melee" ? 0 : player.combatClass.id === "ranger" ? 1 : 2;
  const facing = Math.cos(player.aimAngle) < 0 ? -1 : 1;
  ctx.save();
  if (game.invulnerable > 0) ctx.globalAlpha = .45 + Math.sin(game.elapsed * 24) * .3;
  const auraRadius = 34 + Math.min(18, player.level * 1.3);
  const aura = ctx.createRadialGradient(x, y, 2, x, y, auraRadius);
  aura.addColorStop(0, colorAlpha(player.combatClass.color, .24));
  aura.addColorStop(1, colorAlpha(player.combatClass.color, 0));
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(x, y, auraRadius, 0, Math.PI * 2); ctx.fill();
  if (game.divineTrialActive || game.divineOverdrive > 0) {
    const empowered = game.divineOverdrive > 0;
    ctx.save(); ctx.translate(x, y - 8); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = empowered ? "rgba(255,245,154,.92)" : "rgba(255,218,91,.66)";
    ctx.lineWidth = empowered ? 4 : 2;
    for (let ring = 0; ring < (empowered ? 3 : 2); ring += 1) {
      ctx.save(); ctx.rotate(ambienceTime * (ring % 2 ? -1.8 : 1.35)); ctx.setLineDash([8 + ring * 3, 7]);
      ctx.beginPath(); ctx.ellipse(0, 10, 40 + ring * 13, 17 + ring * 5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = empowered ? "rgba(255,245,170,.72)" : "rgba(255,222,102,.46)";
    for (let spark = 0; spark < (empowered ? 10 : 5); spark += 1) {
      const angle = ambienceTime * 2.4 + spark / (empowered ? 10 : 5) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(Math.cos(angle) * (43 + spark % 3 * 8), Math.sin(angle) * 21 - 6, empowered ? 2.5 : 1.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  drawEquipmentCombatAura(player);
  if (game.scene.endless) drawCultivationSystems(player);
  drawSupportDroneSystems(player);
  drawOrbitGalaxyDefense(player);
  ctx.fillStyle = "rgba(0,0,0,.38)"; ctx.beginPath(); ctx.ellipse(x, y + 29, 27, 9, 0, 0, Math.PI * 2); ctx.fill();
  if (moving) {
    ctx.strokeStyle = colorAlpha(player.combatClass.color, .25); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 18 - stride * 5, y + 31); ctx.lineTo(x - 31 - stride * 8, y + 34); ctx.moveTo(x + 18 + stride * 5, y + 31); ctx.lineTo(x + 31 + stride * 8, y + 34); ctx.stroke();
  }
  if (player.blockedPulse > 0) {
    ctx.strokeStyle = colorAlpha("#ffd06f", player.blockedPulse * 4.6); ctx.lineWidth = 3; ctx.setLineDash([7,5]);
    ctx.beginPath(); ctx.arc(x, y, 42 + (1 - player.blockedPulse / .18) * 16, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  const attackEase = Math.sin(attack * Math.PI);
  const recoil = player.combatClass.id === "ranger" ? attackEase * -9 : player.combatClass.id === "melee" ? attackEase * 9 : attackEase * -3;
  ctx.translate(x + Math.cos(player.aimAngle) * recoil, y + bob + Math.sin(player.aimAngle) * recoil);
  ctx.rotate(staticOrbitCraft ? 0 : (moving ? stride * .025 : 0) + attackEase * (player.combatClass.id === "melee" ? .055 : -.022));
  ctx.scale(1 + attackEase * .045, 1 - attackEase * .035);
  if (game.scene.id !== "orbit") ctx.scale(facing, 1);
  if (game.scene.id === "orbit") {
    drawOrbitCraft(player, moving, stride, attackEase);
  } else if (game.scene.id === "cultivation") {
    drawCultivationAvatar(player, attack, facing);
  } else {
    const activeAtlas = sceneHeroAtlases[game.scene.id] || heroAtlas;
    if (activeAtlas.complete && activeAtlas.naturalWidth) {
      const sourceWidth = activeAtlas.naturalWidth / 3;
      const width = game.scene.id === "hospital" ? 86 : 78;
      const height = game.scene.id === "hospital" ? 115 : 104;
      drawAnimatedHeroSprite(activeAtlas, sourceWidth * classIndex, sourceWidth, width, height, moving, stride, attack, player.combatClass.id, game.scene.id);
    } else {
      ctx.fillStyle = player.combatClass.color; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawEquipmentCombatAura(player) {
  const bonuses = getEquippedBonuses(player.combatClass.id);
  const equippedCount = Object.values(getClassGear(player.combatClass.id)).filter(Boolean).length;
  if (!equippedCount) return;
  ctx.save(); ctx.translate(player.x, player.y);
  if (bonuses.health > 0) {
    ctx.strokeStyle = colorAlpha("#78e9ff", .18 + Math.sin(ambienceTime * 3) * .05); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 7, 34 + equippedCount * 2, 15 + equippedCount, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (bonuses.damage > 0 || bonuses.crit > 0) {
    const count = Math.min(8, 2 + equippedCount);
    for (let i = 0; i < count; i += 1) { const a = ambienceTime * 1.2 + i / count * Math.PI * 2; ctx.fillStyle = colorAlpha(game.scene.colors.shot, .55); ctx.beginPath(); ctx.arc(Math.cos(a) * 39, Math.sin(a) * 18 - 12, 1.7, 0, Math.PI * 2); ctx.fill(); }
  }
  if (bonuses.pulse > 0) {
    ctx.strokeStyle = colorAlpha(player.combatClass.color, .33); ctx.lineWidth = 1.5; ctx.setLineDash([5,7]); ctx.rotate(-ambienceTime * .5);
    ctx.beginPath(); ctx.arc(0, -8, 49, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawOrbitCraft(player, moving, stride, attackEase) {
  const shipClass = player.combatClass.id;
  const pulse = Math.sin(ambienceTime * 17);
  const bank = moving ? stride * .035 : Math.sin(ambienceTime * 2) * .012;
  ctx.save();
  if (orbitShipAtlas.complete && orbitShipAtlas.naturalWidth) {
    const classIndex = shipClass === "melee" ? 0 : shipClass === "ranger" ? 1 : 2;
    const sourceWidth = orbitShipAtlas.naturalWidth / 3;
    const width = shipClass === "mage" ? 82 : shipClass === "melee" ? 75 : 68;
    const height = shipClass === "mage" ? 106 : 112;
    ctx.rotate(player.aimAngle + Math.PI / 2 + bank);
    ctx.scale(1 - attackEase * .03, 1 + attackEase * .04);
    const flame = 15 + (pulse + 1) * 4 + (moving ? 7 : 0);
    const engineGlow = ctx.createLinearGradient(0, height * .3, 0, height * .62 + flame);
    engineGlow.addColorStop(0, colorAlpha(player.combatClass.color, .9)); engineGlow.addColorStop(1, colorAlpha(player.combatClass.color, 0));
    ctx.fillStyle = engineGlow; ctx.shadowColor = player.combatClass.color; ctx.shadowBlur = 13;
    for (const engineX of shipClass === "mage" ? [-20, 20] : [-15, 15]) { ctx.beginPath(); ctx.moveTo(engineX - 5, height * .36); ctx.lineTo(engineX, height * .54 + flame); ctx.lineTo(engineX + 5, height * .36); ctx.closePath(); ctx.fill(); }
    ctx.drawImage(orbitShipAtlas, sourceWidth * classIndex, 0, sourceWidth, orbitShipAtlas.naturalHeight, -width / 2, -height / 2, width, height);
    ctx.restore();
    return;
  }
  ctx.rotate(bank);
  ctx.scale(1 - attackEase * .025, 1 + attackEase * .04);
  const thruster = 15 + pulse * 4 + (moving ? 8 : 0);
  const engine = ctx.createLinearGradient(-54 - thruster, 0, -30, 0);
  engine.addColorStop(0, "rgba(91,238,255,0)"); engine.addColorStop(1, colorAlpha(player.combatClass.color, .92));
  ctx.fillStyle = engine;
  for (const y of shipClass === "mage" ? [-15, 15] : [-9, 9]) { ctx.beginPath(); ctx.moveTo(-34, y - 4); ctx.lineTo(-54 - thruster, y); ctx.lineTo(-34, y + 4); ctx.closePath(); ctx.fill(); }
  ctx.shadowColor = player.combatClass.color; ctx.shadowBlur = 13;
  if (shipClass === "melee") {
    const hull = ctx.createLinearGradient(-38, -24, 42, 24); hull.addColorStop(0, "#233a58"); hull.addColorStop(.55, "#91b9d0"); hull.addColorStop(1, "#d8f5ff");
    ctx.fillStyle = hull; ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(22, -24); ctx.lineTo(-28, -27); ctx.lineTo(-43, -12); ctx.lineTo(-37, 0); ctx.lineTo(-43, 12); ctx.lineTo(-28, 27); ctx.lineTo(22, 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#172b48"; ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(10, -13); ctx.lineTo(-13, 0); ctx.lineTo(10, 13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = colorAlpha(player.combatClass.color, .88); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(25, 0, 22 + attackEase * 8, -1.1, 1.1); ctx.stroke();
  } else if (shipClass === "ranger") {
    ctx.fillStyle = "#b5d0df"; ctx.beginPath(); ctx.moveTo(58, 0); ctx.lineTo(9, -13); ctx.lineTo(-35, -22); ctx.lineTo(-24, -6); ctx.lineTo(-45, 0); ctx.lineTo(-24, 6); ctx.lineTo(-35, 22); ctx.lineTo(9, 13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#24365f"; rr(-25, -7, 57, 14, 6); ctx.fill();
    ctx.fillStyle = "#e9ffff"; rr(13, -3, 58 - attackEase * 8, 6, 3); ctx.fill();
    ctx.strokeStyle = colorAlpha(player.combatClass.color, .9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(23, -7); ctx.moveTo(-14, 18); ctx.lineTo(23, 7); ctx.stroke();
  } else {
    ctx.fillStyle = "#60709f"; ctx.beginPath(); ctx.moveTo(37, 0); ctx.lineTo(15, -19); ctx.lineTo(-20, -30); ctx.lineTo(-40, -18); ctx.lineTo(-30, 0); ctx.lineTo(-40, 18); ctx.lineTo(-20, 30); ctx.lineTo(15, 19); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1f294d"; ctx.beginPath(); ctx.ellipse(4, 0, 25, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = player.combatClass.color; ctx.beginPath(); ctx.arc(12, 0, 6 + attackEase * 3, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i += 1) { const a = ambienceTime * 1.8 + i / 3 * Math.PI * 2; ctx.save(); ctx.translate(Math.cos(a) * 49, Math.sin(a) * 24); ctx.rotate(a); ctx.fillStyle = "#bfeaff"; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -5); ctx.lineTo(-4, 0); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  ctx.fillStyle = "#84f5ff"; ctx.shadowBlur = 8; for (const y of [-6, 6]) { ctx.beginPath(); ctx.arc(-29, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

function drawAnimatedHeroSprite(atlas, sourceX, sourceWidth, width, height, moving, stride, attack, classId, sceneId) {
  const sourceHeight = atlas.naturalHeight;
  const topY = -height * .58;
  const split = .61;
  const overlap = .035;
  const step = moving ? stride : 0;
  const legLift = Math.abs(step) * 4.8;
  const bodyLean = moving ? step * -.018 : 0;
  const attackActive = attack > 0;
  const attackPhase = attackActive ? 1 - Math.min(1, attack) : 0;
  const attackSmooth = attackPhase * attackPhase * (3 - 2 * attackPhase);
  const attackPulse = attackActive ? Math.sin(attackPhase * Math.PI) : 0;
  const shieldPush = classId === "melee" && sceneId === "hospital";
  const weaponSwing = classId === "melee" && !shieldPush
    ? (-.14 + attackSmooth * .31) * (attackActive ? 1 : 0)
    : 0;
  const upperRecoil = classId === "ranger" ? -attackPulse * .075 : classId === "mage" ? -attackPulse * .035 : 0;
  const upperThrust = shieldPush ? attackPulse * 12 : classId === "ranger" ? -attackPulse * 5 : classId === "mage" ? attackPulse * 3 : attackPulse * 4;
  const upperLift = classId === "melee" ? -attackPulse * 3 : classId === "ranger" ? attackPulse * 1.5 : -attackPulse * 2;
  ctx.save();
  if (attackActive) {
    ctx.translate(upperThrust, upperLift);
    ctx.rotate(weaponSwing + upperRecoil);
    if (shieldPush) ctx.scale(1 + attackPulse * .08, 1 - attackPulse * .035);
    else if (classId === "melee") ctx.scale(1 + attackPulse * .035, 1 - attackPulse * .02);
    else if (classId === "ranger") ctx.scale(1 - attackPulse * .025, 1 + attackPulse * .018);
    ctx.drawImage(atlas, sourceX, 0, sourceWidth, sourceHeight, -width / 2, topY, width, height);
    ctx.restore();
    return;
  }

  const drawLeg = (side) => {
    const sourceLeft = sourceX + (side < 0 ? 0 : sourceWidth * .5);
    const phase = side < 0 ? step : -step;
    ctx.save();
    ctx.translate(side * phase * 2.2, legLift * (phase > 0 ? -.7 : .28));
    ctx.rotate(side * phase * .045);
    ctx.drawImage(
      atlas,
      sourceLeft,
      sourceHeight * (split - overlap),
      sourceWidth * .5,
      sourceHeight * (1 - split + overlap),
      side < 0 ? -width / 2 : 0,
      topY + height * (split - overlap),
      width * .5,
      height * (1 - split + overlap),
    );
    ctx.restore();
  };
  drawLeg(-1);
  drawLeg(1);

  ctx.save();
  ctx.translate(upperThrust, upperLift);
  ctx.rotate(bodyLean + weaponSwing + upperRecoil);
  ctx.transform(1, moving ? step * .012 : 0, 0, 1, 0, -Math.abs(step) * 1.5);
  ctx.drawImage(atlas, sourceX, 0, sourceWidth, sourceHeight * (split + overlap), -width / 2, topY, width, height * (split + overlap));
  ctx.restore();

  if (moving) {
    ctx.strokeStyle = colorAlpha(game.player.combatClass.color, .28);
    ctx.lineWidth = 2; ctx.lineCap = "round";
    const rear = step > 0 ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(rear * 12, height * .36); ctx.lineTo(rear * (20 + Math.abs(step) * 8), height * .38); ctx.stroke();
  }
  ctx.restore();
}

function drawCultivationHero(x, y) {
  const tier = Math.min(8, Math.floor((game.player.level - 1) / 3));
  ctx.save(); ctx.translate(x, y);
  for (let ring = 0; ring < Math.min(3, 1 + Math.floor(tier / 3)); ring += 1) {
    ctx.strokeStyle = colorAlpha(game.player.weapon.color, .28 - ring * .06); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 8, 29 + ring * 11 + Math.sin(ambienceTime * 2 + ring) * 3, 10 + ring * 4, ambienceTime * (.15 + ring * .05), 0, Math.PI * 2); ctx.stroke();
  }
  const blades = 2 + tier;
  ctx.fillStyle = colorAlpha(game.player.weapon.color, .72);
  for (let i = 0; i < blades; i += 1) {
    const a = ambienceTime * .7 + i / blades * Math.PI * 2;
    const radius = 34 + tier * 2;
    ctx.save(); ctx.translate(Math.cos(a) * radius, Math.sin(a) * radius * .34); ctx.rotate(a + Math.PI / 2); ctx.fillRect(-1, -7, 2, 14); ctx.restore();
  }
  ctx.fillStyle = "#d9eee2"; ctx.beginPath(); ctx.moveTo(-11, -6); ctx.lineTo(-19, 28); ctx.lineTo(19, 28); ctx.lineTo(11, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#213d34"; ctx.fillRect(-2, -5, 4, 33);
  ctx.fillStyle = "#e9c5a6"; ctx.beginPath(); ctx.arc(0, -19, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#182b25"; ctx.beginPath(); ctx.arc(0, -22, 10, Math.PI, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.rotate(game.player.aimAngle); ctx.fillStyle = game.player.weapon.color; ctx.fillRect(0, -2, 38, 4); ctx.fillStyle = "#f6fff4"; ctx.fillRect(19, -1, 25, 2); drawMuzzle(47, game.player.weapon.color); ctx.restore();
  ctx.restore();
}

function drawBarrier() {
  const healthRatio = game.health / game.maxHealth;
  const colors = game.scene.colors;
  const wallGradient = ctx.createLinearGradient(0, BASE_Y - 28, 0, H);
  wallGradient.addColorStop(0, healthRatio < 0.3 ? "#78433b" : colors.wall);
  wallGradient.addColorStop(1, colors.dark);
  ctx.fillStyle = wallGradient;
  ctx.fillRect(0, BASE_Y - 8, W, H - BASE_Y + 8);

  if (game.scene.id === "snow") {
    ctx.fillStyle = "#e7f5f7";
    ctx.beginPath();ctx.moveTo(0,BASE_Y-10);for(let x=0;x<=W;x+=28)ctx.quadraticCurveTo(x+14,BASE_Y-32-(x%56)*.08,x+28,BASE_Y-13);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
  } else if (game.scene.id === "orbit") {
    ctx.fillStyle="#515a86";ctx.fillRect(0,BASE_Y-19,W,22);
    ctx.strokeStyle="rgba(145,240,255,.5)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,BASE_Y-18);ctx.lineTo(W,BASE_Y-18);ctx.stroke();
    for(let x=8;x<W;x+=46){ctx.fillStyle="#212744";rr(x,BASE_Y-15,35,14,3);ctx.fill();}
  } else if (game.scene.id === "hospital") {
    ctx.fillStyle="#dcebe6";for(let x=-8;x<W+20;x+=43){rr(x,BASE_Y-24,35,26,4);ctx.fill();}
    ctx.fillStyle="#3fc69a";ctx.fillRect(0,BASE_Y-7,W,5);
  } else {
    ctx.fillStyle = colors.wall;
    for (let x = -8; x < W + 20; x += 43) { rr(x, BASE_Y - 24, 35, 26, 4); ctx.fill(); }
  }
  ctx.strokeStyle = colorAlpha(colors.shot,.23);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, BASE_Y + 3);
  ctx.lineTo(W, BASE_Y + 3);
  ctx.stroke();

  if (healthRatio < 0.7) {
    ctx.strokeStyle = "rgba(15,15,18,.52)";
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.ceil((1 - healthRatio) * 9); i += 1) {
      const x = 24 + (i * 73) % 340;
      ctx.beginPath();
      ctx.moveTo(x, BASE_Y - 18);
      ctx.lineTo(x + 7, BASE_Y - 5);
      ctx.lineTo(x + 2, BASE_Y + 7);
      ctx.stroke();
    }
  }
}

function drawTurretHero(x, y) {
  ctx.fillStyle = "#17241c";
  ctx.beginPath();
  ctx.arc(x, y + 11, 30, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#7b9383";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(game.player.aimAngle);
  ctx.fillStyle = "#b2c3b5";
  rr(0, -5, 35, 10, 4);
  ctx.fill();
  ctx.fillStyle = "#5e7163";
  rr(-9, -12, 22, 24, 7);
  ctx.fill();
  if (game.player.muzzle > 0) {
    ctx.fillStyle = `rgba(255,238,135,${game.player.muzzle})`;
    ctx.beginPath();
    ctx.moveTo(36, 0);
    ctx.lineTo(48, -8);
    ctx.lineTo(44, 0);
    ctx.lineTo(48, 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = "#c2ff53";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnowHero(x, y) {
  const angle = game.player.aimAngle;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle="#2f5c78";ctx.beginPath();ctx.ellipse(0,11,17,25,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#f0c8a6";ctx.beginPath();ctx.arc(0,-19,11,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#c7423d";ctx.beginPath();ctx.arc(0,-22,12,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-13,-23,26,5);
  ctx.fillStyle="#e7f5f8";ctx.fillRect(-17,-3,34,7);
  ctx.save();ctx.rotate(angle);ctx.strokeStyle="#f0c8a6";ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(27,0);ctx.stroke();ctx.fillStyle="#f4fbff";ctx.beginPath();ctx.arc(34,0,6,0,Math.PI*2);ctx.fill();drawMuzzle(42,game.scene.colors.shot);ctx.restore();
  ctx.fillStyle="#101c25";ctx.beginPath();ctx.arc(-4,-20,1.4,0,Math.PI*2);ctx.arc(4,-20,1.4,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawDoctorHero(x, y) {
  const angle=game.player.aimAngle;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle="#e7f3ef";ctx.beginPath();ctx.moveTo(-12,-4);ctx.lineTo(-20,29);ctx.lineTo(20,29);ctx.lineTo(12,-4);ctx.closePath();ctx.fill();
  ctx.fillStyle="#39bd91";ctx.fillRect(-2,-3,4,29);ctx.fillRect(-10,10,20,4);
  ctx.fillStyle="#e4b99d";ctx.beginPath();ctx.arc(0,-18,10,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#63d4b2";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-19,12,Math.PI,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#243c36";ctx.fillRect(-7,-19,5,2);ctx.fillRect(2,-19,5,2);
  ctx.save();ctx.rotate(angle);ctx.fillStyle="#cfddd9";rr(0,-4,30,8,3);ctx.fill();ctx.fillStyle="#53efbc";ctx.fillRect(7,-2,15,4);ctx.fillStyle="#fff";ctx.fillRect(27,-1,10,2);drawMuzzle(41,game.scene.colors.shot);ctx.restore();
  ctx.restore();
}

function drawShipHero(x, y) {
  const angle=game.player.aimAngle;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.fillStyle="#9da8d8";ctx.beginPath();ctx.moveTo(36,0);ctx.lineTo(-13,-20);ctx.lineTo(-7,-7);ctx.lineTo(-25,-5);ctx.lineTo(-25,5);ctx.lineTo(-7,7);ctx.lineTo(-13,20);ctx.closePath();ctx.fill();
  ctx.fillStyle="#2a3975";ctx.beginPath();ctx.ellipse(7,0,13,6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#72efff";ctx.fillRect(-28,-4,7,3);ctx.fillRect(-28,1,7,3);drawMuzzle(42,game.scene.colors.shot);ctx.restore();
}

function drawRoverHero(x, y) {
  const angle=game.player.aimAngle;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle="#34241d";for(const wx of[-17,17]){ctx.beginPath();ctx.arc(wx,14,9,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d58a4d";ctx.lineWidth=2;ctx.stroke();}
  ctx.fillStyle="#b76a3d";rr(-24,-5,48,20,6);ctx.fill();ctx.fillStyle="#ffcf70";ctx.fillRect(-16,1,9,4);ctx.fillRect(7,1,9,4);
  ctx.save();ctx.rotate(angle);ctx.fillStyle="#d89a59";rr(-5,-7,39,14,5);ctx.fill();ctx.fillStyle="#493026";ctx.fillRect(16,-3,23,6);drawMuzzle(45,game.scene.colors.shot);ctx.restore();
  ctx.restore();
}

function drawMoonHero(x, y) {
  const angle=game.player.aimAngle;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle="#d9d9ed";rr(-19,-9,38,35,10);ctx.fill();ctx.fillStyle="#62658a";ctx.fillRect(-12,5,24,10);ctx.fillStyle="#c9f1ff";rr(-13,-24,26,20,8);ctx.fill();ctx.fillStyle="#242844";rr(-9,-20,18,10,5);ctx.fill();
  ctx.save();ctx.rotate(angle);ctx.fillStyle="#f0efff";rr(0,-5,32,10,4);ctx.fill();ctx.fillStyle="#9b9cbd";ctx.fillRect(21,-3,18,6);drawMuzzle(45,game.scene.colors.shot);ctx.restore();
  ctx.strokeStyle="#d9d9ed";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-10,22);ctx.lineTo(-14,34);ctx.moveTo(10,22);ctx.lineTo(14,34);ctx.stroke();ctx.restore();
}

function drawMuzzle(distance, color) {
  if (game.player.muzzle <= 0) return;
  ctx.fillStyle=colorAlpha(color,game.player.muzzle);
  ctx.beginPath();ctx.moveTo(distance,0);ctx.lineTo(distance+11,-7);ctx.lineTo(distance+7,0);ctx.lineTo(distance+11,7);ctx.closePath();ctx.fill();
}

function drawFloater(floater) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, floater.life * 3);
  ctx.font = `900 ${floater.size}px system-ui`;
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(0,0,0,.7)";
  ctx.lineWidth = 3;
  ctx.strokeText(floater.text, floater.x, floater.y);
  ctx.fillStyle = floater.color;
  ctx.fillText(floater.text, floater.x, floater.y);
  ctx.restore();
}

function drawBanner() {
  if (!game.banner.time) return;
  const alpha = Math.min(1, game.banner.time * 1.8, (2.3 - game.banner.time) * 2.5);
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  const y = 187;
  const gradient = ctx.createLinearGradient(20, 0, W - 20, 0);
  gradient.addColorStop(0, "rgba(6,15,9,0)");
  gradient.addColorStop(0.25, "rgba(7,17,11,.75)");
  gradient.addColorStop(0.75, "rgba(7,17,11,.75)");
  gradient.addColorStop(1, "rgba(6,15,9,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(34, y - 27, W - 68, 55);
  ctx.fillStyle = (!game.scene.endless && game.wave === TOTAL_WAVES) || game.boss ? "#ff8d7d" : game.scene.colors.shot;
  ctx.font = "900 18px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(game.banner.text, W / 2, y - 1);
  ctx.fillStyle = "#aab6ad";
  ctx.font = "500 9px system-ui";
  ctx.fillText(game.banner.sub, W / 2, y + 15);
  ctx.restore();
}

function drawHomeSilhouettes() {
  const scene = scenes[selectedSceneIndex];
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = scene.colors.shot;
  if (scene.id === "hospital") {
    for (let i = 0; i < 12; i += 1) {
      const x = 16 + i * 36; const y = 220 + (i % 3) * 28;
      ctx.beginPath();ctx.arc(x,y,7+i%3*2,0,Math.PI*2);ctx.fill();
      for(let j=0;j<6;j+=1){const a=j/6*Math.PI*2;ctx.fillRect(x+Math.cos(a)*13-1,y+Math.sin(a)*13-1,2,2);}
    }
  } else if (scene.id === "orbit") {
    for(let i=0;i<8;i+=1){const x=19+i*52;const y=224+(i%3)*31;ctx.beginPath();ctx.moveTo(x+13,y);ctx.lineTo(x-10,y-8);ctx.lineTo(x-5,y);ctx.lineTo(x-10,y+8);ctx.closePath();ctx.fill();}
  } else {
    for (let i = 0; i < 10; i += 1) {
      const x = 18 + i * 41 + Math.sin(ambienceTime * 0.5 + i) * 4;
      const y = 220 + (i % 3) * 17;
      ctx.beginPath();ctx.arc(x,y,9+(i%2)*3,0,Math.PI*2);ctx.fill();ctx.fillRect(x-7,y+7,14,36);
    }
  }
  ctx.restore();
}

function rr(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function shade(hex, amount) {
  const value = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (value & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

function colorAlpha(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function getRealmName(level) {
  const realms = ["炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "大乘", "渡劫"];
  const stages = ["初期", "中期", "后期"];
  const safeLevel = Math.max(1, level);
  const tier = Math.floor((safeLevel - 1) / 3);
  if (tier < realms.length) return `${realms[tier]}${stages[(safeLevel - 1) % 3]}`;
  const immortalRealms = ["散仙", "地仙", "天仙", "真仙", "玄仙", "金仙", "太乙金仙", "大罗金仙", "混元圣境", "道祖境"];
  const immortalTier = tier - realms.length;
  const cycle = Math.floor(immortalTier / immortalRealms.length) + 1;
  const realm = immortalRealms[immortalTier % immortalRealms.length];
  const stage = stages[(safeLevel - 1) % 3];
  return cycle === 1 ? `${realm}${stage}` : `${realm}·${cycle}转${stage}`;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function unlockAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
}

function setMuted(nextMuted) {
  muted = nextMuted;
  ui.mute.textContent = muted ? "×" : "⌁";
  ui.mute.setAttribute("aria-label", muted ? "开启音效" : "关闭音效");
  if (!muted) unlockAudio();
}

function tone(frequency, duration, type = "sine", volume = 0.03, endMultiplier = 1) {
  if (muted || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * endMultiplier), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function frame(now) {
  const rawDt = (now - lastFrame) / 1000 || 0;
  const dt = Math.min(0.034, rawDt);
  lastFrame = now;
  ambienceTime += dt;
  if (game && rawDt < .1) {
    const performanceState = game.performance;
    performanceState.slowFrames = rawDt > .023 ? Math.min(20, performanceState.slowFrames + 1) : Math.max(0, performanceState.slowFrames - 1);
    performanceState.quality = performanceState.slowFrames >= 9 ? .52 : performanceState.slowFrames >= 4 ? .74 : 1;
  }
  if (mode === "playing" && !paused) update(dt);
  render();
  requestAnimationFrame(frame);
}

ui.guestLogin.addEventListener("click", () => {
  unlockAudio();
  mode = "home";
  ui.login.classList.add("hidden");
  ui.home.classList.remove("hidden");
  switchHomePanel("command");
  tone(392, .18, "triangle", .035, 1.8);
});
document.querySelectorAll("[data-login-provider]").forEach((button) => button.addEventListener("click", () => {
  showToast(`${button.dataset.loginProvider}登录接口已预留，原型阶段请先以游客进入`);
}));
ui.commandTab.addEventListener("click", () => switchHomePanel("command"));
ui.openMap.addEventListener("click", () => switchHomePanel("world"));
ui.quickArmory.addEventListener("click", () => switchHomePanel("armory"));
ui.nextObjective.addEventListener("click", () => openRetentionPanel("daily"));
ui.start.addEventListener("click", () => openLoadout("main"));
ui.retry.addEventListener("click", () => {
  if (selectedSceneIndex > 0 && !isSceneUnlocked(selectedSceneIndex)) {
    returnHome();
    openRetentionPanel("skins");
    return;
  }
  openLoadout(lastRunType);
});
ui.homeButton.addEventListener("click", returnHome);
ui.previousScene.addEventListener("click", () => selectScene(selectedSceneIndex - 1));
ui.nextScene.addEventListener("click", () => selectScene(selectedSceneIndex + 1));
ui.worldTab.addEventListener("click", () => switchHomePanel("world"));
ui.baseTab.addEventListener("click", () => switchHomePanel("base"));
ui.armoryTab.addEventListener("click", () => switchHomePanel("armory"));
ui.coinStoreButton.addEventListener("click", () => {
  renderCoinStore();
  ui.coinStoreModal.classList.remove("hidden");
});
ui.energyButton.addEventListener("click", () => {
  refreshDailyState();
  if (meta.energy.current >= meta.energy.max) { showToast("体力已满，无需恢复"); return; }
  if (meta.energy.adRestores >= 3) { showToast("今日体力广告恢复次数已用完"); return; }
  openAdDemo(() => {
    meta.energy.current = Math.min(meta.energy.max, meta.energy.current + 3);
    meta.energy.adRestores += 1;
    saveMeta();
    renderHome();
    showToast(`体力已恢复至 ${meta.energy.current}/${meta.energy.max}`);
  }, false);
});
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => ui.coinStoreModal.classList.add("hidden")));
document.querySelector("[data-close-retention]").addEventListener("click", () => ui.retentionModal.classList.add("hidden"));
document.querySelectorAll("[data-retention-panel]").forEach((button) => button.addEventListener("click", () => openRetentionPanel(button.dataset.retentionPanel)));
document.querySelector("[data-close-loadout]").addEventListener("click", () => ui.loadoutModal.classList.add("hidden"));
ui.freeCoinAdButton.addEventListener("click", () => openAdDemo(() => {
  meta.coins += 80;
  saveMeta();
  renderHome();
  showToast("广告奖励到账 ◆80");
}));
ui.claimAdReward.addEventListener("click", () => {
  if (!pendingAdReward || ui.claimAdReward.disabled) return;
  const pending = pendingAdReward;
  pendingAdReward = null;
  if (pending.usesDailyLimit) {
    meta.adState.watched += 1;
  }
  refreshDailyState();
  meta.daily.ads += 1;
  saveMeta();
  ui.adModal.classList.add("hidden");
  pending.reward();
});
ui.reviveAdButton.addEventListener("click", () => {
  ui.reviveModal.classList.add("hidden");
  if (game?.pendingDivineRevive) {
    const classId = game.player.combatClass.id;
    const definition = divineGearDefinitions[classId];
    openAdDemo(() => {
      if (!game) return;
      grantDivineGearUnlock(classId);
      game.pendingDivineRevive = false;
      activateDivineRescueOverdrive();
      paused = false;
    }, false, {
      title: "终章救援 · 永久神器",
      icon: definition.icon,
      headline: `${definition.name}完全解放`,
      detail: "永久解锁 + 满血复活 + 本局横推神威",
      claimLabel: "解锁并复活",
    });
    return;
  }
  openAdDemo(() => {
    if (!game) return;
    game.lives = 1;
    game.health = game.maxHealth;
    game.enemies = game.enemies.filter((enemy) => Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) > 260);
    paused = false;
    game.banner = { text: "逆命重生", sub: "一道命数已重塑", time: 2.5 };
  }, false);
});
ui.endEndlessButton.addEventListener("click", () => {
  ui.reviveModal.classList.add("hidden");
  if (game) game.pendingDivineRevive = false;
  finishGame(false);
});
ui.pause.addEventListener("click", () => togglePause());
ui.pauseResume.addEventListener("click", () => togglePause(false));
ui.pauseExit.addEventListener("click", () => {
  pointerMove.active = false;
  if (game) game.move = { x: 0, y: 0 };
  returnHome();
  showToast("已退出本局，未结算战斗收益");
});
let lastTouchPulseAt = 0;
ui.pulse.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;
  event.preventDefault();
  event.stopPropagation();
  lastTouchPulseAt = performance.now();
  activatePulse();
});
ui.pulse.addEventListener("click", () => {
  if (performance.now() - lastTouchPulseAt > 450) activatePulse();
});
ui.unequipAllGear.addEventListener("click", unequipAllGear);
ui.mute.addEventListener("click", () => {
  setMuted(!muted);
});

function updatePointerMovement(event) {
  if (!game || mode !== "playing" || paused) return;
  if (event.pointerType !== "mouse" && pointerMove.touchId !== event.pointerId) return;
  const rect = canvas.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) {
    if (event.pointerType === "mouse") { pointerMove.active = false; game.move = { x: 0, y: 0 }; }
    return;
  }
  pointerMove.x = (event.clientX - rect.left) / rect.width * W;
  pointerMove.y = (event.clientY - rect.top) / rect.height * H;
  pointerMove.active = true;
  const touch = event.pointerType !== "mouse";
  pointerMove.touchMode = touch;
  const dx = pointerMove.x - (touch ? pointerMove.originX : W / 2);
  const dy = pointerMove.y - (touch ? pointerMove.originY : H / 2);
  const distance = Math.hypot(dx, dy);
  const deadZone = touch ? 7 : 34;
  const strength = Math.min(1, Math.max(0, (distance - deadZone) / (touch ? 52 : 125)));
  game.move.x = distance > deadZone ? dx / distance * strength : 0;
  game.move.y = distance > deadZone ? dy / distance * strength : 0;
}

window.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" || event.target.closest("button, .modal, .upgrade-card")) return;
  pointerMove.touchId = event.pointerId;
  const rect = canvas.getBoundingClientRect();
  pointerMove.originX = (event.clientX - rect.left) / rect.width * W;
  pointerMove.originY = (event.clientY - rect.top) / rect.height * H;
  pointerMove.x = pointerMove.originX;
  pointerMove.y = pointerMove.originY;
  canvas.setPointerCapture?.(event.pointerId);
  updatePointerMovement(event);
});
window.addEventListener("pointermove", updatePointerMovement);
window.addEventListener("pointerup", (event) => {
  if (event.pointerId !== pointerMove.touchId) return;
  pointerMove.touchId = null;
  pointerMove.active = false;
  if (game) game.move = { x: 0, y: 0 };
});
window.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== pointerMove.touchId) return;
  pointerMove.touchId = null;
  pointerMove.active = false;
  if (game) game.move = { x: 0, y: 0 };
});

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
    movementKeys.add(event.code);
    event.preventDefault();
  }
  if (event.code === "Space") {
    event.preventDefault();
    activatePulse();
  }
  if (event.key.toLowerCase() === "p") togglePause();
});
window.addEventListener("keyup", (event) => movementKeys.delete(event.code));

document.addEventListener("visibilitychange", () => {
  if (document.hidden && mode === "playing" && !paused) togglePause(true);
});

if (QA_MODE) {
  window.__zombieGame = {
    snapshot: () => game ? {
      mode,
      elapsed: game.elapsed,
      wave: game.wave,
      health: game.health,
      enemies: game.enemies.length,
      kills: game.kills,
      level: game.player.level,
      realm: game.scene.endless ? getRealmName(game.player.level) : null,
      lives: game.lives,
      corpses: game.corpses.length,
      position: { x: game.player.x, y: game.player.y },
      director: game.director,
      combatClass: game.player.combatClass.id,
      boss: game.boss ? game.boss.hp : null,
    } : { mode },
    skipToBoss: () => { if (game) game.elapsed = game.waveSeconds * 5; },
    grantLevel: () => { if (game) gainXp(game.player.xpNeeded); },
    forceDeath: () => { if (game) { game.health = 0; handlePlayerDeath(); } },
  };
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js?v=45", { updateViaCache: "none" });
      await registration.update();
      registration.waiting?.postMessage("SKIP_WAITING");
    } catch (error) {
      // The game stays fully playable without offline caching.
    }
  });
}

renderHome();
if (QA_MODE || ADMIN_MODE) {
  ui.login.classList.add("hidden");
  ui.home.classList.remove("hidden");
  switchHomePanel("command");
}
requestAnimationFrame(frame);
