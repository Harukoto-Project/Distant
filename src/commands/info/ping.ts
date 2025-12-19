import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../lib/modules/Command';
import { getI18n } from '../../lib/modules/i18nInstance';

const i18n = getI18n();

export default Command({
  name: 'ping',
  description: i18n.t('commands.ping.description'),
  type: ApplicationCommandType.ChatInput,
  execute: {
    interaction: async ({ client, interaction }) => {
      await interaction.followUp({
        content: i18n.t('commands.ping.response', {
          ping: String(client.ws.ping),
        }),
        ephemeral: true,
      });
    },
  },
});
