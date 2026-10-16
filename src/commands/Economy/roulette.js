import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { randomInt } from 'node:crypto';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

// ---------- Settings (change these freely) ----------
const MAX_BET = 1_000_000;       // biggest allowed bet
const SPIN_FRAMES = 4;           // how many animation frames
const FRAME_DELAY_MS = 900;      // delay between frames

// ---------- Wheel data (real European wheel order) ----------
const WHEEL = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const COLOR_EMOJI = { red: '🔴', black: '⚫', green: '🟢' };

const colorOf = n => (n === 0 ? 'green' : RED.has(n) ? 'red' : 'black');
const tile = n => `${COLOR_EMOJI[colorOf(n)]} ${n}`;
const money = n => `$${n.toLocaleString()}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// mult = total returned per 1 cash bet (stake included)
const BETS = {
  red:    { label: 'Red',            mult: 2, win: n => colorOf(n) === 'red' },
  black:  { label: 'Black',          mult: 2, win: n => colorOf(n) === 'black' },
  even:   { label: 'Even',           mult: 2, win: n => n !== 0 && n % 2 === 0 },
  odd:    { label: 'Odd',            mult: 2, win: n => n % 2 === 1 },
  low:    { label: 'Low (1-18)',     mult: 2, win: n => n >= 1 && n <= 18 },
  high:   { label: 'High (19-36)',   mult: 2, win: n => n >= 19 && n <= 36 },
  dozen1: { label: '1st dozen (1-12)',  mult: 3, win: n => n >= 1 && n <= 12 },
  dozen2: { label: '2nd dozen (13-24)', mult: 3, win: n => n >= 13 && n <= 24 },
  dozen3: { label: '3rd dozen (25-36)', mult: 3, win: n => n >= 25 && n <= 36 },
};

// Shows the 5 pockets around the ball, with the landing pocket in the middle
function strip(center) {
  const i = WHEEL.indexOf(center);
  const at = o => WHEEL[(i + o + WHEEL.length) % WHEEL.length];
  return [-2, -1, 0, 1, 2]
    .map(o => (o === 0 ? `**[ ${tile(at(o))} ]**` : tile(at(o))))
    .join('   ');
}

// Last spins per server (kept in memory)
const recentSpins = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('Bet your cash on the roulette wheel')
    .addIntegerOption(o => o
      .setName('amount')
      .setDescription('Amount of cash to bet')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(MAX_BET))
    .addStringOption(o => o
      .setName('bet')
      .setDescription('What do you want to bet on?')
      .setRequired(true)
      .addChoices(
        { name: '🔴 Red (x2)', value: 'red' },
        { name: '⚫ Black (x2)', value: 'black' },
        { name: 'Even (x2)', value: 'even' },
        { name: 'Odd (x2)', value: 'odd' },
        { name: 'Low 1-18 (x2)', value: 'low' },
        { name: 'High 19-36 (x2)', value: 'high' },
        { name: '1st dozen 1-12 (x3)', value: 'dozen1' },
        { name: '2nd dozen 13-24 (x3)', value: 'dozen2' },
        { name: '3rd dozen 25-36 (x3)', value: 'dozen3' },
        { name: '🎯 Exact number (x36)', value: 'number' },
      ))
    .addIntegerOption(o => o
      .setName('number')
      .setDescription('Your number 0-36 (only for exact number bets)')
      .setMinValue(0)
      .setMaxValue(36)),

  execute: withErrorHandling(async (interaction, config, client) => {
    const deferred = await InteractionHelper.safeDefer(interaction);
    if (!deferred) return;

    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const amount = interaction.options.getInteger('amount');
    const betKey = interaction.options.getString('bet');
    const pick = interaction.options.getInteger('number');

    if (betKey === 'number' && pick === null) {
      throw createError(
        'Roulette number missing',
        ErrorTypes.VALIDATION,
        'For an exact number bet, fill in the `number` option (0-36).',
        {},
      );
    }

    const bet = betKey === 'number'
      ? { label: `Number ${pick}`, mult: 36, win: n => n === pick }
      : BETS[betKey];

    const userData = await getEconomyData(client, guildId, userId);


    if ((userData.wallet || 0) < amount) {
      throw createError(
        'Insufficient cash for roulette',
        ErrorTypes.VALIDATION,
        `You only have ${money(userData.wallet || 0)} cash, but you tried to bet ${money(amount)}.`,
        { required: amount, current: userData.wallet || 0 },
      );
    }

    // Take the bet up front so the cash can't be spent elsewhere mid-spin
    userData.wallet -= amount;
    await setEconomyData(client, guildId, userId, userData);

    const author = { name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() };

    // Spin animation (if an edit fails, we still pay out below)
    try {
      for (let i = 0; i < SPIN_FRAMES; i++) {
        const fake = WHEEL[randomInt(WHEEL.length)];
        await InteractionHelper.safeEditReply(interaction, {
          embeds: [
            new EmbedBuilder()
              .setColor(0xf1c40f)
              .setAuthor(author)
              .setTitle('🎡 Roulette - spinning...')
              .setDescription(`${strip(fake)}\n\nBet: **${money(amount)}** on **${bet.label}**`),
          ],
        });
        await sleep(FRAME_DELAY_MS);
      }
    } catch { /* ignore animation errors */ }

    // The real result
    const result = randomInt(37);
    const won = bet.win(result);
    const payout = won ? amount * bet.mult : 0;

    // Re-read fresh data so we don't overwrite changes made during the animation
    const fresh = await getEconomyData(client, guildId, userId);
    if (payout > 0) {
      fresh.wallet = (fresh.wallet || 0) + payout;
      await setEconomyData(client, guildId, userId, fresh);
    }

    const history = recentSpins.get(guildId) ?? [];
    history.unshift(result);
    history.splice(8);
    recentSpins.set(guildId, history);

    const embed = new EmbedBuilder()
      .setColor(won ? 0x2ecc71 : 0xe74c3c)
      .setAuthor(author)
      .setTitle(won ? '🎉 Roulette - You won!' : '💔 Roulette - You lost')
      .setDescription(`${strip(result)}\n\nThe ball landed on **${tile(result)}**.`)
      .addFields(
        { name: '🎯 Your bet', value: `${money(amount)} on ${bet.label}`, inline: true },
        { name: won ? '📈 Profit' : '📉 Lost', value: money(won ? payout - amount : amount), inline: true },
        { name: '💵 New cash balance', value: money(fresh.wallet || 0), inline: true },
      )
      .setFooter({ text: `Last spins: ${history.map(tile).join('  ')}` });

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  }, { command: 'roulette' }),
};
