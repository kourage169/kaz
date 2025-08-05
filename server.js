const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require('http'); // for ws
const WebSocket = require('ws'); // for ws


const app = express();
const server = http.createServer(app); // create a real HTTP server

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static files ---
app.use(express.static(path.join(__dirname, 'public')));

//  --- Coingecko Api Key  ---
const coingeckoApiKey = 'CG-zuFhdxSAxBDQ17p2by3QLTHb	';

// --- MongoDB connection ---
const mongoURI = 'mongodb+srv://kourage169:aAxzp4VXYR2lEHnv@cluster0.nm6z751.mongodb.net/gameusers?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', (err) => console.error('MongoDB connection error:', err));
db.once('open', () => {
  console.log('Successfully connected to MongoDB Atlas');
});

// --- Sessions ---
app.use(session({
  secret: '09c9619dfe006a39c8e2373e1de73eae3b146102754b464aa0b373a0f897d0d3c40ffc1ccdd9facc672cc6244156c4b7a9f1ca4c7d78346edf6e266c6988d',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI,  // Use the same DB URI as your app
    ttl: 14 * 24 * 60 * 60,  // Session TTL (14 days in seconds)
  }),
}));

// --- WebSocket Server ---
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🔌 New WebSocket client connected');

  // Send welcome message
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to server' }));

  ws.on('message', (msg) => {
    console.log('📩 Received:', msg);
    // You can parse and broadcast messages here if needed
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('❌ WebSocket client disconnected');
  });
});

// Broadcast function to send data to all connected clients
app.set('wssBroadcast', function broadcast(data) {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
});


//////////////////////////////////////////////////////////// Routes /////////////////////////////////////////////////////////////////////////////

// --- Routes ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const superAgentRoutes = require('./routes/superagent');
const agentRoutes = require('./routes/agent');
const betHistoryRoutes = require('./routes/betHistory');


const coinflipRoutes = require('./routes/coinflip');
const bingoRoutes = require('./routes/bingo');
const pumpRoutes = require('./routes/pump');
const teenPattiRoutes = require('./routes/teen-patti');
const connectRoutes = require('./routes/connect');
const flipRoutes = require('./routes/flip');
const barsRoutes = require('./routes/bars');
const kenoRoutes = require('./routes/keno');
const gatesRoutes = require('./routes/gates');
const gates1000Routes = require('./routes/gates1000');
const plinkoRoutes = require('./routes/plinko');
const minesRoutes = require('./routes/mines');
const diceRoutes = require('./routes/dice');
const rouletteRoutes = require('./routes/roulette');
const blackjackRoutes = require('./routes/blackjack');
const casesRoutes = require('./routes/cases');
const wheelRoutes = require('./routes/wheel');
const limboRoutes = require('./routes/limbo');
const hiloRoutes = require('./routes/hilo');
const baccaratRoutes = require('./routes/baccarat');
const videoPokerRoutes = require('./routes/video_poker');
const snakesRoutes = require('./routes/snakes');
const diamondsRoutes = require('./routes/diamonds');
const towerRoutes = require('./routes/tower');
const rpsRoutes = require('./routes/rps');
const chickenRoutes = require('./routes/chicken');
const aviamasterRoutes = require('./routes/aviamaster');
const gatesxmas1000Routes = require('./routes/gatesxmas1000');
const sweetbonanzaRoutes = require('./routes/sweetbonanza');
const sweetbonanzaxmasRoutes = require('./routes/sweetbonanzaxmas');
const sweetbonanza1000Routes = require('./routes/sweetbonanza1000');
const bigbassxmasxtremeRoutes = require('./routes/bigbassxmasxtreme');


app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/superagent', superAgentRoutes);
app.use('/agent', agentRoutes);
app.use('/betHistory', betHistoryRoutes);

app.use('/games/coinflip', coinflipRoutes);
app.use('/games/bingo', bingoRoutes);
app.use('/games/pump', pumpRoutes);
app.use('/games/teen-patti', teenPattiRoutes);
app.use('/games/connect', connectRoutes);
app.use('/games/flip', flipRoutes);
app.use('/games/bars', barsRoutes);
app.use('/games/keno', kenoRoutes);
app.use('/games/gates', gatesRoutes);
app.use('/games/gates1000', gates1000Routes);
app.use('/games/plinko', plinkoRoutes);
app.use('/games/mines', minesRoutes);
app.use('/games/dice', diceRoutes);
app.use('/games/roulette', rouletteRoutes);
app.use('/games/blackjack', blackjackRoutes);
app.use('/games/cases', casesRoutes);
app.use('/games/wheel', wheelRoutes);
app.use('/games/limbo', limboRoutes);
app.use('/games/hilo', hiloRoutes);
app.use('/games/baccarat', baccaratRoutes);
app.use('/games/video_poker', videoPokerRoutes);
app.use('/games/snakes', snakesRoutes);
app.use('/games/diamonds', diamondsRoutes);
app.use('/games/tower', towerRoutes);
app.use('/games/rps', rpsRoutes);
app.use('/games/chicken', chickenRoutes);
app.use('/games/aviamaster', aviamasterRoutes);
app.use('/games/gatesxmas1000', gatesxmas1000Routes);
app.use('/games/sweetbonanza', sweetbonanzaRoutes);
app.use('/games/sweetbonanzaxmas', sweetbonanzaxmasRoutes);
app.use('/games/sweetbonanza1000', sweetbonanza1000Routes);
app.use('/games/bigbassxmasxtreme', bigbassxmasxtremeRoutes);


// Serve admin.html at /admin, only for admins
app.get('/admin', (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).send('Unauthorized');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- Serve superagent/login.html at /superagent/login route ---
app.get('/superagent/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'superagent', 'login.html'));
});

// --- Serve agent/login.html at /agent/login route ---
app.get('/agent/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agent', 'login.html'));
});

// --- Serve agent/dashboard.html at /agent/dashboard route ---
app.get('/agent/dashboard', (req, res) => {
  if (!req.session.agent) {
    return res.redirect('/agent/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'agent', 'dashboard.html'));
});

////////////////////////////////////////// Slot Games //////////////////////////////////////////

// --- Serve gates.html at /gates route ---
app.get('/games/gates', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'gates', 'gates.html'));
});

// --- Serve gates1000.html at /gates1000 route ---
app.get('/games/gates1000', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'gates1000', 'gates1000.html'));
});

// --- Serve gatesxmas1000.html at /gatesxmas1000 route ---
app.get('/games/gatesxmas1000', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'gatesxmas1000', 'gatesxmas1000.html'));
});

// --- Serve sweetbonanza.html at /sweetbonanza route ---
app.get('/games/sweetbonanza', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'sweetbonanza', 'sweetbonanza.html'));
});

// --- Serve sweetbonanzaxmas.html at /sweetbonanzaxmas route ---
app.get('/games/sweetbonanzaxmas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'sweetbonanzaxmas', 'sweetbonanzaxmas.html'));
});

// --- Serve sweetbonanza1000.html at /sweetbonanza1000 route ---
app.get('/games/sweetbonanza1000', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'sweetbonanza1000', 'sweetbonanza1000.html'));
});

// --- Serve bigbassxmasxtreme.html at /bigbassxmasxtreme route ---
app.get('/games/bigbassxmasxtreme', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'bigbassxmasxtreme', 'bigbassxmasxtreme.html'));
});


/////////////////////////////////////////////////////////////// Main Games ///////////////////////////////////////////////////////////////

// --- Serve coinflip.html at /coinflip route ---
app.get('/games/coinflip', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'coinflip', 'coinflip.html'));
});

// --- Serve bingo.html at /bingo route ---
app.get('/games/bingo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'bingo', 'bingo.html'));
});

// --- Serve pump.html at /pump route ---
app.get('/games/pump', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'pump', 'pump.html'));
});

// --- Serve teen-patti.html at /teen-patti route ---
app.get('/games/teen-patti', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'teen-patti', 'teen-patti.html'));
});

// --- Serve connect.html at /connect route ---
app.get('/games/connect', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'connect', 'connect.html'));
});

// --- Serve flip.html at /flip route ---
app.get('/games/flip', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'flip', 'flip.html'));
});

// --- Serve bars.html at /bars route ---
app.get('/games/bars', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'bars', 'bars.html'));
});

// --- Serve keno.html at /keno route ---
app.get('/games/keno', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'keno', 'keno.html'));
});

// --- Serve plinko.html at /plinko route ---
app.get('/games/plinko', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'plinko', 'plinko.html'));
});

// --- Serve mines.html at /mines route ---
app.get('/games/mines', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'mines', 'mines.html'));
});

// --- Serve dice.html at /dice route ---
app.get('/games/dice', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'dice', 'dice.html'));
});

// --- Serve roulette.html at /roulette route ---
app.get('/games/roulette', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'roulette', 'roulette.html'));
});

// --- Serve blackjack.html at /blackjack route ---
app.get('/games/blackjack', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'blackjack', 'blackjack.html'));
});

// --- Serve cases.html at /cases route ---
app.get('/games/cases', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'cases', 'cases.html'));
});

// --- Serve wheel.html at /wheel route ---
app.get('/games/wheel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'wheel', 'wheel.html'));
});

// --- Serve limbo.html at /limbo route ---
app.get('/games/limbo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'limbo', 'limbo.html'));
});

// --- Serve hilo.html at /hilo route ---
app.get('/games/hilo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'hilo', 'hilo.html'));
});

// --- Serve baccarat.html at /baccarat route ---
app.get('/games/baccarat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'baccarat', 'baccarat.html'));
});

// --- Serve video_poker.html at /video_poker route ---
app.get('/games/video_poker', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'video_poker', 'video_poker.html'));
});

// --- Serve snakes.html at /snakes route ---
app.get('/games/snakes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'snakes', 'snakes.html'));
});

// --- Serve diamonds.html at /diamonds route ---
app.get('/games/diamonds', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'diamonds', 'diamonds.html'));
});

// --- Serve tower.html at /tower route ---
app.get('/games/tower', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'tower', 'tower.html'));
});

// --- Serve rps.html at /rps route ---
app.get('/games/rps', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'rps', 'rps.html'));
});

// --- Serve chicken.html at /chicken route ---
app.get('/games/chicken', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'chicken', 'chicken.html'));
});

// --- Serve aviamaster.html at /aviamaster route ---
app.get('/games/aviamaster', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'aviamaster', 'aviamaster.html'));
});
 
/////////////////////////////////////////////////////////////// Prediction Market ///////////////////////////////////////////////////////////////

// --- Serve prediction-market.html at /prediction-market route ---
app.get('/prediction-market', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'prediction-market', 'prediction-market.html'));
});


// --- Serve index.html at root ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Serve login.html at /login route ---
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// --- Serve my-bets.html at /user/my-bets route ---
app.get('/user/my-bets', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'my-bets', 'my-bets.html'));
});

// --- Serve deposit.html at /user/deposit route ---
app.get('/user/deposit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'deposit', 'deposit.html'));
});

// --- Serve withdraw.html at /user/withdraw route ---
app.get('/user/withdraw', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'withdraw', 'withdraw.html'));
});

// --- Serve contact-us.html at /user/contact-us route ---
app.get('/user/contact-us', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'contact-us', 'contact-us.html'));
});

// --- Serve affiliate.html at /user/affiliate route ---
app.get('/user/affiliate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'affiliate', 'affiliate.html'));
});

// --- Start server --- server.listen instead of app.listen for ws
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
