import { checkPolicy } from './AI';
import Database from './Database';
import { Client, Message, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getI18n } from './i18nInstance';

const db = new Database();
const channelLocks: Map<string, Promise<void>> = new Map();

async function withChannelLock(channelId: string, fn: () => Promise<void>) {
  const prev = channelLocks.get(channelId) ?? Promise.resolve();
  let resolvePrev: () => void;
  const next = new Promise<void>(resolve => { resolvePrev = resolve; });
  channelLocks.set(channelId, prev.then(() => next));
  try {
    await prev;
    await fn();
  } finally {
    resolvePrev!();
    if (channelLocks.get(channelId) === next) channelLocks.delete(channelId);
  }
}

export async function sendAnchor(client: Client, guildId: string, channelId: string) {
  await db.init();
  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (!ch || !(ch as any).isTextBased || !(ch as TextChannel).send) return;
  const textCh = ch as TextChannel;
  try {
    const old = await db.getAdFilter(guildId);
    if (old && old.message_id) {
      try {
        const m = await textCh.messages.fetch(old.message_id).catch(() => null);
        if (m) await m.delete().catch(() => null);
      } catch (e) {}
    }

    const i18n = getI18n();
    const embed = new EmbedBuilder()
      .setTitle(i18n.t('adfilter.anchor_title'))
      .setThumbnail(client.user?.displayAvatarURL() || '')
      .setDescription(i18n.t('adfilter.anchor_desc'))
      .setColor(0x00aaff);
    const button = new ButtonBuilder()
      .setLabel(i18n.t('adfilter.button_label'))
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.com/oauth2/authorize?client_id=1451556127438540840&permissions=8&integration_type=0&scope=bot');
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
    const sent = await textCh.send({ embeds: [embed], components: [row] });
    await db.setAdFilter(guildId, channelId, sent.id);
  } catch (e) {
    console.error('[AdFilter] sendAnchor error:', e);
  }
}

export async function removeAnchor(client: Client, guildId: string) {
  await db.init();
  const record = await db.getAdFilter(guildId);
  if (!record) return;
  const ch = await client.channels.fetch(record.channel_id).catch(() => null);
  if (ch && (ch as TextChannel).messages && record.message_id) {
    try {
      await (ch as TextChannel).messages.fetch(record.message_id).then(m => m.delete()).catch(() => null);
    } catch (e) {}
  }
  await db.deleteAdFilter(guildId);
}

export async function moderateMessage(client: Client, message: Message) {
  if (message.author.bot || !message.guildId) return;

  // Only process messages posted in the configured ad_filter channel
  await db.init();
  const configuredChannelId = await db.getLogChannel(message.guildId, 'ad_filter');
  if (!configuredChannelId) return;
  if (message.channelId !== configuredChannelId) return;

  // Maintain anchor embed: delete previous anchor and post a fresh one.
  await withChannelLock(configuredChannelId, async () => {
    await sendAnchor(client, message.guildId!, configuredChannelId);
  });

  const policy = await checkPolicy(message.content || '');
  if (!policy.is_safe) {
    try {
      await message.delete();
    } catch (err) {
      console.error('Failed to delete message during moderation:', err);
    }

    try {
      const i18n = getI18n();
      const notify = i18n.t('adfilter.notify_deleted', { user: `<@!${message.author.id}>`, reason: policy.reason || '' });
      const ch = await client.channels.fetch(configuredChannelId);
      if (ch && (ch as any).isTextBased && (ch as any).isTextBased()) {
        await (ch as TextChannel).send(notify);
      }
    } catch (err) {
      console.error('Failed to notify in channel after deletion:', err);
    }

    try {
      const logChannelId = await db.getLogChannel(message.guildId!, 'log');
      if (logChannelId) {
        const logCh = await client.channels.fetch(logChannelId);
        if (logCh && logCh.isTextBased && logCh.isTextBased()) {
          const i18n = getI18n();
          const logEmbed = new EmbedBuilder()
            .setTitle(i18n.t('adfilter.log_title'))
            .setThumbnail(message.author.displayAvatarURL() || '')
            .setDescription(i18n.t('adfilter.log_content', { content: message.content || i18n.t('adfilter.unknown') }))
            .setColor(0xff0000)
            .addFields(
              { name: i18n.t('adfilter.log_channel'), value: `<#${configuredChannelId}>`, inline: true },
              { name: i18n.t('adfilter.log_sender'), value: ` <@!${message.author.id}> (${message.author.id})`, inline: true },
              { name: i18n.t('adfilter.log_reason'), value: policy.reason || i18n.t('adfilter.unknown'), inline: false },
            )
            .setTimestamp();
          await (logCh as TextChannel).send({ embeds: [logEmbed] });
        }
      }
    } catch (err) {
      console.error('Failed to send to log channel:', err);
    }

    return;
  }

  try {
    await message.react('✅');
  } catch (err) {
    console.error('Failed to react to message:', err);
  }
}
