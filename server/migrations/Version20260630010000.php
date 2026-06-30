<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260630010000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add notifications table + conversation_id FK on events';
    }

    public function up(Schema $schema): void
    {
        // ── Notifications ──────────────────────────────────────────────────
        $this->addSql("
            CREATE TABLE notifications (
                id          SERIAL       NOT NULL,
                user_id     INT          NOT NULL,
                type        VARCHAR(50)  NOT NULL,
                title       VARCHAR(255) NOT NULL,
                body        TEXT         NOT NULL,
                data        JSON         DEFAULT NULL,
                is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
                created_at  TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY(id)
            )
        ");
        $this->addSql("COMMENT ON COLUMN notifications.created_at IS '(DC2Type:datetime_immutable)'");
        $this->addSql("
            ALTER TABLE notifications
                ADD CONSTRAINT FK_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                NOT DEFERRABLE INITIALLY IMMEDIATE
        ");
        $this->addSql('CREATE INDEX IDX_notif_user      ON notifications(user_id)');
        $this->addSql('CREATE INDEX IDX_notif_user_read ON notifications(user_id, is_read)');

        // ── conversation_id sur events ─────────────────────────────────────
        $this->addSql('ALTER TABLE events ADD COLUMN conversation_id INT DEFAULT NULL');
        $this->addSql("
            ALTER TABLE events
                ADD CONSTRAINT FK_events_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
                NOT DEFERRABLE INITIALLY IMMEDIATE
        ");
        $this->addSql('CREATE INDEX IDX_events_conv ON events(conversation_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE notifications');
        $this->addSql('ALTER TABLE events DROP CONSTRAINT FK_events_conv');
        $this->addSql('DROP INDEX IDX_events_conv');
        $this->addSql('ALTER TABLE events DROP COLUMN conversation_id');
    }
}
