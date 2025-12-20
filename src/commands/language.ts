import {
  ApplicationCommandType,
  ApplicationCommandOptionType,
} from 'discord.js';
import { Command } from '../lib/modules/Command';
import Database from '../lib/modules/Database';
import { getI18n } from '../lib/modules/i18nInstance';
import { Distant } from '../lib/modules/Distant';
const db = new Database();

export default Command({
  name: 'language',
  description: getI18n().t('language.command_description'),
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'lang',
      description: getI18n().t('language.lang_description'),
      required: true,
      choices: [{ name: getI18n().t('language.japanese'), value: 'ja' }],
    },
  ],
  execute: {
    interaction: async ({ interaction }) => {
      if (!interaction.isChatInputCommand()) return;
      const guildId = interaction.guildId;
      const i18n = getI18n();
      if (!guildId) {
        await interaction.followUp({
          content: i18n.t('language.need_guild'),
          ephemeral: true,
        });
        return;
      }
      const lang = interaction.options.getString('lang', true);
      await db.init();
      await db.setGuildLang(guildId, lang);
      const client = interaction.client as Distant;
      if (client && client.application) {
        if (client.reRegisterGuildCommands) {
          await client.reRegisterGuildCommands(guildId, lang);
        }
      }
      await interaction.followUp({
        content: i18n.t('language.set_success', {
          lang: i18n.t(`language.${lang}`),
        }),
        ephemeral: true,
      });
    },
  },
});
