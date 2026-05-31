<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20251101091500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create point_of_interest table for cached POI data';
    }

    public function up(Schema $schema): void
    {
        $table = $schema->createTable('point_of_interest');
        $table->addColumn('id', 'integer', ['autoincrement' => true]);
        $table->addColumn('osm_id', 'string', ['length' => 64]);
        $table->addColumn('name', 'string', ['length' => 255, 'notnull' => false]);
        $table->addColumn('category', 'string', ['length' => 64]);
        $table->addColumn('latitude', 'float');
        $table->addColumn('longitude', 'float');
        $table->addColumn('tags', 'json', ['notnull' => false]);
        $table->addColumn('updated_at', 'datetime_immutable');
        $table->setPrimaryKey(['id']);
        $table->addUniqueIndex(['osm_id'], 'uniq_poi_osm');
        $table->addIndex(['latitude', 'longitude'], 'poi_lat_lon_idx');
        $table->addIndex(['category'], 'poi_category_idx');
    }

    public function down(Schema $schema): void
    {
        $schema->dropTable('point_of_interest');
    }
}

