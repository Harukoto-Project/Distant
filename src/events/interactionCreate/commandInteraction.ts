import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  Colors,
  MessageContextMenuCommandInteraction,
  MessageFlagsBitField,
  UserContextMenuCommandInteraction,
} from 'discord.js';

import { client } from '../../index';
import { Event } from '../../lib/modules/Event';
import { getI18n } from '../../lib/modules/i18nInstance';

export default new Event('interactionCreate', async (interaction) => {
  const i18n = getI18n();
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (command?.isDisabled) {
      await interaction.reply({
        embeds: [
          {
            description: i18n.t('command.disabled'),
            color: Colors.Red,
          },
        ],
      });
      return;
    }

    if (!interaction.guild && interaction.inGuild()) {
      await interaction.deferReply({
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    } else {
      if (command?.ephemeral) {
        await interaction.deferReply({
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
      } else {
        await interaction.deferReply();
      }
    }

    if (!command) {
      await interaction.followUp({
        content: i18n.t('command.not_found'),
      });
      return;
    }

    if (!command.execute.interaction) {
      await interaction.followUp({
        content: i18n.t('command.not_slash_supported'),
      });
      return;
    }

    if (
      command.isOwnerCommand &&
      !client.config.developerIds.includes(interaction.user.id)
    ) {
      await interaction.followUp({
        content: i18n.t('command.owner_only'),
      });
      return;
    }

    if (
      client.config.debugMode &&
      !client.config.developerIds.includes(interaction.user.id)
    ) {
      await interaction.followUp({
        content: i18n.t('command.debug_mode'),
      });
      return;
    }

    if (!command.type || command.type === ApplicationCommandType.ChatInput) {
      await command.execute.interaction({
        client,
        interaction: interaction as ChatInputCommandInteraction,
      });

      return;
    }

    if (command.type === ApplicationCommandType.Message) {
      await command.execute.interaction({
        client,
        interaction: interaction as MessageContextMenuCommandInteraction,
      });

      return;
    }

    if (command.type === ApplicationCommandType.User) {
      await command.execute.interaction({
        client,
        interaction: interaction as UserContextMenuCommandInteraction,
      });

      return;
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.execute.autoComplete) return;

    await command.execute.autoComplete({
      client,
      interaction,
    });
  }
});