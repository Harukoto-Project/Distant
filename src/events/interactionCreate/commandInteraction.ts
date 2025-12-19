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

export default new Event('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (command?.isDisabled) {
      return await interaction.reply({
        embeds: [
          {
            description: '現在このコマンドは無効化されています。',
            color: Colors.Red,
          },
        ],
      });
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

    if (!command)
      return await interaction.followUp({ content: 'コマンドが存在しません' });

    if (!command.execute.interaction)
      return await interaction.followUp({
        content: 'コマンドがスラッシュコマンドに対応していません',
      });

    if (
      command.isOwnerCommand &&
      !client.config.developerIds.includes(interaction.user.id)
    ) {
      return await interaction.followUp({
        content: 'このコマンドはBot関係者のみ実行可能です',
      });
    }

    if (
      client.config.debugMode &&
      !client.config.developerIds.includes(interaction.user.id)
    ) {
      return await interaction.followUp({
        content:
          '開発モードが有効です\n許容されたユーザーのみコマンドを実行することができます',
      });
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
