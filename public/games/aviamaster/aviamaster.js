// Format currency amount helper function
function formatCurrencyAmount(amount, currency) {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  } else if (currency === 'LBP') {
    // Format LBP with commas and £ symbol
    return `£${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  return amount.toString();
}

// Function to create a smooth wind trail texture
function createSmoothWindTexture(scene) {
  if (!scene.textures.exists('smoothWind')) {
    const graphics = scene.add.graphics();
    
    // Create an ultra-smooth gradient trail
    const width = 60;
    const height = 10;
    
    // Clear any previous drawing
    graphics.clear();
    
    // Center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create multiple layers with decreasing opacity for a smoother gradient
    // Outermost layer (very faint)
    graphics.fillStyle(0xFFFFFF, 0.05);
    graphics.fillEllipse(centerX, centerY, width, height);
    
    // Middle layer
    graphics.fillStyle(0xFFFFFF, 0.1);
    graphics.fillEllipse(centerX, centerY, width * 0.8, height * 0.8);
    
    // Inner layer
    graphics.fillStyle(0xFFFFFF, 0.15);
    graphics.fillEllipse(centerX, centerY, width * 0.6, height * 0.6);
    
    // Core (still very transparent)
    graphics.fillStyle(0xFFFFFF, 0.25);
    graphics.fillEllipse(centerX, centerY, width * 0.3, height * 0.3);
    
    // Generate the texture
    graphics.generateTexture('smoothWind', width, height);
    
    // Clean up
    graphics.destroy();
  }
}

// === BET LIMITS ===
const BET_LIMITS = {
  USD: { min: 0.20, max: 1000 },
  LBP: { min: 10000, max: 100000000 },
};

const betSteps = {
  USD: [0.20, 0.50, 1.00, 1.50, 2.00, 2.50, 5.00, 10.00, 20.00, 50.00, 100.00, 200.00, 350, 500, 750, 1000],
  LBP: [10000, 25000, 50000, 75000, 100000, 125000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 20000000, 35000000, 50000000, 75000000, 100000000]
};


// ───  PHASER CONFIG ────────────────
const config = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  backgroundColor: '#222',
  parent: 'phaser-game',
  scale: {
    mode: Phaser.Scale.ENVELOP, // fills screen by cropping edges
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload,
    create,
    update // Adding update function for animation
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }
    }
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  }
};

const game = new Phaser.Game(config);



//////////////////////////////////// PHYSICS CONSTANTS ////////////////////////////////////

const DECIMAL_MULTIPLIER = 10000;  // Must be before pad()

// Physics constants in floating point (units per second or per second²)
const GRAVITY = 0.0005; // was 0.0006
const AIR_RESISTANCE = 0;  // Remove air resistance
const MAX_SPEED = 2;
const TILT_FACTOR = 0.002;  // Increased for more noticeable tilt
const LOGICAL_WIDTH = 1000;
const LOGICAL_HEIGHT = 600;

// Add minimum forward velocity constant
const MIN_FORWARD_SPEED = 0.4;  // Minimum forward speed to maintain

function pad(n) {
  return Math.round(n * DECIMAL_MULTIPLIER);
}

function unpad(n) {
  return n / DECIMAL_MULTIPLIER;
}

// Pre-pad the physics constants for fixed-point arithmetic (optional but recommended for performance)
const PADDED_GRAVITY = pad(GRAVITY);             // gravity scaled
const PADDED_AIR_RESISTANCE = pad(AIR_RESISTANCE);
const PADDED_MAX_SPEED = pad(MAX_SPEED);
const PADDED_TILT_FACTOR = TILT_FACTOR;          // keep tilt factor as float for rotation calculations
const PADDED_MIN_FORWARD_SPEED = pad(MIN_FORWARD_SPEED);

///////////////////////// Landing physics constants //////////////////////////

const LANDING_TOLERANCE_X = 220; // how close horizontally to count as "on ship"
const LANDING_TOLERANCE_Y = 10; // how close vertically to ship top to initiate landing
const LANDING_DECELERATION = 12.5; // rate of velocity reduction - increased by 10x
const MIN_LANDING_SPEED = 0.001; // reduced threshold for considering "landed"

const SHIP_DECK_OFFSET = 0.65; // Increased from 0.6 to move landing area down
const LANDING_X_OFFSET = 0; // Added offset to move landing area right

let landingTargetY = null;
let landingShip = null; // Store reference to the ship we're landing on


///////////////////////////////////// Plane class definition /////////////////////////////////

class Plane {
  constructor(x, y, sprite) {
    this.x = pad(x);
    this.y = pad(y);
    this.velocityX = pad(0);
    this.velocityY = pad(0);
    this.sprite = sprite;
  }
}

//////////////////////////////////// GLOBAL VARIABLES ////////////////////////////////////

// Sky scrolling
let skyGroup;
let skyImages = [];
let skyScrollSpeed = 0.05; // Adjust as needed

// Ships
let shipsGroup;
let ships = [];
let shipSpacing = 900; // Spacing between ships

// Ship animation
let tiltAngleMax = 1; // Max tilt angle in degrees
let tiltSpeed = 0.5;   // Tilt speed in degrees/sec

// Plane
let plane;             // Sprite only
let planeObject;       // Physics wrapper
let planeX, planeY;
let planeVX = pad(0);
let planeVY = pad(0);

let playButton;
let gameStarted = false;
let isRecording = false;

// Add to GLOBAL VARIABLES section
let camera;
let waterGroup;
let waterImages = [];
let debugRect;
let landingDebugRect; // Add this for landing collision debug
let initialPlaneX; // Store initial plane X position for distance calculation
let clouds = []; // Array to store cloud objects

// Add global variables for multipliers and rockets
let allMultipliers = []; // Make this global
let allRockets = []; // Make this global

// Particle emitters for plane trails
let smokeEmitter = null; // Smoke trail for rocket hits
let windEmitter = null;  // Wind trail for multiplier hits

// Bet amount text above plane
let betText = null;

// Add state variable for plane
let planeState = "idle";  // "idle", "walking", "flying", "landing", "landed", "crashed", "falling"
let walkSpeed = 2.5;        // Walking speed
let walkDistance = 80;   // Distance to walk before flying
let walkStartX = 0;       // Starting X position for walking
let waterSurfaceY = 0;    // Y position of water surface
let waterCrashOffset = 50;  // How far below water surface before crashing

// Add flag to track if it's the first game
let isFirstGame = true;

// Multipliers sets
let totalMultiplierSets = 0;

// Add tracking for multipliers and game results
let currentMultiplier = 1;  // Starting multiplier value (changed from 0 to 1)
let hitMultipliers = [];    // Track multipliers hit
let hitRockets = [];        // Track rockets hit
let gameResult = null;      // "landed" or "crashed"

//////////////////// Multiplier - Rockets layout 1 ////////////////////
// Layout sequence will be populated from backend
let layoutSequence = [];


// preload assets
function preload() {
  this.load.image('plane', 'aviamaster_assets/plane_idle.png');
  this.load.image('ship', 'aviamaster_assets/ship.png');
  this.load.image('water', 'aviamaster_assets/water_surface.jpg');
  this.load.image('sky', 'aviamaster_assets/top_sky.jpg');
  this.load.image('rocket', 'aviamaster_assets/rocket.png');
  this.load.image('splash', 'aviamaster_assets/splash.png');
  this.load.image('multiplier_1', 'aviamaster_assets/multiplier_numbers/1.png');
  this.load.image('multiplier_2', 'aviamaster_assets/multiplier_numbers/2.png');
  this.load.image('multiplier_3', 'aviamaster_assets/multiplier_numbers/3.png');
  this.load.image('multiplier_4', 'aviamaster_assets/multiplier_numbers/4.png');
  this.load.image('multiplier_5', 'aviamaster_assets/multiplier_numbers/5.png');
  this.load.image('multiplier_10', 'aviamaster_assets/multiplier_numbers/10.png');
  this.load.image('multiplier_15', 'aviamaster_assets/multiplier_numbers/15.png');
  this.load.image('multiplier_x', 'aviamaster_assets/multiplier_numbers/x.png');
  this.load.spritesheet('planeMotion', 'aviamaster_assets/plane_motion.png', { frameWidth: 154, frameHeight: 140 });
  this.load.image('smoke', 'aviamaster_assets/smoke.png');
  this.load.image('wind', 'aviamaster_assets/wind.png');
  this.load.image('multiplier_glow', 'aviamaster_assets/multiplier_glow.png');
  this.load.image('multiplier_explosion', 'aviamaster_assets/multiplier_explosion.png');
  this.load.image('rocket_explosion', 'aviamaster_assets/rocket_explosion.png');
  this.load.image('rocket_fire', 'aviamaster_assets/rocket_fire.png');
  this.load.image('play_button', 'aviamaster_assets/play_button.png');
  this.load.image('play_button_icon', 'aviamaster_assets/play_button_icon.png');
  this.load.image('stats_bar_bg', 'aviamaster_assets/stats_bar_bg.png');
  this.load.image('game_logo', 'aviamaster_assets/game_logo.png');
  this.load.image('cloud1', 'aviamaster_assets/cloud1.png');
  this.load.image('cloud2', 'aviamaster_assets/cloud2.png');
}

// create function
function create() {
  const screenWidth = this.scale.width;
  const screenHeight = this.scale.height;
  
  // Create the smooth wind texture
  createSmoothWindTexture(this);

  const centerX = screenWidth / 2;

  const gameContainer = this.add.container(0, 0);


  // === GAME LOGO ===
const logo = this.add.image(this.scale.width / 2, this.scale.height * 0.035, 'game_logo');
logo.setOrigin(0.5, 0);      // center horizontally, top-aligned vertically
logo.setScale(0.72);         // resize if needed
logo.setAlpha(0.2);          // subtle transparency
logo.setScrollFactor(0);     // 🔒 fix to screen, like the stats bar


  // === BACKGROUND RECTANGLE (BOTTOM COLOR BELOW WATER) ===
  const waterY = screenHeight * 0.55;
  waterSurfaceY = waterY; // Store water surface Y position globally
  const bgWidth = screenWidth * 30; // Make it extremely wide
  const bgHeight = screenHeight * 5; // Make it extremely tall
  
  const bg = this.add.rectangle(
    0, // Start at left edge, not far left
    waterY, 
    bgWidth, 
    bgHeight, // Much taller than screen
    0x0c1054
  ).setOrigin(0, 0);
  gameContainer.add(bg);

  // === SKY BACKGROUND RECTANGLE ===
  const skyBg = this.add.rectangle(
    0, // Start at left edge, not far left
    -screenHeight * 2, // Start far above
    bgWidth, 
    waterY + screenHeight * 2, // Much taller than screen
    0x18276b
  ).setOrigin(0, 0);
  gameContainer.add(skyBg);

// === SKY IMAGES ABOVE WATER (SCROLLING) ===
skyGroup = this.add.group();

const skyTexture = this.textures.get('sky');
const skyFrame = skyTexture.get();
const aspectRatio = skyFrame.width / skyFrame.height;

const skyDisplayWidth = screenWidth;
const skyDisplayHeight = skyDisplayWidth / aspectRatio + 80;

// Number of sky tiles to fully cover screen + extra for smooth scrolling
const skyTilesNeeded = Math.ceil((screenWidth * 30) / skyDisplayWidth) + 1;

for (let i = 0; i < skyTilesNeeded; i++) {
  const xPosition = i * skyDisplayWidth + skyDisplayWidth / 2;

  const sky = this.add.image(
    xPosition,
    waterY,
    'sky'
  ).setOrigin(0.5, 1)
    .setAlpha(0.7)
    .setDisplaySize(skyDisplayWidth, skyDisplayHeight);

  skyImages.push(sky);
  skyGroup.add(sky);
  gameContainer.add(sky);
}

// === CLOUDS IN SKY ===
// Create 12 clouds with random positions and speeds
for (let i = 0; i < 12; i++) {
  // Randomly choose cloud1 or cloud2
  const cloudTexture = Math.random() > 0.5 ? 'cloud1' : 'cloud2';
  
  // Random position across the width of the game world
  const x = Math.random() * (screenWidth * 30);
  
  // Position clouds much higher in the sky
  // Use waterY minus a larger value to move them up
  const y = waterY - skyDisplayHeight * 1.4 - Math.random() * skyDisplayHeight * 1.1;
  
  // Create cloud with random scale
  const scale = 0.2 + Math.random() * 0.3;
  const cloud = this.add.image(x, y, cloudTexture)
    .setOrigin(0.5, 0.5)
    .setScale(scale)
    .setAlpha(0.2); // Fixed lower opacity
  
  // Add to game container
  gameContainer.add(cloud);
  
  // Store cloud with its speed
  clouds.push({
    sprite: cloud,
    speed: 0.02 + Math.random() * 0.08 // Random speed
  });
}

// === WATER SURFACE (SCROLLING) ===
waterGroup = this.add.group();

const waterDisplayWidth = screenWidth;
const waterDisplayHeight = screenHeight * 0.02;

// Number of water tiles to fully cover screen + extra
const waterTilesNeeded = Math.ceil((screenWidth * 30) / waterDisplayWidth) + 1;

for (let i = 0; i < waterTilesNeeded; i++) {
  const xPosition = i * waterDisplayWidth + waterDisplayWidth / 2;

  const water = this.add.image(
    xPosition,
    waterY,
    'water'
  ).setOrigin(0.5, 0)
    .setDisplaySize(waterDisplayWidth, waterDisplayHeight);

  waterImages.push(water);
  waterGroup.add(water);
  gameContainer.add(water);
}

// === SHIPS ON WATER ===
shipsGroup = this.add.group();

const startX = centerX;
const screenWidthBuffer = screenWidth * 30;
const totalShipsNeeded = Math.ceil(screenWidthBuffer / shipSpacing);

for (let i = 0; i < totalShipsNeeded; i++) {
  const xPosition = startX + i * shipSpacing;

  const ship = this.add
    .image(xPosition, waterY, 'ship')
    .setOrigin(0.5, 0.65)
    .setScale(0.6);

  ship.tiltDirection = i % 2 === 0 ? 1 : -1;
  ship.rotation = Phaser.Math.DegToRad(ship.tiltDirection * tiltAngleMax / 2);

  // Unique ID
  ship.shipId = i;

  // Assign layoutName for all but shipId 0
  if (i > 0) {
    if (layoutSequence.length > 0) {
      ship.layoutName = layoutSequence[(i - 1) % layoutSequence.length];
    } else {
      // Default to layout1 if no layoutSequence is available
      ship.layoutName = 'layout1';
    }
    
    // Special handling for ships 6, 12, 18, etc. to ensure they have valid layouts
    if (i % 6 === 0) {
      // Force these ships to use layout1 (or any layout that works well)
      ship.layoutName = 'layout1';
    }
  }

  // Ensure hasLayout starts false
  ship.hasLayout = false;

  ships.push(ship);
  shipsGroup.add(ship);
  gameContainer.add(ship);

}




  // === PLANE WITH PHYSICS ===
  if (ships.length > 0) {
    const firstShip = ships[0];
    const planeX = firstShip.x - 100;
    const planeY = waterY - 32;  // Position above water
    
    initialPlaneX = planeX; // Store initial X position for distance calculation

    plane = this.add.sprite(planeX, planeY, 'plane')
      .setOrigin(0.5, 0.5)
      .setScale(0.6);
    gameContainer.add(plane);

    // Create plane animation from spritesheet
    this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers('planeMotion', { start: 0, end: 37 }),
      frameRate: 14,
      repeat: -1
    });

    // Create the plane object with physics
    planeObject = new Plane(planeX, planeY, plane);

    // Don't set initial velocity here - wait for play button
    planeObject.velocityX = pad(0);
    planeObject.velocityY = pad(0);
    
    // Initialize camera but don't start following yet
    camera = this.cameras.main;
  }



// Add semi-transparent background layer at bottom (23% of screen height)
const overlayHeight = this.scale.height * 0.23;

const bottomOverlay = this.add.rectangle(
  this.scale.width / 2,                    // center X
  this.scale.height - overlayHeight / 2,   // center Y for bottom area
  this.scale.width,                        // full screen width
  overlayHeight,                           // 23% of screen height
  0x000000,                                // black color
  0.3                                      // alpha = 0.3 (30% transparency)
);

bottomOverlay.setDepth(10).setScrollFactor(0); // Stick to screen


// Add stats bar image above the bottom overlay
const statsBar = this.add.image(
  this.scale.width / 2,
  this.scale.height - overlayHeight - 40,
  'stats_bar_bg'
);

statsBar.setOrigin(0.5).setDepth(11).setScale(1.4, 1.2).setAlpha(0.3).setScrollFactor(0);

// Add container to hold stats (so all texts move/scale together if needed)
const statsContainer = this.add.container(statsBar.x, statsBar.y);
statsContainer.setDepth(12).setScrollFactor(0); // Above stats bar

// ALTITUDE (left)
const altitudeLabel = this.add.text(-140, -14, 'ALTITUDE', {
  fontFamily: 'arial',
  fontSize: '18px',
  color: '#82849b'
}).setOrigin(0.5);

const altitudeValue = this.add.text(-140, 12, '0.0m', {
  fontFamily: 'arial',
  fontSize: '26px',
  color: '#ffffff'
}).setOrigin(0.5);

statsContainer.add([altitudeLabel, altitudeValue]);

// DISTANCE (center)
const distanceLabel = this.add.text(0, -14, 'DISTANCE', {
  fontFamily: 'Arial',
  fontSize: '18px',
  color: '#82849b'
}).setOrigin(0.5);

const distanceValue = this.add.text(0, 12, '0.0m', {
  fontFamily: 'Arial',
  fontSize: '26px',
  color: '#ffffff'
}).setOrigin(0.5);

statsContainer.add([distanceLabel, distanceValue]);

// Note: You can now move your third stat (e.g. multiplier) into this container aligned to the right side (e.g. +160 in x)

// MULTIPLIER (right)
const multiplierLabel = this.add.text(140, -14, 'MULTIPLIER', {
  fontFamily: 'Arial',
  fontSize: '18px',
  color: '#82849b'
}).setOrigin(0.5);

const multiplierDisplay = this.add.text(140, 12, '1.00x', {
  fontSize: '26px',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 3,
  align: 'center'
}).setOrigin(0.5);

statsContainer.add([multiplierLabel, multiplierDisplay]);





  // === BALANCE LABEL ===
const balanceLabel = this.add.text(
  85,
  this.scale.height - 105, // Positioned above balances
  'BALANCE',
  {
    fontSize: '24px',
    fontFamily: 'GatesFont',
    color: '#82839c', // Gray color
    align: 'left'
  }
).setOrigin(0, 0.5)
 .setDepth(100)
 .setScrollFactor(0);


  // === USER BALANCE DISPLAY ===
  // Create balance display at bottom of screen
  const balanceUSD = this.add.text(
    85,
    this.scale.height - 70,
    '$0.00',
    {
      fontSize: '26px',
      fontFamily: 'GatesFont',
      color: '#ffffff',
      align: 'left'
    }
  ).setOrigin(0, 0.5)
   .setDepth(100)
   .setScrollFactor(0); // Fix to camera view

  const balanceLBP = this.add.text(
    85,
    this.scale.height - 70, // Same Y position as USD
    '£0',
    {
      fontSize: '26px',
      fontFamily: 'GatesFont',
      color: '#ffffff',
      align: 'left'
    }
  ).setOrigin(0, 0.5)
   .setDepth(100)
   .setScrollFactor(0)
   .setVisible(false); // Initially hidden

  // Get bet amount and currency from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const currency = urlParams.get('currency') || 'USD';
  const betAmount = parseFloat(urlParams.get('bet') || BET_LIMITS[currency].min);
  
  // Set initial selected currency based on URL or default
  this.selectedCurrency = currency;
  
  // Show the appropriate balance display
  balanceUSD.setVisible(this.selectedCurrency === 'USD');
  balanceLBP.setVisible(this.selectedCurrency === 'LBP');
  
  // Create yellow text above plane showing bet amount
  if (plane) {
    const formattedBet = formatCurrencyAmount(betAmount, this.selectedCurrency);
    betText = this.add.text(
      plane.x, 
      plane.y - 50, 
      formattedBet,
      {
        fontSize: '24px',
        fontFamily: 'GatesFont',
        fontWeight: 'bold',
        color: '#ffe83d', // Yellow color
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(100); // High depth to ensure visibility
    
    // Add to game container
    gameContainer.add(betText);
  }

  // Add "Total Bet" label
const totalBetLabel = this.add.text(
  this.scale.width - 140,
  this.scale.height - 105, // Positioned above the current bet
  'TOTAL BET',
  {
    fontSize: '24px',
    fontFamily: 'GatesFont',
    color: '#82839c', // Gray color
    align: 'right'
  }
).setOrigin(1, 0.5)
 .setDepth(100)
 .setScrollFactor(0);


  // Add current bet display
  const currentBet = this.add.text(
    this.scale.width - 140,
    this.scale.height - 70,
    `${formatCurrencyAmount(betAmount, this.selectedCurrency)}`,
    {
      fontSize: '26px',
      fontFamily: 'GatesFont',
      color: '#ffffff',
      align: 'right'
    }
  ).setOrigin(1, 0.5)
   .setDepth(100)
   .setScrollFactor(0); // Fix to camera view

  // Add bet up/down buttons
// Up arrow (slightly smaller, still pointy)
const upArrow = this.add.triangle(
  this.scale.width - 100,
  this.scale.height - 115,
  0, 15,   // Left base
  15, 0,   // Tip
  30, 15,  // Right base
  0xffffff
).setOrigin(0.5)
 .setDepth(100)
 .setScrollFactor(0)
 .setInteractive({ useHandCursor: true });

// Down arrow (slightly smaller, still pointy)
const downArrow = this.add.triangle(
  this.scale.width - 100,
  this.scale.height - 65,
  0, 0,     // Left base
  15, 15,   // Tip
  30, 0,    // Right base
  0xffffff
).setOrigin(0.5)
 .setDepth(100)
 .setScrollFactor(0)
 .setInteractive({ useHandCursor: true });



  // Track current bet index in the steps array
  this.currentBetIndex = 0;
  
  // Find the initial bet index in the steps array
  const findInitialBetIndex = () => {
    const steps = betSteps[this.selectedCurrency];
    for (let i = 0; i < steps.length; i++) {
      if (Math.abs(steps[i] - betAmount) < 0.001) {
        return i;
      }
    }
    return 0; // Default to first step if not found
  };
  this.currentBetIndex = findInitialBetIndex();

  // Up arrow click handler
  upArrow.on('pointerdown', () => {
    const steps = betSteps[this.selectedCurrency];
    if (this.currentBetIndex < steps.length - 1) {
      this.currentBetIndex++;
      const newBet = steps[this.currentBetIndex];
      
      // Update bet display
      currentBet.setText(`${formatCurrencyAmount(newBet, this.selectedCurrency)}`);
      
      // Update URL parameters
      const url = new URL(window.location.href);
      url.searchParams.set('bet', newBet.toString());
      window.history.replaceState({}, '', url);
      
      // Flash effect
      this.tweens.add({
        targets: currentBet,
        alpha: { from: 0.5, to: 1 },
        duration: 200,
        ease: 'Linear'
      });
      
      // Update bet text above plane
      if (betText) {
        betText.setText(formatCurrencyAmount(newBet * currentMultiplier, this.selectedCurrency));
      }
    }
  });

  // Down arrow click handler
  downArrow.on('pointerdown', () => {
    const steps = betSteps[this.selectedCurrency];
    if (this.currentBetIndex > 0) {
      this.currentBetIndex--;
      const newBet = steps[this.currentBetIndex];
      
      // Update bet display
      currentBet.setText(`${formatCurrencyAmount(newBet, this.selectedCurrency)}`);
      
      // Update URL parameters
      const url = new URL(window.location.href);
      url.searchParams.set('bet', newBet.toString());
      window.history.replaceState({}, '', url);
      
      // Flash effect
      this.tweens.add({
        targets: currentBet,
        alpha: { from: 0.5, to: 1 },
        duration: 200,
        ease: 'Linear'
      });
      
      // Update bet text above plane
      if (betText) {
        betText.setText(formatCurrencyAmount(newBet * currentMultiplier, this.selectedCurrency));
      }
    }
  });

// Add currency switch button
const switchContainer = this.add.container(this.scale.width - 200, this.scale.height - 200);
switchContainer.setDepth(100).setScrollFactor(0);

// Background rectangle (bigger: 140x50)
const switchBg = this.add.rectangle(0, 40, 140, 50, 0x222222, 1);
switchContainer.add(switchBg);

// Divider line (height matches new bg height)
const divider = this.add.line(0, 40, 0, -0, 0, 45, 0x555555);
switchContainer.add(divider);

// Highlight rectangle (bigger: 70x50)
const highlight = this.add.rectangle(
  this.selectedCurrency === 'USD' ? -35 : 35, 
  40, 
  70, 
  50, 
  0x00b471, 
  0.6
).setOrigin(0.5);
switchContainer.add(highlight);


// USD side text (font size increased, same position)
const usdText = this.add.text(-35, 40, 'USD', {
  fontSize: '26px',
  fontFamily: 'Arial',
  color: '#ffffff',
  align: 'center'
}).setOrigin(0.5);
switchContainer.add(usdText);

// LBP side text (font size increased, same position)
const lbpText = this.add.text(35, 40, 'LBP', {
  fontSize: '26px',
  fontFamily: 'Arial',
  color: '#ffffff',
  align: 'center'
}).setOrigin(0.5);
switchContainer.add(lbpText);



   // Make the entire container interactive
   switchBg.setInteractive({ useHandCursor: true });
   
   // Create a reference to use as the switch button
   const switchCurrencyButton = switchBg;
   this.switchCurrencyButton = switchBg;
   
   // Add click handler for currency switch button
   switchCurrencyButton.on('pointerdown', () => {
     // Toggle selected currency
     this.selectedCurrency = this.selectedCurrency === 'USD' ? 'LBP' : 'USD';
     
     // Move highlight
     highlight.x = this.selectedCurrency === 'USD' ? -35 : 35;
     
     // Reset to minimum bet (index 0)
     this.currentBetIndex = 0;
     const minBet = betSteps[this.selectedCurrency][0];
     
     // Show the appropriate balance display
     balanceUSD.setVisible(this.selectedCurrency === 'USD');
     balanceLBP.setVisible(this.selectedCurrency === 'LBP');
     
     // Update bet display with minimum bet
     currentBet.setText(`${formatCurrencyAmount(minBet, this.selectedCurrency)}`);
     
     // Update URL parameters with new currency and bet amount
     const url = new URL(window.location.href);
     url.searchParams.set('currency', this.selectedCurrency);
     url.searchParams.set('bet', minBet.toString());
     window.history.replaceState({}, '', url);
     
     // Update bet text above plane
     if (betText) {
       betText.setText(formatCurrencyAmount(minBet * currentMultiplier, this.selectedCurrency));
     }
   });

  

  // Store references to balance displays
  this.balanceUSD = balanceUSD;
  this.balanceLBP = balanceLBP;
  this.currentBet = currentBet;
  this.multiplierDisplay = multiplierDisplay;
  this.switchCurrencyButton = switchCurrencyButton;
  this.upArrow = upArrow;
  this.downArrow = downArrow;
  
  // Initialize balance variables
  this.currentUSDBalance = 0;
  this.currentLBPBalance = 0;

  // Update balance display with current session data
  fetch('/auth/session')
    .then(response => response.json())
    .then(data => {
      if (data.balanceUSD !== undefined) {
        this.currentUSDBalance = data.balanceUSD;
        balanceUSD.setText(`${formatCurrencyAmount(this.currentUSDBalance, 'USD')}`);
      }
      if (data.balanceLBP !== undefined) {
        this.currentLBPBalance = data.balanceLBP;
        balanceLBP.setText(`${formatCurrencyAmount(this.currentLBPBalance, 'LBP')}`);
      }
    })
    .catch(error => console.error('Error fetching balance:', error));

  // Store references to stats displays
  this.altitudeValue = altitudeValue;
  this.distanceValue = distanceValue;

  //////////////////////   PLAY BUTTON   //////////////////////

 // === PLAY BUTTON ===
playButton = this.add.image(
  this.scale.width / 2,
  this.scale.height * 0.9,
  'play_button'
).setOrigin(0.5)
 .setScale(0.55)
 .setInteractive({ useHandCursor: true })
 .setDepth(10) // ensure it's above other UI
 .setScrollFactor(0); // Fix to camera view


 // === PLAY ICON IMAGE ===
const playIcon = this.add.image(
  playButton.x ,
  playButton.y,
  'play_button_icon'
).setOrigin(0.5)
 .setScale(0.65) // Adjust size to fit nicely on button
 .setDepth(playButton.depth + 1) // Ensure it's above the button
 .setScrollFactor(0); // Fix to camera view


// On click, start game
playButton.on('pointerdown', () => {
  // Get current bet amount from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const betAmount = parseFloat(urlParams.get('bet') || BET_LIMITS[this.selectedCurrency].min);
  // Use the selected currency from the scene
  const currency = this.selectedCurrency;

  // Disable button during processing
  playButton.disableInteractive();
 

  // Store scene reference
  const scene = this.scene || game.scene.scenes[0];

  // === Simulate balance deduction visually only ===
  // Get the main scene
  const mainScene = game.scene.scenes[0];
  if (currency === 'USD') {
    mainScene.currentUSDBalance = Math.max(0, mainScene.currentUSDBalance - betAmount);
    mainScene.balanceUSD.setText(`${formatCurrencyAmount(mainScene.currentUSDBalance, 'USD')}`);
  } else if (currency === 'LBP') {
    mainScene.currentLBPBalance = Math.max(0, mainScene.currentLBPBalance - betAmount);
    mainScene.balanceLBP.setText(`${formatCurrencyAmount(mainScene.currentLBPBalance, 'LBP')}`);
  }

  // === Fetch game layout (but not updating balance) ===
  fetch('/games/aviamaster/play', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ betAmount, currency }) // Send bet and selected currency
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => Promise.reject(err));
      }
      return response.json();
    })
    .then(data => {
      // Update layout sequence from backend response
      if (data.layoutSequence && data.layoutSequence.length > 0) {
        layoutSequence = data.layoutSequence;
        console.log("Using layout sequence from backend:", layoutSequence);

       
          restartGame();

          // Disable button during processing
          playButton.disableInteractive();
          switchCurrencyButton.disableInteractive();
          upArrow.disableInteractive();
          downArrow.disableInteractive();
        

        // Start the new game immediately
        if (planeObject) {
          gameStarted = true;
          planeState = "walking";
          walkStartX = planeObject.x;

          if (scene.multiplierDisplay) {
            scene.multiplierDisplay.setText('1.00x');
          }

          camera.startFollow(plane, true, 0.1, 0.1);
          camera.setFollowOffset(-200, 0);

          camera.setBounds(
            0,
            -game.scale.height * 2,
            bgWidth,
            bgHeight + game.scale.height * 2
          );

          
        }
      } else {
        console.error("No layout sequence received from backend");
        setTimeout(() => {
          playButton.setInteractive({ useHandCursor: true });
          switchCurrencyButton.setInteractive({ useHandCursor: true });
          upArrow.setInteractive({ useHandCursor: true });
          downArrow.setInteractive({ useHandCursor: true });
        }, 1000);
      }
    })
    .catch(error => {
      console.error('Error fetching game data:', error);
      setTimeout(() => {
        playButton.setInteractive({ useHandCursor: true });
        switchCurrencyButton.setInteractive({ useHandCursor: true });
        upArrow.setInteractive({ useHandCursor: true });
        downArrow.setInteractive({ useHandCursor: true });
      }, 1000);
    });
});


  // Set world bounds to only extend to the right
  this.physics.world.setBounds(
    0,  // Start at 0, not extending to the left
    -game.scale.height * 2,
    bgWidth, // Only extend to the right
    bgHeight + game.scale.height * 2
  );
// === Multiplier - Rockets  ===
// Adjust this to move multipliers/rockets above the ship (in pixels)
const verticalOffset = 400;

// We'll create multipliers and rockets on-demand in the update function
// This helps optimize performance by only creating elements when they're needed
}

// Update function for scrolling animation
function update(time, delta) {
  // Use fixed time step for deterministic behavior
  const dt = 16.67; // Fixed time step (60 FPS)
// === Sky Scrolling ===
if (skyImages.length >= 2) {
  for (let i = 0; i < skyImages.length; i++) {
    const image = skyImages[i];
    image.x -= skyScrollSpeed * (dt/16.67); // Scale by fixed time ratio

    // When sky goes off screen, move it to the right of the rightmost sky
    if (image.x <= -image.displayWidth / 2) {
      let rightmostImage = skyImages[0];
      for (let j = 1; j < skyImages.length; j++) {
        if (skyImages[j].x > rightmostImage.x) {
          rightmostImage = skyImages[j];
        }
      }
      image.x = rightmostImage.x + image.displayWidth;
    }
  }
}

// === Water Scrolling ===
if (waterImages.length >= 2) {
  for (let i = 0; i < waterImages.length; i++) {
    const image = waterImages[i];
    image.x -= skyScrollSpeed * (dt/16.67); // Scale by fixed time ratio

    // When water goes off screen, move it to the right of the rightmost water
    if (image.x <= -image.displayWidth / 2) {
      let rightmostImage = waterImages[0];
      for (let j = 1; j < waterImages.length; j++) {
        if (waterImages[j].x > rightmostImage.x) {
          rightmostImage = waterImages[j];
        }
      }
      image.x = rightmostImage.x + image.displayWidth;
    }
  }
}

// === Cloud Movement ===
// Move clouds at their individual speeds
for (let i = 0; i < clouds.length; i++) {
  const cloud = clouds[i];
  cloud.sprite.x -= cloud.speed * (dt/16.67);
  
  // When cloud goes off screen left, move it far to the right
  if (cloud.sprite.x < -cloud.sprite.displayWidth) {
    // Get right edge of game world
    const rightEdge = camera ? camera.scrollX + game.scale.width * 1.5 : game.scale.width * 30;
    
    // Place cloud at right edge plus some random distance
    cloud.sprite.x = rightEdge + Math.random() * 1000;
    
    // Keep clouds high in the sky when they reappear
    cloud.sprite.y = waterSurfaceY - skyDisplayHeight * 0.7 - Math.random() * skyDisplayHeight * 0.5;
  }
}

  // === INSIDE your scene.update() ===
// Ships should always tilt regardless of game state
ships.forEach((ship) => {
  // Update ship tilt animation
  const currentAngle = Phaser.Math.RadToDeg(ship.rotation);
  if (Math.abs(currentAngle) >= tiltAngleMax) {
    ship.tiltDirection *= -1;
  }
  ship.rotation += Phaser.Math.DegToRad(ship.tiltDirection * 0.01 * (dt/16.67));
});

if (gameStarted && camera && planeState !== "crashed") {
  const camL = camera.scrollX - camera.width * 0.5;
  const camR = camera.scrollX + camera.width * 1.5;

  ships.forEach((ship) => {
    // Update debug rectangle position
    if (debugRect) {
      debugRect.x = ship.x - (ship.displayWidth * 1 / 2);
      debugRect.y = ship.y - (ship.displayHeight * 0.01 - 20 / 2);
    }

    // Update landing debug rectangle position
    if (landingDebugRect) {
      const deckY = ship.y - ship.displayHeight * (1 - SHIP_DECK_OFFSET);
      landingDebugRect.x = ship.x + LANDING_X_OFFSET; // Added offset to move right
      landingDebugRect.y = deckY;
    }

    // Only handle ships going off the left edge (since we're only moving right)
    if (ship.x < camL - ship.width) {
      const rightmost = ships.reduce((a, b) => (a.x > b.x ? a : b));
      ship.x = rightmost.x + shipSpacing;
      ship.hasLayout = false;
      
      // Ensure all ships except ship 0 get a layout
      if (ship.shipId > 0) {
        // Always ensure we have a valid layout name before indexing
        if (layoutSequence.length > 0) {
          let currentIndex = 0;
          if (ship.layoutName && layoutSequence.includes(ship.layoutName)) {
            currentIndex = layoutSequence.indexOf(ship.layoutName);
          } else {
            // If no valid layout, assign based on ship ID
            currentIndex = (ship.shipId - 1) % layoutSequence.length;
          }
          
          // Get next layout in sequence
          const nextIndex = (currentIndex + 1) % layoutSequence.length;
          ship.layoutName = layoutSequence[nextIndex];
        } else {
          // Default to layout1 if no layoutSequence is available
          ship.layoutName = 'layout1';
        }
      }
    }

    // 2) ENTER VIEWPORT: build/update sprites exactly once
    const inView = ship.x > camL && ship.x < camR;
    if (inView && ship.shipId !== 0 && !ship.hasLayout) {
      updateMultipliersAndRockets(ship);
      ship.hasLayout = true;
    }

    // Ship tilt animation is now handled outside this block

    // Update landing zone position if it exists
    if (ship.landingZone) {
      const deckY = ship.y - ship.displayHeight * (1 - SHIP_DECK_OFFSET);
      ship.landingZone.x = ship.x;
      ship.landingZone.y = deckY;
      
      // Always update width in case LANDING_TOLERANCE_X changes
      ship.landingZone.width = LANDING_TOLERANCE_X * 2;
    }
  });
}


  // === Plane Physics Simulation (Only if game started) ===
  if (gameStarted && planeObject) {
    if (planeState === "walking") {
      // Walking phase - move right at constant speed
      planeObject.x += pad(walkSpeed * (dt/16.67)); // Scale by fixed time ratio
      
      // Check if we've walked far enough
      if (planeObject.x > walkStartX + pad(walkDistance)) {
        // Transition to flying
        planeState = "flying";
        
        // Give initial boost for takeoff
        planeObject.velocityX = pad(0.9);  // forward speed
        planeObject.velocityY = pad(-0.6); // upward jump
      }
      
      // Update plane sprite position
      plane.x = unpad(planeObject.x);
      plane.y = unpad(planeObject.y);
      
      // Update bet text position to follow plane
      if (betText) {
        betText.x = plane.x;
        betText.y = plane.y - 50;
      }
      
      // Update stats - distance and altitude
      const scene = game.scene.scenes[0];
      if (scene && scene.distanceValue) {
        // Calculate distance from initial plane position with 1 decimal place
        // Divide by 40 instead of 10 to show one-fourth of the actual distance
        const distance = Math.max(0, (plane.x - initialPlaneX) / 40);
        scene.distanceValue.setText(`${distance.toFixed(1)}m`);
      }
      if (scene && scene.altitudeValue) {
        // Calculate altitude starting from 0 at water level with 1 decimal place
        // Set to 0.0 if plane is walking, landing or landed
        const altitude = (planeState === "walking" || planeState === "landing" || planeState === "landed") ? 
          0.0 : Math.max(0, (waterSurfaceY - plane.y) / 10);
        scene.altitudeValue.setText(`${altitude.toFixed(1)}m`);
      }
    }
    else if (planeState === "flying" || planeState === "falling") {
      // === Physics ===
      planeObject.velocityY += PADDED_GRAVITY * dt * (dt/16.67);
      if (planeObject.velocityY > PADDED_MAX_SPEED) {
        planeObject.velocityY = PADDED_MAX_SPEED;
      }
    
      planeObject.x += planeObject.velocityX * dt * (dt/16.67);
      planeObject.y += planeObject.velocityY * dt * (dt/16.67);
    
      plane.x = unpad(planeObject.x);
      plane.y = unpad(planeObject.y);
      
      // Update bet text position to follow plane
      if (betText) {
        betText.x = plane.x;
        betText.y = plane.y - 50;
      }
      
      // Update stats - distance and altitude
      const scene = game.scene.scenes[0];
      if (scene && scene.distanceValue) {
        // Calculate distance from initial plane position with 1 decimal place
        // Divide by 40 instead of 10 to show one-fourth of the actual distance
        const distance = Math.max(0, (plane.x - initialPlaneX) / 40);
        scene.distanceValue.setText(`${distance.toFixed(1)}m`);
      }
      if (scene && scene.altitudeValue) {
        // Calculate altitude starting from 0 at water level with 1 decimal place
        // Set to 0.0 if plane is walking, landing or landed
        const altitude = (planeState === "walking" || planeState === "landing" || planeState === "landed") ? 
          0.0 : Math.max(0, (waterSurfaceY - plane.y) / 10);
        scene.altitudeValue.setText(`${altitude.toFixed(1)}m`);
      }
      
      // Play flying animation when in flying state
      if (!plane.anims.isPlaying) {
        plane.play('fly');
      }
    
      // === Check for ship left-side collision ===
      for (let ship of ships) {
        const shipLeftEdge = ship.x - (ship.displayWidth * 1 / 2);
        const shipTop = ship.y - (ship.displayHeight * 0.01 - 20 / 2);
        const shipBottom = ship.y + (ship.displayHeight * 0.6 / 2);

        // Check if plane is colliding with left side of ship
        if (plane.x < shipLeftEdge && 
            plane.x > shipLeftEdge - 20 && // Small buffer zone
            plane.y > shipTop && 
            plane.y < shipBottom) {
          // Move ship smoothly to the right using tween
          this.tweens.add({
            targets: ship,
            x: ship.x + 30,
            duration: 300, // Duration in milliseconds
            ease: 'Power2' // Smooth easing
          });
        }
      }
    
      // === Check if plane crashed into water ===
      if (plane.y > waterSurfaceY + waterCrashOffset) {
        planeState = "crashed";
        gameResult = "crashed";
        console.log("Plane crashed into water!");
        
        // Log final game results
        console.log(`Game over! Result: ${gameResult}`);
        console.log(`Final multiplier: ${currentMultiplier}x`);
        console.log(`Hit multipliers:`, hitMultipliers);
        console.log(`Hit rockets:`, hitRockets);
        
        // Create splash effect
        const splash = this.add.image(plane.x - 50, waterSurfaceY + 20, 'splash')
          .setOrigin(0.5, 0.5)
          .setScale(0.5);
        
        // Animate splash
        this.tweens.add({
          targets: splash,
          scale: 2,
          alpha: 0,
          duration: 1000,
          onComplete: () => {
            splash.destroy();
          }
        });
        
        // Hide plane instantly
        plane.visible = false;
        
        // Hide bet text
        if (betText) {
          betText.visible = false;
        }
        
        // Clean up particle emitters
        if (windEmitter) {
          windEmitter.stop();
          windEmitter = null;
        }
        if (smokeEmitter) {
          smokeEmitter.stop();
          smokeEmitter = null;
        }
        
        // Auto-reset after 3 seconds
        autoResetGame(this, 3000);
        
        return; // Skip the rest of the update for this frame
      }
    
      // === Angle Rotation ===
      const velocityX = unpad(planeObject.velocityX);
      const velocityY = unpad(planeObject.velocityY);
      const targetAngle = Math.atan2(velocityY, velocityX);
      
      // Use different rotation speeds based on state
      const rotationSpeed = (planeState === "falling") ? 0.1 : 0.4;
      plane.rotation = Phaser.Math.Linear(plane.rotation, targetAngle, rotationSpeed);
      
      // If we've been falling for a while, transition back to normal flying
      if (planeState === "falling" && planeObject.velocityY > pad(0.3)) {
        planeState = "flying";
      }
    
      // === Check for landing eligibility ===
      for (let ship of ships) {
        const deckY = ship.y - ship.displayHeight * (1 - SHIP_DECK_OFFSET);
        const dx = Math.abs(plane.x - (ship.x + LANDING_X_OFFSET)); // Added offset to move right
        const dy = Math.abs(plane.y - deckY);
    
        if (dx < LANDING_TOLERANCE_X && dy < LANDING_TOLERANCE_Y && planeObject.velocityY >= 0) {
          planeState = "landing";
          landingTargetY = pad(deckY); // Remember where to land
          landingShip = ship; // Store reference to the ship we're landing on
          break;
        }
      }
    }
    
    else if (planeState === "landing") {
      // Apply deceleration but keep some forward momentum
      const decelRate = LANDING_DECELERATION * dt * (dt/16.67);
      planeObject.velocityX = Math.max(0, planeObject.velocityX - decelRate);
      
      // Stop the flying animation when landing
      if (plane.anims.isPlaying) {
        plane.anims.stop();
        plane.setTexture('plane');
      }
      
      // Stop any active trail emitters when landing
      if (windEmitter) {
        windEmitter.stop();
        windEmitter = null;
      }
      if (smokeEmitter) {
        smokeEmitter.stop();
        smokeEmitter = null;
      }
      
      // Continue moving forward with decreasing velocity
      planeObject.x += planeObject.velocityX * dt * (dt/16.67);
      
      // Check if plane has moved off the edge of the ship
      if (landingShip) {
        const shipWidth = landingShip.displayWidth * 0.93; // Adjust based on ship scale
        const distanceFromShip = Math.abs(unpad(planeObject.x) - landingShip.x);
        
        // If plane moves too far from ship center, it falls off
        if (distanceFromShip > shipWidth / 2) {
          console.log("Plane fell off the ship!");
          planeState = "falling"; // Use falling state instead of flying
          planeObject.velocityY = pad(0.03); // Very small initial downward velocity for gradual tipping
          
          // Ensure minimum forward velocity when falling off
          if (planeObject.velocityX < pad(0.05)) {
            planeObject.velocityX = pad(0.05); // Minimum forward velocity
          }
          
          landingShip = null;
          landingTargetY = null;
        }
      }
      
      // If still in landing state, continue landing process
      if (planeState === "landing") {
        planeObject.velocityY = 0;
        
        // Gradually descend to the ship deck Y level
        if (landingTargetY !== null) {
          planeObject.y = Phaser.Math.Linear(planeObject.y, landingTargetY, 0.1);
        }
        
        // Level out plane rotation gradually
        plane.rotation = Phaser.Math.Linear(plane.rotation, 0, 0.1);
        
        // Check if velocity is low enough to consider landed
        if (planeObject.velocityX <= pad(MIN_LANDING_SPEED)) {
          planeObject.velocityX = 0;
          planeState = "landed";
          gameResult = "landed";
          
          // Stop any active trail emitters
          if (windEmitter) {
            windEmitter.stop();
            windEmitter = null;
          }
          if (smokeEmitter) {
            smokeEmitter.stop();
            smokeEmitter = null;
          }
          
          // Add the plane to the ship so it tilts with it
          if (landingShip) {
            // Store original plane position relative to ship
            plane.shipOffsetX = plane.x - landingShip.x;
            plane.shipOffsetY = plane.y - landingShip.y;
            landingShip.planeAttached = true;
          }
          
          console.log("Plane has successfully landed!");
          
          // Log final game results
          console.log(`Game over! Result: ${gameResult}`);
          console.log(`Final multiplier: ${currentMultiplier}x`);
          console.log(`Hit multipliers:`, hitMultipliers);
          console.log(`Hit rockets:`, hitRockets);
          
          // Update balance on successful landing
          const urlParams = new URLSearchParams(window.location.search);
          // Get the main scene and use its selected currency
          const mainScene = game.scene.scenes[0];
          const currency = mainScene.selectedCurrency;
          const betAmount = parseFloat(urlParams.get('bet') || BET_LIMITS[currency].min);
          const winAmount = betAmount * currentMultiplier;
          
          // Update the balance display with win amount
          if (currency === 'USD') {
            mainScene.currentUSDBalance += winAmount;
            mainScene.balanceUSD.setText(`${formatCurrencyAmount(mainScene.currentUSDBalance, 'USD')}`);
          } else if (currency === 'LBP') {
            mainScene.currentLBPBalance += winAmount;
            mainScene.balanceLBP.setText(`${formatCurrencyAmount(mainScene.currentLBPBalance, 'LBP')}`);
          }
          
          // Auto-reset after 3 seconds
          autoResetGame(this.scene, 3000);
        }
      }
      
      // Update sprite position
      plane.x = unpad(planeObject.x);
      plane.y = unpad(planeObject.y);
      
      // Update bet text position to follow plane
      if (betText) {
        betText.x = plane.x;
        betText.y = plane.y - 50;
      }
      
      // Update stats - distance and altitude
      const scene = game.scene.scenes[0];
      if (scene && scene.distanceValue) {
        // Calculate distance from initial plane position with 1 decimal place
        // Divide by 40 instead of 10 to show one-fourth of the actual distance
        const distance = Math.max(0, (plane.x - initialPlaneX) / 40);
        scene.distanceValue.setText(`${distance.toFixed(1)}m`);
      }
      if (scene && scene.altitudeValue) {
        // Calculate altitude starting from 0 at water level with 1 decimal place
        // Set to 0.0 if plane is walking, landing or landed
        const altitude = (planeState === "walking" || planeState === "landing" || planeState === "landed") ? 
          0.0 : Math.max(0, (waterSurfaceY - plane.y) / 10);
        scene.altitudeValue.setText(`${altitude.toFixed(1)}m`);
      }
    }
    
    else if (planeState === "landed") {
      plane.velocityX = 0;
      
      // Ensure animation is stopped in landed state
      if (plane.anims.isPlaying) {
        plane.anims.stop();
        plane.setTexture('plane');
      }
      
      if (landingTargetY !== null) {
        planeObject.y = landingTargetY;
        plane.y = unpad(landingTargetY);
      }
      
      // Make plane tilt with the ship
      if (landingShip && landingShip.planeAttached) {
        plane.rotation = landingShip.rotation;
        // Update plane position to follow ship
        plane.x = landingShip.x + plane.shipOffsetX;
        plane.y = landingShip.y + plane.shipOffsetY;
      } else {
        plane.rotation = 0;
      }
    }
    
    
    
  }

  // Simple collision detection for multipliers and rockets
  if (gameStarted && (planeState === "flying" || planeState === "falling") && plane.visible) {
    const planeX = plane.x;
    const planeY = plane.y;
    const hitDistance = 50; // Simple collision radius
    
    // Check collisions with multipliers
    for (let i = 0; i < allMultipliers.length; i++) {
      const multiplier = allMultipliers[i];
      if (!multiplier.visible) continue; // Skip if already collected
      
      // Simple distance check
      const distance = Phaser.Math.Distance.Between(planeX, planeY, multiplier.x, multiplier.y);
      if (distance < hitDistance) {
        // Gain altitude - apply upward velocity
        planeObject.velocityY = pad(-0.3); // Upward boost
        multiplier.visible = false; // Hide multiplier after collection
        
        // Get multiplier value and type
        const multiplierValue = multiplier.multiplierValue;
        const multiplierType = multiplier.multiplierType;
        
        // Apply multiplier based on type
        if (multiplierType === 'mult') {
          // Multiply the current total
          currentMultiplier = currentMultiplier * multiplierValue;
        } else {
          // Add to the current total
          currentMultiplier += multiplierValue;
        }
        
        // Round to 2 decimal places
        currentMultiplier = Math.round(currentMultiplier * 100) / 100;
        
        // Update multiplier display
        const scene = game.scene.scenes[0];
        if (scene && scene.multiplierDisplay) {
          scene.multiplierDisplay.setText(`${currentMultiplier.toFixed(2)}x`);
          
          // Flash effect on multiplier change
          scene.tweens.add({
            targets: scene.multiplierDisplay,
            scale: { from: 1.5, to: 1 },
            duration: 300,
            ease: 'Bounce.easeOut'
          });
          
          // Update bet text with new multiplier value
          if (betText) {
            const urlParams = new URLSearchParams(window.location.search);
            const betAmount = parseFloat(urlParams.get('bet') || BET_LIMITS[scene.selectedCurrency].min);
            const formattedBet = formatCurrencyAmount(betAmount * currentMultiplier, scene.selectedCurrency);
            betText.setText(formattedBet);
          }
          
          // Create floating text based on multiplier type
          if (multiplierType === 'mult') {
            createFloatingText(scene, plane.x, plane.y - 50, `x${multiplierValue}`, '#00e53d');
          } else {
            createFloatingText(scene, plane.x, plane.y - 50, `+${multiplierValue}`, '#00e53d');
          }
        }
        
        // Create explosion effect at multiplier position
        const explosion = scene.add.particles(multiplier.x, multiplier.y, 'multiplier_explosion', {
          lifespan: 800,
          speed: { min: 50, max: 150 },
          scale: { start: 0.7, end: 0.15 },
          rotate: { start: 0, end: 359 },
          alpha: { start: 0.8, end: 0 },
          blendMode: 'ADD',
          quantity: 15,
          emitting: false
        });
        
        // Emit all particles at once
        explosion.explode(15);
        
        // Clean up the explosion after it's done
        scene.time.delayedCall(800, () => {
          explosion.destroy();
        });
        
        // Create wind trail effect
        if (smokeEmitter) {
          smokeEmitter.stop();
          smokeEmitter = null;
        }
        
        // Always recreate the wind emitter for better visibility
        if (windEmitter) {
          windEmitter.stop();
          windEmitter = null;
        }
        
        windEmitter = scene.add.particles(0, 0, 'smoothWind', {
          lifespan: 250,
          speed: { min: 35, max: 65 },
          scale: { start: 1.2 , end: 0 }, // Completely fade out scale
          alpha: { start: 0.15, end: 0 }, // Much lower starting alpha
          angle: { min: 170, max: 190 }, // Very focused angle for smoother trail
          frequency: 10, // Emit very frequently for ultra-smooth trail
          quantity: 1,
          follow: plane,
          followOffset: { x: -40, y: 5 }, // Even closer to plane
          blendMode: 'ADD', // Add blend mode for a subtle glow
          tint: 0xFFFFFF, // Pure white
          // Add ease functions for smoother transitions
          scaleEase: 'Sine.easeOut',
          alphaEase: 'Quad.easeOut'
        });
        const gameContainer = scene.children.list.find(c => c.type === 'Container');
        if (gameContainer) gameContainer.add(windEmitter);
        
        // Track hit multiplier
        hitMultipliers.push({
          value: multiplierValue,
          type: multiplierType,
          x: multiplier.x,
          y: multiplier.y,
          time: Date.now()
        });
        
        console.log(`Hit ${multiplierType === 'mult' ? 'multiplier' : 'adder'}: ${multiplierValue}${multiplierType === 'mult' ? 'x' : ''}, Current total: ${currentMultiplier}x`);
      }
    }
    
    // Check collisions with rockets
    for (let i = 0; i < allRockets.length; i++) {
      const rocket = allRockets[i];
      if (!rocket.visible) continue; // Skip if already collected
      
      // Simple distance check
      const distance = Phaser.Math.Distance.Between(planeX, planeY, rocket.x, rocket.y);
      if (distance < hitDistance) {
        // Lose altitude - apply downward velocity
        planeObject.velocityY = pad(0.3); // Downward force
        rocket.visible = false; // Hide rocket after collection
        
        // Cut multiplier in half
        currentMultiplier = currentMultiplier / 2;
        currentMultiplier = Math.round(currentMultiplier * 100) / 100; // Round to 2 decimal places
        
        // Update multiplier display
        const scene = game.scene.scenes[0];
        if (scene && scene.multiplierDisplay) {
          scene.multiplierDisplay.setText(`${currentMultiplier.toFixed(2)}x`);
          
          // Flash effect on multiplier change (red for rockets)
          scene.tweens.add({
            targets: scene.multiplierDisplay,
            scale: { from: 1.5, to: 1 },
            duration: 300,
            ease: 'Bounce.easeOut'
          });
          
          // Update bet text with new multiplier value
          if (betText) {
            const urlParams = new URLSearchParams(window.location.search);
            const betAmount = parseFloat(urlParams.get('bet') || BET_LIMITS[scene.selectedCurrency].min);
            const formattedBet = formatCurrencyAmount(betAmount * currentMultiplier, scene.selectedCurrency);
            betText.setText(formattedBet);
          }
          
          // Create floating text for rocket hit
          createFloatingText(scene, plane.x, plane.y - 50, `/2`, '#ff3333');
        }
        
        // Create explosion effect at rocket position
        const explosion = scene.add.particles(rocket.x, rocket.y, 'rocket_explosion', {
          lifespan: 800,
          speed: { min: 50, max: 150 },
          scale: { start: 1.2, end: 0.35 },
          rotate: { start: 0, end: 359 },
          alpha: { start: 0.8, end: 0 },
          blendMode: 'ADD',
          quantity: 15,
          emitting: false
        });
        
        // Emit all particles at once
        explosion.explode(15);
        
        // Create fire effect at rocket position
        const fireEffect = scene.add.particles(rocket.x, rocket.y, 'rocket_fire', {
          lifespan: 600,
          speed: { min: 30, max: 100 },
          scale: { start: 0.5, end: 0.1 },
          alpha: { start: 0.8, end: 0 },
          blendMode: 'ADD',
          quantity: 10,
          emitting: false
        });
        
        // Emit all fire particles at once
        fireEffect.explode(10);
        
        // Clean up the effects after they're done
        scene.time.delayedCall(800, () => {
          explosion.destroy();
          fireEffect.destroy();
        });
        
        // Create smoke trail effect
        if (windEmitter) {
          windEmitter.stop();
          windEmitter = null;
        }
        
        // Always recreate the smoke emitter for better visibility
        if (smokeEmitter) {
          smokeEmitter.stop();
          smokeEmitter = null;
        }
        
        smokeEmitter = scene.add.particles(0, 0, 'smoke', {
          lifespan: 2000,
          speed: { min: 20, max: 50 },
          scale: { start: 0.5, end: 10 },
          alpha: { start: 0.8, end: 0 },
          rotate: { min: 0, max: 360 },
          frequency: 30, // Emit more particles
          quantity: 2,   // Emit 2 particles at once
          follow: plane,
          followOffset: { x: -30, y: 0 }
        });
        const gameContainer = scene.children.list.find(c => c.type === 'Container');
        if (gameContainer) gameContainer.add(smokeEmitter);
        
        // Track hit rocket
        hitRockets.push({
          x: rocket.x,
          y: rocket.y,
          time: Date.now()
        });
        
        console.log(`Hit rocket! Multiplier halved to: ${currentMultiplier}x`);
      }
    }
  }
}



////////////////////// Start game helper //////////////////////
function startGame() {
  if (gameStarted) return;

  gameStarted = true;
  

  // Initialize the plane velocity on planeObject (same as play button)
  planeObject.velocityX = pad(0.8);
  planeObject.velocityY = pad(-0.7);

  // Start camera follow (if needed)
  camera.startFollow(plane, true, 0.1, 0.1);
  camera.setFollowOffset(-200, 0);
}

// Function to handle game restart after crash
function restartGame() {
  // Reset plane state
  planeState = "idle";
  
  // Reset camera position - move back to start
  if (camera) {
    camera.stopFollow();
    camera.scrollX = 0;
    camera.scrollY = 0;
  }
  
  // Reset multiplier display value
  const scene = game.scene.scenes[0];
  if (scene && scene.multiplierDisplay) {
    scene.multiplierDisplay.setText('1.00x');
  }
  
  // Reset altitude and distance values
  if (scene && scene.altitudeValue) {
    scene.altitudeValue.setText('0.0m');
  }
  if (scene && scene.distanceValue) {
    scene.distanceValue.setText('0.0m');
  }
  
  // Re-enable play button and make sure it's interactive
  if (playButton) {
    playButton.setInteractive({ useHandCursor: true });
  }
  
  // Re-enable currency and bet buttons
  if (scene.switchCurrencyButton) scene.switchCurrencyButton.setInteractive({ useHandCursor: true });
  if (scene.upArrow) scene.upArrow.setInteractive({ useHandCursor: true });
  if (scene.downArrow) scene.downArrow.setInteractive({ useHandCursor: true });
  
  // Reset game state
  gameStarted = false;
  landingTargetY = null;
  landingShip = null;
  
  // Reset multiplier tracking
  currentMultiplier = 1;  // Reset to 1 instead of 0
  hitMultipliers = [];
  hitRockets = [];
  gameResult = null;
  
  // Update bet text to show initial bet amount
  if (betText) {
    const urlParams = new URLSearchParams(window.location.search);
    const betAmount = parseFloat(urlParams.get('bet') || BET_LIMITS[scene.selectedCurrency].min);
    const formattedBet = formatCurrencyAmount(betAmount, scene.selectedCurrency);
    betText.setText(formattedBet);
    betText.visible = true;
  }
  
  // Completely reset ship positions
  const screenWidth = game.scale.width;
  const centerX = screenWidth / 2;
  const waterY = waterSurfaceY;
  
  ships.forEach((ship, i) => {
    // Reset position
    ship.x = centerX + i * shipSpacing;
    ship.y = waterY;
    
    // Reset rotation
    ship.tiltDirection = i % 2 === 0 ? 1 : -1;
    ship.rotation = Phaser.Math.DegToRad(ship.tiltDirection * tiltAngleMax / 2);
    
    // Reset layout assignment
    ship.hasLayout = false;
    if (i > 0) {
      if (layoutSequence.length > 0) {
        ship.layoutName = layoutSequence[(i - 1) % layoutSequence.length];
      } else {
        // Default to layout1 if no layoutSequence is available
        ship.layoutName = 'layout1';
      }
      
      // Special handling for ships 6, 12, 18, etc. to ensure they have valid layouts
      if (i % 6 === 0) {
        // Force these ships to use layout1 (or any layout that works well)
        ship.layoutName = 'layout1';
      }
    }
  });
  
  // Reset plane position and properties
  if (plane && ships.length > 0) {
    const firstShip = ships[0];
    const planeX = firstShip.x - 100;
    const planeY = waterY - 32;
    
    // Update initial plane X for distance calculation
    initialPlaneX = planeX;
    
    plane.visible = true;
    plane.rotation = 0;
    plane.x = planeX;
    plane.y = planeY;
    
    // Make sure to stop any animations and reset to default texture
    if (plane.anims.isPlaying) {
      plane.anims.stop();
    }
    plane.setTexture('plane');
    
    planeObject.x = pad(planeX);
    planeObject.y = pad(planeY);
    planeObject.velocityX = pad(0);
    planeObject.velocityY = pad(0);
    
    // Update bet text position to follow the reset plane position
    if (betText) {
      betText.x = planeX;
      betText.y = planeY - 50;
      betText.visible = true;
    }
  }
  
  // Reset all multipliers and rockets
  allMultipliers.forEach(m => m.visible = false);
  allRockets.forEach(r => r.visible = false);
  
  // Clean up particle emitters
  if (windEmitter) {
    windEmitter.stop();
    windEmitter = null;
  }
  if (smokeEmitter) {
    smokeEmitter.stop();
    smokeEmitter = null;
  }
  
  console.log("Game fully reset to initial state");
}

// Function to auto-reset the game after a delay
function autoResetGame(scene, delayMs) {
  // Always use the main scene to be safe
  const mainScene = game.scene.scenes[0];
  
  // Wait for the specified delay, then reset the game
  mainScene.time.delayedCall(delayMs, () => {
    // First ensure animations are stopped
    if (plane && plane.anims.isPlaying) {
      plane.anims.stop();
      plane.setTexture('plane');
    }
    
    // Call the main reset function
    restartGame();
    
    // Ensure we know this isn't the first game anymore
    isFirstGame = false;
    
    // Extra safety: ensure play button is interactive
    if (playButton) {
      playButton.setInteractive({ useHandCursor: true });
    }

  });
}

// Helper function to update multipliers and rockets for a ship
function updateMultipliersAndRockets(ship) {
  // Skip ship 0 (no layout)
  if (!ship.layoutName) return;

  const layout = layouts[ship.layoutName];
  if (!layout) return;

  const verticalOffset = 400;
  const baseX = ship.x - layout.width / 2;
  const baseY = ship.y - verticalOffset;

  // — Multipliers —
  const existingMuls = allMultipliers.filter(m =>
    m.layoutName === ship.layoutName && m.shipId === ship.shipId
  );

  if (existingMuls.length === layout.multipliers.length) {
    // reposition & show
    layout.multipliers.forEach((mul, idx) => {
      const m = existingMuls[idx];
      m.visible = true;
      m.x = baseX + mul.x;
      m.y = baseY + (mul.y - layout.multipliers[0].y);
    });
  } else {
    // create new
    layout.multipliers.forEach((mul) => {
      const mulX = baseX + mul.x;
      const mulY = baseY + (mul.y - layout.multipliers[0].y);

      // Create a container for the multiplier
      const container = game.scene.scenes[0].add.container(mulX, mulY);
      
      // Add glow effect underneath
      const glowImg = game.scene.scenes[0].add.image(0, 0, 'multiplier_glow');
      glowImg.setScale(0.5);
      glowImg.setAlpha(0.7);
      glowImg.setBlendMode(Phaser.BlendModes.ADD);
      container.add(glowImg);
      
      // Add pulsing animation to the glow
      game.scene.scenes[0].tweens.add({
        targets: glowImg,
        scale: { from: 0.45, to: 0.55 },
        alpha: { from: 0.6, to: 0.8 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Add the number image
      const numberImg = game.scene.scenes[0].add.image(0, 0, `multiplier_${mul.value}`);
      numberImg.setScale(0.6);

      // Add number to the container
      container.add(numberImg);
      
      // Add the 'x' image slightly to the right, but only for 'mult' type
      if (mul.type === 'mult') {
        const xImg = game.scene.scenes[0].add.image(numberImg.displayWidth * 0.6, 0, 'multiplier_x');
        xImg.setScale(0.5);
        container.add(xImg);
      }
      
      // Store the multiplier value and type in the container
      container.multiplierValue = mul.value;
      container.multiplierType = mul.type;
      container.layoutName = ship.layoutName;
      container.shipId = ship.shipId;
      
      allMultipliers.push(container);
      
      // Add to game container if it exists
      const gameContainer = game.scene.scenes[0].children.list.find(c => c.type === 'Container');
      if (gameContainer) gameContainer.add(container);
    });
  }

  // — Rockets —
  const existingRocks = allRockets.filter(r =>
    r.layoutName === ship.layoutName && r.shipId === ship.shipId
  );

  if (existingRocks.length === layout.rockets.length) {
    layout.rockets.forEach((rock, idx) => {
      const r = existingRocks[idx];
      r.visible = true;
      r.x = baseX + rock.x;
      r.y = baseY + (rock.y - layout.rockets[0].y);
    });
  } else {
    layout.rockets.forEach((rock) => {
      const x = baseX + rock.x;
      const y = baseY + (rock.y - layout.rockets[0].y);

      const img = game.scene.scenes[0].add
        .image(x, y, 'rocket')
        .setOrigin(0.5)
        .setScale(0.5);

      img.layoutName = ship.layoutName;
      img.shipId = ship.shipId;
      allRockets.push(img);

      const container = game.scene.scenes[0].children.list.find(c => c.type === 'Container');
      if (container) container.add(img);
    });
  }
}

// Function to create floating text above the bet text
function createFloatingText(scene, x, y, text, color) {
  // Position in the center of the screen
  const floatingText = scene.add.text(
    game.scale.width / 2,
    game.scale.height / 2, // Position in middle of screen
    text,
    {
      fontSize: '36px',
      fontFamily: 'GatesFont',
      fontWeight: 'bold',
      color: color,
      align: 'center'
    }
  ).setOrigin(0.5).setDepth(101).setScrollFactor(0); // Fixed to camera view
  
  // Animation to fade out and move up
  scene.tweens.add({
    targets: floatingText,
    y: game.scale.height / 2 - 80, // Move up
    alpha: 0.4,
    duration: 800,
    ease: 'Power1',
    onComplete: () => {
      floatingText.destroy(); // Remove when animation completes
    }
  });
  
  return floatingText;
}


