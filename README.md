# UNBREAKABLE PHOENIX — Kharkiv Student League 2026

Полноценная веб-платформа студенческой киберспортивной лиги Харькова по дисциплине **Counter-Strike 2** на стеке **Node.js + Express + React + TypeScript + Vite + Tailwind CSS**.

---

## 1. Сохранность первого экрана и анимации Феникса

В соответствии с главным требованием проекта:
- **Исходный прототип** сохранён в полной резервной копии [`фенис сайт.backup.html`](./фенис%20сайт.backup.html) (а также не удалён оригинальный файл [`фенис сайт.html`](./фенис%20сайт.html)).
- **Первый экран (`HeroSection`)** выделен в изолированный компонент [`src/components/HeroSection.tsx`](./src/components/HeroSection.tsx).
- **SVG Феникса** (`viewBox="0 0 1408 768"`, 4 оригинальных контура `<path>`, трансформация `translate(0, 768) scale(0.1, -0.1)`) перенесён байт-в-байт без упрощений и редизайна.
- **Тайминг и анимация загрузки**: задержка `500ms` после монтирования -> добавление класса `.animate-phoenix` -> бесконечная циклическая анимация прорисовки и огненного свечения золотого контура (`stroke-dasharray: 10000`, `animation: draw 8s ease-in-out infinite`), на `4s` плавное появление подзаголовка `KHARKIV STUDENT LEAGUE 2026` (`fadeUp 1s ease-out 4s forwards`).
- **Интерактивность первого экрана**: сохранён оригинальный параллакс-эффект движения SVG Феникса за курсором мыши, глитч-эффект заголовка `UNBREAKABLE PHOENIX`, фоновая система золотых искр (`#particles`) и кастомный золотой прицел-курсор (`.cursor` + `.cursor-dot`).

---

## 2. Архитектура и структура проекта

```text
├── фенис сайт.html                   # Оригинальный HTML-прототип (сохранён)
├── фенис сайт.backup.html            # Резервная копия оригинала
├── index.html                        # Входной HTML клиентского приложения
├── package.json                      # Скрипты и зависимости (React, Express, TypeScript, Vite, Zod)
├── tsconfig.json                     # Конфигурация TypeScript
├── vite.config.ts                    # Конфигурация Vite + proxy /api -> localhost:3001
├── tailwind.config.js                # Фирменная палитра (#050505, #252525, #FFD700, #B8860B) и шрифты
├── .env.example                      # Шаблон переменных окружения без секретов
├── .gitignore                        # Исключения для Git
├── server/
│   ├── index.ts                      # Express + TypeScript API сервер (валидация, защита от спама, сохранение)
│   └── data/
│       └── app.db                    # SQLite-база (создаётся миграцией, в .gitignore)
└── src/
    ├── main.tsx                      # Точка входа React
    ├── App.tsx                       # Сборка секций и управление модальным окном
    ├── types/
    │   └── index.ts                  # TypeScript-интерфейсы данных и API
    ├── data/
    │   └── siteConfig.ts             # Единая конфигурация дат, ЗВО Харькова, этапов, правил безопасности и партнёров
    ├── styles/
    │   └── globals.css               # Оригинальные стили первого экрана + редакционная система
    └── components/
        ├── AmbientEffects.tsx        # Холст частиц (#particles) и кастомный курсор-прицел
        ├── Navigation.tsx            # Адаптивная навигационная панель + мобильное меню
        ├── HeroSection.tsx           # Изолированный оригинальный первый экран с SVG Феникса
        ├── MissionSection.tsx        # Редакционный манифест лиги (швейцарская сетка + фотография)
        ├── TournamentFormatSection.tsx # Интерактивная схема 4 этапов турнира (Online Faceit -> LAN)
        ├── CountdownSection.tsx      # Конфигурируемый хронометр до Grand Final / режим «Дату буде оголошено»
        ├── SafetySection.tsx         # Строгий регламент безопасности в Харькове (без агрессивного декора)
        ├── RegistrationForm.tsx      # Форма подачи заявки с клиентской и серверной валидацией
        ├── RegistrationSection.tsx   # Секция аккредитации команд ЗВО
        ├── PartnersSection.tsx       # Прозрачная секция партнёров (подтверждённые vs потенциальные)
        ├── RegistrationModal.tsx     # Доступное модальное окно регистрации (Esc, клик по фону)
        └── Footer.tsx                # Фирменный футер с контактами и навигацией
```

---

## 3. Инструкция запуска

### Требования
- **Node.js** `>= 20.x` (проверено на `v24.15.0`)
- **npm** `>= 10.x`

### Установка зависимостей
```bash
npm install
cp .env.example .env     # заполнить ключи FACEIT / Discord / SMTP (см. раздел 5)
npm run db:migrate       # создать SQLite-базу server/data/app.db и заполнить справочник ЗВО
```

### Режим разработки (Frontend + Backend одновременно)
Запускает Vite dev-сервер (`http://localhost:5173`) и Express API-сервер (`http://localhost:3001`) с автоматической прокси-переадресацией `/api`:
```bash
npm run dev
```

Также можно запускать клиент и сервер раздельно:
```bash
npm run dev:client   # Только клиент (Vite) на порту 5173
npm run dev:server   # Только API-сервер (Express) на порту 3001
```

### Production-сборка и запуск
```bash
npm run build        # Проверка типов TypeScript + сборка клиентского бандла в dist/
npm start            # Запуск production-сервера Express (раздаёт dist/ и обрабатывает /api/*)
```

---

## 4. Список реально работающих функций

1. **Оригинальный первый экран (`HeroSection`)**:
   - SVG-анимация прорисовки Феникса при загрузке;
   - параллакс-эффект движения за курсором мыши;
   - глитч-эффект заголовка и плавное появление подписи;
   - canvas-система золотых частиц и кастомный курсор-прицел.
2. **Адаптивная навигация (`Navigation`)**:
   - плавная прокрутка ко всем разделам;
   - изменение плотности фона при скролле;
   - мобильное меню с поддержкой закрытия по `Escape`.
3. **Интерактивная схема формата турнира (`TournamentFormatSection`)**:
   - переключение между 4 этапами (Верификация -> Онлайн-квалификация FACEIT -> Плей-офф Топ-8 -> LAN-финал в Харькове) как через верхний таймлайн, так и через сводную таблицу.
4. **Таймер обратного отсчёта (`CountdownSection`)**:
   - управляется через [`src/data/siteConfig.ts`](./src/data/siteConfig.ts) или переменную окружения `VITE_GRAND_FINAL_DATE`;
   - имеет интерактивный переключатель для демонстрации как активного отсчёта, так и официального состояния **«ДАТУ БУДЕ ОГОЛОШЕНО»**, если точная дата ещё не утверждена.
5. **Раздел безопасности (`SafetySection`)**:
   - оформлен в сдержанном редакционном стиле без агрессивных красных карточек;
   - разделяет обязательные турнирные правила (`mp_pause_match` при тревоге, дисциплина эвакуации) и инфраструктурные требования к площадке (сертификация укрытия, генераторы, Starlink), которые редактируются в конфигурации по мере подтверждения организаторами.
6. **Прозрачная секция партнёров (`PartnersSection`)**:
   - разделяет подтверждённых соорганизаторов и потенциальных партнёров (WhiteBIT, GamePro, NON STOP, FIFINE помечены статусом «Потенційний партнер» с возможностью скрыть неподтверждённые бренды одной кнопкой).
7. **Backend лиги (Express + Prisma/SQLite)** — подробности в разделе 5:
   - вход через FACEIT (OAuth2 + PKCE), уровень/ELO/K/D подтягиваются из FACEIT Data API;
   - подтверждение статуса студента: код на корпоративную почту ЗВО или фото студенческого с ручной проверкой админом;
   - команды: капитан создаёт состав, игроки вступают по ссылке-приглашению, по приглашению с рынка или по своей заявке; 5 основных + 2 запасных, все из одного ЗВО;
   - рынок участников: анкеты свободных агентов и объявления команд, которые ищут игроков;
   - Discord: привязка аккаунта, автодобавление на сервер лиги, роли «Игрок»/«Капитан»/роль команды, приватные каналы команды, отвязка;
   - админ-панель (`#/admin`): проверка студенческих, одобрение команд и группы, матчи вручную или импорт с FACEIT по ссылке/ID, журнал действий;
   - статистика: топ игроков, профиль игрока, результаты матчей в кабинете и на главной;
   - честная обработка отключённого бэкенда: при недоступном API интерфейс показывает `BACKEND OFFLINE` и не имитирует успешное сохранение.

---

## 5. Backend: настройка интеграций

Все переменные описаны в [`.env.example`](./.env.example). Без ключей сервер тоже запускается: соответствующие кнопки становятся неактивными.

### FACEIT
1. [developers.faceit.com](https://developers.faceit.com) → App Studio → создать приложение.
2. **API Keys → Server side** → `FACEIT_API_KEY` (Data API: уровень, статистика, импорт матчей).
3. **FACEIT Connect (OAuth2)** → `FACEIT_CLIENT_ID` / `FACEIT_CLIENT_SECRET`, Redirect URL: `${APP_URL}/api/auth/faceit/callback`.
4. `ADMIN_FACEIT_IDS` — FACEIT ID или никнеймы организаторов через запятую; права админа выдаются при входе.

### Discord
1. [discord.com/developers](https://discord.com/developers/applications) → New Application.
2. **OAuth2** → `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`, Redirect: `${APP_URL}/api/discord/callback`.
3. **Bot** → `DISCORD_BOT_TOKEN`. Пригласить бота на сервер лиги с правами *Manage Roles*, *Manage Channels*, *Create Instant Invite*. Роль бота должна стоять **выше** ролей, которые он выдаёт.
4. Включить Developer Mode в Discord и скопировать ID: сервер → `DISCORD_GUILD_ID`, роли «Игрок»/«Капитан» → `DISCORD_PLAYER_ROLE_ID` / `DISCORD_CAPTAIN_ROLE_ID`, категория для каналов команд → `DISCORD_TEAMS_CATEGORY_ID`.

### Почта (коды подтверждения)
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Если `SMTP_HOST` пустой, код выводится в консоль сервера (удобно для разработки).

### Локальная разработка без FACEIT
`DEV_LOGIN=true` добавляет на страницу входа вход по никнейму. В `NODE_ENV=production` он всегда отключён.

### Вход в админ-панель
- **Локально:** `DEV_LOGIN=true` в `.env`, затем в «Кабинет» → DEV-вход с ником `phx_admin` или `phx_judge` (созданы командой `npm run admin:grant -- <ник> --dev`). В кабинете появится кнопка «Адмін-панель», или откройте `#/admin`.
- **Production:** добавьте FACEIT-ники организаторов в `ADMIN_FACEIT_IDS=nick1,nick2` — права выдаются при входе через FACEIT. Либо выдайте права уже вошедшему пользователю: `npm run admin:grant -- <faceit-ник>` (снять — `--revoke`).

### Полезные команды
```bash
npm run db:migrate   # применить новые миграции (dev)
npm run db:deploy    # применить миграции на production
npm run db:seed      # обновить справочник ЗВО из src/data/universities.ts
npm run db:studio    # просмотр базы в браузере
npm run admin:grant -- <ник> [--dev|--revoke]   # права администратора
npm test             # unit-тесты (vitest)
```

### Основные API
| Область | Эндпоинты |
|---|---|
| Вход | `GET /api/auth/faceit/login`, `POST /api/auth/logout`, `GET/PATCH /api/me` |
| Верификация | `POST /api/verification/email`, `/email/confirm`, `/card` |
| Команды | `POST /api/teams`, `POST /api/teams/join/:code`, `POST /api/teams/:id/invites`, `/apply`, `/submit`, `GET /api/invites` |
| Рынок | `GET /api/market/players`, `GET /api/market/teams`, `PUT /api/market/posts/player\|team` |
| Discord | `GET /api/discord/link`, `DELETE /api/discord/link` |
| Публичные | `GET /api/matches`, `/api/stats/leaderboard`, `/api/players/:id`, `/api/teams/:id`, `/api/standings` |
| Админ | `/api/admin/verifications`, `/teams`, `/matches`, `/matches/import/preview\|confirm`, `/users`, `/logs` |
