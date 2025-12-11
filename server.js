const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist'))); // Serve built frontend files

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '8.140.16.53',
  user: process.env.DB_USER || 'masheng',
  password: process.env.DB_PASS || 'masheng86',
  database: process.env.DB_NAME || 'db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- API Routes ---

// 1. Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Check if exists
    const [existing] = await pool.execute(
      'SELECT id FROM kariba_users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: '用户名或邮箱已存在' });
    }

    // Insert (Note: Password should be hashed in production, keeping simple for demo as requested)
    const passwordHash = Buffer.from(password).toString('base64');
    await pool.execute(
      'INSERT INTO kariba_users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    res.json({ success: true, message: '注册成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const passwordHash = Buffer.from(password).toString('base64');
    const [rows] = await pool.execute(
      'SELECT id, username, email, created_at FROM kariba_users WHERE username = ? AND password_hash = ?',
      [username, passwordHash]
    );

    if (rows.length > 0) {
      const user = rows[0];
      // Convert DB fields to frontend format
      const frontendUser = {
        username: user.username,
        email: user.email,
        passwordHash: 'HIDDEN',
        createdAt: new Date(user.created_at).getTime()
      };
      res.json({ success: true, user: frontendUser, message: '登录成功' });
    } else {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 3. Save Game
app.post('/api/game/save', async (req, res) => {
  const { username, record } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Find User ID
    const [users] = await connection.execute('SELECT id FROM kariba_users WHERE username = ?', [username]);
    if (users.length === 0) throw new Error('User not found');
    const userId = users[0].id;

    // Insert Game
    const [gameResult] = await connection.execute(
      'INSERT INTO kariba_games (game_uuid, winner_name, duration_seconds, played_at) VALUES (?, ?, ?, FROM_UNIXTIME(?))',
      [record.id, record.winnerName, record.duration, record.date / 1000]
    );
    const gameId = gameResult.insertId;

    // Insert Details
    for (const p of record.players) {
      // Determine user_id for this player (only if it's the main user)
      // In a real multi-user app, we'd map all users. Here we only map the current logged-in user.
      const pUserId = p.isUser ? userId : null; 
      
      await connection.execute(
        'INSERT INTO kariba_game_details (game_id, user_id, player_name, score, rank_position, time_used_seconds, is_bot) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [gameId, pUserId, p.name, p.score, p.rank, p.timeUsed, !p.isUser]
      );
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// 4. Get History
app.get('/api/history/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [users] = await pool.execute('SELECT id FROM kariba_users WHERE username = ?', [username]);
    if (users.length === 0) return res.json([]);
    const userId = users[0].id;

    // Get all games this user participated in
    const [details] = await pool.execute(
      'SELECT game_id FROM kariba_game_details WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    
    if (details.length === 0) return res.json([]);

    const gameIds = details.map(d => d.game_id);
    
    // Fetch Game Info
    // Note: IN clause expansion
    const placeholders = gameIds.map(() => '?').join(',');
    const [games] = await pool.execute(
      `SELECT * FROM kariba_games WHERE id IN (${placeholders}) ORDER BY played_at DESC`,
      gameIds
    );

    // Fetch All Details for these games
    const [allDetails] = await pool.execute(
      `SELECT * FROM kariba_game_details WHERE game_id IN (${placeholders})`,
      gameIds
    );

    // Reconstruct Data Structure
    const history = games.map(g => {
      const gamePlayers = allDetails.filter(d => d.game_id === g.id);
      return {
        id: g.game_uuid,
        date: new Date(g.played_at).getTime(),
        duration: g.duration_seconds,
        winnerName: g.winner_name,
        players: gamePlayers.map(p => ({
          name: p.player_name,
          score: p.score,
          rank: p.rank_position,
          timeUsed: p.time_used_seconds,
          isUser: p.user_id === userId // Mark if this row is the current user
        }))
      };
    });

    res.json(history);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// Fallback for React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Connected to DB at ${process.env.DB_HOST}`);
});
