yUse this endpoint when the Telegram bot receives `/start` from a user who came from the site:

`POST https://konkurs.jahonbozori.uz/api/analytics/telegram-confirm`

Headers:

```text
Content-Type: application/json
x-bot-confirm-secret: <BOT_CONFIRM_SECRET>
```

Body:

```json
{
  "startPayload": "ref_1256520272_v_<visitor-id>"
}
```

Notes:

- `startPayload` is the exact Telegram `start` parameter value received by the bot.
- The site now generates links in this format automatically.
- When this request succeeds, `/analiz` counts the user as someone who really entered the bot and pressed `start`.
