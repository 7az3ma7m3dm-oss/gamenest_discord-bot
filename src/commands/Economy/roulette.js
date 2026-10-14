import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// TODO: connect these two to your economy system
async function getBalance(userId, guildId) {
  return 0; // return the user's current coins
}
async function addBalance(userId, guildId, amount) {
  // add `amount` coins (can be negative)
}

const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const colorOf = n => (n === 0 ? 'green' : RED.has(n) ? 'red' : 'black');

// total returned per 1 coin bet (0 = lost)
function multiplier(bet, number, n) {
  if (bet === 'number') return number === n ? 36 : 0;
  if (n === 0) return 0;
  switch (bet) {
    case 'red':
    case 'black': return colorOf(n) === bet ? 2 : 0;
    case 'even':  return n % 2 === 0 ? 2 : 0;
    case 'odd':   return n % 2 === 1 ? 2 : 0;
    case 'low':   return n <= 18 ? 2 : 0;
    case 'high':  return n >= 19 ? 2 : 0;
  }
  return 0;
}

export default {
  data: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('Bet on the roulette wheel')
    .addIntegerOption(o => o.setName('amount').setDescription('Coins to bet')
      .setMinValue(1).setRequired(true))
    .addStringOption(o => o.setName('bet').setDescription('What to bet on')
      .setRequired(true).addChoices(
        { name: 'Red (x2)', value: 'red' },
        { name: 'Black (x2)', value: 'black' },
        { name: 'Even (x2)', value: 'even' },
        { name: 'Odd (x2)', value: 'odd' },
        { name: 'Low 1-18 (x2)', value: 'low' },
        { name: 'High 19-36 (x2)', value: 'high' },
        { name: 'Exact number (x36)', value: 'number' },
      ))
    .addIntegerOption(o => o.setName('number').setDescription('Number 0-36 (only for exact number bet)')
      .setMinValue(0).setMaxValue(36)),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const bet = interaction.options.getString('bet');
    const number = interaction.options.getInteger('number');
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (bet === 'number' && number === null) {
      return interaction.reply({ content: 'Pick a number from 0 to 36.', ephemeral: true });
    }
    if ((await getBalance(userId, guildId)) < amount) {
      return interaction.reply({ content: "You don't have enough coins.", ephemeral: true });
    }

    await addBalance(userId, guildId, -amount); // take the bet first
    const n = Math.floor(Math.random() * 37);
    const mult = multiplier(bet, number, n);
    if (mult > 0) await addBalance(userId, guildId, amount * mult);

    const won = mult > 0;
    const embed = new EmbedBuilder()
      .setTitle('🎡 Roulette')
      .setColor(won ? 0x2ecc71 : 0xe74c3c)
      .setDescription(
        `The ball landed on **${n}** (${colorOf(n)}).\n\n` +
        (won ? `You won **${amount * (mult - 1)}** coins!` : `You lost **${amount}** coins.`)
      );
    return interaction.reply({ embeds: [embed] });
  },
};
