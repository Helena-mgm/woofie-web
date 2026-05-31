<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251104140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute les champs de profil pour les dog-sitters (bio, services, tarifs, disponibilité, expérience)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sitters ADD bio TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE sitters ADD services JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE sitters ADD price_per_hour NUMERIC(7, 2) DEFAULT NULL');
        $this->addSql('ALTER TABLE sitters ADD is_available BOOLEAN DEFAULT true NOT NULL');
        $this->addSql('ALTER TABLE sitters ADD experience_years SMALLINT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE sitters DROP bio');
        $this->addSql('ALTER TABLE sitters DROP services');
        $this->addSql('ALTER TABLE sitters DROP price_per_hour');
        $this->addSql('ALTER TABLE sitters DROP is_available');
        $this->addSql('ALTER TABLE sitters DROP experience_years');
    }
}

