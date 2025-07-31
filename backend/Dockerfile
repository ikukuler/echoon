# Multi-stage Docker build для EchoOn Backend
# Stage 1: Build TypeScript приложения
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для оптимизации кэширования слоев
COPY package*.json ./

# Устанавливаем зависимости (включая dev dependencies для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем TypeScript в JavaScript
RUN npm run build

# Удаляем dev dependencies для уменьшения размера
RUN npm prune --omit=dev

# Stage 2: Production runtime
FROM node:18-alpine AS production

# Создаем non-root пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S echoon -u 1001

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json для метаданных
COPY package*.json ./

# Копируем production dependencies из builder stage
COPY --from=builder /app/node_modules ./node_modules

# Копируем скомпилированный JavaScript код
COPY --from=builder /app/dist ./dist

# Копируем необходимые конфигурационные файлы
COPY database.sql ./

# Изменяем владельца файлов на non-root пользователя
RUN chown -R echoon:nodejs /app
USER echoon

# Открываем порт
EXPOSE 3000

# Определяем health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } }); req.on('error', () => process.exit(1)); req.on('timeout', () => process.exit(1)); req.end();"

# Запускаем приложение
CMD ["node", "dist/server.js"] 