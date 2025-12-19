import mysql from 'mysql2/promise';

export default class Database {
  private pool: mysql.Pool;
  private enabled: boolean = true;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'distant',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async init() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(64) NOT NULL,
        type VARCHAR(64) NOT NULL,
        channel_id VARCHAR(64) NOT NULL,
        UNIQUE KEY uniq_guild_type (guild_id, type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    try {
      await this.pool.query(createTableSQL);
      this.enabled = true;
    } catch (err) {
      this.enabled = false;
      console.error('Database init failed, continuing without DB support:', err);
    }
  }

  async setLogChannel(guildId: string, type: string, channelId: string) {
    if (!this.enabled) return;
    const sql = `INSERT INTO logs (guild_id, type, channel_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id)`;
    await this.pool.execute(sql, [guildId, type, channelId]);
  }

  async deleteLogChannel(guildId: string, type: string) {
    if (!this.enabled) return;
    const sql = `DELETE FROM logs WHERE guild_id = ? AND type = ?`;
    await this.pool.execute(sql, [guildId, type]);
  }

  async getLogChannel(guildId: string, type: string): Promise<string | null> {
    if (!this.enabled) return null;
    const result = await (this.pool as any).execute(`SELECT channel_id FROM logs WHERE guild_id = ? AND type = ? LIMIT 1`, [guildId, type]);
    const rows = result && result[0] ? (result[0] as any[]) : null;
    if (rows && rows.length) return rows[0].channel_id;
    return null;
  }
}
