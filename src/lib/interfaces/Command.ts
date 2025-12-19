import {
  ApplicationCommandData,
  ApplicationCommandType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
  PermissionResolvable,
  UserContextMenuCommandInteraction,
} from 'discord.js';

import { Distant } from '../modules/Distant';

type MessageExecuteType = ({
  client,
  message,
  args,
}: {
  client: Distant;
  message: Message;
  args: string[];
}) => Promise<void>;

type AutoCompleteExecuteType = ({
  client,
  interaction,
}: {
  client: Distant;
  interaction: AutocompleteInteraction;
}) => Promise<void>;

type CommandBase = {
  requiredPermissions?: PermissionResolvable[];
  ephemeral?: boolean;
  aliases?: string[];
  isOwnerCommand?: boolean;
  userInstall?: boolean;
  isDisabled?: boolean;
};

type Command<
  T extends
    | ApplicationCommandType.ChatInput
    | ApplicationCommandType.Message
    | ApplicationCommandType.User,
> = {
  type: T;
  execute: {
    interaction?: (args: {
      client: Distant;
      interaction: T extends ApplicationCommandType.ChatInput
        ? ChatInputCommandInteraction
        : T extends ApplicationCommandType.Message
          ? MessageContextMenuCommandInteraction
          : UserContextMenuCommandInteraction;
    }) => Promise<void>;
    message?: MessageExecuteType;
    autoComplete?: AutoCompleteExecuteType;
  };
};

type CommandWithDefault = {
  type?: never;
  execute: {
    interaction?: ({
      client,
      interaction,
    }: {
      client: Distant;
      interaction: ChatInputCommandInteraction;
    }) => Promise<void>;
    message?: MessageExecuteType;
    autoComplete?: AutoCompleteExecuteType;
  };
};

export type CommandType<
  T extends ApplicationCommandType = ApplicationCommandType.ChatInput,
> = CommandBase &
  ApplicationCommandData &
  (T extends
    | ApplicationCommandType.ChatInput
    | ApplicationCommandType.Message
    | ApplicationCommandType.User
    ? Command<T>
    : CommandWithDefault);

export type AnyCommandType =
  | CommandType<ApplicationCommandType.ChatInput>
  | CommandType<ApplicationCommandType.Message>
  | CommandType<ApplicationCommandType.User>;
