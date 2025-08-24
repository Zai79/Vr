// tokens.js
export default [
  {
    channelId: "1357815715465527467",  // ID قناة صوت
    serverId: "1289654556598206536",  // السيرفر (اختياري)
    token: process.env.token1,        // توكن البوت من Render env
    selfDeaf: false,
    autoReconnect: {
      enabled: true,
      delay: 5,
      maxRetries: 5
    },
    presence: {
      status: "idle"
    },
    selfMute: true
  }
];
