import {
  ApplicationIntegrationType,
  Client,
  ClientEvents,
  ClientOptions,
  Collection,
  InteractionContextType,
} from 'discord.js';
import { Event } from './Event';
import { AnyCommandType, CommandType } from '../interfaces/Command';
import dotenv from 'dotenv';

import { promisify } from 'util';
import glob from 'glob';

dotenv.config();

interface Config {
  token: string;
  debugMode: boolean;
  developerIds: string[];
}

export class Distant extends Client {
  constructor(
    options: ClientOptions,
    public config: Config,
  ) {
    super(options);
  }

  public async start(): Promise<void> {
    await this._registerCommands();
    await this._registerEvents();

    await this.login(this.config.token);
  }

  public commands: Collection<string, AnyCommandType> = new Collection();

  /**
   * 指定されたファイルパスからモジュールをインポートし、そのデフォルトエクスポートを返します。
   *
   * @param filePath インポートするファイルのパス。文字列で指定します。
   * @return インポートしたモジュールのデフォルトエクスポートを返します。プロミスでラップされています。
   */
  public async importFile<T>(filePath: string): Promise<T> {
    const file = await import(filePath);
    if (!file) {
      console.log(`File ${filePath} not found`);
    }

    return file.default;
  }

  public globPromise = promisify(glob);

  private async _registerCommands() {
    const commands: CommandType[] = [];
    const commandFiles = await this.globPromise(
      __dirname + '/../../commands/**/*{.ts,.js}',
    );

    for (const file of commandFiles) {
      const command: CommandType = await this.importFile<CommandType>(file);

      if (command.userInstall) {
        command.contexts = [
          InteractionContextType.BotDM,
          InteractionContextType.Guild,
          InteractionContextType.PrivateChannel,
        ];

        command.integrationTypes = [
          ApplicationIntegrationType.GuildInstall,
          ApplicationIntegrationType.UserInstall,
        ];
      } else {
        command.contexts = [InteractionContextType.Guild];

        command.integrationTypes = [ApplicationIntegrationType.GuildInstall];
      }

      commands.push(command);
      this.commands.set(command.name, command);
    }

    this.once('ready', () => {
      this.application?.commands
        .set(commands)
        .then(() =>
          console.log(
            `${commands.length}個のスラッシュコマンドを${this.guilds.cache.size}個のサーバーで登録しました`,
          ),
        )
        .catch((e) => {
          console.error('Failed to register slash commands');
          console.error(e);
        });
    });
  }

  private async _registerEvents(): Promise<void> {
    const eventFiles = await this.globPromise(
      `${__dirname}/../../events/**/*{.ts,.js}`,
    );

    for (const filePath of eventFiles) {
      const event = await this.importFile<Event<keyof ClientEvents>>(filePath);
      if (event && 'event' in event) {
        this.on(event.event, event.run);
      }
    }
  }
}
