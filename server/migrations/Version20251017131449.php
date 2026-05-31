<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251017131449 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE post_comments (id SERIAL NOT NULL, user_id INT NOT NULL, post_id INT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_E0731F8BA76ED395 ON post_comments (user_id)');
        $this->addSql('CREATE INDEX IDX_E0731F8B4B89032C ON post_comments (post_id)');
        $this->addSql('COMMENT ON COLUMN post_comments.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE post_images (id SERIAL NOT NULL, post_id INT NOT NULL, image_path VARCHAR(255) NOT NULL, display_order INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_D03D5A0F4B89032C ON post_images (post_id)');
        $this->addSql('COMMENT ON COLUMN post_images.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE post_likes (id SERIAL NOT NULL, user_id INT NOT NULL, post_id INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_DED1C292A76ED395 ON post_likes (user_id)');
        $this->addSql('CREATE INDEX IDX_DED1C2924B89032C ON post_likes (post_id)');
        $this->addSql('CREATE UNIQUE INDEX user_post_unique ON post_likes (user_id, post_id)');
        $this->addSql('COMMENT ON COLUMN post_likes.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE posts (id SERIAL NOT NULL, user_id INT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_885DBAFAA76ED395 ON posts (user_id)');
        $this->addSql('COMMENT ON COLUMN posts.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN posts.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE post_dogs (post_id INT NOT NULL, dog_id INT NOT NULL, PRIMARY KEY(post_id, dog_id))');
        $this->addSql('CREATE INDEX IDX_FC6E89B84B89032C ON post_dogs (post_id)');
        $this->addSql('CREATE INDEX IDX_FC6E89B8634DFEB ON post_dogs (dog_id)');
        $this->addSql('ALTER TABLE post_comments ADD CONSTRAINT FK_E0731F8BA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE post_comments ADD CONSTRAINT FK_E0731F8B4B89032C FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE post_images ADD CONSTRAINT FK_D03D5A0F4B89032C FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE post_likes ADD CONSTRAINT FK_DED1C292A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE post_likes ADD CONSTRAINT FK_DED1C2924B89032C FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE posts ADD CONSTRAINT FK_885DBAFAA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE post_dogs ADD CONSTRAINT FK_FC6E89B84B89032C FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE post_dogs ADD CONSTRAINT FK_FC6E89B8634DFEB FOREIGN KEY (dog_id) REFERENCES dogs (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE post_comments DROP CONSTRAINT FK_E0731F8BA76ED395');
        $this->addSql('ALTER TABLE post_comments DROP CONSTRAINT FK_E0731F8B4B89032C');
        $this->addSql('ALTER TABLE post_images DROP CONSTRAINT FK_D03D5A0F4B89032C');
        $this->addSql('ALTER TABLE post_likes DROP CONSTRAINT FK_DED1C292A76ED395');
        $this->addSql('ALTER TABLE post_likes DROP CONSTRAINT FK_DED1C2924B89032C');
        $this->addSql('ALTER TABLE posts DROP CONSTRAINT FK_885DBAFAA76ED395');
        $this->addSql('ALTER TABLE post_dogs DROP CONSTRAINT FK_FC6E89B84B89032C');
        $this->addSql('ALTER TABLE post_dogs DROP CONSTRAINT FK_FC6E89B8634DFEB');
        $this->addSql('DROP TABLE post_comments');
        $this->addSql('DROP TABLE post_images');
        $this->addSql('DROP TABLE post_likes');
        $this->addSql('DROP TABLE posts');
        $this->addSql('DROP TABLE post_dogs');
    }
}
