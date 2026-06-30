<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260630014011 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE blocked_users ALTER blocked_at DROP DEFAULT');
        $this->addSql('ALTER TABLE blocked_users ALTER blocked_at SET NOT NULL');
        $this->addSql('ALTER INDEX idx_blocked_users_user RENAME TO IDX_A3C2E415A76ED395');
        $this->addSql('ALTER INDEX blocked_users_user_id_blocked_user_id_key RENAME TO user_blocked_unique');
        $this->addSql('ALTER TABLE conversations ALTER created_at DROP DEFAULT');
        $this->addSql('ALTER TABLE conversations ALTER created_at SET NOT NULL');
        $this->addSql('ALTER INDEX idx_conversation_participants_conv RENAME TO IDX_21821ED39AC0396');
        $this->addSql('ALTER INDEX idx_conversation_participants_user RENAME TO IDX_21821ED3A76ED395');
        $this->addSql('DROP INDEX idx_dogs_lost');
        $this->addSql('ALTER TABLE dogs ALTER is_lost DROP DEFAULT');
        $this->addSql('ALTER TABLE event_attendees ALTER status DROP DEFAULT');
        $this->addSql('ALTER INDEX idx_ea_event RENAME TO IDX_4E5C551871F7E88B');
        $this->addSql('ALTER INDEX idx_ea_user RENAME TO IDX_4E5C5518A76ED395');
        $this->addSql('ALTER TABLE events DROP CONSTRAINT fk_events_conv');
        $this->addSql('DROP INDEX idx_events_conv');
        $this->addSql('DROP INDEX idx_events_date');
        $this->addSql('ALTER TABLE events ALTER image DROP DEFAULT');
        $this->addSql('ALTER TABLE events ALTER is_private DROP DEFAULT');
        $this->addSql('ALTER TABLE events ALTER requires_approval DROP DEFAULT');
        $this->addSql('ALTER INDEX idx_events_organizer RENAME TO IDX_5387574A876C4DDA');
        $this->addSql('ALTER INDEX forbidden_keywords_keyword_key RENAME TO UNIQ_C21BC0B45A93713B');
        $this->addSql('ALTER TABLE group_members ALTER role DROP DEFAULT');
        $this->addSql('ALTER TABLE group_members ALTER role SET NOT NULL');
        $this->addSql('ALTER TABLE group_members ALTER can_invite DROP DEFAULT');
        $this->addSql('ALTER TABLE group_members ALTER can_invite SET NOT NULL');
        $this->addSql('ALTER TABLE group_members ALTER joined_at DROP DEFAULT');
        $this->addSql('ALTER TABLE group_members ALTER joined_at SET NOT NULL');
        $this->addSql('ALTER INDEX idx_group_members_group RENAME TO IDX_C3A086F3FE54D947');
        $this->addSql('ALTER INDEX idx_group_members_user RENAME TO IDX_C3A086F3A76ED395');
        $this->addSql('ALTER INDEX group_members_group_id_user_id_key RENAME TO group_user_unique');
        $this->addSql('ALTER TABLE groups DROP CONSTRAINT groups_id_fkey');
        $this->addSql('ALTER TABLE groups ADD conversation_id INT NOT NULL');
        $this->addSql('ALTER TABLE groups ALTER allow_member_invites DROP DEFAULT');
        $this->addSql('ALTER TABLE groups ALTER allow_member_invites SET NOT NULL');
        $this->addSql('ALTER TABLE groups ALTER allow_member_messages DROP DEFAULT');
        $this->addSql('ALTER TABLE groups ALTER allow_member_messages SET NOT NULL');
        $this->addSql('ALTER TABLE groups ALTER is_private DROP DEFAULT');
        $this->addSql('ALTER TABLE groups ALTER is_private SET NOT NULL');
        $this->addSql('ALTER TABLE groups ADD CONSTRAINT FK_F06D39709AC0396 FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_F06D39709AC0396 ON groups (conversation_id)');
        $this->addSql('ALTER TABLE messages DROP CONSTRAINT messages_reply_to_fkey');
        $this->addSql('DROP INDEX idx_messages_created');
        $this->addSql('ALTER TABLE messages DROP reply_to');
        $this->addSql('ALTER TABLE messages ALTER type DROP DEFAULT');
        $this->addSql('ALTER TABLE messages ALTER type SET NOT NULL');
        $this->addSql('ALTER TABLE messages ALTER created_at DROP DEFAULT');
        $this->addSql('ALTER TABLE messages ALTER created_at SET NOT NULL');
        $this->addSql('ALTER TABLE messages ALTER is_read DROP DEFAULT');
        $this->addSql('ALTER TABLE messages ALTER is_read SET NOT NULL');
        $this->addSql('ALTER INDEX idx_messages_conversation RENAME TO idx_conversation');
        $this->addSql('ALTER INDEX idx_messages_sender RENAME TO idx_sender');
        $this->addSql('DROP INDEX idx_notif_user_read');
        $this->addSql('ALTER TABLE notifications ALTER is_read DROP DEFAULT');
        $this->addSql('ALTER INDEX idx_notif_user RENAME TO IDX_6000B0D3A76ED395');
        $this->addSql('ALTER INDEX uniq_poi_osm RENAME TO UNIQ_E67AD359A65EB5CF');
        $this->addSql('ALTER INDEX idx_8b8e0e44a76ed395 RENAME TO IDX_FF21689FA76ED395');
        $this->addSql('ALTER INDEX idx_8b8e0e44f8697d13 RENAME TO IDX_FF21689FF8697D13');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER INDEX idx_21821ed39ac0396 RENAME TO idx_conversation_participants_conv');
        $this->addSql('ALTER INDEX idx_21821ed3a76ed395 RENAME TO idx_conversation_participants_user');
        $this->addSql('ALTER TABLE event_attendees ALTER status SET DEFAULT \'pending\'');
        $this->addSql('ALTER INDEX idx_4e5c551871f7e88b RENAME TO idx_ea_event');
        $this->addSql('ALTER INDEX idx_4e5c5518a76ed395 RENAME TO idx_ea_user');
        $this->addSql('ALTER TABLE blocked_users ALTER blocked_at SET DEFAULT \'now()\'');
        $this->addSql('ALTER TABLE blocked_users ALTER blocked_at DROP NOT NULL');
        $this->addSql('ALTER INDEX user_blocked_unique RENAME TO blocked_users_user_id_blocked_user_id_key');
        $this->addSql('ALTER INDEX idx_a3c2e415a76ed395 RENAME TO idx_blocked_users_user');
        $this->addSql('ALTER TABLE messages ADD reply_to INT DEFAULT NULL');
        $this->addSql('ALTER TABLE messages ALTER type SET DEFAULT \'text\'');
        $this->addSql('ALTER TABLE messages ALTER type DROP NOT NULL');
        $this->addSql('ALTER TABLE messages ALTER created_at SET DEFAULT \'now()\'');
        $this->addSql('ALTER TABLE messages ALTER created_at DROP NOT NULL');
        $this->addSql('ALTER TABLE messages ALTER is_read SET DEFAULT false');
        $this->addSql('ALTER TABLE messages ALTER is_read DROP NOT NULL');
        $this->addSql('ALTER TABLE messages ADD CONSTRAINT messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES messages (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX idx_messages_created ON messages (created_at)');
        $this->addSql('CREATE INDEX IDX_DB021E96E2B0FBEB ON messages (reply_to)');
        $this->addSql('ALTER INDEX idx_conversation RENAME TO idx_messages_conversation');
        $this->addSql('ALTER INDEX idx_sender RENAME TO idx_messages_sender');
        $this->addSql('ALTER TABLE dogs ALTER is_lost SET DEFAULT false');
        $this->addSql('CREATE INDEX idx_dogs_lost ON dogs (is_lost) WHERE (is_lost = true)');
        $this->addSql('ALTER INDEX uniq_e67ad359a65eb5cf RENAME TO uniq_poi_osm');
        $this->addSql('ALTER TABLE conversations ALTER created_at SET DEFAULT \'now()\'');
        $this->addSql('ALTER TABLE conversations ALTER created_at DROP NOT NULL');
        $this->addSql('ALTER INDEX idx_ff21689fa76ed395 RENAME TO idx_8b8e0e44a76ed395');
        $this->addSql('ALTER INDEX idx_ff21689ff8697d13 RENAME TO idx_8b8e0e44f8697d13');
        $this->addSql('ALTER TABLE groups DROP CONSTRAINT FK_F06D39709AC0396');
        $this->addSql('DROP INDEX UNIQ_F06D39709AC0396');
        $this->addSql('ALTER TABLE groups DROP conversation_id');
        $this->addSql('ALTER TABLE groups ALTER allow_member_invites SET DEFAULT false');
        $this->addSql('ALTER TABLE groups ALTER allow_member_invites DROP NOT NULL');
        $this->addSql('ALTER TABLE groups ALTER allow_member_messages SET DEFAULT true');
        $this->addSql('ALTER TABLE groups ALTER allow_member_messages DROP NOT NULL');
        $this->addSql('ALTER TABLE groups ALTER is_private SET DEFAULT false');
        $this->addSql('ALTER TABLE groups ALTER is_private DROP NOT NULL');
        $this->addSql('ALTER TABLE groups ADD CONSTRAINT groups_id_fkey FOREIGN KEY (id) REFERENCES conversations (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE events ALTER image SET DEFAULT \'🐾\'');
        $this->addSql('ALTER TABLE events ALTER is_private SET DEFAULT false');
        $this->addSql('ALTER TABLE events ALTER requires_approval SET DEFAULT false');
        $this->addSql('ALTER TABLE events ADD CONSTRAINT fk_events_conv FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX idx_events_conv ON events (conversation_id)');
        $this->addSql('CREATE INDEX idx_events_date ON events (date)');
        $this->addSql('ALTER INDEX idx_5387574a876c4dda RENAME TO idx_events_organizer');
        $this->addSql('ALTER TABLE group_members ALTER role SET DEFAULT \'member\'');
        $this->addSql('ALTER TABLE group_members ALTER role DROP NOT NULL');
        $this->addSql('ALTER TABLE group_members ALTER can_invite SET DEFAULT false');
        $this->addSql('ALTER TABLE group_members ALTER can_invite DROP NOT NULL');
        $this->addSql('ALTER TABLE group_members ALTER joined_at SET DEFAULT \'now()\'');
        $this->addSql('ALTER TABLE group_members ALTER joined_at DROP NOT NULL');
        $this->addSql('ALTER INDEX group_user_unique RENAME TO group_members_group_id_user_id_key');
        $this->addSql('ALTER INDEX idx_c3a086f3fe54d947 RENAME TO idx_group_members_group');
        $this->addSql('ALTER INDEX idx_c3a086f3a76ed395 RENAME TO idx_group_members_user');
        $this->addSql('ALTER INDEX uniq_c21bc0b45a93713b RENAME TO forbidden_keywords_keyword_key');
        $this->addSql('ALTER TABLE notifications ALTER is_read SET DEFAULT false');
        $this->addSql('CREATE INDEX idx_notif_user_read ON notifications (user_id, is_read)');
        $this->addSql('ALTER INDEX idx_6000b0d3a76ed395 RENAME TO idx_notif_user');
    }
}
