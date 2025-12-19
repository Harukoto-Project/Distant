import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../lib/modules/Command';

export default Command({
  name: 'ping',
  description: 'Ping the bot',
  type: ApplicationCommandType.ChatInput,
  execute: {
    interaction: async ({ client, interaction }) => {
      await interaction.followUp({
        content: `Pong! ${client.ws.ping}ms`,
        ephemeral: true,
      });
    },
  },
});
