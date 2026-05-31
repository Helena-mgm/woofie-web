<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Add prenom column to owners table for separate first names.
 */
final class Version20251101090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add prenom column to owners table to store first names separately.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE owners ADD prenom VARCHAR(100) NOT NULL DEFAULT ''");
        $this->addSql("UPDATE owners SET prenom = '' WHERE prenom IS NULL");
        $this->addSql("ALTER TABLE owners ALTER COLUMN prenom DROP DEFAULT");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE owners DROP COLUMN prenom');
    }
}

