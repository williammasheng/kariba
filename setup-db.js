
const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: '8.140.16.53',
  port: 3306,
  user: 'masheng',
  password: 'masheng86',
  database: 'db'
};

async function setupDatabase() {
  console.log('🔌 正在连接数据库...');
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接成功！开始创建表结构...');

    // 1. 创建用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS kariba_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
        email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
        password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.execute(createUsersTable);
    console.log('✅ 表 [kariba_users] 创建成功 (或已存在)');

    // 2. 创建游戏主记录表
    const createGamesTable = `
      CREATE TABLE IF NOT EXISTS kariba_games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_uuid VARCHAR(64) COMMENT '前端生成的唯一ID',
        winner_name VARCHAR(50) COMMENT '获胜者名字',
        duration_seconds INT DEFAULT 0 COMMENT '游戏总时长(秒)',
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '对局时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.execute(createGamesTable);
    console.log('✅ 表 [kariba_games] 创建成功 (或已存在)');

    // 3. 创建游戏详情表 (包含外键)
    const createDetailsTable = `
      CREATE TABLE IF NOT EXISTS kariba_game_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id INT NOT NULL COMMENT '关联到 kariba_games.id',
        user_id INT DEFAULT NULL COMMENT '关联到 kariba_users.id，如果是电脑则为NULL',
        player_name VARCHAR(50) NOT NULL COMMENT '玩家显示名称',
        score INT DEFAULT 0 COMMENT '最终得分',
        rank_position INT DEFAULT 0 COMMENT '排名',
        time_used_seconds INT DEFAULT 0 COMMENT '个人思考用时',
        is_bot BOOLEAN DEFAULT FALSE COMMENT '是否为机器人',
        FOREIGN KEY (game_id) REFERENCES kariba_games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES kariba_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.execute(createDetailsTable);
    console.log('✅ 表 [kariba_game_details] 创建成功 (或已存在)');

    console.log('\n🎉 所有数据库表结构已准备就绪！');
    console.log('下一步：您需要编写后端 API 服务器代码，以便前端 React 应用可以通过 HTTP 请求将数据写入这些表中。');

  } catch (error) {
    console.error('❌ 建表失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 连接已关闭');
    }
  }
}

setupDatabase();
