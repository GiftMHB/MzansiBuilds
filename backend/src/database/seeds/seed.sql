-- test data
-- Seed data for MzansiBuilds development

-- Clear existing data (order matters due to foreign keys)
TRUNCATE collaboration_requests CASCADE;
TRUNCATE milestones CASCADE;
TRUNCATE projects CASCADE;
TRUNCATE password_reset_tokens CASCADE;
TRUNCATE sessions CASCADE;
TRUNCATE users CASCADE;

-- Test Users
INSERT INTO users (email, password_hash, name, avatar_url, provider, email_verified) VALUES
('thabo@example.com', '$2b$10$YourHashedPasswordHere', 'Thabo Nkosi', 'https://ui-avatars.com/api/?background=2e7d32&color=fff&name=Thabo+Nkosi', 'email', true),
('linda@example.com', '$2b$10$YourHashedPasswordHere', 'Linda Dlamini', 'https://ui-avatars.com/api/?background=2e7d32&color=fff&name=Linda+Dlamini', 'email', true),
('sipho@example.com', '$2b$10$YourHashedPasswordHere', 'Sipho Mkhize', 'https://ui-avatars.com/api/?background=2e7d32&color=fff&name=Sipho+Mkhize', 'email', true);

-- Projects
INSERT INTO projects (user_id, title, description, stage, support_needed, is_completed) VALUES
(1, 'TaskFlow - Task Management App', 'A beautiful task manager with kanban boards', 'in_progress', 'UI/UX designer needed for mobile view', false),
(1, 'EduConnect SA', 'Connecting tutors with students in townships', 'planning', 'Backend developer for payment integration', false),
(2, 'GreenMarket', 'Platform for local farmers to sell produce', 'review', 'Testing and bug fixes', false),
(2, 'HealthTracker Pro', 'Wellness app for chronic disease management', 'in_progress', 'Database optimization help', false),
(3, 'CodeCollab', 'Real-time pair programming tool', 'completed', 'None - project complete!', true),
(3, 'SmartLock IoT', 'IoT security system for home', 'planning', 'Hardware engineer consultation', false);

-- Milestones
INSERT INTO milestones (project_id, description, achieved_date) VALUES
(1, 'Created project repository', '2026-04-01'),
(1, 'Designed database schema', '2026-04-03'),
(1, 'Implemented user authentication', '2026-04-05'),
(2, 'Market research completed', '2026-04-02'),
(3, 'MVP launched', '2026-03-28'),
(3, 'User testing completed', '2026-04-01'),
(5, 'MVP launched', '2026-03-15'),
(5, 'Added real-time features', '2026-03-25'),
(5, 'Final deployment', '2026-04-05');

-- Collaboration Requests
INSERT INTO collaboration_requests (from_user_id, project_id, message, status) VALUES
(2, 1, 'I can help with the UI/UX design!', 'pending'),
(3, 1, 'Frontend developer here, interested in TaskFlow', 'pending'),
(1, 3, 'Love the GreenMarket idea! Can help with marketing', 'accepted'),
(3, 4, 'Database expert here, happy to help optimize', 'pending');

-- Password reset tokens (expired demo)
INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES
(1, 'demo-token-123', NOW() - INTERVAL '2 hours', true);

-- Sessions (demo)
INSERT INTO sessions (user_id, session_token, expires_at) VALUES
(1, 'demo-session-token', NOW() + INTERVAL '7 days');

-- Verify data
SELECT 
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM projects) as projects_count,
    (SELECT COUNT(*) FROM milestones) as milestones_count,
    (SELECT COUNT(*) FROM collaboration_requests) as collab_count;

-- Celebration Wall View (for completed projects with builder info)
CREATE OR REPLACE VIEW celebration_wall AS
SELECT 
    p.id as project_id,
    p.title,
    p.description,
    p.created_at as completed_date,
    u.id as builder_id,
    u.name as builder_name,
    u.avatar_url,
    COUNT(m.id) as milestone_count
FROM projects p
JOIN users u ON p.user_id = u.id
LEFT JOIN milestones m ON p.id = m.project_id
WHERE p.is_completed = true
GROUP BY p.id, u.id
ORDER BY p.updated_at DESC;

-- Feed View ,all projects with latest first
CREATE OR REPLACE VIEW project_feed AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.stage,
    p.support_needed,
    p.created_at,
    p.updated_at,
    u.name as builder_name,
    u.avatar_url,
    COUNT(DISTINCT c.id) as collaboration_count
FROM projects p
JOIN users u ON p.user_id = u.id
LEFT JOIN collaboration_requests c ON p.id = c.project_id
GROUP BY p.id, u.id
ORDER BY p.created_at DESC;