require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

const token = '7194536028:AAHP5LE4oygs5tBND3wdNb2Ym4yw1htATDc';

const bot = new TelegramBot(token, { polling: true });

let lastPriceBTC = null;
let lastPriceTON = null;
let userIds = new Set();

// Загружаем chat.id пользователей из файла, если он есть
try {
  const data = fs.readFileSync('users.json');
  userIds = new Set(JSON.parse(data));
} catch (e) {
  console.log('users.json не знайдено, створюю новий список');
}

// Получение цены BTC с сайта Coindesk
const getBTCPrice = async () => {
  const res = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
  return parseFloat(res.data.price);
};

const getTONPrice = async () => {
  const res = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT');
  return parseFloat(res.data.price);
};

// Проверка изменения цены и отправка уведомлений
const checkPrice = async () => {
  try {
    const currentPriceBTC = await getBTCPrice();
    console.log(`Актуальна ціна BTC: $${currentPriceBTC}`);

    const currentPriceTON = await getTONPrice();
    console.log(`Актуальна ціна TON: $${currentPriceTON}`);

    if (lastPriceBTC !== null) {
      const diff = ((currentPriceBTC - lastPriceBTC) / lastPriceBTC) * 100;
      console.log(`Зміна: ${diff.toFixed(2)}%`);

      if (Math.abs(diff) >= 0) {
        for (let id of userIds) {
          bot.sendMessage(id, `💰 Ціна BTC змінилась на ${diff.toFixed(2)}%: $${currentPriceBTC}`);
        }
        lastPriceBTC = currentPriceBTC;
      }
    } else {
      lastPriceBTC = currentPriceBTC;
    }

    if (lastPriceTON !== null) {
      const diff = ((currentPriceTON - lastPriceTON) / lastPriceTON) * 100;
      console.log(`Зміна: ${diff.toFixed(2)}%`);

      if (Math.abs(diff) >= 0) {
        for (let id of userIds) {
          bot.sendMessage(id, `💰 Ціна TON змінилась на ${diff.toFixed(2)}%: $${currentPriceTON}`);
        }
        lastPriceTON = currentPriceTON;
      }
    } else {
      lastPriceTON = currentPriceTON;
    }

  } catch (err) {
    console.error('Помилка при отриманні ціни:', err);
  }
};

// Проверять цену каждую минуту
setInterval(checkPrice, 300 * 1000);

// Команда /start — сохраняет chat.id пользователя
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  if (!userIds.has(id)) {
    userIds.add(id);
    fs.writeFileSync('users.json', JSON.stringify([...userIds]));
    console.log(`Добавлен новый пользователь: ${id}`);
  }
  bot.sendMessage(id, '✅ Ти підписаний на оновлення BTC i TON!');
  
});

