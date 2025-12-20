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
      const createAdFilterSQL = `
      CREATE TABLE IF NOT EXISTS ad_filters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(64) NOT NULL UNIQUE,
        channel_id VARCHAR(64) NOT NULL,
        message_id VARCHAR(64)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await this.pool.query(createAdFilterSQL);
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

  async setAdFilter(guildId: string, channelId: string, messageId: string | null) {
    if (!this.enabled) return;
    const sql = `INSERT INTO ad_filters (guild_id, channel_id, message_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id), message_id = VALUES(message_id)`;
    await this.pool.execute(sql, [guildId, channelId, messageId]);
  }

  async deleteAdFilter(guildId: string) {
    if (!this.enabled) return;
    const sql = `DELETE FROM ad_filters WHERE guild_id = ?`;
    await this.pool.execute(sql, [guildId]);
  }

  async getAdFilter(guildId: string): Promise<{ channel_id: string; message_id?: string } | null> {
    if (!this.enabled) return null;
    const result = await (this.pool as any).execute(`SELECT channel_id, message_id FROM ad_filters WHERE guild_id = ? LIMIT 1`, [guildId]);
    const rows = result && result[0] ? (result[0] as any[]) : null;
    if (rows && rows.length) return { channel_id: rows[0].channel_id, message_id: rows[0].message_id };
    return null;
  }
}
