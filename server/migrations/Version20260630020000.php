<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260630020000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add lost dog alert fields to dogs table + taille column';
    }

    public function up(Schema $schema): void
    {
        // Champ taille (manquant du CdCF §3.2)
        $this->addSql("ALTER TABLE dogs ADD COLUMN IF NOT EXISTS taille VARCHAR(20) DEFAULT NULL");

        // Alertes chien perdu (§3.6)
        $this->addSql("ALTER TABLE dogs ADD COLUMN IF NOT EXISTS is_lost BOOLEAN NOT NULL DEFAULT FALSE");
        $this->addSql("ALTER TABLE dogs ADD COLUMN IF NOT EXISTS lost_since TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL");
        $this->addSql("ALTER TABLE dogs ADD COLUMN IF NOT EXISTS lost_location VARCHAR(255) DEFAULT NULL");
        $this->addSql("ALTER TABLE dogs ADD COLUMN IF NOT EXISTS lost_lat DOUBLE PRECISION DEFAULT NULL");
        $this->addSql("ALTER TABLE dogs ADD COLUMN IF NOT EXISTS lost_lng DOUBLE PRECISION DEFAULT NULL");
        $this->addSql("ALTER TABLE dogs ADD COLUMN IF NOT EXISTS lost_contact VARCHAR(255) DEFAULT NULL");
        $this->addSql("ALTER TABLE dogs ADD COLUMN IF NOT EXISTS lost_description TEXT DEFAULT NULL");

        $this->addSql("CREATE INDEX IF NOT EXISTS IDX_dogs_lost ON dogs(is_lost) WHERE is_lost = TRUE");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DROP INDEX IF EXISTS IDX_dogs_lost");
        $this->addSql("ALTER TABLE dogs DROP COLUMN IF EXISTS is_lost");
        $this->addSql("ALTER TABLE dogs DROP COLUMN IF EXISTS lost_since");
        $this->addSql("ALTER TABLE dogs DROP COLUMN IF EXISTS lost_location");
        $this->addSql("ALTER TABLE dogs DROP COLUMN IF EXISTS lost_lat");
        $this->addSql("ALTER TABLE dogs DROP COLUMN IF EXISTS lost_lng");
        $this->addSql("ALTER TABLE dogs DROP COLUMN IF EXISTS lost_contact");
        $this->addSql("ALTER TABLE dogs DROP COLUMN IF EXISTS lost_description");
        $this->addSql("ALTER TABLE dogs DROP COLUMN IF EXISTS taille");
    }
}
