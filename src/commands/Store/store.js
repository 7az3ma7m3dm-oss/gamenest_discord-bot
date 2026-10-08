import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { store } from '../../config/store.js';

export default {
  data: new SlashCommandBuilder()
    .setName('store')
    .setDescription('See GAMENEST prices')
    .addStringOption((o) =>
      o
        .setName('category')
        .setDescription('Pick a category')
        .addChoices(
          { name: 'V-Bucks', value: 'vbucks' },
          { name: 'Crew', value: 'crew' },
          { name: 'Gifts', value: 'gifts' }
        )
    ),

  async execute(interaction) {
    const pick = interaction.options.getString('category');
    const cats = pick ? [store.categories[pick]] : Object.values(store.categories);

    const embed = new EmbedBuilder()
      .setTitle(`${store.name} Store`)
      .setColor(store.color)
      .setFooter({ text: `Payment: ${store.payments}` });

    for (const c of cats) {
      embed.addFields({
        name: c.title,
        value: c.items
          .map((i) => `**${i.name}** - ${i.price} ${store.currency}`)
          .join('\n'),
      });
    }

    if (!pick || pick === 'gifts') {
      embed.setDescription(`Gifts username: **${store.giftUsername}**`);
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open Website')
        .setStyle(ButtonStyle.Link)
        .setURL(store.url)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { store } from '../../config/store.js';

export default {
  data: new SlashCommandBuilder()
    .setName('store')
    .setDescription('See GAMENEST prices')
    .addStringOption((o) =>
      o
        .setName('category')
        .setDescription('Pick a category')
        .addChoices(
          { name: 'V-Bucks', value: 'vbucks' },
          { name: 'Crew', value: 'crew' },
          { name: 'Gifts', value: 'gifts' }
        )
    ),

  async execute(interaction) {
    const pick = interaction.options.getString('category');
    const cats = pick ? [store.categories[pick]] : Object.values(store.categories);

    const embed = new EmbedBuilder()
      .setTitle(`${store.name} Store`)
      .setColor(store.color)
      .setFooter({ text: `Payment: ${store.payments}` });

    for (const c of cats) {
      embed.addFields({
        name: c.title,
        value: c.items
          .map((i) => `**${i.name}** - ${i.price} ${store.currency}`)
          .join('\n'),
      });
    }

    if (!pick || pick === 'gifts') {
      embed.setDescription(`Gifts username: **${store.giftUsername}**`);
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Open Website')
        .setStyle(ButtonStyle.Link)
        .setURL(store.url)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
