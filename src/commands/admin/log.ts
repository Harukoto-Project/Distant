import { ApplicationCommandType, ChannelType, ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../../lib/modules/Command';
import Database from '../../lib/modules/Database';
import { getI18n } from '../../lib/modules/i18nInstance';

const i18n = getI18n();
const db = new Database();

export default Command({
  name: 'log',
  description: 'Manage logging channels',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'set',
      description: 'Set a log channel',
      options: [
        {
          name: 'type',
          description: 'Which log to set',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: 'channel',
          description: 'Text channel to send logs to',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'delete',
      description: 'Delete a log channel',
      options: [
        {
          name: 'type',
          description: 'Which log to delete',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],
  execute: {
    interaction: async ({ client, interaction }) => {
      if (!interaction.isChatInputCommand()) return;
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.followUp({ content: 'This command must be used in a guild.', ephemeral: true });
        return;
      }

      await db.init();

      if (sub === 'set') {
        const type = interaction.options.getString('type', true);
        const channel = interaction.options.getChannel('channel', true);
        if (channel.type !== ChannelType.GuildText) {
          await interaction.followUp({ content: '指定されたチャンネルはテキストチャンネルではありません。', ephemeral: true });
          return;
        }
        await db.setLogChannel(guildId, type, channel.id);
        await interaction.followUp({ content: `ログ '${type}' の送信先を <#${channel.id}> に設定しました。`, ephemeral: true });
        return;
      }

      if (sub === 'delete') {
        const type = interaction.options.getString('type', true);
        await db.deleteLogChannel(guildId, type);
        await interaction.followUp({ content: `ログ '${type}' の送信先を削除しました。`, ephemeral: true });
        return;
      }
    },
  },
});
