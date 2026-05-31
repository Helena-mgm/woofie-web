<?php

namespace App\Command;

use App\Service\OverpassImporter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:pois:refresh',
    description: 'Fetch points of interest from Overpass API and cache them locally'
)]
class RefreshPoisCommand extends Command
{
    public function __construct(
        private readonly OverpassImporter $importer,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument(
                'bbox',
                InputArgument::IS_ARRAY,
                'Bounding boxes south,west,north,east (space separated pairs). Example: "48.8,2.2,48.9,2.4 45.7,4.7,45.8,4.9"'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $bboxArguments = $input->getArgument('bbox');

        $bboxes = $this->parseBoundingBoxes($bboxArguments);
        if (empty($bboxes)) {
            $io->error('Please provide at least one bounding box (south,west,north,east).');
            return Command::FAILURE;
        }

        $totalPersisted = 0;

        foreach ($bboxes as $bbox) {
            [$south, $west, $north, $east] = $bbox;

            $io->section(sprintf(
                'Fetching POIs for bounds south=%s west=%s north=%s east=%s',
                $south,
                $west,
                $north,
                $east
            ));

            $pois = $this->importer->import($south, $west, $north, $east);
            $totalPersisted += count($pois);

            $io->success(sprintf('Stored/updated %d POIs for this bounding box.', count($pois)));
        }

        $this->entityManager->clear();
        $io->success(sprintf('POI refresh complete. %d entries stored/updated.', $totalPersisted));

        return Command::SUCCESS;
    }

    /**
     * @param array<int, string> $bboxArguments
     * @return array<int, array<int, float>>
     */
    private function parseBoundingBoxes(array $bboxArguments): array
    {
        $bboxes = [];

        foreach ($bboxArguments as $bboxString) {
            $parts = array_map('trim', explode(',', $bboxString));
            if (count($parts) !== 4) {
                continue;
            }

            [$south, $west, $north, $east] = $parts;

            if (!is_numeric($south) || !is_numeric($west) || !is_numeric($north) || !is_numeric($east)) {
                continue;
            }

            $bboxes[] = [(float)$south, (float)$west, (float)$north, (float)$east];
        }

        return $bboxes;
    }
}

