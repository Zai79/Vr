// client.js
import events from "node:events";
import { Client, GatewayIntentBits, Events } from "discord.js";
import {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus
} from "@discordjs/voice";

export class voiceClient extends events.EventEmitter {
  constructor(opts) {
    super();
    this.opts = {
      selfDeaf: true,
      selfMute: false,
      autoReconnect: { enabled: true, delay: 5, maxRetries: 5 },
      presence: { status: "online" },
      ...opts
    };
    this.retries = 0;
    this.connection = null;

    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
      presence: this.opts.presence
    });

    this.client.on(Events.ClientReady, (c) => {
      this.emit("ready", c.user);
      this.emit("connected");
      this.joinVoice().catch((e) => this.emit("error", e));
    });

    this.client.on("error", (e) => this.emit("error", e));
    this.client.on("shardDisconnect", () => this.emit("disconnected"));
  }

  async connect() {
    await this.client.login(this.opts.token);
  }

  async joinVoice() {
    const channel = await this.client.channels.fetch(this.opts.channelId);
    if (!channel || channel.type !== 2) {
      throw new Error("Voice channel not found or not a voice channel.");
    }

    const conn = joinVoiceChannel({
      channelId: this.opts.channelId,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: this.opts.selfDeaf,
      selfMute: this.opts.selfMute
    });

    this.connection = conn;

    conn.on("stateChange", (oldS, newS) => {
      this.emit("debug", `Voice: ${oldS.status} -> ${newS.status}`);
      if (newS.status === VoiceConnectionStatus.Disconnected) this._reconnect();
    });

    await entersState(conn, VoiceConnectionStatus.Ready, 15_000);
    this.emit("voiceReady");
  }

  async _reconnect() {
    if (!this.opts.autoReconnect?.enabled) return;
    if (this.retries >= (this.opts.autoReconnect.maxRetries ?? 5)) return;
    this.retries++;
    this.emit("debug", `Reconnecting… attempt ${this.retries}`);
    await new Promise((r) =>
      setTimeout(r, (this.opts.autoReconnect.delay ?? 5) * 1000)
    );
    try {
      await this.joinVoice();
    } catch (e) {
      this.emit("error", e);
      this._reconnect();
    }
  }
}

export default voiceClient;
