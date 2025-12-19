import { ApplicationCommandType } from 'discord.js';
import { CommandType } from '../interfaces/Command';

export function Command<
  T extends ApplicationCommandType = ApplicationCommandType.ChatInput,
>(commandOptions: CommandType<T>): CommandType<T> {
  return commandOptions;
}
