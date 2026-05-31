<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251021000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create chat system tables: conversations, messages, groups, group_members, blocked_users';
    }

    public function up(Schema $schema): void
    {
        // Conversations
        $this->addSql('CREATE TABLE conversations (
            id SERIAL PRIMARY KEY,
            type VARCHAR(20) NOT NULL,
            name VARCHAR(255),
            avatar VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW()
        )');

        // Conversation Participants (many-to-many)
        $this->addSql('CREATE TABLE conversation_participants (
            conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY (conversation_id, user_id)
        )');
        $this->addSql('CREATE INDEX idx_conversation_participants_conv ON conversation_participants(conversation_id)');
        $this->addSql('CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id)');

        // Messages
        $this->addSql('CREATE TABLE messages (
            id SERIAL PRIMARY KEY,
            conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id INT REFERENCES users(id) ON DELETE SET NULL,
            content TEXT NOT NULL,
            type VARCHAR(20) DEFAULT \'text\',
            created_at TIMESTAMP DEFAULT NOW(),
            is_read BOOLEAN DEFAULT FALSE,
            reply_to INT REFERENCES messages(id) ON DELETE SET NULL
        )');
        $this->addSql('CREATE INDEX idx_messages_conversation ON messages(conversation_id)');
        $this->addSql('CREATE INDEX idx_messages_sender ON messages(sender_id)');
        $this->addSql('CREATE INDEX idx_messages_created ON messages(created_at)');

        // Groups
        $this->addSql('CREATE TABLE groups (
            id INT PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
            owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            allow_member_invites BOOLEAN DEFAULT FALSE,
            allow_member_messages BOOLEAN DEFAULT TRUE,
            is_private BOOLEAN DEFAULT FALSE
        )');

        // Group Members
        $this->addSql('CREATE TABLE group_members (
            id SERIAL PRIMARY KEY,
            group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(20) DEFAULT \'member\',
            can_invite BOOLEAN DEFAULT FALSE,
            joined_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(group_id, user_id)
        )');
        $this->addSql('CREATE INDEX idx_group_members_group ON group_members(group_id)');
        $this->addSql('CREATE INDEX idx_group_members_user ON group_members(user_id)');

        // Blocked Users
        $this->addSql('CREATE TABLE blocked_users (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            blocked_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            blocked_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, blocked_user_id)
        )');
        $this->addSql('CREATE INDEX idx_blocked_users_user ON blocked_users(user_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS blocked_users');
        $this->addSql('DROP TABLE IF EXISTS group_members');
        $this->addSql('DROP TABLE IF EXISTS groups');
        $this->addSql('DROP TABLE IF EXISTS messages');
        $this->addSql('DROP TABLE IF EXISTS conversation_participants');
        $this->addSql('DROP TABLE IF EXISTS conversations');
    }
}
