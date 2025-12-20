import mysql from 'mysql2/promise';

export interface AdFilterConfig {
  channel_id: string;
  message_id?: string | null;
  log_channel_id?: string | null;
}

export interface GuildSettings {
  lang: string;
}

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
    try {
      const createAdFilterSQL = `
        CREATE TABLE IF NOT EXISTS ad_filters (
          id INT AUTO_INCREMENT PRIMARY KEY,
          guild_id VARCHAR(64) NOT NULL UNIQUE,
          channel_id VARCHAR(64) NOT NULL,
          message_id VARCHAR(64),
          log_channel_id VARCHAR(64)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await this.pool.query(createAdFilterSQL);

      const createGuildSettingsSQL = `
        CREATE TABLE IF NOT EXISTS guild_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          guild_id VARCHAR(64) NOT NULL UNIQUE,
          lang VARCHAR(10) DEFAULT 'ja'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await this.pool.query(createGuildSettingsSQL);

      this.enabled = true;
    } catch (err) {
      this.enabled = false;
      console.error(
        'Database init failed, continuing without DB support:',
        err,
      );
    }
  }

  async setAdFilter(
    guildId: string,
    channelId: string,
    messageId: string | null,
    logChannelId: string | null,
  ) {
    if (!this.enabled) return;
    const sql = `INSERT INTO ad_filters (guild_id, channel_id, message_id, log_channel_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id), message_id = VALUES(message_id), log_channel_id = VALUES(log_channel_id)`;
    await this.pool.execute(sql, [guildId, channelId, messageId, logChannelId]);
  }

  async updateAdFilterChannels(
    guildId: string,
    channelId: string | null,
    logChannelId: string | null,
  ) {
    if (!this.enabled) return;
    const updates: string[] = [];
    const params: (string | null)[] = [];
    if (channelId !== null) {
      updates.push('channel_id = ?');
      params.push(channelId);
    }
    if (logChannelId !== null) {
      updates.push('log_channel_id = ?');
      params.push(logChannelId);
    }
    if (updates.length === 0) return;
    params.push(guildId);
    const sql = `UPDATE ad_filters SET ${updates.join(', ')} WHERE guild_id = ?`;
    await this.pool.execute(sql, params);
  }

  async updateAdFilterMessageId(guildId: string, messageId: string | null) {
    if (!this.enabled) return;
    const sql = `UPDATE ad_filters SET message_id = ? WHERE guild_id = ?`;
    await this.pool.execute(sql, [messageId, guildId]);
  }

  async deleteAdFilter(guildId: string) {
    if (!this.enabled) return;
    const sql = `DELETE FROM ad_filters WHERE guild_id = ?`;
    await this.pool.execute(sql, [guildId]);
  }

  async getAdFilter(guildId: string): Promise<AdFilterConfig | null> {
    if (!this.enabled) return null;
    const result = await (this.pool as any).execute(
      `SELECT channel_id, message_id, log_channel_id FROM ad_filters WHERE guild_id = ? LIMIT 1`,
      [guildId],
    );
    const rows = result && result[0] ? (result[0] as any[]) : null;
    if (rows && rows.length) {
      return {
        channel_id: rows[0].channel_id,
        message_id: rows[0].message_id || null,
        log_channel_id: rows[0].log_channel_id || null,
      };
    }
    return null;
  }

  async setGuildLang(guildId: string, lang: string) {
    if (!this.enabled) return;
    const sql = `INSERT INTO guild_settings (guild_id, lang) VALUES (?, ?) ON DUPLICATE KEY UPDATE lang = VALUES(lang)`;
    await this.pool.execute(sql, [guildId, lang]);
  }

  async getGuildLang(guildId: string): Promise<string | null> {
    if (!this.enabled) return null;
    const result = await (this.pool as any).execute(
      `SELECT lang FROM guild_settings WHERE guild_id = ? LIMIT 1`,
      [guildId],
    );
    const rows = result && result[0] ? (result[0] as any[]) : null;
    if (rows && rows.length) return rows[0].lang;
    return null;
  }

  async getGuildSettings(guildId: string): Promise<GuildSettings | null> {
    if (!this.enabled) return null;
    const result = await (this.pool as any).execute(
      `SELECT lang FROM guild_settings WHERE guild_id = ? LIMIT 1`,
      [guildId],
    );
    const rows = result && result[0] ? (result[0] as any[]) : null;
    if (rows && rows.length) {
      return { lang: rows[0].lang || 'ja' };
    }
    return null;
  }
}
