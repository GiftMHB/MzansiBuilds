CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE 

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL for Google OAuth users
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,              -- For Google profile picture
    provider VARCHAR(20) DEFAULT 'email', -- 'email' or 'google'
    provider_id VARCHAR(255),     -- Google user ID
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure either password_hash (for email) OR provider_id (for Google) exists
    CONSTRAINT valid_auth CHECK (
        (provider = 'email' AND password_hash IS NOT NULL) OR
        (provider = 'google' AND provider_id IS NOT NULL)
    )
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);


-- PASSWORD RESET TOKENS TABLE

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for password reset lookups
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens(expires_at);

-- SESSIONS TABLE (for Google OAuth)

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_session_user ON sessions(user_id);

-- PROJECTS TABLE

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    stage VARCHAR(50) DEFAULT 'planning',
    support_needed TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_stage CHECK (stage IN ('planning', 'in_progress', 'review', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_completed ON projects(is_completed);
CREATE INDEX IF NOT EXISTS idx_projects_feed ON projects(is_completed, created_at DESC);

-- MILESTONES TABLE

CREATE TABLE IF NOT EXISTS milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    achieved_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);

-- COLLABORATION REQUESTS TABLE

CREATE TABLE IF NOT EXISTS collaboration_requests (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined'))
);

CREATE INDEX IF NOT EXISTS idx_collab_project_id ON collaboration_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_from_user ON collaboration_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_status ON collaboration_requests(status);


--- AUTO-UPDATE TIMESTAMP FUNCTION

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- GAMIFICATION TABLES

-- User XP and Level tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    requirement_type VARCHAR(50), -- 'xp', 'projects_completed', 'collaborations', 'streak'
    requirement_value INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User badges (many-to-many)
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- XP History (for auditing and leaderboards)
CREATE TABLE IF NOT EXISTS xp_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'create_project', 'add_milestone', 'complete_project', etc.
    xp_earned INTEGER NOT NULL,
    reference_id INTEGER, -- project_id or milestone_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Challenges master table
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50), -- 'daily', 'weekly', 'special'
    action_type VARCHAR(50), -- 'add_milestone', 'accept_collab', 'comment', etc.
    required_count INTEGER DEFAULT 1,
    xp_reward INTEGER DEFAULT 0,
    badge_id INTEGER REFERENCES badges(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- User challenge progress
CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    date_assigned DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, challenge_id, date_assigned)
);

-- GitHub connections
CREATE TABLE IF NOT EXISTS github_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_user_id VARCHAR(100) UNIQUE NOT NULL,
    github_username VARCHAR(100),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repository connections to projects
CREATE TABLE IF NOT EXISTS project_repositories (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repo_url VARCHAR(500) NOT NULL,
    repo_owner VARCHAR(100),
    repo_name VARCHAR(100),
    webhook_id VARCHAR(100),
    last_synced_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Auto-created milestones from GitHub commits
CREATE TABLE IF NOT EXISTS github_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    commit_sha VARCHAR(40),
    commit_message TEXT,
    milestone_id INTEGER REFERENCES milestones(id),
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);