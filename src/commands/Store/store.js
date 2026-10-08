import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
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
    const deferred = await InteractionHelper.safeDefer(interaction);
    if (!deferred) return;

    try {
      const pick = interaction.options.getString('category');
      const keys = pick ? [pick] : Object.keys(store.categories);

      const embed = createEmbed({
        title: `${store.emojis.vbucks} ${store.name} Store`,
        description:
          '**Fast & trusted Fortnite top-ups**\n' +
          'Pick what you want below, then open a ticket to order.',
      });
      embed.setColor(store.color);

      for (const key of keys) {
        const c = store.categories[key];
        const emoji = store.emojis[key];
        embed.addFields({
          name: `${emoji} ${c.title}`,
          value: c.items
            .map((i) => `${emoji} **${i.name}** ➜ \`${i.price} ${store.currency}\``)
            .join('\n'),
          inline: false,
        });
      }

      if (!pick || pick === 'gifts') {
        embed.addFields({
          name: `${store.emojis.gifts} Gifts Account`,
          value: `Add **${store.giftUsername}** on Fortnite to receive gifts.`,
        });
      }

      embed.addFields({
        name: '💳 Payment Methods',
        value: store.payments,
      });

      embed.setFooter({ text: `${store.name} • ${store.url.replace('https://', '')}` });
      embed.setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Order on Website')
          .setStyle(ButtonStyle.Link)
          .setURL(store.url)
      );

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      logger.error('Store command error:', error);
    }
  },
};
