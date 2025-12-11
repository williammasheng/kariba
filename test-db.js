
const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: '8.140.16.53',
  port: 3306,
  user: 'masheng',
  password: 'masheng86',
  database: 'db'
};

async function testConnection() {
  console.log('🔌 正在尝试连接数据库 (8.140.16.53)...');
  let connection;
  
  try {
    // 1. 建立连接
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功！');

    // 2. 定义表结构
    const tableName = 'HELLOWORLD';
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message VARCHAR(255) NOT NULL,
        test_time DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    // 3. 执行建表
    console.log(`🔨 正在创建表 '${tableName}'...`);
    await connection.execute(createTableQuery);
    console.log(`✅ 表 '${tableName}' 创建成功（如果已存在则跳过）。`);

    // 4. 插入一条测试数据
    const insertQuery = `INSERT INTO ${tableName} (message) VALUES (?)`;
    const [result] = await connection.execute(insertQuery, ['Hello from Kariba Game! 测试连接成功']);
    console.log(`📝 插入测试数据成功，ID: ${result.insertId}`);

    // 5. 查询验证
    const [rows] = await connection.execute(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 1`);
    console.log('🔎 读取刚插入的数据:', rows[0]);

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    console.error('⚠️ 请检查：\n1. IP地址是否正确\n2. 端口3306是否对外开放\n3. 用户名密码是否正确\n4. 数据库名 "db" 是否存在');
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 连接已关闭');
    }
  }
}

testConnection();
