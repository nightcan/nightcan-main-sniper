"use strict";
const fetch = require('node-fetch');
const WebSocket = require('ws');

const self = "";
const sniperToken = "";
const sniperGuild = "";
const log = "";

const guilds = {};
const socket = new WebSocket("wss://gateway.discord.gg");


socket.onmessage = async (message) => {
    const data = JSON.parse(message.data.toString());

    if (data.t === "GUILD_UPDATE" || data.t === "GUILD_DELETE") {
        const guildId = data.t === "GUILD_UPDATE" ? data.d.guild_id : data.d.id;
        const vanityUrlCode = guilds[guildId];

        if (vanityUrlCode) {
            const startTime = Date.now();

            try {
                const res = await fetch(`https://canary.discord.com/api/v10/guilds/${sniperGuild}/vanity-url`, {
                    method: "PATCH",
                    headers: {
                        Authorization: sniperToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code: vanityUrlCode }),
                });

                const endTime = Date.now();
                const snipeTime = endTime - startTime;
                const content = `${data.t === "GUILD_UPDATE" ? "GUILD_UPDATE" : "URL"} | ${vanityUrlCode} | ${snipeTime}ms | ||@everyone||`;

                await sendWebhook(content);
                delete guilds[guildId];
            } catch (err) {
                console.error(err);
            }
        }
    } else if (data.t === "READY") {
        data.d.guilds.forEach(guild => {
            if (guild.vanity_url_code) {
                guilds[guild.id] = guild.vanity_url_code;
            }
        });
    }

    if (data.op === 10) {
        socket.send(JSON.stringify({
            op: 2,
            d: {
                token: self,
                intents: 1 << 0,
                properties: {
                    os: "linux",
                    browser: "firefox",
                    device: "firefox",
                },
            },
        }));

        setInterval(() => socket.send(JSON.stringify({ op: 0.2, d: {}, s: null, t: "heartbeat" })), data.d.heartbeat_interval);
    } else if (data.op === 7) {
        return process.exit();
    }
};

socket.onclose = (event) => {
    return process.exit();
};

async function sendWebhook(content) {
    try {
        await fetch(log, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: content,
            }),
        });
    } catch (err) {
        console.error(err);
    }
}
