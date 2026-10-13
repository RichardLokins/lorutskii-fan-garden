# lorutskii ♡ fan garden — GitHub Pages

## 1. Опубликовать сайт
1. На GitHub создай репозиторий `lorutskii-fan-garden` (можно Public).
2. Нажми **Add file → Upload files** и загрузи в корень репозитория `index.html`, `app.js`, `config.js`. `supabase.sql` и `README.md` можно тоже загрузить для удобства.
3. Нажми **Commit changes**.
4. Если нужен общий счётчик, выполни SQL из `supabase.sql` в Supabase → SQL Editor, затем укажи URL и publishable key в `config.js`.
5. Открой **Settings → Pages**. В разделе **Build and deployment** выбери **Deploy from a branch**, ветку `main`, папку `/(root)`, нажми **Save**.
6. Дождись публикации. Адрес будет показан на странице Settings → Pages.

## 2. Подключить общий счётчик, голосование и гостевую книгу
1. Создай проект в Supabase.
2. Открой **SQL Editor**, создай запрос и выполни содержимое `supabase.sql`.
3. В Supabase найди Project URL и **Publishable key** (старый `anon` key тоже подходит).
4. В GitHub открой `config.js` → Edit и замени `YOUR_SUPABASE_PROJECT_URL` и `YOUR_SUPABASE_PUBLISHABLE_KEY` на свои значения, затем Commit changes.

Используй только publishable key или старый anon key. Никогда не помещай `secret` / `service_role` key в браузерный код. Публичный ключ виден всем посетителям; доступ к данным должен ограничиваться RLS и минимальными правами.

Без настройки Supabase сайт открывается в локальном демо-режиме: счётчик, голосование и сообщения будут храниться только в браузере конкретного посетителя и не будут общими.

## Примечание
Это неофициальный фан-проект. Ссылку на Twitch можно проверить и при необходимости изменить в `index.html`.
