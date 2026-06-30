<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Owner;
use App\Entity\Sitter;
use App\Entity\Dog;
use App\Entity\DogPhoto;
use App\Repository\DogRepository;
use App\Repository\OwnerRepository;
use App\Repository\SitterRepository;
use App\Repository\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class AuthController extends AbstractController
{
    private string $jwtKey;

    public function __construct()
    {
        // simple secret for demo; in prod use env var
        $this->jwtKey = getenv('JWT_SECRET') ?: 'change_this_secret';
    }

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher,
        UserRepository $repo,
        OwnerRepository $ownerRepository,
        SitterRepository $sitterRepository,
        DogRepository $dogRepository,
        ValidatorInterface $validator
    ): JsonResponse
    {
        // ── 1. Lecture des champs de base ──────────────────────────────────
        $email    = $request->request->get('email');
        $password = $request->request->get('password');
        $type     = $request->request->get('type');

        if (!$email || !$password || !$type) {
            return new JsonResponse(['error' => 'email, password and type are required'], 400);
        }
        if (strlen($password) < 6) {
            return new JsonResponse(['error' => 'Password must be at least 6 characters'], 400);
        }
        if (!in_array($type, ['owner', 'sitter'])) {
            return new JsonResponse(['error' => 'type must be owner or sitter'], 400);
        }
        if ($repo->findOneByEmail($email)) {
            return new JsonResponse(['error' => 'Cet email est déjà utilisé'], 400);
        }

        // ── 2. Validation spécifique au type (AVANT tout flush) ───────────
        if ($type === 'owner') {
            $nom          = $request->request->get('nom');
            $prenom       = $request->request->get('prenom');
            $telephoneRaw = $request->request->get('telephone');
            $telephone    = $telephoneRaw ? preg_replace('/\s+/', '', $telephoneRaw) : null;
            $ville        = $request->request->get('ville');
            $dogsJson     = $request->request->get('dogs');

            if (!$nom || !$prenom || !$telephone || !$ville) {
                return new JsonResponse(['error' => 'nom, prenom, telephone and ville sont requis'], 400);
            }
            if ($ownerRepository->findOneBy(['telephone' => $telephone])) {
                return new JsonResponse(['error' => 'Ce numéro de téléphone est déjà utilisé'], 400);
            }
            if (!$dogsJson) {
                return new JsonResponse(['error' => 'Au moins un chien est requis'], 400);
            }
            $dogs = json_decode($dogsJson, true);
            if (!is_array($dogs) || empty($dogs)) {
                return new JsonResponse(['error' => 'Données chiens invalides'], 400);
            }

            // Validation ICAD avant tout persist
            $seenIcad = [];
            foreach ($dogs as $dogData) {
                $icad = $dogData['icadNumber'] ?? null;
                if (!$icad) continue;
                if (in_array($icad, $seenIcad, true)) {
                    return new JsonResponse(['error' => 'Numéro ICAD en double : ' . $icad], 400);
                }
                $seenIcad[] = $icad;
                if ($dogRepository->findOneBy(['icadNumber' => $icad])) {
                    return new JsonResponse(['error' => 'Numéro ICAD déjà utilisé : ' . $icad], 400);
                }
                foreach (['icadNumber', 'nom', 'sexe', 'race', 'dateNaissance'] as $f) {
                    if (empty($dogData[$f])) {
                        return new JsonResponse(['error' => "Champ '$f' manquant pour le chien " . ($dogData['nom'] ?? '?')], 400);
                    }
                }
            }
        } elseif ($type === 'sitter') {
            $nom          = $request->request->get('nom');
            $prenom       = $request->request->get('prenom');
            $telephoneRaw = $request->request->get('telephone');
            $telephone    = $telephoneRaw ? preg_replace('/\s+/', '', $telephoneRaw) : null;
            $ville        = $request->request->get('ville');
            $siretRaw     = $request->request->get('siret');
            $siret        = $siretRaw ? preg_replace('/\s+/', '', $siretRaw) : null;

            if (!$nom || !$prenom || !$telephone || !$ville || !$siret) {
                return new JsonResponse(['error' => 'nom, prenom, telephone, ville et siret sont requis'], 400);
            }
            if ($sitterRepository->findOneBy(['telephone' => $telephone])) {
                return new JsonResponse(['error' => 'Ce numéro de téléphone est déjà utilisé'], 400);
            }
            if ($sitterRepository->findOneBy(['siret' => $siret])) {
                return new JsonResponse(['error' => 'Ce numéro SIRET est déjà utilisé'], 400);
            }
        }

        // ── 3. Construction des entités + flush dans une transaction ──────
        try {
            $em->getConnection()->beginTransaction();

            // User
            $user = new User();
            $user->setEmail($email);
            $user->setType($type);
            $user->setPassword($hasher->hashPassword($user, $password));

            $userErrors = $validator->validate($user);
            if (count($userErrors) > 0) {
                $em->getConnection()->rollBack();
                return new JsonResponse(['error' => (string) $userErrors], 400);
            }

            $em->persist($user);

            if ($type === 'owner') {
                /** @var string $nom @var string $prenom @var string $telephone @var string $ville @var array $dogs */
                $owner = new Owner();
                $owner->setUser($user);
                $owner->setNom($nom);
                $owner->setPrenom($prenom);
                $owner->setTelephone($telephone);
                $owner->setVille($ville);

                $photoFile = $request->files->get('photo');
                if ($photoFile) {
                    $dir = $this->getParameter('kernel.project_dir') . '/public/uploads/owners';
                    if (!is_dir($dir)) mkdir($dir, 0777, true);
                    $fname = uniqid() . '.' . $photoFile->guessExtension();
                    $photoFile->move($dir, $fname);
                    $owner->setPhotoPath('/uploads/owners/' . $fname);
                }

                $em->persist($owner);

                foreach ($dogs as $dogIndex => $dogData) {
                    $dog = new Dog();
                    $dog->setOwner($owner);
                    $dog->setIcadNumber($dogData['icadNumber']);
                    $dog->setNom($dogData['nom']);
                    $dog->setSexe($dogData['sexe']);
                    $dog->setRace($dogData['race']);
                    try {
                        $dog->setDateNaissance(new \DateTime($dogData['dateNaissance']));
                    } catch (\Exception) {
                        $em->getConnection()->rollBack();
                        return new JsonResponse(['error' => 'Date de naissance invalide pour ' . $dogData['nom']], 400);
                    }
                    $icad = $dogData['icadNumber'];
                    $dog->setIcadType(strlen($icad) === 15 && ctype_digit($icad) ? 'microchip' : 'tattoo');

                    $dogDir = $this->getParameter('kernel.project_dir') . '/public/uploads/dogs';
                    if (!is_dir($dogDir)) mkdir($dogDir, 0777, true);
                    $photoOrder = 0;
                    for ($pi = 0; $pi < 5; $pi++) {
                        $dogPhoto = $request->files->get("dogPhoto_{$dogIndex}_{$pi}");
                        if (!$dogPhoto) continue;
                        $dfname = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $dogData['nom']) . '.' . $dogPhoto->guessExtension();
                        $dogPhoto->move($dogDir, $dfname);
                        $dp = new DogPhoto();
                        $dp->setDog($dog);
                        $dp->setPhotoPath('/uploads/dogs/' . $dfname);
                        $dp->setDisplayOrder($photoOrder);
                        $em->persist($dp);
                        if ($photoOrder === 0) $dog->setPhotoPath('/uploads/dogs/' . $dfname);
                        $photoOrder++;
                    }
                    $em->persist($dog);
                }
            } elseif ($type === 'sitter') {
                /** @var string $nom @var string $prenom @var string $telephone @var string $ville @var string $siret */
                $sitter = new Sitter();
                $sitter->setUser($user);
                $sitter->setNom($nom);
                $sitter->setPrenom($prenom);
                $sitter->setTelephone($telephone);
                $sitter->setVille($ville);
                $sitter->setSiret($siret);
                $sitter->setIsVerified(false);

                $bio         = $request->request->get('bio');
                $servicesRaw = $request->request->get('services');
                $price       = $request->request->get('price_per_hour');
                $available   = $request->request->get('is_available');
                $expYears    = $request->request->get('experience_years');

                if ($bio)          $sitter->setBio($bio);
                if ($servicesRaw) {
                    $decoded = json_decode($servicesRaw, true);
                    if (is_array($decoded)) {
                        $sitter->setServices(array_values(array_filter(array_map(
                            fn($s) => is_string($s) ? trim($s) : null, $decoded
                        ))));
                    }
                }
                if ($price !== null && $price !== '')
                    $sitter->setPricePerHour(number_format((float) $price, 2, '.', ''));
                if ($available !== null) {
                    $av = filter_var($available, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($av !== null) $sitter->setIsAvailable($av);
                }
                if ($expYears !== null && $expYears !== '') {
                    $y = (int) $expYears;
                    if ($y < 0) {
                        $em->getConnection()->rollBack();
                        return new JsonResponse(['error' => 'experience_years doit être positif'], 400);
                    }
                    $sitter->setExperienceYears($y);
                }

                $photoFile = $request->files->get('photo');
                if ($photoFile) {
                    $dir = $this->getParameter('kernel.project_dir') . '/public/uploads';
                    if (!is_dir($dir)) mkdir($dir, 0777, true);
                    $fname = uniqid() . '.' . $photoFile->guessExtension();
                    $photoFile->move($dir, $fname);
                    $sitter->setPhotoPath('/uploads/' . $fname);
                }

                $em->persist($sitter);
            }

            // Un seul flush à la toute fin — atomique
            $em->flush();
            $em->getConnection()->commit();

            return new JsonResponse(['success' => true, 'message' => 'Compte créé avec succès'], 201);

        } catch (UniqueConstraintViolationException $e) {
            if ($em->getConnection()->isTransactionActive()) $em->getConnection()->rollBack();
            $msg = $e->getMessage();
            if (str_contains($msg, 'telephone'))  return new JsonResponse(['error' => 'Ce numéro de téléphone est déjà utilisé'], 400);
            if (str_contains($msg, 'email'))       return new JsonResponse(['error' => 'Cet email est déjà utilisé'], 400);
            if (str_contains($msg, 'siret'))       return new JsonResponse(['error' => 'Ce numéro SIRET est déjà utilisé'], 400);
            if (str_contains($msg, 'icad'))        return new JsonResponse(['error' => 'Ce numéro ICAD est déjà utilisé'], 400);
            return new JsonResponse(['error' => 'Une donnée unique est déjà utilisée'], 400);
        } catch (\Exception $e) {
            if ($em->getConnection()->isTransactionActive()) $em->getConnection()->rollBack();
            return new JsonResponse(['error' => 'Inscription échouée : ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(Request $request, UserRepository $repo, UserPasswordHasherInterface $hasher): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $identifier = $data['identifier'] ?? $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$identifier || !$password) {
            return new JsonResponse(['error' => 'identifier (email or phone) and password required'], 400);
        }

        // Try to find user by email first
        $user = $repo->findOneByEmail($identifier);
        
        // If not found and identifier looks like a phone, try finding by phone
        // This would require a findOneByPhone method in UserRepository
        // For now, we'll just use email
        
        if (!$user) {
            $identifierError = str_contains((string) $identifier, '@')
                ? 'Adresse email inconnue'
                : 'Identifiant introuvable';

            return new JsonResponse([
                'errors' => [
                    'identifier' => $identifierError,
                ],
            ], 401);
        }

        if (!$hasher->isPasswordValid($user, $password)) {
            return new JsonResponse([
                'errors' => [
                    'password' => 'Mot de passe incorrect',
                ],
            ], 401);
        }

        $payload = [
            'sub' => $user->getId(),
            'email' => $user->getEmail(),
            'type' => $user->getType(),
            'iat' => time(),
            'exp' => time() + 3600 * 24 * 7, // 7 days
        ];

        $jwt = JWT::encode($payload, $this->jwtKey, 'HS256');

        return new JsonResponse(['token' => $jwt]);
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        // Extract JWT from Authorization header
        $authHeader = $request->headers->get('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return new JsonResponse(['error' => 'No token provided'], 401);
        }

        $token = substr($authHeader, 7); // Remove "Bearer " prefix

        try {
            $decoded = JWT::decode($token, new Key($this->jwtKey, 'HS256'));
            $user = $userRepository->find($decoded->sub);

            if (!$user) {
                return new JsonResponse(['error' => 'User not found'], 401);
            }
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Invalid token: ' . $e->getMessage()], 401);
        }

        $data = [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'type' => $user->getType(),
            'is_verified' => $user->isVerified(),
            'is_admin' => $user->isAdmin(),
            'roles' => $user->getRoles(),
        ];

        // Fetch Owner or Sitter profile based on type
        if ($user->getType() === 'owner') {
            $owner = $em->getRepository(\App\Entity\Owner::class)->findOneBy(['user' => $user]);
            if ($owner) {
                $data['nom'] = $owner->getNom();
                $data['prenom'] = $owner->getPrenom();
                $data['telephone'] = $owner->getTelephone();
                $data['ville'] = $owner->getVille();
                $data['photo_path'] = $owner->getPhotoPath();
            }
        } elseif ($user->getType() === 'sitter') {
            $sitter = $em->getRepository(\App\Entity\Sitter::class)->findOneBy(['user' => $user]);
            if ($sitter) {
                $data['nom'] = $sitter->getNom();
                $data['prenom'] = $sitter->getPrenom();
                $data['telephone'] = $sitter->getTelephone();
                $data['ville'] = $sitter->getVille();
                $data['photo_path'] = $sitter->getPhotoPath();
                $data['siret'] = $sitter->getSiret();
                $data['is_verified'] = $sitter->getIsVerified();
                $data['bio'] = $sitter->getBio();
                $data['services'] = $sitter->getServices();
                $data['price_per_hour'] = $sitter->getPricePerHour() !== null ? (float) $sitter->getPricePerHour() : null;
                $data['is_available'] = $sitter->isAvailable();
                $data['experience_years'] = $sitter->getExperienceYears();
            }
        }

        return new JsonResponse($data);
    }

    /** GET /api/me/export — RGPD: export de toutes les données personnelles */
    #[Route('/api/me/export', methods: ['GET'])]
    public function exportAccount(Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $header = $request->headers->get('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return new JsonResponse(['error' => 'Authentification requise'], 401);
        }
        try {
            $decoded = \Firebase\JWT\JWT::decode(substr($header, 7), new \Firebase\JWT\Key($this->jwtKey, 'HS256'));
            $user = $userRepository->find((int) $decoded->sub);
        } catch (\Exception) {
            return new JsonResponse(['error' => 'Token invalide'], 401);
        }
        if (!$user) {
            return new JsonResponse(['error' => 'Utilisateur introuvable'], 404);
        }

        $export = [
            'exported_at' => (new \DateTime())->format('c'),
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'type' => $user->getType(),
                'is_verified' => $user->isVerified(),
                'roles' => $user->getRoles(),
            ],
        ];

        if ($user->getType() === 'owner') {
            $owner = $em->getRepository(\App\Entity\Owner::class)->findOneBy(['user' => $user]);
            if ($owner) {
                $export['profile'] = [
                    'nom' => $owner->getNom(),
                    'prenom' => $owner->getPrenom(),
                    'telephone' => $owner->getTelephone(),
                    'ville' => $owner->getVille(),
                    'photo_path' => $owner->getPhotoPath(),
                    'member_since' => $owner->getCreatedAt()->format('c'),
                    'dogs' => array_map(fn($dog) => [
                        'id' => $dog->getId(),
                        'nom' => $dog->getNom(),
                        'race' => $dog->getRace(),
                        'sexe' => $dog->getSexe(),
                        'icad' => $dog->getIcadNumber(),
                        'date_naissance' => $dog->getDateNaissance()?->format('Y-m-d'),
                    ], $owner->getDogs()->toArray()),
                ];
            }
        } elseif ($user->getType() === 'sitter') {
            $sitter = $em->getRepository(\App\Entity\Sitter::class)->findOneBy(['user' => $user]);
            if ($sitter) {
                $export['profile'] = [
                    'nom' => $sitter->getNom(),
                    'prenom' => $sitter->getPrenom(),
                    'telephone' => $sitter->getTelephone(),
                    'ville' => $sitter->getVille(),
                    'photo_path' => $sitter->getPhotoPath(),
                    'siret' => $sitter->getSiret(),
                    'bio' => $sitter->getBio(),
                    'services' => $sitter->getServices(),
                    'price_per_hour' => $sitter->getPricePerHour(),
                    'is_available' => $sitter->isAvailable(),
                    'experience_years' => $sitter->getExperienceYears(),
                    'is_verified' => $sitter->getIsVerified(),
                    'member_since' => $sitter->getCreatedAt()->format('c'),
                ];
            }
        }

        return new JsonResponse($export);
    }

    /** DELETE /api/account — suppression RGPD du compte et de toutes les données */
    #[Route('/api/account', methods: ['DELETE'])]
    public function deleteAccount(Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $header = $request->headers->get('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return new JsonResponse(['error' => 'Authentification requise'], 401);
        }
        try {
            $decoded = \Firebase\JWT\JWT::decode(substr($header, 7), new \Firebase\JWT\Key($this->jwtKey, 'HS256'));
            $user = $userRepository->find((int) $decoded->sub);
        } catch (\Exception) {
            return new JsonResponse(['error' => 'Token invalide'], 401);
        }

        if (!$user) return new JsonResponse(['error' => 'Utilisateur introuvable'], 404);

        // Confirmation optionnelle par mot de passe
        $data = json_decode($request->getContent(), true) ?? [];
        if (!empty($data['password'])) {
            $hasher = $this->container->get('security.user_password_hasher');
            if (!$hasher->isPasswordValid($user, $data['password'])) {
                return new JsonResponse(['error' => 'Mot de passe incorrect'], 403);
            }
        }

        // Cascade : User → Owner/Sitter/Dogs/Posts/Events/Notifications tous supprimés via ON DELETE CASCADE
        $em->remove($user);
        $em->flush();

        return new JsonResponse(['success' => true, 'message' => 'Compte supprimé conformément au RGPD']);
    }

    /** GET /api/siret/{siret} — validation publique d'un numéro SIRET (format + Luhn + API Sirene si clé configurée) */
    #[Route('/api/siret/{siret}', name: 'api_validate_siret', methods: ['GET'])]
    public function validateSiret(string $siret, \App\Service\SiretValidator $siretValidator): JsonResponse
    {
        $normalized = preg_replace('/\s+/', '', $siret);
        $result = $siretValidator->validate((string) $normalized);
        return new JsonResponse($result);
    }
}
