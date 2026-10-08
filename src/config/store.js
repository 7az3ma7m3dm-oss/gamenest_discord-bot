export const store = {
  name: 'GAMENEST',
  url: 'https://gamenest.shop',
  color: 0x5865f2,
  currency: 'EGP',
  giftUsername: 'GamenestGifts',
  payments: 'InstaPay, Telda',
  categories: {
    vbucks: {
      title: 'V-Bucks',
      items: [
        { name: '800 VB', price: 199 },
        { name: '2400 VB', price: 549 },
        { name: '4500 VB', price: 849 },
        { name: '12500 VB', price: 1899 },
      ],
    },
    crew: {
      title: 'Fortnite Crew',
      items: [
        { name: 'Crew Pack', price: 209 },
        { name: '1 Month Crew', price: 210 },
        { name: '2 Months Crew', price: 379 },
        { name: '3 Months Crew', price: 559 },
        { name: '6 Months Crew', price: 1049 },
        { name: '12 Months Crew', price: 1959 },
      ],
    },
    gifts: {
      title: 'Fortnite Gifts',
      items: [
        { name: '500 Gift', price: 95 },
        { name: '800 Gift', price: 150 },
        { name: '1200 Gift', price: 225 },
        { name: '1500 Gift', price: 280 },
        { name: '1800 Gift', price: 330 },
        { name: '2000 Gift', price: 375 },
      ],
    },
  },
};
