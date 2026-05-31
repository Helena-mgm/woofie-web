#!/usr/bin/env php
<?php
// Script pour décoder et vérifier un JWT

if ($argc < 2) {
    echo "Usage: php decode-jwt.php <token>\n";
    exit(1);
}

$token = $argv[1];
$parts = explode('.', $token);

if (count($parts) !== 3) {
    echo "Token invalide (doit avoir 3 parties)\n";
    exit(1);
}

// Décoder le header
$header = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
echo "Header:\n";
print_r($header);
echo "\n";

// Décoder le payload
$payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
echo "Payload:\n";
print_r($payload);
echo "\n";

// Vérifier l'expiration
if (isset($payload['exp'])) {
    $exp = $payload['exp'];
    $now = time();
    echo "Expiration: " . date('Y-m-d H:i:s', $exp) . "\n";
    echo "Maintenant: " . date('Y-m-d H:i:s', $now) . "\n";
    
    if ($exp < $now) {
        echo "⚠️  TOKEN EXPIRÉ!\n";
    } else {
        echo "✅ Token valide (expire dans " . ($exp - $now) . " secondes)\n";
    }
}

if (isset($payload['email'])) {
    echo "Email: " . $payload['email'] . "\n";
}
