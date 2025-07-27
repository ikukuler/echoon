-- EchoWall Database Schema
-- Обновленная схема для email/password авторизации

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (обновленная для email/password авторизации)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Хешированный пароль
    name VARCHAR(255), -- Опциональное имя пользователя
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Echoes table
CREATE TABLE IF NOT EXISTS echoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    return_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Echo parts table
CREATE TABLE IF NOT EXISTS echo_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    echo_id UUID NOT NULL REFERENCES echoes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'image', 'audio', 'video', 'link', 'location')),
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tokens table (для push уведомлений)
CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fcm_token VARCHAR(500) NOT NULL,
    device_id VARCHAR(255),
    device_type VARCHAR(50) DEFAULT 'mobile',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, fcm_token)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_echoes_user_id ON echoes(user_id);
CREATE INDEX IF NOT EXISTS idx_echoes_return_at ON echoes(return_at);
CREATE INDEX IF NOT EXISTS idx_echo_parts_echo_id ON echo_parts(echo_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_fcm_token ON user_tokens(fcm_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE echoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE echo_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (for backend operations)
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage echoes" ON echoes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage echo parts" ON echo_parts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage user tokens" ON user_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Echoes policies
CREATE POLICY "Users can view own echoes" ON echoes
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own echoes" ON echoes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own echoes" ON echoes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own echoes" ON echoes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Echo parts policies
CREATE POLICY "Users can view own echo parts" ON echo_parts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM echoes 
            WHERE echoes.id = echo_parts.echo_id 
            AND echoes.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create own echo parts" ON echo_parts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM echoes 
            WHERE echoes.id = echo_parts.echo_id 
            AND echoes.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own echo parts" ON echo_parts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM echoes 
            WHERE echoes.id = echo_parts.echo_id 
            AND echoes.user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own echo parts" ON echo_parts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM echoes 
            WHERE echoes.id = echo_parts.echo_id 
            AND echoes.user_id::text = auth.uid()::text
        )
    );

-- User tokens policies
CREATE POLICY "Users can view own tokens" ON user_tokens
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own tokens" ON user_tokens
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own tokens" ON user_tokens
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own tokens" ON user_tokens
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_echoes_updated_at BEFORE UPDATE ON echoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (опционально)
-- INSERT INTO users (email, password_hash, name) VALUES 
-- ('test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJhKz8O', 'Test User');

-- INSERT INTO echoes (user_id, return_at) VALUES 
-- ((SELECT id FROM users WHERE email = 'test@example.com'), NOW() + INTERVAL '1 day');

-- INSERT INTO echo_parts (echo_id, type, content, order_index) VALUES 
-- ((SELECT id FROM echoes LIMIT 1), 'text', 'Hello from the past!', 0); 