# Realty — Telegram Mini App (Дніпро)

Преміум застосунок для перегляду нерухомості з кабінетом ріелтора.
Стек: **Fastify + PostgreSQL + grammY + Vite/React/TypeScript + Leaflet + Docker Compose**.

## Структура

```
realty/
├─ backend/        Fastify API (TypeScript)
├─ bot/            Telegram bot (grammY) — уведомления, напоминания, сводки
├─ frontend/       Vite + React + TS — Mini App UI
├─ nginx/          Reverse proxy
├─ docker-compose.yml
└─ .env.example
```

## Что нужно перед запуском

1. **VPS с Linux** (Ubuntu 22+/Debian 12+) и **Docker + Docker Compose**.
2. **Домен** с DNS A-записью на IP VPS (например `realty.example.com`).
3. **Telegram бот** через [@BotFather](https://t.me/BotFather):
   - получить `BOT_TOKEN`
   - в `/setdomain` указать ваш домен (`https://realty.example.com`)
   - в `/newapp` создать Mini App с URL `https://realty.example.com`
   - запомнить `@bot_username`
4. **Telegram ID ріелторів** (2 шт.) — узнать через [@userinfobot](https://t.me/userinfobot).

## Первичная настройка

```bash
# 1. Клонировать на VPS
git clone <repo> realty && cd realty

# 2. Заполнить .env
cp .env.example .env
nano .env
# Обязательно: POSTGRES_PASSWORD, JWT_SECRET (рандом 64 символа),
#   BOT_TOKEN, REALTOR_TG_IDS, APP_URL, VITE_API_URL, VITE_BOT_USERNAME

# 3. Запустить
docker compose up -d

# 4. Применить миграции
docker compose exec api npm run migrate

# 5. Проверка
curl http://localhost/health
```

## HTTPS (Let's Encrypt)

Telegram Mini App требует HTTPS. После запуска контейнеров:

```bash
# Установить certbot на хост
apt install -y certbot

# Получить сертификат (порт 80 должен быть свободен — временно остановите nginx)
docker compose stop nginx
certbot certonly --standalone -d your-domain.com -m you@email.com --agree-tos
# Сертификаты лягут в /etc/letsencrypt/live/your-domain.com/

# Скопировать в проект
mkdir -p nginx/certs
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem  nginx/certs/

# В nginx/nginx.conf раскомментировать HTTPS-блок и редирект 80→443
# Перезапустить nginx
docker compose up -d nginx
```

Автообновление сертификата (cron на хосте):
```
0 3 * * * certbot renew --quiet --post-hook "docker compose -f /path/to/realty/docker-compose.yml restart nginx"
```

## Команды

```bash
# Статус сервисов
docker compose ps

# Логи
docker compose logs -f api
docker compose logs -f bot
docker compose logs -f nginx

# Применить новые миграции
docker compose exec api npm run migrate

# Зайти в БД
docker compose exec db psql -U realty -d realty

# Бэкап вручную
docker compose exec backup sh -c 'pg_dump -h db -U realty -d realty | gzip > /backups/manual_$(date +%F).sql.gz'

# Обновление после изменений
git pull
docker compose up -d --build
docker compose exec api npm run migrate
```

## Что есть из коробки

### Клиент (любой Telegram-пользователь, кроме риелторов)
- Огляд об'єктів з фільтрами і пошуком (адреса/ЖК/район)
- Деталі + галерея
- Карта Дніпра з пінами цін (Leaflet + OSM)
- Обране
- Запис на перегляд (мінімум за 2 години), ім'я і телефон зберігаються в профілі
- Скасування запису з підтвердженням
- Поділитися в Telegram (deep-link на конкретний об'єкт)

### Ріелтор (TG ID з `REALTOR_TG_IDS`)
- Кабінет з аналітикою (активні / закриті / заявки 7/30д / перегляди / збереження)
- Створення/редагування/видалення об'єктів (всі поля з ТЗ)
- Чорнетки
- Завантаження до 50 фото на об'єкт (авто-сжатие до 1920px)
- Вибір точки на карті кліком
- Список лідів з кнопками «Подзвонити / Telegram / Завершити / Скасувати»
- Закриття об'єкта зі статусом «продано/здано» або «знято»

### Автоматизація
- **Раз на день о 09:00 Київ**: оновлення курсу USD з НБУ
- **Кожні 10 хв**: розсилка нагадувань клієнтам (за день і за годину до перегляду)
- **21:00 щодня**: підсумок дня ріелторам у бот
- **Понеділок 09:00**: тижневий звіт ріелторам
- **Раз на день**: бекап БД і uploads у `backups/`, зберігаються 14 днів

### Безпека
- Авторизація через Telegram `initData` (HMAC-SHA256)
- JWT з TTL
- Тільки ріелтори з `REALTOR_TG_IDS` можуть змінювати дані

## Локальна розробка (без Telegram)

```bash
# БД
docker compose up -d db
docker compose exec api npm run migrate

# API
cd backend && npm install && npm run dev

# Bot (опційно)
cd bot && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
# Відкрити http://localhost:5173
```

Без Telegram WebApp авторизація не пройде — для тестування фронта на чистому браузері додайте моковий токен через DevTools (`localStorage.realty_token = '...'`).

## Дорожня карта

- ✅ MVP: всі екрани з ТЗ
- 🔜 Шеринг з inline-карткою (потребує налаштування `inline_mode` бота)
- 🔜 Онбординг ріелтора
- 🔜 Чат у застосунку
- 🔜 Іпотечний калькулятор

---

Питання — пиши в issue або в Telegram.
