<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration: Add post_comment_likes table for comment likes
 */
final class Version20251018100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add post_comment_likes table to enable likes on comments';
    }

    public function up(Schema $schema): void
    {
        // Create post_comment_likes table
        $this->addSql('CREATE TABLE post_comment_likes (id SERIAL NOT NULL, user_id INT NOT NULL, comment_id INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_8B8E0E44A76ED395 ON post_comment_likes (user_id)');
        $this->addSql('CREATE INDEX IDX_8B8E0E44F8697D13 ON post_comment_likes (comment_id)');
        $this->addSql('CREATE UNIQUE INDEX user_comment_unique ON post_comment_likes (user_id, comment_id)');
        $this->addSql('COMMENT ON COLUMN post_comment_likes.created_at IS \'(DC2Type:datetime_immutable)\'');
        
        // Add foreign key constraints
        $this->addSql('ALTER TABLE post_comment_likes ADD CONSTRAINT FK_8B8E0E44A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE post_comment_likes ADD CONSTRAINT FK_8B8E0E44F8697D13 FOREIGN KEY (comment_id) REFERENCES post_comments (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // Drop table and constraints
        $this->addSql('ALTER TABLE post_comment_likes DROP CONSTRAINT FK_8B8E0E44A76ED395');
        $this->addSql('ALTER TABLE post_comment_likes DROP CONSTRAINT FK_8B8E0E44F8697D13');
        $this->addSql('DROP TABLE post_comment_likes');
    }
}
