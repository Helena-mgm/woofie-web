<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251016143718 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE dog_photo (id SERIAL NOT NULL, dog_id INT NOT NULL, photo_path VARCHAR(255) NOT NULL, display_order INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_8F11CD5D634DFEB ON dog_photo (dog_id)');
        $this->addSql('ALTER TABLE dog_photo ADD CONSTRAINT FK_8F11CD5D634DFEB FOREIGN KEY (dog_id) REFERENCES dogs (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE dog_photo DROP CONSTRAINT FK_8F11CD5D634DFEB');
        $this->addSql('DROP TABLE dog_photo');
    }
}
