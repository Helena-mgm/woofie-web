<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260630000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add max_attendees to events + wipe demo data';
    }

    public function up(Schema $schema): void
    {
        // Nettoyer les données de démo
        $this->addSql('DELETE FROM event_attendees');
        $this->addSql('DELETE FROM events');

        // Ajouter la limite de places
        $this->addSql('ALTER TABLE events ADD COLUMN max_attendees INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE events DROP COLUMN max_attendees');
    }
}
