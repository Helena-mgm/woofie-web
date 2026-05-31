<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration: Add parent_id to post_comments for nested replies
 */
final class Version20251017140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add parent_id column to post_comments table for nested comment replies';
    }

    public function up(Schema $schema): void
    {
        // Add parent_id column with self-referencing foreign key
        $this->addSql('ALTER TABLE post_comments ADD parent_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE post_comments ADD CONSTRAINT FK_E0731F8B727ACA70 FOREIGN KEY (parent_id) REFERENCES post_comments (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_E0731F8B727ACA70 ON post_comments (parent_id)');
    }

    public function down(Schema $schema): void
    {
        // Remove parent_id column and constraints
        $this->addSql('ALTER TABLE post_comments DROP CONSTRAINT FK_E0731F8B727ACA70');
        $this->addSql('DROP INDEX IDX_E0731F8B727ACA70');
        $this->addSql('ALTER TABLE post_comments DROP parent_id');
    }
}
