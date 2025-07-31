#!/bin/bash

# Скрипт для запуска Redis для EchoOn
# Использование: ./start-redis.sh

echo "🔴 Redis Setup для EchoOn"
echo "============================="

# Функция проверки Redis
check_redis() {
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis доступен"
        return 0
    else
        return 1
    fi
}

# Функция запуска Redis через Docker
start_redis_docker() {
    echo "🐳 Запускаю Redis через Docker..."
    
    # Проверяем, не запущен ли уже контейнер
    if docker ps --filter "name=echoon-redis-local" --format "{{.Names}}" | grep -q "echoon-redis-local"; then
        echo "📦 Redis контейнер уже запущен"
        return 0
    fi
    
    # Останавливаем старый контейнер если есть
    docker stop echoon-redis-local >/dev/null 2>&1
docker rm echoon-redis-local >/dev/null 2>&1
    
    # Запускаем новый контейнер
    docker run -d \
        --name echoon-redis-local \
        -p 6379:6379 \
        redis:7-alpine \
        redis-server --appendonly yes
        
    if [ $? -eq 0 ]; then
        echo "🎯 Redis контейнер запущен"
        
        # Ждем готовности
        echo "⏳ Ожидание готовности Redis..."
        for i in {1..10}; do
            if check_redis; then
                echo "🚀 Redis готов к работе!"
                return 0
            fi
            sleep 1
        done
        
        echo "⚠️  Redis запущен но не отвечает"
        return 1
    else
        echo "❌ Не удалось запустить Redis контейнер"
        return 1
    fi
}

# Функция запуска Redis через Homebrew
start_redis_brew() {
    echo "🍺 Пытаюсь запустить Redis через Homebrew..."
    
    # Проверяем установлен ли Redis
    if brew list redis >/dev/null 2>&1; then
        echo "📦 Redis установлен через Homebrew"
        
        # Запускаем сервис
        brew services start redis
        
        # Ждем готовности
        echo "⏳ Ожидание готовности Redis..."
        for i in {1..10}; do
            if check_redis; then
                echo "🚀 Redis готов к работе!"
                return 0
            fi
            sleep 1
        done
        
        echo "⚠️  Redis запущен но не отвечает"
        return 1
    else
        echo "❌ Redis не установлен через Homebrew"
        return 1
    fi
}

# Основная логика
echo "🔍 Проверяю статус Redis..."

if check_redis; then
    echo "🎉 Redis уже запущен и работает!"
    redis-cli info server | grep redis_version || echo "Redis информация недоступна"
    exit 0
fi

echo "📱 Redis не запущен. Пытаюсь запустить..."

# Выбираем способ запуска
if command -v docker &> /dev/null; then
    echo "🐳 Docker доступен, использую Docker..."
    if start_redis_docker; then
        echo ""
        echo "🎛️  Redis запущен через Docker"
        echo "   Контейнер: echoon-redis-local"
        echo "   Порт: 6379"
        echo "   Остановка: docker stop echoon-redis-local"
        exit 0
    fi
fi

# Fallback на Homebrew
if command -v brew &> /dev/null; then
    echo "🍺 Пробую Homebrew..."
    if start_redis_brew; then
        echo ""
        echo "🎛️  Redis запущен через Homebrew"
        echo "   Сервис: brew services list | grep redis"
        echo "   Остановка: brew services stop redis"
        exit 0
    fi
fi

# Если ничего не сработало
echo ""
echo "❌ Не удалось запустить Redis автоматически"
echo ""
echo "📥 Варианты установки:"
echo "   1. Docker: docker run -d -p 6379:6379 --name redis redis:alpine"
echo "   2. Homebrew: brew install redis && brew services start redis"
echo "   3. Manual: Скачайте с https://redis.io/download"
echo ""
exit 1 