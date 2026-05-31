<?php
$content = file_get_contents('/Users/helena/projets/rendu_woofie/server/src/Controller/BotController.php');
$content = preg_replace('/if \\\(!.*?\n/', "if (!\$", $content); // just fix it by downloading from github? No, I have full write access
