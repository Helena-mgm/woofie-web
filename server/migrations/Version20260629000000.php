<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260629000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add events and event_attendees tables with sample data';
    }

    public function up(Schema $schema): void
    {
        // ── Table des événements ────────────────────────────────────────────
        $this->addSql('
            CREATE TABLE events (
                id               SERIAL       NOT NULL,
                organizer_id     INT          NOT NULL,
                title            VARCHAR(255) NOT NULL,
                description      TEXT         NOT NULL,
                date             DATE         NOT NULL,
                time             VARCHAR(10)  NOT NULL,
                location         VARCHAR(255) NOT NULL,
                lat              DOUBLE PRECISION DEFAULT NULL,
                lng              DOUBLE PRECISION DEFAULT NULL,
                category         VARCHAR(50)  NOT NULL,
                image            VARCHAR(50)  NOT NULL DEFAULT \'🐾\',
                is_private       BOOLEAN      NOT NULL DEFAULT FALSE,
                requires_approval BOOLEAN     NOT NULL DEFAULT FALSE,
                created_at       TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        ');
        $this->addSql("COMMENT ON COLUMN events.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('
            ALTER TABLE events
                ADD CONSTRAINT FK_events_organizer
                FOREIGN KEY (organizer_id) REFERENCES users (id) ON DELETE CASCADE
                NOT DEFERRABLE INITIALLY IMMEDIATE
        ');
        $this->addSql('CREATE INDEX IDX_events_organizer ON events (organizer_id)');
        $this->addSql('CREATE INDEX IDX_events_date      ON events (date)');

        // ── Table des participants ──────────────────────────────────────────
        $this->addSql('
            CREATE TABLE event_attendees (
                id        SERIAL      NOT NULL,
                event_id  INT         NOT NULL,
                user_id   INT         NOT NULL,
                status    VARCHAR(20) NOT NULL DEFAULT \'pending\',
                joined_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id),
                CONSTRAINT event_user_unique UNIQUE (event_id, user_id)
            )
        ');
        $this->addSql("COMMENT ON COLUMN event_attendees.joined_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql('
            ALTER TABLE event_attendees
                ADD CONSTRAINT FK_ea_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
                NOT DEFERRABLE INITIALLY IMMEDIATE
        ');
        $this->addSql('
            ALTER TABLE event_attendees
                ADD CONSTRAINT FK_ea_user  FOREIGN KEY (user_id)  REFERENCES users (id) ON DELETE CASCADE
                NOT DEFERRABLE INITIALLY IMMEDIATE
        ');
        $this->addSql('CREATE INDEX IDX_ea_event ON event_attendees (event_id)');
        $this->addSql('CREATE INDEX IDX_ea_user  ON event_attendees (user_id)');

        // ── Données de démo (si au moins un utilisateur existe) ─────────────
        $this->addSql("
            INSERT INTO events (organizer_id, title, description, date, time, location, lat, lng, category, image, is_private, requires_approval, created_at)
            SELECT id, 'Grande Balade Canine au Parc',
                   'Rejoignez-nous pour une après-midi de jeux et de socialisation avec vos toutous !',
                   '2026-07-20', '14:00', 'Parc de la Tête d''Or, Lyon', 45.7797, 4.8526, 'Rencontre', '🏃', false, false, NOW()
            FROM users ORDER BY id LIMIT 1
        ");
        $this->addSql("
            INSERT INTO events (organizer_id, title, description, date, time, location, lat, lng, category, image, is_private, requires_approval, created_at)
            SELECT id, 'Atelier Éducation Canine',
                   'Apprenez les bases de l''éducation positive avec notre éducateur certifié.',
                   '2026-07-25', '10:00', 'Centre Woofie, Paris', 48.8566, 2.3522, 'Formation', '🎓', false, true, NOW()
            FROM users ORDER BY id LIMIT 1
        ");
        $this->addSql("
            INSERT INTO events (organizer_id, title, description, date, time, location, lat, lng, category, image, is_private, requires_approval, created_at)
            SELECT id, 'Course Caritative pour les Refuges',
                   'Courez avec votre chien pour soutenir les refuges locaux.',
                   '2026-08-10', '09:00', 'Bois de Vincennes, Paris', 48.8333, 2.4333, 'Charity', '❤️', false, false, NOW()
            FROM users ORDER BY id LIMIT 1
        ");
        $this->addSql("
            INSERT INTO events (organizer_id, title, description, date, time, location, lat, lng, category, image, is_private, requires_approval, created_at)
            SELECT id, 'Concours du Plus Beau Chien',
                   'Votre chien est le plus beau ? Venez le prouver et gagnez des prix !',
                   '2026-09-05', '15:00', 'Place Bellecour, Lyon', 45.7579, 4.8320, 'Compétition', '🏆', false, false, NOW()
            FROM users ORDER BY id LIMIT 1
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE event_attendees');
        $this->addSql('DROP TABLE events');
    }
}
