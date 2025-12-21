import {
  ApplicationCommandType,
  ChannelType,
  ApplicationCommandOptionType,
} from 'discord.js';
import { Command } from '../lib/modules/Command';
import Database from '../lib/modules/Database';
import { sendAnchor, removeAnchor } from '../lib/modules/AdFilter';
import { getI18n } from '../lib/modules/i18nInstance';

const i18n = getI18n();
const db = new Database();

export default Command({
  name: 'ad_filter',
  description: i18n.t('adfilter.command_description'),
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'set',
      description: i18n.t('adfilter.set_description'),
      options: [
        {
          name: 'channel',
          description: i18n.t('adfilter.channel_description'),
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: true,
        },
        {
          name: 'log_channel',
          description: i18n.t('adfilter.log_channel_description'),
          type: ApplicationCommandOptionType.Channel,
          channel_types: [ChannelType.GuildText],
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'delete',
      description: i18n.t('adfilter.delete_description'),
    },
  ],
  execute: {
    interaction: async ({ client, interaction }) => {
      if (!interaction.isChatInputCommand()) return;
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.followUp({
          content: i18n.t('adfilter.need_guild'),
          ephemeral: true,
        });
        return;
      }

      await db.init();

      if (sub === 'set') {
        const channel = interaction.options.getChannel('channel', true);
        const logChannel = interaction.options.getChannel('log_channel', false);
        if (channel.type !== ChannelType.GuildText) {
          await interaction.followUp({
            content: i18n.t('adfilter.not_text_channel'),
            ephemeral: true,
          });
          return;
        }
        const logChannelId =
          logChannel && logChannel.type === ChannelType.GuildText
            ? logChannel.id
            : null;
        if (logChannel && logChannel.type !== ChannelType.GuildText) {
          await interaction.followUp({
            content: i18n.t('adfilter.not_log_text_channel'),
            ephemeral: true,
          });
          return;
        }
        await db.setAdFilter(guildId, channel.id, null, logChannelId);
        try {
          await sendAnchor(client, guildId, channel.id);
        } catch (e) {
          console.error('Failed to send anchor on set:', e);
        }
        if (logChannel) {
          await interaction.followUp({
            content: i18n.t('adfilter.set_success_with_log', {
              channel: `<#${channel.id}>`,
              log: `<#${logChannel.id}>`,
            }),
            ephemeral: true,
          });
          return;
        }
        await interaction.followUp({
          content: i18n.t('adfilter.set_success', {
            channel: `<#${channel.id}>`,
          }),
          ephemeral: true,
        });
        return;
      }

      if (sub === 'delete') {
        await db.deleteAdFilter(guildId);
        try {
          await removeAnchor(client, guildId);
        } catch (e) {
          console.error('Failed to remove anchor on delete:', e);
        }
        await interaction.followUp({
          content: i18n.t('adfilter.delete_success'),
          ephemeral: true,
        });
        return;
      }
    },
  },
});
