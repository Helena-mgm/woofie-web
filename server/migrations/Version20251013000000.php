<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour créer les tables Sitters, Owners et Dogs
 */
final class Version20251013000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création des tables sitters, owners et dogs avec support SIRET et ICAD';
    }

    public function up(Schema $schema): void
    {
        // Table Sitters (dog-sitters avec SIRET)
        $this->addSql('CREATE TABLE sitters (
            id SERIAL NOT NULL,
            user_id INT NOT NULL,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            telephone VARCHAR(20) NOT NULL,
            ville VARCHAR(100) NOT NULL,
            siret VARCHAR(14) NOT NULL,
            is_verified BOOLEAN DEFAULT false NOT NULL,
            photo_path VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            verified_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D0108A7450FF010 ON sitters (telephone)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D0108A726E94372 ON sitters (siret)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D0108A7A76ED395 ON sitters (user_id)');
        $this->addSql('COMMENT ON COLUMN sitters.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN sitters.verified_at IS \'(DC2Type:datetime_immutable)\'');

        // Table Owners (propriétaires de chiens)
        $this->addSql('CREATE TABLE owners (
            id SERIAL NOT NULL,
            user_id INT NOT NULL,
            nom VARCHAR(100) NOT NULL,
            telephone VARCHAR(20) NOT NULL,
            ville VARCHAR(100) NOT NULL,
            photo_path VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_427292FA450FF010 ON owners (telephone)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_427292FAA76ED395 ON owners (user_id)');
        $this->addSql('COMMENT ON COLUMN owners.created_at IS \'(DC2Type:datetime_immutable)\'');

        // Table Dogs (chiens avec numéros ICAD)
        $this->addSql('CREATE TABLE dogs (
            id SERIAL NOT NULL,
            owner_id INT NOT NULL,
            nom VARCHAR(100) NOT NULL,
            icad_number VARCHAR(50) NOT NULL,
            icad_type VARCHAR(20) NOT NULL,
            race VARCHAR(50) DEFAULT NULL,
            date_naissance DATE DEFAULT NULL,
            sexe VARCHAR(10) DEFAULT NULL,
            description TEXT DEFAULT NULL,
            photo_path VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_353BEEB397B8BA2D ON dogs (icad_number)');
        $this->addSql('CREATE INDEX IDX_353BEEB37E3C61F9 ON dogs (owner_id)');
        $this->addSql('COMMENT ON COLUMN dogs.created_at IS \'(DC2Type:datetime_immutable)\'');

        // Foreign Keys
        $this->addSql('ALTER TABLE dogs ADD CONSTRAINT FK_353BEEB37E3C61F9 FOREIGN KEY (owner_id) REFERENCES owners (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE owners ADD CONSTRAINT FK_427292FAA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE sitters ADD CONSTRAINT FK_1D0108A7A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE dogs DROP CONSTRAINT FK_353BEEB37E3C61F9');
        $this->addSql('ALTER TABLE owners DROP CONSTRAINT FK_427292FAA76ED395');
        $this->addSql('ALTER TABLE sitters DROP CONSTRAINT FK_1D0108A7A76ED395');
        $this->addSql('DROP TABLE dogs');
        $this->addSql('DROP TABLE owners');
        $this->addSql('DROP TABLE sitters');
    }
}
