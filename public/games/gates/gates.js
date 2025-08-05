const config = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  backgroundColor: '#222',
  parent: 'phaser-game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload,
    create
  }
};

const game = new Phaser.Game(config);

// Load images
function preload() {
  const basePath = 'assets/symbols/';

  this.load.image('crown', basePath + 'crown.png');
  this.load.image('hourglass', basePath + 'hourglass.png');
  this.load.image('ring', basePath + 'ring.png');
  this.load.image('chalice', basePath + 'chalice.png');

  this.load.image('gem_red', basePath + 'gem_red.png');
  this.load.image('gem_purple', basePath + 'gem_purple.png');
  this.load.image('gem_yellow', basePath + 'gem_yellow.png');
  this.load.image('gem_green', basePath + 'gem_green.png');
  this.load.image('gem_blue', basePath + 'gem_blue.png');
  this.load.image('scatter', basePath + 'scatter.png');

  // Load Orbs
  this.load.image('orb_green', 'assets/orbs/green_orb.png');
  this.load.image('orb_blue', 'assets/orbs/blue_orb.png');
  this.load.image('orb_purple', 'assets/orbs/purple_orb.png');
  this.load.image('orb_red', 'assets/orbs/red_orb.png');


  // Load background and frame
  this.load.image('gridBackground', 'assets/grid_background.png'); // Background image (purple, ancient writings, etc.)
  this.load.image('gridFrame', 'assets/grid_frame.png'); // Frame image (golden edges)

  // Load Map Parts
  this.load.image('mapBackground', 'assets/map_background.jpg'); // Whole map background image (palace and pillars)
  this.load.image('mapBackground2', 'assets/map_background2.png'); // Additional part of the map if needed

  // Load Blue Map Parts
  this.load.image('blueMapBackground', 'assets/blue_map_background.png'); // Whole map background image (palace and pillars)
  this.load.image('blueMapBackground2', 'assets/blue_map_background2.png'); // Additional part of the map if needed

  
  // Load Fire Sprite
  this.load.spritesheet('fire_spritesheet1', 'assets/fire_spritesheet1.png', {
    frameWidth: 192, // The width of each frame (960 / 5 frames = 192px)
    frameHeight: 253 // The height of each frame
  });

  // Load Blue Fire Sprite
  this.load.spritesheet('blue_fire_spritesheet1', 'assets/blue_fire_spritesheet1.png', {
    frameWidth: 192, // The width of each frame (960 / 5 frames = 192px)
    frameHeight: 253 // The height of each frame
  });
  
  // Load Highlight Sprite
  this.load.spritesheet('highlight', 'assets/effects/highlight.png', {
    frameWidth: 175,
    frameHeight: 175
  });
  
  // Load Impact Particle Sprite
  this.load.spritesheet('impactParticle', 'assets/particles/impact.png', {
    frameWidth: 150, // Replace with correct width
    frameHeight: 150 // Replace with correct height
  });

  // Load Explosion Particle Sprite
  this.load.spritesheet('explodeParticle', 'assets/particles/explosion.png', {
    frameWidth: 500,
    frameHeight: 500
  });

  // Load Spin UI Icon for spin button
  this.load.image('spinIcon', 'assets/ui/spin_icon.png'); // replace with your actual path

  // Load Slogan
  this.load.image('slogan', 'assets/slogan.png'); // replace with your actual path

  // Load WinTab Background 
  this.load.image('winTabBg', 'assets/UI/win_tab.png');
  
  // Load Numbers Sprite (for winTab)
  this.load.spritesheet('numberFont', 'assets/ui/numbers.png', {
    frameWidth: 160,  // 1920px / 12 characters = 160px each
    frameHeight: 176
  });

  // Load History Table
  this.load.image('history_frame', 'assets/ui/history_frame.png');
  this.load.image('history_bg', 'assets/ui/history_bg.png');
  this.load.image('history_slot', 'assets/ui/history_slot.png');

  // Load Thunder Spritesheets For Orbs
  this.load.spritesheet('blueThunder', 'assets/orbs/blue_thunder.png', {
    frameWidth: 267, frameHeight: 483
  });
  this.load.spritesheet('greenThunder', 'assets/orbs/green_thunder.png', {
    frameWidth: 267, frameHeight: 483
  });
  this.load.spritesheet('purpleThunder', 'assets/orbs/purple_thunder.png', {
    frameWidth: 267, frameHeight: 483
  });
  this.load.spritesheet('redThunder', 'assets/orbs/red_thunder.png', {
    frameWidth: 267, frameHeight: 483
  });

  // Load Buy Free Spin Main Button And Texts
  this.load.image('buyFreeSpinsButton', 'assets/ui/buyFreeSpins.png');
  this.load.image('buyFreeSpinsTextOnly', 'assets/ui/buyFreeSpinsTextOnly.png');
  this.load.image('buyFreeSpinsBonusText', 'assets/ui/buyFreeSpinsBonusText.png');

  // Load Buy Free Spin Button Font
  this.load.spritesheet('buyFont', 'assets/ui/font_buyFreeSpins.png', {
    frameWidth: 89,   // ← Set this to the correct width per character
    frameHeight: 130   // ← Set this to the correct height per character
  });
  
  // --- UI Assets for Buy Free Spins Confirmation Popup ---
  this.load.image('buyFreeSpinsPopupBg', 'assets/ui/buyFreeSpinsPopupBg.png');
  this.load.image('buttonX', 'assets/ui/buttonX.png');
  this.load.image('buttonCheck', 'assets/ui/buttonCheck.png');
  
  // Load Scatter Symbol Animation
  this.load.spritesheet('scatterAnim', 'assets/symbols/scatter_anim.png', {
    frameWidth: 427, // replace with your frame width
    frameHeight: 338 // replace with your frame height
  });

  // Load Congrats Pop Up Message
  this.load.image('congratsGlow', 'assets/ui/congratsGlow.png');
  this.load.image('congratsBorder', 'assets/ui/congratsBorder.png');
  this.load.image('CongratsText', 'assets/ui/CongratsText.png');

  // Load Entire Screen Thunder Animation Spritesheet
  this.load.spritesheet('screenThunder', 'assets/effects/screenThunder.png', {
    frameWidth: 500,
    frameHeight: 900
  });
  
  // Multiplier pillar background
  this.load.image('multiplier_pillar', 'assets/ui/multiplier_pillar.png');

  // Purple flame animation (7 frames)
  this.load.spritesheet('purple_flame', 'assets/ui/purple_flame.png', {
  frameWidth: 200,  // 1400 / 7 frames = 200px per frame
  frameHeight: 200
  });

  // Free Spins UI
  this.load.image('spins_remaining_border', 'assets/ui/spins_remaining_border.png');

  // Custom font for spins remaining (characters: 0123456789,$£)
  this.load.spritesheet('spins_remaining_font', 'assets/ui/spins_remaining_font.png', {
   frameWidth: 89, // 1157px / 13 characters = ~89px per frame
   frameHeight: 130
  });

  // Load Zues Idle Spritesheet
  this.load.spritesheet('zues_idle', 'assets/zues_idle.png', {
    frameWidth: 363,
    frameHeight: 718
  });
  
  // Load Zues Lightning Spritesheet
  this.load.spritesheet('zues_lightning', 'assets/zues_lightning.png', {
    frameWidth: 498,
    frameHeight: 863
  });
  
  // Load Zues Thunder Strike Spritesheet
  this.load.spritesheet('thunder_strike', 'assets/thunder_strike.png', {
    frameWidth: 397,
    frameHeight: 441
  });

  // Load Big Win Assets
  this.load.image('bigwinBase', 'assets/ui/bigwin/base.png');
  this.load.image('bigwinWingLeft', 'assets/ui/bigwin/wing_left.png');
  this.load.image('bigwinWingRight', 'assets/ui/bigwin/wing_right.png');
  this.load.image('bigwinGlow', 'assets/ui/bigwin/big_win_glow.png');
  this.load.image('bigwinTab', 'assets/ui/bigwin/big_win_tab.png');
  this.load.image('bigwinNice', 'assets/ui/bigwin/nice.png');
  this.load.image('bigwinMega', 'assets/ui/bigwin/mega.png');
  this.load.image('bigwinSuperb', 'assets/ui/bigwin/superb.png');
  this.load.image('bigwinSensational', 'assets/ui/bigwin/sensational.png');
  this.load.spritesheet('bigwinCoin', 'assets/ui/bigwin/big_win_coin.png', {
  frameWidth: 184,
  frameHeight: 218
  });

  // Load Big Win Font Spritesheet
  this.load.spritesheet('bigWinFont', 'assets/ui/bigwin/big_win_font.png', {
    frameWidth: 88,
    frameHeight: 104
  });

  // Load Antte Bet Toggle Assets
  this.load.image('anteBorder', 'assets/ui/ante_border.png');
  this.load.image('toggleBorder', 'assets/ui/toggle_border.png');
  this.load.image('toggleKey', 'assets/ui/toggle_key.png');
  this.load.image('toggleArrow', 'assets/ui/toggle_arrow.png');
  this.load.image('toggleCheck', 'assets/ui/toggle_check.png');

  // Load Info Button Icons
  this.load.image('infoIcon', 'assets/ui/info_icon.png');
  this.load.image('closeIcon', 'assets/ui/close_icon.png');
  this.load.image('nextButton', 'assets/ui/next_page_button.png');  
  this.load.image('prevButton', 'assets/ui/prev_page_button.png');
  this.load.image('volitilityIcon', 'assets/ui/volatility_icon.png');
  this.load.image('plusIcon', 'assets/ui/plus_icon.png');
  this.load.image('minusIcon', 'assets/ui/minus_icon.png');
  this.load.image('settingsIcon', 'assets/ui/settings_icon.png');
  this.load.image('cashIcon', 'assets/ui/cash_icon.png');
  this.load.image('linkIcon', 'assets/ui/link_icon.png');

  // Load Advanced Bet Settings Stuff
  this.load.image('advancedPlus', 'assets/ui/advanced_plus.png');
  this.load.image('advancedMinus', 'assets/ui/advanced_minus.png');

  //Load AutoPlay Settings Stuff
  this.load.image('autoplayIcon', 'assets/ui/autoplay_icon.png');
  this.load.image('scrollIcon', 'assets/ui/scroll_icon.png');
  this.load.image('scrollIcon2', 'assets/ui/scroll_icon2.png');
  this.load.image('autoplaySpinIcon', 'assets/ui/autoplay_spin_icon.png');
  this.load.image('homeIcon', 'assets/ui/home_icon.png');

  
  // Load Sound Effects
  this.load.audio('sfx_spinButton', 'assets/sounds/spin_button_sound.ogg');
  this.load.audio('sfx_basicButton', 'assets/sounds/basic_button_sound.ogg');
  this.load.audio('sfx_freeMainButton', 'assets/sounds/free_main_button_sound.ogg');
  this.load.audio('sfx_freeYesButton', 'assets/sounds/free_yes_button_sound.ogg');
  this.load.audio('sfx_freeNoButton', 'assets/sounds/free_no_button_sound.ogg');
  this.load.audio('sfx_betAnte', 'assets/sounds/bet_ante_button_sound.ogg');
  this.load.audio('sfx_symbolsMatch', 'assets/sounds/symbols_match_sound.ogg');
  this.load.audio('sfx_symbolsExplode', 'assets/sounds/symbols_explode_sound.ogg');
  this.load.audio('sfx_zuesLightning', 'assets/sounds/zues_lightning_sound.ogg');
  this.load.audio('sfx_orbLightning', 'assets/sounds/orb_lightning_sound.ogg');
  this.load.audio('sfx_congratsPopup', 'assets/sounds/congrats_popup_sound.ogg');
  this.load.audio('sfx_scatterMatch', 'assets/sounds/scatter_match_sound.ogg');
  this.load.audio('sfx_reelsDrop', 'assets/sounds/reels_drop_sound.ogg');
  this.load.audio('sfx_orbFlying', 'assets/sounds/orbs_flying_sound.ogg');
  this.load.audio('sfx_multiplierFlying', 'assets/sounds/multiplier_flying_sound.ogg');
  this.load.audio('sfx_screenThunder', 'assets/sounds/screen_thunder_sound.ogg');
  this.load.audio('sfx_wintabMerge', 'assets/sounds/wintab_merge_sound.ogg');
  // Main and Free Mode BG Theme Songs
  this.load.audio('sfx_mainThemeSong', 'assets/sounds/main_theme_song.ogg');
  this.load.audio('sfx_freeThemeSong', 'assets/sounds/free_spins_theme_song.ogg');
}

// Define Numbers Map
const charMap = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  ',': 10,
  '.': 11,
  'x': 12
};

// Define Font SpriteSheet (for Buy Free Spins Button)
const fontCharMap = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  ',': 10,
  '$': 11,
  '£': 12,
  '.': 13
};

////////////////////////////////////////////// Free spins global states ///////////////////////////////////////////////////////////

// Multiplier pillar
let multiplierNumberSprites = [];

// Free Spins Global State
let isInFreeSpins = false;
let remainingFreeSpins = 0;
let totalFreeSpinsWon = 0;
let freeSpinsTotalWin = 0;
let freeSpinsGlobalMultiplier = 0;

////////////////////////////////////////////// Weights for odds of certain symbols dropping ////////////////////////////////////////

// Weights based on estimated rarity from Gates of Olympus
const symbolWeights = {
  crown: 2,
  hourglass: 3,
  ring: 4,
  chalice: 5,
  gem_red: 10,
  gem_purple: 10,
  gem_yellow: 10,
  gem_green: 10,
  gem_blue: 10
};

// Create weighted pool
const weightedPool = [];
for (const [key, weight] of Object.entries(symbolWeights)) {
  for (let i = 0; i < weight; i++) {
    weightedPool.push(key);
  }
}

// Function to pick based on weights
function pickWeightedSymbol(pool) {
  return Phaser.Utils.Array.GetRandom(pool);
}

////////////////////////////////////////////////////////// Weights for odds of Orbs dropping ////////////////////////////////////////////////

// Orb Appearance Chance
const ORB_APPEARANCE_CHANCE = 0.02; // 0.2% per cell


// Define Orb Color Weights
const orbColorWeights = [
  { color: 'green', weight: 60 },
  { color: 'blue', weight: 25 },
  { color: 'purple', weight: 10 },
  { color: 'red', weight: 5 }
];

// Function to pick based on Orb Color Weights
function pickWeightedColor(colors) {
  const total = colors.reduce((sum, c) => sum + c.weight, 0);
  let rand = Math.random() * total;
  for (const entry of colors) {
    rand -= entry.weight;
    if (rand <= 0) return entry.color;
  }
  return colors[colors.length - 1].color; // fallback
}


// Define Orb Value Weights
const orbValuePools = {
  green: [
    { value: 2, weight: 40 },
    { value: 3, weight: 30 },
    { value: 4, weight: 20 },
    { value: 5, weight: 10 },
  ],
  blue: [
    { value: 6, weight: 30 },
    { value: 8, weight: 30 },
    { value: 10, weight: 25 },
    { value: 12, weight: 10 },
    { value: 15, weight: 5 },
  ],
  purple: [
    { value: 16, weight: 25 },
    { value: 20, weight: 25 },
    { value: 25, weight: 20 },
    { value: 30, weight: 15 },
    { value: 40, weight: 10 },
    { value: 50, weight: 5 },
  ],
  red: [
    { value: 100, weight: 80 },
    { value: 250, weight: 15 },
    { value: 500, weight: 5 },
  ]
};

// Function to pick based on Orb Value Weights
function pickWeightedRandom(pool) {
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const item of pool) {
    rand -= item.weight;
    if (rand <= 0) return item;
  }
  return pool[pool.length - 1]; // Fallback
}

////////////////////////////////////////////////////// SCATTER SYMBOL SPAWN CHANCE ////////////////////////////////////////////////////////////////

const SCATTER_CHANCE = 0.01; // 0.2%
let processedScatterPositions = false;

/////////////////////////////////////////////////////// WIN AMOUNT TABLE /////////////////////////////////////////////////////////////////////////

const payoutTable = {
  crown: {
    '8-9': 10,
    '10-11': 25,
    '12-30': 50
  },
  hourglass: {
    '8-9': 2.5,
    '10-11': 10,
    '12-30': 25
  },
  ring: {
    '8-9': 2,
    '10-11': 5,
    '12-30': 15
  },
  chalice: {
    '8-9': 1.5,
    '10-11': 2,
    '12-30': 12
  },
  gem_red: {
    '8-9': 1,
    '10-11': 1.5,
    '12-30': 10
  },
  gem_purple: {
    '8-9': 0.8,
    '10-11': 1.2,
    '12-30': 8
  },
  gem_yellow: {
    '8-9': 0.5,
    '10-11': 1,
    '12-30': 5
  },
  gem_green: {
    '8-9': 0.4,
    '10-11': 0.9,
    '12-30': 4
  },
  gem_blue: {
    '8-9': 0.25,
    '10-11': 0.75,
    '12-30': 2
  },
  scatter: {
    '4': 3,
    '5': 5,
    '6': 100
  }
};

// Count Cascades as Array
this.pendingSymbolCounts = [];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////// Global Balance & Betting State ////////

// Text element for showing current balance (e.g., $10.00 or LBP 10000)
let balanceText;

// Current bet amount in the selected currency
let betAmount = 1.0;

// Currency selector: 'USD' or 'LBP'
let selectedCurrency = 'USD';

// Balances per currency
let userBalanceUSD = 0;
let userBalanceLBP = 0;

// Bet limits and step increments
let minBet = 0.20; // Change to let to allow modification
let maxBet = 100.00; // Change to let to allow modification
let betStep = 0.20; // Change to let to allow modification

// Advanced Settings Bets
let betLevel = 1; // 1–10
let coinValueIndex = 0;
const usdCoinValues = [0.01, 0.03, 0.05, 0.10, 0.20, 0.50];
const lbpCoinValues = [1000, 3000, 5000, 10000, 20000, 50000];


////////////////////////////////////////////


function create() {
  const cols = 6;
  const rows = 5;

  const designWidth = 720;
  const designHeight = 1280;

  const gridWidth = 710;
  const gridHeight = 465;
  const boxWidth = gridWidth / cols;
  const boxHeight = gridHeight / rows;

  const centerX = designWidth / 2;
  const centerY = designHeight / 2 - 14;

  const gridYOffset = -180; // Move grid and frame up

  // Main container to scale everything
  const gameContainer = this.add.container(0, 0);
  
  // Zues Animation Cooldown
  this.canTriggerZeus = true;

  // Quick Spin toggle state
  this.quickSpinEnabled = false;

  // Sound Mute toggle state
  this.soundMuted = false;

  // Orbs Thunder Animation
  this.anims.create({
    key: 'blueThunderAnim',
    frames: this.anims.generateFrameNumbers('blueThunder', { start: 0, end: 3 }),
    frameRate: 12, // Adjust if needed for speed
    repeat: 0, 
    hideOnComplete: true
  });
  this.anims.create({
    key: 'greenThunderAnim',
    frames: this.anims.generateFrameNumbers('greenThunder', { start: 0, end: 3 }),
    frameRate: 12,
    repeat: 0,
    hideOnComplete: true
  });
  this.anims.create({
    key: 'purpleThunderAnim',
    frames: this.anims.generateFrameNumbers('purpleThunder', { start: 0, end: 3 }),
    frameRate: 12,
    repeat: 0,
    hideOnComplete: true
  });
  this.anims.create({
    key: 'redThunderAnim',
    frames: this.anims.generateFrameNumbers('redThunder', { start: 0, end: 3 }),
    frameRate: 12,
    repeat: 0,
    hideOnComplete: true
  });

  // Entire Screen Thunder Animation runner
  this.anims.create({
    key: 'screenThunderAnim',
    frames: this.anims.generateFrameNumbers('screenThunder', { start: 0, end: 10 }),
    frameRate: 12,
    hideOnComplete: true
  });

  // Create the purple flame animation
 this.anims.create({
  key: 'flame_burn',
  frames: this.anims.generateFrameNumbers('purple_flame', { start: 0, end: 6 }),
  frameRate: 10,
  repeat: -1
 });

  // Fire Animation sprite runner
  this.anims.create({
    key: 'pillarFire1',
    frames: this.anims.generateFrameNumbers('fire_spritesheet1', { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1
  });

  // Blue Fire Animation Sprite Runner
  this.anims.create({
    key: 'bluePillarFire1',
    frames: this.anims.generateFrameNumbers('blue_fire_spritesheet1', { start: 0, end: 4 }),
    frameRate: 10,
    repeat: -1
  });  

  this.anims.create({
    key: 'highlightAnim',
    frames: this.anims.generateFrameNumbers('highlight', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'impactAnim',
    frames: this.anims.generateFrameNumbers('impactParticle', { start: 0, end: 5 }),
    frameRate: 20,
    hideOnComplete: true
  });

  this.anims.create({
    key: 'explodeAnim',
    frames: this.anims.generateFrameNumbers('explodeParticle', { start: 0, end: 14 }),
    frameRate: 16,
    hideOnComplete: true
  });
  
  this.anims.create({
    key: 'scatterPulse',
    frames: this.anims.generateFrameNumbers('scatterAnim', { start: 0, end: 3 }),
    frameRate: 6,
    repeat: -1 
  });

  // Zues Idle Animation Runner
  this.anims.create({
    key: 'zues_idle_anim',
    frames: this.anims.generateFrameNumbers('zues_idle', { start: 0, end: 3 }),
    frameRate: 1, // Adjust speed as needed
    repeat: -1    // Loop forever
  });

  // Zues Lightning Animation (6 frames)
  this.anims.create({
   key: 'zues_lightning_anim',
   frames: this.anims.generateFrameNumbers('zues_lightning', { start: 0, end: 9 }),
   frameRate: 7,
   repeat: 0
  });

 // Thunder Strike Animation (7 frames)
 this.anims.create({
   key: 'thunder_strike_anim',
   frames: this.anims.generateFrameNumbers('thunder_strike', { start: 0, end: 6 }),
   frameRate: 18,
   repeat: 0
 });

 // Big Win Coin Flip Animation (11 frames)
 this.anims.create({
   key: 'bigwinCoinSpin',
   frames: this.anims.generateFrameNumbers('bigwinCoin', { start: 0, end: 10 }),
   frameRate: 20, // You can tweak this speed
   repeat: -1     // Loop indefinitely
 });

 // Load Sound Effects 
 this.sounds = {
  sfx_spinButton: this.sound.add('sfx_spinButton'),
  sfx_basicButton: this.sound.add('sfx_basicButton'),
  sfx_freeMainButton: this.sound.add('sfx_freeMainButton'),
  sfx_freeYesButton: this.sound.add('sfx_freeYesButton'),
  sfx_freeNoButton: this.sound.add('sfx_freeNoButton'),
  sfx_betAnte: this.sound.add('sfx_betAnte'),
  sfx_symbolsMatch: this.sound.add('sfx_symbolsMatch'),
  sfx_symbolsExplode: this.sound.add('sfx_symbolsExplode'),
  sfx_zuesLightning: this.sound.add('sfx_zuesLightning'),
  sfx_orbLightning: this.sound.add('sfx_orbLightning'),
  sfx_congratsPopup: this.sound.add('sfx_congratsPopup'),
  sfx_scatterMatch: this.sound.add('sfx_scatterMatch'),
  sfx_reelsDrop: this.sound.add('sfx_reelsDrop'),
  sfx_orbFlying: this.sound.add('sfx_orbFlying'),
  sfx_multiplierFlying: this.sound.add('sfx_multiplierFlying'),
  sfx_screenThunder: this.sound.add('sfx_screenThunder'),
  sfx_wintabMerge: this.sound.add('sfx_wintabMerge'),
  sfx_mainThemeSong: this.sound.add('sfx_mainThemeSong'),
  sfx_freeThemeSong: this.sound.add('sfx_freeThemeSong'),
  // add more here
};

// Play Main Theme Song Initially on load
this.sounds.sfx_mainThemeSong.play({ loop: true, volume: 0.5 });


  // --- Full game background part 1 ---
  const mapBg = this.add.image(centerX, centerY, 'mapBackground');
  mapBg.setDisplaySize(720, 1280);
  mapBg.setDepth(-10);
  gameContainer.add(mapBg);

  const fire1 = this.add.sprite(centerX - 350, centerY + 220, 'fire_spritesheet1');
  fire1.play('pillarFire1').setScale(0.8).setDepth(-9.5);
  gameContainer.add(fire1);

  const fireLeftInner = this.add.sprite(centerX - 280, centerY + 285, 'fire_spritesheet1');
  fireLeftInner.play('pillarFire1').setScale(0.65).setDepth(-9.5);
  gameContainer.add(fireLeftInner);

  const fire2 = this.add.sprite(centerX + 370, centerY + 225, 'fire_spritesheet1');
  fire2.play('pillarFire1').setScale(0.9).setDepth(-9.5);
  gameContainer.add(fire2);

  const fireRightInner = this.add.sprite(centerX + 295, centerY + 290, 'fire_spritesheet1');
  fireRightInner.play('pillarFire1').setScale(0.65).setDepth(-9.5);
  gameContainer.add(fireRightInner);

  // --- Full game background part 2 ---
  const mapBg2 = this.add.image(centerX, centerY, 'mapBackground2');
  mapBg2.setDisplaySize(720, 1320).setDepth(-9);
  gameContainer.add(mapBg2);

  // --- Full blue game background part 1 ---
  this.blueMapBg = this.add.image(centerX, centerY, 'blueMapBackground');
  this.blueMapBg.setDisplaySize(720, 1280);
  this.blueMapBg.setDepth(-8);
  this.blueMapBg.setVisible(false);
  gameContainer.add(this.blueMapBg);

  // --- Blue fire sprites (hidden initially) ---
  this.blueFire1 = this.add.sprite(centerX - 330, centerY + 220, 'blue_fire_spritesheet1');
  this.blueFire1.play('bluePillarFire1').setScale(0.6).setDepth(-9.5).setVisible(false);
  gameContainer.add(this.blueFire1);

  this.blueFireLeftInner = this.add.sprite(centerX - 270, centerY + 285, 'blue_fire_spritesheet1');
  this.blueFireLeftInner.play('bluePillarFire1').setScale(0.5).setDepth(-9.5).setVisible(false);
  gameContainer.add(this.blueFireLeftInner);

  this.blueFire2 = this.add.sprite(centerX + 340, centerY + 225, 'blue_fire_spritesheet1');
  this.blueFire2.play('bluePillarFire1').setScale(0.6).setDepth(-9.5).setVisible(false);
  gameContainer.add(this.blueFire2);

  // --- Full blue game background part 2 ---
  this.blueMapBg2 = this.add.image(centerX, centerY, 'blueMapBackground2');
  this.blueMapBg2.setDisplaySize(720, 1320).setDepth(-7);
  this.blueMapBg2.setVisible(false);
  gameContainer.add(this.blueMapBg2);

  // SLOGAN
  const slogan = this.add.image(centerX - 125, centerY - 550, 'slogan');
  slogan.setDepth(20);
  gameContainer.add(slogan);

//////////////////////////////////////// Win Tab  /////////////////////////////////////////////////////////////////////////

// Create win tab container (always visible for now)
this.winTabContainer = this.add.container(centerX, centerY - gridHeight / 2 - 212); // Adjust Y as needed

// Add background image to container
const winTabBg = this.add.image(0, 0, 'winTabBg');
winTabBg.setOrigin(0.5); // Center the image

// Set scale factor to adjust the width (if needed)
const scaleFactorX = 1.2;  // Width scale factor (1 means no scaling)

// Set height scale factor to slightly increase the height
const scaleFactorY = 1.3;  // Height scale factor (slightly increase the height)

// Apply scaling
winTabBg.setScale(scaleFactorX, scaleFactorY);

this.winTabContainer.add(winTabBg);

// Initially set opacity to 0 instead of hiding the win tab container
this.winTabContainer.setAlpha(0); // Set opacity to 0 (invisible but still in the scene)

//////////////////////////////////////// Shadow Gradient effect beneath BALANCE AND BET AMOUNT  /////////////////////////////////////////////////////////////////////////

// 1. Create second gradient texture (put this once in preload or create)
const width2 = 710;
const height2 = 70;

const rt2 = this.textures.createCanvas('horizontalGradient2', width2, height2);
const ctx2 = rt2.getContext();

const gradient2 = ctx2.createLinearGradient(0, 0, width2, 0);
gradient2.addColorStop(0, 'rgba(0,0,0,0)');
gradient2.addColorStop(0.25, 'rgba(0,0,0,0.3)');
gradient2.addColorStop(0.5, 'rgba(0,0,0,0.4)');  // darker center
gradient2.addColorStop(0.75, 'rgba(0,0,0,0.3)');
gradient2.addColorStop(1, 'rgba(0,0,0,0)');

ctx2.fillStyle = gradient2;
ctx2.fillRect(0, 0, width2, height2);
rt2.refresh();

// 2. Add the second gradient shadow image standalone, position manually:
const gradientShadow2 = this.add.image(
  centerX,
  centerY + 538, // change this Y value as needed
  'horizontalGradient2'
);

gradientShadow2.setOrigin(0.5, 0); // center horizontally, top aligned vertically


//////////////////////////////////////// Shadow Gradient effect beneath plain text  /////////////////////////////////////////////////////////////////////////

// 1. Create gradient texture (put this once in preload or create)
const width = 710;
const height = 80;

const rt = this.textures.createCanvas('horizontalGradient', width, height);
const ctx = rt.getContext();

const gradient = ctx.createLinearGradient(0, 0, width, 0);
gradient.addColorStop(0, 'rgba(0,0,0,0)');
gradient.addColorStop(0.25, 'rgba(0,0,0,0.4)');
gradient.addColorStop(0.5, 'rgba(0,0,0,0.7)');  // darker center
gradient.addColorStop(0.75, 'rgba(0,0,0,0.4)');
gradient.addColorStop(1, 'rgba(0,0,0,0)');


ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);
rt.refresh();

// 2. Add the gradient shadow image standalone, position manually:
const gradientShadow = this.add.image(
  centerX,
  centerY + 60,
  'horizontalGradient'
);

gradientShadow.setOrigin(0.5, 0); // center horizontally, top aligned vertically

//////////////////////////////////////// Plain Text Win Amount  /////////////////////////////////////////////////////////////////////////

// Create a container to hold WIN text and number text together
this.winTextContainer = this.add.container(centerX, centerY + 100).setVisible(false);

// Create the WIN text (yellow)
this.winLabel = this.add.text(
  0, 0,
  'WIN ',
  {
    fontFamily: 'GatesFont',
    fontSize: '50px',
    fill: '#f6ae41',  // yellow
  }
)
.setOrigin(1, 0.5); // origin right-center so it aligns nicely before the numbers

// Create the numbers text (white)
this.plainTextWin = this.add.text(
  0, 0,
  '',
  {
    fontFamily: 'GatesFont',
    fontSize: '48px',
    fill: '#ffffff',  // white
  }
)
.setOrigin(0, 0.5); // origin left-center, right after WIN label

// Add both texts to the container
this.winTextContainer.add([this.winLabel, this.plainTextWin]);
this.winTextContainer.setScale(1, 1.2);
this.displayedWinValue = 0;    // current displayed value
this.winTween = null;          // reference to the active tween

//////////////////////////////////////// Plain Text GAME MESSAGE "GOOD LUCK / PLACE YOUR BETS"  /////////////////////////////////////////////////////////////////////////

this.gameMessageText = this.add.text(centerX, centerY + 100, 'PLACE YOUR BETS', {
  fontFamily: 'GatesFont',
  fontSize: '40px',
  color: '#ffffff',
  align: 'center'
}).setOrigin(0.5).setVisible(true);



/////////////////////////////////////// Big Win Pop Up ///////////////////////////////////////////////////////////////////////

this.showBigWinPopup = showBigWinPopup.bind(this);

//////////////////////////////////////// History Tab  /////////////////////////////////////////////////////////////////////////

// Store original position for future reference
this.historyOriginalX = centerX + 220;
this.historyOriginalY = centerY + 400;

// Create history table container
this.historyContainer = this.add.container(this.historyOriginalX, this.historyOriginalY);
this.historyContainer.setScale(0.9);

// Add background (lowest layer)
const historyBg = this.add.image(0, 0, 'history_bg');
historyBg.setOrigin(0.5);
this.historyContainer.add(historyBg);

// Add frame (topmost layer)
const historyFrame = this.add.image(0, 0, 'history_frame');
historyFrame.setOrigin(0.5);
this.historyContainer.add(historyFrame);

// Initialize empty array to store slot containers
this.historySlots = [];

//////////////////////////////////////////////////////////// ZUES IDLE  //////////////////////////////////////////////////////////////

this.zues = this.add.sprite(560, 255, 'zues_idle'); // Adjust position as needed
this.zues.setScale(0.65); // Optional: resize to fit your layout
this.zues.play('zues_idle_anim');
gameContainer.add(this.zues);

// Floating animation
this.tweens.add({
  targets: this.zues,
  y: this.zues.y - 15,
  duration: 1400,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.easeInOut'
});

// Breathing animation
this.tweens.add({
  targets: this.zues,
  scaleX: 0.67,
  scaleY: 0.64,
  duration: 1800,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.easeInOut'
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  // PURPLE GRID BG
  const bg = this.add.image(centerX, centerY + gridYOffset, 'gridBackground');
  bg.setDisplaySize(gridWidth + 10, gridHeight + 10).setDepth(-2);
  gameContainer.add(bg);

  // GOLDEN FRAME
  const frame = this.add.image(centerX, centerY + gridYOffset, 'gridFrame');
  frame.setDisplaySize(790, 530).setDepth(10);
  gameContainer.add(frame);

  const gridContainer = this.add.container(centerX - gridWidth / 2, centerY - gridHeight / 2 + gridYOffset);
  gameContainer.add(gridContainer);

  const symbolKeys = [
    'crown', 'hourglass', 'ring', 'chalice',
    'gem_red', 'gem_purple', 'gem_yellow', 'gem_green', 'gem_blue', 'scatter'
  ];

  const scaleMap = {
    crown: 1.05,
    hourglass: 1.05,
    ring: 1.05,
    chalice: 1.05,
    gem_red: 0.8,
    gem_purple: 0.8,
    gem_yellow: 0.8,
    gem_green: 0.8,
    gem_blue: 0.8,
  
    // Add orbs with similar scale to large symbols
    orb_green: 1.05,
    orb_blue: 1.05,
    orb_purple: 1.05,
    orb_red: 1.05
  };  

  this.symbols = [];

  for (let row = 0; row < rows; row++) {
    this.symbols[row] = [];
    for (let col = 0; col < cols; col++) {
      const key = pickWeightedSymbol(weightedPool);
      const sprite = this.add.image(
        col * boxWidth + boxWidth / 2,
        row * boxHeight + boxHeight / 2,
        key
      );
      const scale = scaleMap[key] || 1.0;
      sprite.setScale(scale * Math.min((boxWidth - 4) / sprite.width, (boxHeight - 4) / sprite.height));
      this.symbols[row][col] = sprite;
      gridContainer.add(sprite);
    }
  }

  const maskGraphics = this.make.graphics();
  maskGraphics.fillStyle(0xffffff);
  maskGraphics.fillRect(centerX - gridWidth / 2, centerY - gridHeight / 2 + gridYOffset, gridWidth, gridHeight);
  const mask = maskGraphics.createGeometryMask();
  gridContainer.setMask(mask);

  // --- Responsive Scaling ---
  const actualWidth = this.scale.gameSize.width;
  const actualHeight = this.scale.gameSize.height;
  const scaleX = actualWidth / designWidth;
  const scaleY = actualHeight / designHeight;
  const scale = Math.min(scaleX, scaleY);

  gameContainer.setScale(scale);
  gameContainer.x = (actualWidth - designWidth * scale) / 2;
  gameContainer.y = (actualHeight - designHeight * scale) / 2;



/////////////////////////////////////////////////////////// Spin Button //////////////////////////////////////////////////////////////////////////////////////////////////////

// Create a black circular background
const spinRadius = 70;
const spinCircle = this.add.graphics();
spinCircle.fillStyle(0x000000, 0.5);
spinCircle.fillCircle(0, 0, spinRadius);

// Add the spin icon image
const spinImage = this.add.image(0, 0, 'spinIcon');
spinImage.setDisplaySize(120, 100);

// Combine into a container to act as a button
const spinButton = this.add.container(centerX, designHeight - 250, [spinCircle, spinImage]);

// Define a proper hit area for the container
const hitArea = new Phaser.Geom.Circle(0, 0, spinRadius);
spinButton.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

// Add spin click handler
spinButton.on('pointerdown', async () => {
  this.sounds.sfx_spinButton.play();
  spinButton.setVisible(false);
  spinButton.disableInteractive();


  // Disable and fade out Buy Free Spins and ANTE BET button 
  toggleBuyFreeSpinsAndAnteUI.call(this, false);

  // Hide Autospin and Bet Settings UI 
  this.toggleBetUIVisibility(false);

  // Fade out the win tab at the start of each spin
  fadeOutWinTab.call(this);

  // Reset total win for the win tab at the start of each spin
  this.totalWinAmountForTab = 0;

  // Clear any old win tab sprites
  if (this.winTabSprites) {
    this.winTabSprites.forEach(s => s.destroy());
  }
  this.winTabSprites = [];

  // ✅ Reset orb multiplier total
  this.totalOrbMultiplier = 0;
  this.pendingOrbAnimations = 0;
  this._finalizedWinAlready = false;

  // Reset the win tab display to blank (in case it fades back in)
  updateWinTabSpriteDisplay.call(this);

  // Clear history table
  this.historySlots.forEach(slot => slot.destroy());
  this.historySlots = [];

  try {
    // Deduct the bet first
    const response = await fetch('/games/gates/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet: betAmount, currency: selectedCurrency, ante: this.anteBetActive })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      alert(data.error || 'Error placing bet');
      spinButton.setInteractive();
      spinButton.setVisible(true);
      toggleBuyFreeSpinsAndAnteUI.call(this, true);
      this.toggleBetUIVisibility(true);
      return;
    }

    // Update local balance
    if (selectedCurrency === 'USD') {
      userBalanceUSD = data.newBalanceUSD;
    } else {
      userBalanceLBP = data.newBalanceLBP;
    }
    updateBalanceText();

    // Reset match accumulator
    this.pendingSymbolCounts = [];

    const orbData = [];

    // Start the spin
    spinGrid.call(this, cols, rows, symbolKeys, gridContainer, boxWidth, boxHeight, quickSpinEnabled, () => {
      // When all cascades are done, spin is complete
      if (!this.isAutoSpinning) {
        spinButton.setInteractive();
        spinButton.setVisible(true);

        toggleBuyFreeSpinsAndAnteUI.call(this, true);
        this.toggleBetUIVisibility(true);

        // Show PLACE YOUR BETS only if no win text is visible
        if (!this.winTextContainer.visible) {
          setGameMessage(this, 'PLACE YOUR BETS');
        }
      }
      // ✅ Notify autoplay system that spin is finished
      this.spinButton.emit('spinComplete');
    }, orbData);

  } catch (err) {
    console.error('Spin error:', err);
    alert('Server error while placing bet.');
    spinButton.setInteractive();
    spinButton.setVisible(true);
    toggleBuyFreeSpinsAndAnteUI.call(this, true);
    this.toggleBetUIVisibility(true);
  }
});


// Add to game container
gameContainer.add(spinButton);

// ✅ Expose spinButton to the scene so you can access it elsewhere:
this.spinButton = spinButton;

/////////////////////////////////////////////////////////////////////////////////// BUY FREE SPINS BUTTON UI ETC.. ///////////////////////////////////////////////////////////////////////////////////////

// --- Buy Free Spins Container (button + text + bonus text) ---
const buyFreeSpinsContainer = this.add.container(centerX - 160, designHeight - 455).setDepth(10).setScale(1,0.92);

// Buy Free Spins Button (interactive)
const buyFreeSpinsButton = this.add.image(0, 0, 'buyFreeSpinsButton')
  .setInteractive()
  .setScale(1)
  .on('pointerdown', () => {
    this.sounds.sfx_freeMainButton.play();
    this.showBuyFreeSpinsPopup();
  });

// Buy Free Spins Text (positioned above the button)
const buyFreeSpinsText = this.add.image(0, -6, 'buyFreeSpinsTextOnly')
  .setScale(1);

// Buy Free Spins Bonus Text (positioned above the main text, initially hidden)
const buyFreeSpinsBonusText = this.add.image(0, 0 , 'buyFreeSpinsBonusText') // Adjust Y as needed
  .setScale(1)
  .setVisible(false); // Initially hidden

// Add all elements to the container
buyFreeSpinsContainer.add([
  buyFreeSpinsButton,
  buyFreeSpinsText,
  buyFreeSpinsBonusText
]);

// --- Buy Free Spins Price Container ---
const buyFreeSpinsPriceContainer = this.add.container(0, 0).setDepth(10);

// Expose button container and button for external use
this.buyFreeSpinsContainer = buyFreeSpinsContainer;
this.buyFreeSpinsButton = buyFreeSpinsButton;
this.buyFreeSpinsText = buyFreeSpinsText; 
this.buyFreeSpinsBonusText = buyFreeSpinsBonusText; 
this.buyFreeSpinsPriceContainer = buyFreeSpinsPriceContainer;

// --- Sprite Price Renderer ---
const updateBuyFreeSpinsPrice = () => {
  const symbol = selectedCurrency === 'USD' ? '$' : '£';
  const cost = selectedCurrency === 'USD'
    ? (betAmount * 100).toLocaleString('en-US')
    : Math.round(betAmount * 100).toLocaleString('en-US');

  const fullText = `${symbol}${cost}`;
  buyFreeSpinsPriceContainer.removeAll(true);

  // Set smaller scale and spacing for LBP to fit big numbers
  const scale = selectedCurrency === 'USD' ? 0.4 : 0.3;
  const spacing = selectedCurrency === 'USD' ? 30 : 22;

  let xOffset = 0;

  for (let char of fullText) {
    const frameIndex = fontCharMap[char];
    if (frameIndex === undefined) continue;

    const charSprite = this.add.sprite(xOffset, 0, 'buyFont', frameIndex)
      .setOrigin(0.5)
      .setScale(scale);

    buyFreeSpinsPriceContainer.add(charSprite);
    xOffset += spacing;
  }

  buyFreeSpinsPriceContainer.x = centerX - 165 - (xOffset - spacing) / 2;
  buyFreeSpinsPriceContainer.y = designHeight - 422;
};


/////////////////////////////////////////////////////////////////// BUY FREE SPINS Confirmation Pop Up Message ///////////////////////////////////////////////////////////////////////////////////

this.showBuyFreeSpinsPopup = () => {
  // Animate and hide the buy button
  this.tweens.add({
    targets: [buyFreeSpinsButton, buyFreeSpinsText, buyFreeSpinsPriceContainer],
    scale: 0,
    duration: 200,
    ease: 'Back.easeIn',
    onComplete: () => {
      buyFreeSpinsButton.setVisible(false);
      buyFreeSpinsPriceContainer.setVisible(false);
    }
  });

  // Create dark overlay
  const overlay = this.add.rectangle(centerX, centerY, designWidth, designHeight, 0x000000, 0.4)
    .setDepth(19)
    .setInteractive(); // Block clicks to game behind

  // Create popup container
  const popupContainer = this.add.container(centerX, centerY - 180).setDepth(20).setScale(0);

  // Add background image
  const popupBg = this.add.image(0, 0, 'buyFreeSpinsPopupBg').setOrigin(0.5);
  popupContainer.add(popupBg);


  // YES BUTTON
  const yesButton = this.add.image(120, 140, 'buttonCheck').setInteractive().setScale(0.9);

yesButton.on('pointerdown', () => {
  yesButton.disableInteractive();
  this.sounds.sfx_freeYesButton.play();

  fetch('/games/gates/buy-free-spins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bet: betAmount,
      currency: selectedCurrency
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Update balances
      userBalanceUSD = data.newBalanceUSD;
      userBalanceLBP = data.newBalanceLBP;
      updateBalanceText();

      // Reset UI
      buyFreeSpinsButton.setVisible(true).setScale(1);
      buyFreeSpinsBonusText.setVisible(true).setScale(1);
      buyFreeSpinsText.setVisible(false);
      buyFreeSpinsPriceContainer.setVisible(false);
      popupContainer.destroy();
      overlay.destroy();

      // Kick off animation chain — final step triggers real free spins
     fakeScatterSpinGrid.call(
     this,
     6, 5,
     gridContainer,
     boxWidth,
     boxHeight,
     weightedPool,
     () => {
      // After popup closes, play thunder animation
      playScreenThunder.call(this, () => {
        // After thunder animation completes, start real free spins
        startFreeSpins(this, 6, 5, boxWidth, boxHeight, gridContainer, symbolKeys);
      });
    }
  );

    // === Disable Ante Toggle Functionality and Visuals ===
    this.anteBorder.disableInteractive(); // Disable click on the ante toggle
    this.buyFreeSpinsButton.disableInteractive(); // Disable Buy Free Spins Button

    // Fade out entire ante toggle + amount
    const fadeDuration = 150;
    this.tweens.add({ targets: this.anteToggleContainer, alpha: 0.6, duration: fadeDuration, ease: 'Linear' });
    this.tweens.add({ targets: this.anteBetSpriteContainer, alpha: 0.6, duration: fadeDuration, ease: 'Linear' });
    this.tweens.add({ targets: this.anteBorder, alpha: 0.6, duration: fadeDuration, ease: 'Linear' });

    } else {
      console.error('Buy free spins failed:', data.error);
      yesButton.setInteractive();
    }
  })
  .catch(err => {
    console.error('Network error:', err);
    yesButton.setInteractive();
  });
});

popupContainer.add(yesButton);

  

  // NO button
  const noButton = this.add.image(-120, 140, 'buttonX').setInteractive().setScale(0.9);
  noButton.on('pointerdown', () => {
    this.sounds.sfx_freeNoButton.play();
    popupContainer.destroy();
    overlay.destroy();
  
    buyFreeSpinsButton.setVisible(true);
    buyFreeSpinsPriceContainer.setVisible(true);
    buyFreeSpinsText.setVisible(true); // probably want this visible too
  
    // Reset scale to 0 before tweening up to 1
    buyFreeSpinsButton.setScale(0);
    buyFreeSpinsText.setScale(0);
    buyFreeSpinsPriceContainer.setScale(0);
  
    this.tweens.add({
      targets: [buyFreeSpinsButton, buyFreeSpinsText, buyFreeSpinsPriceContainer],
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  });  
  popupContainer.add(noButton);

  // Price container
  const confirmPriceContainer = this.add.container(0, 10);
  popupContainer.add(confirmPriceContainer);

  const symbol = selectedCurrency === 'USD' ? '$' : '£';
  const cost = selectedCurrency === 'USD'
    ? (betAmount * 100).toLocaleString('en-US')
    : Math.round(betAmount * 100).toLocaleString('en-US');

  const fullText = `${symbol}${cost}`;
  const scale = selectedCurrency === 'USD' ? 0.9 : 0.8;
  const spacing = selectedCurrency === 'USD' ? 65 : 50;

  let xOffset = 0;
  for (let char of fullText) {
    const frameIndex = fontCharMap[char];
    if (frameIndex === undefined) continue;

    const charSprite = this.add.sprite(xOffset, 0, 'buyFont', frameIndex)
      .setOrigin(0.5)
      .setScale(scale);

    confirmPriceContainer.add(charSprite);
    xOffset += spacing;
  }
  confirmPriceContainer.x = -xOffset / 2;

  // Animate popup zoom in
  this.tweens.add({
    targets: popupContainer,
    scale: 0.6,
    duration: 200,
    ease: 'Back.easeOut'
  });
};

//////////////////////////////////////////////////////////// UI FOR MULTIPLIER PILLAR FOR FREE SPINS ETC.. //////////////////////////////////////////////////////////////

this.multiplierPillarContainer = this.add.container(centerX + 238, centerY + 420);
this.multiplierPillarContainer.setDepth(6).setVisible(false);

// Add pillar and flame to the container
const pillar = this.add.image(0, 0, 'multiplier_pillar').setScale(1.1);

// 🔥 Keep a reference to the purple flame
this.purpleFlame = this.add.sprite(0, -120, 'purple_flame')
  .play('flame_burn')
  .setScale(1.2)
  .setDepth(-1)
  .setVisible(false); // 🔒 Start hidden

this.multiplierPillarContainer.add([this.purpleFlame, pillar]);

//////////////////////////////////////////////////////////// UI FOR FREE SPINS REMAINING //////////////////////////////////////////////////////////////

// Create a container for the free spins remaining UI
this.freeSpinsBorder = this.add.container();
this.freeSpinsBorder.setVisible(false); // Hidden until free spins start

// Add the border background
const borderBg = this.add.image(0, 0, 'spins_remaining_border');
borderBg.setOrigin(0.5);

// Create a placeholder container for digit sprites
this.freeSpinsDigits = this.add.container(0, 25); // Positioned dynamically when updated
this.freeSpinsBorder.add([borderBg, this.freeSpinsDigits]);
this.freeSpinsDigits.setScale(0.4); // Adjust the scale as needed

// Position the full container at the top-center of the screen
this.freeSpinsBorder.setPosition(centerX - 230, centerY + 320);

// ✅ Scale the entire container
this.freeSpinsBorder.setScale(1.1);

//////////////////////////////////////////////////////////// UI FOR BET ANTTE TOGGLE  ////////////////////////////////////////////////////////////////////////////////////
// === Initial Ante State ===
this.anteBetActive = false;

// === Ante Border: Permanent Background & Click Target ===
this.anteBorder = this.add.image(centerX + 160, centerY + 200, 'anteBorder')
  .setOrigin(0.5)
  .setDepth(0)
  .setScale(1, 0.92)
  .setInteractive(); // Make it clickable

// === Toggle UI Container ===
this.anteToggleContainer = this.add.container(centerX + 160, centerY + 240);

// Toggle Background (Static)
const toggleBorder = this.add.image(0, 0, 'toggleBorder').setOrigin(0.5);

// Toggle Knob Container (Moves Left/Right)
this.toggleKeyContainer = this.add.container(-20, 0); // Start on left

// Toggle Key Graphic and Icons
const toggleKeyImage = this.add.image(0, 0, 'toggleKey').setOrigin(0.5);
this.toggleArrow = this.add.image(0, 0, 'toggleArrow').setOrigin(0.5);
this.toggleCheck = this.add.image(0, 0, 'toggleCheck').setOrigin(0.5).setVisible(false);

// Add graphics to knob container
this.toggleKeyContainer.add([toggleKeyImage, this.toggleArrow, this.toggleCheck]);

// Add background and knob to toggle container
this.anteToggleContainer.add([toggleBorder, this.toggleKeyContainer]);
this.anteToggleContainer.setDepth(1);

// === Ante Amount Display Container (Always visible) ===
this.anteBetSpriteContainer = this.add.container(centerX + 205, centerY + 162);
this.anteBetSpriteContainer.setDepth(2);

// === Update Ante Bet Amount Display ===
const updateAnteBetSprites = () => {
  const baseAmount = Number(betAmount);
  const boostedAmount = baseAmount * 1.25;
  const symbol = selectedCurrency === 'USD' ? '$' : '£';

  const anteAmount = selectedCurrency === 'USD'
    ? boostedAmount.toFixed(2)
    : Math.round(boostedAmount).toLocaleString('en-US');

  const fullText = `${symbol}${anteAmount}`;

  this.anteBetSpriteContainer.removeAll(true);

  const scale = selectedCurrency === 'USD' ? 0.3 : 0.25;
  const spacing = selectedCurrency === 'USD' ? 18 : 16;
  const strokeOffset = 1.5;
  const strokeColor = 0x0e0d6c;

  let xOffset = 0;

  for (const char of fullText) {
    const frameIndex = fontCharMap[char];
    if (frameIndex === undefined) {
      console.warn(`Character "${char}" not found in fontCharMap`);
      continue;
    }

    const offsets = [
      [-strokeOffset, 0],
      [strokeOffset, 0],
      [0, -strokeOffset],
      [0, strokeOffset]
    ];

    offsets.forEach(([dx, dy]) => {
      const shadowSprite = this.add.sprite(xOffset + dx, dy, 'buyFont', frameIndex)
        .setOrigin(0.5)
        .setScale(scale)
        .setTint(strokeColor);
      this.anteBetSpriteContainer.add(shadowSprite);
    });

    const charSprite = this.add.sprite(xOffset, 0, 'buyFont', frameIndex)
      .setOrigin(0.5)
      .setScale(scale);

    this.anteBetSpriteContainer.add(charSprite);
    xOffset += spacing;
  }

  const totalWidth = xOffset - spacing;
  for (const child of this.anteBetSpriteContainer.list) {
    child.x -= totalWidth / 2;
  }
};

// Initialize ante display
updateAnteBetSprites();

// === Single Toggle Logic: Click Ante Border ===
this.anteBorder.on('pointerdown', () => {
  this.sounds.sfx_betAnte.play();
  this.anteBetActive = !this.anteBetActive;

  this.tweens.add({
    targets: this.toggleKeyContainer,
    x: this.anteBetActive ? 20 : -20,
    duration: 150,
    ease: 'Power2'
  });

  this.toggleCheck.setVisible(this.anteBetActive);
  this.toggleArrow.setVisible(!this.anteBetActive);

  updateBetText();         // Always show base bet
  updateAnteBetSprites();  // Show ante-boosted amount

   // === Disable or Enable Buy Free Spins button with smooth fade ===
const targetAlpha = this.anteBetActive ? 0.6 : 1;
const duration = 150;

this.tweens.add({ targets: this.buyFreeSpinsButton, alpha: targetAlpha, duration, ease: 'Linear' });
this.tweens.add({ targets: this.buyFreeSpinsText, alpha: targetAlpha, duration, ease: 'Linear' });
this.tweens.add({ targets: this.buyFreeSpinsBonusText, alpha: targetAlpha, duration, ease: 'Linear' });
this.tweens.add({ targets: this.buyFreeSpinsPriceContainer, alpha: targetAlpha, duration, ease: 'Linear' });

// Toggle interactivity AFTER fade completes
if (this.anteBetActive) {
  this.buyFreeSpinsButton.disableInteractive();
} else {
  // Delay enabling interactivity slightly to avoid interaction during fade
  this.time.delayedCall(duration, () => {
    this.buyFreeSpinsButton.setInteractive();
  });
}

});

//////////////////////////////////////////////////////////// UI FOR Info Button ////////////////////////////////////////////////////////////////////////////////////

const infoButton = this.add.image(centerX + 300, centerY + 570, 'infoIcon')
    .setInteractive({ useHandCursor: true })
    .setScale(1.5)
    .setDepth(100)
    .setAlpha(0.7)
    .setScrollFactor(0);
    

infoButton.on('pointerdown', () => {
    openInfoPanel.call(this);
});

//////////////////////////////////////////////////////////// UI FOR Settings Button ////////////////////////////////////////////////////////////////////////////////////

const settingsButton = this.add.image(centerX -320, centerY + 570, 'settingsIcon')
    .setInteractive({ useHandCursor: true })
    .setScale(1.5)
    .setDepth(100)
    .setAlpha(0.7)
    .setScrollFactor(0);

  settingsButton.on('pointerdown', () => {
    this.sounds.sfx_basicButton?.play();
    systemOverlayContainer.setVisible(true);
    systemInputBlocker.setVisible(true);
 
  // ✅ Fix: update general settings bet amount on open
  updateGeneralSettingsBetText();
  });
    

////////////// SYSTEM SETTINGS OVERLAY /////////////////////////

// Overlay size: 100% width, 90% height
const systemOverlayWidth = designWidth * 1;
const systemOverlayHeight = designHeight * 0.9;

// Container: centered, no Y offset
const systemOverlayContainer = this.add.container(centerX, centerY - 40)
  .setDepth(2000)
  .setVisible(false);

// Background: semi-transparent, rounded
const systemOverlayBG = this.add.graphics();
systemOverlayBG.fillStyle(0x000000, 0.95);
systemOverlayBG.fillRect(
  -systemOverlayWidth / 2,
  -systemOverlayHeight / 2,
  systemOverlayWidth,
  systemOverlayHeight
);

// Close icon
const settingsCloseIcon = this.add.image(systemOverlayWidth / 2 - 40, -systemOverlayHeight / 2 + 40, 'closeIcon')
  .setInteractive()
  .setScale(1);

 const topSeparator = this.add.rectangle(
    0,
    -systemOverlayHeight / 2 + 120, // Y offset from top
    systemOverlayWidth - 80,        // leave padding
    4,                              // thickness
    0x888888                        // gray color
).setOrigin(0.5)
  .setAlpha(0.6);
  

// Add to container
systemOverlayContainer.add([systemOverlayBG, settingsCloseIcon, topSeparator]);

// Input blocker to prevent clicks outside
const systemInputBlocker = this.add.rectangle(centerX, centerY, designWidth, designHeight, 0x000000, 0)
  .setDepth(1999)
  .setInteractive()
  .setVisible(false);

// Close handler
settingsCloseIcon.on('pointerdown', () => {
  this.sounds.sfx_basicButton?.play();
  systemOverlayContainer.setVisible(false);
  systemInputBlocker.setVisible(false);
});

// Title above home button & grey line
const systemSettingsTitleY = -systemOverlayHeight / 2 + 110;

const systemSettingsTitle = this.add.text(0, systemSettingsTitleY - 50, 'SYSTEM SETTINGS', {
  fontFamily: 'GatesFont',
  fontSize: '32px',
  color: '#f3ae41',
  align: 'center',
}).setOrigin(0.5).setDepth(2001);

systemOverlayContainer.add(systemSettingsTitle);


///////////////// HOME BUTTON (clean, clickable full width) //

// Vertical position for the button row
const homeButtonY = -systemOverlayHeight / 2 + 180;

// Create text and icon
const homeLabel = this.add.text(0, 0, 'HOME', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#ffffff',
}).setOrigin(0, 0.5);

const homeIcon = this.add.image(0, 0, 'homeIcon')
  .setScale(2)
  .setOrigin(1, 0.5);

// Create container for label and icon only
const homeButtonContainer = this.add.container(0, homeButtonY, [homeLabel, homeIcon]);

// Position label and icon inside container
homeLabel.x = -systemOverlayWidth / 2 + 60;
homeIcon.x = systemOverlayWidth / 2 - 60;

// Create invisible hit area rectangle at the same Y
const homeHitArea = this.add.rectangle(0, homeButtonY, systemOverlayWidth, 80, 0x000000, 0)
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true });

// Click handler attached to the invisible hit area
homeHitArea.on('pointerdown', () => {
  this.sounds.sfx_basicButton?.play();
  window.location.href = '/';
});

// Add label+icon container and hit area to main overlay container
systemOverlayContainer.add([homeButtonContainer, homeHitArea]);


///////////////// GAME HISTORY BUTTON (grayed out, matches HOME style) //

const gameHistoryButtonY = homeButtonY + 120;

// Separator line above GAME HISTORY
const separatorAboveGameHistory = this.add.rectangle(
  0,
  gameHistoryButtonY - 60,
  systemOverlayWidth - 80,
  4,
  0x888888
).setOrigin(0.5)
  .setAlpha(0.6);

systemOverlayContainer.add(separatorAboveGameHistory);

// Label and icon (same sizing/padding as HOME)
const gameHistoryLabel = this.add.text(0, 0, 'GAME HISTORY', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#888888',
}).setOrigin(0, 0.5);

const gameHistoryIcon = this.add.image(0, 0, 'linkIcon')
  .setScale(2)
  .setOrigin(1, 0.5)
  .setTint(0x888888);

// Container to match HOME layout
const gameHistoryButtonContainer = this.add.container(0, gameHistoryButtonY, [gameHistoryLabel, gameHistoryIcon]);

gameHistoryLabel.x = -systemOverlayWidth / 2 + 60;
gameHistoryIcon.x = systemOverlayWidth / 2 - 60;

// Invisible rectangle for consistent layout (not interactive yet)
const gameHistoryHitArea = this.add.rectangle(0, gameHistoryButtonY, systemOverlayWidth, 80, 0x000000, 0)
  .setOrigin(0.5);

systemOverlayContainer.add([gameHistoryButtonContainer, gameHistoryHitArea]);


///////////////// BATTERY SAVER BUTTON WITH TOGGLE //

// Vertical position (space it nicely below Game History)
const batterySaverButtonY = gameHistoryButtonY + 150;

// Separator line above BATTERY SAVER
const separatorAboveBatterySaver = this.add.rectangle(
  0,
  batterySaverButtonY - 90,
  systemOverlayWidth - 80,
  4,
  0x888888
).setOrigin(0.5)
  .setAlpha(0.6);

systemOverlayContainer.add(separatorAboveBatterySaver);

// ** New Title text: GENERAL SETTINGS **
const generalSettingsTitle = this.add.text(0, 0, 'GENERAL SETTINGS', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#f3ae41',
}).setOrigin(0, 0.5);

// Position it nicely above batterySaverLabel (e.g. 40px above)
generalSettingsTitle.x = -systemOverlayWidth / 2 + 55;
generalSettingsTitle.y = batterySaverButtonY - 50;

systemOverlayContainer.add(generalSettingsTitle);

// Label text
const batterySaverLabel = this.add.text(0, 0, 'BATTERY SAVER', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#ffffff',
}).setOrigin(0, 0.5);

batterySaverLabel.x = -systemOverlayWidth / 2 + 60;

// Small subtitle text below "BATTERY SAVER"
const batterySaverSubtitle = this.add.text(0, 0, 'SAVE BATTERY LIFE BY REDUCING ANIMATIONS', {
  fontFamily: 'GatesFont',
  fontSize: '18px',
  color: '#bdbdbd',
}).setOrigin(0, 0.5);

batterySaverSubtitle.x = batterySaverLabel.x;
batterySaverSubtitle.y = batterySaverLabel.y + 28;

// Toggle dimensions
const toggleWidth = 120;
const toggleHeight = 60;
const toggleRadius = 8; // Less rounded than before
const toggleKeySize = 60;
const toggleKeyRadius = 10;

// Colors for OFF and ON states
const bgColorOff = 0x444444;
const bgColorOn = 0x006f41;
const keyColorOff = 0xffffff;
const keyColorOn = 0x00b66b;

// Toggle background
const toggleBackgroundGraphics = this.add.graphics();
toggleBackgroundGraphics.fillStyle(bgColorOff, 1);
toggleBackgroundGraphics.fillRoundedRect(
  -toggleWidth / 2,
  -toggleHeight / 2,
  toggleWidth,
  toggleHeight,
  toggleRadius
);

// Toggle key (rounded square with icon)
const toggleKeyShape = this.add.graphics();
toggleKeyShape.fillStyle(keyColorOff, 1);
toggleKeyShape.fillRoundedRect(
  -toggleKeySize / 2,
  -toggleKeySize / 2,
  toggleKeySize,
  toggleKeySize,
  toggleKeyRadius
);

// Icon image starts with OFF icon
const toggleKeyIcon = this.add.image(0, 0, 'scrollIcon2').setScale(1.2);

// Combine into toggle key container
const toggleKey = this.add.container(
  -toggleWidth / 2 + toggleKeySize / 2, // START at LEFT side
  0,
  [toggleKeyShape, toggleKeyIcon]
);

// Combine background and toggle key, slightly shifted left
const toggleContainer = this.add.container(
  systemOverlayWidth / 2 - 120, // shifted left by 20px
  0,
  [toggleBackgroundGraphics, toggleKey]
);

// Full battery saver row container
const batterySaverContainer = this.add.container(0, batterySaverButtonY, [
  batterySaverLabel,
  batterySaverSubtitle,
  toggleContainer
]);

// Interactive toggle behavior
let batterySaverEnabled = false;
toggleContainer.setInteractive(
  new Phaser.Geom.Rectangle(-toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight),
  Phaser.Geom.Rectangle.Contains
);

toggleContainer.on('pointerdown', () => {
  batterySaverEnabled = !batterySaverEnabled;

  // Animate toggle knob position (LEFT to RIGHT when enabled)
  this.tweens.add({
    targets: toggleKey,
    x: batterySaverEnabled
      ? toggleWidth / 2 - toggleKeySize / 2  // move RIGHT when ON
      : -toggleWidth / 2 + toggleKeySize / 2, // move LEFT when OFF
    duration: 150,
    ease: 'Power2',
  });

  // Redraw toggle background color based on state
  toggleBackgroundGraphics.clear();
  toggleBackgroundGraphics.fillStyle(batterySaverEnabled ? bgColorOn : bgColorOff, 1);
  toggleBackgroundGraphics.fillRoundedRect(
    -toggleWidth / 2,
    -toggleHeight / 2,
    toggleWidth,
    toggleHeight,
    toggleRadius
  );

  // Redraw toggle key color based on state
  toggleKeyShape.clear();
  toggleKeyShape.fillStyle(batterySaverEnabled ? keyColorOn : keyColorOff, 1);
  toggleKeyShape.fillRoundedRect(
    -toggleKeySize / 2,
    -toggleKeySize / 2,
    toggleKeySize,
    toggleKeySize,
    toggleKeyRadius
  );

  // Swap icon texture based on state
  toggleKeyIcon.setTexture(batterySaverEnabled ? 'scrollIcon' : 'scrollIcon2');

  this.sounds.sfx_basicButton?.play();

  // TODO: Implement battery saver logic
});

systemOverlayContainer.add(batterySaverContainer);


///////////////////////// QUICK SPIN TOGGLE ////


// Vertical position below Battery Saver (space it nicely)
const quickSpinButtonY = batterySaverButtonY + 110;

// Label text for Quick Spin
const quickSpinLabel = this.add.text(0, 0, 'QUICK SPIN', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#ffffff',
}).setOrigin(0, 0.5);

quickSpinLabel.x = -systemOverlayWidth / 2 + 60;

// Small instruction text below "QUICK SPIN"
const quickSpinInstruction = this.add.text(0, 0, 'PLAY FASTER BY REDUCING TOTAL SPIN TIME', {
  fontFamily: 'GatesFont',
  fontSize: '18px',   // smaller font
  color: '#bbbbbb',   // lighter color for subtitle
}).setOrigin(0, 0); // align left-top

// Position it a bit below quickSpinLabel (which is at y=0)
quickSpinInstruction.x = quickSpinLabel.x;
quickSpinInstruction.y = 18;  // ~30px below label center (label origin y=0.5)


// Toggle background
const quickSpinToggleBg = this.add.graphics();
quickSpinToggleBg.fillStyle(bgColorOff, 1);
quickSpinToggleBg.fillRoundedRect(
  -toggleWidth / 2,
  -toggleHeight / 2,
  toggleWidth,
  toggleHeight,
  toggleRadius
);

// Toggle key (rounded square)
const quickSpinToggleKeyShape = this.add.graphics();
quickSpinToggleKeyShape.fillStyle(keyColorOff, 1);
quickSpinToggleKeyShape.fillRoundedRect(
  -toggleKeySize / 2,
  -toggleKeySize / 2,
  toggleKeySize,
  toggleKeySize,
  toggleKeyRadius
);

// Icon image for toggle key (reuse scrollIcon2 for OFF)
const quickSpinToggleKeyIcon = this.add.image(0, 0, 'scrollIcon2').setScale(1.2);

const quickSpinToggleKey = this.add.container(
  -toggleWidth / 2 + toggleKeySize / 2,
  0,
  [quickSpinToggleKeyShape, quickSpinToggleKeyIcon]
);

const quickSpinToggleContainer = this.add.container(
  systemOverlayWidth / 2 - 120,
  0,
  [quickSpinToggleBg, quickSpinToggleKey]
);

const quickSpinContainer = this.add.container(0, quickSpinButtonY, [
  quickSpinLabel,
  quickSpinInstruction,
  quickSpinToggleContainer
]);

systemOverlayContainer.add(quickSpinContainer);

// Interactive toggle behavior
let quickSpinEnabled = false;

quickSpinToggleContainer.setInteractive(
  new Phaser.Geom.Rectangle(-toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight),
  Phaser.Geom.Rectangle.Contains
);

quickSpinToggleContainer.on('pointerdown', () => {
  quickSpinEnabled = !quickSpinEnabled;
  this.quickSpinEnabled = quickSpinEnabled;

  this.tweens.add({
    targets: quickSpinToggleKey,
    x: quickSpinEnabled
      ? toggleWidth / 2 - toggleKeySize / 2
      : -toggleWidth / 2 + toggleKeySize / 2,
    duration: 150,
    ease: 'Power2',
  });

  quickSpinToggleBg.clear();
  quickSpinToggleBg.fillStyle(quickSpinEnabled ? bgColorOn : bgColorOff, 1);
  quickSpinToggleBg.fillRoundedRect(
    -toggleWidth / 2,
    -toggleHeight / 2,
    toggleWidth,
    toggleHeight,
    toggleRadius
  );

  quickSpinToggleKeyShape.clear();
  quickSpinToggleKeyShape.fillStyle(quickSpinEnabled ? keyColorOn : keyColorOff, 1);
  quickSpinToggleKeyShape.fillRoundedRect(
    -toggleKeySize / 2,
    -toggleKeySize / 2,
    toggleKeySize,
    toggleKeySize,
    toggleKeyRadius
  );

  quickSpinToggleKeyIcon.setTexture(quickSpinEnabled ? 'scrollIcon' : 'scrollIcon2');

  this.sounds.sfx_basicButton?.play();
});





////////////////// SOUND TOGGLE BUTTON ///////

const soundToggleButtonY = quickSpinButtonY + 110;

// SOUND Label
const soundLabel = this.add.text(0, 0, 'SOUND', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#ffffff',
}).setOrigin(0, 0.5);

soundLabel.x = -systemOverlayWidth / 2 + 60;

// Subtitle
const soundSubtitle = this.add.text(0, 0, 'TURN SOUND OFF OR ON', {
  fontFamily: 'GatesFont',
  fontSize: '18px',
  color: '#bbbbbb',
}).setOrigin(0, 0);

soundSubtitle.x = soundLabel.x;
soundSubtitle.y = 18;

// Initial state: sound enabled
this.soundMuted = false;

// Toggle background (green ON color)
const soundToggleBg = this.add.graphics();
soundToggleBg.fillStyle(bgColorOn, 1); // e.g. 0x65C466
soundToggleBg.fillRoundedRect(
  -toggleWidth / 2,
  -toggleHeight / 2,
  toggleWidth,
  toggleHeight,
  toggleRadius
);

// Toggle key shape
const soundToggleKeyShape = this.add.graphics();
soundToggleKeyShape.fillStyle(keyColorOn, 1); // e.g. 0xffffff
soundToggleKeyShape.fillRoundedRect(
  -toggleKeySize / 2,
  -toggleKeySize / 2,
  toggleKeySize,
  toggleKeySize,
  toggleKeyRadius
);

// Icon for sound ON
const soundToggleIcon = this.add.image(0, 0, 'scrollIcon').setScale(1.2);

// Key positioned on right (ON)
const soundToggleKey = this.add.container(
  toggleWidth / 2 - toggleKeySize / 2,
  0,
  [soundToggleKeyShape, soundToggleIcon]
);

// Full toggle container
const soundToggleContainer = this.add.container(
  systemOverlayWidth / 2 - 120,
  0,
  [soundToggleBg, soundToggleKey]
);

const soundContainer = this.add.container(0, soundToggleButtonY, [
  soundLabel,
  soundSubtitle,
  soundToggleContainer
]);

systemOverlayContainer.add(soundContainer);

// Interactivity
soundToggleContainer.setInteractive(
  new Phaser.Geom.Rectangle(-toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight),
  Phaser.Geom.Rectangle.Contains
);

soundToggleContainer.on('pointerdown', () => {
  this.soundMuted = !this.soundMuted;

  // Move toggle key
  this.tweens.add({
    targets: soundToggleKey,
    x: this.soundMuted
      ? -toggleWidth / 2 + toggleKeySize / 2 // OFF
      : toggleWidth / 2 - toggleKeySize / 2, // ON
    duration: 150,
    ease: 'Power2',
  });

  // Update visual colors
  soundToggleBg.clear();
  soundToggleBg.fillStyle(this.soundMuted ? bgColorOff : bgColorOn, 1);
  soundToggleBg.fillRoundedRect(
    -toggleWidth / 2,
    -toggleHeight / 2,
    toggleWidth,
    toggleHeight,
    toggleRadius
  );

  soundToggleKeyShape.clear();
  soundToggleKeyShape.fillStyle(this.soundMuted ? keyColorOff : keyColorOn, 1);
  soundToggleKeyShape.fillRoundedRect(
    -toggleKeySize / 2,
    -toggleKeySize / 2,
    toggleKeySize,
    toggleKeySize,
    toggleKeyRadius
  );

  soundToggleIcon.setTexture(this.soundMuted ? 'scrollIcon2' : 'scrollIcon');

  // Mute/unmute all sounds
  Object.values(this.sounds).forEach(s => s.setMute(this.soundMuted));

  this.sounds.sfx_basicButton?.play();
});

//////////// SPIN LOCK BUTTON (Locked Fake Toggle - ON Look)

const spinLockButtonY = soundToggleButtonY + 110;

// Label
const spinLockLabel = this.add.text(0, 0, 'SPIN BUTTON LOCK', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#ffffff', // normal white, since it's visually active
}).setOrigin(0, 0.5);

spinLockLabel.x = -systemOverlayWidth / 2 + 60;

// Subtitle
const spinLockSubtitle = this.add.text(0, 0, 'UNLOCK TO MOVE THE SPIN BUTTON', {
  fontFamily: 'GatesFont',
  fontSize: '18px',
  color: '#bbbbbb', // faded gray for subtitle
}).setOrigin(0, 0);

spinLockSubtitle.x = spinLockLabel.x;
spinLockSubtitle.y = 18;

// Toggle background (ON state colors)
const spinLockBg = this.add.graphics();
spinLockBg.fillStyle(bgColorOn, 1); // e.g. 0x65C466
spinLockBg.fillRoundedRect(
  -toggleWidth / 2,
  -toggleHeight / 2,
  toggleWidth,
  toggleHeight,
  toggleRadius
);

// Key shape
const spinLockKeyShape = this.add.graphics();
spinLockKeyShape.fillStyle(keyColorOn, 1); // e.g. 0xffffff
spinLockKeyShape.fillRoundedRect(
  -toggleKeySize / 2,
  -toggleKeySize / 2,
  toggleKeySize,
  toggleKeySize,
  toggleKeyRadius
);

// Icon
const spinLockIcon = this.add.image(0, 0, 'scrollIcon');

// Key container in ON position
const spinLockKey = this.add.container(
  toggleWidth / 2 - toggleKeySize / 2,
  0,
  [spinLockKeyShape, spinLockIcon]
);

// Full toggle container (locked & fake)
const spinLockToggleContainer = this.add.container(
  systemOverlayWidth / 2 - 120,
  0,
  [spinLockBg, spinLockKey]
);

const spinLockContainer = this.add.container(0, spinLockButtonY, [
  spinLockLabel,
  spinLockSubtitle,
  spinLockToggleContainer
]);

systemOverlayContainer.add(spinLockContainer);

// Dim toggle to appear disabled but still green ON visually
spinLockContainer.setAlpha(0.4);  // dims everything inside


// Grey Line Seperator
const spinLockSeparator = this.add.rectangle(
  0,
  spinLockButtonY + 80,           // place below spinLockContainer (110 + 80 for spacing)
  systemOverlayWidth - 80,        // width with horizontal padding
  4,                             // thickness of the line
  0x888888                       // gray color
).setOrigin(0.5)
 .setAlpha(0.6);                 // subtle transparency

systemOverlayContainer.add(spinLockSeparator);


////////////////////////// BET AMOUNT INSIDE GENERAL SETTINGS ////////////////////////////

const generalSettingsBetRowY = spinLockButtonY + 220;

// Increased padding to enlarge box while keeping rectangular shape
const generalSettingsOverlayBetBoxPadding = { x: 80, y: 30 };

// Create graphics box background for bet amount (not +/- or label)
const generalSettingsOverlayBetBox = this.add.graphics().setDepth(2000);

// Bet amount text
const generalSettingsOverlayBetText = this.add.text(0, generalSettingsBetRowY, '', {
  fontFamily: 'GatesFont',
  fontSize: '32px',
  color: '#ffffff',
}).setOrigin(0.5).setDepth(2001);

systemOverlayContainer.add(generalSettingsOverlayBetBox);
systemOverlayContainer.add(generalSettingsOverlayBetText);

// Title text above the entire bet amount section
const generalSettingsOverlayBetTitle = this.add.text(-210, generalSettingsBetRowY - 110, 'BET SETTINGS', {
  fontFamily: 'GatesFont',
  fontSize: '26px',
  color: '#f3ae41',
  align: 'center',
}).setOrigin(0.5).setDepth(2001);

systemOverlayContainer.add(generalSettingsOverlayBetTitle);

// Label above bet amount
const generalSettingsOverlayBetLabel = this.add.text(0, generalSettingsBetRowY - 75, 'TOTAL BET', {
  fontFamily: 'GatesFont',
  fontSize: '22px',
  color: '#ffffff',
  align: 'center',
}).setOrigin(0.5).setDepth(2001);

systemOverlayContainer.add(generalSettingsOverlayBetLabel);

// Minus button
const generalSettingsOverlayMinus = this.add.image(-250, generalSettingsBetRowY, 'advancedMinus')
  .setOrigin(0.5).setScale(1.8).setDepth(2001)
  .setInteractive({ useHandCursor: true });

generalSettingsOverlayMinus.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();

  const delta = betStep * betLevel;
  if (betAmount - delta >= minBet * betLevel) {
    betAmount = selectedCurrency === 'LBP'
      ? betAmount - delta
      : Math.round((betAmount - delta) * 100) / 100;

    updateGeneralSettingsBetText();
    updateBetText();
  }
});

systemOverlayContainer.add(generalSettingsOverlayMinus);

// Plus button
const generalSettingsOverlayPlus = this.add.image(250, generalSettingsBetRowY, 'advancedPlus')
  .setOrigin(0.5).setScale(1.8).setDepth(2001)
  .setInteractive({ useHandCursor: true });

generalSettingsOverlayPlus.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();

  const delta = betStep * betLevel;
  const newBetAmount = betAmount + delta;

  const anteMultiplier = this.anteBetActive ? 1.25 : 1;
  const maxTotalBet = selectedCurrency === 'USD' ? 100 : 10000000;
  const maxAllowedBase = maxTotalBet / anteMultiplier;

  betAmount = Math.min(newBetAmount, maxAllowedBase);

  if (selectedCurrency === 'USD') {
    betAmount = Math.round(betAmount * 100) / 100;
  }

  updateGeneralSettingsBetText();
  updateBetText();
});

systemOverlayContainer.add(generalSettingsOverlayPlus);

// Function to draw the background box based on text size
function drawGeneralSettingsOverlayBetBox() {
  const textBounds = generalSettingsOverlayBetText.getBounds();

  const w = textBounds.width;
  const h = textBounds.height;

  generalSettingsOverlayBetBox.clear()
    .fillStyle(0x1f1f1f, 1)
    .fillRoundedRect(
      -w / 2 - generalSettingsOverlayBetBoxPadding.x,
      generalSettingsBetRowY - h / 2 - generalSettingsOverlayBetBoxPadding.y,
      w + 2 * generalSettingsOverlayBetBoxPadding.x,
      h + 2 * generalSettingsOverlayBetBoxPadding.y,
      10
    )
    .lineStyle(3, 0x404040)
    .strokeRoundedRect(
      -w / 2 - generalSettingsOverlayBetBoxPadding.x,
      generalSettingsBetRowY - h / 2 - generalSettingsOverlayBetBoxPadding.y,
      w + 2 * generalSettingsOverlayBetBoxPadding.x,
      h + 2 * generalSettingsOverlayBetBoxPadding.y,
      10
    );
}

// Update bet amount display text
function updateGeneralSettingsBetText() {
  const currencySymbol = selectedCurrency === 'LBP' ? '£' : '$';
  const displayBet = betAmount * (this.anteBetActive ? 1.25 : 1);

  const formattedBet = selectedCurrency === 'LBP'
    ? Math.round(displayBet).toLocaleString()
    : displayBet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  generalSettingsOverlayBetText.setText(`${currencySymbol}${formattedBet}`);

  // Re-draw background to fit updated text
  drawGeneralSettingsOverlayBetBox();
}

// Initial update
updateGeneralSettingsBetText();
updateGeneralSettingsBetText = updateGeneralSettingsBetText.bind(this);


/////////////////////////////////////////////////////////////  BIND HIDE/SHOW UI HELPER TO SCENE ////////////////////////////////////////////////////////////////////

this.toggleBetUIVisibility = toggleBetUIVisibility.bind(this);

//////////////////////////////////////////////////////////// UI Autoplay Settings ////////////////////////////////////////////////////////////////////////////////////

this.autoSpinsRemaining = 0;
this.isAutoSpinning = false;

// --- AUTOPLAY BUTTON ---
const autoSpinBtnRadius = 55;
const autoSpinBtnCircle = this.add.graphics();
autoSpinBtnCircle.fillStyle(0x000000, 0.5);
autoSpinBtnCircle.fillCircle(0, 0, autoSpinBtnRadius);

const autoSpinBtnIcon = this.add.image(0, 0, 'autoplayIcon');
autoSpinBtnIcon.setDisplaySize(70, 60);

const autoSpinBtnContainer = this.add.container(160, designHeight - 200, [autoSpinBtnCircle, autoSpinBtnIcon]);

const autoSpinBtnHitArea = new Phaser.Geom.Circle(0, 0, autoSpinBtnRadius);
autoSpinBtnContainer.setInteractive(autoSpinBtnHitArea, Phaser.Geom.Circle.Contains);

// MAKE THEM ACCESIBLE OUTSIDE OF CREATE
this.autoSpinBtnContainer = autoSpinBtnContainer;
this.autoSpinBtnHitArea = autoSpinBtnHitArea;

// --- AUTOPLAY SETTINGS OVERLAY ---

const autoSpinOverlayWidth = designWidth * 0.9;
const autoSpinOverlayHeight = designHeight * 0.5;
const autoSpinOverlayYOffset = 60;

const autoSpinSettingsOverlay = this.add.container(centerX, centerY - autoSpinOverlayYOffset)
  .setDepth(2000)
  .setVisible(false);

const autoSpinOverlayBG = this.add.graphics();
autoSpinOverlayBG.fillStyle(0x000000, 0.9);
autoSpinOverlayBG.fillRoundedRect(
  -autoSpinOverlayWidth / 2,
  -autoSpinOverlayHeight / 2,
  autoSpinOverlayWidth,
  autoSpinOverlayHeight,
  20
);

const autoSpinOverlayClosePadding = 40;
const autoSpinOverlayCloseBtn = this.add.image(autoSpinOverlayWidth / 2 - autoSpinOverlayClosePadding, -autoSpinOverlayHeight / 2 + autoSpinOverlayClosePadding, 'closeIcon')
  .setInteractive({ useHandCursor: true })
  .setScale(0.9);

autoSpinSettingsOverlay.add([autoSpinOverlayBG, autoSpinOverlayCloseBtn]);

// Input blocker for the overlay (to block background clicks)
const autoSpinInputBlocker = this.add.rectangle(centerX, centerY, designWidth, designHeight, 0x000000, 0)
  .setDepth(1999)
  .setInteractive()
  .setVisible(false);

// Close handler
autoSpinOverlayCloseBtn.on('pointerdown', () => {
  if (this.sounds && this.sounds.sfx_basicButton) this.sounds.sfx_basicButton.play();
  autoSpinSettingsOverlay.setVisible(false);
  autoSpinInputBlocker.setVisible(false);
  autoSpinBtnContainer.setInteractive(true);
});

// Show overlay on autoplay button click
autoSpinBtnContainer.on('pointerdown', () => {
  autoSpinSettingsOverlay.setVisible(true);
  autoSpinInputBlocker.setVisible(true);
});

//////////////////////// selectorrrrr
// Amount options
const autoSpinAmounts = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Shrink line width
const selectorLineWidth = autoSpinOverlayWidth * 0.45;
const selectorLineHeight = 8;
const selectorLineX = 0;
const selectorLineY = 0;

// Background selector line
const autoSpinSelectorLine = this.add
  .rectangle(selectorLineX, selectorLineY, selectorLineWidth, selectorLineHeight, 0xffffff, 0.2)
  .setOrigin(0.5);
autoSpinSettingsOverlay.add(autoSpinSelectorLine);

// Key visual settings
const keyWidth = 90;
const keyHeight = 60;
const keyColor = 0x00b56b;

// Create rounded key background
const autoSpinKeyBg = this.add.graphics();
autoSpinKeyBg.fillStyle(keyColor, 1);
autoSpinKeyBg.fillRoundedRect(-keyWidth / 2, -keyHeight / 2, keyWidth, keyHeight, 6);

// Scroll icon inside the key
const autoSpinScrollIcon = this.add
  .image(0, 0, 'scrollIcon')
  .setDisplaySize(32, 32);

// Position setup
const minX = selectorLineX - selectorLineWidth / 2;
const maxX = selectorLineX + selectorLineWidth / 2;
const step = selectorLineWidth / (autoSpinAmounts.length - 1);
const initialIndex = 0;
const initialX = minX + initialIndex * step;
const initialY = selectorLineY;

// Create the key container (draggable)
const autoSpinKeyContainer = this.add
  .container(initialX, initialY, [autoSpinKeyBg, autoSpinScrollIcon])
  .setDepth(2100);
autoSpinSettingsOverlay.add(autoSpinKeyContainer);

// Invisible hit area for drag interaction
const hitAreaRect = this.add
  .rectangle(0, 0, keyWidth, keyHeight, 0x000000, 0)
  .setOrigin(0.5)
  .setInteractive();
autoSpinKeyContainer.addAt(hitAreaRect, 0);

// Make it draggable
this.input.setDraggable(hitAreaRect);

// Fixed position for the amount label (right of line)
const fixedTextX = selectorLineX + selectorLineWidth / 2 + 60;
const autoSpinAmountText = this.add
  .text(fixedTextX, selectorLineY, autoSpinAmounts[initialIndex].toString(), {
    fontFamily: 'Arial',
    fontSize: '32px',
    color: '#ffffff',
    fontStyle: 'bold',
  })
  .setOrigin(0, 0.5);
autoSpinSettingsOverlay.add(autoSpinAmountText);

// Drag logic
let dragOffsetX = 0;

function getClosestIndexByX(x) {
  let index = Math.round((x - minX) / step);
  return Phaser.Math.Clamp(index, 0, autoSpinAmounts.length - 1);
}

this.input.on('dragstart', (pointer, gameObject) => {
  if (gameObject === hitAreaRect) {
    dragOffsetX = pointer.x - autoSpinKeyContainer.x;
  }
});

this.input.on('drag', (pointer, gameObject) => {
  if (gameObject === hitAreaRect) {
    let rawX = pointer.x - dragOffsetX;

    // Clamp and snap
    rawX = Phaser.Math.Clamp(rawX, minX, maxX);
    const index = getClosestIndexByX(rawX);
    const snappedX = minX + index * step;

    autoSpinKeyContainer.x = snappedX;
    autoSpinAmountText.setText(autoSpinAmounts[index].toString());
  }
});
//////////////// START BUTTON 
// Button setup
const buttonWidth = 480;
const buttonHeight = 90;
const buttonColor = 0x00b56b;
const buttonY = selectorLineY + 200;

// Create button background
const startAutoPlayBg = this.add.graphics();
startAutoPlayBg.fillStyle(buttonColor, 1);
startAutoPlayBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);

// Create button text
const startAutoPlayText = this.add.text(0, 0, `START AUTOPLAY (${autoSpinAmounts[initialIndex]})`, {
  fontFamily: 'Arial',
  fontSize: '32px',
  color: '#ffffff',
  fontStyle: 'bold',
}).setOrigin(0.5);

// Create container
const startAutoPlayButton = this.add
  .container(selectorLineX, buttonY, [startAutoPlayBg, startAutoPlayText])
  .setSize(buttonWidth, buttonHeight)
  .setInteractive({ useHandCursor: true })
  .setDepth(2100);

autoSpinSettingsOverlay.add(startAutoPlayButton);

// Update text when selection changes
this.input.on('drag', (pointer, gameObject) => {
  if (gameObject === hitAreaRect) {
    let rawX = pointer.x - dragOffsetX;

    rawX = Phaser.Math.Clamp(rawX, minX, maxX);
    const index = getClosestIndexByX(rawX);
    const snappedX = minX + index * step;

    autoSpinKeyContainer.x = snappedX;
    autoSpinAmountText.setText(autoSpinAmounts[index].toString());
    startAutoPlayText.setText(`START AUTOPLAY (${autoSpinAmounts[index]})`);
  }
});

// Button click behavior
startAutoPlayButton.on('pointerdown', () => {
  const selectedIndex = getClosestIndexByX(autoSpinKeyContainer.x);
  const selectedAmount = autoSpinAmounts[selectedIndex];

    // Hide the autoplay settings menu
    autoSpinSettingsOverlay.setVisible(false);
    autoSpinInputBlocker.setVisible(false);

  this.autoSpinsRemaining = selectedAmount;

  if (!this.isAutoSpinning && this.spinButton.visible && this.spinButton.input?.enabled) {
    startAutoSpins.call(this);
  }
});

/////////////////////////// TILTEEEEE

// Title setup
const titleText = this.add.text(0, selectorLineY - 220, 'AUTOPLAY SETTINGS', {
  fontFamily: 'Arial',
  fontSize: '32px',
  fontStyle: 'bold',
  color: '#f2ad41',
}).setOrigin(0.5);

autoSpinSettingsOverlay.add(titleText);

/////////////// Autoplay Spin Icon and Countdown remaining
// AUTOPLAY UI SPIN BUTTON
const autoplaySpinCircle = this.add.graphics();
autoplaySpinCircle.fillStyle(0x000000, 0.5);
autoplaySpinCircle.fillCircle(0, 0, spinRadius);

// Add the autoplay spin icon
const autoplaySpinImage = this.add.image(0, 0, 'autoplaySpinIcon');
autoplaySpinImage.setDisplaySize(80, 80);

// Add remaining spins text
const autoplaySpinText = this.add.text(0, 0, '', {
  fontFamily: 'Arial',
  fontSize: '32px',
  color: '#ffffff',
  fontStyle: 'bold'
}).setOrigin(0.5);

// Combine into a container (same position as regular spin button)
const autoplaySpinUI = this.add.container(centerX, designHeight - 250, [
  autoplaySpinCircle,
  autoplaySpinImage,
  autoplaySpinText
]);

// Define hit area
const autoHitArea = new Phaser.Geom.Circle(0, 0, spinRadius);
autoplaySpinUI.setInteractive(autoHitArea, Phaser.Geom.Circle.Contains);

// Click handler to stop autoplay early
autoplaySpinUI.on('pointerdown', () => {
  this.isAutoSpinning = false;
  this.autoSpinsRemaining = 0;

  // Hide autoplay UI
  this.autoplaySpinUI.setVisible(false);
});

// Hide by default
autoplaySpinUI.setVisible(false);

// ✅ Expose for updates
this.autoplaySpinUI = autoplaySpinUI;
this.autoplaySpinText = autoplaySpinText;


//////////////////////////////////////////////////////////// UI Advanced Bet Settings ////////////////////////////////////////////////////////////////////////////////////
// Create a semi-transparent black circular background
const cashRadius = 55;
const cashCircle = this.add.graphics();
cashCircle.fillStyle(0x000000, 0.5);  // 40% opacity black
cashCircle.fillCircle(0, 0, cashRadius);

// Add the cash icon image
const cashImage = this.add.image(0, 0, 'cashIcon');
cashImage.setDisplaySize(50, 50);  // Adjust size as needed

// Combine into a container to act as a button
const cashButton = this.add.container(160, designHeight - 330, [cashCircle, cashImage]);

// Define hit area as a circle matching the background
const cashHitArea = new Phaser.Geom.Circle(0, 0, cashRadius);
cashButton.setInteractive(cashHitArea, Phaser.Geom.Circle.Contains);

// Add click handler
cashButton.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();
  updateOverlayBetText(); // sync bet value each time
  betOptionsOverlayContainer.setVisible(true);
  inputBlocker.setVisible(true);
  cashButton.disableInteractive();
});

// Store references on `this` AFTER declaration MAKING THEM ACCESIBLE OUTSIDE OF CREATE
this.cashButton = cashButton;
this.cashHitArea = cashHitArea;

////////////// OVERLAY /////////////////////////

// Calculate overlay size
const overlayWidth = designWidth * 0.9;
const overlayHeight = designHeight * 0.75;

// Create container for overlay, positioned centered horizontally, but shifted up vertically
const overlayYOffset = 60;
const betOptionsOverlayContainer = this.add.container(centerX, centerY - overlayYOffset)
  .setDepth(2000)
  .setVisible(false);

// Create semi-transparent rounded rectangle background
const betOptionsOverlayBG = this.add.graphics();
betOptionsOverlayBG.fillStyle(0x000000, 0.9);
betOptionsOverlayBG.fillRoundedRect(
  -overlayWidth / 2,
  -overlayHeight / 2,
  overlayWidth,
  overlayHeight,
  20
);

// Close icon relative to top-right of container
const padding = 40;
const betOptionsCloseIcon = this.add.image(overlayWidth / 2 - padding, -overlayHeight / 2 + padding, 'closeIcon')
  .setInteractive()
  .setScale(0.9);

// Add to container
betOptionsOverlayContainer.add([betOptionsOverlayBG, betOptionsCloseIcon]);

// Input blocker for background
const inputBlocker = this.add.rectangle(centerX, centerY, designWidth, designHeight, 0x000000, 0)
  .setDepth(1999)
  .setInteractive()
  .setVisible(false);

// Close overlay handler
betOptionsCloseIcon.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();
  betOptionsOverlayContainer.setVisible(false);
  inputBlocker.setVisible(false);
  cashButton.setInteractive(true);
});

////////////// BET AMOUNT ROW /////////////////////////

const betRowY = -overlayHeight / 3 + 480;
const overlayBetBoxPadding = { x: 62, y: 30 };
const overlayBetBox = this.add.graphics().setDepth(2000);
function drawOverlayBetBox(w, h) {
  overlayBetBox.clear()
    .fillStyle(0x1f1f1f, 1)
    .fillRoundedRect(-w/2 - overlayBetBoxPadding.x, betRowY - h/2 - overlayBetBoxPadding.y,
                     w + 2*overlayBetBoxPadding.x, h + 2*overlayBetBoxPadding.y, 10)
    .lineStyle(2, 0x404040)
    .strokeRoundedRect(-w/2 - overlayBetBoxPadding.x, betRowY - h/2 - overlayBetBoxPadding.y,
                       w + 2*overlayBetBoxPadding.x, h + 2*overlayBetBoxPadding.y, 10);
}
betOptionsOverlayContainer.add(overlayBetBox);

const overlayBetText = this.add.text(0, betRowY, '', {
  fontFamily: 'GatesFont', fontSize: '32px', color: '#ffffff'
})
  .setOrigin(0.5).setDepth(2001);
betOptionsOverlayContainer.add(overlayBetText);

betOptionsOverlayContainer.add(
  this.add.text(0, betRowY - 70, 'TOTAL BET', {
    fontFamily: 'GatesFont', fontSize: '22px', color: '#ffffff', align: 'center'
  })
    .setOrigin(0.5).setDepth(2001)
);

// Minus button
const overlayMinus = this.add.image(-200, betRowY, 'advancedMinus')
  .setOrigin(0.5).setScale(1.5).setDepth(2001)
  .setInteractive({ useHandCursor: true });

overlayMinus.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();

  // step on total = betStep × betLevel
  const delta = betStep * betLevel;
  if (betAmount - delta >= minBet * betLevel) {
    betAmount = selectedCurrency === 'LBP'
      ? betAmount - delta
      : Math.round((betAmount - delta) * 100) / 100;

    updateOverlayBetText();
    updateBetText();
  }
});
betOptionsOverlayContainer.add(overlayMinus);

// Plus button
const overlayPlus = this.add.image(200, betRowY, 'advancedPlus')
  .setOrigin(0.5).setScale(1.5).setDepth(2001)
  .setInteractive({ useHandCursor: true });

  overlayPlus.on('pointerdown', () => {
    this.sounds.sfx_basicButton.play();
  
    const delta = betStep * betLevel;
    const newBetAmount = betAmount + delta;
  
    const anteMultiplier = this.anteBetActive ? 1.25 : 1;
    const maxTotalBet = selectedCurrency === 'USD' ? 100 : 10000000;
    const maxAllowedBase = maxTotalBet / anteMultiplier;
  
    // Cap the betAmount if needed
    betAmount = Math.min(newBetAmount, maxAllowedBase);
  
    // Round if needed
    if (selectedCurrency === 'USD') {
      betAmount = Math.round(betAmount * 100) / 100;
    }
  
    updateOverlayBetText();
    updateBetText();
  });
  
betOptionsOverlayContainer.add(overlayPlus);


////////////// BET LEVEL ROW /////////////////////////

const betLevelRowY = betRowY - 400;
const overlayBetLevelBox = this.add.graphics().setDepth(2000);
function drawOverlayBetLevelBox(w, h) {
  overlayBetLevelBox.clear()
    .fillStyle(0x1f1f1f, 1)
    .fillRoundedRect(-w/2 - overlayBetBoxPadding.x,
                     betLevelRowY - h/2 - overlayBetBoxPadding.y,
                     w + 2*overlayBetBoxPadding.x,
                     h + 2*overlayBetBoxPadding.y, 10)
    .lineStyle(2, 0x404040)
    .strokeRoundedRect(-w/2 - overlayBetBoxPadding.x,
                       betLevelRowY - h/2 - overlayBetBoxPadding.y,
                       w + 2*overlayBetBoxPadding.x,
                       h + 2*overlayBetBoxPadding.y, 10);
}
betOptionsOverlayContainer.add(overlayBetLevelBox);

const overlayBetLevelText = this.add.text(0, betLevelRowY, '', {
  fontFamily: 'GatesFont', fontSize: '32px', color: '#ffffff'
})
  .setOrigin(0.5).setDepth(2001);
betOptionsOverlayContainer.add(overlayBetLevelText);

betOptionsOverlayContainer.add(
  this.add.text(0, betLevelRowY - 70, 'BET LEVEL', {
    fontFamily: 'GatesFont', fontSize: '22px', color: '#ffffff', align: 'center'
  })
    .setOrigin(0.5).setDepth(2001)
);

// Level Minus
const lvlMinus = this.add.image(-200, betLevelRowY, 'advancedMinus')
  .setOrigin(0.5).setScale(1.5).setDepth(2001)
  .setInteractive({ useHandCursor: true });

lvlMinus.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();
  if (betLevel > 1) {
    const old = betLevel;
    betLevel--;
    // rescale total bet
    betAmount = betAmount / old * betLevel;
    updateOverlayBetLevelText();
    updateOverlayBetText();
  }
});
betOptionsOverlayContainer.add(lvlMinus);

// Level Plus
const lvlPlus = this.add.image(200, betLevelRowY, 'advancedPlus')
  .setOrigin(0.5).setScale(1.5).setDepth(2001)
  .setInteractive({ useHandCursor: true });

  lvlPlus.on('pointerdown', () => {
    this.sounds.sfx_basicButton.play();
    if (betLevel < 10) {
      const old = betLevel;
      const newLevel = betLevel + 1;
  
      // scale up
      let newBetAmount = betAmount / old * newLevel;
  
      const anteMultiplier = this.anteBetActive ? 1.25 : 1;
      const maxTotalBet = selectedCurrency === 'USD' ? 100 : 10000000;
      const maxAllowedBase = maxTotalBet / anteMultiplier;
  
      // cap it
      newBetAmount = Math.min(newBetAmount, maxAllowedBase);
  
      if (selectedCurrency === 'USD') {
        newBetAmount = Math.round(newBetAmount * 100) / 100;
      }
  
      betLevel = newLevel;
      betAmount = newBetAmount;
  
      updateOverlayBetLevelText();
      updateOverlayBetText();
    }
  });
  
betOptionsOverlayContainer.add(lvlPlus);

function updateOverlayBetLevelText() {
  overlayBetLevelText.setText(`${betLevel}x`);
  const b = overlayBetLevelText.getBounds();
  drawOverlayBetLevelBox(b.width, b.height);
  lvlMinus.setAlpha(betLevel>1 ? 1 : 0.4);
  lvlPlus.setAlpha(betLevel<10 ? 1 : 0.4);
}

function updateOverlayBetText() {
  const symbol = selectedCurrency === 'USD' ? '$' : '£';
  const anteMultiplier = this.anteBetActive ? 1.25 : 1;
  const displayBet = betAmount * anteMultiplier;

  const formatted = selectedCurrency === 'USD'
    ? displayBet.toFixed(2)
    : Math.round(displayBet).toLocaleString('en-US');

  overlayBetText.setText(`${symbol}${formatted}`);
  const b = overlayBetText.getBounds();
  drawOverlayBetBox(b.width, b.height);

  const maxTotalBet = selectedCurrency === 'USD' ? 100 : 10000000;
  const minTotalBet = minBet * betLevel * anteMultiplier;

  overlayMinus.setAlpha(displayBet > minTotalBet ? 1 : 0.4);
  overlayPlus.setAlpha(displayBet < maxTotalBet ? 1 : 0.4);

  updateBetText();
}


////////////// COIN VALUE ROW /////////////////////////

const betSteps = {
  USD: [0.20, 0.40, 0.60, 0.80, 1.00],
  LBP: [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 100000]
};

let coinValueIndex = 0; // Index in betSteps


const coinValueRowY = betLevelRowY + 200;
const overlayCoinValueBox = this.add.graphics().setDepth(2000);
function drawOverlayCoinValueBox(w, h) {
  overlayCoinValueBox.clear()
    .fillStyle(0x1f1f1f, 1)
    .fillRoundedRect(-w/2 - overlayBetBoxPadding.x,
                     coinValueRowY - h/2 - overlayBetBoxPadding.y,
                     w + 2*overlayBetBoxPadding.x,
                     h + 2*overlayBetBoxPadding.y, 10)
    .lineStyle(2, 0x404040)
    .strokeRoundedRect(-w/2 - overlayBetBoxPadding.x,
                       coinValueRowY - h/2 - overlayBetBoxPadding.y,
                       w + 2*overlayBetBoxPadding.x,
                       h + 2*overlayBetBoxPadding.y, 10);
}
betOptionsOverlayContainer.add(overlayCoinValueBox);

const overlayCoinValueText = this.add.text(0, coinValueRowY, '', {
  fontFamily: 'GatesFont', fontSize: '32px', color: '#ffffff'
})
  .setOrigin(0.5).setDepth(2001);
betOptionsOverlayContainer.add(overlayCoinValueText);

betOptionsOverlayContainer.add(
  this.add.text(0, coinValueRowY - 70, 'COIN VALUE', {
    fontFamily: 'GatesFont', fontSize: '22px', color: '#ffffff', align: 'center'
  })
    .setOrigin(0.5).setDepth(2001)
);

// Coin Value Minus button
const coinValueMinus = this.add.image(-200, coinValueRowY, 'advancedMinus')
  .setOrigin(0.5).setScale(1.5).setDepth(2001)
  .setInteractive({ useHandCursor: true });

coinValueMinus.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();

  if (coinValueIndex > 0) {
    coinValueIndex--;
    betStep = betSteps[selectedCurrency][coinValueIndex];

    // Recalculate betAmount = betStep * betLevel, clamped by min/max
    const anteMultiplier = this.anteBetActive ? 1.25 : 1;
    const maxTotalBet = selectedCurrency === 'USD' ? 100 : 10000000;
    const maxAllowedBase = maxTotalBet / anteMultiplier;
    const minAllowedBase = minBet * betLevel;

    let newBetAmount = betStep * betLevel;
    newBetAmount = Math.min(Math.max(newBetAmount, minAllowedBase), maxAllowedBase);
    if (selectedCurrency === 'USD') newBetAmount = Math.round(newBetAmount * 100) / 100;

    betAmount = newBetAmount;

    updateOverlayCoinValueText();
    updateOverlayBetText();
  }
});
betOptionsOverlayContainer.add(coinValueMinus);

// Coin Value Plus button
const coinValuePlus = this.add.image(200, coinValueRowY, 'advancedPlus')
  .setOrigin(0.5).setScale(1.5).setDepth(2001)
  .setInteractive({ useHandCursor: true });

coinValuePlus.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();

  const maxIndex = betSteps[selectedCurrency].length - 1;
  if (coinValueIndex < maxIndex) {
    coinValueIndex++;
    betStep = betSteps[selectedCurrency][coinValueIndex];

    // Recalculate betAmount = betStep * betLevel, clamped by min/max
    const anteMultiplier = this.anteBetActive ? 1.25 : 1;
    const maxTotalBet = selectedCurrency === 'USD' ? 100 : 10000000;
    const maxAllowedBase = maxTotalBet / anteMultiplier;
    const minAllowedBase = minBet * betLevel;

    let newBetAmount = betStep * betLevel;
    newBetAmount = Math.min(Math.max(newBetAmount, minAllowedBase), maxAllowedBase);
    if (selectedCurrency === 'USD') newBetAmount = Math.round(newBetAmount * 100) / 100;

    betAmount = newBetAmount;

    updateOverlayCoinValueText();
    updateOverlayBetText();
  }
});
betOptionsOverlayContainer.add(coinValuePlus);

function updateOverlayCoinValueText() {
  // Format coin value display nicely, e.g. "$0.01" or "£10,000"
  const coinVal = betStep;
  const symbol = selectedCurrency === 'USD' ? '$' : '£';

  const displayVal = selectedCurrency === 'USD'
    ? coinVal.toFixed(2)
    : coinVal.toLocaleString('en-US');

  overlayCoinValueText.setText(`${symbol}${displayVal}`);

  const b = overlayCoinValueText.getBounds();
  drawOverlayCoinValueBox(b.width, b.height);

  // Enable/disable buttons visually
  coinValueMinus.setAlpha(coinValueIndex > 0 ? 1 : 0.4);
  coinValuePlus.setAlpha(coinValueIndex < betSteps[selectedCurrency].length - 1 ? 1 : 0.4);
}

///////////////////////////////// MAX BET
// === BET MAX BUTTON ===
const betMaxButton = this.add.container(-130, coinValueRowY + 350).setDepth(2001);
betOptionsOverlayContainer.add(betMaxButton);

const betMaxBackground = this.add.graphics();
betMaxBackground.fillStyle(0x00b56b, 1); // #00b56b green
betMaxBackground.fillRoundedRect(-100, -25, 220, 100, 12); // width 200, height 50, corner radius 12
betMaxButton.add(betMaxBackground);

const betMaxText = this.add.text(10, 25, 'BET MAX', {
  fontFamily: 'GatesFont',
  fontSize: '32px',
  color: '#ffffff'
}).setOrigin(0.5);
betMaxButton.add(betMaxText);

// Make button interactive
betMaxButton.setSize(220, 100).setInteractive({ useHandCursor: true });

betMaxButton.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();

  // Set to max level
  betLevel = 10;

  // Set to max coin value index
  coinValueIndex = betSteps[selectedCurrency].length - 1;
  betStep = betSteps[selectedCurrency][coinValueIndex];

  // Set to max allowed total bet
  betAmount = selectedCurrency === 'USD' ? 100 : 10000000;

  // Update all related UI
  updateOverlayBetLevelText();
  updateOverlayCoinValueText();
  updateOverlayBetText();
});


///////////////////////////////// ADVANCED SETTINGS CURRENCY TOGGLE SWITCH

// Toggle container
const currencySwitch = this.add.container(centerX - 220, coinValueRowY + 370).setDepth(2001);
betOptionsOverlayContainer.add(currencySwitch);

// Background (toggle pill)
const switchWidth = 220;
const switchHeight = 60;
const toggleBg = this.add.graphics();
toggleBg.fillStyle(0x222222, 1); // Dark base
toggleBg.fillRoundedRect(-switchWidth / 2, -switchHeight / 2, switchWidth, switchHeight, 30);
currencySwitch.add(toggleBg);

// Active knob (highlighted side)
const toggleKnob = this.add.graphics();
toggleKnob.fillStyle(0x00b56b, 1); // Green highlight
toggleKnob.fillRoundedRect(-switchWidth / 2, -switchHeight / 2, switchWidth / 2, switchHeight, 30);
currencySwitch.add(toggleKnob);

// Labels
const usdLabel = this.add.text(-switchWidth / 4, 0, 'USD', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#ffffff'
}).setOrigin(0.5);
const lbpLabel = this.add.text(switchWidth / 4, 0, 'LBP', {
  fontFamily: 'GatesFont',
  fontSize: '28px',
  color: '#ffffff'
}).setOrigin(0.5);
currencySwitch.add(usdLabel);
currencySwitch.add(lbpLabel);

// Set interactive area
currencySwitch.setSize(switchWidth, switchHeight).setInteractive({ useHandCursor: true });

// Track knob state visually
const updateToggleKnob = () => {
  if (selectedCurrency === 'USD') {
    toggleKnob.clear();
    toggleKnob.fillStyle(0x00b56b, 1);
    toggleKnob.fillRoundedRect(-switchWidth / 2, -switchHeight / 2, switchWidth / 2, switchHeight, 30);
  } else {
    toggleKnob.clear();
    toggleKnob.fillStyle(0x00b56b, 1);
    toggleKnob.fillRoundedRect(0, -switchHeight / 2, switchWidth / 2, switchHeight, 30);
  }
};
updateToggleKnob();

// Toggle behavior (same logic as your original)
currencySwitch.on('pointerdown', () => {
  this.sounds.sfx_basicButton.play();

  selectedCurrency = selectedCurrency === 'USD' ? 'LBP' : 'USD';
  updateToggleKnob();


  // Reset all relevant state
  betLevel = 1; // Reset bet level
  coinValueIndex = 0;
  betStep = betSteps[selectedCurrency][coinValueIndex];

  updateBetLimits();
  betAmount = minBet;

  this.anteBetActive = false;
  this.toggleKeyContainer.x = -20;
  this.toggleCheck.setVisible(false);
  this.toggleArrow.setVisible(true);

  updateBalanceText();
  updateBetText();
  updateBuyFreeSpinsPrice();
  updateAnteBetSprites();
  updateOverlayCoinValueText();
  updateOverlayBetText();
  updateOverlayBetLevelText();
});



//////////////////// TITLE /////////////////////////////////////
const betTitleText = this.add.text(0, -400, 'BET MULTIPLIER 20X', {
  fontFamily: 'GatesFont',
  fontSize: '36px',
  color: '#f2ad41'
}).setOrigin(0.5).setDepth(2001);

betOptionsOverlayContainer.add(betTitleText);



updateOverlayBetText = updateOverlayBetText.bind(this);
updateOverlayBetLevelText();
updateOverlayCoinValueText();



////// Functions to Compute amounts


//////////////////////////////////////////////////////////// UI FOR BALANCE AND BET AMOUNT ////////////////////////////////////////////////////////////////////////////////////

// --- Create the balance text UI element ---
balanceText = this.add.text(180, designHeight - 96, '$0.00', {
  fontFamily: 'GatesFont',
    fontSize: '30px',
    fill: '#ffffff',  // white
}).setDepth(10); // Display on top of other elements

// --- Create "Credit:" label (orange) ---
creditText = this.add.text(80, designHeight - 96, 'Credit', {
  fontFamily: 'GatesFont',
  fontSize: '30px',
  fill: '#f6ae41', // orange
}).setDepth(10);


// --- Fetch and update balance from the server ---
updateBalanceFromServer();

// TOTAL Win Message:
winText = this.add.text(centerX, designHeight - 200, '', {
  font: '32px Arial',
  fill: '#ffff00'
})
.setOrigin(0.5)
.setDepth(10)
.setVisible(false);

// --- "BET:" label in orange ---
betLabel = this.add.text(centerX + 60, designHeight - 80, 'BET', {
  fontFamily: 'GatesFont',
  fontSize: '30px',
  fill: '#f6ae41'  // orange
}).setOrigin(0, 0.5).setDepth(10);

// --- Bet amount text in white ---
betText = this.add.text(betLabel.x + betLabel.width + 5, designHeight - 80, '', {
  fontFamily: 'GatesFont',
  fontSize: '30px',
  fill: '#ffffff'  // white
}).setOrigin(0, 0.5).setDepth(10);

// --- Update Bet Display and Button States ---
function updateBetText() {
  const symbol = selectedCurrency === 'USD' ? '$' : '£';

  // Calculate displayed bet, +25% if ante active (but don't modify actual betAmount)
  let displayBet = betAmount * (this.anteBetActive ? 1.25 : 1);

  // Format with decimals or not, based on currency, and add commas
  const formattedBetAmount = selectedCurrency === 'USD'
    ? displayBet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })  // USD with 2 decimals and commas
    : Math.round(displayBet).toLocaleString();  // LBP integer with commas

  betText.setText(`${symbol}${formattedBetAmount}`);

  updateBuyFreeSpinsPrice();
  updateAnteBetSprites();
}
updateBetText = updateBetText.bind(this);


// --- Update Balance Display Based on Selected Currency ---
function updateBalanceText() {
  if (selectedCurrency === 'USD') {
    balanceText.setText(`$${userBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  } else {
    balanceText.setText(`£${userBalanceLBP.toLocaleString()}`);
  }
}

// Expose it on the scene instance
this.updateBalanceText = updateBalanceText;

// --- Fetch Balance From Server and Update Display ---
async function updateBalanceFromServer() {
  try {
    const res = await fetch('/auth/session');
    const data = await res.json();

    userBalanceUSD = data.balanceUSD;
    userBalanceLBP = data.balanceLBP;

    updateBalanceText();
  } catch (err) {
    console.error('Failed to fetch balances:', err);
    balanceText.setText('Error');
  }
}

// --- Set minimum, maximum bet, and bet step for each currency ---
function updateBetLimits() {
  if (selectedCurrency === 'USD') {
    minBet = 0.20;
    maxBet = 100.00;
    betStep = 0.20;
  } else if (selectedCurrency === 'LBP') {
    minBet = 10000;
    maxBet = 10000000;
    betStep = 10000;
  }

  // Update bet text after adjusting limits
  updateBetText();
}

// Currency Toggle Button
const currencyToggle = this.add.text(20, designHeight - 150, 'Switch to LBP', {
  font: '24px Arial',
  fill: '#00ffff',
  backgroundColor: '#222',
  padding: { x: 8, y: 4 }
}).setInteractive().setDepth(10);

// Toggle handler
currencyToggle.on('pointerdown', () => {
  // Toggle between USD and LBP
  selectedCurrency = selectedCurrency === 'USD' ? 'LBP' : 'USD';
  currencyToggle.setText(`Switch to ${selectedCurrency === 'USD' ? 'LBP' : 'USD'}`);

    // Reset coin value state
    coinValueIndex = 0;
    betStep = betSteps[selectedCurrency][coinValueIndex];
  
  // Update bet limits based on the selected currency
  updateBetLimits();

  // Reset bet amount to the minimum bet for the selected currency
  betAmount = minBet;

  // Turn off ante bet when switching currencies
  this.anteBetActive = false;
  this.toggleKeyContainer.x = -20;  // Move toggle knob left
  this.toggleCheck.setVisible(false);
  this.toggleArrow.setVisible(true);

  // Update balance and bet displays
  updateBalanceText();
  updateBetText();
  updateBuyFreeSpinsPrice();
  updateAnteBetSprites();
  updateOverlayCoinValueText();
});

// --- Initial UI setup ---
updateBetLimits();  // Set the initial limits and bet step based on the selected currency
updateBetText();    // Update the bet display to reflect the initial bet step and limits


}

function spinGrid(cols, rows, symbolKeys, gridContainer, boxWidth, boxHeight, quickSpinEnabled, onComplete) {

  const fallDistance = 300;
  // Use faster timings if quick spin is enabled
  const oldFallDuration = quickSpinEnabled ? 150 : 250;
  const newDropDuration = quickSpinEnabled ? 150 : 250;
  const delayPerCol = quickSpinEnabled ? 0 : 120;

  const newSymbols = [];
  const orbData = []; // Array to store orb data during spin

  const scaleMap = {
    crown: 1.05,
    hourglass: 1.05,
    ring: 1.05,
    chalice: 1.05,
    gem_red: 0.8,
    gem_purple: 0.8,
    gem_yellow: 0.8,
    gem_green: 0.8,
    gem_blue: 0.8,
    orb_green: 1.05,
    orb_blue: 1.05,
    orb_purple: 1.05,
    orb_red: 1.05,
    scatter: 1.1
  };

  this._hadAnyMatchesThisSpin = false;
  processedScatterPositions = false;

// Only reset win display if we're NOT in free spins
if (!isInFreeSpins) {
  this.winTextContainer.setVisible(false);
  setGameMessage(this, 'GOOD LUCK!');
  this.displayedWinValue = 0;
  
  if (this.winTween) {
    this.winTween.stop();
    this.winTween = null;
  }
  this.plainTextWin.setText('');
  this.winLabel.setText('WIN ');

  // Also reset the free spins accumulator (defensive)
  this.freeSpinsTotalWin = 0;
}


  // Animate and destroy old symbols
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const oldSymbol = this.symbols[row][col];

      this.tweens.add({
        targets: oldSymbol,
        y: oldSymbol.y + fallDistance,
        duration: oldFallDuration,
        delay: col * delayPerCol,
        ease: 'Quad.easeIn',
        onComplete: () => oldSymbol.destroy()
      });
    }
  }

  const startNewDropDelay = oldFallDuration + delayPerCol * (cols - 1);
  this.symbols = [];

  this.time.delayedCall(startNewDropDelay, () => {
    for (let col = 0; col < cols; col++) {
      newSymbols[col] = [];

      this.time.delayedCall(col * delayPerCol, () => {
        for (let row = 0; row < rows; row++) {
          let newKey;
          let orbValue = null;
          let isOrb = false;

    // Use doubled scatter chance if ante bet is active
    const scatterChance = this.anteBetActive ? SCATTER_CHANCE * 2 : SCATTER_CHANCE;

    if (Math.random() < scatterChance) {
      newKey = 'scatter'; // Scatter symbol key, load this texture beforehand
    } else if (Math.random() < ORB_APPEARANCE_CHANCE) {
         const orbColor = pickWeightedColor(orbColorWeights);
         const orbDataItem = pickWeightedRandom(orbValuePools[orbColor]);

          newKey = `orb_${orbColor}`;
          orbValue = orbDataItem.value;
          isOrb = true;

          orbData.push({ color: orbColor, value: orbValue, row, col });
         } else {
         newKey = pickWeightedSymbol(weightedPool);
       }


          const startY = row * boxHeight - fallDistance;
          const targetY = row * boxHeight + boxHeight / 2;
          const x = col * boxWidth + boxWidth / 2;

          if (isOrb && orbValue !== null) {
            // === ORB: Create container with orb and multiplier value ===
            const orbSprite = this.add.image(0, 0, newKey);
            const scale = scaleMap[newKey] || 1.0;
            orbSprite.setScale(scale * Math.min((boxWidth - 4) / orbSprite.width, (boxHeight - 4) / orbSprite.height));
            orbSprite.orbValue = orbValue;

            // Use sprite-based multiplier and group both in a container
            const multiplierSprites = createMultiplierSprites.call(this, orbValue); // returns an array of digit sprites
            const orbContainer = this.add.container(x, startY, [orbSprite, ...multiplierSprites]);
            orbContainer.setSize(boxWidth, boxHeight);

            // 🔥 ADD ORB THUNDER EFFECTS
            const orbColor = newKey.split('_')[1]; // Extract color from key: "orb_blue" -> "blue"

            const thunderKeys = {
              blue: 'blueThunder',
              green: 'greenThunder',
              purple: 'purpleThunder',
              red: 'redThunder'
            };

            const thunderAnimKeys = {
              blue: 'blueThunderAnim',
              green: 'greenThunderAnim',
              purple: 'purpleThunderAnim',
              red: 'redThunderAnim'
            };

            if (thunderKeys[orbColor]) {
              const thunder = this.add.sprite(0, 0, thunderKeys[orbColor]);
              thunder.setScale(1);
              thunder.setOrigin(0.5, 1);
              thunder.y = -orbSprite.displayHeight / 2 + 100;
              orbContainer.add(thunder);

              this.time.delayedCall(150, () => {
                // Play orb lightning sound
                this.sounds.sfx_orbLightning.play();
                thunder.play(thunderAnimKeys[orbColor]);
                playZeusReaction(this);
              });
            }

            gridContainer.add(orbContainer);

            // Tween the container
            this.tweens.add({
              targets: orbContainer,
              y: targetY + 10,
              duration: newDropDuration,
              ease: 'Cubic.easeOut',
              onComplete: () => {
                this.tweens.add({
                  targets: orbContainer,
                  y: targetY,
                  duration: 100,
                  ease: 'Sine.easeOut',
                  onStart: () => {
                    // Play sound only for bottom row in each column
                    if (row === rows - 1 && this.sounds?.sfx_reelsDrop) {
                      this.sounds.sfx_reelsDrop.play();
                    }
                  }
                });
              }
            });

            newSymbols[col][row] = orbContainer;

          } else {
            // === REGULAR SYMBOL ===
            const sprite = this.add.image(x, startY, newKey);
            const scale = scaleMap[newKey] || 1.0;
            sprite.setScale(scale * Math.min((boxWidth - 4) / sprite.width, (boxHeight - 4) / sprite.height));
            gridContainer.add(sprite);

            // Tween the symbol
            this.tweens.add({
              targets: sprite,
              y: targetY + 10,
              duration: newDropDuration,
              ease: 'Cubic.easeOut',
              onComplete: () => {
                this.tweens.add({
                  targets: sprite,
                  y: targetY,
                  duration: 100,
                  ease: 'Sine.easeOut',
                  onStart: () => {
                    // Play sound only for bottom row in each column
                    if (row === rows - 1 && this.sounds?.sfx_reelsDrop) {
                      this.sounds.sfx_reelsDrop.play();
                    }
                  }
                });
              }
            });

            newSymbols[col][row] = sprite;
          }
        }
      });
    }
  });

  const totalDropTime = startNewDropDelay + delayPerCol * cols + newDropDuration + 100;

  this.time.delayedCall(totalDropTime, () => {
    for (let row = 0; row < rows; row++) {
      this.symbols[row] = [];
      for (let col = 0; col < cols; col++) {
        this.symbols[row][col] = newSymbols[col][row];
      }
    }

    checkMatchesAndRemove.call(this, cols, rows, symbolKeys, gridContainer, boxWidth, boxHeight, onComplete, orbData);
  });
}

function checkMatchesAndRemove(cols, rows, symbolKeys, gridContainer, boxWidth, boxHeight, onComplete, orbData) {
  const counts = {};
  const positions = {};
  console.log('checkMatchesAndRemove called', performance.now());
  // 1) Count symbols and store positions
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sprite = this.symbols[row][col];
      if (sprite && sprite.texture) { // Check if sprite exists and has a texture
        const key = sprite.texture.key;
        if (!counts[key]) {
          counts[key] = 0;
          positions[key] = [];
        }
        counts[key]++;
        positions[key].push({ row, col, sprite });

        // Track orb data if the sprite is an orb
        if (key.startsWith('orb_') && sprite.orbValue) {
          orbData.push({ color: key.split('_')[1], value: sprite.orbValue, row, col });
        }
      }
    }
  }

// 2) Separate scatter symbol name
const scatterSymbol = 'scatter'; 

// Find regular matches with 8+ occurrences (excluding scatter)
const matchedKeysRegular = Object
  .keys(counts)
  .filter(key => key !== scatterSymbol && counts[key] >= 8);

// Find scatter matches with 4,5, or 6 occurrences
const matchedKeysScatter = Object
  .keys(counts)
  .filter(key =>
    key === scatterSymbol &&
    counts[key] >= 4
  );  

const matchedKeys = [...matchedKeysRegular];

// Only add scatter matches if ALL of these are true: there are no regular matches this pass, we have scatter matches, and we haven’t processed scatters yet
if (
  matchedKeysRegular.length === 0 &&
  matchedKeysScatter.length > 0 &&
  !processedScatterPositions
) {
  matchedKeys.push(scatterSymbol);
  processedScatterPositions = true;
}

if (matchedKeys.length === 0) {
  console.log("No matches found.");

  (async () => {
    // 1) If there was a match, animate orbs & resolve win first
    if (this._hadAnyMatchesThisSpin) {
      this._orbsAnimationPromise = animateOrbsToWinTab.call(
        this,
        orbData,
        isInFreeSpins ? freeSpinsGlobalMultiplier : 0
      );
      try {
        await this._orbsAnimationPromise;
      } catch (err) {
        console.warn('⚠️ Orbs animation failed or was skipped:', err);
      }

      if (this.pendingSymbolCounts.length > 0) {
        console.log('orbData going to resolveWin:', orbData);

        if (isInFreeSpins) {
          try {
            const res = await fetch('/games/gates/resolve-win', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bet: betAmount,
                currency: selectedCurrency,
                symbolCounts: this.pendingSymbolCounts,
                orbData,
                isFreeSpin: true,
                globalMultiplier: freeSpinsGlobalMultiplier
              })
            });
            const data = await res.json();

            // update multiplier pillar if needed
            if (typeof data.updatedGlobalMultiplier === 'number') {
              freeSpinsGlobalMultiplier = data.updatedGlobalMultiplier;
              displayMultiplierPillarNumber.call(this, freeSpinsGlobalMultiplier);
              if (this.multiplierNumberSprites?.length) {
                this.tweens.add({
                  targets: this.multiplierNumberSprites,
                  scale: {
                    from: this.multiplierNumberSprites[0].scaleX * 1.2,
                    to: this.multiplierNumberSprites[0].scaleX
                  },
                  duration: 300,
                  ease: 'Back.easeOut'
                });
              }
            }
            if (data.totalWin > 0) {
              this.displayWinMessage?.(data.totalWin);
            }
            freeSpinsTotalWin = parseFloat((freeSpinsTotalWin + data.totalWin).toFixed(2));
          } catch (err) {
            console.error('❌ Failed to resolve win during free spin:', err);
            return endFreeSpins(this, this.updateBalanceText);
          }
        } else {
          resolveWin.call(
            this,
            betAmount,
            selectedCurrency,
            this.pendingSymbolCounts,
            orbData
          );
        }
      }
    }

    // 2) Now check for scatter retrigger in free spins (3+ scatters)
    if (isInFreeSpins) {
      const scatterCount = Object.keys(counts)
        .filter(k => k.startsWith('scatter'))
        .reduce((sum, k) => sum + counts[k], 0);

      if (scatterCount >= 3) {
        remainingFreeSpins += 5;
        console.log(`✅ Added 5 free spins (scatters: ${scatterCount}), remaining: ${remainingFreeSpins}`);

        // animate scatter symbols
        animateScatterSymbols(this.symbols, gridContainer, this);

        // wait for animation, then show popup, then next spin
        this.time.delayedCall(1200, () => {
          showCongratulationsPopup.call(this, 5, () => {
            playNextFreeSpin(
              this,
              cols, rows,
              boxWidth, boxHeight,
              gridContainer,
              symbolKeys
            );
          });
        });

        return; // ⇦ exit here so we don’t fall through
      }
    }

    // 3) No scatter retrigger — just proceed to next free spin immediately
    if (isInFreeSpins) {
     console.log("🟡 No retrigger, playing next free spin immediately");
     playNextFreeSpin(
     this,
     cols, rows,
     boxWidth, boxHeight,
     gridContainer,
     symbolKeys
   );
  }

    // 4) Clean up
    if (onComplete) onComplete();
  })();



// ✅ Scatter free spin trigger outside match block
if (!isInFreeSpins) {
  const scatterCount = Object.keys(counts)
    .filter(k => k.startsWith('scatter'))
    .reduce((sum, k) => sum + counts[k], 0);

  if (scatterCount >= 4) {
    console.log(`✅ Triggering free spins with ${scatterCount} scatters`);

        // ✅ Stop autoplay if it's running
        if (this.isAutoSpinning) {
          this.isAutoSpinning = false;
          this.autoSpinsRemaining = 0;
          this.autoplaySpinUI?.setVisible(false);
        }
    

    // Wrap in async IIFE to await orbs animation if needed
    (async () => {
      if (this._orbsAnimationPromise) {
        try {
          await this._orbsAnimationPromise;
        } catch (err) {
          console.warn('⚠️ Orbs animation failed or was skipped:', err);
        }
      }

          // 🔥 Animate scatter symbols before showing the popup
          animateScatterSymbols(this.symbols, gridContainer, this);

      // Wait ~1.2s to match the animation timing
       this.time.delayedCall(1200, () => {
      // Show the free spins congratulations popup (e.g., 15 spins)
      showCongratulationsPopup.call(this, 15, () => {
        // After popup closes, play thunder animation
        playScreenThunder.call(this, () => {
          // After thunder animation completes, start real free spins
          startFreeSpins(
            this,
            cols,
            rows,
            boxWidth,
            boxHeight,
            gridContainer,
            symbolKeys
          );
        });
      });
     }); 
    })();

    return;
  }
}


  return; // Exit early
}


// ✅ PLACE THIS RIGHT HERE
this._hadAnyMatchesThisSpin = true;

  // 2a) Build one-cascade symbolCounts … 
  const symbolCounts = {};
  for (const key of matchedKeys) {
    symbolCounts[key] = counts[key];
  }
  // … then push that single cascade’s counts into the array:
  this.pendingSymbolCounts.push(symbolCounts);

  // Show individual win message per match
  for (const key of matchedKeys) {
    const count = counts[key];
    const amount = calculateIndividualWin(key, count) * betAmount;
    if (amount > 0) {
      // 1) Floating popup (already in place)
      displayIndividualWinMessage.call(this, amount);

      // Detect first win and trigger fade-in if needed
      const wasZero = this.totalWinAmountForTab === 0;
      this.totalWinAmountForTab += amount;
      updateWinTabSpriteDisplay.call(this);
      // Dont Update Base Wins during Free Spins
      if (!isInFreeSpins) {
      updatePlaintextWithBaseWin.call(this, this.totalWinAmountForTab);
      }
      if (wasZero && this.totalWinAmountForTab > 0) {
        fadeInWinTab.call(this);
      }
      // 2) Add to history table
      addHistorySlot(this, key, count, amount);  
    }
  }



 // 3) Highlight matched symbols (skip scatter)
const highlightSprites = [];
for (const key of matchedKeys) {
    // 🔊 Play symbol match sound once
    this.sounds.sfx_symbolsMatch.play();
  if (key === scatterSymbol) continue;  // skip scatter here
  for (const { row, col } of positions[key]) {
    const xOffset = -4;
    const yOffset = 2;
    const highlight = this.add.sprite(
      col * boxWidth + boxWidth / 2 + xOffset,
      row * boxHeight + boxHeight / 2 + yOffset,
      'highlight'
    );
    highlight.setDisplaySize(boxWidth + 50, boxHeight + 30);
    highlight.setOrigin(0.5);
    highlight.play('highlightAnim');
    highlight.setDepth(999);
    gridContainer.add(highlight);
    highlightSprites.push(highlight);
  }
}

// 4) Animate matched symbols (skip scatter)
for (const key of matchedKeys) {
  if (key === scatterSymbol) continue;  // skip scatter here
  for (const { sprite } of positions[key]) {
    const originalScaleX = sprite.scaleX;
    const originalScaleY = sprite.scaleY;
    this.tweens.add({
      targets: sprite,
      scaleX: originalScaleX * 1.12,
      scaleY: originalScaleY * 1.12,
      duration: 280,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        const worldPoint = sprite.getWorldTransformMatrix().transformPoint(0, 0);
        const localPoint = gridContainer
          .getLocalTransformMatrix()
          .applyInverse(worldPoint.x, worldPoint.y);
        const impact = this.add.sprite(localPoint.x, localPoint.y, 'impactParticle');
        impact.setScale(0.8);
        impact.setDepth(sprite.depth - 1);
        impact.play('impactAnim');
        gridContainer.add(impact);
      }
    });
  }
}


// 5) Explode and destroy matched symbols (skip scatter)
this.time.delayedCall(1800, () => {
  for (const key of matchedKeys) {

      // 🔊 Play symbol match sound once
      this.sounds.sfx_symbolsExplode.play();

    if (key === scatterSymbol) continue;  // skip scatter here
    for (const { row, col, sprite } of positions[key]) {
      const worldPoint = sprite.getWorldTransformMatrix().transformPoint(0, 0);
      const explosion = this.add.sprite(worldPoint.x, worldPoint.y, 'explodeParticle');
      const targetWidth = sprite.displayWidth * 3;
      const uniformScale = targetWidth / 500;
      explosion.setScale(uniformScale);
      explosion.setOrigin(0.5);
      explosion.setDepth(sprite.depth + 1);
      explosion.play('explodeAnim');
      explosion.setMask(gridContainer.mask);
      explosion.on('animationcomplete', () => explosion.destroy());
      sprite.destroy();
      this.symbols[row][col] = null;
    }
  }
  highlightSprites.forEach(h => h.destroy());
});

// 6) Cascade & refill — handled by cascadeAndRefillGrid,
// which internally re-calls checkMatchesAndRemove
this.time.delayedCall(2400, () => {
  cascadeAndRefillGrid.call(
    this,
    cols, rows, symbolKeys,
    gridContainer, boxWidth, boxHeight,
    onComplete,
    orbData // passed along for final resolve
  );
});


}




function cascadeAndRefillGrid(
  cols, rows, symbolKeys,
  gridContainer, boxWidth, boxHeight,
  onComplete,
  orbData    // ← keep passing this along
) {
  const fallDuration = 250;

  const scaleMap = {
    crown:    1.05,
    hourglass:1.05,
    ring:     1.05,
    chalice:  1.05,
    gem_red:   0.8,
    gem_purple:0.8,
    gem_yellow:0.8,
    gem_green: 0.8,
    gem_blue:  0.8,
    orb_green: 1.05,
    orb_blue:  1.05,
    orb_purple:1.05,
    orb_red:   1.05,
    scatter:   1.1 // Add scaling for scatter
  };

  for (let col = 0; col < cols; col++) {
    let emptySpots = 0;

    // 1) Cascade existing symbols down
    for (let row = rows - 1; row >= 0; row--) {
      const symbol = this.symbols[row][col];
      if (!symbol) {
        emptySpots++;
      } else if (emptySpots > 0) {
        const newY = symbol.y + emptySpots * boxHeight;
        this.tweens.add({
          targets: symbol,
          y: newY,
          duration: fallDuration,
          ease: 'Quad.easeIn'
        });
        this.symbols[row + emptySpots][col] = symbol;
        this.symbols[row][col] = null;

        // Update orbData if this is an orb that moved
        const orbIndex = orbData.findIndex(orb => orb.row === row && orb.col === col);
        if (orbIndex !== -1) {
          orbData[orbIndex].row = row + emptySpots;
        }
      }
    }

    // 2) Fill the top empty spots
    for (let i = 0; i < emptySpots; i++) {
      let newKey, orbValue = null, isOrb = false;
      const x = col * boxWidth + boxWidth / 2;
      const startY = -boxHeight * (emptySpots - i);
      const targetY = i * boxHeight + boxHeight / 2;

        // 🎵 Play drop sound once before the first symbol drops
        if (col === 0 && i === 0 && this.sounds?.sfx_reelsDrop) {
       this.sounds.sfx_reelsDrop.play();
       }


      const effectiveScatterChance = this.anteBetActive ? SCATTER_CHANCE * 2 : SCATTER_CHANCE;

      // Check for SCATTER chance
      if (Math.random() < effectiveScatterChance) {
        newKey = 'scatter';
        const sprite = this.add.image(x, startY, newKey);
        const scale = scaleMap[newKey] || 1;
        sprite.setScale(scale * Math.min((boxWidth - 4) / sprite.width, (boxHeight - 4) / sprite.height));
        gridContainer.add(sprite);

        this.tweens.add({
          targets: sprite,
          y: targetY,
          duration: fallDuration,
          ease: 'Quad.easeOut'
        });

        this.symbols[i][col] = sprite;
      }

      // Check for ORB
      else if (Math.random() < ORB_APPEARANCE_CHANCE) {
        const orbColor = pickWeightedColor(orbColorWeights);
        const orbInfo  = pickWeightedRandom(orbValuePools[orbColor]);
        newKey = `orb_${orbColor}`;
        orbValue = orbInfo.value;
        isOrb = true;

        const orbSprite = this.add.image(0, 0, newKey);
        const scale = scaleMap[newKey] || 1.0;
        orbSprite.setScale(scale * Math.min((boxWidth - 4) / orbSprite.width, (boxHeight - 4) / orbSprite.height));
        orbSprite.orbValue = orbValue;

        const multiplierSprites = createMultiplierSprites.call(this, orbValue);
        const orbContainer = this.add.container(x, startY, [orbSprite, ...multiplierSprites]);
        orbContainer.setSize(boxWidth, boxHeight);

        const color = newKey.split('_')[1];
        const thunderKeys = { blue: 'blueThunder', green: 'greenThunder', purple: 'purpleThunder', red: 'redThunder' };
        const thunderAnims = { blue: 'blueThunderAnim', green: 'greenThunderAnim', purple: 'purpleThunderAnim', red: 'redThunderAnim' };
        if (thunderKeys[color]) {
          const thunder = this.add.sprite(0, 0, thunderKeys[color]).setOrigin(0.5, 1).setScale(1);
          thunder.y = -orbSprite.displayHeight / 2 + 100;
          orbContainer.add(thunder);
          
          this.time.delayedCall(150, () => {
            // Play orb lightning sound
            this.sounds.sfx_orbLightning.play();
            thunder.play(thunderAnims[color]);
            playZeusReaction(this);
          });
        }        

        gridContainer.add(orbContainer);
        this.tweens.add({
          targets: orbContainer,
          y: targetY + 10,
          duration: fallDuration,
          ease: 'Cubic.easeOut',
          onComplete: () => this.tweens.add({ targets: orbContainer, y: targetY, duration: 100, ease: 'Sine.easeOut' })
        });

        this.symbols[i][col] = orbContainer;
        orbData.push({ color: orbColor, value: orbValue, row: i, col });

      }

      // Regular symbol
      else {
        newKey = pickWeightedSymbol(weightedPool);
        const sprite = this.add.image(x, startY, newKey);
        const scale = scaleMap[newKey] || 1;
        sprite.setScale(scale * Math.min((boxWidth - 4) / sprite.width, (boxHeight - 4) / sprite.height));
        gridContainer.add(sprite);
        this.tweens.add({ targets: sprite, y: targetY, duration: fallDuration, ease: 'Quad.easeOut' });
        this.symbols[i][col] = sprite;
      }
    }
  }

  // 3) When cascades finish, re-check for matches, passing orbData along
  this.time.delayedCall(fallDuration + 50, () => {
    checkMatchesAndRemove.call(
      this,
      cols, rows, symbolKeys,
      gridContainer, boxWidth, boxHeight,
      onComplete,
      orbData    // ← keep passing it
    );
  });
}




function fakeScatterSpinGrid(cols, rows, gridContainer, boxWidth, boxHeight, weightedPool, onComplete) {
  const fallDistance = 300;
  const oldFallDuration = 300;
  const newDropDuration = 300;
  const delayPerCol = 120;

  const scaleMap = {
    crown: 1.05,
    hourglass: 1.05,
    ring: 1.05,
    chalice: 1.05,
    gem_red: 0.8,
    gem_purple: 0.8,
    gem_yellow: 0.8,
    gem_green: 0.8,
    gem_blue: 0.8,
    orb_green: 1.05,
    orb_blue: 1.05,
    orb_purple: 1.05,
    orb_red: 1.05,
    scatter: 1.1
  };

    // Hide Autospin and Bet Settings UI 
    this.toggleBetUIVisibility(false);
    this.spinButton.setVisible(false).disableInteractive();
    this.gameMessageText.setVisible(false);
    


  // Animate old symbols falling
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const oldSymbol = this.symbols?.[row]?.[col];
      if (oldSymbol) {
        this.tweens.add({
          targets: oldSymbol,
          y: oldSymbol.y + fallDistance,
          duration: oldFallDuration,
          delay: col * delayPerCol,
          ease: 'Quad.easeIn',
          onComplete: () => oldSymbol.destroy()
        });
      }
    }
  }

  const startNewDropDelay = oldFallDuration + delayPerCol * (cols - 1);
  const newSymbols = [];

  this.time.delayedCall(startNewDropDelay, () => {
    const allPositions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        allPositions.push({ row, col });
      }
    }
    Phaser.Utils.Array.Shuffle(allPositions);
    const scatterPositions = allPositions.slice(0, 4);

    for (let col = 0; col < cols; col++) {
      newSymbols[col] = [];

      this.time.delayedCall(col * delayPerCol, () => {
        for (let row = 0; row < rows; row++) {
          const isScatter = scatterPositions.some(p => p.row === row && p.col === col);
          const newKey = isScatter ? 'scatter' : pickWeightedSymbol(weightedPool);

          const startY = row * boxHeight - fallDistance;
          const targetY = row * boxHeight + boxHeight / 2;
          const x = col * boxWidth + boxWidth / 2;

          const sprite = this.add.image(x, startY, newKey);
          const scale = scaleMap[newKey] || 1.0;
          sprite.setScale(scale * Math.min((boxWidth - 4) / sprite.width, (boxHeight - 4) / sprite.height));
          gridContainer.add(sprite);

          // Drop tween + bounce
          this.tweens.add({
            targets: sprite,
            y: targetY + 10,
            duration: newDropDuration,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: sprite,
                y: targetY,
                duration: 100,
                ease: 'Sine.easeOut'
              });
            }
          });

          newSymbols[col][row] = sprite;
        }
      });
    }

    const totalDropTime = delayPerCol * cols + newDropDuration + 100;
    this.time.delayedCall(totalDropTime, () => {
      // Save to grid
      this.symbols = [];
      for (let row = 0; row < rows; row++) {
        this.symbols[row] = [];
        for (let col = 0; col < cols; col++) {
          this.symbols[row][col] = newSymbols[col][row];
        }
      }

      // Animate scatter pulsing manually (no timeline)
      for (let row = 0; row < rows; row++) {
        this.sounds.sfx_scatterMatch.play();
        for (let col = 0; col < cols; col++) {
          const symbol = newSymbols[col][row];
          if (symbol.texture.key === 'scatter') {
            const animSprite = this.add.sprite(symbol.x, symbol.y, 'scatterAnim')
              .setOrigin(0.5)
              .setScale(symbol.scale)
              .setDepth(symbol.depth + 1);

            gridContainer.add(animSprite);
            animSprite.play('scatterPulse');

           // 2 pulse cycles manually chained
           this.tweens.add({
           targets: animSprite,
           scale: animSprite.scale * 1.1,
           duration: 300,
           ease: 'Sine.easeInOut',
           yoyo: true,
           repeat: 1,
           onComplete: () => {
           // Hold at increased scale for 300ms before shrinking back
           this.time.delayedCall(500, () => {
           this.tweens.add({
           targets: animSprite,
           scale: animSprite.scale * 1.1,
           duration: 300,
           ease: 'Sine.easeInOut',
           yoyo: true,
           repeat: 1,
           onComplete: () => animSprite.destroy()
           });
         });
        }
      });

          }
        }
      }

      this.time.delayedCall(1200, () => {
        showCongratulationsPopup.call(this, 15, () => {
          onComplete?.();
        });
      });
    });
  });
}

function animateScatterSymbols(symbolsGrid, gridContainer, scene) {
  // If you prefer iterating the grid:
  for (let row = 0; row < symbolsGrid.length; row++) {
    for (let col = 0; col < symbolsGrid[row].length; col++) {
      const symbol = symbolsGrid[row][col];
      if (!symbol || !symbol.texture || symbol.texture.key !== 'scatter') continue;
      pulse(symbol);
    }
  }

  // Or, if you want to iterate container children:
  gridContainer.iterate(child => {
    if (!child || !child.texture || child.texture.key !== 'scatter') return;
    pulse(child);
  });

  function pulse(symbolSprite) {
    const animSprite = scene.add.sprite(symbolSprite.x, symbolSprite.y, 'scatterAnim')
      .setOrigin(0.5)
      .setScale(symbolSprite.scale)
      .setDepth(symbolSprite.depth + 1);
    gridContainer.add(animSprite);
    animSprite.play('scatterPulse');

    scene.tweens.add({
      targets: animSprite,
      scale: animSprite.scale * 1.1,
      duration: 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        scene.time.delayedCall(500, () => {
          scene.tweens.add({
            targets: animSprite,
            scale: animSprite.scale * 1.1,
            duration: 300,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 1,
            onComplete: () => animSprite.destroy()
          });
        });
      }
    });
  }
}



///////////////////////////////////////////////////////////////////////////////////// REAL FREE SPINS /////////////////////////////////////////////////////////////////////////

function startFreeSpins(scene, cols, rows, boxWidth, boxHeight, gridContainer, symbolKeys) {
  isInFreeSpins = true;
  remainingFreeSpins = 15;
  totalFreeSpinsWon = 15;
  freeSpinsTotalWin = 0;
  freeSpinsGlobalMultiplier = 0;
  scene.multiplierPillarContainer.setVisible(true);
  displayMultiplierPillarNumber.call(scene, 0); // reset visual
  scene.freeSpinsBorder.setVisible(true); // 🆕 show the border
  updateFreeSpinsDigits(scene, remainingFreeSpins); // 🆕 show "15"
  scene.historyContainer.x = scene.scale.width / 2; // Move to center
  scene.historyContainer.y = scene.scale.height / 2 + 300; // Adjust vertically relative to center
  scene.buyFreeSpinsContainer.setVisible(false);
  scene.buyFreeSpinsPriceContainer.setVisible(false)
  scene.anteBorder.setVisible(false);
  scene.anteToggleContainer.setVisible(false);
  scene.anteBetSpriteContainer.setVisible(false);
  scene.blueMapBg.setVisible(true);
  scene.blueMapBg2.setVisible(true);
  scene.blueFire1.setVisible(true);
  scene.blueFireLeftInner.setVisible(true);
  scene.blueFire2.setVisible(true);
  scene._wasAnteBetActive = scene.anteBetActive; // Save current state in Termp Flag
  scene.anteBetActive = false; // Set Bet Ante to inactive
  switchToFreeSpinsTheme(scene);
  // Hide Autospin and Bet Settings UI 
  scene.toggleBetUIVisibility(false);


  // Reset win display
  scene.winTextContainer.setVisible(false);
  scene.displayedWinValue = 0;
  scene.freeSpinsTotalWin = 0; // ✅ critical fix
  if (scene.winTween) {
  scene.winTween.stop();
  scene.winTween = null;
  }
  scene.plainTextWin.setText('');
  scene.winLabel.setText('WIN ');



  playNextFreeSpin(scene, cols, rows, boxWidth, boxHeight, gridContainer, symbolKeys);
}

async function playNextFreeSpin(scene, cols, rows, boxWidth, boxHeight, gridContainer, symbolKeys) {
  if (remainingFreeSpins <= 0) {
    endFreeSpins(scene, scene.updateBalanceText);
    return;
  }
  remainingFreeSpins--;
  updateFreeSpinsDigits(scene, remainingFreeSpins); // 🆕 update each spin
  

  // disable UI & clear visuals
  scene.spinButton.setVisible(false).disableInteractive();
  fadeOutWinTab.call(scene);
  scene.totalWinAmountForTab = 0;
  scene.winTabSprites?.forEach(s => s.destroy());
  scene.winTabSprites = [];
  scene.totalOrbMultiplier = 0;
  scene.pendingOrbAnimations = 0;
  scene._finalizedWinAlready = false;
  scene.historySlots.forEach(s => s.destroy());
  scene.historySlots = [];

  // 1) kick off server spin
  const spinRes = await fetch('/games/gates/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet: betAmount, currency: selectedCurrency, isFreeSpin: true })
  });
  const spinData = await spinRes.json();
  if (!spinRes.ok || spinData.error) {
    alert(spinData.error || 'Error during free spin');
    endFreeSpins(scene, scene.updateBalanceText);
    return;
  }

  // 2) prepare per‐spin arrays
  scene.pendingSymbolCounts = [];
  const orbData = [];

  // 3) wait for grid‐drop + cascade + match loop to finish
  await new Promise(resolve =>
    spinGrid.call(
      scene,
      cols, rows, symbolKeys,
      gridContainer, boxWidth, boxHeight, scene.quickSpinEnabled,
      () => resolve(),
      orbData
    )
  );

  // ✅ orb animation + resolve logic handled entirely inside Step 6
  // Do not call animateOrbsToWinTab again here
  // Step 6 will trigger resolve → then recursively call playNextFreeSpin again
}




function endFreeSpins(scene, updateBalanceText) {
  isInFreeSpins = false;
  console.log('🔁 Finalizing free spins...');
  console.log('Final freeSpinsTotalWin:', freeSpinsTotalWin, 'Currency:', selectedCurrency);

  fetch('/games/gates/complete-free-spins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      totalWin: freeSpinsTotalWin,
      currency: selectedCurrency
    })
  })
    .then(async res => {
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Server responded with error ${res.status}:`, errorText);
        throw new Error(`Server error ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      try {
        console.log('✅ Free spins finalized successfully:', data);

        userBalanceUSD = data.newBalanceUSD;
        userBalanceLBP = data.newBalanceLBP;
        console.log('💰 Updated balances:', userBalanceUSD, userBalanceLBP);

        // Safe call only if updateBalanceText was passed and is a function
        if (typeof updateBalanceText === 'function') {
          updateBalanceText();
          console.log('✅ Balance text updated');
        } else {
          console.warn('⚠️ updateBalanceText not provided or not a function, skipping balance text update.');
        }
        
        const symbol = getCurrencySymbol(selectedCurrency);
        showCongratulationsPopup.call(scene, freeSpinsTotalWin, symbol, () => {
          console.log('⚡ Thunder animation complete. Displaying final win.');
          playScreenThunder.call(scene)
          scene.blueMapBg.setVisible(false);
          scene.blueMapBg2.setVisible(false);
          scene.blueFire1.setVisible(false);
          scene.blueFireLeftInner.setVisible(false);
          scene.blueFire2.setVisible(false);
          displayFreeSpinsFinalWin(scene, freeSpinsTotalWin);

            // Reset win display
            scene.winTextContainer.setVisible(false);
            scene.displayedWinValue = 0;
            scene.freeSpinsTotalWin = 0; // ✅ critical fix
            if (scene.winTween) {
            scene.winTween.stop();
            scene.winTween = null;
            }
            scene.plainTextWin.setText('');
            scene.winLabel.setText('WIN ');
            setGameMessage(scene, 'PLACE YOUR BETS');


          scene.spinButton.setVisible(true).setInteractive();
          scene.multiplierPillarContainer.setVisible(false);
          scene.historyContainer.x = scene.historyOriginalX; // Return to original position
          scene.historyContainer.y = scene.historyOriginalY; // Return to original position
          scene.freeSpinsBorder.setVisible(false); // 🔻 Hide spins counter UI
          scene.buyFreeSpinsContainer.setVisible(true);
          scene.buyFreeSpinsText.setVisible(true).setScale(1); 
          scene.buyFreeSpinsBonusText.setVisible(false);
          scene.buyFreeSpinsPriceContainer.setVisible(true).setScale(1);
          scene.buyFreeSpinsButton.setInteractive();
          scene.anteBorder.setVisible(true);
          scene.anteToggleContainer.setVisible(true);
          scene.anteBetSpriteContainer.setVisible(true);
          switchToMainTheme(scene);
          scene.toggleBetUIVisibility(true);
          // Re-enable Ante Bet UI
          scene.anteBorder.setInteractive();
          scene.tweens.add({ targets: scene.anteToggleContainer, alpha: 1, duration: 150 });
          scene.tweens.add({ targets: scene.anteBetSpriteContainer, alpha: 1, duration: 150 });
          scene.tweens.add({ targets: scene.anteBorder, alpha: 1, duration: 150 });
          if (scene._wasAnteBetActive) {
            scene.anteBetActive = true;
          }
          // ✅ Clean up temp flag
          delete scene._wasAnteBetActive;
          

        });
      } catch (innerErr) {
        console.error('🚨 Error during post-success handling:', innerErr);
        alert('Something went wrong after free spins were finalized.');
        scene.spinButton.setVisible(true).setInteractive();
      }
    })
    .catch(err => {
      console.error('❗ Failed to finalize free spins:', err);
      alert('Failed to finalize free spins');
      scene.spinButton.setVisible(true).setInteractive();
    });
}




function displayFreeSpinsFinalWin(scene, amount) {
  const text = selectedCurrency === 'USD'
    ? `$${amount.toFixed(2)}`
    : `LBP ${amount.toFixed(0)}`;

  winText.setText(`Free Spins Won: ${text}`);
  winText.setVisible(true);
  scene.time.delayedCall(2500, () => winText.setVisible(false));
}


////////////////////////////////////////////////////////////////////////////////// HELPER FUNCTIONS FOR FAKE SPIN /////////////////////////////////////////////////////////////////

function showCongratulationsPopup(freeSpinsWon = 15, currencySymbolOrCallback = '', maybeCallback) {
  const centerX = this.cameras.main.centerX;
  const centerY = this.cameras.main.centerY;
  const screenWidth = this.cameras.main.width;
  const screenHeight = this.cameras.main.height;

  let currencySymbol = '';
  let onComplete;

  if (typeof currencySymbolOrCallback === 'function') {
    onComplete = currencySymbolOrCallback;
  } else {
    currencySymbol = currencySymbolOrCallback;
    onComplete = maybeCallback;
  }

  const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.6)
    .setOrigin(0)
    .setDepth(999)
    .setInteractive();

  const popup = this.add.container(centerX, centerY - 200).setDepth(1000);
  popup.setScale(1.15);

  const glow = this.add.image(0, 0, 'congratsGlow').setScale(0).setAlpha(0.7);
  const border = this.add.image(0, 0, 'congratsBorder').setScale(0);
  const congratsText = this.add.image(0, 0, 'CongratsText').setScale(0);

  // Format value: no decimals if integer, 2 decimals if not
  const isWholeNumber = Number.isInteger(freeSpinsWon);
  const displayValue = isWholeNumber ? freeSpinsWon.toString() : freeSpinsWon.toFixed(2);

  // Use custom number font
  const numberGroup = createBigWinNumber(displayValue, this, currencySymbol, 0.4);
  numberGroup.y = 38;
  numberGroup.setScale(0); // animate this instead of text

  popup.add([glow, border, congratsText, numberGroup]);

  this.sounds.sfx_congratsPopup.play();

  this.tweens.add({ targets: glow, scale: 1, ease: 'Back.Out', duration: 400, delay: 0 });
  this.tweens.add({ targets: border, scale: 1, ease: 'Back.Out', duration: 400, delay: 100 });
  this.tweens.add({ targets: congratsText, scale: 1, ease: 'Back.Out', duration: 400, delay: 200 });
  this.tweens.add({ targets: numberGroup, scale: 1, ease: 'Back.Out', duration: 400, delay: 300 });

  this.time.delayedCall(700, () => {
    this.tweens.add({
      targets: glow,
      scale: { from: 1.0, to: 1.08 },
      yoyo: true,
      repeat: -1,
      duration: 800,
      delay: 0,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: border,
      scale: { from: 1.0, to: 1.015 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
      delay: 150,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: congratsText,
      scale: { from: 1.0, to: 1.08 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
      delay: 300,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: numberGroup,
      scale: { from: 1.0, to: 1.025 },
      yoyo: true,
      repeat: -1,
      duration: 950,
      delay: 450,
      ease: 'Sine.easeInOut'
    });
  });

  overlay.once('pointerdown', () => {
    overlay.destroy();
    popup.destroy();
    if (typeof onComplete === 'function') onComplete();
  });
}

// Entire Screen Thunder Animation
function playScreenThunder(callback) {
  const centerX = this.cameras.main.centerX;
  const centerY = this.cameras.main.centerY;
  const screenWidth = this.cameras.main.width;
  const screenHeight = this.cameras.main.height;

  const frameWidth = 500;  // Width of one frame in the spritesheet
  const frameHeight = 900; // Height of one frame

  // Calculate scale factors based on screen size
  const scaleX = screenWidth / frameWidth;
  const scaleY = screenHeight / frameHeight;
  const scale = Math.max(scaleX, scaleY); // Ensures it fully covers the screen

  const thunder = this.add.sprite(centerX, centerY, 'screenThunder')
    .setOrigin(0.5)
    .setDepth(1001)
    .setScale(scale);

  // 🔊 Play thunder sound when animation starts
  this.sounds.sfx_screenThunder.play();

  thunder.play('screenThunderAnim');

  thunder.once('animationcomplete', () => {
    thunder.destroy();
    if (typeof callback === 'function') callback();
  });
}

//Currency Selector for Congrats Pop Up when using Total Win Amount
function getCurrencySymbol(currency) {
  if (currency === 'USD') return '$';
  if (currency === 'LBP') return '£';  // Or whatever symbol you want for LBP
  return ''; // fallback no symbol
}

// Big Win Congratulations Pop Up
function showBigWinPopup(winAmount, currencySymbol = '') {
  return new Promise(resolve => {
    const scene = this;

    console.log('[BigWinPopup] Called with:', { winAmount, currencySymbol });
    
    // Define threshold sets for USD and LBP
    const thresholds = {
      USD: {
        hideBelow: 20,
        nice: 20,
        mega: 30,
        superb: 50,
        sensational: 80
      },
      LBP: {
        hideBelow: 1_000_000,
        nice: 1_500_000,
        mega: 3_000_000,
        superb: 5_000_000,
        sensational: 8_000_000
      }
    };

    // Determine currency type (default USD if unknown)
    let currency, displaySymbol;
    if (currencySymbol === 'LBP') {
      currency = 'LBP';
      displaySymbol = '£';
    } else {
      currency = 'USD';
      displaySymbol = '$';
    }
    
    const th = thresholds[currency];

    if (winAmount <= th.hideBelow) {
      resolve(); // no popup shown if below hide threshold
      return;
    }

    if (scene._bigWinPopupActive) {
      resolve(); // prevent blocking if already active
      return;
    }

    scene._bigWinPopupActive = true;

    let level = 'nice';
    if (winAmount > th.sensational) level = 'sensational';
    else if (winAmount > th.superb) level = 'superb';
    else if (winAmount > th.mega) level = 'mega';

    const centerX = scene.cameras.main.centerX;
    const centerY = scene.cameras.main.centerY;

    const overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x000000, 0.6)
      .setDepth(998);

    // Initialize coin pool once
    if (!scene.bigWinCoinPool) {
      const maxCoins = 100;
      scene.bigWinCoinPool = scene.add.group({
        defaultKey: 'bigwinCoin',
        maxSize: maxCoins
      });
      for (let i = 0; i < maxCoins; i++) {
        const coin = scene.add.sprite(-100, -100, 'bigwinCoin')
          .setVisible(false)
          .setActive(false)
          .setDepth(998.5)
          .setScale(0.25)
          .play('bigwinCoinSpin');
        scene.bigWinCoinPool.add(coin);
      }
    }

    function spawnCoin() {
      const coin = scene.bigWinCoinPool.getFirstDead(false);
      if (!coin) return;

      const startX = Phaser.Math.Between(0, scene.scale.width);
      const startY = -50;
      const endY = scene.scale.height + 50;

      coin.setPosition(startX, startY)
        .setScale(Phaser.Math.FloatBetween(0.15, 0.30))
        .setAlpha(Phaser.Math.FloatBetween(0.9, 1))
        .setActive(true)
        .setVisible(true);

      scene.tweens.add({
        targets: coin,
        y: endY,
        angle: Phaser.Math.Between(-180, 180),
        alpha: { from: coin.alpha, to: 0.4 },
        duration: Phaser.Math.Between(1000, 1800),
        ease: 'Quad.easeIn',
        onComplete: () => {
          coin.setActive(false).setVisible(false).setPosition(-100, -100);
        }
      });
    }

    if (!scene.bigWinCoinRainTimer) {
      scene.bigWinCoinRainTimer = scene.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          for (let i = 0; i < 2; i++) spawnCoin();
        }
      });
    } else {
      if (scene.bigWinCoinRainTimer.paused) scene.bigWinCoinRainTimer.paused = false;
    }

    const container = scene.add.container(centerX, centerY - 150).setDepth(999).setScale(0.2);

    const glow = scene.add.image(0, 0, 'bigwinGlow').setAlpha(1).setScale(0.6);
    const wingLeft = scene.add.image(-20, -50, 'bigwinWingLeft').setOrigin(1, 0.5).setScale(0.65);
    const wingRight = scene.add.image(20, -50, 'bigwinWingRight').setOrigin(0, 0.5).setScale(0.65);
    const base = scene.add.image(0, 50, 'bigwinBase').setScale(0.65);
    const tab = scene.add.image(0, 165, 'bigwinTab').setScale(0.65);

    // Custom Font Numbers
    const amountSpriteText = createBigWinNumber(winAmount, scene, displaySymbol, 0.65);
    amountSpriteText.setPosition(0, 165); // no need to scale the container



    const levelMap = {
      nice: 'bigwinNice',
      mega: 'bigwinMega',
      superb: 'bigwinSuperb',
      sensational: 'bigwinSensational'
    };
    const levelLabel = scene.add.image(0, -180, levelMap[level]).setScale(0.6);

    container.add([glow, wingLeft, wingRight, base, tab, amountSpriteText, levelLabel]);

    // Entrance animation
    scene.tweens.add({
      targets: container,
      scale: 1,
      ease: 'Back.Out',
      duration: 500
    });

    // Looping animations
    scene.tweens.add({ targets: wingLeft, angle: { from: -5, to: 10 }, x: { from: -20, to: -25 }, scaleY: { from: 0.7, to: 0.65 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: wingRight, angle: { from: 5, to: -10 }, x: { from: 20, to: 25 }, scaleY: { from: 0.7, to: 0.65 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: glow, alpha: { from: 0.8, to: 1 }, scale: { from: 0.6, to: 0.7 }, yoyo: true, repeat: -1, duration: 900 });
    scene.tweens.add({ targets: tab, scale: { from: 0.65, to: 0.72 }, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: amountSpriteText, scale: { from: 1, to: 1.1 }, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.InOut' });

    [wingLeft, wingRight, base, levelLabel].forEach(target => {
      scene.tweens.add({
        targets: target,
        y: target.y + 20,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    });

    // Close after 4 seconds
    scene.time.delayedCall(4000, () => {
      if (scene.bigWinCoinRainTimer) {
        scene.bigWinCoinRainTimer.paused = true;
      }

      scene.tweens.add({
        targets: container,
        alpha: 0,
        scale: 0.85,
        duration: 400,
        onComplete: () => {
          container.destroy();
          overlay.destroy();
          scene._bigWinPopupActive = false;
          resolve(); // ✅ FINALLY RESOLVE THE PROMISE
        }
      });
    });
  });
}

// Big Win Font From Spritesheet
function createBigWinNumber(amount, scene, symbolChar = '$', scale = 1) {
  const group = scene.add.container(0, 0);
  const charOrder = "0123456789$£,.";

  // Format the amount:
  // No decimals for LBP, always include commas
  let formattedAmount;
  if (symbolChar === '£') {
    formattedAmount = `${symbolChar}${Math.floor(amount).toLocaleString('en-US')}`;
  } else {
    formattedAmount = `${symbolChar}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  let offsetX = 0;
  const characters = [];

  for (let i = 0; i < formattedAmount.length; i++) {
    const char = formattedAmount[i];
    const index = charOrder.indexOf(char);
    if (index === -1) continue;

    const sprite = scene.add.sprite(offsetX, 0, 'bigWinFont', index)
      .setOrigin(0, 0.5)
      .setScale(scale);

    group.add(sprite);
    characters.push(sprite);

    if (char === ',' || char === '.') {
      // Shift comma/dot left to reduce big gap on the left side
      sprite.x -= 25 * scale; 
      offsetX += 30 * scale; // smaller spacing to the right
    } else {
      offsetX += 70 * scale; // regular spacing
    }
  }

  const totalWidth = offsetX;
  characters.forEach(sprite => {
    sprite.x -= totalWidth / 2; // Center align the whole number
  });

  group.setSize(totalWidth, 104 * scale);
  return group;
}

/////////////////////////////////////////////////////////////////////////////////// HELPER FUNCTIONS START HERE //////////////////////////////////////////////////////////////////////////////
async function updateBalanceFromServer() {
  try {
    const res = await fetch('/auth/session');
    if (!res.ok) {
      console.error('Not logged in');
      return;
    }
    const data = await res.json();

    // Display the correct currency with commas
    if (selectedCurrency === 'USD') {
      balanceText.setText(`$${data.balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } else {
      balanceText.setText(`£${data.balanceLBP.toLocaleString()}`);
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
  }
}


function updateBetText() {
  if (selectedCurrency === 'USD') {
    betText.setText(`$${betAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  } else {
    betText.setText(`£${betAmount.toLocaleString()}`);
  }
}


// Send results to server
function resolveWin(bet, currency, symbolCounts, orbData) {
  fetch('/games/gates/resolve-win', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bet,
      currency,
      symbolCounts,
      orbData,
      isFreeSpin: isInFreeSpins  // <-- use your free spin global state here
    }),
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) {
      return alert(data.error);
    }

    // Skip UI balance update for free spins
if (!isInFreeSpins) {
  setTimeout(() => {
    if (currency === 'USD') {
      balanceText.setText(`$${data.newBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } else {
      balanceText.setText(`£${data.newBalanceLBP.toLocaleString()}`);
    }

    displayWinMessage.call(this, data.totalWin);
  }, 50);
}

  })
  .catch(err => console.error('Resolve-win error:', err));
}

// Show a temporary win message
function displayWinMessage(amount) {
  const text = selectedCurrency === 'USD'
    ? `$${amount.toFixed(2)}`
    : `LBP ${amount.toFixed(0)}`;

  winText.setText(`You won ${text}!`);
  winText.setVisible(true);
  this.time.delayedCall(2000, () => winText.setVisible(false));
}

// Function to calculate individual win for a match of 8+ symbols
function calculateIndividualWin(symbol, count) {
  const payouts = payoutTable[symbol];
  if (!payouts) {
    console.error(`No payout information found for symbol: ${symbol}`);
    return 0;
  }

  if (symbol === 'scatter') {
    const cappedCount = Math.min(count, 6); // max key defined is 6
    return payouts[cappedCount] || 0;
  }

  if (count >= 8 && count <= 9) {
    return payouts['8-9'] || 0;
  } else if (count >= 10 && count <= 11) {
    return payouts['10-11'] || 0;
  } else if (count >= 12) {
    return payouts['12-30'] || 0;
  }

  return 0;
}


// Function to display individual win message for each match
function displayIndividualWinMessage(amount) {
  const text = selectedCurrency === 'USD'
    ? `$${amount.toFixed(2)}`
    : `LBP ${amount.toFixed(0)}`;

  const cx = this.cameras.main.centerX;
  const cy = this.cameras.main.centerY;

  const winText = this.add.text(cx, cy - 50, `${text}`, {
    fontSize: '52px',
    color: '#FFFFFF',
    fontStyle: 'bold',
    stroke: '#182db7',
    strokeThickness: 4
  });
  winText.setOrigin(0.5);

  this.tweens.add({
    targets: winText,
    y: cy - 120,
    alpha: 0,
    duration: 1200,
    ease: 'Power2',
    onComplete: () => winText.destroy()
  });
}



function updateWinTabSpriteDisplay(displayFinalWinOnly = false) {
  // (1) Ensure we have a running total
  if (typeof this.totalWinAmountForTab !== 'number') {
    this.totalWinAmountForTab = 0;
  }

  // (2) Destroy old sprites
  [
    ...(this.winTabSprites || []),
    ...(this.winTabBaseDigits || []),
    ...(this.winTabMultiplierDigits || []),
    ...(this.finalWinTabSprites || [])
  ].forEach(s => s.destroy());

  this.winTabSprites = [];
  this.winTabBaseDigits = [];
  this.winTabMultiplierDigits = [];
  this.finalWinTabSprites = [];

  // (3) Prep numbers
  const base = this.totalWinAmountForTab;

  // ✅ Use scene-local orb multiplier instead of global
  let orbSum = Number(this.totalOrbMultiplier);
  if (isNaN(orbSum) || orbSum < 0) orbSum = 0;

  // Final amount either base (in final mode) or base * orbSum
  const final = displayFinalWinOnly
    ? base
    : base * orbSum;

  // Format
  let baseStr = selectedCurrency === 'USD'
    ? base.toFixed(2)
    : Math.floor(base).toString();
  baseStr = baseStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  let finalStr = selectedCurrency === 'USD'
    ? final.toFixed(2)
    : Math.floor(final).toString();
  finalStr = finalStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Only show a multiplier if orbSum > 0
  const multiplierStr = orbSum > 0 ? `x${orbSum}` : '';

  // (4) Layout
  const scale = 0.2, spacing = 22;

  if (displayFinalWinOnly) {
    const formatted = `$${finalStr}`;
    let startX = -(formatted.length - 1) * spacing / 2;
    for (let ch of formatted) {
      let frame = (ch === ',') ? 10 : (ch === '.') ? 11 : parseInt(ch, 10);
      if (isNaN(frame)) continue;
      const digit = this.add.image(startX, 0, 'numberFont', frame)
        .setOrigin(0.5).setScale(scale);
      this.winTabContainer.add(digit);
      this.finalWinTabSprites.push(digit);
      startX += spacing;
    }
  } else {
    const baseFormatted = `$${baseStr}`.split('');
    const totalLen = baseFormatted.length + multiplierStr.length;
    let startX = -(totalLen - 1) * spacing / 2;

    // Draw base
    for (let ch of baseFormatted) {
      let frame = (ch === ',') ? 10 : (ch === '.') ? 11 : parseInt(ch, 10);
      if (isNaN(frame)) continue;
      const digit = this.add.image(startX, 0, 'numberFont', frame)
        .setOrigin(0.5).setScale(scale);
      this.winTabContainer.add(digit);
      this.winTabBaseDigits.push(digit);
      this.winTabSprites.push(digit);
      startX += spacing;
    }

    // Draw multiplier if any
    if (orbSum > 0) {
      for (let ch of multiplierStr) {
        let frame = (ch === 'x') ? 12 : parseInt(ch, 10);
        if (isNaN(frame)) continue;
        const digit = this.add.image(startX, 0, 'numberFont', frame)
          .setOrigin(0.5).setScale(scale);
        digit.name = 'multiplierDigit';
        this.winTabContainer.add(digit);
        this.winTabMultiplierDigits.push(digit);
        this.winTabSprites.push(digit);
        startX += spacing;
      }
    }
  }

  // (5) Show
  this.winTabContainer.setVisible(true);
}

// Fade in the win tab smoothly
function fadeInWinTab() {
  this.winTabContainer.alpha = 0;
  this.tweens.add({
    targets: this.winTabContainer,
    alpha: 1,
    duration: 300
  });
}

// Fade out the win tab smoothly
function fadeOutWinTab() {
  this.tweens.add({
    targets: this.winTabContainer,
    alpha: 0,  // Fade out to invisible
    duration: 300,
    ease: 'Linear',
    onComplete: () => {
      // No need to set it invisible as opacity handles visibility
    }
  });
}


// Helper for History Tab
function addHistorySlot(scene, symbolKey, matchCount, winAmount) {
  const maxSlots = 5;

  // Format the win amount
  const formattedAmount = selectedCurrency === 'USD'
    ? `$${winAmount.toFixed(2)}`
    : `£${Math.floor(winAmount)}`;

  // Create slot container
  const slot = scene.add.container(0, 0);

  // Add slot background image
  const slotBg = scene.add.image(0, 0, 'history_slot');
  slotBg.setOrigin(0.5);
  slot.add(slotBg);

  // Add symbol image (assuming you have a frame or key matching symbolKey)
  const symbolImage = scene.add.image(-50, 0, symbolKey); // Adjust X as needed
  symbolImage.setScale(0.12); // Adjust scale as needed
  slot.add(symbolImage);

  // Add match count text
  const matchText = scene.add.text(- 85, 0, `${matchCount}`, {
    font: '22px Arial',
    color: '#edca78',
    stroke: '#000',
    strokeThickness: 2
  }).setOrigin(0.5);
  slot.add(matchText);

  // Add win amount text
  const winText = scene.add.text(30, 0, formattedAmount, {
    font: '22px Arial',
    color: '#edca78',
    stroke: '#000',
    strokeThickness: 2
  }).setOrigin(0.5);
  slot.add(winText);

  // Insert the new slot at the top
  scene.historySlots.unshift(slot);

  // If there are more than maxSlots, remove the oldest slot
  if (scene.historySlots.length > maxSlots) {
    const removed = scene.historySlots.pop();
    removed.destroy();
  }

  // Reposition all slots from bottom to top
  const slotSpacing = 47; // Adjust spacing between slots
  const containerHeight = scene.historyContainer.height; // Height of the container
  const baseY = containerHeight / 2 + (slotSpacing * (maxSlots - 1)) / 2; // Start Y position for the first slot (bottom-most)

  scene.historySlots.forEach((s, i) => {
    const yOffset = baseY - (i * slotSpacing); // Position slots above the last one
    s.setY(yOffset); // Adjust Y position for each slot
  });

  // Add the new slot to the container
  scene.historyContainer.add(slot);
}

// Function to display the multiplier with sprite-based numbers
function createMultiplierSprites(multiplierValue) {
  const digits = `${multiplierValue}x`;
  const spriteWidth = 160;

  const baseScale = digits.length >= 4 ? 0.17 : 0.2;

  const defaultSpacing = spriteWidth * baseScale;
  const reducedSpacing = defaultSpacing * 0.6;

  const totalWidth = digits.length * reducedSpacing;
  const startX = -totalWidth / 2 + reducedSpacing / 2;

  const sprites = [];

  for (let i = 0; i < digits.length; i++) {
    const char = digits[i];
    const frame = charMap[char];
    if (frame === undefined) continue;

    const digitSprite = this.add.image(startX + i * reducedSpacing, 0, 'numberFont', frame)
      .setScale(baseScale)
      .setOrigin(0.5);

    // ✅ Tag each digit so it can be removed later
    digitSprite.name = 'multiplierDigit';

    sprites.push(digitSprite);
  }

  // Optional soft shift to center if too wide
  const maxWidth = spriteWidth * baseScale * 3;
  if (totalWidth > maxWidth) {
    const offset = (totalWidth - maxWidth) / 2;
    sprites.forEach(sprite => {
      sprite.x -= offset;
    });
  }

  return sprites;
}



//zzz


// ——————————————————————————————————————————
// 1) ORB → WinTab animation (fully async)
// ——————————————————————————————————————————
function animateOrbsToWinTab(orbData, globalMultiplier = 0) {
  console.log('About to animateOrbsToWinTab', orbData, 'Global Multiplier:', globalMultiplier);

  return new Promise(resolve => {
    const hasOrbs = Array.isArray(orbData) && orbData.length > 0;
    const shouldAnimateGlobal = hasOrbs && globalMultiplier > 0;
    const totalOrbs = (hasOrbs ? orbData.length : 0) + (shouldAnimateGlobal ? 1 : 0);

    // If nothing to animate, resolve immediately
    if (totalOrbs === 0) {
      this._finalizeResolve = resolve;
      checkFinalize.call(this);
      return;
    }

    this.pendingOrbAnimations += totalOrbs;
    this._finalizeResolve = resolve;

    const { tx: targetX, ty: targetY } = this.winTabContainer.getWorldTransformMatrix();
    const delayPerOrb = 300;
    let animationIndex = 0;

    // 1. Animate Global Multiplier first (if applicable)
    if (shouldAnimateGlobal) {
      this.time.delayedCall(animationIndex * delayPerOrb, () => {
        const sprites = createMultiplierSprites.call(this, globalMultiplier);

        // Default fallback center
        let fromX = this.cameras.main.centerX;
        let fromY = this.cameras.main.centerY;

        // Try to get center of multiplier pillar digits
        if (this.multiplierNumberSprites?.length > 0 && this.multiplierPillarContainer) {
          const totalX = this.multiplierNumberSprites.reduce((sum, s) => sum + s.x, 0);
          const avgLocalX = totalX / this.multiplierNumberSprites.length;
          const avgLocalY = this.multiplierNumberSprites.reduce((sum, s) => sum + s.y, 0) / this.multiplierNumberSprites.length;

          // Convert local (x, y) inside the pillar container to world coords
          const matrix = this.multiplierPillarContainer.getWorldTransformMatrix();
          fromX = matrix.tx + avgLocalX;
          fromY = matrix.ty + avgLocalY;
        }

        const flyer = this.add.container(fromX, fromY, sprites);
        flyer.setScale(2);
        flyer.setDepth(7);
        this.children.bringToTop(flyer);

        // 🔊 Play global multiplier flying sound
        this.sounds.sfx_multiplierFlying.play();

        this.tweens.add({
          targets: flyer,
          x: targetX,
          y: targetY,
          scaleX: 0.3,
          scaleY: 0.3,
          alpha: 0,
          ease: 'Cubic.easeIn',
          duration: 900,
          onComplete: () => {
            flyer.destroy();

            this.totalOrbMultiplier += globalMultiplier;
            updateWinTabSpriteDisplay.call(this, false);

            // pulse effect
            (this.winTabMultiplierDigits || []).forEach(d => {
              this.tweens.add({
                targets: d,
                scale: { from: 0.2, to: 0.3 },
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeInOut'
              });
            });

            onOrbComplete.call(this);
          }
        });
      });

      animationIndex++;
    }

    // 2. Animate regular orb multipliers
    (orbData || []).forEach(({ value, row, col }, i) => {
      this.time.delayedCall((animationIndex + i) * delayPerOrb, () => {
        const orbC = this.symbols?.[row]?.[col];
        if (!orbC) {
          onOrbComplete.call(this);
          return;
        }

        // remove old digits
        orbC.list
          .filter(c => c.name === 'multiplierDigit')
          .forEach(c => c.destroy());

        // build flyer
        const sprites = createMultiplierSprites.call(this, value);
        const flyer = this.add.container(0, 0, sprites);
        const { tx, ty } = orbC.getWorldTransformMatrix();
        flyer.setPosition(tx, ty + 10);
        this.children.bringToTop(flyer);

        // tween into tab
        this.tweens.add({
          targets: flyer,
          x: targetX,
          y: targetY,
          scaleX: 0.3,
          scaleY: 0.3,
          alpha: 0,
          ease: 'Cubic.easeIn',
          duration: 900,
          onStart: () => {
            this.sounds.sfx_orbFlying.play(); // 🔊 Sync starts with animation
          },
          onComplete: () => {
            flyer.destroy();

            // accumulate total
            this.totalOrbMultiplier += Number(value);
            updateWinTabSpriteDisplay.call(this, false);

            // pulse digits
            (this.winTabMultiplierDigits || []).forEach(d => {
              this.tweens.add({
                targets: d,
                scale: { from: 0.2, to: 0.3 },
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeInOut'
              });
            });

            onOrbComplete.call(this);
          }
        });
      });
    });
  });
}

function onOrbComplete() {
  this.pendingOrbAnimations--;
  checkFinalize.call(this);
}

async function checkFinalize() {
  if (this.pendingOrbAnimations <= 0 && !this._finalizedWinAlready) {
    this._finalizedWinAlready = true;
    await finalizeMultipliedWin.call(this);
    if (this._finalizeResolve) {
      this._finalizeResolve();
      this._finalizeResolve = null;
    }
  }
}

function finalizeMultipliedWin() {
  return new Promise(resolve => {
    const baseWin = this.totalWinAmountForTab;

    // ── EARLY EXIT: no orb multiplier or no win ──
    if (this.totalOrbMultiplier <= 0 || baseWin <= 0) {
      // 1) Show the final (base-only) win tab
      updateWinTabSpriteDisplay.call(this, true);
      // 2) Update plaintext for this “final” result
      updatePlaintextWithBaseWin.call(this, baseWin, true);
      resolve();
      return;
    }

    const digits = this.winTabSprites || [];
    const xIdx = digits.findIndex(d => d.frame.name === 12);

    // ── EARLY EXIT: no “x” multiplier digit found ──
    if (xIdx < 0) {
      updateWinTabSpriteDisplay.call(this, true);
      updatePlaintextWithBaseWin.call(this, baseWin, true);
      resolve();
      return;
    }

    // ── OTHERWISE proceed with full orb-animation logic ──
    const baseDs = digits.slice(0, xIdx);
    const multiDs = digits.slice(xIdx);
    const delay = 600, centerX = 0, dur = 400;

    this.time.delayedCall(delay, () => {
      let completed = 0;
      const totalFades = baseDs.length + multiDs.length;

      const checkAll = () => {
        if (++completed === totalFades) {
          this.time.delayedCall(100, async () => {
            const finalWin = baseWin * this.totalOrbMultiplier;
            this.totalWinAmountForTab = finalWin;                

            // ── FINAL UPDATE FOR ORB CASE ──
            updatePlaintextWithBaseWin.call(this, finalWin, true);

            this.totalOrbMultiplier = 0;
            this.winTabSprites = [];

            await waitForWinTabDisplay.call(this, finalWin);

            // 🔥 Show the big win popup only during free spins
            if (isInFreeSpins && finalWin > 20) {
              console.log('[BigWinPopup] Showing big win for:', finalWin);
              await this.showBigWinPopup(finalWin, selectedCurrency);
            } 

            resolve();
          });
        }
      };

      const fadeGroup = (arr, off) => arr.forEach(s => {
        this.tweens.add({
          targets: s,
          x: centerX + off, alpha: 0,
          duration: dur, ease: 'Quad.easeInOut',
          onComplete: () => { s.destroy(); checkAll(); }
        });
      });

      this.sounds.sfx_wintabMerge.play();

      fadeGroup(baseDs, -20);
      fadeGroup(multiDs, 20);
    });
  });
}


function waitForWinTabDisplay(finalAmount) {
  return new Promise(resolve => {
    updateWinTabSpriteDisplay.call(this, true);
    const estimatedTween = 400;
    this.time.delayedCall(estimatedTween, () => resolve());
  });
}

function displayMultiplierPillarNumber(multiplier) {
  const scene = this;

  if (!scene.add || typeof multiplier !== 'number') {
    console.error("❌ Invalid scene or multiplier:", multiplier);
    return;
  }

  // Hide the number if multiplier is 0 or less
  if (multiplier <= 0) {
    if (scene.multiplierNumberSprites) {
      scene.multiplierNumberSprites.forEach(sprite => sprite.destroy());
    }
    scene.multiplierNumberSprites = [];
    return;
  }

  // Remove previous number sprites if they exist
  if (scene.multiplierNumberSprites) {
    scene.multiplierNumberSprites.forEach(sprite => sprite.destroy());
  }
  scene.multiplierNumberSprites = [];

  const digits = `${multiplier}x`; // Always append 'x' to multiplier (e.g. 15x)
  const spriteWidth = 160;
  let baseScale;

  if (digits.length === 2) {
    baseScale = 0.36; // e.g. "7x"
  } else if (digits.length === 3) {
    baseScale = 0.29; // e.g. "15x"
  } else if (digits.length === 4) {
    baseScale = 0.26; // e.g. "100x"
  } else {
    baseScale = 0.23; // fallback for anything longer
  }

  const defaultSpacing = spriteWidth * baseScale;
  let spacingMultiplier;

  if (digits.length === 2) {
    spacingMultiplier = 0.6;
  } else if (digits.length === 3) {
    spacingMultiplier = 0.64;
  } else if (digits.length === 4) {
    spacingMultiplier = 0.7;
  } else {
    spacingMultiplier = 0.82;
  }

  const reducedSpacing = defaultSpacing * spacingMultiplier;
  const totalWidth = digits.length * reducedSpacing;
  const startX = 0 - totalWidth / 2 + reducedSpacing / 2;
  const yPos = -100;

  for (let i = 0; i < digits.length; i++) {
    const char = digits[i];
    const frame = charMap[char];
    if (frame === undefined) continue;

    const digitSprite = scene.add.image(startX + i * reducedSpacing, yPos, 'numberFont', frame)
      .setScale(baseScale)
      .setOrigin(0.5);

    scene.multiplierPillarContainer.add(digitSprite);
    scene.multiplierNumberSprites.push(digitSprite);
  }

  // Optional centering tweak if very wide
  const maxWidth = spriteWidth * baseScale * 3;
  if (totalWidth > maxWidth) {
    const offset = (totalWidth - maxWidth) / 2;
    scene.multiplierNumberSprites.forEach(sprite => {
      sprite.x -= offset;
    });
  }

  // 🔥 Show purple flame only if multiplier > 15
  if (scene.purpleFlame) {
    scene.purpleFlame.setVisible(multiplier > 15);
  }
}



// Remaining Free Spins Font/Numbers
function updateFreeSpinsDigits(scene, number) {
  const charOrder = '0123456789,$£';
  const digitsStr = number.toString();

  // Clear previous digits
  scene.freeSpinsDigits.removeAll(true);

  const digitSpacing = 60; // spacing between digits
  const totalWidth = digitsStr.length * digitSpacing;
  const startX = -totalWidth / 2 + digitSpacing / 2;

  for (let i = 0; i < digitsStr.length; i++) {
    const char = digitsStr[i];
    const frameIndex = charOrder.indexOf(char);
    if (frameIndex === -1) continue;

    const digitSprite = scene.add.image(startX + i * digitSpacing, 0, 'spins_remaining_font', frameIndex);
    digitSprite.setOrigin(0.5);
    scene.freeSpinsDigits.add(digitSprite);
  }
}


//////////////////////////////////////// ZUES ANIMATION KICKER //////////////////////////
function playZeusReaction(scene) {
  if (scene.canTriggerZeus) {
    scene.canTriggerZeus = false;

    // Create Zeus thunder sprite if it doesn't exist
    if (!scene.zeusThunder) {
      scene.zeusThunder = scene.add.sprite(
        scene.zues.x - 30,
        scene.zues.y - scene.zues.displayHeight / 2 + 110,
        'thunder_strike'
      );
      scene.zeusThunder.setVisible(false).setDepth(scene.zues.depth + 1).setScale(1.4);
    }

        // ✅ Play Zeus lightning sound
        scene.sounds.sfx_zuesLightning.play();

    // Play thunder strike + temporarily move Zeus left
    scene.zeusThunder.setVisible(true);
    scene.zeusThunder.play('thunder_strike_anim');

    const originalZeusX = scene.zues.x;
    scene.zues.x -= 15; // move left for lightning effect
    scene.zues.play('zues_lightning_anim');

    scene.zeusThunder.once('animationcomplete', () => {
      scene.zeusThunder.setVisible(false);
    });

    scene.zues.once('animationcomplete', () => {
      scene.zues.x = originalZeusX; // restore original position
      scene.zeusThunder.setVisible(true);
      scene.zeusThunder.play('thunder_strike_anim');
      scene.zues.play('zues_idle_anim');

      scene.zeusThunder.once('animationcomplete', () => {
        scene.zeusThunder.setVisible(false);
      });
    });

    // Reset cooldown after 3 seconds
    scene.time.delayedCall(3000, () => {
      scene.canTriggerZeus = true;
    });
  }
}

/////////////////////////////////////////////////////////// PLAIN TEXT WIN AMOUNT ////////////////////////////////////////////////////////////////
function updatePlaintextWithBaseWin(baseWin, isFinalFreeSpinUpdate = false) {
  if (!this.plainTextWin || !this.winLabel || !this.winTextContainer) return;

  const symbol = selectedCurrency === 'USD' ? '$' : '£';

  // Determine start and end values for the tween
  let fromValue, toValue;
  

  if (isFinalFreeSpinUpdate) {
    if (typeof this.freeSpinsTotalWin !== 'number') this.freeSpinsTotalWin = 0;

    fromValue = this.freeSpinsTotalWin;
    this.freeSpinsTotalWin += baseWin;
    toValue = this.freeSpinsTotalWin;
  } else {
    fromValue = this.displayedWinValue;
    toValue = baseWin;
  }

  // Stop any previous win tween
  if (this.winTween) {
    this.winTween.stop();
  }

  this.winTween = this.tweens.addCounter({
    from: fromValue,
    to: toValue,
    duration: 400,
    ease: 'Quad.easeOut',
    onUpdate: (tween) => {
      const value = tween.getValue();
      this.displayedWinValue = value;

      const formatted = selectedCurrency === 'USD'
        ? value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        : Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      this.plainTextWin.setText(`${symbol}${formatted}`);
    },
    onComplete: () => {
      this.displayedWinValue = toValue;
      this.plainTextWin.setText(`${symbol}${formattedAmountFor(toValue)}`);
      this.winTween = null;
    }
  });

  this.winLabel
    .setText('WIN ')
    .setFontFamily('GatesFont')
    .setFontSize(48)
    .setFill('#f6ae41');

  if (toValue > 0) {
    this.winTextContainer.setVisible(true);
    this.gameMessageText.setVisible(false);
  } else {
    this.winTextContainer.setVisible(false);
    setGameMessage(this, 'PLACE YOUR BETS'); // fallback for zero win
  }

  this.winTextContainer.setScale(1, 1.2);

  function formattedAmountFor(amount) {
    if (selectedCurrency === 'USD') {
      return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
      return Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }
}

///////////////////////////////////////////////////// Switch Between Main and Free Theme Songs //////////////////////////////////////////////////
function switchToFreeSpinsTheme(scene) {
  if (scene.sounds.sfx_mainThemeSong.isPlaying) {
    scene.tweens.add({
      targets: scene.sounds.sfx_mainThemeSong,
      volume: 0,
      duration: 1000,
      onComplete: () => {
        scene.sounds.sfx_mainThemeSong.stop();
        scene.sounds.sfx_freeThemeSong.volume = 0;
        scene.sounds.sfx_freeThemeSong.play({ loop: true });
        scene.tweens.add({
          targets: scene.sounds.sfx_freeThemeSong,
          volume: 0.5,
          duration: 1000,
        });
      }
    });
  } else if (!scene.sounds.sfx_freeThemeSong.isPlaying) {
    scene.sounds.sfx_freeThemeSong.play({ loop: true, volume: 0.5 });
  }
}

function switchToMainTheme(scene) {
  if (scene.sounds.sfx_freeThemeSong.isPlaying) {
    scene.tweens.add({
      targets: scene.sounds.sfx_freeThemeSong,
      volume: 0,
      duration: 1000,
      onComplete: () => {
        scene.sounds.sfx_freeThemeSong.stop();
        scene.sounds.sfx_mainThemeSong.volume = 0;
        scene.sounds.sfx_mainThemeSong.play({ loop: true });
        scene.tweens.add({
          targets: scene.sounds.sfx_mainThemeSong,
          volume: 0.5,
          duration: 1000,
        });
      }
    });
  } else if (!scene.sounds.sfx_mainThemeSong.isPlaying) {
    scene.sounds.sfx_mainThemeSong.play({ loop: true, volume: 0.5 });
  }
}

//////////////////////////////////////////////////////// Info Button Helper ///////////////////////////////////////////////////////////////////
function openInfoPanel() {
  createInfoPanelBackground.call(this);

  // Create page containers
  createInfoPanelPageRules.call(this);
  createInfoPanelPageTumble.call(this);
  createInfoPanelPageBuyFreeSpins.call(this);  // <-- Add your new page here
  createInfoPanelPageGameRules.call(this);    // <-- New game rules page
  createInfoPanelPageHowToPlay.call(this); // How to play page


  // Store pages in an array for easy switching
  this.infoPages = [this.pageRules, this.pageTumble, this.pageBuyFreeSpins, this.pageGameRules, this.pageHowToPlay];
  this.currentPage = 0;

  // Show only first page at start
  this.infoPages.forEach((page, i) => page.setVisible(i === this.currentPage));

  createPageSwitchButtons.call(this);
}

function createInfoPanelBackground() {
  const cam = this.cameras.main;
  const panelWidth = cam.width;
  const panelHeight = cam.height * 0.9;
  const panelY = cam.height * 0.05;

  this.inputBlocker = this.add.rectangle(cam.centerX, cam.centerY, cam.width, cam.height, 0x000000, 0)
    .setInteractive()
    .setDepth(100);

  this.infoOverlay = this.add.rectangle(cam.centerX, panelY + panelHeight / 2, panelWidth, panelHeight, 0x000000, 0.9)
    .setDepth(101);

  this.closeButton = this.add.image(cam.width - 40, panelY + 50, 'closeIcon')
    .setInteractive({ useHandCursor: true })
    .setScale(1)
    .setDepth(102);

  this.closeButton.on('pointerdown', () => {
    this.inputBlocker.destroy();
    this.infoOverlay.destroy();
    this.closeButton.destroy();

    // Destroy all page containers
    this.infoPages.forEach(page => page.destroy());
    // Destroy buttons
    this.leftButton?.destroy();
    this.rightButton?.destroy();
    this.pageNumberText?.destroy();
  });
}

function createInfoPanelPageRules() {
  const cam = this.cameras.main;
  const panelY = cam.height * 0.05;
  const panelWidth = cam.width;

  // Container for page 0 content (rules + payouts)
  this.pageRules = this.add.container(cam.centerX - panelWidth / 2, panelY).setDepth(103);

  // Title
  const titleText = this.add.text(cam.centerX, 20, 'GAME RULES', {
    fontFamily: 'Arial',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5, 0);
  this.pageRules.add(titleText);

  // Description
  const descriptionText = this.add.text(cam.centerX, 75,
    'Symbols pay anywhere on the screen. The total number of the same symbols on the screen at the end of a spin determines the values of the win.', {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: panelWidth - 80 }
    }).setOrigin(0.5, 0);
  this.pageRules.add(descriptionText);

  // Payouts (reuse your existing code but add all to this.pageRules container)
  const startX = cam.centerX - panelWidth / 2 + 100;
  let posX = startX;
  let posY = 270;
  const symbolSize = 48;
  const columnSpacing = 180;
  const rowSpacing = 240;
  let colCount = 0;

  // Assume betAmount and selectedCurrency are accessible (or pass them as params)
  const currentBet = betAmount;
  const currentCurrency = selectedCurrency;

  const formatAmount = (amount) => {
    return currentCurrency === 'USD'
      ? `$${amount.toFixed(2)}`
      : `${Math.round(amount)} LBP`;
  };

  for (const [symbolKey, payouts] of Object.entries(payoutTable)) {
    if (symbolKey === 'scatter') {
      const symbolPosX = cam.centerX - 50;
      const symbolPosY = cam.centerY + 360;

      // Text on the left
      let textY = symbolPosY - symbolSize / 2;
      for (const [range, multiplier] of Object.entries(payouts).reverse()) {
        const payoutLine = this.add.text(symbolPosX - 100, textY, `${range} ${formatAmount(multiplier * currentBet)}`, {
          fontFamily: 'Arial',
          fontSize: '26px',
          color: '#ffffff',
          fontWeight: 'bold',
          align: 'right',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(1, 0);
        this.pageRules.add(payoutLine);
        textY += 26;
      }

      // Scatter symbol in center
      const scatterImage = this.add.image(symbolPosX, symbolPosY, symbolKey)
        .setScale(0.4);
      this.pageRules.add(scatterImage);

      // Description on right
      const descLines = [
        "This is the SCATTER symbol.",
        "SCATTER symbol is present on all reels.",
        "SCATTER pays on any position."
      ];
      let descY = symbolPosY - 80;
      for (const line of descLines) {
        const text = this.add.text(symbolPosX + 95, descY, line, {
          fontFamily: 'Arial',
          fontSize: '22px',
          color: '#ffffff',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'left',
          wordWrap: { width: 250 }
        }).setOrigin(0, 0);
        this.pageRules.add(text);
        descY += 55;
      }
    } else {
      const symbolImage = this.add.image(posX, posY, symbolKey)
        .setScale(0.4);
      this.pageRules.add(symbolImage);

      let textY = posY + symbolSize / 2 + 50;
      for (const [range, multiplier] of Object.entries(payouts).reverse()) {
        const payoutLine = this.add.text(posX, textY, `${range} ${formatAmount(multiplier * currentBet)}`, {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ffffff',
          fontWeight: 'bold',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5, 0);
        this.pageRules.add(payoutLine);
        textY += 26;
      }

      colCount++;
      posX += columnSpacing + 80;
      if (colCount >= 3) {
        colCount = 0;
        posX = startX;
        posY += rowSpacing;
      }
    }
  }
}

function createInfoPanelPageTumble() {
  const cam = this.cameras.main;
  const panelY = cam.height * 0.05;
  const panelWidth = cam.width;

  this.pageTumble = this.add.container(cam.centerX - panelWidth / 2, panelY).setDepth(103);

  // Title for page 2
  const titleText = this.add.text(cam.centerX, 40, 'TUMBLE FEATURE', {
    fontFamily: 'Arial',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5, 0);
  this.pageTumble.add(titleText);

  // Placeholder description for tumble info (replace with your actual text)
  const tumbleText = this.add.text(cam.centerX, 80,
    'The TUMBLE FEATURE means that after every spin winning combinations are paid and all winning symbols disappear. The remaining symbols fall to the bottom of the screen and the empty positions are replaced with symbols coming from above.', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: panelWidth - 80 }
    }).setOrigin(0.5, 0);
  this.pageTumble.add(tumbleText);

  // Placeholder description for tumble info (replace with your actual text)
  const tumble2Text = this.add.text(cam.centerX, 320,
    'Tumbling will continue until no more winning combinations appear as a result of a tumble.', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: panelWidth - 80 }
    }).setOrigin(0.5, 0);
  this.pageTumble.add(tumble2Text);

   // Placeholder description for tumble info (replace with your actual text)
   const tumble3Text = this.add.text(cam.centerX, 390,
    'There is no limit to the number of possible tumbles.', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: panelWidth - 80 }
    }).setOrigin(0.5, 0);
  this.pageTumble.add(tumble3Text);

   // Placeholder description for tumble info (replace with your actual text)
   const tumble4Text = this.add.text(cam.centerX, 450,
    'All wins are added to the players balance after all of the tumbles resulted from a base spin have been played.', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: panelWidth - 80 }
    }).setOrigin(0.5, 0);
  this.pageTumble.add(tumble4Text);

   // --- Add your 4 orbs here ---

  // We'll put them centered horizontally, spaced evenly, below the last text (say Y = 520)
  const orbY = 620;
  const orbSpacing = 170; // horizontal spacing between orbs
  const orbScale = 0.5;

  // Calculate starting X so orbs are centered
  const totalWidth = orbSpacing * 3; // space between 4 orbs = 3 gaps
  const startX = cam.centerX - totalWidth / 2;

  // Add each orb image to the container
  const orbKeys = ['orb_green', 'orb_blue', 'orb_purple', 'orb_red'];

  orbKeys.forEach((key, i) => {
    const orb = this.add.image(startX + orbSpacing * i, orbY, key)
      .setScale(orbScale);
    this.pageTumble.add(orb);
  });

     // Placeholder description for tumble info (replace with your actual text)
     const tumble5Text = this.add.text(cam.centerX, 700,
      'These are the multiplier symbols. They are present on all reels and can hit randomly during spins and tumbles in both base game and FREE SPINS.', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: panelWidth - 80 }
      }).setOrigin(0.5, 0);
    this.pageTumble.add(tumble5Text);

      // Placeholder description for tumble info (replace with your actual text)
      const tumble6Text = this.add.text(cam.centerX, 820,
        'Whenever a MULTIPLIER symbol hits, it takes a random multiplier value of 2x, 3x, 4x, 5x, 6x, 8x, 10x, 12x, 15x, 20x, 25x, 50x, 100x, 250x or 500x.', {
          fontFamily: 'Arial',
          fontSize: '28px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: panelWidth - 80 }
        }).setOrigin(0.5, 0);
      this.pageTumble.add(tumble6Text);

            // Placeholder description for tumble info (replace with your actual text)
            const tumble7Text = this.add.text(cam.centerX, 940,
              'When the tumbling sequence ends, the values of all MULTIPLIER symbols on the screen are added together and the total win of the sequence is multiplied by the final value.', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageTumble.add(tumble7Text);
}

function createInfoPanelPageBuyFreeSpins() {
  const cam = this.cameras.main;
  const panelY = cam.height * 0.05;
  const panelWidth = cam.width;

  this.pageBuyFreeSpins = this.add.container(cam.centerX - panelWidth / 2, panelY).setDepth(103);

  // Title for buy free spins page
  const titleText = this.add.text(cam.centerX, 40, 'FREE SPINS RULES', {
    fontFamily: 'Arial',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5, 0);
  this.pageBuyFreeSpins.add(titleText);

  // Placeholder description for buy free spins info
  const descriptionText = this.add.text(cam.centerX, 100,
    'The FREE SPINS FEATURE is awarded when 4 or more SCATTER symbols hit anywhere on the screen.', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: panelWidth - 80 }
    }).setOrigin(0.5, 0);
  this.pageBuyFreeSpins.add(descriptionText);

    // Placeholder description for buy free spins info
    const descriptionText2 = this.add.text(cam.centerX, 195,
      'The round starts with 15 free spins.', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: panelWidth - 80 }
      }).setOrigin(0.5, 0);
    this.pageBuyFreeSpins.add(descriptionText2);

        // Placeholder description for buy free spins info
        const descriptionText3 = this.add.text(cam.centerX, 240,
          'During the FREE SPINS round, whenever a MULTIPLIER symbol hits and the spin results in a win, the MULTIPLIER value gets added to the total multiplier. For the whole duration of the round, whenever any new MULTIPLIER symbol hits and results in a win the total multiplier value is also used to multiply the win.', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: panelWidth - 80 }
          }).setOrigin(0.5, 0);
        this.pageBuyFreeSpins.add(descriptionText3);

            // Placeholder description for buy free spins info
    const descriptionText4 = this.add.text(cam.centerX, 490,
      'Whenever 3 or more SCATTER symbols hit during the FREE SPINS ROUND, 5 additional free spins are awarded.', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: panelWidth - 80 }
      }).setOrigin(0.5, 0);
    this.pageBuyFreeSpins.add(descriptionText4);

    // Placeholder description for buy free spins info
    const descriptionText5 = this.add.text(cam.centerX, 590,
      'Special  reels are in paly during the FREE SPINS ROUND.', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: panelWidth - 80 }
      }).setOrigin(0.5, 0);
    this.pageBuyFreeSpins.add(descriptionText5);

      // Title for buy free spins page
  const titleText2 = this.add.text(cam.centerX, 670, 'ANTE BET', {
    fontFamily: 'Arial',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5, 0);
  this.pageBuyFreeSpins.add(titleText2);

      // Placeholder description for buy free spins info
      const descriptionText6 = this.add.text(cam.centerX, 720,
        'The player has the option to select the bet multiplier.', {
          fontFamily: 'Arial',
          fontSize: '26px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: panelWidth - 80 }
        }).setOrigin(0.5, 0);
      this.pageBuyFreeSpins.add(descriptionText6);

      // Placeholder description for buy free spins info
      const descriptionText7 = this.add.text(cam.centerX, 750,
        'Depending on the selected bet, the game behaves differently. The possible values are:', {
          fontFamily: 'Arial',
          fontSize: '28px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: panelWidth - 80 }
        }).setOrigin(0.5, 0);
      this.pageBuyFreeSpins.add(descriptionText7);      
  
           // Placeholder description for buy free spins info
           const descriptionText8 = this.add.text(cam.centerX, 820,
            'Bet multiplier 25x - the chance to win free spins naturally doubled. More SCATTER symbols are present on the reels. The FREE SPINS PURCHASE FEATURE is disabled.', {
              fontFamily: 'Arial',
              fontSize: '28px',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 3,
              align: 'center',
              wordWrap: { width: panelWidth - 80 }
            }).setOrigin(0.5, 0);
          this.pageBuyFreeSpins.add(descriptionText8);    

       // Placeholder description for buy free spins info
       const descriptionText9 = this.add.text(cam.centerX, 960,
        'Bet multiplier 20x - gives the ability to purchase a FREE SPINS ROUND by paying a value equal to 100x total bet.', {
          fontFamily: 'Arial',
          fontSize: '28px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: panelWidth - 80 }
        }).setOrigin(0.5, 0);
      this.pageBuyFreeSpins.add(descriptionText9);          
}


function createInfoPanelPageGameRules() {
  const cam = this.cameras.main;
  const panelY = cam.height * 0.05;
  const panelWidth = cam.width;

  this.pageGameRules = this.add.container(cam.centerX - panelWidth / 2, panelY).setDepth(103);

  // Title for Game Rules page
  const titleText = this.add.text(cam.centerX, 40, 'BUY FREE SPINS', {
    fontFamily: 'Arial',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5, 0);
  this.pageGameRules.add(titleText);

  // Placeholder description text for game rules
  const rulesText = this.add.text(cam.centerX, 90,
    'The FREE SPINS ROUND can be instantly triggered form the base game by buying it for 100x current total bet. When the 25x ante bet feature is enabled, the BUY FREE SPINS feature is disabled.', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: panelWidth - 80 }
    }).setOrigin(0.5, 0);
  this.pageGameRules.add(rulesText);

      // Title for Game Rules page
  const titleText2 = this.add.text(cam.centerX, 250, 'GAME RULES', {
    fontFamily: 'Arial',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5, 0);
  this.pageGameRules.add(titleText2);

  // Volatility Icon
  const volatilityIcon = this.add.image(cam.centerX, 320, 'volitilityIcon')
    .setOrigin(0.5)
    .setScale(1); // Adjust scale if needed
  this.pageGameRules.add(volatilityIcon);

      // Placeholder description text for game rules
      const rulesText2 = this.add.text(cam.centerX, 350,
        'High volatility games pay out less often on average but the chance to hit big wins in a short time span is higher.', {
          fontFamily: 'Arial',
          fontSize: '28px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: panelWidth - 80 }
        }).setOrigin(0.5, 0);
      this.pageGameRules.add(rulesText2);

         // Placeholder description text for game rules
         const rulesText3 = this.add.text(cam.centerX, 450,
          'Symbols pay anywhere.', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: panelWidth - 80 }
          }).setOrigin(0.5, 0);
        this.pageGameRules.add(rulesText3);
        
           // Placeholder description text for game rules
           const rulesText4 = this.add.text(cam.centerX, 500,
            'All wins are multiplied by base bet.', {
              fontFamily: 'Arial',
              fontSize: '28px',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 3,
              align: 'center',
              wordWrap: { width: panelWidth - 80 }
            }).setOrigin(0.5, 0);
          this.pageGameRules.add(rulesText4);
          
             // Placeholder description text for game rules
             const rulesText5 = this.add.text(cam.centerX, 530,
              'All values are expressed as actual wins in coins.', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText5);        
            
              // Placeholder description text for game rules
             const rulesText6 = this.add.text(cam.centerX, 570,
              'When winning with multiple symbols, all wins are added to the total win.', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText6);   

            // Placeholder description text for game rules
             const rulesText7 = this.add.text(cam.centerX, 640,
              'Free spins win is awarded to the player after the round completes.', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText7);
            
             // Placeholder description text for game rules
             const rulesText8 = this.add.text(cam.centerX, 710,
              'Free spins total win in the history contains the whole win of the cycle.', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText8);
            
             // Placeholder description text for game rules
             const rulesText9 = this.add.text(cam.centerX, 790,
              'The theoretical RTP of this game is 96.50%', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText9);  
            
          // Placeholder description text for game rules
             const rulesText10 = this.add.text(cam.centerX, 830,
              'The RTP of the game when using the "ANTE BET" is 96.50%s', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText10);   

     // Placeholder description text for game rules
             const rulesText11 = this.add.text(cam.centerX, 900,
              'The RTP of the game when using "BUY FREE SPINS" is 96.50%', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText11);
            
           // Placeholder description text for game rules
             const rulesText12 = this.add.text(cam.centerX, 980,
              'MINIMUM BET: $0.20 | MAXIMUM BET: $100', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText12); 

            // Placeholder description text for game rules
             const rulesText13 = this.add.text(cam.centerX, 1030,
              'Malfunction voids all pays and plays.', {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: panelWidth - 80 }
              }).setOrigin(0.5, 0);
            this.pageGameRules.add(rulesText13); 
}

function createInfoPanelPageHowToPlay() {
  const cam = this.cameras.main;
  const panelY = cam.height * 0.05;
  const panelWidth = cam.width;

  this.pageHowToPlay = this.add.container(cam.centerX - panelWidth / 2, panelY).setDepth(103);

  // Title
  const titleText = this.add.text(cam.centerX, 40, 'HOW TO PLAY', {
    fontFamily: 'Arial',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5, 0);
  this.pageHowToPlay.add(titleText);

  // --- First Line ---
  let startX = cam.centerX - (panelWidth - 80) / 2 + 40;
  const firstLineY = 140;
  const line1 = this.add.container(0, 0);

  const text1 = this.add.text(startX, firstLineY, 'Click the ', {
    fontFamily: 'Arial',
    fontSize: '28px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
  });

  const icon1 = this.add.image(0, 0, 'cashIcon').setScale(0.5).setOrigin(0, 0);
  icon1.y = firstLineY + 6;
  icon1.x = text1.x + text1.width + 5;

  const text2 = this.add.text(0, 0, ' button to open the bet menu.', {
    fontFamily: 'Arial',
    fontSize: '28px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
  });
  text2.x = icon1.x + icon1.displayWidth + 5;
  text2.y = firstLineY;



  line1.add([text1, icon1, text2]);

  // --- Second Line ---
  const secondLineY = firstLineY + 45;
  const line2 = this.add.container(0, 0);

  const text3 = this.add.text(startX, secondLineY, 'Adjust values using the ', {
    fontFamily: 'Arial',
    fontSize: '28px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
  });

  const icon2 = this.add.image(0, 0, 'plusIcon').setScale(0.5).setOrigin(0, 0);
  icon2.y = secondLineY + 6;
  icon2.x = text3.x + text3.width + 5;

  const text4 = this.add.text(0, 0, ' and ', {
    fontFamily: 'Arial',
    fontSize: '28px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
  });
  text4.x = icon2.x + icon2.displayWidth + 5;
  text4.y = secondLineY;

  const icon3 = this.add.image(0, 0, 'minusIcon').setScale(0.5).setOrigin(0, 0);
  icon3.y = secondLineY + 6;
  icon3.x = text4.x + text4.width + 5;

  const text5 = this.add.text(0, 0, ' buttons.', {
    fontFamily: 'Arial',
    fontSize: '28px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
  });
  text5.x = icon3.x + icon3.displayWidth + 5;
  text5.y = secondLineY;

  line2.add([text3, icon2, text4, icon3, text5]);

  this.pageHowToPlay.add([titleText, line1, line2]);

    // Placeholder description for buy free spins info
    const descriptionText = this.add.text(cam.centerX, 250,
      'Press the SPIN button to play.', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: panelWidth - 80 }
      }).setOrigin(0.5, 0);
    this.pageHowToPlay.add(descriptionText);

    // Spin Icon
   const spinIcon = this.add.image(cam.centerX, descriptionText.y + descriptionText.height + 20, 'spinIcon').setOrigin(0.5, 0).setScale(0.5);
   this.pageHowToPlay.add(spinIcon);

    // Title for buy free spins page
  const titleText2 = this.add.text(cam.centerX, 420, 'MENU', {
    fontFamily: 'Arial',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5, 0);
  this.pageHowToPlay.add(titleText2);

  // Settings line base position, shifted down by 50 pixels and right by 20 pixels
const settingsStartX = cam.centerX - (panelWidth - 80) / 2 + 40 + 65;  // moved right by 20
const settingsStartY = spinIcon.y + spinIcon.displayHeight + 20 + 60;  // moved down by 50 total

// Container for the entire settings lines
const settingsContainer = this.add.container(0, 0);

// Line 1: "Settings" icon between text pieces
const textPart1 = this.add.text(settingsStartX, settingsStartY, '', {
  fontFamily: 'Arial',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
});

const settingsIcon = this.add.image(0, 0, 'settingsIcon').setScale(1).setOrigin(0, 0);
settingsIcon.x = settingsStartX;
settingsIcon.y = settingsStartY + 6; // vertically align icon with text

const textPart2 = this.add.text(0, 0, ' opens the menu that contains', {
  fontFamily: 'Arial',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
});
textPart2.x = settingsIcon.x + settingsIcon.displayWidth + 5;
textPart2.y = settingsStartY;

// Line 2 (below line 1)
const textPart3 = this.add.text(settingsStartX, settingsStartY + 40, 'the settings which affect the way', {
  fontFamily: 'Arial',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
});

// Line 3 (below line 2)
const textPart4 = this.add.text(settingsStartX, settingsStartY + 80, 'the game is being played.', {
  fontFamily: 'Arial',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
});

settingsContainer.add([textPart1, settingsIcon, textPart2, textPart3, textPart4]);

this.pageHowToPlay.add(settingsContainer);


        // Placeholder description for buy free spins info
        const descriptionText3 = this.add.text(cam.centerX, 640,
          'BATTERY SAVER - helps reduce the battery consumption of the game and can help to prevent the device from becoming ward during longer play sessions', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: panelWidth - 80 }
          }).setOrigin(0.5, 0);
        this.pageHowToPlay.add(descriptionText3);

           // Placeholder description for buy free spins info
           const descriptionText4 = this.add.text(cam.centerX, 800,
            'SOUND - toggles sound and music on and off', {
              fontFamily: 'Arial',
              fontSize: '28px',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 3,
              align: 'center',
              wordWrap: { width: panelWidth - 80 }
            }).setOrigin(0.5, 0);
          this.pageHowToPlay.add(descriptionText4);

          // Y position just under descriptionText4 (with spacing)
const linkStartY = descriptionText4.y + descriptionText4.displayHeight + 20;
const linkStartX = cam.centerX - (panelWidth - 80) / 2 + 120; // aligned with other text blocks

// Container for the history line
const linkContainer = this.add.container(0, 0);

// Optional: empty text to align the icon visually
const linkText1 = this.add.text(linkStartX, linkStartY, '', {
  fontFamily: 'Arial',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
});

// The link icon
const linkIcon = this.add.image(0, 0, 'linkIcon').setScale(1.5).setOrigin(0, 0);
linkIcon.x = linkStartX;
linkIcon.y = linkStartY + 6; // slight vertical alignment

// Text after the icon
const linkText2 = this.add.text(0, 0, ' opens the game history page', {
  fontFamily: 'Arial',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
});
linkText2.x = linkIcon.x + linkIcon.displayWidth + 5;
linkText2.y = linkStartY;

linkContainer.add([linkText1, linkIcon, linkText2]);
this.pageHowToPlay.add(linkContainer);

// Y position just under the linkContainer (with spacing)
const infoStartY = linkIcon.y + linkIcon.displayHeight + 20;
const infoStartX = cam.centerX - (panelWidth - 80) / 2 + 120; // same horizontal alignment

// Container for the info line
const infoContainer = this.add.container(0, 0);

// Optional: empty text for alignment
const infoText1 = this.add.text(infoStartX, infoStartY, '', {
  fontFamily: 'Arial',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
});

// The info icon
const infoIcon = this.add.image(0, 0, 'infoIcon').setScale(1.2).setOrigin(0, 0);
infoIcon.x = infoStartX;
infoIcon.y = infoStartY + 6; // vertical alignment tweak

// Text after the icon
const infoText2 = this.add.text(0, 0, ' opens the information page', {
  fontFamily: 'Arial',
  fontSize: '28px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
});
infoText2.x = infoIcon.x + infoIcon.displayWidth + 5;
infoText2.y = infoStartY;

infoContainer.add([infoText1, infoIcon, infoText2]);
this.pageHowToPlay.add(infoContainer);


           // Placeholder description for buy free spins info
           const descriptionText5 = this.add.text(cam.centerX, 980,
            'CREDIT and BET labels show the current balance and current total bet.', {
              fontFamily: 'Arial',
              fontSize: '28px',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 3,
              align: 'center',
              wordWrap: { width: panelWidth - 80 }
            }).setOrigin(0.5, 0);
          this.pageHowToPlay.add(descriptionText5);

          

}


function createPageSwitchButtons() {
  const cam = this.cameras.main;
  const panelY = cam.height * 0.9;

  // Destroy old buttons and text if they exist
  if (this.leftButton) this.leftButton.destroy();
  if (this.rightButton) this.rightButton.destroy();
  if (this.pageNumberText) this.pageNumberText.destroy();

  // Create previous button
  this.leftButton = this.add.image(cam.centerX - 80, panelY + 25, 'prevButton')
    .setInteractive({ useHandCursor: true })
    .setDepth(110)
    .setScale(0.7);

  // Create next button
  this.rightButton = this.add.image(cam.centerX + 80, panelY + 25, 'nextButton')
    .setInteractive({ useHandCursor: true })
    .setDepth(110)
    .setScale(0.7);

  // Create page number text
  this.pageNumberText = this.add.text(cam.centerX, panelY + 5, '', {
    fontFamily: 'Arial',
    fontSize: '32px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5, 0).setDepth(110);

  // Update page visibility and text initially
  updatePageVisibility.call(this);

  // Fix: prevent out-of-bounds navigation
  this.leftButton.on('pointerdown', () => {
    if (this.currentPage > 0) {
      this.currentPage--;
      updatePageVisibility.call(this);
    }
  });

  this.rightButton.on('pointerdown', () => {
    if (this.currentPage < this.infoPages.length - 1) {
      this.currentPage++;
      updatePageVisibility.call(this);
    }
  });
}


function updatePageVisibility() {
  this.infoPages.forEach((page, i) => {
    page.setVisible(i === this.currentPage);
  });
  // Update the page number text like (2 / 7)
  this.pageNumberText.setText(`(${this.currentPage + 1} / ${this.infoPages.length})`);
}




//// zzz///

function recalculateBetAmount() {
  const coinValues = selectedCurrency === 'USD' ? usdCoinValues : lbpCoinValues;
  const coinValue = coinValues[coinValueIndex];

  let newBet = betLevel * coinValue;

  // Clamp to valid range
  if (newBet < minBet) {
    newBet = minBet;
  } else if (newBet > maxBet) {
    newBet = maxBet;
  }

  betAmount = selectedCurrency === 'USD'
    ? Math.round(newBet * 100) / 100
    : Math.round(newBet);

  updateBetText();
}

//////////////////////////////////////////////////// AUTO SPIN HELPER FUNCTION ///////////////////////////////////////////////////
function startAutoSpins() {
  if (this.autoSpinsRemaining <= 0) {
    this.isAutoSpinning = false;

    // Show regular spin button again
    this.spinButton.setVisible(true);
    this.spinButton.setInteractive();

    // Hide autoplay UI
    this.autoplaySpinUI.setVisible(false);
    return;
  }

  this.isAutoSpinning = true;

  // Hide regular spin button
  this.spinButton.setVisible(false);
  this.spinButton.disableInteractive();

  // Show autoplay UI and update count
  this.autoplaySpinUI.setVisible(true);
  this.autoplaySpinText.setText(this.autoSpinsRemaining);

  // Trigger normal spin
  this.spinButton.emit('pointerdown');

  const spinCompleteHandler = () => {
    this.spinButton.off('spinComplete', spinCompleteHandler);

    this.autoSpinsRemaining--;

    if (this.autoSpinsRemaining > 0) {
      this.time.delayedCall(500, () => {
        this.autoplaySpinText.setText(this.autoSpinsRemaining); // Update count
        startAutoSpins.call(this);
      });
    } else {
      this.isAutoSpinning = false;

      // Hide autoplay UI
      this.autoplaySpinUI.setVisible(false);

      // Show regular spin button
      this.spinButton.setVisible(true);
      this.spinButton.setInteractive();
      toggleBuyFreeSpinsAndAnteUI.call(this, true);
      this.toggleBetUIVisibility(true);
    }
  };

  this.spinButton.once('spinComplete', spinCompleteHandler);
}

////////////////////////// HIDE BUY FREE SPINS AND ANTE BET HELPER //////////////////////////////////////////////
function toggleBuyFreeSpinsAndAnteUI(enable, fadeDuration = 150) {
  const alpha = enable ? 1 : 0.6;

  // Targets to fade
  const targets = [
    this.buyFreeSpinsButton,
    this.buyFreeSpinsText,
    this.buyFreeSpinsBonusText,
    this.buyFreeSpinsPriceContainer,
    this.anteBorder,
    this.anteToggleContainer,
    this.anteBetSpriteContainer
  ];

  this.tweens.add({ targets, alpha, duration: fadeDuration, ease: 'Linear' });

  if (!enable) {
    // Disable interactivity immediately
    this.buyFreeSpinsButton.disableInteractive();
    this.anteBorder.disableInteractive();
  } else {
    // Enable interactivity after fade completes
    this.time.delayedCall(fadeDuration, () => {
      this.buyFreeSpinsButton.setInteractive();
      this.anteBorder.setInteractive();
    });
  }
}

//////////////////////////////////////////// HIDE AUTOPLAY AND BET SETTINGS UI BUTTONS HELPER //////////////////////////////////////////////////////////
function toggleBetUIVisibility(show) {
  this.autoSpinBtnContainer.setVisible(show);
  this.cashButton.setVisible(show);

  if (show) {
    this.autoSpinBtnContainer.setInteractive(this.autoSpinBtnHitArea, Phaser.Geom.Circle.Contains);
    this.cashButton.setInteractive(this.cashHitArea, Phaser.Geom.Circle.Contains);
  } else {
    this.autoSpinBtnContainer.disableInteractive();
    this.cashButton.disableInteractive();
  }
}

/////////////////////////////////////////////////////// PLACE YOUR BETS/GOOD LUCK MESSAGE HELPER ///////////////////////////////////////////////////////
// Outside create():
function setGameMessage(scene, message) {
  if (!scene.gameMessageText) return;
  scene.gameMessageText.setText(message).setVisible(true);
}
