import { ApplicationCommandType, ChannelType, ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../lib/modules/Command';
import Database from '../lib/modules/Database';
import { sendAnchor, removeAnchor } from '../lib/modules/AdFilter';
import { getI18n } from '../lib/modules/i18nInstance';

const i18n = getI18n();
const db = new Database();

export default Command({
  name: 'ad_filter',
  description: 'Manage advertisement filter channel',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'set',
      description: 'Set the channel used for advertisement filtering',
      options: [
        {
          name: 'channel',
          description: 'Text channel to receive ad filter messages',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
        {
          name: 'log_channel',
          description: 'Optional channel to send moderation logs to',
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'delete',
      description: 'Remove the ad filter channel',
    },
  ],
  execute: {
    interaction: async ({ client, interaction }) => {
      if (!interaction.isChatInputCommand()) return;
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.followUp({ content: 'このコマンドはサーバー内で使用してください。', ephemeral: true });
        return;
      }

      await db.init();

      if (sub === 'set') {
        const channel = interaction.options.getChannel('channel', true);
        const logChannel = interaction.options.getChannel('log_channel', false);
        if (channel.type !== ChannelType.GuildText) {
          await interaction.followUp({ content: '指定されたチャンネルはテキストチャンネルではありません。', ephemeral: true });
          return;
        }
        await db.setLogChannel(guildId, 'ad_filter', channel.id);
        // initialize anchor embed in the channel
        try {
          // @ts-ignore
          await sendAnchor(client, guildId, channel.id);
        } catch (e) {
          console.error('Failed to send anchor on set:', e);
        }
        if (logChannel) {
          if (logChannel.type !== ChannelType.GuildText) {
            await interaction.followUp({ content: '指定されたログチャンネルはテキストチャンネルではありません。', ephemeral: true });
            return;
          }
          await db.setLogChannel(guildId, 'log', logChannel.id);
          await interaction.followUp({ content: `宣伝検閲用チャンネルを <#${channel.id}> に設定し、ログを <#${logChannel.id}> に送信するようにしました。`, ephemeral: true });
          return;
        }
        await interaction.followUp({ content: `宣伝検閲用チャンネルを <#${channel.id}> に設定しました。`, ephemeral: true });
        return;
      }

      if (sub === 'delete') {
        await db.deleteLogChannel(guildId, 'ad_filter');
        try {
          // @ts-ignore
          await removeAnchor(client, guildId);
        } catch (e) {
          console.error('Failed to remove anchor on delete:', e);
        }
        await interaction.followUp({ content: '宣伝検閲用チャンネルの設定を削除しました。', ephemeral: true });
        return;
      }
    },
  },
});
