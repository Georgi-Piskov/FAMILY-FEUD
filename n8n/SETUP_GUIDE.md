# n8n Backend Setup Guide - Family Feud

## 📋 Prerequisites

1. **n8n instance** - Cloud или self-hosted
2. **Grok API ключ** от https://console.x.ai/

---

## 🚀 Setup Steps

### Step 1: Вземи Grok API Key

1. Отиди на https://console.x.ai/
2. Регистрирай се / влез
3. Създай нов API key
4. Копирай ключа (започва с `xai-...`)

### Step 2: Импортни workflow в n8n

1. Отвори n8n
2. Създай нов workflow
3. Кликни на менюто (⋮) → **Import from File**
4. Избери `family-feud-workflow.json`

### Step 3: Настрой Grok API Credentials

1. В n8n отиди на **Credentials** (ляво меню)
2. Кликни **Add Credential**
3. Търси **Header Auth**
4. Настрой:
   - **Name**: `Grok API`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer xai-YOUR-API-KEY-HERE`
5. Save

### Step 4: Свържи credentials с nodes

1. В workflow-а кликни на всеки **Grok - ...** node
2. В Credentials избери `Grok API`
3. Save

### Step 5: Активирай workflow

1. Кликни **Active** toggle в горния десен ъгъл
2. Workflow-ът ще започне да слуша за webhook requests

### Step 6: Вземи Webhook URLs

1. Кликни на всеки Webhook node
2. Копирай **Production URL**
3. URLs ще изглеждат така:
   - `https://your-n8n.app.n8n.cloud/webhook/family-feud/new-game`
   - `https://your-n8n.app.n8n.cloud/webhook/family-feud/next-question`
   - `https://your-n8n.app.n8n.cloud/webhook/family-feud/check-answer`

---

## 🔗 API Endpoints

### POST /family-feud/new-game
Започва нова игра и генерира първи въпрос.

**Request:**
```json
{
  "spiciness": 50
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_123456",
  "question": {
    "id": "q_123456",
    "text": "Name something people do in the morning",
    "answers": [
      {"text": "Brush Teeth", "points": 32, "slot": 1, "revealed": false},
      ...
    ]
  }
}
```

### POST /family-feud/next-question
Генерира следващ въпрос или Fast Money въпроси.

**Request:**
```json
{
  "spiciness": 50,
  "mode": "normal" // или "fast-money"
}
```

### POST /family-feud/check-answer
Проверява дали отговорът е правилен.

**Request:**
```json
{
  "answer": "brush teeth",
  "answers": [
    {"text": "Brush Teeth", "points": 32},
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "match": true,
  "slotIndex": 0,
  "answer": {"text": "Brush Teeth", "points": 32}
}
```

---

## 🌶️ Spiciness Levels

- **0-30%**: Family-friendly въпроси
- **30-70%**: Леко пикантни, suggestive humor
- **70-100%**: Adult humor (не explicit, но spicy)

---

## 🐛 Troubleshooting

### CORS Errors
Workflow-ът вече има CORS headers настроени. Ако има проблеми:
1. Провери дали workflow е **Active**
2. Провери URL-а в frontend config

### API Rate Limits
Grok има rate limits. Ако получаваш errors:
1. Добави delay между requests
2. Cache въпросите локално

### Invalid JSON Response
Понякога Grok връща markdown formatting. Code nodes-те handle-ват това автоматично.

---

## ✅ Testing

Тествай с curl:

```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/family-feud/new-game \
  -H "Content-Type: application/json" \
  -d '{"spiciness": 50}'
```
