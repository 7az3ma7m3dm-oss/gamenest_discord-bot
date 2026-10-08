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
      const cats = pick ? [store.categories[pick]] : Object.values(store.categories);

      const embed = createEmbed({
        title: `${store.name} Store`,
        description:
          !pick || pick === 'gifts'
            ? `Gifts username: **${store.giftUsername}**`
            : null,
      });

      for (const c of cats) {
        embed.addFields({
          name: c.title,
          value: c.items
            .map((i) => `**${i.name}** - ${i.price} ${store.currency}`)
            .join('\n'),
        });
      }

      embed.setFooter({ text: `Payment: ${store.payments}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Open Website')
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
