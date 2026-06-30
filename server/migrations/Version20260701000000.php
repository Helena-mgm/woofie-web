<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260701000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Admin system: is_verified on users, forbidden_keywords table, system message type';
    }

    public function up(Schema $schema): void
    {
        // Verification flag on every user account (RGPD: non vérifié par défaut)
        $this->addSql("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE");

        // Forbidden keywords table for community moderation
        $this->addSql("CREATE TABLE IF NOT EXISTS forbidden_keywords (
            id SERIAL PRIMARY KEY,
            keyword VARCHAR(255) NOT NULL UNIQUE
        )");

        // Allow 'system' as a message type (join / leave / created events)
        // message.type is VARCHAR(20) — existing constraint is app-level only, nothing to migrate.
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE users DROP COLUMN IF EXISTS is_verified");
        $this->addSql("DROP TABLE IF EXISTS forbidden_keywords");
    }
}
