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

  ////////////////////////////////////////////////////// Define Global Constants /////////////////////////////////////////////////////////

    const symbolKeys = [
    'crown', 'hourglass', 'ring', 'chalice',
    'gem_red', 'gem_purple', 'gem_yellow', 'gem_green', 'gem_blue', 'scatter', 'wild'
  ];

  const scaleMap = {
    scatter: 1.05,
    wild: 1.2,
    crown: 1.05,
    hourglass: 1.05,
    ring: 1.05,
    chalice: 1.05,
    gem_red: 0.9,
    gem_purple: 0.9,
    gem_yellow: 0.9,
    gem_green: 0.9,
    gem_blue: 0.9,
  
    // Add orbs with similar scale to large symbols
    orb_green: 1.05,
    orb_blue: 1.05,
    orb_purple: 1.05,
    orb_red: 1.05,
    orb_diamond: 1.05
  };  

  ////////////////////////////////////////////// Weights for odds of certain symbols dropping ////////////////////////////////////////

// Weights based on estimated rarity from Gates of Olympus
const symbolWeights = {
  wild: 1,
  scatter: 1,
  crown: 2,
  hourglass: 3,
  ring: 4,
  chalice: 5,
  gem_red: 8,
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
const ORB_APPEARANCE_CHANCE = 0.05; // 0.2% per cell

// Define Orb Color Weights
const orbColorWeights = [
  { color: 'green', weight: 60 },
  { color: 'blue', weight: 25 },
  { color: 'purple', weight: 10 },
  { color: 'red', weight: 4 },
  { color: 'diamond', weight: 1 }
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
    { value: 0.2, weight: 40 },
    { value: 0.5, weight: 30 },
    { value: 1, weight: 20 },
  ],
  blue: [
    { value: 2, weight: 30 },
    { value: 3, weight: 27 },
    { value: 4, weight: 25 },
    { value: 5, weight: 10 },
    { value: 10, weight: 5 },
  ],
  purple: [
    { value: 15, weight: 50 },
    { value: 20, weight: 25 },
    { value: 25, weight: 20 },
    { value: 50, weight: 5 },
  ],
  red: [
    { value: 200, weight: 80 },
    { value: 250, weight: 60 },
    { value: 333, weight: 15 },
    { value: 500, weight: 5 },
  ],
  diamond: [
    { value: 1000, weight: 100 },
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

/////////////////////////////////////////////////////// WIN AMOUNT TABLE /////////////////////////////////////////////////////////////////////////

const payoutTable = {
  crown: {
    '5': 200,
    '4': 20,
    '3': 5,
    '2': 0.5
  },
  hourglass: {
    '5': 100,
    '4': 15,
    '3': 3
  },
  ring: {
    '5': 50,
    '4': 10,
    '3': 2
  },
  chalice: {
    '5': 50,
    '4': 10,
    '3': 2
  },
  gem_red: {
    '5': 10,
    '4': 2.5,
    '3': 0.2
  },
  gem_purple: {
    '5': 10,
    '4': 2.50,
    '3': 0.2
  },
  gem_yellow: {
    '5': 5,
    '4': 1,
    '3': 0.2
  },
  gem_green: {
    '5': 5,
    '4': 1,
    '3': 0.2
  },
  gem_blue: {
    '5': 5,
    '4': 1,
    '3': 0.2
  }
};

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


////////////////////////////////////////////// Free spins global states ///////////////////////////////////////////////////////////

// Multiplier pillar
let multiplierNumberSprites = [];

// Free Spins Global State
let isInFreeSpins = false;
let remainingFreeSpins = 0;
let totalFreeSpinsWon = 0;
let freeSpinsTotalWin = 0;
let freeSpinsGlobalMultiplier = 0;

////////////////////////////////////////////// Chart Map for custom png fonts //////////////////////////////////////////////////////////////

// Define Numbers Map for big wins pop up during free spins
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
  '$': 10,
  '£': 11,
  ',': 12,
  '.': 13
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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
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
    this.load.image('wild', basePath + 'wild.png');
  
    // Load Orbs
    this.load.image('orb_green', 'assets/orbs/green_orb.png');
    this.load.image('orb_blue', 'assets/orbs/blue_orb.png');
    this.load.image('orb_purple', 'assets/orbs/purple_orb.png');
    this.load.image('orb_red', 'assets/orbs/red_orb.png');
    this.load.image('orb_diamond', 'assets/orbs/diamond_orb.png');
    this.load.image('orb_value_background', 'assets/orbs/orb_value_background.png');

    // Load Wilds Multiplier Images
    this.load.image('wild_multiplier_x2', 'assets/symbols/wild_multiplier_x2.png');
    this.load.image('wild_multiplier_x3', 'assets/symbols/wild_multiplier_x3.png');
    this.load.image('wild_multiplier_x4', 'assets/symbols/wild_multiplier_x10.png');
    this.load.image('wild_multiplier_x5', 'assets/symbols/wild_multiplier_x20.png');
    this.load.image('wild_multiplier_x6', 'assets/symbols/wild_multiplier_x30.png');
    this.load.image('wild_multiplier_x7', 'assets/symbols/wild_multiplier_x40.png');
    this.load.image('wild_multiplier_x8', 'assets/symbols/wild_multiplier_x50.png');
  
    // Load splash and puddle image
    this.load.image('splash', 'assets/splash.png');
    this.load.image('puddle', 'assets/puddle.png');
    this.load.image('glow', 'assets/glow.png');
  
    // Load background and frame
    this.load.image('gridBackground', 'assets/grid_background.png'); // Background image (purple, ancient writings, etc.)
    this.load.image('gridFrame', 'assets/grid_frame.png'); // Frame image (golden edges)

    // Load Bubbles seperator
    this.load.image('bubbles', 'assets/bubbles.png');
  
    // Load Map Parts
    this.load.image('mapBackground', 'assets/map_background.jpg'); // Whole map background image (palace and pillars)
  
    // Load Spin UI Icon for spin button
    this.load.image('spinIcon', 'assets/ui/spin_icon.png'); // replace with your actual path
  
    // Load Slogan
    this.load.image('slogan', 'assets/slogan.png'); // replace with your actual path

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

    // Load Antte Bet Toggle Assets
    this.load.image('anteBorder', 'assets/ui/ante_border.png');
    this.load.image('toggleBorder', 'assets/ui/toggle_border.png');
    this.load.image('toggleKey', 'assets/ui/toggle_key.png');
    this.load.image('toggleArrow', 'assets/ui/toggle_arrow.png');
    this.load.image('toggleCheck', 'assets/ui/toggle_check.png');


    
  // Load Advanced Bet Settings Stuff
  this.load.image('advancedPlus', 'assets/ui/advanced_plus.png');
  this.load.image('advancedMinus', 'assets/ui/advanced_minus.png');
  this.load.image('cashIcon', 'assets/ui/cash_icon.png');
  this.load.image('closeIcon', 'assets/ui/close_icon.png');

  // Load Gifts and room background
  this.load.image('giftBox1', 'assets/ui/gift1.png');
  this.load.image('giftBox2', 'assets/ui/gift2.png');
  this.load.image('giftBox3', 'assets/ui/gift3.png');
  this.load.image('giftBox4', 'assets/ui/gift4.png');
  this.load.image('giftBox5', 'assets/ui/gift5.png');
  this.load.image('giftBox6', 'assets/ui/gift6.png');
  this.load.image('giftBox7', 'assets/ui/gift7.png');
  this.load.image('giftBox8', 'assets/ui/gift8.png');
  this.load.image('giftBox9', 'assets/ui/gift9.png');
  this.load.image('giftBox10', 'assets/ui/gift10.png');
  this.load.image('giftBox11', 'assets/ui/gift11.png');
  this.load.image('giftBox12', 'assets/ui/gift12.png');
  this.load.image('giftBox13', 'assets/ui/gift13.png');
  this.load.image('giftBox14', 'assets/ui/gift14.png');
  this.load.image('giftRoomBackground', 'assets/gift_room_background.jpg');
  this.load.image('giftRoomText1', 'assets/ui/gift_room_text_1.png');

  // Load Gift Box Explosion Image
  this.load.image('explosion', 'assets/ui/explosion.png');

  //  Load prizes for gifts 
  this.load.image('fixed_fish', 'assets/ui/fixed_fish.png');
  this.load.image('fisher_wild', 'assets/ui/fisher_wild.png');
  this.load.image('remove_lowest_fish', 'assets/ui/remove_lowest_fish.png');
  this.load.image('boot', 'assets/ui/boot.png');

  // Load boot stank fog image
  this.load.image('boot_stank', 'assets/ui/boot_stank.png');

  // Load Fixed Fish highlight image
  this.load.image('fixed_fish_highlight', 'assets/ui/fixed_fish_highlight.png');

  // Load numbered free spins for gifts
  this.load.image('more_free_spins_1', 'assets/ui/more_free_spins_1.png');
  this.load.image('more_free_spins_2', 'assets/ui/more_free_spins_2.png');
  this.load.image('more_free_spins_3', 'assets/ui/more_free_spins_3.png');

  // Load gifts Stats bar images
  this.load.image('stats_bar_background', 'assets/ui/gift_stats/stats_bar_background.png');
  this.load.image('stats_fixed_fish_off', 'assets/ui/gift_stats/stats_fixed_fish_off.png');
  this.load.image('stats_fisher_wild_off', 'assets/ui/gift_stats/stats_fisher_wild_off.png');
  this.load.image('stats_remove_lowest_fish_off', 'assets/ui/gift_stats/stats_remove_lowest_fish_off.png');
  this.load.image('stats_remove_lowest_fish_on', 'assets/ui/gift_stats/stats_remove_lowest_fish_on.png');
  this.load.image('free_spins_off_1', 'assets/ui/gift_stats/free_spins_off_1.png');
  this.load.image('free_spins_off_2', 'assets/ui/gift_stats/free_spins_off_2.png');
  this.load.image('free_spins_off_3', 'assets/ui/gift_stats/free_spins_off_3.png');

  // Load Congrats Popup Images
  this.load.image('congrats_popup_background', 'assets/ui/congrats_popup_background.png');

  // Load Wild Stats Bar images
  this.load.image('wild_stats_bar_background', 'assets/ui/wild_stats/wild_stats_bar_background.png');
  this.load.image('freespins_off_x2', 'assets/ui/wild_stats/freespins_off_x2.png');
  this.load.image('freespins_off_x3', 'assets/ui/wild_stats/freespins_off_x3.png');
  this.load.image('freespins_off_x10', 'assets/ui/wild_stats/freespins_off_x10.png');
  this.load.image('freespins_off_x20', 'assets/ui/wild_stats/freespins_off_x20.png');
  this.load.image('freespins_off_x30', 'assets/ui/wild_stats/freespins_off_x30.png');
  this.load.image('freespins_off_x40', 'assets/ui/wild_stats/freespins_off_x40.png');
  this.load.image('freespins_off_x50', 'assets/ui/wild_stats/freespins_off_x50.png');
  this.load.image('freespins_on_x2', 'assets/ui/wild_stats/freespins_on_x2.png');
  this.load.image('freespins_on_x3', 'assets/ui/wild_stats/freespins_on_x3.png');
  this.load.image('freespins_on_x10', 'assets/ui/wild_stats/freespins_on_x10.png');
  this.load.image('freespins_on_x20', 'assets/ui/wild_stats/freespins_on_x20.png');
  this.load.image('freespins_on_x30', 'assets/ui/wild_stats/freespins_on_x30.png');
  this.load.image('freespins_on_x40', 'assets/ui/wild_stats/freespins_on_x40.png');
  this.load.image('freespins_on_x50', 'assets/ui/wild_stats/freespins_on_x50.png');
  this.load.image('wild_stats_fisher_on', 'assets/ui/wild_stats/wild_stats_fisher_on.png');
  this.load.image('wild_stats_fisher_off', 'assets/ui/wild_stats/wild_stats_fisher_off.png');

  // Load wild counter pop up images
  this.load.image('wild_counter_popup_background', 'assets/ui/wild_counter_popup_background.png');

  // Load Rainbow Particle image
  this.load.image('colors_particle', 'assets/ui/colors_particle.png');

  // Load scatters popup image
  this.load.image('scatters_popup_background', 'assets/ui/scatters_popup_background.png');

  // Load free spins total win pop up image
  this.load.image('freespins_win_popup_background', 'assets/ui/freespins_win_popup_background.png');


  //Load waterfall sprite sheet image
  this.load.spritesheet('waterfall_sprite', 'assets/ui/waterfall_sprite.png', {
    frameWidth: 128,
    frameHeight: 253
  });

  //Load waterfall splash spritesheet image
  this.load.spritesheet('waterfall_splash_sprite', 'assets/ui/waterfall_splash_sprite.png', {
    frameWidth: 256,
    frameHeight: 47
  });

  // Waterfall fish images
  this.load.image('waterfall_fish_1', 'assets/ui/waterfall_fish_1.png');
  this.load.image('waterfall_fish_2', 'assets/ui/waterfall_fish_2.png');
  this.load.image('waterfall_fish_3', 'assets/ui/waterfall_fish_3.png');
  this.load.image('waterfall_fish_4', 'assets/ui/waterfall_fish_4.png');
  this.load.image('waterfall_fish_5', 'assets/ui/waterfall_fish_5.png');
  this.load.image('waterfall_text', 'assets/ui/waterfall_text.png');

  // Random orb special event BOMB images
  this.load.image('bomb', 'assets/ui/bomb.png');
  this.load.image('bomb_explosion_1', 'assets/ui/bomb_explosion_1.png');
  this.load.image('bomb_explosion_2', 'assets/ui/bomb_explosion_2.png');
  this.load.image('bomb_explosion_3', 'assets/ui/bomb_explosion_3.png');

  // Hook special event images 
  this.load.image('hook', 'assets/ui/hook.png');
  this.load.image('hook_rope', 'assets/ui/hook_rope.png');

  // Chest special animation images
  this.load.image('chest_opened', 'assets/ui/chest_opened.png');
  
  this.load.spritesheet('chest_opening_spritesheet', 'assets/ui/chest_opening_spritesheet.png', {
    frameWidth: 323,
    frameHeight: 258
  }); // 3 frames total

  this.load.spritesheet('chest_closing_spritesheet', 'assets/ui/chest_closing_spritesheet.png', {
    frameWidth: 323,
    frameHeight: 258
  }); // 3 frames total
 
  // Load big win pop up images (during free spins)
  this.load.image('big_win_popup', 'assets/ui/big_win_popup.png');
  this.load.image('epic_win_popup', 'assets/ui/epic_win_popup.png');
  this.load.image('mega_win_popup', 'assets/ui/mega_win_popup.png');
  this.load.image('super_win_popup', 'assets/ui/super_win_popup.png');
  this.load.spritesheet('big_win_popup_spritesheet', 'assets/ui/big_win_popup_spritesheet.png', {
    frameWidth: 140,
    frameHeight: 208
  }); // 14 frames total

  // Load logo parts images
  this.load.image('logo_background', 'assets/ui/logo_background.png');
  this.load.image('logo_fish', 'assets/ui/logo_fish.png');
  this.load.image('logo_xmas', 'assets/ui/logo_xmas.png');
  this.load.image('logo_bigbass', 'assets/ui/logo_bigbass.png');
  this.load.image('logo_xtreme', 'assets/ui/logo_xtreme.png');

  // Load Character Steve image
  this.load.image('steve_lower_body', 'assets/ui/steve_lower_body.png');
  this.load.image('steve_upper_body', 'assets/ui/steve_upper_body.png');

  //Load AutoPlay Settings Stuff
  this.load.image('autoplayIcon', 'assets/ui/autoplay_icon.png');
  this.load.image('scrollIcon', 'assets/ui/scroll_icon.png');
  this.load.image('scrollIcon2', 'assets/ui/scroll_icon2.png');
  this.load.image('autoplaySpinIcon', 'assets/ui/autoplay_spin_icon.png');
  this.load.image('homeIcon', 'assets/ui/home_icon.png');


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



  
function create() {
    const cols = 5;
    const rows = 3;
  
    const designWidth = 720;
    const designHeight = 1280;
  
    const gridWidth = 710;
    const gridHeight = 400;
    const boxWidth = gridWidth / cols;
    const boxHeight = gridHeight / rows ;
  
    const centerX = designWidth / 2;
    const centerY = designHeight / 2 ;
  
    const gridYOffset = -100; // Move grid and frame up
  
    // Main container to scale everything
    const gameContainer = this.add.container(0, 0);
    

    
  // --- Full game background  ---
  const mapBg = this.add.image(centerX, centerY, 'mapBackground');
  mapBg.setDisplaySize(720, 1280);
  mapBg.setDepth(-10);
  gameContainer.add(mapBg);

///////////////////////////////////////// logo container //////////////////////////////////////////////////////////////////////////////////////////////////////

// --- Create logo at top center ---
const logoY = 170; // Position from top

// Create logo container
const logoContainer = this.add.container(centerX, logoY).setScale(0.5);
gameContainer.add(logoContainer);

// Add logo parts with proper layering
const logoBackground = this.add.image(0, 0, 'logo_background');
const logoFish = this.add.image(0, 0, 'logo_fish');
const logoBigbass = this.add.image(0, 0, 'logo_bigbass');
const logoXmas = this.add.image(0, 0, 'logo_xmas');
const logoXtreme = this.add.image(0, 0, 'logo_xtreme');

// Add all parts to the logo container
const logoParts = [logoBackground, logoFish, logoBigbass, logoXmas, logoXtreme];
logoContainer.add(logoParts);
logoContainer.setDepth(5);

// ✅ Store reference for wave animation use
this.logoParts = logoParts;


/////////////////////////////////////////////////////////// Create Steve Character //////////////////////////////////////////////////////////////////////////////////////////////////////

// === Add Steve character to top left ===

// Position near top left
const steveX = 70;
const steveY = 250;

// Create a container for Steve
const steveContainer = this.add.container(steveX, steveY);
gameContainer.add(steveContainer);

// Create and add lower and upper body
const steveLower = this.add.image(0, 0, 'steve_lower_body');
const steveUpper = this.add.image(0, 0, 'steve_upper_body');

steveContainer.add([steveLower, steveUpper]);
steveContainer.setDepth(5); // In front of most things but behind overlays if needed

// Optional: Save for later use (e.g., animations or expressions)
this.steveContainer = steveContainer;
this.steveLower = steveLower;
this.steveUpper = steveUpper;

// Steve Upper Body Tween subtle breathing and rotation
this.tweens.add({
  targets: steveUpper,
  angle: -2, // slight backward lean
  scaleY: 1.02, // slight breathing rise
  duration: 2000,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1
});


///////////////////////////////////// Bubbles container //////////////////////////////////////////////////////////////////////////////////////////////////////

  const bubbleContainer = createBubbleSeparators(
    this,               // scene
    gameContainer,      // your main UI container
    centerX,
    centerY,
    gridWidth,
    gridHeight,
    gridYOffset,
    cols
  );
  
  
/////////////////////////////////// Create initial grid before playing //////////////////////////////////////////////////////////////////////////////
  
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

  // Create a separate container for text that won't be masked
  const textContainer = this.add.container(centerX - gridWidth / 2, centerY - gridHeight / 2 + gridYOffset);
  gameContainer.add(textContainer);
  
  // Store the text container in the scene for later use
  this.textContainer = textContainer;



  // Initialize symbols array
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

  // Expose these variables to be used by simulateReelTweenSpin
  window.gridContainer = gridContainer;
  window.boxWidth = boxWidth;
  window.boxHeight = boxHeight;

  const maskGraphics = this.make.graphics();
  maskGraphics.fillStyle(0xffffff);
  // Make the mask taller by adding 50px at top and 50px at bottom
  maskGraphics.fillRect(
    centerX - gridWidth / 2, 
    centerY - gridHeight / 2 + gridYOffset - 10, // Start 50px higher
    gridWidth, 
    gridHeight + 20 // Add 100px total height (50px top + 50px bottom)
  );
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

///////////////////////////////////////////////////////////// Sound Effects //////////////////////////////////////////////////////////////////////////////////////////////////////

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

// Spin button click handler
spinButton.on('pointerdown', async () => {
  spinButton.disableInteractive();
  this.sounds.sfx_spinButton.play();
  
  // Change message to "GOOD LUCK"
  setGameMessage(this, "GOOD LUCK");
  
  // Only hide buttons if we're not in auto spin mode
  // (auto spin mode already hides all buttons)
  if (!this.isAutoSpinning) {
    spinButton.setVisible(false);
    this.cashButton.setVisible(false);
    this.autoSpinBtnContainer.setVisible(false);
    this.buyFreeSpinsButton.disableInteractive().setAlpha(0.4);
    this.anteBorder.disableInteractive().setAlpha(0.4);
    this.anteBetSpriteContainer.setAlpha(0.5);
    this.anteToggleContainer.setAlpha(0.5);
  }
  
  // Remove win text at start of spin
  if (this.winText) {
    this.winText.destroy();
    this.winText = null;
  }
  
  // Stop any existing payline animations
  if (this.stopPaylineAnimations) {
    this.stopPaylineAnimations();
  }
  
  // Ensure all splash and puddle elements are cleaned up
  cleanupSplashElements(this);

  try {
    const response = await fetch('/games/bigbassxmasxtreme/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        betAmount: betAmount,
        currency: selectedCurrency,
        freeSpins: false,
        ante: this.anteBetActive // Add ante parameter
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Spin error:', err.error);
      spinButton.setInteractive();
      // Show buttons again if there's an error
      spinButton.setVisible(true);
      this.cashButton.setVisible(true);
      this.buyFreeSpinsButton.setInteractive().setAlpha(1);
      this.anteBorder.setInteractive().setAlpha(1);
      this.anteBetSpriteContainer.setAlpha(1);
      this.anteToggleContainer.setAlpha(1);
      return;
    }

    const data = await response.json();
    if (data.newBalance !== null) {
      if (selectedCurrency === 'USD') userBalanceUSD = data.newBalance;
      else userBalanceLBP = data.newBalance;
      updateBalanceText();
    } else {
      await updateBalanceFromServer();
    }

    // Log the grid data from the backend
    console.log('Backend grid data:', JSON.stringify(data.grid));

    // —— RUN REALISTIC SPIN ANIMATION —— 
    await simulateReelTweenSpin.call(this, data.grid);

    // Check for special events
    if (data.orbChestTriggered) {
      await playOrbChestAnimation(this, data.orbChestWin);
    }
    else if (data.extraScatterTriggered && data.extraScatterGrid) {
      await playExtraScatterAnimation(this, data.grid, data.extraScatterGrid);
      
      // After extra scatter animation, we should have 3 scatters in total
      // The animation already handles showing congratulations and gift room
      if (!data.scatters) data.scatters = {};
      data.scatters.count = 3;
      data.scatters.freeSpins = 10;
      
      // Skip the regular scatter handling since the animation already did it
      data.scattersHandled = true;
    }
    
    // Animate orb values flying to wilds if present
    await animateOrbsToWilds(this);
    
    // Handle wins & scatters
    if (data.matches?.length) {
      highlightWinningPaylines.call(this, data.matches);
      displayWinMessage.call(this, data.winAmount);
    }
    if (data.scatters?.count >= 3 && !data.scattersHandled) {
      // Highlight scatter symbols with pulsing animation before showing gift room
      await highlightScatterSymbols(this);
      showGiftRoom.call(this, data.scatters.freeSpins);
    }

    // Only show buttons if we're not in auto spin mode
    if (!this.isAutoSpinning) {
      spinButton.setVisible(true);
      this.cashButton.setVisible(true);
      this.autoSpinBtnContainer.setVisible(true);
      spinButton.setInteractive();
      this.buyFreeSpinsButton.setInteractive().setAlpha(1);
      this.anteBorder.setInteractive().setAlpha(1);
      this.anteBetSpriteContainer.setAlpha(1);
      this.anteToggleContainer.setAlpha(1);
    }
    
    // Reset message to "PLACE YOUR BETS!" if no win was shown
    if (!data.matches?.length) {
      setGameMessage(this, "PLACE YOUR BETS!");
    }
    
    // Emit spinComplete event for autoplay functionality
    spinButton.emit('spinComplete');
  } catch (error) {
    console.error('Error during spin:', error);
    // Only show buttons if we're not in auto spin mode
    if (!this.isAutoSpinning) {
      spinButton.setVisible(true);
      this.cashButton.setVisible(true);
      this.autoSpinBtnContainer.setVisible(true);
      spinButton.setInteractive();
      this.buyFreeSpinsButton.setInteractive().setAlpha(1);
      this.anteBorder.setInteractive().setAlpha(1);
      this.anteBetSpriteContainer.setAlpha(1);
      this.anteToggleContainer.setAlpha(1);
    }
    
    // Reset message to "PLACE YOUR BETS!" on error
    setGameMessage(this, "PLACE YOUR BETS!");
    
    // Emit spinComplete event even on error to prevent autoplay from getting stuck
    spinButton.emit('spinComplete');
  }
});


// — — — Reel spin: random → final grid in one smooth timeline — — —
async function simulateReelTweenSpin(finalGrid) {
  
  const rows = finalGrid.length;
  const cols = finalGrid[0].length;
  const randomKeys = Object.keys(scaleMap)
    .filter(k => !k.startsWith('orb') && k !== 'wild');
  
  // Use existing orb weights for fake grid
  const ORB_FAKE_CHANCE = 0.10; // 15% chance per fake symbol

  const fakeCycles      = 25;
  const spinSpeedPerRow = 80;
  const decelDuration   = 500;
  const interReelDelay  = 150;

  // We add old symbols at the BOTTOM of the container,
  // so the container's initialY positions the old symbols exactly visible,
  // then container moves DOWN to reveal new symbols on top.

  const symbolsPerReel  = fakeCycles + rows + rows; // fake + final + old
  const containerHeight = symbolsPerReel * boxHeight;

  // Position container so old symbols are visible at bottom:
  // old symbols start at y = (fakeCycles + rows) * boxHeight,
  // so container y = - (fakeCycles + rows) * boxHeight aligns old symbols at y=0 visible grid.
  const initialY        = - (fakeCycles + rows) * boxHeight;
  const finalStopY      = 0; // container top aligns with grid top

  // Save old symbols by column to reuse (do NOT destroy yet)
  const oldSymbolsByCol = [];
  if (this.symbols?.length) {
    for (let col = 0; col < cols; col++) {
      oldSymbolsByCol[col] = [];
      for (let row = 0; row < rows; row++) {
        oldSymbolsByCol[col][row] = this.symbols[row]?.[col] || null;
      }
    }
  }
  
  // Store reference to old reel containers for cleanup later
  const oldReelContainers = this.oldReelContainers || [];
  
  // Dont Destroy text values
  this.symbols = [];

  const reelContainers = [];

  for (let col = 0; col < cols; col++) {
    const xPos = col * boxWidth + boxWidth / 2;
    const reel = this.add.container(xPos, initialY);
    gridContainer.add(reel);
    reelContainers.push(reel);

    // 3) Add old symbols at bottom of container
    for (let row = 0; row < rows; row++) {
      const y = (fakeCycles + rows + row) * boxHeight + boxHeight / 2;

      const img = oldSymbolsByCol[col]?.[row];
      if (!img) continue;

      // Check if the old symbol is a container (orb with text)
      if (img.list && Array.isArray(img.list)) {
        // For containers, move the entire container
        img.x = 0;
        img.y = y;
        reel.add(img);
        
        // Ensure the container's valueText property is preserved
        if (img.valueText) {
          img.valueText.x = 0; // Local position within container
          img.valueText.y = + 40; // Local position within container
        }
      } else {
        // For regular images
        img.x = 0;
        img.y = y;
        reel.add(img);

        // Re-add valueText if any
        if (img.valueText) {
          // Update the position of the text to match the symbol's new position
          img.valueText.x = xPos;
          img.valueText.y = y;
          this.textContainer.add(img.valueText);
        }
      }
    }

    // 2) Add fake symbols in middle
    for (let i = 0; i < fakeCycles; i++) {
      const y = (rows + i) * boxHeight + boxHeight / 2;

      // Add a chance to include orbs in fake symbols
      if (Math.random() < ORB_FAKE_CHANCE) {
        // Use weighted selection for orb color
        const color = pickWeightedColor(orbColorWeights);
        const orbKey = `orb_${color}`;
        
        // Container to group orb and text
        const symbolContainer = this.add.container(0, y);
        
        // Create the orb image
        const orb = this.add.image(0, 0, orbKey);
        const scale = (scaleMap[orbKey] || 1) * Math.min((boxWidth - 4) / orb.width, (boxHeight - 4) / orb.height);
        orb.setScale(scale);
        
        // Use weighted selection for orb value
        const valueObj = pickWeightedRandom(orbValuePools[color]);
        orb.orbData = { color: color, value: valueObj.value };
        
        // Add background for the orb value
        const valueBackground = this.add.image(0, + 40, 'orb_value_background').setScale(0.6);
        
        // Format orb value as currency
        const formattedValue = formatOrbValueAsCurrency(valueObj.value);
        
        const txt = this.add.text(0, + 40, formattedValue, {
          fontFamily: 'Arial',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 4,
          align: 'center'
        }).setOrigin(0.5).setDepth(1);
        
        symbolContainer.add([orb, valueBackground, txt]);
        orb.valueText = txt;
        symbolContainer.valueText = txt;
        
        reel.add(symbolContainer);
      } else {
        // Add regular symbol
        const key = Phaser.Utils.Array.GetRandom(randomKeys);
        const img = this.add.image(0, y, key);
        const scale = (scaleMap[key] || 1) * Math.min((boxWidth - 4) / img.width, (boxHeight - 4) / img.height);
        img.setScale(scale);
        reel.add(img);
      }
    }

    // 1) Add final backend symbols at top
    for (let row = 0; row < rows; row++) {
      const y = row * boxHeight + boxHeight / 2;
      const cell = finalGrid[row][col];
      let symbolContainer;

      if (cell?.type === 'orb') {
        const orbKey = `orb_${cell.color}`;

        // Container to group orb and text
        symbolContainer = this.add.container(0, y);

        const orb = this.add.image(0, 0, orbKey);
        const scale = (scaleMap[orbKey] || 1) * Math.min((boxWidth - 4) / orb.width, (boxHeight - 4) / orb.height);
        orb.setScale(scale);
        orb.orbData = { color: cell.color, value: cell.value };

        // Add background for the orb value
        const valueBackground = this.add.image(0, + 40, 'orb_value_background').setScale(0.6);

        // Format orb value as currency instead of multiplier
        const formattedValue = formatOrbValueAsCurrency(cell.value);
        
        const txt = this.add.text(0, + 40, formattedValue, {
          fontFamily: 'Arial',
          fontSize: '22px', // Slightly smaller to fit currency values
          fontStyle: 'bold',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 4,
          align: 'center'
        }).setOrigin(0.5).setDepth(1);

        symbolContainer.add([orb, valueBackground, txt]);
        orb.valueText = txt;
        symbolContainer.valueText = txt;

        reel.add(symbolContainer);
      } else if (cell === 'wild' && this.wildMultiplier && this.wildMultiplier > 1) {
        // For wild symbols with multiplier during free spins
        
        // Container to group wild and multiplier badge
        symbolContainer = this.add.container(0, y);
        
        // Add the wild symbol to the container
        const wild = this.add.image(0, 0, 'wild');
        const scale = (scaleMap['wild'] || 1.05) * Math.min((boxWidth - 4) / wild.width, (boxHeight - 4) / wild.height);
        wild.setScale(scale);
        
        // Determine which multiplier image to use based on the value
        let multiplierKey;
        if (this.wildMultiplier <= 2) multiplierKey = 'wild_multiplier_x2';
        else if (this.wildMultiplier <= 3) multiplierKey = 'wild_multiplier_x3';
        else if (this.wildMultiplier <= 10) multiplierKey = 'wild_multiplier_x4';
        else if (this.wildMultiplier <= 20) multiplierKey = 'wild_multiplier_x5';
        else if (this.wildMultiplier <= 30) multiplierKey = 'wild_multiplier_x6';
        else if (this.wildMultiplier <= 40) multiplierKey = 'wild_multiplier_x7';
        else multiplierKey = 'wild_multiplier_x8';
        
        // Add the multiplier badge in the center of the wild
        const multiplierBadge = this.add.image(-30, -30, multiplierKey)
          .setScale(0.9)
          .setDepth(10);
        
        symbolContainer.add([wild, multiplierBadge]);
        wild.multiplierBadge = multiplierBadge;
        symbolContainer.multiplierBadge = multiplierBadge;
        
        reel.add(symbolContainer);
      } else {
        const img = this.add.image(0, y, cell);
        const scale = (scaleMap[cell] || 1) * Math.min((boxWidth - 4) / img.width, (boxHeight - 4) / img.height);
        img.setScale(scale);
        reel.add(img);
      }
    }
  }

  // Start the animation for the first reel
  const firstReelStarted = new Promise(resolve => {
    setTimeout(() => {
      // After animation has started, clean up previous old containers
      if (oldReelContainers.length > 0) {
        for (let i = 0; i < oldReelContainers.length; i++) {
          const reel = oldReelContainers[i];
          if (reel && reel.parentContainer) {
            // First destroy all children in the container
            if (reel.list && reel.list.length > 0) {
              // Make a copy of the list to avoid modification during iteration
              const children = [...reel.list];
              for (const child of children) {
                if (child) {
                  // If the child has valueText, destroy it too
                  if (child.valueText && !child.valueText.destroyed) {
                    child.valueText.destroy();
                    child.valueText = null;
                  }
                  reel.remove(child);
                  child.destroy();
                }
              }
            }
            // Then remove and destroy the container
            reel.parentContainer.remove(reel);
            reel.destroy();
          }
        }
        // Clear the reference
        this.oldReelContainers = [];
      }
      resolve();
    }, 600); // Wait a short time after animation starts
  });

  // Animate reels downward from initialY (old symbols visible) to finalStopY (new symbols visible at top)
  await Promise.all([
    firstReelStarted,
    ...reelContainers.map((reel, col) => {
      return new Promise(async (resolve) => {
        await new Promise(r => setTimeout(r, col * interReelDelay));

        
        // Slight scroll up before spin
         await new Promise(r => {
         this.tweens.add({
         targets: reel,
         y: initialY - 0.2 * boxHeight, // scroll slightly up
         ease: 'Sine.easeInOut',
         duration: 300,
         yoyo: true, // go up and come back to initialY
         onComplete: r
         });
        });



        // Linear spin downwards (container y increases from initialY to finalStopY)
        await new Promise(r => {
          this.tweens.add({
            targets: reel,
            y: finalStopY + 0.4 * boxHeight, // overshoot for bounce effect
            ease: 'Linear',
            duration: fakeCycles * spinSpeedPerRow,
            onComplete: r
          });
        });

        // Ease to final resting position
        this.tweens.add({
          targets: reel,
          y: finalStopY,
          ease: 'Cubic.easeOut',
          duration: decelDuration,
          onComplete: () => {
            this.sounds?.sfx_reelStop?.play();
            resolve();
          }
        });
      });
    })
  ]);

  // Store references to final symbols for interaction & highlight
  for (let row = 0; row < rows; row++) {
    this.symbols[row] = [];
    for (let col = 0; col < cols; col++) {
      const reel = reelContainers[col];
      // Final symbols are now at the end of the container.list
      const finalSymbolIndex = reel.list.length - rows + row;
      const symbol = reel.list[finalSymbolIndex];
      
      // Store reference to the symbol (could be a container or an image)
      this.symbols[row][col] = symbol;
      
      // If it's a container, make sure the valueText reference is preserved
      if (symbol.list && Array.isArray(symbol.list) && symbol.valueText) {
        // Ensure the valueText is correctly positioned
        symbol.valueText.x = 0;
        symbol.valueText.y = + 40;
      }
    }
  }
  
  // Create new containers to hold only the final symbols
  const finalReelContainers = [];
  
  for (let col = 0; col < cols; col++) {
    const xPos = col * boxWidth + boxWidth / 2;
    const finalReel = this.add.container(xPos, finalStopY);
    gridContainer.add(finalReel);
    finalReelContainers.push(finalReel);
    
    // Move only the final symbols to the new container
    for (let row = 0; row < rows; row++) {
      const symbol = this.symbols[row][col];
      
      // Remove from old container and add to new one
      if (symbol) {
        const oldReel = reelContainers[col];
        if (oldReel) {
          oldReel.remove(symbol);
        }
        
        // Reset position within new container
        symbol.x = 0;
        symbol.y = row * boxHeight + boxHeight / 2;
        finalReel.add(symbol);
      }
    }
  }
  
  // Store the old reel containers for cleanup on next spin instead of destroying them now
  this.oldReelContainers = reelContainers;
}


  // Add to game container
  gameContainer.add(spinButton);

  // ✅ Expose spinButton to the scene so you can access it elsewhere:
  this.spinButton = spinButton;

  // Expose the simulateReelTweenSpin function to the global scope
  window.simulateReelTweenSpin = simulateReelTweenSpin;

  // Add a cleanup function to prevent memory leaks
  this.events.on('shutdown', function() {
    console.log('Cleaning up scene resources');
    
    // Stop all tweens
    this.tweens.killAll();
    
    // Stop all sounds
    Object.values(this.sounds || {}).forEach(sound => {
      if (sound && sound.isPlaying) {
        sound.stop();
      }
    });
    
    // Clean up bubble separators if they exist
    if (bubbleContainer && bubbleContainer.cleanup) {
      bubbleContainer.cleanup();
    }
    
    // Clean up old reel containers
    if (this.oldReelContainers && this.oldReelContainers.length > 0) {
      for (let i = 0; i < this.oldReelContainers.length; i++) {
        const reel = this.oldReelContainers[i];
        if (reel && reel.parentContainer) {
          // First destroy all children in the container
          if (reel.list && reel.list.length > 0) {
            const children = [...reel.list];
            for (const child of children) {
              if (child) {
                // If the child has valueText, destroy it too
                if (child.valueText && !child.valueText.destroyed) {
                  child.valueText.destroy();
                }
                reel.remove(child);
                child.destroy();
              }
            }
          }
          // Then remove and destroy the container
          reel.parentContainer.remove(reel);
          reel.destroy();
        }
      }
      this.oldReelContainers = [];
    }
    
    // Remove all event listeners
    if (this.spinButton) {
      this.spinButton.removeAllListeners();
    }
    if (this.buyFreeSpinsButton) {
      this.buyFreeSpinsButton.removeAllListeners();
    }
    if (this.anteBorder) {
      this.anteBorder.removeAllListeners();
    }
    if (this.cashButton) {
      this.cashButton.removeAllListeners();
    }
    
    // Clear any references that might be keeping objects in memory
    this.symbols = null;
    this.oldReelContainers = null;
    window.gridContainer = null;
    window.boxWidth = null;
    window.boxHeight = null;
    window.simulateReelTweenSpin = null;
  }, this);




// Function to display win message
function displayWinMessage(amount) {
  // Remove any existing win text first
  if (this.winText) {
    this.winText.destroy();
  }
  
  // Hide the "GOOD LUCK" message when showing a win
  setGameMessage(this, "");
  
  // Only create display if there's a win
  if (amount > 0) {
    try {
      // Create container for both text elements
      this.winText = this.add.container(centerX, centerY + 150).setDepth(100);
      
      // Create the "TOTAL NORMAL WIN:" label with blue color
      const label = this.add.text(
        -10, 
        0,
        "TOTAL NORMAL WIN:",
        {
          fontFamily: 'GatesFont',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#00b5fb' // Blue color
        }
      ).setOrigin(1, 0.5); // Right align
      
      // Create the amount text with yellow color
      const amountText = this.add.text(
        10, 
        0,
        `${selectedCurrency === 'USD' ? '$' + amount.toFixed(2) : '£' + Math.round(amount)}`,
        {
          fontFamily: 'GatesFont',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#ffe83d' // Yellow color
        }
      ).setOrigin(0, 0.5); // Left align
      
      // Add both texts to the container
      this.winText.add([label, amountText]);
    } catch (error) {
      console.log('Error creating win text:', error);
    }
  }
}


//////////////////////////////////////// Shadow Gradient effect beneath normal win amount text  /////////////////////////////////////////////////////////////////////////

// 1. Create gradient texture (put this once in preload or create)
const width = 710;
const height = 100;

const rt = this.textures.createCanvas('horizontalGradient', width, height);
const ctx = rt.getContext();

const gradient = ctx.createLinearGradient(0, 0, width, 0);

// Slightly lighter blue
gradient.addColorStop(0, 'rgba(20, 40, 120, 0)');
gradient.addColorStop(0.25, 'rgba(20, 40, 120, 0.35)');
gradient.addColorStop(0.5, 'rgba(20, 40, 120, 0.6)'); // slightly lower opacity
gradient.addColorStop(0.75, 'rgba(20, 40, 120, 0.35)');
gradient.addColorStop(1, 'rgba(20, 40, 120, 0)');

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);
rt.refresh();

// 2. Add the gradient shadow image
const gradientShadow = this.add.image(centerX, centerY + 110, 'horizontalGradient');
gradientShadow.setOrigin(0.5, 0);


//////////////////////////////////////// Shadow Gradient effect beneath BALANCE AND BET AMOUNT  /////////////////////////////////////////////////////////////////////////

// 1. Create solid overlay texture (put this once in preload or create)
const width2 = 720;
const height2 = 150;

const rt2 = this.textures.createCanvas('horizontalOverlay2', width2, height2);
const ctx2 = rt2.getContext();

// Slightly darker blue with a bit more opacity
ctx2.fillStyle = 'rgba(15, 30, 100, 0.55)';
ctx2.fillRect(0, 0, width2, height2);
rt2.refresh();

// 2. Add the solid overlay image, position it manually:
const gradientShadow2 = this.add.image(
  centerX,
  centerY + 500, // adjust Y position to fit behind balance/bet
  'horizontalOverlay2'
);

gradientShadow2.setOrigin(0.5, 0); // center horizontally, top aligned vertically


/////////////////////////////////////////////////////////////////////////////////// BUY FREE SPINS BUTTON UI ETC.. ///////////////////////////////////////////////////////////////////////////////////////

// --- Buy Free Spins Container (button + text + bonus text) ---
const buyFreeSpinsContainer = this.add.container(centerX + 200, designHeight - 375).setDepth(10).setScale(0.8,0.75);

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
const buyFreeSpinsPriceContainer = this.add.container(0, 0).setDepth(10).setScale(0.8);

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
  ? (betAmount * 100).toFixed(2)  // e.g., "20.00"
  : Math.round(betAmount * 100).toLocaleString('en-US');  // e.g., "20,000"

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

  buyFreeSpinsPriceContainer.x = centerX + 215 - (xOffset - spacing) / 2;
  buyFreeSpinsPriceContainer.y = designHeight - 350;
};


/////////////////////////////////////////////////////////////////// BUY FREE SPINS Confirmation Pop Up Message ///////////////////////////////////////////////////////////////////////////////////

this.showBuyFreeSpinsPopup = () => {

  this.spinButton.setVisible(false);
  this.cashButton.setVisible(false);
  this.autoSpinBtnContainer.setVisible(false);

  // Create dark overlay
  const overlay = this.add.rectangle(centerX, centerY, designWidth, designHeight, 0x000000, 0.4)
    .setDepth(19)
    .setInteractive(); // Block clicks to game behind

  // Create popup container
  const popupContainer = this.add.container(centerX, centerY - 120).setDepth(20).setScale(0);

  // Add background image
  const popupBg = this.add.image(0, 0, 'buyFreeSpinsPopupBg').setOrigin(0.5).setScale(0.8);
  popupContainer.add(popupBg);


  // YES BUTTON
  const yesButton = this.add.image(130, 150, 'buttonCheck').setInteractive().setScale(0.9);

yesButton.on('pointerdown', () => {
  yesButton.disableInteractive();
  this.sounds.sfx_freeYesButton.play();

  fetch('/games/bigbassxmasxtreme/buy-free-spins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      betAmount: betAmount,
      currency: selectedCurrency
    })
  })
  .then(res => res.json())
  .then(async data => {
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

      
    // === Disable Ante Toggle Functionality and Visuals ===
    this.anteBorder.disableInteractive(); // Disable click on the ante toggle
    this.buyFreeSpinsButton.disableInteractive(); // Disable Buy Free Spins Button

    // Fade out entire ante toggle + amount
    const fadeDuration = 150;
    this.tweens.add({ targets: this.anteToggleContainer, alpha: 0.6, duration: fadeDuration, ease: 'Linear' });
    this.tweens.add({ targets: this.anteBetSpriteContainer, alpha: 0.6, duration: fadeDuration, ease: 'Linear' });
    this.tweens.add({ targets: this.anteBorder, alpha: 0.6, duration: fadeDuration, ease: 'Linear' });
    this.tweens.add({ targets: this.buyFreeSpinsContainer, alpha: 0.6, duration: fadeDuration, ease: 'Linear' });

      // Get the grid data with guaranteed scatters
      const gridData = data.grid;
      const scattersData = data.scatters;
      
      // Use the same spin animation as regular spins
      await simulateReelTweenSpin.call(this, gridData);
      
      // Get free spins count
      const freeSpinsWon = scattersData.freeSpins;
      
      // Play scatter match sound
      this.sounds.sfx_scatterMatch.play();
      
      // Highlight scatter symbols
      for (let row = 0; row < this.symbols.length; row++) {
        for (let col = 0; col < this.symbols[row].length; col++) {
          const symbol = this.symbols[row][col];
          if (symbol && gridData[row][col] === 'scatter') {
            // Add glow effect or scale animation to highlight scatters
            this.tweens.add({
              targets: symbol,
              scale: symbol.scale * 1.2,
              duration: 300,
              yoyo: true,
              repeat: 2,
              ease: 'Sine.easeInOut'
            });
          }
        }
      }
      
      // Show gift room after a brief delay
      this.time.delayedCall(1500, () => {
        showGiftRoom.call(this, freeSpinsWon);
      });
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
  const noButton = this.add.image(-130, 150, 'buttonX').setInteractive().setScale(0.9);
  noButton.on('pointerdown', () => {
    this.sounds.sfx_freeNoButton.play();
    popupContainer.destroy();
    overlay.destroy();
  
    buyFreeSpinsButton.setVisible(true);
    buyFreeSpinsPriceContainer.setVisible(true);
    buyFreeSpinsText.setVisible(true); // probably want this visible too

    this.spinButton.setVisible(true);
    this.cashButton.setVisible(true);
    this.autoSpinBtnContainer.setVisible(true);
  
  });  
  popupContainer.add(noButton);

  // Price container
  const confirmPriceContainer = this.add.container(0, -5);
  popupContainer.add(confirmPriceContainer);
  const symbol = selectedCurrency === 'USD' ? '$' : '£';
  const cost = selectedCurrency === 'USD'
  ? (betAmount * 100).toFixed(2)  // e.g., "20.00"
  : Math.round(betAmount * 100).toLocaleString('en-US');  // e.g., "20,000"

  const fullText = `${symbol}${cost}`;
  const scale = selectedCurrency === 'USD' ? 1.2 : 1.0;
  const spacing = selectedCurrency === 'USD' ? 80 : 65;

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



//////////////////////////////////////////////////////////// UI FOR BET ANTTE TOGGLE  ////////////////////////////////////////////////////////////////////////////////////
// === Initial Ante State ===
this.anteBetActive = false;

// === Ante Border: Permanent Background & Click Target ===
this.anteBorder = this.add.image(centerX - 200, centerY + 265, 'anteBorder')
  .setOrigin(0.5)
  .setDepth(0)
  .setScale(0.75, 0.75)
  .setInteractive(); // Make it clickable

// === Toggle UI Container ===
this.anteToggleContainer = this.add.container(centerX - 200, centerY + 310).setScale(0.9, 0.8);

// Toggle Background (Static)
const toggleBorder = this.add.image(0, 0, 'toggleBorder').setOrigin(0.5);

// Toggle Knob Container (Moves Left/Right)
this.toggleKeyContainer = this.add.container(-20, 0); // Start on left

// Toggle Key Graphic and Icons
const toggleKeyImage = this.add.image(0, 0, 'toggleKey').setOrigin(0.5).setScale(1.1);
this.toggleArrow = this.add.image(0, - 2, 'toggleArrow').setOrigin(0.5).setScale(1.1);
this.toggleCheck = this.add.image(0, 0, 'toggleCheck').setOrigin(0.5).setVisible(false).setScale(1.1);

// Add graphics to knob container
this.toggleKeyContainer.add([toggleKeyImage, this.toggleArrow, this.toggleCheck]);

// Add background and knob to toggle container
this.anteToggleContainer.add([toggleBorder, this.toggleKeyContainer]);
this.anteToggleContainer.setDepth(1);

// === Ante Amount Display Container (Always visible) ===
this.anteBetSpriteContainer = this.add.container(centerX - 162, centerY + 232).setScale(0.9);
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

const autoSpinBtnContainer = this.add.container(centerX + 200, designHeight - 200, [autoSpinBtnCircle, autoSpinBtnIcon]);

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
const cashButton = this.add.container(160, designHeight - 200, [cashCircle, cashImage]);

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
      fill: '#ffe83d',  // white
  }).setDepth(10); // Display on top of other elements
  
  // --- Create "Credit:" label (blue) ---
  creditText = this.add.text(80, designHeight - 96, 'Credit', {
    fontFamily: 'GatesFont',
    fontSize: '30px',
    fill: '#00b5fb', // blue
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
  
  // Game message text (PLACE YOUR BETS / GOOD LUCK)
  this.gameMessageText = this.add.text(centerX, centerY + 150 , 'PLACE YOUR BETS!', {
    fontFamily: 'GatesFont',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffe83d', // Yellow color
    align: 'center'
  })
  .setOrigin(0.5)
  .setDepth(10);
  
  // --- "BET:" label in blue ---
  betLabel = this.add.text(centerX + 60, designHeight - 80, 'BET', {
    fontFamily: 'GatesFont',
    fontSize: '30px',
    fill: '#00b5fb'  // blue
  }).setOrigin(0, 0.5).setDepth(10);
  
  // --- Bet amount text in yellow ---
  betText = this.add.text(betLabel.x + betLabel.width + 5, designHeight - 80, '', {
    fontFamily: 'GatesFont',
    fontSize: '30px',
    fill: '#ffe83d'  // yellow
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
  }).setInteractive().setDepth(10).setVisible(false);
  
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

// Function to show gift room with 14 gift boxes
function showGiftRoom(freeSpinsWon) {
  // Store a reference to the scene
  const scene = this;
  
  // Remove win text when entering free spins
  if (scene.winText) {
    scene.winText.destroy();
    scene.winText = null;
  }
  
  // Hide game message during free spins
  setGameMessage(scene, "");
  
  // Get game dimensions
  const designWidth = 720;
  const designHeight = 1280;
  const centerX = designWidth / 2;
  const centerY = designHeight / 2;
  
  // Store free spins data
  let gameId = null;
  let additionalFreeSpins = 0;
  let fixedFishCount = 0;
  let fisherWildCount = 0;
  let removeLowestFish = false;
  let openedBoxCount = 0;
  let isProcessingBox = false; // Flag to prevent multiple box opens simultaneously
  let freeSpinsResults = null; // Store the free spins results
  
  // Create a container for all gift room elements
  const giftRoomContainer = scene.add.container(0, 0).setDepth(30);
  
  // Add background
  const background = scene.add.image(centerX, centerY, 'giftRoomBackground').setDisplaySize(designWidth, designHeight);
  giftRoomContainer.add(background);
  
  // Add stats bar at the bottom
  const statsBarContainer = createGiftStatsBar(scene, centerX, designHeight - 200);
  giftRoomContainer.add(statsBarContainer);
  
  // Add title image
  const titleImage = scene.add.image(centerX, 120, 'giftRoomText1').setOrigin(0.5).setScale(0.6);
  giftRoomContainer.add(titleImage);

 // Add pulsing scale tween
 scene.tweens.add({
   targets: titleImage,
   scale: { from: 0.6, to: 0.65 }, // Slight scale up
   duration: 800,
   yoyo: true,
   repeat: -1,
   ease: 'Sine.easeInOut'
 });

  // Initialize gift boxes with server data
  fetch('/games/bigbassxmasxtreme/start-bonus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      betAmount: betAmount,
      currency: selectedCurrency
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Store game ID for future API calls
      gameId = data.gameId;
      
      // Define exact positions for each gift box
      const boxWidth = 85;
      const boxHeight = 85;
      
      // Predefined positions for each gift box - can be easily adjusted
      const boxPositions = [
        // Top Row (2 boxes with big gap)
        { x: centerX - 170, y: centerY - 135, giftType: 'giftBox1', scale: 0.5 },
        { x: centerX + 190, y: centerY - 135, giftType: 'giftBox2', scale: 0.5 },

      
       // Second Row (6 boxes in 2 groups of 3 with center gap)
        { x: centerX - 275, y: centerY - 45, giftType: 'giftBox3', scale: 0.5 },
        { x: centerX - 190, y: centerY - 20, giftType: 'giftBox4', scale: 0.5 },
        { x: centerX - 80,  y: centerY - 10, giftType: 'giftBox5', scale: 0.5 },
        { x: centerX + 100,  y: centerY - 10, giftType: 'giftBox6', scale: 0.5 },
        { x: centerX + 220, y: centerY - 20, giftType: 'giftBox7', scale: 0.5 },
        { x: centerX + 305, y: centerY - 45, giftType: 'giftBox8', scale: 0.5 },

      
        // Third Row (4 boxes closer together)
        { x: centerX - 255, y: centerY + 90,  giftType: 'giftBox9',  scale: 0.5 },
        { x: centerX - 120, y: centerY + 100, giftType: 'giftBox10', scale: 0.5 },
        { x: centerX + 130, y: centerY + 100, giftType: 'giftBox11', scale: 0.5 },
        { x: centerX + 260, y: centerY + 90,  giftType: 'giftBox12', scale: 0.5 },
        
      
        // Bottom Row (2 boxes close together)
        { x: centerX - 170, y: centerY + 280, giftType: 'giftBox13', scale: 0.5 },
        { x: centerX + 220, y: centerY + 290, giftType: 'giftBox14', scale: 0.5 },
      ];
      
      
      
      // Get pre-revealed boots from backend
      const preRevealedBoots = data.preRevealedBoots || [];
      
      // Create a mapping of box IDs to positions
      const boxPositionsMap = {};
      boxPositions.forEach((position, index) => {
        boxPositionsMap[index] = position;
      });
      
      // Sort the gift boxes by ID to ensure consistent ordering
      const sortedGiftBoxes = [...data.giftBoxes].sort((a, b) => a.id - b.id);
      
      sortedGiftBoxes.forEach((boxData, index) => {
        // Use position from predefined array based on index
        const position = boxPositions[index] || { x: centerX, y: centerY };
        const x = position.x;
        const y = position.y;
        
        // Check if this box is pre-revealed as a boot
        const isPreRevealedBoot = preRevealedBoots.includes(boxData.id);
        
        if (isPreRevealedBoot || boxData.opened) {
          // Create a container for the boot and stank
          const bootContainer = scene.add.container(x, y);
          
          // Add stank fog slightly above the boot
          const stankImage = scene.add.image(0, 0, 'boot_stank')
            .setScale((position.scale || 0.8) * 1.2)
            .setOrigin(0.5)
            .setAlpha(1.0);
          
          // Create a boot image
          const bootImage = scene.add.image(0, 0, 'boot')
            .setScale((position.scale || 0.8) * 1.2) // Increased boot size by 20%
            .setOrigin(0.5);
          
          // Add both to the container - stank first (lower z-index), then boot
          bootContainer.add(stankImage);
          bootContainer.add(bootImage);
          giftRoomContainer.add(bootContainer);
          
          // Add floating animation to the boot container
          scene.tweens.add({
            targets: bootContainer,
            y: y - 10, // Float up by 10 pixels
            rotation: { from: -0.05, to: 0.05 }, // Slight rotation left/right
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
          // Add breathing effect animation to the stank
          scene.tweens.add({
            targets: stankImage,
            alpha: { from: 0.8, to: 1.0 },
            scale: { from: (position.scale || 0.8) * 1.1, to: (position.scale || 0.8) * 1.3 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        } else {
          // Create a gift box for unopened boxes
          // Use the specified gift type from the position data
          const giftBox = scene.add.image(x, y, position.giftType)
            .setScale(position.scale || 0.8)
            .setOrigin(0.5)
            .setInteractive();
          
          giftRoomContainer.add(giftBox);
          
          // Add the box ID to the sprite for reference
          giftBox.boxId = boxData.id;
          
          // Add a simple looping stretch and squash animation to the gift box
          const boxTween = scene.tweens.add({
            targets: giftBox,
            scaleY: (position.scale || 0.8) * 1.1, // Stretch vertically (more stretch as requested)
            scaleX: (position.scale || 0.8) * 1, // Slight squash horizontally
            duration: 700,
            yoyo: true,
            repeat: -1, // Loop indefinitely
            ease: 'Sine.easeInOut'
          });
          
          // Store reference to the tween on the gift box for cleanup
          giftBox.stretchTween = boxTween;
          
          // Add click handler for each box
          giftBox.on('pointerdown', function() {
            // Skip if another box is being processed
            if (isProcessingBox) {
              return;
            }
            
            // Set flag to prevent other boxes from being opened simultaneously
            isProcessingBox = true;
            
            // Disable interaction to prevent multiple clicks
            this.disableInteractive();
            
            // Stop the looping animation
            if (this.stretchTween) {
              this.stretchTween.stop();
              this.stretchTween = null;
            }
            
            // Play sound effect
            scene.sounds.sfx_basicButton.play();
            
            // Animate box opening
            scene.tweens.add({
              targets: this,
              scaleX: 0,
              duration: 150,
              ease: 'Power1',
              onComplete: () => {
                // Show explosion effect
                const explosion = scene.add.image(x, y, 'explosion').setScale(0.1).setOrigin(0.5);
                giftRoomContainer.add(explosion);
                
                // Fade out explosion
                scene.tweens.add({
                  targets: explosion,
                  scale: 0.8,
                  alpha: 0,
                  duration: 300,
                  ease: 'Power1',
                  onComplete: () => {
                    explosion.destroy();
                  }
                });
                
                // Make API call to open box
                fetch('/games/bigbassxmasxtreme/open-box', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    gameId: gameId,
                    boxId: this.boxId
                  })
                })
                .then(res => res.json())
                .then(result => {
                  if (result.success) {
                    const prize = result.prize;
                    
                    // Create prize image with consistent scale
                    let prizeImage;
                    
                    // Special handling for boot with stank
                    if (prize.type === 'boot') {
                      // Create a container for the boot and stank
                      const bootContainer = scene.add.container(x, y);
                      
                      // Add stank fog slightly above the boot
                      const stankImage = scene.add.image(0, 0, 'boot_stank')
                        .setScale(0.9)
                        .setOrigin(0.5)
                        .setAlpha(1.0);
                      
                      // Create a boot image
                      const bootImage = scene.add.image(0, 0, 'boot')
                        .setScale(0.85) // Increased boot size from 0.7 to 0.85
                        .setOrigin(0.5);
                      
                      // Add both to the container - stank first (lower z-index), then boot
                      bootContainer.add(stankImage);
                      bootContainer.add(bootImage);
                      giftRoomContainer.add(bootContainer);
                      
                      // Store reference to container as the prize image
                      prizeImage = bootContainer;
                      
                      // Add floating animation to the boot container
                      scene.tweens.add({
                        targets: bootContainer,
                        y: y - 10, // Float up by 10 pixels
                        rotation: { from: -0.05, to: 0.05 }, // Slight rotation left/right
                        duration: 1500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                      });
                      
                      // Add breathing effect animation to the stank
                      scene.tweens.add({
                        targets: stankImage,
                        alpha: { from: 0.8, to: 1.0 },
                        scale: { from: 0.8, to: 1.0 },
                        duration: 1800,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                      });
                    } else {
                      // Normal prize image
                      prizeImage = scene.add.image(x, y, prize.type).setScale(0.7);
                      giftRoomContainer.add(prizeImage);
                    }
                    
                    // Use specific numbered free spins images instead of text
                    if (prize.type === 'free_spins') {
                      // Remove the previous prize image
                      prizeImage.destroy();
                      
                      // Use the specific image for the number of free spins (1, 2, or 3)
                      const freeSpinsImage = scene.add.image(x, y, `more_free_spins_${prize.value}`).setScale(0.7);
                      giftRoomContainer.add(freeSpinsImage);
                    }
                    
                    // Remove the value text display for all gifts - we don't need it anymore
                    
                    // Update game state
                    additionalFreeSpins = result.gameState.additionalFreeSpins;
                    fixedFishCount = result.gameState.fixedFishCount;
                    fisherWildCount = result.gameState.fisherWildCount;
                    removeLowestFish = result.gameState.removeLowestFish;
                    
                    // Update stats bar
                    statsBarContainer.updateStats(fixedFishCount, fisherWildCount, removeLowestFish, additionalFreeSpins, prize);
                    
                    
                    // Increment opened box counter
                    openedBoxCount++;
                    
                    // Check if the gift phase has ended (found a boot or collected all prizes)
                    if (result.endGiftsPhase) {
                      // Store free spins results if they were returned
                      if (result.freeSpinsResults) {
                        freeSpinsResults = result.freeSpinsResults;
                      }
                      
                      // Play appropriate sound effect
                      if (prize.type === 'boot') {
                        scene.sounds.sfx_basicButton.play(); // Could replace with a specific boot sound
                      }
                      
                      // Immediately disable all remaining gift boxes
                      giftRoomContainer.list.forEach(item => {
                        if (item.boxId !== undefined && item.input && item.input.enabled) {
                          item.disableInteractive();
                        }
                      });
                      
                      // Brief delay before ending the gift phase
                      scene.time.delayedCall(1500, () => {
                        // Clean up any running tweens for the gift room container and its children
                        cleanupTweens(scene, giftRoomContainer);
                        
                        // Remove the stats bar from the container before destroying the gift room
                        giftRoomContainer.remove(statsBarContainer);
                        
                        // Reposition the stats bar to the top of the screen for free spins phase
                        statsBarContainer.y = designHeight - 350; // Move slightly higher than original position
                        scene.add.existing(statsBarContainer); // Add it directly to the scene
                        
                        // Close gift room and start free spins
                        scene.tweens.add({
                          targets: giftRoomContainer,
                          alpha: 0,
                          duration: 300,
                          onComplete: () => {
                            // Properly destroy all children in the container
                            if (giftRoomContainer.list && giftRoomContainer.list.length > 0) {
                              // Make a copy of the list to avoid modification during iteration
                              const children = [...giftRoomContainer.list];
                              for (const child of children) {
                                if (child) {
                                  // If the child is a container itself, destroy its children first
                                  if (child.list && child.list.length > 0) {
                                    const grandchildren = [...child.list];
                                    for (const grandchild of grandchildren) {
                                      if (grandchild) {
                                        child.remove(grandchild);
                                        grandchild.destroy();
                                      }
                                    }
                                  }
                                  giftRoomContainer.remove(child);
                                  child.destroy();
                                }
                              }
                            }
                            // Then destroy the container itself
                            giftRoomContainer.destroy();
                            
                            // Store the free spins data and show congratulations popup
                            scene.pendingFreeSpinsData = {
                              freeSpinsResults,
                              features: {
                                baseFreeSpins: freeSpinsWon,
                                additionalFreeSpins,
                                fixedFishCount,
                                fisherWildCount,
                                removeLowestFish,
                                totalWinAmount: result.totalWinAmount || 0
                              }
                            };
                            
                            // Show congratulations popup after gift phase
                            showCongratulationsPopup.call(scene, freeSpinsWon + additionalFreeSpins);
                          }
                        });
                      });
                    }
                    // Check if all boxes are opened
                    else if (result.allOpened) {
                      // Add continue button that appears after all boxes are opened
                      const continueButton = scene.add.image(centerX, designHeight - 200, 'buttonCheck')
                        .setInteractive()
                        .setScale(1.2);
                        
                      giftRoomContainer.add(continueButton);
                      
                      const continueText = scene.add.text(centerX, designHeight - 200, 'CONTINUE', {
                        fontFamily: 'Arial',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#ffffff'
                      }).setOrigin(0.5);
                      
                      giftRoomContainer.add(continueText);
                      
                      continueButton.on('pointerdown', () => {
                        scene.sounds.sfx_basicButton.play();
                        
                        // Close gift room and start free spins
                        scene.tweens.add({
                          targets: giftRoomContainer,
                          alpha: 0,
                          duration: 300,
                          onComplete: () => {
                            // Properly destroy all children in the container
                            if (giftRoomContainer.list && giftRoomContainer.list.length > 0) {
                              // Make a copy of the list to avoid modification during iteration
                              const children = [...giftRoomContainer.list];
                              for (const child of children) {
                                if (child) {
                                  // If the child is a container itself, destroy its children first
                                  if (child.list && child.list.length > 0) {
                                    const grandchildren = [...child.list];
                                    for (const grandchild of grandchildren) {
                                      if (grandchild) {
                                        child.remove(grandchild);
                                        grandchild.destroy();
                                      }
                                    }
                                  }
                                  giftRoomContainer.remove(child);
                                  child.destroy();
                                }
                              }
                            }
                            // Then destroy the container itself
                            giftRoomContainer.destroy();
                            
                            // Start free spins with the results from the server
                            startFreeSpins(scene, freeSpinsResults, {
                              baseFreeSpins: freeSpinsWon,
                              additionalFreeSpins,
                              fixedFishCount,
                              fisherWildCount,
                              removeLowestFish,
                              totalWinAmount: result.totalWinAmount || 0
                            });
                          }
                        });
                      });
                    }
                    
                    // Reset the processing flag if this isn't ending the game
                    if (!result.endGiftsPhase) {
                      isProcessingBox = false;
                    }
                  }
                })
                .catch(err => {
                  console.error('Failed to open gift box:', err);
                  // Reset the processing flag on error
                  isProcessingBox = false;
                });
              }
            });
          });
        }
      });
    }
  })
  .catch(err => {
    console.error('Failed to initialize gift room:', err);
  });
}

// New function to handle free spins
function startFreeSpins(scene, freeSpinsResults, features) {
  console.log('Starting free spins with results:', freeSpinsResults);
  console.log('Features:', features);
  
  if (!freeSpinsResults || !freeSpinsResults.length) {
    console.error('No free spins results received');
    return;
  }
  
  // Ensure game message is hidden during free spins
  setGameMessage(scene, "");
  
  // Remove redundant stats bar repositioning code - the stats bar is already positioned by showGiftRoom
  
  // Variables to track progress
  let currentSpinIndex = 0;
  let totalWinAmount = 0;
  let initialFreeSpinsCount = 10; // Initial free spins count (default is 10)
  let totalFreeSpinsCount = initialFreeSpinsCount + features.additionalFreeSpins; // Include free spins from gift phase
  
  // Create a container for the free spins counter
  const freeSpinsContainer = scene.add.container(scene.cameras.main.centerX, scene.cameras.main.centerY + 200).setDepth(100);
  
  // Create the "FREE SPINS LEFT:" text in blue
  const freeSpinsLabel = scene.add.text(
    0, 
    0,
    "FREE SPINS LEFT:",
    {
      fontFamily: 'GatesFont',
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#00b5fb' // Blue color
    }
  ).setOrigin(1, 0.5); // Right align
  
  // Create the amount text in yellow
  const remainingSpinsText = scene.add.text(
    10, 
    0,
    `${totalFreeSpinsCount - currentSpinIndex}`,
    {
      fontFamily: 'GatesFont',
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffe83d' // Yellow color
    }
  ).setOrigin(0, 0.5); // Left align
  
  // Add both texts to the container
  freeSpinsContainer.add([freeSpinsLabel, remainingSpinsText]);
  
  // Create a counter for wild symbols collected
  const wildsCollectedText = scene.add.text(
    scene.cameras.main.centerX, 
    90,
    `WILDS: ${freeSpinsResults[0].wildsCollected % 4}/4 (${Math.floor(freeSpinsResults[0].wildsCollected / 4)} x 10 SPINS)`,
    {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }
  ).setOrigin(0.5).setDepth(100);
  
  // Only show the wilds counter if the fisher_wild feature is active
  wildsCollectedText.setVisible(true); // Always show the wilds counter
  
  // Make sure the wild stats bar is updated with the correct initial value
  if (scene.wildStatsBar && scene.wildStatsBar.updateWildStats) {
    const initialWildsCount = features.fisherWildCount || 0;
    scene.wildStatsBar.updateWildStats(initialWildsCount);
  }
  
  // Function to play the next spin
  function playNextSpin() {
    if (currentSpinIndex >= freeSpinsResults.length) {
      // All spins completed
      freeSpinsContainer.destroy();
      wildsCollectedText.destroy();
      
      // Clean up wild stats bar if it exists
      if (scene.wildStatsBar) {
        scene.wildStatsBar.destroy();
        scene.wildStatsBar = null;
      }
      
      // Clean up the win text container if it exists
      if (scene.freeSpinsWinContainer) {
        scene.freeSpinsWinContainer.destroy();
        scene.freeSpinsWinContainer = null;
        scene.freeSpinsWinLabel = null;
        scene.freeSpinsWinAmount = null;
      }
      
      // Show the free spins win popup
      showFreeSpinsWinPopup(scene, totalWinAmount).then(() => {
        // Update player balance after popup is closed
        if (selectedCurrency === 'USD') {
          userBalanceUSD += totalWinAmount;
        } else {
          userBalanceLBP += totalWinAmount;
        }
        scene.updateBalanceText();
        
        // Restore "PLACE YOUR BETS!" message after free spins are complete
        setGameMessage(scene, "PLACE YOUR BETS!");
      });
      
      return;
    }
    
    // Stop any existing payline animations
    if (scene.stopPaylineAnimations) {
      scene.stopPaylineAnimations();
    }
    
    // Get current spin data
    const spinData = freeSpinsResults[currentSpinIndex];
    
          // Update counter with remaining spins from our tracked count
      remainingSpinsText.setText(`${totalFreeSpinsCount - currentSpinIndex}`);
    
    // Set wildMultiplier on scene for use during reel spin
    if (spinData.wildMultiplier && spinData.wildMultiplier > 1) {
      console.log(`Setting wild multiplier: ${spinData.wildMultiplier}x`);
      scene.wildMultiplier = spinData.wildMultiplier;
    } else {
      scene.wildMultiplier = null;
    }
    
    // Create fixed fish orbs at the start of spin if feature is active
    let fixedFishOrbs = [];
    if (features.fixedFishCount > 0) {
      fixedFishOrbs = showFixedFishOrbs(scene, features.fixedFishCount, spinData);
    }
    
    // Use the simulateReelTweenSpin function from the global scope
    window.simulateReelTweenSpin.call(scene, spinData.grid).then(async () => {
      
      // Remove fixed fish orbs after spin animation completes
      await removeFixedFishOrbs(scene, fixedFishOrbs);
      // Check if waterfall event was triggered by the backend
      if (spinData.waterfallTriggered && spinData.waterfallGrid) {
        // Play waterfall animation with the data provided by the backend
        await playWaterfallAnimation(scene, spinData.waterfallGrid);
        
        // After waterfall animation, update the grid reference for any subsequent operations
        // This ensures we're using the final grid state with the transformed symbols
        spinData.grid = spinData.waterfallGrid;
      }
      // Check if random orbs event was triggered by the backend
      else if (spinData.randomOrbsTriggered && spinData.randomOrbsGrid) {
        // Play random orbs animation with the data provided by the backend
        await playRandomOrbsAnimation(scene, spinData.randomOrbsGrid);
        
        // After random orbs animation, update the grid reference for any subsequent operations
        // This ensures we're using the final grid state with the added orbs
        spinData.grid = spinData.randomOrbsGrid;
      }
      // Check if hook event was triggered by the backend
      else if (spinData.hookTriggered && spinData.hookGrid) {
        // Play hook animation with the data provided by the backend
        await playHookAnimation(scene, spinData.hookGrid, spinData.hookColumn);
        
        // After hook animation, update the grid reference for any subsequent operations
        // This ensures we're using the final grid state with the added wilds
        spinData.grid = spinData.hookGrid;
      }
      
      // Animate orb values flying to wilds if present
      await animateOrbsToWilds(scene);
      
      // Check for scatters to show popup and add free spins
      // Count scatters in the current grid
      let scatterCount = 0;
      for (let row = 0; row < spinData.grid.length; row++) {
        for (let col = 0; col < spinData.grid[row].length; col++) {
          if (spinData.grid[row][col] === 'scatter') {
            scatterCount++;
          }
        }
      }
      
      if (scatterCount >= 3) {
        console.log(`Found ${scatterCount} scatters in free spin!`);
        
        // Highlight scatter symbols with pulsing animation before showing popup
        await highlightScatterSymbols(scene);
        
        // Show the scatters popup
        await showScattersPopup(scene);
        
        // Add additional spins to our total count (10 spins for 3+ scatters)
        const additionalSpins = 5; // Add 10 free spins for 3+ scatters
        totalFreeSpinsCount += additionalSpins;
        
        // Update the remaining spins counter with the additional spins
        remainingSpinsText.setText(`${totalFreeSpinsCount - currentSpinIndex}`);
      }
      
      // Update wild collection counter if feature is active
      if (features.fisherWildCount > 0 || spinData.wildsInThisSpin > 0) {
        // Check if new wilds were found in this spin
        if (spinData.wildsInThisSpin > 0) {
          // Wild animation removed - no scale/zoom animation when collecting wilds
          
          // Update wilds counter
          if (Math.floor(spinData.wildsCollected / 4) >= 7) {
            // If we've reached the maximum multiplier, show a special message
            wildsCollectedText.setText(`WILDS: MAX MULTIPLIER REACHED (x50)`);
          } else {
            // Otherwise show the normal counter
            wildsCollectedText.setText(`WILDS: ${spinData.wildsCollected % 4}/4 (${Math.floor(spinData.wildsCollected / 4)} x 10 SPINS)`);
          }
          
          // Animate particles from wilds to the stats bar before updating the wild stats bar
          await animateWildsToStatsBar(scene, spinData.wildsCollected);
          
          // Check if we've completed a new set of 4 wilds with this spin
          const previousSets = Math.floor((spinData.wildsCollected - spinData.wildsInThisSpin) / 4);
          const currentSets = Math.floor(spinData.wildsCollected / 4);
          
          // Check if we've reached the maximum multiplier (x50)
          const maxMultiplierReached = currentSets >= 7; // We have 7 multipliers: x2, x3, x10, x20, x30, x40, x50
          
          // Only show the message and count additional spins if we haven't reached the maximum multiplier
          if (currentSets > previousSets && !maxMultiplierReached) {
            // Add additional spins when completing a set of 4 wilds
            totalFreeSpinsCount += 10; // Add 10 more free spins for each completed set
            
            // Process win amount first if there's a win
            if (spinData.winAmount > 0) {
              totalWinAmount += spinData.winAmount;
              
              // Update the total win text if it exists
              if (scene.freeSpinsWinContainer) {
                // Store the previous amount for animation
                const previousAmount = parseFloat(scene.freeSpinsWinAmount.text.replace(/[^0-9.-]+/g, ""));
                const newAmount = totalWinAmount;
                
                // Create a count-up animation
                scene.tweens.addCounter({
                  from: previousAmount,
                  to: newAmount,
                  duration: 800,
                  ease: 'Power1',
                  onUpdate: function (tween) {
                    const value = tween.getValue();
                    scene.freeSpinsWinAmount.setText(`${selectedCurrency === 'USD' ? '$' + value.toFixed(2).toLocaleString() : '£' + Math.round(value).toLocaleString()}`);
                  }
                });
              } else {
                // Create a new win text container if it doesn't exist
                const gridBottom = scene.cameras.main.centerY + 150;
                
                // Create a container for both text elements
                scene.freeSpinsWinContainer = scene.add.container(scene.cameras.main.centerX, gridBottom).setDepth(100);
                
                // Create the "TOTAL WIN:" label with blue color
                scene.freeSpinsWinLabel = scene.add.text(
                  -10, 
                  0,
                  "TOTAL WIN:",
                  {
                    fontFamily: 'GatesFont',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#00b5fb' // Blue color
                  }
                ).setOrigin(1, 0.5); // Right align
                
                // Create the amount text with yellow color
                scene.freeSpinsWinAmount = scene.add.text(
                  10, 
                  0,
                  `${selectedCurrency === 'USD' ? '$' + totalWinAmount.toFixed(2).toLocaleString() : '£' + Math.round(totalWinAmount).toLocaleString()}`,
                  {
                    fontFamily: 'GatesFont',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#ffe83d' // Yellow color
                  }
                ).setOrigin(0, 0.5); // Left align
                
                // Add both texts to the container
                scene.freeSpinsWinContainer.add([scene.freeSpinsWinLabel, scene.freeSpinsWinAmount]);
              }
              
              // Calculate win multiplier to determine if we should show big win popup
              const winMultiplier = spinData.winAmount / betAmount;
              
              if (winMultiplier >= 20) {
                // For big wins (20x bet or more), show the big win popup first, then the wild counter popup
                showBigWinPopup(scene, spinData.winAmount, betAmount, selectedCurrency).then(() => {
                  // After big win popup, show wild counter popup
                  currentSpinIndex++;
                  showWildCounterPopup(scene, currentSets === 1 ? 2 : 
                                              currentSets === 2 ? 3 : 
                                              currentSets === 3 ? 10 : 
                                              currentSets === 4 ? 20 : 
                                              currentSets === 5 ? 30 : 
                                              currentSets === 6 ? 40 : 50, 
                                       playNextSpin);
                });
                return; // Exit early to prevent automatic progression
              }
            }
            
            // If there's no big win to show, just show the wild counter popup
            currentSpinIndex++;
            showWildCounterPopup(scene, currentSets === 1 ? 2 : 
                                        currentSets === 2 ? 3 : 
                                        currentSets === 3 ? 10 : 
                                        currentSets === 4 ? 20 : 
                                        currentSets === 5 ? 30 : 
                                        currentSets === 6 ? 40 : 50, 
                                 playNextSpin);
            
            // Return early to prevent the game from continuing until popup is closed
            return;
          }
        } else {
          // If no new wilds were found, just update the wild stats bar directly
          if (scene.wildStatsBar && scene.wildStatsBar.updateWildStats) {
            scene.wildStatsBar.updateWildStats(spinData.wildsCollected);
          }
        }
      }
      
      // Add win amount from this spin
      if (spinData.winAmount > 0) {
        totalWinAmount += spinData.winAmount;
        
        // Highlight winning paylines if any
        if (spinData.matches && spinData.matches.length > 0) {
          highlightWinningPaylines.call(scene, spinData.matches);
        }
        
        // Calculate win multiplier to determine if we should show big win popup
        const winMultiplier = spinData.winAmount / betAmount;
        
        // Update the total win text before showing any popups
        if (!scene.freeSpinsWinContainer) {
          // Position it below the grid
          const gridBottom = scene.cameras.main.centerY + 150;
          
          // Create a container for both text elements
          scene.freeSpinsWinContainer = scene.add.container(scene.cameras.main.centerX, gridBottom).setDepth(100);
          
          // Create the "TOTAL WIN:" label with blue color
          scene.freeSpinsWinLabel = scene.add.text(
            -10, 
            0,
            "TOTAL WIN:",
            {
              fontFamily: 'GatesFont',
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#00b5fb' // Blue color
            }
          ).setOrigin(1, 0.5); // Right align
          
          // Create the amount text with yellow color
          scene.freeSpinsWinAmount = scene.add.text(
            10, 
            0,
            `${selectedCurrency === 'USD' ? '$' + totalWinAmount.toFixed(2).toLocaleString() : '£' + Math.round(totalWinAmount).toLocaleString()}`,
            {
              fontFamily: 'GatesFont',
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#ffe83d' // Yellow color
            }
          ).setOrigin(0, 0.5); // Left align
          
          // Add both texts to the container
          scene.freeSpinsWinContainer.add([scene.freeSpinsWinLabel, scene.freeSpinsWinAmount]);
        } else {
          // Store the previous amount for animation
          const previousAmount = parseFloat(scene.freeSpinsWinAmount.text.replace(/[^0-9.-]+/g, ""));
          const newAmount = totalWinAmount;
          
          // Create a count-up animation
          scene.tweens.addCounter({
            from: previousAmount,
            to: newAmount,
            duration: 800,
            ease: 'Power1',
            onUpdate: function (tween) {
              const value = tween.getValue();
              scene.freeSpinsWinAmount.setText(`${selectedCurrency === 'USD' ? '$' + value.toFixed(2).toLocaleString() : '£' + Math.round(value).toLocaleString()}`);
            }
          });
        }
        
        if (winMultiplier >= 20) {
          // For big wins (20x bet or more), show the big win popup
          showBigWinPopup(scene, spinData.winAmount, betAmount, selectedCurrency).then(() => {
            // Continue to next spin after popup closes
            currentSpinIndex++;
            playNextSpin();
          });
          return; // Exit early to prevent automatic progression
        }
        
        // Play win sound
        scene.sounds.sfx_symbolsMatch.play();
        
        // Continue to next spin after a delay
        scene.time.delayedCall(1500, () => {
          currentSpinIndex++;
          scene.time.delayedCall(500, playNextSpin);
        });
      } else {
        // No win on this spin, continue to next
        currentSpinIndex++;
        scene.time.delayedCall(1000, playNextSpin);
      }
    }).catch(error => {
      console.error('Error during spin animation:', error);
      // Continue to next spin on error
      currentSpinIndex++;
      scene.time.delayedCall(500, playNextSpin);
    });
  }
  
  // Start playing spins after a short delay
  scene.time.delayedCall(500, playNextSpin);
}

// Function to play orb chest animation
function playOrbChestAnimation(scene, winAmount) {
  return new Promise(async (resolve) => {
    // Get boxWidth and boxHeight from the scene or use defaults if not available
    const boxWidth = window.boxWidth || 142;
    const boxHeight = window.boxHeight || 133;
    
    // Calculate position for the chest (top left corner above the grid)
    const chestY = scene.cameras.main.centerY - 380; // Place chest higher above the grid
    const chestX = scene.cameras.main.centerX - 240; // Move chest more to the right
    
    // Create a container for the chest animation directly in the scene
    const chestContainer = scene.add.container(chestX, chestY);
    
    // Create the chest sprite using the spritesheet
    const chestSprite = scene.add.sprite(0, 0, 'chest_opening_spritesheet');
    chestSprite.setScale(0.6); // Adjust scale as needed
    chestContainer.add(chestSprite);
    
    // Create chest value display that will be shown after orbs fly in
    const valueContainer = scene.add.container(18, 55); // Position below and to the right of the chest
    const valueBackground = scene.add.image(0, 0, 'orb_value_background').setScale(0.6);
    
    const valueText = scene.add.text(0, 0, "0", {
      fontFamily: 'Arial',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setDepth(1);
    
    valueContainer.add([valueBackground, valueText]);
    valueContainer.setVisible(false); // Hide initially
    chestContainer.add(valueContainer);
    
    // Create the chest opening animation if it doesn't exist
    if (!scene.anims.exists('chest_opening')) {
      scene.anims.create({
        key: 'chest_opening',
        frames: scene.anims.generateFrameNumbers('chest_opening_spritesheet', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: 0
      });
    }
    
    // No glow effect
    
    // Play a notification sound if available
    if (scene.sounds.sfx_congratsPopup) {
      scene.sounds.sfx_congratsPopup.play();
    }
    
    // Start the chest opening animation immediately
    chestSprite.play('chest_opening');
    
    // Start collecting orbs after chest opens
    chestSprite.once('animationcomplete', collectOrbValues);
    
    // Function to collect orb values from the grid
    async function collectOrbValues() {
      // Find all orbs in the grid
      const orbs = [];
      
      // First, collect all orbs with their exact positions
      for (let row = 0; row < scene.symbols.length; row++) {
        for (let col = 0; col < scene.symbols[row].length; col++) {
          const symbol = scene.symbols[row][col];
          
          // Skip if no symbol
          if (!symbol) continue;
          
          // Calculate grid position
          const gridX = col * boxWidth + boxWidth / 2;
          const gridY = row * boxHeight + boxHeight / 2;
          
          // Check if it's an orb (container with valueText)
          if (symbol.list && Array.isArray(symbol.list) && symbol.valueText) {
            // Find the orb image within the container
            const orbImage = symbol.list.find(child => 
              child.texture && child.texture.key && child.texture.key.startsWith('orb_')
            );
            
            if (orbImage && orbImage.orbData) {
              // Convert grid position to world position
              const worldX = window.gridContainer.x + gridX;
              const worldY = window.gridContainer.y + gridY;
              
              orbs.push({
                symbol: symbol,
                position: { row, col, x: worldX, y: worldY },
                value: orbImage.orbData.value || 0
              });
              
              console.log(`Found orb at (${row},${col}) with value ${orbImage.orbData.value}, position: (${worldX}, ${worldY})`);
            }
          }
        }
      }
      
      // If we have orbs, animate them flying to the chest
      if (orbs.length > 0) {
        console.log(`Found ${orbs.length} orbs for chest animation`);
        
        // Play orb flying sound if available
        if (scene.sounds.sfx_orbFlying) {
          scene.sounds.sfx_orbFlying.play();
        }
        
        // Track running total
        let runningTotal = 0;
        
        // Process each orb one by one
        for (let i = 0; i < orbs.length; i++) {
          const orb = orbs[i];
          
          // Wait for previous animation to complete if not the first orb
          if (i > 0) {
            await new Promise(r => scene.time.delayedCall(300, r));
          }
          
          // Create a copy of the orb value display at the orb's position
          const flyingContainer = scene.add.container(orb.position.x, orb.position.y);
          const orbValueBackground = scene.add.image(0, 0, 'orb_value_background').setScale(0.6);
          
          // Get the formatted value from the orb
          const orbValue = orb.value;
          const formattedValue = formatOrbValueAsCurrency(orbValue);
          
          const flyingText = scene.add.text(0, 0, formattedValue, {
            fontFamily: 'Arial',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
          }).setOrigin(0.5).setDepth(1);
          
          flyingContainer.add([orbValueBackground, flyingText]);
          
          // Calculate the exact position of the value container on the chest
          const valueDestX = chestX + valueContainer.x;
          const valueDestY = chestY + valueContainer.y;
          
          // Create a trail effect
          const trail = createSweepingTrail(
            scene, 
            orb.position.x, 
            orb.position.y, 
            valueDestX, 
            valueDestY
          );
          
          // Animate the value flying to the chest's value container
          await new Promise(resolveAnim => {
            scene.tweens.add({
              targets: flyingContainer,
              x: valueDestX,
              y: valueDestY,
              duration: 600,
              ease: 'Cubic.easeOut',
              onComplete: () => {
                // No chest flash animation
                
                // Remove the flying value
                flyingContainer.destroy();
                
                // Update running total
                runningTotal += orbValue;
                
                // Format the running total
                const formattedTotal = formatOrbValueAsCurrency(runningTotal);
                
                // Update the text on the chest
                valueText.setText(formattedTotal);
                
                // Make the value container visible if it's the first orb
                if (!valueContainer.visible) {
                  valueContainer.setVisible(true);
                }
                
                // Play coin sound if available
                if (scene.sounds.sfx_coinWin) {
                  scene.sounds.sfx_coinWin.play();
                }
                
                resolveAnim();
              }
            });
          });
        }
        
        // Play big win sound if available
        if (scene.sounds.sfx_bigWin) {
          scene.sounds.sfx_bigWin.play();
        }
        
        // Wait a moment before closing
        scene.time.delayedCall(2000, closeChestAnimation);
      } else {
        // No orbs found, just show the win amount
        valueContainer.setVisible(true);
        valueText.setText(formatOrbValueAsCurrency(winAmount));
        
        // Wait a moment before closing
        scene.time.delayedCall(2000, closeChestAnimation);
      }
    }
    
    // Function to close the chest animation
    function closeChestAnimation() {
      // Create the chest closing animation if it doesn't exist
      if (!scene.anims.exists('chest_closing')) {
        scene.anims.create({
          key: 'chest_closing',
          frames: scene.anims.generateFrameNumbers('chest_closing_spritesheet', { start: 0, end: 2 }),
          frameRate: 8,
          repeat: 0
        });
      }
      
      // Play the chest closing animation
      chestSprite.play('chest_closing');
      
      // Wait for the animation to complete before fading out
      chestSprite.once('animationcomplete', () => {
        // Fade out the chest container
        scene.tweens.add({
          targets: chestContainer,
          alpha: 0,
          y: chestY - 50, // Move up while fading
          duration: 500,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            // Clean up
            chestContainer.destroy();
            
            // Resolve the promise
            resolve();
          }
        });
      });
    }
  });
}

// Function to play extra scatter animation
function playExtraScatterAnimation(scene, originalGrid, extraScatterGrid) {
  return new Promise(async (resolve) => {
    // Find columns that have scatter symbols in the original grid
    const scatterColumns = new Set();
    
    for (let col = 0; col < originalGrid[0].length; col++) {
      for (let row = 0; row < originalGrid.length; row++) {
        if (originalGrid[row][col] === 'scatter') {
          scatterColumns.add(col);
        }
      }
    }
    
    // Create a simple notification
    const centerX = scene.cameras.main.centerX;
    const centerY = scene.cameras.main.centerY;
    
    const background = scene.add.rectangle(centerX, centerY, 500, 200, 0x000000, 0.7)
      .setOrigin(0.5)
      .setDepth(50);
    
    const eventText = scene.add.text(centerX, centerY - 40, 'EXTRA SCATTER CHANCE!', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(51);
    
    const subText = scene.add.text(centerX, centerY + 20, 'Spinning for another scatter...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(51);
    
    // Play sound effect
    if (scene.sounds.sfx_reelsDrop) {
      scene.sounds.sfx_reelsDrop.play();
    }
    
    // Wait a moment before fading out the notification
    await new Promise(r => scene.time.delayedCall(2000, r));
    
    scene.tweens.add({
      targets: [background, eventText, subText],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        background.destroy();
        eventText.destroy();
        subText.destroy();
      }
    });
    
    // Create a modified grid that keeps the original scatter columns intact
    const modifiedGrid = [];
    for (let row = 0; row < originalGrid.length; row++) {
      modifiedGrid[row] = [];
      for (let col = 0; col < originalGrid[row].length; col++) {
        if (scatterColumns.has(col)) {
          // Keep original symbols in scatter columns
          modifiedGrid[row][col] = originalGrid[row][col];
        } else {
          // Use new symbols from extraScatterGrid for other columns
          modifiedGrid[row][col] = extraScatterGrid[row][col];
        }
      }
    }
    
    // Use the existing simulateReelTweenSpin function, but we'll modify it to only spin certain columns
    const originalSymbols = [];
    
    // Save the original symbols to restore after the spin
    for (let row = 0; row < scene.symbols.length; row++) {
      originalSymbols[row] = [];
      for (let col = 0; col < scene.symbols[row].length; col++) {
        if (scatterColumns.has(col)) {
          // Save reference to scatter column symbols
          originalSymbols[row][col] = scene.symbols[row][col];
        }
      }
    }
    
    // Get boxWidth and boxHeight from the scene or use defaults if not available
    const boxWidth = window.boxWidth || 142; // Default width if not defined
    const boxHeight = window.boxHeight || 133; // Default height if not defined
    
    // Create a special version of simulateReelTweenSpin that only spins non-scatter columns
    const partialSpin = async (grid) => {
      const rows = grid.length;
      const cols = grid[0].length;
      const randomKeys = Object.keys(scaleMap)
        .filter(k => !k.startsWith('orb') && k !== 'wild');

      const fakeCycles = 25;
      const spinSpeedPerRow = 80;
      const decelDuration = 500;
      const interReelDelay = 150;

      const symbolsPerReel = fakeCycles + rows + rows;
      const containerHeight = symbolsPerReel * boxHeight;
      const initialY = -(fakeCycles + rows) * boxHeight;
      const finalStopY = 0;

      // Save old symbols by column to reuse
      const oldSymbolsByCol = [];
      if (scene.symbols?.length) {
        for (let col = 0; col < cols; col++) {
          oldSymbolsByCol[col] = [];
          for (let row = 0; row < rows; row++) {
            oldSymbolsByCol[col][row] = scene.symbols[row]?.[col] || null;
          }
        }
      }

      // Create new symbols array
      scene.symbols = [];

      const reelContainers = [];

      for (let col = 0; col < cols; col++) {
        // Skip columns that already have scatter symbols
        if (scatterColumns.has(col)) {
          continue;
        }
        
        const xPos = col * boxWidth + boxWidth / 2;
        const reel = scene.add.container(xPos, initialY);
        window.gridContainer.add(reel);
        reelContainers.push(reel);

        // Add old symbols at bottom of container
        for (let row = 0; row < rows; row++) {
          const y = (fakeCycles + rows + row) * boxHeight + boxHeight / 2;
          const img = oldSymbolsByCol[col]?.[row];
          if (!img) continue;

          // Check if the old symbol is a container (orb with text)
          if (img.list && Array.isArray(img.list)) {
            img.x = 0;
            img.y = y;
            reel.add(img);
            
            if (img.valueText) {
              img.valueText.x = 0;
              img.valueText.y = 0;
            }
          } else {
            img.x = 0;
            img.y = y;
            reel.add(img);

            if (img.valueText) {
              img.valueText.x = xPos;
              img.valueText.y = y;
              scene.textContainer.add(img.valueText);
            }
          }
        }

        // Add fake symbols in middle
        for (let i = 0; i < fakeCycles; i++) {
          const y = (rows + i) * boxHeight + boxHeight / 2;
          const key = Phaser.Utils.Array.GetRandom(randomKeys);
          const img = scene.add.image(0, y, key);
          const scale = (scaleMap[key] || 1) * Math.min((boxWidth - 4) / img.width, (boxHeight - 4) / img.height);
          img.setScale(scale);
          reel.add(img);
        }

        // Add final backend symbols at top
        for (let row = 0; row < rows; row++) {
          const y = row * boxHeight + boxHeight / 2;
          const cell = grid[row][col];
          let symbolContainer;

          if (cell?.type === 'orb') {
            const orbKey = `orb_${cell.color}`;
            
            // Container to group orb and text
            symbolContainer = scene.add.container(0, y);
            
            const orb = scene.add.image(0, 0, orbKey);
            const scale = (scaleMap[orbKey] || 1) * Math.min((boxWidth - 4) / orb.width, (boxHeight - 4) / orb.height);
            orb.setScale(scale);
            orb.orbData = { color: cell.color, value: cell.value };
            
            // Format orb value as currency instead of multiplier
            const formattedValue = formatOrbValueAsCurrency(cell.value);
            
            const txt = scene.add.text(0, + 40, formattedValue, {
              fontFamily: 'Arial',
              fontSize: '22px', // Slightly smaller to fit currency values
              fontStyle: 'bold',
              color: '#fff',
              stroke: '#000',
              strokeThickness: 4,
              align: 'center'
            }).setOrigin(0.5).setDepth(1);
            
            // Add background for the orb value
            const valueBackground = scene.add.image(0, + 40, 'orb_value_background').setScale(0.6);
            symbolContainer.add([orb, valueBackground, txt]);
            orb.valueText = txt;
            symbolContainer.valueText = txt;
            reel.add(symbolContainer);
          } else {
            const img = scene.add.image(0, y, cell);
            const scale = (scaleMap[cell] || 1) * Math.min((boxWidth - 4) / img.width, (boxHeight - 4) / img.height);
            img.setScale(scale);
            reel.add(img);
          }
        }
      }
    
      // Animate reels downward from initialY (old symbols visible) to finalStopY (new symbols visible at top)
      await Promise.all(reelContainers.map((reel, col) => {
        return new Promise(async (resolve) => {
          await new Promise(r => setTimeout(r, col * interReelDelay));
    
          // Linear spin downwards (container y increases from initialY to finalStopY)
          await new Promise(r => {
            scene.tweens.add({
              targets: reel,
              y: finalStopY + 0.4 * boxHeight, // overshoot for bounce effect
              ease: 'Linear',
              duration: fakeCycles * spinSpeedPerRow,
              onComplete: r
            });
          });
    
          // Ease to final resting position
          scene.tweens.add({
            targets: reel,
            y: finalStopY,
            ease: 'Cubic.easeOut',
            duration: decelDuration,
            onComplete: () => {
              scene.sounds?.sfx_reelStop?.play();
              resolve();
            }
          });
        });
      }));
    
      // Store references to final symbols for interaction & highlight
      for (let row = 0; row < rows; row++) {
        scene.symbols[row] = [];
        for (let col = 0; col < cols; col++) {
          // Skip columns that don't have reels
          if (scatterColumns.has(col)) {
            // For scatter columns, keep the original symbols
            scene.symbols[row][col] = oldSymbolsByCol[col]?.[row];
            continue;
          }
          
          // Find the corresponding reel container index (may not match col due to skipped columns)
          const reelIndex = reelContainers.findIndex(reel => 
            Math.round(reel.x) === Math.round(col * boxWidth + boxWidth / 2));
          
          if (reelIndex === -1) {
            continue; // Skip if no matching reel found
          }
          
          const reel = reelContainers[reelIndex];
          // Final symbols are now at the end of the container.list
          const finalSymbolIndex = reel.list.length - rows + row;
          const symbol = reel.list[finalSymbolIndex];
          
          // Store reference to the symbol (could be a container or an image)
          scene.symbols[row][col] = symbol;
          
          // If it's a container, make sure the valueText reference is preserved
          if (symbol && symbol.list && Array.isArray(symbol.list) && symbol.valueText) {
            // Ensure the valueText is correctly positioned
            symbol.valueText.x = 0;
            symbol.valueText.y = + 40;
          }
        }
      }
      
      // Create new containers to hold only the final symbols
      const finalReelContainers = [];
      
      for (let col = 0; col < cols; col++) {
        // Skip columns that already have scatter symbols
        if (scatterColumns.has(col)) {
          continue;
        }
        
        const xPos = col * boxWidth + boxWidth / 2;
        const finalReel = scene.add.container(xPos, finalStopY);
        window.gridContainer.add(finalReel);
        finalReelContainers.push(finalReel);
        
        // Find the corresponding reel container index
        const reelIndex = reelContainers.findIndex(reel => 
          Math.round(reel.x) === Math.round(xPos));
        
        if (reelIndex === -1) {
          continue; // Skip if no matching reel found
        }
        
        // Move only the final symbols to the new container
        for (let row = 0; row < rows; row++) {
          const symbol = scene.symbols[row][col];
          
          // Remove from old container and add to new one
          if (symbol) {
            const oldReel = reelContainers[reelIndex];
            if (oldReel) {
              oldReel.remove(symbol);
            }
            
            // Reset position within new container
            symbol.x = 0;
            symbol.y = row * boxHeight + boxHeight / 2;
            finalReel.add(symbol);
          }
        }
      }
      
      // Now remove the old reel containers completely
      for (let i = 0; i < reelContainers.length; i++) {
        const reel = reelContainers[i];
        if (reel && reel.parentContainer) {
          // First destroy any remaining children
          if (reel.list && reel.list.length > 0) {
            // Make a copy of the list to avoid modification during iteration
            const children = [...reel.list];
            for (const child of children) {
              if (child) {
                // If the child has valueText, destroy it too
                if (child.valueText && !child.valueText.destroyed) {
                  child.valueText.destroy();
                  child.valueText = null;
                }
                reel.remove(child);
                child.destroy();
              }
            }
          }
          // Then remove the container itself
          reel.parentContainer.remove(reel);
          reel.destroy();
        }
      }
    };
    
    // Execute the partial spin with the modified grid
    await partialSpin(modifiedGrid);
    
    // Check if a new scatter was added
    let scatterCount = 0;
    for (let row = 0; row < scene.symbols.length; row++) {
      for (let col = 0; col < scene.symbols[row].length; col++) {
        const symbol = scene.symbols[row][col];
        if (symbol && 
            ((typeof symbol === 'string' && symbol === 'scatter') || 
             (symbol.texture && symbol.texture.key === 'scatter'))) {
          scatterCount++;
          // Highlight the scatter
          scene.tweens.add({
            targets: symbol,
            scale: symbol.scale * 1.3,
            duration: 300,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut'
          });
        }
      }
    }
    
    // If we have 3 or more scatters, show gift room
    if (scatterCount >= 3) {
      // Play scatter match sound
      if (scene.sounds.sfx_scatterMatch) {
        scene.sounds.sfx_scatterMatch.play();
      }
      
      // Wait a moment before showing the gift room
      scene.time.delayedCall(1500, () => {
        // Show gift room with proper context binding
        showGiftRoom.call(scene, 10); // Always 10 free spins for 3+ scatters
        resolve();
      });
    } else {
      // Resolve the promise after a brief delay if no scatters found
      scene.time.delayedCall(1000, () => {
        resolve();
      });
    }
  });
}

// Function to play waterfall animation during free spins
function playWaterfallAnimation(scene, waterfallGrid) {
  return new Promise(async (resolve) => {
    const centerX = scene.cameras.main.centerX;
    const centerY = scene.cameras.main.centerY;
    const gameWidth = scene.cameras.main.width;
    const gameHeight = scene.cameras.main.height;
    
    // Get boxWidth and boxHeight from the scene or use defaults if not available
    const boxWidth = window.boxWidth || 142; // Default width if not defined
    const boxHeight = window.boxHeight || 133; // Default height if not defined
    
    // Create a container for the waterfall effect
    const waterfallContainer = scene.add.container(0, 0).setDepth(49);
    
    // Calculate grid dimensions
    const gridWidth = scene.symbols[0].length * boxWidth;
    const gridHeight = scene.symbols.length * boxHeight;
    const gridX = window.gridContainer.x;
    const gridY = window.gridContainer.y;
    
    // Create the waterfall animation sprite - position it at the top-left of the grid and set wider than grid
    const waterfallWidthExtension = 40; // Extend waterfall 40px on each side
    const waterfallSprite = scene.add.sprite(gridX - waterfallWidthExtension/2, gridY, 'waterfall_sprite')
      .setDisplaySize(gridWidth + waterfallWidthExtension, gridHeight) // Make waterfall wider than grid
      .setOrigin(0, 0); // Set origin to top-left
      
    // Simple fish container
    const fishContainer = scene.add.container(0, 0).setDepth(50);
    
    // Function to show fish with consistent medium amount
    const showFish = () => {
      // If waterfall is not visible, don't show fish
      if (!waterfallSprite.visible) return;
      
      // Fixed positions for consistent fish distribution
      const positions = [0.15, 0.3, 0.5, 0.7, 0.85];
      const positionIndex = scene.fishPositionIndex || 0;
      const xPosition = gridX + (gridWidth * positions[positionIndex % positions.length]);
      
      // Cycle through fish types for variety but consistency
      const fishNumber = (positionIndex % 5) + 1;
      const fishKey = `waterfall_fish_${fishNumber}`;
      
      // Consistent Y positions with slight variation
      const baseYPercent = 0.3 + (0.4 * (positionIndex % 3) / 2); // 0.3, 0.5, or 0.7
      const yPosition = gridY + (gridHeight * baseYPercent) + (Math.random() * 20 - 10); // Small random offset
      
      // Create fish sprite
      const fish = scene.add.image(xPosition, yPosition, fishKey)
        .setScale(0.5)
        .setAlpha(0)
        .setDepth(50);
      
      fishContainer.add(fish);
      
      // Alternate flip direction for natural appearance
      fish.setFlipX(positionIndex % 2 === 0);
      
      // Consistent jump animation
      const jumpHeight = 15; // Fixed jump height
      
      // Quick fade in
      scene.tweens.add({
        targets: fish,
        alpha: 0.9,
        duration: 200,
        ease: 'Sine.easeOut'
      });
      
      // Simple jump
      scene.tweens.add({
        targets: fish,
        y: fish.y - jumpHeight,
        duration: 300,
        yoyo: true, // Return to original position
        ease: 'Sine.easeOut',
        onComplete: () => {
          // Quick fade out
          scene.tweens.add({
            targets: fish,
            alpha: 0,
            duration: 200,
            ease: 'Sine.easeIn',
            onComplete: () => {
              fish.destroy();
            }
          });
        }
      });
      
      // Increment position index for next fish
      scene.fishPositionIndex = (positionIndex + 1) % (positions.length * 3); // Cycle through all positions
      
      // Schedule next fish with consistent timing
      const nextDelay = 500; // Fixed 0.5 seconds delay
      scene.time.delayedCall(nextDelay, showFish);
      
      // Show a second fish with consistent timing
      if (positionIndex % 3 === 0) { // Every third fish, show an additional one
        scene.time.delayedCall(250, () => {
          // Store current index
          const currentIndex = scene.fishPositionIndex;
          // Show fish at a different position
          scene.fishPositionIndex = (positionIndex + 2) % (positions.length * 3);
          showFish();
          // Restore index
          scene.fishPositionIndex = currentIndex;
        });
      }
    };
    
    // Create animation if it doesn't exist
    if (!scene.anims.exists('waterfall_anim')) {
      scene.anims.create({
        key: 'waterfall_anim',
        frames: scene.anims.generateFrameNumbers('waterfall_sprite', { start: 0, end: 20 }),
        frameRate: 14,
        repeat: -1
      });
    }
    
    // Create splash animation if it doesn't exist
    if (!scene.anims.exists('waterfall_splash_anim')) {
      scene.anims.create({
        key: 'waterfall_splash_anim',
        frames: scene.anims.generateFrameNumbers('waterfall_splash_sprite', { start: 0, end: 9 }),
        frameRate: 16,
        repeat: -1 // loop
      });
    }
    
    // Play the waterfall animation
    waterfallSprite.play('waterfall_anim');
    waterfallContainer.add(waterfallSprite);
    
    // Create splash sprites (initially invisible) - set depth higher than waterfall
    const splashContainer = scene.add.container(0, 0).setDepth(51);
    // Increase splash count to cover the wider area
    const splashWidthExtension = 80; // Extend splash coverage by 80px total (40px each side)
    const splashCount = Math.ceil((gridWidth + splashWidthExtension) / 256) + 1; // Add one extra for overlap
    const splashSprites = [];
    
    // Calculate splash size and position
    const splashScale = 2; // Make splash bigger
    const splashWidth = 256 * splashScale;
    const splashHeight = 47 * splashScale;
    // Position splash so half is inside grid, half outside (vertically)
    const splashY = gridY + gridHeight - (splashHeight / 2);
    
    for (let i = 0; i < splashCount; i++) {
      // Calculate horizontal position to cover the extended width evenly
      // Start from slightly left of the grid and extend beyond the right edge
      const totalWidth = gridWidth + splashWidthExtension;
      const xPosition = (gridX - splashWidthExtension/2) + ((totalWidth - splashWidth) * i / (splashCount - 1));
      const splash = scene.add.sprite(xPosition, splashY, 'waterfall_splash_sprite')
        .setOrigin(0, 0)
        .setScale(splashScale)
        .setVisible(false);
      // Add animation complete listener
      splash.on('animationcomplete', function (animation) {
        if (animation.key === 'waterfall_splash_anim') {
          // Keep playing the splash animation while the waterfall is visible
          if (waterfallSprite.visible) {
            this.play('waterfall_splash_anim');
          }
        }
      });
      
      splashSprites.push(splash);
      splashContainer.add(splash);
    }
    
    // Create a mask using graphics
    const maskGraphics = scene.make.graphics();
    
    // Function to update the mask
    const updateMask = (height, fromTop = true) => {
      maskGraphics.clear();
      maskGraphics.fillStyle(0xffffff);
      if (fromTop) {
        // For revealing from top: start at top and grow downward
        maskGraphics.fillRect(gridX - waterfallWidthExtension/2, gridY, gridWidth + waterfallWidthExtension, height);
      } else {
        // For hiding from top: start at bottom and shrink upward
        maskGraphics.fillRect(gridX - waterfallWidthExtension/2, gridY + gridHeight - height, gridWidth + waterfallWidthExtension, height);
      }
    };
    
    // Initialize mask with zero height (nothing visible)
    updateMask(0);
    
    // Create a geometry mask from the graphics object
    const mask = maskGraphics.createGeometryMask();
    
    // Apply the mask to the waterfall and fish containers
    waterfallContainer.setMask(mask);
    fishContainer.setMask(mask);
    
    // Create waterfall text animation
    const waterfallText = scene.add.image(centerX, -100, 'waterfall_text')
      .setOrigin(0.5)
      .setDepth(51)
      .setScale(0.5);
    
    // Animate text coming in from top
    scene.tweens.add({
      targets: waterfallText,
      y: gridY + (gridHeight * 0.4), // Position it at 40% of the grid height from the top
      scale: 1,
      duration: 800,
      ease: 'Back.easeOut'
    });
    
    // Play sound effect
    if (scene.sounds.sfx_screenThunder) {
      scene.sounds.sfx_screenThunder.play();
    }
    
    // Tween to reveal the waterfall from top to bottom
    scene.tweens.add({
      targets: { height: 0 },
      height: gridHeight,
      duration: 1000,
      ease: 'Linear',
      onUpdate: (tween, target) => {
        updateMask(target.height, true); // true = reveal from top
        
        // Start fish animation when waterfall is about 40% revealed
        if (target.height >= gridHeight * 0.4 && target.height < gridHeight * 0.45) {
          showFish();
        }
        
        // When the waterfall is about 85% down, start the splash animation
        if (target.height >= gridHeight * 0.85 && !splashSprites[0].visible) {
          // Play splash animation for all splash sprites
          splashSprites.forEach(splash => {
            splash.setVisible(true);
            splash.play('waterfall_splash_anim');
            
            // Add a slight random delay between each splash for a more natural effect
            scene.time.delayedCall(Math.random() * 100, () => {
              splash.play('waterfall_splash_anim');
            });
          });
          
          // Play splash sound if available
          if (scene.sounds.sfx_splash) {
            scene.sounds.sfx_splash.play();
          }
        }
      },
      onComplete: async () => {
        // Animate waterfall text down and out before updating grid
        await new Promise(resolve => {
          scene.tweens.add({
            targets: waterfallText,
            y: gridY + gridHeight + 50, // Just below the grid
            scale: 0.4,
            duration: 600,
            ease: 'Back.easeIn',
            onComplete: () => {
              waterfallText.destroy();
              resolve();
            }
          });
        });
        
        // Wait a moment before updating the grid
        await new Promise(r => scene.time.delayedCall(500, r));
        
        // Update the grid with the waterfall grid (instantly, no animation)
        for (let row = 0; row < scene.symbols.length; row++) {
          for (let col = 0; col < scene.symbols[row].length; col++) {
            const currentSymbol = scene.symbols[row][col];
            const newCell = waterfallGrid[row][col];
            
            // Skip wild symbols (they should remain unchanged)
            if (currentSymbol && 
                ((typeof currentSymbol === 'string' && currentSymbol === 'wild') || 
                (currentSymbol.texture && currentSymbol.texture.key === 'wild') ||
                // Also check for container with wild image inside (for multiplier wilds)
                (currentSymbol.list && Array.isArray(currentSymbol.list) && 
                currentSymbol.list.some(child => child.texture && child.texture.key === 'wild')))) {
              continue;
            }
            
            // Remove the current symbol
            if (currentSymbol) {
              if (currentSymbol.destroy) {
                currentSymbol.destroy();
              } else if (currentSymbol.list) {
                // If it's a container with children
                for (const child of currentSymbol.list) {
                  if (child.destroy) child.destroy();
                }
                currentSymbol.destroy();
              }
            }
            
            // Create the new symbol
            let newSymbol;
            if (newCell && typeof newCell === 'object' && newCell.type === 'orb') {
              const orbKey = `orb_${newCell.color}`;
              
              // Container to group orb and text
              newSymbol = scene.add.container(
                col * boxWidth + boxWidth / 2, 
                row * boxHeight + boxHeight / 2
              );
              
              const orb = scene.add.image(0, 0, orbKey);
              const scale = (scaleMap[orbKey] || 1) * Math.min(
                (boxWidth - 4) / orb.width, 
                (boxHeight - 4) / orb.height
              );
              orb.setScale(scale);
              orb.orbData = { color: newCell.color, value: newCell.value };
              
              // Format orb value as currency instead of multiplier
              const formattedValue = formatOrbValueAsCurrency(newCell.value);
              
              const txt = scene.add.text(0, + 40, formattedValue, {
                fontFamily: 'Arial',
                fontSize: '22px', // Slightly smaller to fit currency values
                fontStyle: 'bold',
                color: '#fff',
                stroke: '#000',
                strokeThickness: 4,
                align: 'center'
              }).setOrigin(0.5).setDepth(1);
              
              // Add background for the orb value
              const valueBackground = scene.add.image(0, + 40, 'orb_value_background').setScale(0.6);
              newSymbol.add([orb, valueBackground, txt]);
              orb.valueText = txt;
              newSymbol.valueText = txt;
              
              window.gridContainer.add(newSymbol);
            } else {
              newSymbol = scene.add.image(
                col * boxWidth + boxWidth / 2,
                row * boxHeight + boxHeight / 2,
                newCell
              );
              const scale = (scaleMap[newCell] || 1) * Math.min(
                (boxWidth - 4) / newSymbol.width, 
                (boxHeight - 4) / newSymbol.height
              );
              newSymbol.setScale(scale);
              window.gridContainer.add(newSymbol);
            }
            
            // Update the symbols array
            scene.symbols[row][col] = newSymbol;
          }
        }
        
        // Tween to hide the waterfall from top to bottom
        scene.tweens.add({
          targets: { height: gridHeight },
          height: 0,
          duration: 700,
          ease: 'Linear',
          onUpdate: (tween, target) => {
            updateMask(target.height, false); // false = hide from top
          },
          onComplete: () => {
            // Clean up the waterfall and splash animations
            waterfallSprite.stop();
            splashSprites.forEach(splash => {
              splash.stop();
            });
            mask.destroy();
            maskGraphics.destroy();
            waterfallContainer.destroy();
            splashContainer.destroy();
            fishContainer.destroy();
            
            // Text has already been removed, just resolve
            resolve();
          }
        });
      }
    });
  });
}

// Function to play random orbs animation during free spins
function playRandomOrbsAnimation(scene, randomOrbsGrid) {
  return new Promise(async (resolve) => {
    const centerX = scene.cameras.main.centerX;
    const centerY = scene.cameras.main.centerY;
    
    // Get boxWidth and boxHeight from the scene or use defaults if not available
    const boxWidth = window.boxWidth || 142; // Default width if not defined
    const boxHeight = window.boxHeight || 133; // Default height if not defined
    
    // Create bomb in the center of the screen, slightly higher
    const bomb = scene.add.image(centerX, centerY - 100, 'bomb')
      .setOrigin(0.5)
      .setDepth(51)
      .setScale(0.8);
    
    // Play bomb shake animation
    const shakeIntensity = 5;
    const shakeDuration = 100;
    const totalShakeDuration = 1000;
    let elapsedTime = 0;
    
    // Create a timer event for the bomb shaking
    const shakeTimer = scene.time.addEvent({
      delay: shakeDuration,
      callback: () => {
        // Shake the bomb by offsetting its position randomly
        const offsetX = (Math.random() * 2 - 1) * shakeIntensity;
        const offsetY = (Math.random() * 2 - 1) * shakeIntensity;
        
                 scene.tweens.add({
           targets: bomb,
           x: centerX + offsetX,
           y: (centerY - 100) + offsetY,
           duration: shakeDuration / 2,
           ease: 'Power1',
           yoyo: true
         });
        
        elapsedTime += shakeDuration;
        
        // When shaking is complete, play explosion animation
        if (elapsedTime >= totalShakeDuration) {
          shakeTimer.remove();
          
          // Play explosion sound
          if (scene.sounds.sfx_symbolsExplode) {
            scene.sounds.sfx_symbolsExplode.play();
          }
          
                     // Create explosion animation sequence
           const explosion1 = scene.add.image(centerX, centerY - 100, 'bomb_explosion_1')
             .setOrigin(0.5)
             .setDepth(52)
             .setScale(0)
             .setAlpha(0);
           
           const explosion2 = scene.add.image(centerX, centerY - 100, 'bomb_explosion_2')
             .setOrigin(0.5)
             .setDepth(52)
             .setScale(0)
             .setAlpha(0);
           
           const explosion3 = scene.add.image(centerX, centerY - 100, 'bomb_explosion_3')
             .setOrigin(0.5)
             .setDepth(52)
             .setScale(0)
             .setAlpha(0);
          
          // Hide the bomb
          bomb.setAlpha(0);
          
          // First explosion frame
          scene.tweens.add({
            targets: explosion1,
            scale: 1.2,
            alpha: 1,
            duration: 200,
            ease: 'Power1',
            onComplete: () => {
              // Second explosion frame
              explosion1.setAlpha(0);
              scene.tweens.add({
                targets: explosion2,
                scale: 1.5,
                alpha: 1,
                duration: 200,
                ease: 'Power1',
                onComplete: () => {
                  // Third explosion frame
                  explosion2.setAlpha(0);
                  scene.tweens.add({
                    targets: explosion3,
                    scale: 1.8,
                    alpha: 1,
                    duration: 300,
                    ease: 'Power1',
                    onComplete: () => {
                      // Fade out the explosion
                      scene.tweens.add({
                        targets: explosion3,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                          // Clean up
                          bomb.destroy();
                          explosion1.destroy();
                          explosion2.destroy();
                          explosion3.destroy();
                          
                          // Update the grid with the random orbs
                          updateGridWithRandomOrbs();
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      },
      callbackScope: scene,
      loop: true
    });
    
    // Function to update the grid with random orbs
    const updateGridWithRandomOrbs = () => {
      // Update the grid with the random orbs grid (instantly, no animation)
      for (let row = 0; row < scene.symbols.length; row++) {
        for (let col = 0; col < scene.symbols[row].length; col++) {
          const currentSymbol = scene.symbols[row][col];
          const newCell = randomOrbsGrid[row][col];
          
          // Skip if the cell hasn't changed
          if ((typeof currentSymbol === 'string' && currentSymbol === newCell) ||
              (currentSymbol.texture && currentSymbol.texture.key === newCell) ||
              // Also preserve wild symbols with multipliers
              (currentSymbol.list && Array.isArray(currentSymbol.list) && 
               currentSymbol.list.some(child => child.texture && child.texture.key === 'wild') && 
               newCell === 'wild')) {
            continue;
          }
          
          // Remove the current symbol
          if (currentSymbol) {
            if (currentSymbol.destroy) {
              currentSymbol.destroy();
            } else if (currentSymbol.list) {
              // If it's a container with children
              for (const child of currentSymbol.list) {
                if (child.destroy) child.destroy();
              }
              currentSymbol.destroy();
            }
          }
          
          // Create the new symbol
          let newSymbol;
          if (newCell && typeof newCell === 'object' && newCell.type === 'orb') {
            const orbKey = `orb_${newCell.color}`;
            
            // Container to group orb and text
            newSymbol = scene.add.container(
              col * boxWidth + boxWidth / 2, 
              row * boxHeight + boxHeight / 2
            );
            
            const orb = scene.add.image(0, 0, orbKey);
            const scale = (scaleMap[orbKey] || 1) * Math.min(
              (boxWidth - 4) / orb.width, 
              (boxHeight - 4) / orb.height
            );
            orb.setScale(scale);
            orb.orbData = { color: newCell.color, value: newCell.value };
            
            // Format orb value as currency instead of multiplier
            const formattedValue = formatOrbValueAsCurrency(newCell.value);
            
            const txt = scene.add.text(0, + 40, formattedValue, {
              fontFamily: 'Arial',
              fontSize: '22px', // Slightly smaller to fit currency values
              fontStyle: 'bold',
              color: '#fff',
              stroke: '#000',
              strokeThickness: 4,
              align: 'center'
            }).setOrigin(0.5).setDepth(1);
            
            // Add background for the orb value
            const valueBackground = scene.add.image(0, + 40, 'orb_value_background').setScale(0.6);
            newSymbol.add([orb, valueBackground, txt]);
            orb.valueText = txt;
            newSymbol.valueText = txt;
            
            window.gridContainer.add(newSymbol);
          } else {
            newSymbol = scene.add.image(
              col * boxWidth + boxWidth / 2,
              row * boxHeight + boxHeight / 2,
              newCell
            );
            const scale = (scaleMap[newCell] || 1) * Math.min(
              (boxWidth - 4) / newSymbol.width, 
              (boxHeight - 4) / newSymbol.height
            );
            newSymbol.setScale(scale);
            window.gridContainer.add(newSymbol);
          }
          
          // Update the symbols array
          scene.symbols[row][col] = newSymbol;
        }
      }
      
      // Resolve the promise after grid update
      resolve();
    };
  });
}

// Function to format orb value as currency
function formatOrbValueAsCurrency(value) {
  const orbWinAmount = betAmount * value;
  
  if (selectedCurrency === 'USD') {
    // Format as USD with dollar sign and 2 decimal places
    return `$${orbWinAmount.toFixed(2)}`;
  } else {
    // Format as LBP with pound sign and no decimal places, with commas for thousands
    return `£${Math.round(orbWinAmount).toLocaleString('en-US')}`;
  }
}

// Function to play hook animation during free spins
function playHookAnimation(scene, hookGrid, hookColumn) {
  return new Promise(async (resolve) => {
    // Get boxWidth and boxHeight from the scene or use defaults if not available
    const boxWidth = window.boxWidth || 142; // Default width if not defined
    const boxHeight = window.boxHeight || 133; // Default height if not defined
    
    // Create hook and rope at the top of the column
    const hookX = hookColumn * boxWidth + boxWidth / 2;
    const startY = -50; // Start position above the grid
    
         // Create the hook and rope images
    const hook = scene.add.image(hookX, startY, 'hook');
    hook.setScale(0.8);
    hook.setDepth(100);
    
    const rope = scene.add.image(hookX + 40, startY - 20, 'hook_rope'); // Adjusted Y position to align with hook
    rope.setScale(0.8);
    rope.setOrigin(0.5, 1); // Origin at bottom center
    rope.setDepth(99);
    
    // Store the current symbols in the column
    const oldSymbols = [];
    for (let row = 0; row < scene.symbols.length; row++) {
      oldSymbols.push(scene.symbols[row][hookColumn]);
    }
    
    // Create new symbols for the hook grid - position them directly below the old symbols
    const newSymbols = [];
    for (let row = 0; row < scene.symbols.length; row++) {
      // Create a symbol based on the new grid data
      const newCell = hookGrid[row][hookColumn];
      
      // Position it directly below the current grid (for continuous animation)
      const newSymbol = scene.add.image(
        hookColumn * boxWidth + boxWidth / 2,
        (row + scene.symbols.length) * boxHeight + boxHeight / 2,
        newCell
      );
      
      const scale = (scaleMap[newCell] || 1) * Math.min(
        (boxWidth - 4) / newSymbol.width, 
        (boxHeight - 4) / newSymbol.height
      );
      
      newSymbol.setScale(scale);
      window.gridContainer.add(newSymbol);
      newSymbols.push(newSymbol);
    }
    
    // Calculate bottom position of the grid - ensure it goes all the way to the bottom
    const gridBottom = scene.symbols.length * boxHeight;
    const bottomY = gridBottom + boxHeight * 2.4; // Go significantly beyond the grid bottom
    
    // First animation: Hook moving down
    scene.tweens.add({
      targets: hook,
      y: bottomY,
      duration: 1500, // Slower descent
      ease: 'Cubic.easeIn',
      onUpdate: function() {
        // Update rope position/length
        rope.y = hook.y - 20; // Position rope at hook's top edge
        rope.x = hookX + 40; // Maintain the offset
        rope.scaleY = (hook.y - startY) / 20; // Adjust scaling based on new start position
      },
      onComplete: function() {
        // Play catch sound if available
        if (scene.sounds.sfx_hookCatch) {
          scene.sounds.sfx_hookCatch.play();
        }
        
        // Play spinning sound
        if (scene.sounds.sfx_reelSpin) {
          scene.sounds.sfx_reelSpin.play();
        }
        
        // Start the symbol animations
        runSymbolAnimations();
        
                 // Second animation: Hook moving back up with symbols
         scene.tweens.add({
           targets: hook,
           y: startY,
           duration: 3000, // Slower upward movement
           ease: 'Cubic.easeOut',
          onUpdate: function() {
            // Update rope position/length
            rope.y = hook.y - 20; // Position rope at hook's top edge
            rope.x = hookX + 40; // Maintain the offset
            rope.scaleY = (hook.y - startY) / 20; // Adjust scaling based on new start position
          },
          onComplete: function() {
            // Fade out hook and rope
            scene.tweens.add({
              targets: [hook, rope],
              alpha: 0,
              duration: 300,
              onComplete: function() {
                hook.destroy();
                rope.destroy();
              }
            });
          }
        });
      }
    });
    
    // Function to run the symbol animations
    function runSymbolAnimations() {
      // Track when both animations are complete
      let animationsCompleted = 0;
      const totalAnimations = 2;
      
      const checkCompletion = () => {
        animationsCompleted++;
        if (animationsCompleted >= totalAnimations) {
          // Remove the old symbols that have moved out
          for (let i = 0; i < oldSymbols.length; i++) {
            const symbol = oldSymbols[i];
            if (symbol) {
              if (symbol.destroy) {
                symbol.destroy();
              } else if (symbol.list) {
                // If it's a container with children
                for (const child of symbol.list) {
                  if (child.destroy) child.destroy();
                }
                symbol.destroy();
              }
            }
          }
          
          // Update the symbols array with the new symbols
          for (let row = 0; row < scene.symbols.length; row++) {
            scene.symbols[row][hookColumn] = newSymbols[row];
          }
          
          // Play landing sound if available
          if (scene.sounds.sfx_reelStop) {
            scene.sounds.sfx_reelStop.play();
          }
          
          // Resolve the promise when animation is complete
          resolve();
        }
      };
      
      // Animate the old symbols moving up
      scene.tweens.add({
        targets: oldSymbols,
        y: `-=${scene.symbols.length * boxHeight}`,
        duration: 800, // Match hook's upward movement speed
        ease: 'Cubic.easeIn',
        onComplete: checkCompletion
      });
      
      // Animate the new symbols moving up at the same time
      scene.tweens.add({
        targets: newSymbols,
        y: `-=${scene.symbols.length * boxHeight}`,
        duration: 800, // Match hook's upward movement speed
        ease: 'Cubic.easeIn',
        onComplete: checkCompletion
      });
    }
  });
}

// Add a utility function to clean up tweens
function cleanupTweens(scene, targets) {
  if (!scene || !scene.tweens) return;
  
  // If targets is an array, clean up tweens for each target
  if (Array.isArray(targets)) {
    targets.forEach(target => {
      const tweens = scene.tweens.getTweensOf(target);
      tweens.forEach(tween => {
        if (tween && tween.isPlaying) {
          tween.stop();
          scene.tweens.remove(tween);
        }
      });
    });
  } 
  // If targets is a single object, clean up its tweens
  else if (targets) {
    const tweens = scene.tweens.getTweensOf(targets);
    tweens.forEach(tween => {
      if (tween && tween.isPlaying) {
        tween.stop();
        scene.tweens.remove(tween);
      }
    });
  }
}

// Function to animate orb values flying to wild symbols
function animateOrbsToWilds(scene) {
  return new Promise(async (resolve) => {
    // Find all orbs and wilds in the grid
    const orbs = [];
    const wilds = [];
    const boxWidth = window.boxWidth || 142;
    const boxHeight = window.boxHeight || 133;
    
    // First, collect all orbs and wilds with their exact positions
    for (let row = 0; row < scene.symbols.length; row++) {
      for (let col = 0; col < scene.symbols[row].length; col++) {
        const symbol = scene.symbols[row][col];
        
        // Skip if no symbol
        if (!symbol) continue;
        
        // Calculate grid position (fallback)
        const gridX = col * boxWidth + boxWidth / 2;
        const gridY = row * boxHeight + boxHeight / 2;
        
        // Check if it's an orb (container with valueText)
        if (symbol.list && Array.isArray(symbol.list) && symbol.valueText) {
          // Find the orb image within the container
          const orbImage = symbol.list.find(child => 
            child.texture && child.texture.key && child.texture.key.startsWith('orb_')
          );
          
          if (orbImage && orbImage.orbData) {
            // Get exact position of the orb
            let orbX, orbY;
            
            // If the orb is in a container, get the world position
            orbX = gridX;
            orbY = gridY;
            
            orbs.push({
              symbol: symbol,
              position: { row, col, x: orbX, y: orbY },
              value: orbImage.orbData.value || 0
            });
            
            console.log(`Found orb at (${row},${col}) with value ${orbImage.orbData.value}, position: (${orbX}, ${orbY})`);
          }
        }
        
        // Check if it's a wild (either direct or in container)
        if ((symbol.texture && symbol.texture.key === 'wild') || 
            (symbol.list && Array.isArray(symbol.list) && 
             symbol.list.some(child => child.texture && child.texture.key === 'wild'))) {
          
          // Get exact position of the wild
          let wildX, wildY;
          
          // Use grid position for consistency
          wildX = gridX;
          wildY = gridY;
          
          wilds.push({
            symbol: symbol,
            position: { row, col, x: wildX, y: wildY }
          });
          
          console.log(`Found wild at (${row},${col}), position: (${wildX}, ${wildY})`);
        }
      }
    }
    
    // If we have both orbs and wilds, animate orb values flying to wilds
    if (orbs.length > 0 && wilds.length > 0) {
      console.log(`Found ${orbs.length} orbs and ${wilds.length} wilds for animation`);
      
      // Play orb flying sound if available
      if (scene.sounds.sfx_orbFlying) {
        scene.sounds.sfx_orbFlying.play();
      }
      
      // Create a map to track running totals for each wild
      const wildTotals = new Map();
      wilds.forEach((wild, index) => {
        wildTotals.set(index, {
          total: 0,
          textObj: null,
          valueContainer: null
        });
      });
      
      // Process each wild sequentially
      for (let wildIndex = 0; wildIndex < wilds.length; wildIndex++) {
        const wild = wilds[wildIndex];
        
        // Get the wild position
        const wildX = wild.position.x;
        const wildY = wild.position.y;
        
        // Create a value container for this wild that will show the running total
        const wildData = wildTotals.get(wildIndex);
        wildData.valueContainer = scene.add.container(wildX, wildY);
        // Reduce the scale of the background (was 0.8)
        const valueBackground = scene.add.image(0, 0, 'orb_value_background').setScale(0.6);

        // Reduce the font size of the text (was 24px)
        wildData.textObj = scene.add.text(0, 0, "0", {
          fontFamily: 'Arial',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 4,
          align: 'center'
        }).setOrigin(0.5).setDepth(1);

        // Position the text and background within the container
        // You can adjust the Y position here - positive values move it down
        valueBackground.y = 50; // Move background down
        wildData.textObj.y = 50; // Move text down to match background

        wildData.valueContainer.add([valueBackground, wildData.textObj]);
        wildData.valueContainer.setVisible(false); // Hide initially
        window.gridContainer.add(wildData.valueContainer);
        
        // Process all orbs for this wild one by one
        for (let i = 0; i < orbs.length; i++) {
          const orb = orbs[i];
          
          // Wait for previous animation to complete if not the first orb
          if (i > 0) {
            await new Promise(r => scene.time.delayedCall(300, r));
          }
          
          // Create a copy of the orb value display at the orb's position
          const valueContainer = scene.add.container(orb.position.x, orb.position.y);
          const orbValueBackground = scene.add.image(0, 0, 'orb_value_background').setScale(0.6);
          
          // Get the formatted value from the orb
          const orbValue = orb.value;
          const formattedValue = formatOrbValueAsCurrency(orbValue);
          
          const valueText = scene.add.text(0, 0, formattedValue, {
            fontFamily: 'Arial',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
          }).setOrigin(0.5).setDepth(1);
          
          valueContainer.add([orbValueBackground, valueText]);
          window.gridContainer.add(valueContainer);
          
          console.log(`Flying orb value from (${orb.position.x}, ${orb.position.y}) to wild at (${wildX}, ${wildY})`);
          
          // Animate the value flying to the wild
          await new Promise(resolveAnim => {
            scene.tweens.add({
              targets: valueContainer,
              x: wildX,
              y: wildY + 50, // Match the position adjustment we made (50px below center)
              scale: 1.2,
              duration: 500,
              ease: 'Cubic.easeOut',
              onComplete: () => {
                // Flash the wild symbol
                const targetForFlash = wild.symbol.list && wild.symbol.list[0] ? wild.symbol.list[0] : wild.symbol;
                const originalScale = targetForFlash.scale;
                
                scene.tweens.add({
                  targets: targetForFlash,
                  scale: originalScale * 1.2,
                  duration: 100,
                  yoyo: true,
                  repeat: 1
                });
                
                // Remove the flying value
                valueContainer.destroy();
                
                // Update running total for this wild
                wildData.total += orbValue;
                
                // Format the running total
                const formattedTotal = formatOrbValueAsCurrency(wildData.total);
                
                // Update the text on the wild
                wildData.textObj.setText(formattedTotal);
                
                // Make the value container visible if it's the first orb
                if (!wildData.valueContainer.visible) {
                  wildData.valueContainer.setVisible(true);
                }
                
                // Scale animation for the value container
                scene.tweens.add({
                  targets: wildData.valueContainer,
                  scale: 1.3,
                  duration: 200,
                  yoyo: true,
                  ease: 'Sine.easeOut'
                });
                
                resolveAnim();
              }
            });
          });
        }
        
        // After all orbs have flown to this wild, animate multiplier if applicable
        const multiplier = scene.wildMultiplier || 1;
        if (multiplier >= 2 && wildData.total > 0) {
          // Wait a moment before showing multiplier animation
          await new Promise(r => scene.time.delayedCall(500, r));
          
          // Determine which multiplier image to use based on the value
          let multiplierKey;
          if (multiplier <= 2) multiplierKey = 'wild_multiplier_x2';
          else if (multiplier <= 3) multiplierKey = 'wild_multiplier_x3';
          else if (multiplier <= 10) multiplierKey = 'wild_multiplier_x4';
          else if (multiplier <= 20) multiplierKey = 'wild_multiplier_x5';
          else if (multiplier <= 30) multiplierKey = 'wild_multiplier_x6';
          else if (multiplier <= 40) multiplierKey = 'wild_multiplier_x7';
          else multiplierKey = 'wild_multiplier_x8';
          
          // Create multiplier image at the top of the wild
          const multiplierImg = scene.add.image(wildX - 30, wildY - 30, multiplierKey).setScale(0.9);
          window.gridContainer.add(multiplierImg);
          
          // Play multiplier flying sound if available
          if (scene.sounds.sfx_multiplierFlying) {
            scene.sounds.sfx_multiplierFlying.play();
          }
          
          // Store the current value before multiplication
          const originalValue = wildData.total;
          
          // Animate multiplier flying to the value display
          await new Promise(resolveAnim => {
            scene.tweens.add({
              targets: multiplierImg,
              x: wildX,
              y: wildY + 50, // Same position as the value display
              scale: 0.9,
              duration: 600,
              ease: 'Cubic.easeOut',
              onComplete: () => {
                // Remove the multiplier image immediately
                multiplierImg.destroy();
                
                // Calculate the multiplied value
                const multipliedValue = originalValue * multiplier;
                const formattedMultiplied = formatOrbValueAsCurrency(multipliedValue);

                  // Update the text with multiplied value
                  wildData.textObj.setText(formattedMultiplied);
                    
                
                // Flash the value display
                scene.tweens.add({
                  targets: wildData.valueContainer,
                  scale: 1.2,
                  duration: 200,
                  yoyo: true,
                  repeat: 1,
                  onComplete: () => {
                  
                    // Update the stored total to the multiplied value
                    wildData.total = multipliedValue;
                    
                    // Play win sound
                    if (scene.sounds.sfx_symbolsMatch) {
                      scene.sounds.sfx_symbolsMatch.play();
                    }
                    
                    resolveAnim();
                  }
                });
              }
            });
          });
        }
        
        // Wait a moment before moving to the next wild
        if (wildIndex < wilds.length - 1) {
          await new Promise(r => scene.time.delayedCall(500, r));
        }
      }
      
      // After all orbs have been processed for all wilds, clean up
      // Calculate total win from all wilds (for sound effects)
      let totalWinAmount = 0;
      
      wildTotals.forEach((data, wildIndex) => {
        const multiplier = scene.wildMultiplier || 1;
        totalWinAmount += betAmount * data.total * multiplier;
      });
      
      // Only play sound if there's a win
      if (totalWinAmount > 0) {
        // Play win sound
        if (scene.sounds.sfx_symbolsMatch) {
          scene.sounds.sfx_symbolsMatch.play();
        }
        
        // Wait a moment before cleaning up
        await new Promise(resolveDelay => scene.time.delayedCall(1000, resolveDelay));
        
        // Add a brief delay to allow players to see the final values
        await new Promise(resolveExtraDelay => scene.time.delayedCall(1500, resolveExtraDelay));
        
        // Fade out all the value containers on wilds
        const containers = [];
        wildTotals.forEach(data => {
          if (data.valueContainer) containers.push(data.valueContainer);
        });
        
        // Clean up any running tweens for the containers
        cleanupTweens(scene, containers);
        
        if (containers.length > 0) {
          await new Promise(resolveFade => {
            scene.tweens.add({
              targets: containers,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                containers.forEach(container => {
                  // Properly destroy all children in the container
                  if (container.list && container.list.length > 0) {
                    // Make a copy of the list to avoid modification during iteration
                    const children = [...container.list];
                    for (const child of children) {
                      if (child) {
                        container.remove(child);
                        child.destroy();
                      }
                    }
                  }
                  // Then destroy the container itself
                  container.destroy();
                });
                resolveFade();
              }
            });
          });
        }
      } else {
        // Even if there's no win, make sure to clean up the value containers
        wildTotals.forEach(data => {
          if (data.valueContainer) {
            // Properly destroy all children in the container
            if (data.valueContainer.list && data.valueContainer.list.length > 0) {
              // Make a copy of the list to avoid modification during iteration
              const children = [...data.valueContainer.list];
              for (const child of children) {
                if (child) {
                  data.valueContainer.remove(child);
                  child.destroy();
                }
              }
            }
            // Then destroy the container itself
            data.valueContainer.destroy();
          }
        });
      }
    }
    
    resolve();
  });
}

// Function to animate particles from wilds to the wild stats bar with a sweeping trail effect
function animateWildsToStatsBar(scene, wildsCollected) {
  return new Promise(async (resolve) => {
    // Check if the wild stats bar exists
    if (!scene.wildStatsBar) {
      resolve();
      return;
    }
    
    // Check if we've reached the maximum multiplier (x50)
    const maxMultiplierReached = Math.floor(wildsCollected / 4) >= 7;
    
    // Skip animation if we've reached max multiplier
    if (maxMultiplierReached) {
      // Just update the stats bar without animation
      if (scene.wildStatsBar && scene.wildStatsBar.updateWildStats) {
        scene.wildStatsBar.updateWildStats(wildsCollected);
      }
      resolve();
      return;
    }
    
    // Find all wild symbols in the current grid
    const wildSymbols = [];
    
    // Get the box dimensions for positioning
    const boxWidth = window.boxWidth || 142;
    const boxHeight = window.boxHeight || 133;
    
    // Calculate the grid container position
    const gridContainerX = window.gridContainer ? window.gridContainer.x : 0;
    const gridContainerY = window.gridContainer ? window.gridContainer.y : 0;
    
    // Search for wilds in the symbols array
    if (scene.symbols && Array.isArray(scene.symbols)) {
      for (let row = 0; row < scene.symbols.length; row++) {
        for (let col = 0; col < scene.symbols[row].length; col++) {
          const symbol = scene.symbols[row][col];
          if (symbol) {
            // Check if it's a wild symbol (either directly or as a container with wild)
            if ((symbol.texture && symbol.texture.key === 'wild') || 
                (symbol.list && Array.isArray(symbol.list) && 
                 symbol.list.some(child => child.texture && child.texture.key === 'wild'))) {
              
              // Calculate the actual position of the symbol on screen
              const symbolX = gridContainerX + (col * boxWidth + boxWidth / 2);
              const symbolY = gridContainerY + (row * boxHeight + boxHeight / 2);
              
              wildSymbols.push({
                symbol: symbol,
                x: symbolX,
                y: symbolY
              });
            }
          }
        }
      }
    }
    
    // If no wild symbols found, resolve immediately
    if (wildSymbols.length === 0) {
      resolve();
      return;
    }
    
    // Track how many wilds we've processed so far to update the stats bar incrementally
    let processedWilds = 0;
    
    // Process each wild symbol one by one
    for (let i = 0; i < wildSymbols.length; i++) {
      const wild = wildSymbols[i];
      
      // Calculate which fisher wild icon to target based on current collection plus processed wilds
      const currentWildCount = (wildsCollected - wildSymbols.length) + processedWilds + 1;
      const currentSetWilds = currentWildCount % 4;
      
      // Get the target fisher wild icon (the next one to be filled)
      let targetIcon = null;
      if (scene.wildStatsBar && scene.wildStatsBar.fisherWildIcons) {
        // Find the target icon - the next one to be filled
        const targetIconIndex = Math.min(currentSetWilds, scene.wildStatsBar.fisherWildIcons.length - 1);
        targetIcon = scene.wildStatsBar.fisherWildIcons[targetIconIndex];
      }
      
      // If we can't find a target icon, use the center of the stats bar as fallback
      let targetX = scene.wildStatsBar.x;
      let targetY = scene.wildStatsBar.y;
      
      // If we found a target icon, use its world position
      if (targetIcon) {
        // Get the world position by calculating it from the container hierarchy
        targetX = scene.wildStatsBar.x + targetIcon.x;
        targetY = scene.wildStatsBar.y + targetIcon.y;
      }
      
      // Create a sweeping trail effect using multiple particles
      await createSweepingTrail(scene, wild.x, wild.y, targetX, targetY);
      
      // Increment the processed wilds counter
      processedWilds++;
      
      // Update the wild stats bar after each animation
      if (scene.wildStatsBar && scene.wildStatsBar.updateWildStats) {
        // Calculate the current total for this update
        const currentTotal = (wildsCollected - wildSymbols.length) + processedWilds;
        scene.wildStatsBar.updateWildStats(currentTotal);
      }
      
      // Add a small delay between each wild's animation
      if (i < wildSymbols.length - 1) {
        await new Promise(delayResolve => scene.time.delayedCall(200, delayResolve));
      }
    }
    
    // No final flash effect needed
    
    resolve();
  });
}

// Helper function to create a sweeping trail effect
function createSweepingTrail(scene, startX, startY, endX, endY) {
  return new Promise(resolve => {
    // Play sound effect if available
    if (scene.sounds && scene.sounds.sfx_orbFlying) {
      scene.sounds.sfx_orbFlying.play({ volume: 0.6 });
    }
    
    // Create a visible particle
    const follower = scene.add.image(startX, startY, 'colors_particle')
      .setScale(0.7)
      .setDepth(151)
      .setBlendMode(Phaser.BlendModes.NORMAL);
    
    // Create an array to store trail particles
    const trailParticles = [];
    
    // Create a timer event to emit trail particles
    const trailTimer = scene.time.addEvent({
      delay: 20, // Emit more frequently for a denser trail
      callback: () => {
        // Create a trail particle at the follower's current position
        const particle = scene.add.image(follower.x, follower.y, 'colors_particle')
          .setScale(follower.scale) // Match the follower's current scale
          .setAlpha(1)
          .setDepth(150)
          .setBlendMode(Phaser.BlendModes.NORMAL);
        
        // Add the particle to our array for tracking
        trailParticles.push(particle);
        
        // Fade out the particle without changing its size
        scene.tweens.add({
          targets: particle,
          alpha: 0,
          duration: 200, // Faster fade out
          onComplete: () => {
            // Remove from array and destroy
            const index = trailParticles.indexOf(particle);
            if (index > -1) {
              trailParticles.splice(index, 1);
            }
            particle.destroy();
          }
        });
      },
      loop: true
    });
    
    // Use a direct tween for movement and scaling
    scene.tweens.add({
      targets: follower,
      x: endX,
      y: endY,
      scale: 0.3, // Scale down to half size
      duration: 700,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Play a sound when reaching the target
        if (scene.sounds && scene.sounds.sfx_symbolsMatch) {
          scene.sounds.sfx_symbolsMatch.play({ volume: 0.3 });
        }
        
        // Stop the trail timer
        trailTimer.remove();
        
        // Destroy the follower
        follower.destroy();
        
        // Fade out any remaining trail particles
        scene.tweens.add({
          targets: trailParticles,
          alpha: 0,
          duration: 100, // Faster fade out
          onComplete: () => {
            // Destroy all remaining particles
            trailParticles.forEach(p => p.destroy());
            trailParticles.length = 0;
            
            // Resolve the promise
            resolve();
          }
        });
      }
    });
  });
}

function createBubbleSeparators(scene, gameContainer, centerX, centerY, gridWidth, gridHeight, gridYOffset, cols) {
  const bubbleContainer = scene.add.container(centerX - gridWidth / 2, centerY - gridHeight / 2 + gridYOffset);
  gameContainer.add(bubbleContainer);

  // Create a mask for the bubbles container
  const bubbleMaskGraphics = scene.make.graphics();
  bubbleMaskGraphics.fillStyle(0xffffff);
  bubbleMaskGraphics.fillRect(
    centerX - gridWidth / 2,
    centerY - gridHeight / 2 + gridYOffset - 10,
    gridWidth,
    gridHeight + 20
  );
  const bubbleMask = bubbleMaskGraphics.createGeometryMask();
  bubbleContainer.setMask(bubbleMask);

  // Helper to create a vertical line of bubbles
  const createBubbleLine = (x) => {
    const lineContainer = scene.add.container(x, 0);

    const topSet = scene.add.container(0, 0);
    const bottomSet = scene.add.container(0, gridHeight);

    const numBubbles = Math.ceil(gridHeight / 40);
    const bubbleData = [];

    for (let i = 0; i < numBubbles; i++) {
      bubbleData.push({
        xOffset: Math.random() * 10 - 5,
        y: i * 40 + Math.random() * 10,
        scale: 0.8 + Math.random() * 0.3,
        flipX: Math.random() > 0.5,
      });
    }

    const populateFromData = (container) => {
      for (const data of bubbleData) {
        const bubble = scene.add.image(data.xOffset, data.y, 'bubbles');
        bubble.setScale(data.scale);
        bubble.flipX = data.flipX;
        container.add(bubble);
      }
    };

    populateFromData(topSet);
    populateFromData(bottomSet);

    lineContainer.add([topSet, bottomSet]);
    return { container: lineContainer };
  };

  // Create and store bubble lines
  const bubbleLines = [];

  bubbleLines.push(createBubbleLine(0));
  const colWidth = gridWidth / cols;
  for (let i = 1; i < cols; i++) {
    bubbleLines.push(createBubbleLine(i * colWidth));
  }
  bubbleLines.push(createBubbleLine(gridWidth));

  bubbleLines.forEach(line => {
    bubbleContainer.add(line.container);
  });

  // Store tweens for cleanup
  const bubbleTweens = [];

  // Animate the lines
  const duration = 60000;
  bubbleLines.forEach(line => {
    const tween = scene.tweens.add({
      targets: line.container,
      y: -gridHeight,
      duration,
      ease: 'Linear',
      repeat: -1,
      onRepeat: () => {
        line.container.y = 0;
      }
    });
    bubbleTweens.push(tween);
  });

  // Add cleanup method to the container
  bubbleContainer.cleanup = () => {
    // Stop and remove all tweens
    bubbleTweens.forEach(tween => {
      if (tween && tween.isPlaying) {
        tween.stop();
        scene.tweens.remove(tween);
      }
    });

    // Destroy all bubble lines and their contents
    bubbleLines.forEach(line => {
      if (line.container) {
        if (line.container.list && line.container.list.length > 0) {
          const children = [...line.container.list];
          for (const child of children) {
            if (child) {
              // If the child is a container itself, destroy its children first
              if (child.list && child.list.length > 0) {
                const grandchildren = [...child.list];
                for (const grandchild of grandchildren) {
                  if (grandchild) {
                    child.remove(grandchild);
                    grandchild.destroy();
                  }
                }
              }
              line.container.remove(child);
              child.destroy();
            }
          }
        }
        bubbleContainer.remove(line.container);
        line.container.destroy();
      }
    });

    // Destroy the mask
    if (bubbleMask) {
      bubbleMask.destroy();
    }
    if (bubbleMaskGraphics) {
      bubbleMaskGraphics.destroy();
    }
  };

  return bubbleContainer;
}



// ... existing code ...

// Function to show congratulations popup for free spins
function showCongratulationsPopup(freeSpinsWon) {
  console.log('Congratulations! You won', freeSpinsWon, 'free spins!');
  
  // Create a congratulations popup
  const scene = this;
  const centerX = 720 / 2;
  const centerY = 1280 / 2;
  
  // Get the stats container if it exists
  const existingStatsContainer = scene.children.list.find(child => 
    child.type === 'Container' && 
    child.freeSpinsIcons && 
    child.fixedFishIcons && 
    child.fisherWildIcons);

  // Hide UI Buttons
  scene.buyFreeSpinsContainer.setVisible(false);
  scene.buyFreeSpinsPriceContainer.setVisible(false)
  scene.anteBorder.setVisible(false);
  scene.anteToggleContainer.setVisible(false);
  scene.anteBetSpriteContainer.setVisible(false);
  scene.spinButton.setVisible(false);
  scene.cashButton.setVisible(false);
  
  // Create a container for the popup
  const popupContainer = scene.add.container(0, 0).setDepth(40);
  
  // Add semi-transparent background overlay
  const bgOverlay = scene.add.rectangle(centerX, centerY, 720, 1280, 0x000000, 0.7)
    .setInteractive();
  popupContainer.add(bgOverlay);
  
  // Add the congratulations popup background image
  const popupBg = scene.add.image(centerX, centerY - 100, 'congrats_popup_background')
    .setInteractive()
    .setScale(0.5);
  popupContainer.add(popupBg);
  
// Value
const freeSpinsValue = `${freeSpinsWon}`;
const fsX = centerX - 180;
const fsY = centerY - 175;

// Shadow layer (black, soft, offset)
const fsShadow = scene.add.text(fsX + 4, fsY + 4, freeSpinsValue, {
  fontFamily: 'Arial',
  fontSize: '72px',
  fontWeight: 'bold',
  color: '#000000',
  stroke: '#000000',
  strokeThickness: 8,
  align: 'center'
}).setOrigin(0.5).setAlpha(0.5);

// Middle stroke layer (dark brown)
const fsMiddle = scene.add.text(fsX, fsY, freeSpinsValue, {
  fontFamily: 'Arial',
  fontSize: '72px',
  fontWeight: 'bold',
  color: '#473321',
  stroke: '#473321',
  strokeThickness: 8,
  align: 'center'
}).setOrigin(0.5);

// Top layer (light fill + thin stroke)
const fsTop = scene.add.text(fsX, fsY, freeSpinsValue, {
  fontFamily: 'Arial',
  fontSize: '72px',
  fontWeight: 'bold',
  color: '#f8eecf', // slightly different from multiplier, but matches your existing code
  stroke: '#f9f0d1',
  strokeThickness: 5,
  align: 'center'
}).setOrigin(0.5);

// Add to container in order
popupContainer.add(fsShadow);
popupContainer.add(fsMiddle);
popupContainer.add(fsTop);

  
  // Add stats icons below the popup background
  const popupHeight = popupBg.displayHeight;
  const popupWidth = popupBg.displayWidth;
  
  // Position stats container inside the popup background, near the bottom
  const statsY = centerY - 80 + (popupHeight / 4); // Position inside the popup, near bottom
  
  // Create a container for stats icons
  const statsContainer = scene.add.container(centerX, statsY);
  popupContainer.add(statsContainer);
  
  // Define icon properties - smaller icons with appropriate spacing
  const iconSize = 14;
  const iconSpacing = 12;
  const rowSpacing = 55;
  const scale = 0.25; // Smaller scale for all icons
  
  // Get features from pendingFreeSpinsData if available
  const features = scene.pendingFreeSpinsData?.features || {};
  const fixedFishCount = features.fixedFishCount || 0;
  const fisherWildCount = features.fisherWildCount || 0;
  const hasRemoveLowestFish = features.removeLowestFish || false;
  const additionalFreeSpins = features.additionalFreeSpins || 0;
  
  // Row 1: 3 fixed fish - positioned wider
  const fixedFishRow = scene.add.container(0, -rowSpacing);
  for (let i = 0; i < 3; i++) {
    const isActive = i < fixedFishCount;
    const fixedFish = scene.add.image(
      (i - 1) * (iconSize + iconSpacing) * 2, 
      0, 
      isActive ? 'fixed_fish' : 'stats_fixed_fish_off'
    ).setScale(scale);
    fixedFishRow.add(fixedFish);
  }
  statsContainer.add(fixedFishRow);
  
  // Row 2: 3 free spins icons, lowest fish, 3 fisherman wild - all in one row with consistent spacing
  const secondRow = scene.add.container(0, 0);
  
  // Calculate a consistent spacing for all icons in the second row
  const totalIcons = 7; // 3 free spins + 1 lowest fish + 3 fisherman wild
  const totalWidth = popupWidth * 0.6; // Reduced from 0.8 to 0.6 for tighter spacing
  const consistentSpacing = totalWidth / (totalIcons - 1);
  
  // Starting X position (left-most position)
  const startX = -(totalWidth / 2);
  
  // 3 free spins icons (positions -3, -2, -1)
  for (let i = 0; i < 3; i++) {
    // Get the free spins collected state from the stats bar if available
    const isActive = existingStatsContainer && existingStatsContainer.freeSpinsCollected ? 
                    existingStatsContainer.freeSpinsCollected[i] : 
                    additionalFreeSpins === (i + 1);
                    
    const freeSpinsIcon = scene.add.image(
      startX + (i * consistentSpacing) - 30, // Shift left to avoid overlap
      0,
      isActive ? `more_free_spins_${i+1}` : `free_spins_off_${i+1}`
    ).setScale(scale);
    secondRow.add(freeSpinsIcon);
  }
  
  // Remove lowest fish in the middle (position 3)
  const removeLowestFishIcon = scene.add.image(
    startX + (3 * consistentSpacing),
    0,
    hasRemoveLowestFish ? 'stats_remove_lowest_fish_on' : 'stats_remove_lowest_fish_off'
  ).setScale(scale * 1.1); // Make the lowest fish slightly larger
  secondRow.add(removeLowestFishIcon);
  
  // 3 fisherman wild icons (positions 4, 5, 6) - add a bit more spacing after the lowest fish
  for (let i = 0; i < 3; i++) {
    const isActive = i < fisherWildCount;
    const fisherWild = scene.add.image(
      startX + ((i + 4) * consistentSpacing) + 30, // Add extra space after the lowest fish
      0,
      isActive ? 'fisher_wild' : 'stats_fisher_wild_off'
    ).setScale(scale);
    secondRow.add(fisherWild);
  }
  
  statsContainer.add(secondRow);
  
  // Play congratulations sound
  if (scene.sounds && scene.sounds.sfx_congratsPopup) {
    scene.sounds.sfx_congratsPopup.play();
  }
  
  // Make the entire background clickable to continue
  bgOverlay.on('pointerdown', closePopup);
  popupBg.on('pointerdown', closePopup);
  
  function closePopup() {
    // Play button sound
    if (scene.sounds && scene.sounds.sfx_basicButton) {
      scene.sounds.sfx_basicButton.play();
    }
    
    // Fade out popup
    scene.tweens.add({
      targets: popupContainer,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        // Clean up popup
        popupContainer.destroy();
        
        // Create wild stats bar (always show it regardless of features)
        const wildStatsBar = createWildStatsBar(scene, scene.cameras.main.centerX, scene.cameras.main.height - 100);
        wildStatsBar.setDepth(100); // Ensure it's visible above other elements
        
        // Initialize based on fisher wild count from gift phase (if any)
        const initialFisherWildCount = features && features.fisherWildCount ? features.fisherWildCount : 0;
        wildStatsBar.updateWildStats(initialFisherWildCount); // Initialize with fisher wilds from gift phase
        
        // Store reference to the wild stats bar on the scene
        scene.wildStatsBar = wildStatsBar;
        
        // Start free spins with the features passed in
        if (scene.pendingFreeSpinsData) {
          const { freeSpinsResults, features } = scene.pendingFreeSpinsData;
          delete scene.pendingFreeSpinsData;
          startFreeSpins(scene, freeSpinsResults, features);
        }
      }
    });
  }
  
  // Animate popup appearance
  popupContainer.setAlpha(0);
  scene.tweens.add({
    targets: popupContainer,
    alpha: 1,
    duration: 300
  });
}

// Helper function to clean up all splash and puddle elements
function cleanupSplashElements(scene) {
  if (scene.splashElements && scene.splashElements.length > 0) {
    scene.splashElements.forEach(element => {
      if (element && !element.destroyed) {
        if (element.parentContainer) {
          element.parentContainer.remove(element);
        }
        element.destroy();
      }
    });
    scene.splashElements = [];
  }
}

// Unified helper function to create splash and puddle effects
function createSplashEffect(scene, x, y, parentContainer, isRepeating = false) {
  // Create a new splash image
  const splash = scene.add.image(x, y, 'splash');
  
  // Create two puddles at the same position with slight offset
  const puddle1 = scene.add.image(x, y, 'puddle');
  const puddle2 = scene.add.image(x - 5, y + 5, 'puddle'); // Slight offset for second puddle
  
  // Set the depth (puddle behind splash)
  splash.setDepth(-1);
  puddle1.setDepth(-2);
  puddle2.setDepth(-2);
  
  // Set initial scale and alpha
  splash.setScale(0.3);
  splash.setAlpha(0);
  puddle1.setScale(0.1); // Much smaller initial scale for puddle
  puddle1.setAlpha(0);
  puddle2.setScale(0.1); // Much smaller initial scale for puddle
  puddle2.setAlpha(0);
  
  // Add to the container
  parentContainer.addAt(splash, 0);  // Add at index 0 to ensure it's at the bottom of the display list
  parentContainer.addAt(puddle1, 0);  // Add at index 0 to ensure it's at the bottom of the display list
  parentContainer.addAt(puddle2, 0);  // Add at index 0 to ensure it's at the bottom of the display list
  
  // Track these elements for cleanup
  if (!scene.splashElements) {
    scene.splashElements = [];
  }
  scene.splashElements.push(splash);
  scene.splashElements.push(puddle1);
  scene.splashElements.push(puddle2);
  
  // Animate splash
  const splashTween = scene.tweens.add({
    targets: splash,
    scale: 0.4,
    alpha: { from: 0, to: 0.8, duration: 200 },
    duration: 400,
    onComplete: () => {
      // Fade out splash
      scene.tweens.add({
        targets: splash,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          // Remove splash after animation
          if (parentContainer && !parentContainer.destroyed && splash && !splash.destroyed) {
            parentContainer.remove(splash);
            splash.destroy();
            // Remove from tracking array
            const index = scene.splashElements.indexOf(splash);
            if (index > -1) {
              scene.splashElements.splice(index, 1);
            }
          }
        }
      });
      
      // Animate first puddle as splash reaches maximum
      scene.tweens.add({
        targets: puddle1,
        scale: 0.2, // Much smaller maximum scale for puddle
        alpha: { from: 0, to: 0.8, duration: 200 },
        duration: 400,
        onComplete: () => {
          // Fade out first puddle
          scene.tweens.add({
            targets: puddle1,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              // Remove first puddle after animation
              if (parentContainer && !parentContainer.destroyed && puddle1 && !puddle1.destroyed) {
                parentContainer.remove(puddle1);
                puddle1.destroy();
                // Remove from tracking array
                const index = scene.splashElements.indexOf(puddle1);
                if (index > -1) {
                  scene.splashElements.splice(index, 1);
                }
              }
            }
          });
        }
      });
      
      // Animate second puddle with a delay
      scene.time.delayedCall(200, () => {
        scene.tweens.add({
          targets: puddle2,
          scale: 0.25, // Slightly larger than the first puddle
          alpha: { from: 0, to: 0.6, duration: 200 }, // Slightly more transparent
          duration: 400,
          onComplete: () => {
            // Fade out second puddle
            scene.tweens.add({
              targets: puddle2,
              alpha: 0,
              duration: 300,
              onComplete: () => {
                // Remove second puddle after animation
                if (parentContainer && !parentContainer.destroyed && puddle2 && !puddle2.destroyed) {
                  parentContainer.remove(puddle2);
                  puddle2.destroy();
                  // Remove from tracking array
                  const index = scene.splashElements.indexOf(puddle2);
                  if (index > -1) {
                    scene.splashElements.splice(index, 1);
                  }
                }
                
                // If repeating, schedule next animation
                if (isRepeating) {
                  const delayTimer = scene.time.delayedCall(2000, () => {
                    // Only create next splash if animations haven't been stopped
                    if (!scene.animationsStopped) {
                      createSplashEffect(scene, x, y, parentContainer, true);
                    }
                  });
                  
                  // Store the timer for cleanup
                  if (!scene.activeDelayTimers) {
                    scene.activeDelayTimers = [];
                  }
                  scene.activeDelayTimers.push(delayTimer);
                }
              }
            });
          }
        });
      });
    }
  });
  
  // Add to active tweens for cleanup
  if (scene.activePaylineTweens) {
    scene.activePaylineTweens.push(splashTween);
  }
  
  return { splash, puddle1, puddle2 };
}

// Helper function to create a single splash
function createSplash(scene, symbolSprite, gridContainer) {
  // Use the symbol's parent container instead of gridContainer
  const parentContainer = symbolSprite.parentContainer || gridContainer;
  
  // Get the symbol's position
  const x = symbolSprite.x;
  const y = symbolSprite.y;
  
  // Create the splash effect (non-repeating)
  return createSplashEffect(scene, x, y, parentContainer, false);
}

// Helper function to add repeating splash animation for a symbol
function addSplashAnimation(scene, symbolSprite, gridContainer) {
  // Use the symbol's parent container instead of gridContainer
  const parentContainer = symbolSprite.parentContainer || gridContainer;
  
  // Store the symbol's position for reference
  const symbolX = symbolSprite.x;
  const symbolY = symbolSprite.y;
  
  // Create the splash effect (repeating)
  return createSplashEffect(scene, symbolX, symbolY, parentContainer, true);
}

// Function to highlight winning paylines
function highlightWinningPaylines(matches) {
  console.log('Highlighting winning paylines:', matches);
  
  // Use 'this' instead of window.gameScene to access the scene
  const scene = this;
  const gridContainer = window.gridContainer;
  
  if (!scene || !matches || !matches.length) return;

  if (scene.logoParts?.length) {
    playLogoWaveAnimation(scene, scene.logoParts);
  }
  
  
  // Reset animation stopped flag
  scene.animationsStopped = false;
  
  // Create an array to store active animation tweens
  if (!scene.activePaylineTweens) {
    scene.activePaylineTweens = [];
  } else {
    // Stop any existing payline animations
    scene.activePaylineTweens.forEach(tween => {
      if (tween && tween.isPlaying) {
        tween.stop();
        scene.tweens.remove(tween);
      }
    });
    scene.activePaylineTweens = [];
  }
  
  // Track all splash and puddle elements for cleanup
  if (!scene.splashElements) {
    scene.splashElements = [];
  }
  
  // List of gem symbols that will have the special animation
  const gemSymbols = ['gem_red', 'gem_purple', 'gem_yellow', 'gem_green', 'gem_blue'];
  
  // List of premium symbols that will have the glow animation
  const premiumSymbols = ['crown', 'hourglass', 'ring', 'chalice'];
  
  // Process each match
  matches.forEach(match => {
    // Extract match data
    const { symbol, positions } = match;
    
    // Skip if no positions or no symbol
    if (!positions || !positions.length) return;
    
    // For each position in the match
    positions.forEach(position => {
      const [col, row] = position;
      
      // Get the symbol sprite at this position
      const symbolSprite = scene.symbols[row][col];
      
      if (!symbolSprite) return;
      
      // Check symbol type and apply appropriate animation
      if (gemSymbols.includes(symbol)) {
        // Gem symbols get splash and puddle animation
        // Save original scale
        const originalScaleX = symbolSprite.scaleX;
        const originalScaleY = symbolSprite.scaleY;
        
        // Create a timeline for smoother animation
        const animateGem = () => {
          // 1. Scale down moderately
          const tween1 = scene.tweens.add({
            targets: symbolSprite,
            scaleX: originalScaleX * 0.7,
            scaleY: originalScaleY * 0.7,
            duration: 300,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // 2. Scale up slightly bigger than original with gentle squash effect
              const tween2 = scene.tweens.add({
                targets: symbolSprite,
                scaleX: originalScaleX * 1.2,
                scaleY: originalScaleY * 1.05,
                duration: 300,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  // Create splash when gem reaches maximum size
                  createSplash(scene, symbolSprite, gridContainer);
                  
                  // 3. Scale directly back to original size
                  const tween3 = scene.tweens.add({
                    targets: symbolSprite,
                    scaleX: originalScaleX,
                    scaleY: originalScaleY,
                    duration: 250,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                      // 4. Add a proper delay using delayedCall
                      const delayTimer = scene.time.delayedCall(2000, () => {
                        // Only continue animation if not stopped
                        if (!scene.animationsStopped) {
                          animateGem();
                        }
                      });
                      
                      // Store the timer for cleanup
                      if (!scene.activeDelayTimers) {
                        scene.activeDelayTimers = [];
                      }
                      scene.activeDelayTimers.push(delayTimer);
                    }
                  });
                  scene.activePaylineTweens.push(tween3);
                }
              });
              scene.activePaylineTweens.push(tween2);
            }
          });
          scene.activePaylineTweens.push(tween1);
        };
        
        // Start the animation loop
        animateGem();
      } else if (premiumSymbols.includes(symbol)) {
        // Premium symbols get glow animation with scale/squash effect
        // Save original scale
        const originalScaleX = symbolSprite.scaleX;
        const originalScaleY = symbolSprite.scaleY;
        // Save original rotation
        const originalRotation = symbolSprite.rotation || 0;
        
        // Create a timeline for smoother animation
        const animatePremium = () => {
          // 1. Scale down moderately and rotate slightly to one side
          const tween1 = scene.tweens.add({
            targets: symbolSprite,
            scaleX: originalScaleX * 0.7,
            scaleY: originalScaleY * 0.7,
            rotation: originalRotation - 0.05, // Slight rotation counterclockwise
            duration: 300,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // 2. Scale up slightly bigger than original with gentle squash effect and rotate to other side
              const tween2 = scene.tweens.add({
                targets: symbolSprite,
                scaleX: originalScaleX * 1.2,
                scaleY: originalScaleY * 1.05,
                rotation: originalRotation + 0.05, // Slight rotation clockwise
                duration: 300,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  // Create glow when premium symbol reaches maximum size
                  createGlowEffect(scene, symbolSprite, gridContainer, false);
                  
                  // 3. Scale directly back to original size and rotation
                  const tween3 = scene.tweens.add({
                    targets: symbolSprite,
                    scaleX: originalScaleX,
                    scaleY: originalScaleY,
                    rotation: originalRotation, // Back to original rotation
                    duration: 250,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                      // 4. Add a proper delay using delayedCall
                      const delayTimer = scene.time.delayedCall(2000, () => {
                        // Only continue animation if not stopped
                        if (!scene.animationsStopped) {
                          animatePremium();
                        }
                      });
                      
                      // Store the timer for cleanup
                      if (!scene.activeDelayTimers) {
                        scene.activeDelayTimers = [];
                      }
                      scene.activeDelayTimers.push(delayTimer);
                    }
                  });
                  scene.activePaylineTweens.push(tween3);
                }
              });
              scene.activePaylineTweens.push(tween2);
            }
          });
          scene.activePaylineTweens.push(tween1);
        };
        
        // Start the animation loop
        animatePremium();
      } else {
        // For other symbols, add splash animation that repeats with the pulsing
        addSplashAnimation(scene, symbolSprite, gridContainer);
        
        // For other symbols, create a gentler pulsing loop
        const animateRegular = () => {
          const tween = scene.tweens.add({
            targets: symbolSprite,
            scale: symbolSprite.scale * 1.15,
            duration: 400,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // Add a brief delay before starting the next animation cycle
              const delayTimer = scene.time.delayedCall(2000, () => {
                // Only continue animation if not stopped
                if (!scene.animationsStopped) {
                  animateRegular();
                }
              });
              
              // Store the timer for cleanup
              if (!scene.activeDelayTimers) {
                scene.activeDelayTimers = [];
              }
              scene.activeDelayTimers.push(delayTimer);
            }
          });
          scene.activePaylineTweens.push(tween);
        };
        
        // Start the animation loop
        animateRegular();
      }
    });
    
    // Play match sound (only once per match)
    if (scene.sounds?.sfx_symbolsMatch) {
      scene.sounds.sfx_symbolsMatch.play();
    }
  });
  
  // Store the function to stop animations on the scene for access from elsewhere
  scene.stopPaylineAnimations = () => {
    // Set flag to prevent new animations from starting
    scene.animationsStopped = true;
    
    // Stop and remove all active tweens
    if (scene.activePaylineTweens) {
      scene.activePaylineTweens.forEach(tween => {
        if (tween && tween.isPlaying) {
          tween.stop();
          scene.tweens.remove(tween);
        }
      });
      scene.activePaylineTweens = [];
    }
    
    // Remove all pending delayed calls
    if (scene.activeDelayTimers) {
      scene.activeDelayTimers.forEach(timer => {
        if (timer && timer.getProgress() < 1) {
          timer.remove();
        }
      });
      scene.activeDelayTimers = [];
    }
    
    // Clean up all splash and puddle elements
    cleanupSplashElements(scene);
  };
}

// Helper function to create glow effect for premium symbols
function createGlowEffect(scene, symbolSprite, gridContainer, isRepeating = false) {
  // Use the symbol's parent container instead of gridContainer
  const parentContainer = symbolSprite.parentContainer || gridContainer;
  
  // Get the symbol's position
  const x = symbolSprite.x;
  const y = symbolSprite.y;
  
  // Create a glow image
  const glow = scene.add.image(x, y, 'glow');
  
  // Set the depth to ensure it's behind the symbol
  glow.setDepth(-1);
  
  // Set initial scale and alpha
  glow.setScale(0.8);
  glow.setAlpha(0);
  
  // Add to the container at the bottom of the display list
  parentContainer.addAt(glow, 0);
  
  // Track for cleanup
  if (!scene.splashElements) {
    scene.splashElements = [];
  }
  scene.splashElements.push(glow);
  
  // Animate glow
  const glowTween = scene.tweens.add({
    targets: glow,
    scale: 1.2,
    alpha: { from: 0, to: 0.7, duration: 300 },
    duration: 500,
    onComplete: () => {
      // Fade out glow
      scene.tweens.add({
        targets: glow,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          // Remove glow after animation
          if (parentContainer && !parentContainer.destroyed && glow && !glow.destroyed) {
            parentContainer.remove(glow);
            glow.destroy();
            // Remove from tracking array
            const index = scene.splashElements.indexOf(glow);
            if (index > -1) {
              scene.splashElements.splice(index, 1);
            }
          }
          
          // If repeating, schedule next animation
          if (isRepeating) {
            const delayTimer = scene.time.delayedCall(1500, () => {
              // Only create next glow if animations haven't been stopped
              if (!scene.animationsStopped) {
                createGlowEffect(scene, symbolSprite, gridContainer, true);
              }
            });
            
            // Store the timer for cleanup
            if (!scene.activeDelayTimers) {
              scene.activeDelayTimers = [];
            }
            scene.activeDelayTimers.push(delayTimer);
          }
        }
      });
    }
  });
  
  // Add to active tweens for cleanup
  if (scene.activePaylineTweens) {
    scene.activePaylineTweens.push(glowTween);
  }
  
  return glow;
}

// Add this new function for creating and updating the gift stats bar
function createGiftStatsBar(scene, x, y) {
  // Create a container for the stats bar
  const statsBarContainer = scene.add.container(x, y);
  
  // Add background with smaller scale
  const background = scene.add.image(0, 0, 'stats_bar_background').setOrigin(0.5).setScale(0.7);
  statsBarContainer.add(background);
  
  // Calculate dimensions for better positioning
  const bgWidth = background.displayWidth;
  const totalIcons = 10; // 3 free spins + 3 fish + 3 wild + 1 remove lowest
  
  // Adjust spacing calculation to make sure items start from the beginning and end at the right position
  // Start from the far left edge of the background with a small padding
  const startX = -bgWidth/2 + (bgWidth * 0.05); // 5% padding from left edge
  
  // Calculate the space needed for 9 icons (excluding the last one)
  const usableWidth = bgWidth * 0.8; // Use 85% of width for first 9 icons
  const iconSpacing = usableWidth / 9; // Spacing for first 9 icons
  
  // Add free spins indicators (initially all off) - positioned at the beginning
  const freeSpinsIcons = [];
  for (let i = 0; i < 3; i++) {
    // Position from left to right with proper spacing
    const xPos = startX + (iconSpacing * i);
    const icon = scene.add.image(xPos, 0, `free_spins_off_${i+1}`).setScale(0.3).setOrigin(0.5);
    freeSpinsIcons.push(icon);
    statsBarContainer.add(icon);
  }
  
  // Store which free spins prizes have been opened
  statsBarContainer.freeSpinsCollected = [false, false, false]; // For +1, +2, +3 free spins
  
  // Fixed fish icons (initially all off) - positioned after free spins
  const fixedFishIcons = [];
  for (let i = 0; i < 3; i++) {
    // Position from left to right with proper spacing
    const xPos = startX + (iconSpacing * (i + 3));
    const icon = scene.add.image(xPos, 0, 'stats_fixed_fish_off').setScale(0.3).setOrigin(0.5);
    fixedFishIcons.push(icon);
    statsBarContainer.add(icon);
  }
  
  // Fisher wild icons (initially all off) - positioned after fixed fish
  const fisherWildIcons = [];
  for (let i = 0; i < 3; i++) {
    // Position after the fixed fish icons
    const xPos = startX + (iconSpacing * (i + 6));
    const icon = scene.add.image(xPos, 0, 'stats_fisher_wild_off').setScale(0.3).setOrigin(0.5);
    fisherWildIcons.push(icon);
    statsBarContainer.add(icon);
  }
  
  // Remove lowest fish icon (initially off) - positioned at the end with enough spacing
  const removeLowestFishIcon = scene.add.image(
    bgWidth/2 - (bgWidth * 0.1), // 10% padding from right edge
    0, 
    'stats_remove_lowest_fish_off'
  ).setScale(0.35).setOrigin(0.5);
  statsBarContainer.add(removeLowestFishIcon);
  
  // Store references to icons for updating later
  statsBarContainer.freeSpinsIcons = freeSpinsIcons;
  statsBarContainer.fixedFishIcons = fixedFishIcons;
  statsBarContainer.fisherWildIcons = fisherWildIcons;
  statsBarContainer.removeLowestFishIcon = removeLowestFishIcon;
  
  // Add update method to the container
  statsBarContainer.updateStats = function(fixedFish, fisherWild, removeLowest, additionalFreeSpins = 0, lastOpenedPrize = null) {
    // Update free spins tracking based on last opened prize
    if (lastOpenedPrize && lastOpenedPrize.type === 'free_spins') {
      const freeSpinsValue = lastOpenedPrize.value;
      if (freeSpinsValue >= 1 && freeSpinsValue <= 3) {
        this.freeSpinsCollected[freeSpinsValue-1] = true;
      }
    }
    
    // Update free spins icons based on what's been collected
    for (let i = 0; i < this.freeSpinsIcons.length; i++) {
      if (this.freeSpinsCollected[i]) {
        // Turn on the collected free spins
        this.freeSpinsIcons[i].setTexture(`more_free_spins_${i+1}`).setScale(0.3);
      }
    }
    
    // Update fixed fish icons
    for (let i = 0; i < this.fixedFishIcons.length; i++) {
      if (i < fixedFish) {
        // Replace with normal (on) image - using the same image as the prize for now
        this.fixedFishIcons[i].setTexture('fixed_fish').setScale(0.25);
      }
    }
    
    // Update fisher wild icons
    for (let i = 0; i < this.fisherWildIcons.length; i++) {
      if (i < fisherWild) {
        // Replace with normal (on) image - using the same image as the prize for now
        this.fisherWildIcons[i].setTexture('fisher_wild').setScale(0.25);
      }
    }
    
    // Update remove lowest fish icon
    if (removeLowest) {
      this.removeLowestFishIcon.setTexture('stats_remove_lowest_fish_on').setScale(0.35);
    }
  };
  
  return statsBarContainer;
}

// Function to create the wild stats bar
function createWildStatsBar(scene, x, y) {
  // Create a container for the wild stats bar
  const wildStatsBarContainer = scene.add.container(x, y - 165);
  
  // Add background with appropriate scale
  const background = scene.add.image(0, 0, 'wild_stats_bar_background').setOrigin(0.5).setScale(0.5);
  wildStatsBarContainer.add(background);
  
  // Calculate dimensions for positioning
  const bgWidth = background.displayWidth;
  
  // Start from the left edge with padding
  const startX = -bgWidth/2 + (bgWidth * 0.05); // 5% padding from left edge
  
  // Calculate usable width and spacing
  const usableWidth = bgWidth * 0.9; // Use 90% of width
  const totalIcons = 10; // 3 fisher wild icons + 7 multiplier icons
  const iconSpacing = usableWidth / (totalIcons - 1);
  
  // Add fisher wild icons (initially all off) - positioned at the beginning
  const fisherWildIcons = [];
  for (let i = 0; i < 3; i++) {
    const xPos = startX + (iconSpacing * i);
    const icon = scene.add.image(xPos, 0, 'wild_stats_fisher_off').setScale(0.65).setOrigin(0.5);
    fisherWildIcons.push(icon);
    wildStatsBarContainer.add(icon);
  }
  
  // Add multiplier icons (initially all off) - positioned after fisher wild icons
  const multiplierValues = [2, 3, 10, 20, 30, 40, 50];
  const multiplierIcons = [];
  
  for (let i = 0; i < multiplierValues.length; i++) {
    const xPos = startX + (iconSpacing * (i + 3)); // Start after the 3 fisher wild icons
    const value = multiplierValues[i];
    const icon = scene.add.image(xPos, 0, `freespins_off_x${value}`).setScale(0.65).setOrigin(0.5);
    multiplierIcons.push(icon);
    wildStatsBarContainer.add(icon);
  }
  
  // Store references to icons for updating later
  wildStatsBarContainer.fisherWildIcons = fisherWildIcons;
  wildStatsBarContainer.multiplierIcons = multiplierIcons;
  wildStatsBarContainer.multiplierValues = multiplierValues;
  
  // Add update method to the container
  wildStatsBarContainer.updateWildStats = function(wildsCollected) {
    // Calculate current set wilds and completed sets
    const maxMultipliers = this.multiplierValues.length; // Maximum number of multipliers available
    const completedSets = Math.min(Math.floor(wildsCollected / 4), maxMultipliers); // Cap at max multipliers
    
    // If we've reached the maximum multiplier, don't show any active fisher wilds
    const currentSetWilds = completedSets >= maxMultipliers ? 3 : wildsCollected % 4;
    
    // First, hide all icons
    for (let i = 0; i < this.fisherWildIcons.length; i++) {
      this.fisherWildIcons[i].setVisible(false);
    }
    
    for (let i = 0; i < this.multiplierIcons.length; i++) {
      this.multiplierIcons[i].setVisible(false);
    }
    
    // Calculate positions
    const bgWidth = this.list[0].displayWidth;
    const startX = -bgWidth/2 + (bgWidth * 0.05); // 5% padding from left edge
    const usableWidth = bgWidth * 0.9; // Use 90% of width
    const totalIcons = 10; // 3 fisher wild icons + 7 multiplier icons
    const iconSpacing = usableWidth / (totalIcons - 1);
    
    // Track current position
    let currentPosition = 0;
    
    // First, place the active multiplier icons at the beginning
    for (let i = 0; i < completedSets && i < this.multiplierValues.length; i++) {
      const value = this.multiplierValues[i];
      const icon = this.multiplierIcons[i];
      
      // Position at the current position and make visible
      icon.setX(startX + (iconSpacing * currentPosition));
      icon.setTexture(`freespins_on_x${value}`).setScale(0.65);
      icon.setVisible(true);
      
      // Move to next position
      currentPosition++;
    }
    
    // Next, place the fisher wild icons
    // Always show fisher wild icons, even when max multiplier is reached
    for (let i = 0; i < this.fisherWildIcons.length; i++) {
      const icon = this.fisherWildIcons[i];
      
      // Position at the current position and make visible
      icon.setX(startX + (iconSpacing * currentPosition));
      
      // Set texture based on whether this icon should be active
      if (i < currentSetWilds) {
        icon.setTexture('wild_stats_fisher_on').setScale(0.65);
      } else {
        icon.setTexture('wild_stats_fisher_off').setScale(0.65);
      }
      
      icon.setVisible(true);
      
      // Move to next position
      currentPosition++;
    }
    
    // Finally, place the remaining inactive multiplier icons
    for (let i = completedSets; i < this.multiplierValues.length; i++) {
      const value = this.multiplierValues[i];
      const icon = this.multiplierIcons[i];
      
      // Position at the current position and make visible
      icon.setX(startX + (iconSpacing * currentPosition));
      icon.setTexture(`freespins_off_x${value}`).setScale(0.65);
      icon.setVisible(true);
      
      // Move to next position
      currentPosition++;
    }
  };
  
  return wildStatsBarContainer;
}

// Function to highlight scatter symbols with pulsing animation
async function highlightScatterSymbols(scene) {
  return new Promise(async (resolve) => {
    // Find all scatter symbols
    let scatterCount = 0;
    const scatterTweens = [];
    
    // Play scatter match sound if available
    if (scene.sounds && scene.sounds.sfx_scatterMatch) {
      scene.sounds.sfx_scatterMatch.play();
    }
    
    // Look through all symbols to find scatters
    for (let row = 0; row < scene.symbols.length; row++) {
      for (let col = 0; col < scene.symbols[row].length; col++) {
        const symbol = scene.symbols[row][col];
        if (symbol && 
            ((typeof symbol === 'string' && symbol === 'scatter') || 
             (symbol.texture && symbol.texture.key === 'scatter'))) {
          scatterCount++;
          // Highlight the scatter with same animation used in extra scatter feature
          const tween = scene.tweens.add({
            targets: symbol,
            scale: symbol.scale * 1.3,
            duration: 300,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut'
          });
          scatterTweens.push(tween);
        }
      }
    }
    
    // Wait for the animation to complete, then cleanup tweens
    scene.time.delayedCall(1500, () => {
      // Stop and remove tweens to prevent memory leaks
      for (let i = 0; i < scatterTweens.length; i++) {
        const tween = scatterTweens[i];
        if (tween && tween.isPlaying) {
          tween.stop();
        }
      }
      resolve();
    });
  });
}

// Function to display free spins final win amount popup
function showFreeSpinsWinPopup(scene, totalWinAmount) {
  return new Promise((resolve) => {

    // Create a container for the popup
    const popupContainer = scene.add.container(0, 0).setDepth(50);
    
    // Add semi-transparent background that's interactive
    const centerX = scene.cameras.main.centerX;
    const centerY = scene.cameras.main.centerY;
    
    // Add background overlay
    const bg = scene.add.rectangle(centerX, centerY, 720, 1280, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => {
        // Find and destroy the stats bar if it exists
        scene.children.each(child => {
          // Look for container that has properties specific to our stats bar
          if (child && 
              child.type === 'Container' && 
              child.freeSpinsIcons && 
              child.fixedFishIcons && 
              child.fisherWildIcons && 
              child.removeLowestFishIcon) {
            // This is our stats bar container, destroy it
            child.destroy();
          }
        });

           // Show UI Buttons
           scene.buyFreeSpinsContainer.setVisible(true);
           scene.buyFreeSpinsText.setVisible(true).setScale(1); 
           scene.buyFreeSpinsBonusText.setVisible(false);
           scene.buyFreeSpinsPriceContainer.setVisible(true).setScale(0.8);
           scene.buyFreeSpinsButton.setInteractive();
           scene.anteBorder.setVisible(true);
           scene.anteToggleContainer.setVisible(true);
           scene.anteBetSpriteContainer.setVisible(true);
           scene.anteBorder.setInteractive(); // Re-enable click on the ante toggle
           scene.spinButton.setVisible(true);
           scene.cashButton.setVisible(true);
           scene.autoSpinBtnContainer.setVisible(true);

           // Fade in entire ante toggle + amount
           const fadeDuration = 150;
           scene.tweens.add({ targets: scene.anteToggleContainer, alpha: 1, duration: fadeDuration, ease: 'Linear' });
           scene.tweens.add({ targets: scene.anteBetSpriteContainer, alpha: 1, duration: fadeDuration, ease: 'Linear' });
           scene.tweens.add({ targets: scene.anteBorder, alpha: 1, duration: fadeDuration, ease: 'Linear' });
           scene.tweens.add({ targets: scene.buyFreeSpinsContainer, alpha: 1, duration: fadeDuration, ease: 'Linear' });

        
        // Fade out and destroy when clicked anywhere
        scene.tweens.add({
          targets: popupContainer,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            popupContainer.destroy();
            resolve();
          }
        });
      });
    popupContainer.add(bg);
    
    // Add the popup background image
    const popupBg = scene.add.image(centerX, centerY - 100, 'freespins_win_popup_background')
      .setOrigin(0.5)
      .setScale(0.55)
      .setInteractive()
      .on('pointerdown', () => bg.emit('pointerdown'));
    popupContainer.add(popupBg);
    
    // Format win amount
    const formattedWin = formatOrbValueAsCurrency(totalWinAmount);
    
   // Shadow layer (black, soft, offset)
const winShadow = scene.add.text(centerX + 4, centerY - 30 , formattedWin, {
  fontFamily: 'Arial',
  fontSize: '80px',
  fontWeight: 'bold',
  color: '#000000',
  stroke: '#000000',
  strokeThickness: 8,
  align: 'center'
}).setOrigin(0.5).setAlpha(0.5);

// Middle stroke layer (dark brown)
const winMiddle = scene.add.text(centerX, centerY - 35, formattedWin, {
  fontFamily: 'Arial',
  fontSize: '80px',
  fontWeight: 'bold',
  color: '#473321',
  stroke: '#473321',
  strokeThickness: 8,
  align: 'center'
}).setOrigin(0.5);

// Top layer (light fill + thin stroke)
const winTop = scene.add.text(centerX, centerY - 35, formattedWin, {
  fontFamily: 'Arial',
  fontSize: '80px',
  fontWeight: 'bold',
  color: '#f8eecf',
  stroke: '#f9f0d1',
  strokeThickness: 5,
  align: 'center'
}).setOrigin(0.5);

// Add to container in order
popupContainer.add(winShadow);
popupContainer.add(winMiddle);
popupContainer.add(winTop);

    
    // Play win sound if available
    if (scene.sounds && scene.sounds.sfx_bigWin) {
      scene.sounds.sfx_bigWin.play();
    }
    
    // Animate the popup appearing
    popupContainer.setAlpha(0);
    scene.tweens.add({
      targets: popupContainer,
      alpha: 1,
      duration: 300
    });
  });
}

// Function to show wild counter popup with multiplier
function showWildCounterPopup(scene, multiplier, onComplete) {
  const centerX = scene.cameras.main.centerX;
  const centerY = scene.cameras.main.centerY;
  
  // Create a separate container for the dark overlay
  const overlayContainer = scene.add.container(0, 0).setDepth(100);
  
  // Add semi-transparent background overlay that covers the entire screen
  const bgOverlay = scene.add.rectangle(centerX, centerY, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.5)
    .setInteractive();
  overlayContainer.add(bgOverlay);
  
  // Create a container for the popup content
  const popupContainer = scene.add.container(centerX, centerY - 100).setDepth(101);
  
  // Add the popup background
  const popupBg = scene.add.image(0, 0, 'wild_counter_popup_background')
    .setScale(0.5)
    .setInteractive();
  popupContainer.add(popupBg);
  
  // Add the multiplier text
  const multiplierValue = `${multiplier}`;
  const x = 145;
  const y = 110;
  
  // Shadow layer (acts like a soft shadow using stroke + offset)
  const outerStrokeText = scene.add.text(x + 4, y + 4, multiplierValue, {
    fontFamily: 'Arial',
    fontSize: '72px',
    fontWeight: 'bold',
    color: '#000000',
    stroke: '#000000',
    strokeThickness: 8,
    align: 'center'
  }).setOrigin(0.5).setAlpha(0.5); // subtle, transparent

  // Middle stroke layer (#4a3726)
const middleStrokeText = scene.add.text(x, y, multiplierValue, {
  fontFamily: 'Arial',
  fontSize: '72px',
  fontWeight: 'bold',
  color: '#473321',
  stroke: '#473321',
  strokeThickness: 8,
  align: 'center'
}).setOrigin(0.5);
  
  // Main layer with inner stroke and fill
  const innerStrokeText = scene.add.text(x, y, multiplierValue, {
    fontFamily: 'Arial',
    fontSize: '72px',
    fontWeight: 'bold',
    color: '#f9f0d1',
    stroke: '#f9f0d1',
    strokeThickness: 5,
    align: 'center'
  }).setOrigin(0.5);
  
  popupContainer.add(outerStrokeText);
  popupContainer.add(middleStrokeText);
  popupContainer.add(innerStrokeText);

  // Make both the overlay and popup clickable to continue
  bgOverlay.on('pointerdown', closePopup);
  popupBg.on('pointerdown', closePopup);
  
  // Start with overlay transparent and fade it in
  overlayContainer.setAlpha(0);
  scene.tweens.add({
    targets: overlayContainer,
    alpha: 1,
    duration: 300
  });
  
  // Animate the popup content appearing
  popupContainer.setScale(0);
  scene.tweens.add({
    targets: popupContainer,
    scale: 1,
    duration: 300,
    ease: 'Back.Out'
  });
  

  
    function closePopup() {
    // Play button sound if available
    if (scene.sounds && scene.sounds.sfx_basicButton) {
      scene.sounds.sfx_basicButton.play();
    }
    
    // Fade out the overlay
    scene.tweens.add({
      targets: overlayContainer,
      alpha: 0,
      duration: 300
    });
    
    // Animate the popup content disappearing
    scene.tweens.add({
      targets: popupContainer,
      scale: 0,
      duration: 300,
      ease: 'Back.In',
      onComplete: () => {
        // Clean up both containers
        overlayContainer.destroy();
        popupContainer.destroy();
        
        // Add a small delay before continuing with the game
        scene.time.delayedCall(500, () => {
          if (onComplete && typeof onComplete === 'function') {
            onComplete();
          }
        });
      }
    });
  }
  }

// Function to show fixed fish orbs above the grid
function showFixedFishOrbs(scene, fixedFishCount, spinData) {
  if (!fixedFishCount || fixedFishCount <= 0 || !spinData || !spinData.grid) return [];
  
  const fixedFishOrbs = [];
  const grid = spinData.grid;
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Find all orbs in the grid that are fixed fish
  const orbPositions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      if (cell && typeof cell === 'object' && cell.type === 'orb') {
        // This is an orb, add it to our list
        orbPositions.push({
          row, 
          col, 
          color: cell.color, 
          value: cell.value
        });
      }
    }
  }
  
  // If we don't have enough orbs in the grid, we'll use what we have
  const orbsToShow = Math.min(fixedFishCount, orbPositions.length);
  
  // Create orbs at the positions found in the grid
  for (let i = 0; i < orbsToShow; i++) {
    const orbData = orbPositions[i];
    
    // Calculate position
    const xPos = orbData.col * boxWidth + boxWidth / 2;
    const yPos = orbData.row * boxHeight + boxHeight / 2;
    
    // Create container for the orb at the exact same position as in the grid
    const orbContainer = scene.add.container(xPos, yPos);
    orbContainer.setDepth(1000); // Very high depth to ensure it appears above everything
    
    // Create the orb image
    const orbKey = `orb_${orbData.color}`;
    const orb = scene.add.image(0, 0, orbKey);
    const scale = (scaleMap[orbKey] || 1) * Math.min(
      (boxWidth - 4) / orb.width, 
      (boxHeight - 4) / orb.height
    );
    orb.setScale(scale);
    
    // Add the fixed fish highlight image on top of the orb
    const highlight = scene.add.image(0, 0, 'fixed_fish_highlight');
    highlight.setScale(scale * 1);
    
    // Format orb value as currency
    const formattedValue = formatOrbValueAsCurrency(orbData.value);
    
    // Add background for the orb value
    const valueBackground = scene.add.image(0, 40, 'orb_value_background').setScale(0.6);
    
    // Create text for the value
    const txt = scene.add.text(0, 40, formattedValue, {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);
    
    // Add all elements to the container in the correct order:
    // 1. Orb at the bottom
    // 2. Highlight on top of the orb
    // 3. Value background and text on top of everything
    orbContainer.add([orb, highlight, valueBackground, txt]);
    
    // Add to the scene directly to ensure it's on top of the grid
    scene.add.existing(orbContainer);
    
    // Position relative to the grid container to ensure proper positioning
    orbContainer.x += window.gridContainer.x;
    orbContainer.y += window.gridContainer.y;
    
    // Start with alpha 0 and fade in
    orbContainer.alpha = 0;
    scene.tweens.add({
      targets: orbContainer,
      alpha: 1,
      duration: 500,
      ease: 'Sine.easeOut'
    });
    
    // Store reference to the orb container
    fixedFishOrbs.push(orbContainer);
  }
  
  return fixedFishOrbs;
}

// Function to remove fixed fish orbs with fade out animation
function removeFixedFishOrbs(scene, fixedFishOrbs) {
  if (!fixedFishOrbs || !fixedFishOrbs.length) return;
  
  // Create a promise that resolves when all fade animations complete
  return new Promise(resolve => {
    // Track how many orbs have completed their fade out
    let completedOrbs = 0;
    
    // Fade out each orb container
    for (const orbContainer of fixedFishOrbs) {
      if (orbContainer && !orbContainer.destroyed) {
        // Fade out animation
        scene.tweens.add({
          targets: orbContainer,
          alpha: 0,
          duration: 500,
          ease: 'Sine.easeIn',
          onComplete: () => {
            // Destroy the orb container after fade out
            orbContainer.destroy();
            
            // Increment completed counter
            completedOrbs++;
            
            // If all orbs have faded out, resolve the promise
            if (completedOrbs >= fixedFishOrbs.length) {
              resolve();
            }
          }
        });
      } else {
        // If the orb is already destroyed, increment the counter
        completedOrbs++;
      }
    }
    
    // If there were no valid orbs to animate, resolve immediately
    if (completedOrbs >= fixedFishOrbs.length) {
      resolve();
    }
  });
}

// Show scatters popup when 3+ scatters hit during free spins
async function showScattersPopup(scene) {
  return new Promise(resolve => {
    // Create a semi-transparent overlay to prevent interaction with game elements
    const overlay = scene.add.rectangle(
      0, 0, 
      scene.cameras.main.width, scene.cameras.main.height,
      0x000000, 0.7
    ).setOrigin(0).setDepth(999);
    
    // Add the popup background (contains all needed text)
    const popup = scene.add.image(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY,      'scatters_popup_background'
    ).setOrigin(0.5).setDepth(1000).setScale(0.5);
    
    // Make the entire screen clickable to continue
    overlay.setInteractive();
    popup.setInteractive();
    
    const closePopup = () => {
      // Remove the click event
      overlay.removeInteractive();
      popup.removeInteractive();
      
      // Fade out all elements
      scene.tweens.add({
        targets: [overlay, popup],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          // Destroy all elements
          overlay.destroy();
          popup.destroy();
          resolve();
        }
      });
    };
    
    // Add click event to continue
    overlay.on('pointerdown', closePopup);
    popup.on('pointerdown', closePopup);
  });
}

// Function to show big win popup based on win amount
function showBigWinPopup(scene, winAmount, betAmount, currency) {
  return new Promise(resolve => {
    // Calculate win multiplier (win amount / bet amount)
    const winMultiplier = winAmount / betAmount;
    
    // Default is no popup
    let popupType = null;
    
    // Determine popup type based on win multiplier thresholds
    if (winMultiplier >= 100) {
      popupType = 'super_win_popup';
    } else if (winMultiplier >= 60) {
      popupType = 'mega_win_popup';
    } else if (winMultiplier >= 40) {
      popupType = 'epic_win_popup';
    } else if (winMultiplier >= 20) {
      popupType = 'big_win_popup';
    }
    
    // If no popup needed, resolve immediately
    if (!popupType) {
      resolve();
      return;
    }
    
    // Format win amount based on currency
    let formattedFinalAmount;
    if (currency === 'USD') {
      // Format as $X,XXX.XX for USD
      formattedFinalAmount = '$' + winAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
      // Format as £X,XXX for LBP (no decimal places)
      formattedFinalAmount = '£' + Math.round(winAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // Create a container for the popup
    const popupContainer = scene.add.container(scene.cameras.main.centerX, scene.cameras.main.centerY).setDepth(1000);
    
    // Add background overlay
    const overlay = scene.add.rectangle(0, 0, scene.cameras.main.width * 2, scene.cameras.main.height * 2, 0x000000, 0.7);
    popupContainer.add(overlay);
    
    // Add popup image
    const popup = scene.add.image(0, - 100, popupType);
    popup.setScale(0);
    popupContainer.add(popup);
    
    // Create text container for the win amount
    const textContainer = scene.add.container(0, popup.height * 0.2);
    popupContainer.add(textContainer);
    
    // Flag to track if animation is completed
    let animationCompleted = false;
    let countUpTween = null;
    
    // Store character sprites
    const charSprites = [];
    const charWidth = 40; // Width of each character
    const charSpacing = 5; // Space between characters
    
    // Function to format current count value
    const formatCountValue = (value) => {
      if (currency === 'USD') {
        return '$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      } else {
        return '£' + Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
    };
    
    // Create initial sprites with the final value to ensure we have enough sprites
    // This avoids creating/destroying sprites during animation
    const setupInitialSprites = () => {
      // Format the final value to determine how many sprites we need
      const finalFormattedValue = formatCountValue(winAmount);
      
      // Calculate total width
      const totalWidth = finalFormattedValue.length * (charWidth + charSpacing) - charSpacing;
      let xPos = -totalWidth / 2;
      
      // Create a sprite for each character in the final amount
      for (let i = 0; i < finalFormattedValue.length; i++) {
        const char = finalFormattedValue[i];
        if (charMap[char] !== undefined) {
          // Create sprite with initial frame 0 (hidden)
          const charSprite = scene.add.sprite(xPos, 0, 'big_win_popup_spritesheet', 0);
          charSprite.setScale(0.5);
          charSprite.visible = false; // Hide initially
          textContainer.add(charSprite);
          charSprites.push(charSprite);
          xPos += charWidth + charSpacing;
        }
      }
    };
    
    // Function to update character sprites based on current count value
    const updateCharSprites = (countValue) => {
      // Format the current count value
      const formattedValue = formatCountValue(countValue);
      
      // Calculate total width
      const totalWidth = formattedValue.length * (charWidth + charSpacing) - charSpacing;
      let xPos = -totalWidth / 2;
      
      // Update each sprite with the correct frame
      for (let i = 0; i < formattedValue.length; i++) {
        const char = formattedValue[i];
        if (charMap[char] !== undefined && i < charSprites.length) {
          // Update sprite position and frame
          charSprites[i].x = xPos;
          charSprites[i].setFrame(charMap[char]);
          charSprites[i].visible = true;
          xPos += charWidth + charSpacing;
        }
      }
      
      // Hide any unused sprites
      for (let i = formattedValue.length; i < charSprites.length; i++) {
        charSprites[i].visible = false;
      }
    };
    
    // Function to complete the animation and show final amount
    const completeAnimation = () => {
      if (animationCompleted) return;
      
      animationCompleted = true;
      
      // Stop all tweens on the popup
      if (countUpTween) {
        countUpTween.stop();
      }
      
      // Stop the pulsing animation
      scene.tweens.killTweensOf(popup);
      
      // Set the popup to a fixed scale
      popup.setScale(0.8);
      
      // Update to final amount
      updateCharSprites(winAmount);
      
      // Play a completion sound
      scene.sounds.sfx_symbolsMatch.play();
      
      // Close popup after a delay
      scene.time.delayedCall(2000, () => {
        // Animate popup disappearance
        scene.tweens.add({
          targets: popup,
          scale: 0,
          duration: 300,
          ease: 'Back.in',
          onComplete: () => {
            popupContainer.destroy();
            resolve();
          }
        });
      });
    };
    
    // Play sound effect
    scene.sounds.sfx_symbolsMatch.play();
    
    // Make the entire popup clickable to skip animation
    overlay.setInteractive();
    popup.setInteractive();
    overlay.on('pointerdown', completeAnimation);
    popup.on('pointerdown', completeAnimation);
    
    // Set up initial sprites (hidden)
    setupInitialSprites();
    
    // Animate popup appearance
    scene.tweens.add({
      targets: popup,
      scale: 0.8,
      duration: 500,
      ease: 'Back.out',
      onComplete: () => {
        // Start with 0
        let currentValue = 0;
        updateCharSprites(currentValue);
        
        // Add pulsing animation to the popup
        scene.tweens.add({
          targets: popup,
          scale: { from: 0.75, to: 0.85 },
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Create count up tween with speed-based duration
        // Define count up speed (amount per second)
        const countUpSpeed = 5; // Adjust this value to control speed
        
        // Calculate duration based on win amount and speed (minimum 1000ms, maximum 8000ms)
        const calculatedDuration = Math.min(Math.max(winAmount / countUpSpeed * 1000, 1000), 15000);
        
        countUpTween = scene.tweens.addCounter({
          from: 0,
          to: winAmount,
          duration: calculatedDuration,
          ease: 'Sine.easeOut',
          onUpdate: (tween) => {
            currentValue = tween.getValue();
            updateCharSprites(currentValue);
          },
          onComplete: completeAnimation
        });
      }
    });
  });
}


function playLogoWaveAnimation(scene, logoParts) {
  const waveScale = 1.1;
  const duration = 200;
  const delayBetween = 100;

  logoParts.forEach((part, index) => {
    scene.tweens.add({
      targets: part,
      scaleX: waveScale,
      scaleY: waveScale,
      ease: 'Sine.easeOut',
      duration: duration,
      delay: index * delayBetween,
      yoyo: true,
    });
  });
}

/////////////////////////////////////////////////////// PLACE YOUR BETS/GOOD LUCK MESSAGE HELPER ///////////////////////////////////////////////////////
function setGameMessage(scene, message) {
  if (!scene.gameMessageText) return;
  scene.gameMessageText.setText(message).setVisible(!!message);
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
    
    // Show other UI elements
    this.cashButton.setVisible(true);
    this.cashButton.setInteractive(this.cashHitArea, Phaser.Geom.Circle.Contains);
    
    this.autoSpinBtnContainer.setVisible(true);
    this.autoSpinBtnContainer.setInteractive(this.autoSpinBtnHitArea, Phaser.Geom.Circle.Contains);
    
    this.buyFreeSpinsButton.setInteractive().setAlpha(1);
    this.anteBorder.setInteractive().setAlpha(1);
    this.anteBetSpriteContainer.setAlpha(1);
    this.anteToggleContainer.setAlpha(1);
    
    return;
  }

  // First time entering auto spins
  if (!this.isAutoSpinning) {
    this.isAutoSpinning = true;
    
    // Hide all UI buttons for the entire auto spin sequence
    this.spinButton.setVisible(false);
    this.spinButton.disableInteractive();
    
    this.cashButton.setVisible(false);
    this.cashButton.disableInteractive();
    
    this.autoSpinBtnContainer.setVisible(false);
    this.autoSpinBtnContainer.disableInteractive();
    
    this.buyFreeSpinsButton.disableInteractive().setAlpha(0.4);
    this.anteBorder.disableInteractive().setAlpha(0.4);
    this.anteBetSpriteContainer.setAlpha(0.5);
    this.anteToggleContainer.setAlpha(0.5);
    
    // Show autoplay UI and update count
    this.autoplaySpinUI.setVisible(true);
    this.autoplaySpinText.setText(this.autoSpinsRemaining);
  } else {
    // Just update the count for subsequent spins
    this.autoplaySpinText.setText(this.autoSpinsRemaining);
  }

  // Trigger normal spin
  this.spinButton.emit('pointerdown');

  const spinCompleteHandler = () => {
    this.spinButton.off('spinComplete', spinCompleteHandler);

    this.autoSpinsRemaining--;

    if (this.autoSpinsRemaining > 0) {
      this.time.delayedCall(500, () => {
        startAutoSpins.call(this);
      });
    } else {
      this.isAutoSpinning = false;

      // Hide autoplay UI
      this.autoplaySpinUI.setVisible(false);

      // Show regular spin button
      this.spinButton.setVisible(true);
      this.spinButton.setInteractive();
      
      // Show other UI elements
      this.cashButton.setVisible(true);
      this.cashButton.setInteractive(this.cashHitArea, Phaser.Geom.Circle.Contains);
      
      this.autoSpinBtnContainer.setVisible(true);
      this.autoSpinBtnContainer.setInteractive(this.autoSpinBtnHitArea, Phaser.Geom.Circle.Contains);
      
      this.buyFreeSpinsButton.setInteractive().setAlpha(1);
      this.anteBorder.setInteractive().setAlpha(1);
      this.anteBetSpriteContainer.setAlpha(1);
      this.anteToggleContainer.setAlpha(1);
    }
  };

  this.spinButton.once('spinComplete', spinCompleteHandler);
}

// Helper function to toggle Buy Free Spins and Ante UI visibility
function toggleBuyFreeSpinsAndAnteUI(show) {
  // Handle Buy Free Spins button
  this.buyFreeSpinsButton.setAlpha(show ? 1 : 0.4);
  if (show) {
    this.buyFreeSpinsButton.setInteractive();
  } else {
    this.buyFreeSpinsButton.disableInteractive();
  }
  
  // Handle Ante Bet UI
  this.anteBorder.setAlpha(show ? 1 : 0.4);
  this.anteBetSpriteContainer.setAlpha(show ? 1 : 0.5);
  this.anteToggleContainer.setAlpha(show ? 1 : 0.5);
  if (show) {
    this.anteBorder.setInteractive();
  } else {
    this.anteBorder.disableInteractive();
  }
}

// Helper function to toggle bet UI visibility
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////