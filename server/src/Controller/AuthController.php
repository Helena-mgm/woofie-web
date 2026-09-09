<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Owner;
use App\Entity\Sitter;
use App\Entity\Dog;
use App\Entity\DogPhoto;
use App\Entity\Post;
use App\Repository\DogRepository;
use App\Repository\OwnerRepository;
use App\Repository\SitterRepository;
use App\Repository\UserRepository;
use App\Service\AuthCookieFactory;
use App\Service\ImageUploadService;
use App\Service\JwtService;
use App\Service\LoginRateLimiter;
use App\Service\SiretValidator;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class AuthController extends AbstractController
{
    public function __construct(
        private JwtService $jwtService,
        private AuthCookieFactory $authCookieFactory,
        private LoginRateLimiter $loginRateLimiter,
        private ImageUploadService $imageUploadService
    ) {
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
        ValidatorInterface $validator,
        SiretValidator $siretValidator
    ): JsonResponse
    {
        if ($retryAfter = $this->loginRateLimiter->assertRegisterAllowed((string) $request->getClientIp())) {
            return new JsonResponse(['error' => 'Trop de tentatives. Réessayez plus tard.'], 429, ['Retry-After' => (string) $retryAfter]);
        }

        $emailRaw = $request->request->get('email');
        $passwordRaw = $request->request->get('password');
        $typeRaw = $request->request->get('type');

        $email = is_string($emailRaw) ? mb_strtolower(trim($emailRaw)) : '';
        $password = is_string($passwordRaw) ? $passwordRaw : '';
        $type = is_string($typeRaw) ? $typeRaw : '';

        if (!$email || !$password || !$type) {
            return new JsonResponse(['error' => 'email, password and type are required'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 180) {
            return new JsonResponse(['error' => 'Adresse email invalide'], 400);
        }
        if (mb_strlen($password) < 12 || mb_strlen($password) > 128) {
            return new JsonResponse(['error' => 'Le mot de passe doit contenir entre 12 et 128 caractères'], 400);
        }
        if (!in_array($type, ['owner', 'sitter'], true)) {
            return new JsonResponse(['error' => 'type must be owner or sitter'], 400);
        }
        if ($repo->findOneByEmail($email)) {
            return new JsonResponse(['error' => 'Cet email est déjà utilisé'], 400);
        }

        $profile = $this->normalizeProfileData($request);
        if (is_string($profile)) {
            return new JsonResponse(['error' => $profile], 400);
        }
        ['nom' => $nom, 'prenom' => $prenom, 'telephone' => $telephone, 'ville' => $ville] = $profile;

        if ($ownerRepository->findOneBy(['telephone' => $telephone]) || $sitterRepository->findOneBy(['telephone' => $telephone])) {
            return new JsonResponse(['error' => 'Ce numéro de téléphone est déjà utilisé'], 400);
        }

        $dogs = [];
        $sitterData = [];

        if ($type === 'owner') {
            $dogsJson = $request->request->get('dogs');
            if (!is_string($dogsJson)) {
                return new JsonResponse(['error' => 'Au moins un chien est requis'], 400);
            }
            $dogs = $this->normalizeDogs($dogsJson, $dogRepository);
            if (is_string($dogs)) {
                return new JsonResponse(['error' => $dogs], 400);
            }
        } else {
            $siretRaw     = $request->request->get('siret');
            $siretInput   = is_string($siretRaw) ? $siretRaw : '';
            $siret        = $siretInput !== '' ? preg_replace('/[\s.-]+/', '', trim($siretInput)) : null;

            if (!$siret) {
                return new JsonResponse(['error' => 'Le numéro SIRET est requis'], 400);
            }
            $siretValidation = $siretValidator->validate($siretInput, false);
            if (!$siretValidation['isValid']) {
                return new JsonResponse(['error' => $siretValidation['message'] ?? 'Numéro SIRET invalide'], 400);
            }
            if ($sitterRepository->findOneBy(['siret' => $siret])) {
                return new JsonResponse(['error' => 'Ce numéro SIRET est déjà utilisé'], 400);
            }

            $sitterData = $this->normalizeSitterData($request);
            if (is_string($sitterData)) {
                return new JsonResponse(['error' => $sitterData], 400);
            }
        }

        $uploadedPaths = [];
        try {
            $em->getConnection()->beginTransaction();

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
                $owner = new Owner();
                $owner->setUser($user);
                $owner->setNom($nom);
                $owner->setPrenom($prenom);
                $owner->setTelephone($telephone);
                $owner->setVille($ville);

                $ownerErrors = $validator->validate($owner);
                if (count($ownerErrors) > 0) {
                    $em->getConnection()->rollBack();
                    return new JsonResponse(['error' => (string) $ownerErrors], 400);
                }

                $photoFile = $request->files->get('photo');
                if ($photoFile) {
                    $dir = $this->getParameter('kernel.project_dir') . '/public/uploads/owners';
                    $photoPath = $this->imageUploadService->storeUploadedImage($photoFile, $dir, '/uploads/owners');
                    $uploadedPaths[] = $photoPath;
                    $owner->setPhotoPath($photoPath);
                }

                $em->persist($owner);

                foreach ($dogs as $dogIndex => $dogData) {
                    $dog = new Dog();
                    $dog->setOwner($owner);
                    $dog->setIcadNumber($dogData['icadNumber']);
                    $dog->setNom($dogData['nom']);
                    $dog->setSexe($dogData['sexe']);
                    $dog->setRace($dogData['race']);
                    $dog->setDateNaissance($dogData['dateNaissance']);
                    $dog->setIcadType($dogData['icadType']);

                    $dogErrors = $validator->validate($dog);
                    if (count($dogErrors) > 0) {
                        $em->getConnection()->rollBack();
                        $this->removeUploadedFiles($uploadedPaths);
                        return new JsonResponse(['error' => (string) $dogErrors], 400);
                    }

                    $dogDir = $this->getParameter('kernel.project_dir') . '/public/uploads/dogs';
                    $photoOrder = 0;
                    for ($pi = 0; $pi < 5; $pi++) {
                        $dogPhoto = $request->files->get("dogPhoto_{$dogIndex}_{$pi}");
                        if (!$dogPhoto) continue;
                        $photoPath = $this->imageUploadService->storeUploadedImage($dogPhoto, $dogDir, '/uploads/dogs');
                        $uploadedPaths[] = $photoPath;
                        $dp = new DogPhoto();
                        $dp->setDog($dog);
                        $dp->setPhotoPath($photoPath);
                        $dp->setDisplayOrder($photoOrder);
                        $em->persist($dp);
                        if ($photoOrder === 0) $dog->setPhotoPath($photoPath);
                        $photoOrder++;
                    }
                    $em->persist($dog);
                }
            } elseif ($type === 'sitter') {
                $sitter = new Sitter();
                $sitter->setUser($user);
                $sitter->setNom($nom);
                $sitter->setPrenom($prenom);
                $sitter->setTelephone($telephone);
                $sitter->setVille($ville);
                $sitter->setSiret($siret);
                $sitter->setIsVerified(false);

                $sitter->setBio($sitterData['bio']);
                $sitter->setServices($sitterData['services']);
                $sitter->setPricePerHour($sitterData['pricePerHour']);
                $sitter->setIsAvailable($sitterData['isAvailable']);
                $sitter->setExperienceYears($sitterData['experienceYears']);

                $sitterErrors = $validator->validate($sitter);
                if (count($sitterErrors) > 0) {
                    $em->getConnection()->rollBack();
                    return new JsonResponse(['error' => (string) $sitterErrors], 400);
                }

                $photoFile = $request->files->get('photo');
                if ($photoFile) {
                    $dir = $this->getParameter('kernel.project_dir') . '/public/uploads/sitters';
                    $photoPath = $this->imageUploadService->storeUploadedImage($photoFile, $dir, '/uploads/sitters');
                    $uploadedPaths[] = $photoPath;
                    $sitter->setPhotoPath($photoPath);
                }

                $em->persist($sitter);
            }

            $em->flush();
            $em->getConnection()->commit();

            return new JsonResponse(['success' => true, 'message' => 'Compte créé avec succès'], 201);

        } catch (UniqueConstraintViolationException $e) {
            if ($em->getConnection()->isTransactionActive()) $em->getConnection()->rollBack();
            $this->removeUploadedFiles($uploadedPaths);
            $msg = $e->getMessage();
            if (str_contains($msg, 'telephone'))  return new JsonResponse(['error' => 'Ce numéro de téléphone est déjà utilisé'], 400);
            if (str_contains($msg, 'email'))       return new JsonResponse(['error' => 'Cet email est déjà utilisé'], 400);
            if (str_contains($msg, 'siret'))       return new JsonResponse(['error' => 'Ce numéro SIRET est déjà utilisé'], 400);
            if (str_contains($msg, 'icad'))        return new JsonResponse(['error' => 'Ce numéro ICAD est déjà utilisé'], 400);
            return new JsonResponse(['error' => 'Une donnée unique est déjà utilisée'], 400);
        } catch (\RuntimeException) {
            if ($em->getConnection()->isTransactionActive()) $em->getConnection()->rollBack();
            $this->removeUploadedFiles($uploadedPaths);
            return new JsonResponse(['error' => 'Image invalide'], 400);
        } catch (\Throwable $e) {
            if ($em->getConnection()->isTransactionActive()) $em->getConnection()->rollBack();
            $this->removeUploadedFiles($uploadedPaths);
            error_log('[AuthController::register] ' . $e::class);
            return new JsonResponse(['error' => 'Inscription échouée'], 500);
        }
    }

    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $repo,
        OwnerRepository $ownerRepository,
        SitterRepository $sitterRepository,
        UserPasswordHasherInterface $hasher
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return new JsonResponse(['error' => 'Payload invalide'], 400);
        }

        $identifierRaw = $data['identifier'] ?? $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!is_string($identifierRaw) || !is_string($password)) {
            return new JsonResponse(['error' => 'Identifiant et mot de passe requis'], 400);
        }

        $identifier = trim($identifierRaw);

        if (!$identifier || !$password) {
            return new JsonResponse(['error' => 'Identifiant et mot de passe requis'], 400);
        }

        $normalizedIdentifier = str_contains($identifier, '@')
            ? mb_strtolower($identifier)
            : preg_replace('/\s+/', '', $identifier);
        $rateKey = $normalizedIdentifier . '|' . (string) $request->getClientIp();
        if ($retryAfter = $this->loginRateLimiter->assertLoginAllowed($rateKey)) {
            return new JsonResponse(['error' => 'Trop de tentatives. Réessayez plus tard.'], 429, ['Retry-After' => (string) $retryAfter]);
        }

        $user = str_contains($normalizedIdentifier, '@')
            ? $repo->findOneByEmail($normalizedIdentifier)
            : ($ownerRepository->findByTelephone($normalizedIdentifier)?->getUser()
                ?? $sitterRepository->findByTelephone($normalizedIdentifier)?->getUser());

        if (!$user || !$hasher->isPasswordValid($user, $password)) {
            return new JsonResponse([
                'error' => 'Identifiants invalides',
            ], 401);
        }

        $this->loginRateLimiter->resetLogin($rateKey);

        $jwt = $this->jwtService->createToken($user);

        $response = new JsonResponse(['success' => true]);
        $response->headers->setCookie($this->authCookieFactory->create($jwt, $request));
        $response->headers->setCookie($this->authCookieFactory->createAuthMarker($request));
        $response->headers->setCookie($this->authCookieFactory->createCsrfCookie($request));

        return $response;
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) {
            return new JsonResponse(['error' => 'Unauthorized'], 401);
        }

        $data = [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'type' => $user->getType(),
            'is_verified' => $user->isVerified(),
            'is_admin' => $user->isAdmin(),
            'roles' => $user->getRoles(),
        ];

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

    #[Route('/api/me/export', methods: ['GET'])]
    public function exportAccount(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) {
            return new JsonResponse(['error' => 'Authentification requise'], 401);
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

    #[Route('/api/account', methods: ['DELETE'])]
    public function deleteAccount(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher
    ): JsonResponse
    {
        $user = $this->jwtService->getUserFromRequest($request);
        if (!$user) return new JsonResponse(['error' => 'Authentification requise'], 401);

        $data = json_decode($request->getContent(), true);
        $password = is_array($data) ? ($data['password'] ?? null) : null;
        if (!is_string($password) || $password === '') {
            return new JsonResponse(['error' => 'Mot de passe requis'], 400);
        }
        if (!$hasher->isPasswordValid($user, $password)) {
            return new JsonResponse(['error' => 'Mot de passe incorrect'], 403);
        }

        $uploadedPaths = [];
        $owner = $em->getRepository(Owner::class)->findOneBy(['user' => $user]);
        if ($owner) {
            $uploadedPaths[] = $owner->getPhotoPath();
            foreach ($owner->getDogs() as $dog) {
                $uploadedPaths[] = $dog->getPhotoPath();
                foreach ($dog->getPhotos() as $photo) {
                    $uploadedPaths[] = $photo->getPhotoPath();
                }
            }
        }
        $sitter = $em->getRepository(Sitter::class)->findOneBy(['user' => $user]);
        if ($sitter) {
            $uploadedPaths[] = $sitter->getPhotoPath();
        }
        foreach ($em->getRepository(Post::class)->findBy(['user' => $user]) as $post) {
            foreach ($post->getImages() as $image) {
                $uploadedPaths[] = $image->getImagePath();
            }
        }

        $em->remove($user);
        $em->flush();
        $this->removeUploadedFiles($uploadedPaths);

        $response = new JsonResponse(['success' => true, 'message' => 'Compte supprimé conformément au RGPD']);
        $response->headers->setCookie($this->authCookieFactory->clear($request));
        $response->headers->setCookie($this->authCookieFactory->clearAuthMarker($request));
        $response->headers->setCookie($this->authCookieFactory->clearCsrfCookie($request));

        return $response;
    }

    #[Route('/api/logout', name: 'api_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $response = new JsonResponse(['success' => true]);
        $response->headers->setCookie($this->authCookieFactory->clear($request));
        $response->headers->setCookie($this->authCookieFactory->clearAuthMarker($request));
        $response->headers->setCookie($this->authCookieFactory->clearCsrfCookie($request));

        return $response;
    }

    #[Route('/api/siret/{siret}', name: 'api_validate_siret', methods: ['GET'])]
    public function validateSiret(string $siret, Request $request, SiretValidator $siretValidator): JsonResponse
    {
        if ($retryAfter = $this->loginRateLimiter->assertSiretAllowed((string) $request->getClientIp())) {
            return new JsonResponse(['error' => 'Trop de requêtes. Réessayez plus tard.'], 429, ['Retry-After' => (string) $retryAfter]);
        }
        $normalized = preg_replace('/\s+/', '', $siret);
        $result = $siretValidator->validate((string) $normalized);
        return new JsonResponse($result);
    }

    private function normalizeProfileData(Request $request): array|string
    {
        $values = [];
        foreach (['nom', 'prenom', 'telephone', 'ville'] as $field) {
            $raw = $request->request->get($field);
            if (!is_string($raw)) {
                return 'Les informations personnelles sont invalides';
            }
            $values[$field] = trim($raw);
        }

        foreach (['nom', 'prenom'] as $field) {
            $length = mb_strlen($values[$field]);
            if ($length < 2 || $length > 100 || preg_match("/^[\\p{L}\\s'-]+$/u", $values[$field]) !== 1) {
                return "Le champ {$field} est invalide";
            }
        }

        if (mb_strlen($values['ville']) < 2 || mb_strlen($values['ville']) > 100) {
            return 'La ville est invalide';
        }

        $values['telephone'] = preg_replace('/\s+/', '', $values['telephone']) ?? '';
        if (preg_match('/^0[1-9]\d{8}$/', $values['telephone']) !== 1) {
            return 'Le numéro de téléphone est invalide';
        }

        return $values;
    }

    private function normalizeDogs(string $dogsJson, DogRepository $dogRepository): array|string
    {
        $dogs = json_decode($dogsJson, true);
        if (!is_array($dogs) || $dogs === [] || count($dogs) > 10) {
            return 'Données chiens invalides';
        }

        $normalized = [];
        $seenIcad = [];
        foreach ($dogs as $index => $dogData) {
            if (!is_array($dogData)) {
                return 'Données chiens invalides';
            }

            foreach (['icadNumber', 'nom', 'sexe', 'race', 'dateNaissance'] as $field) {
                if (!is_string($dogData[$field] ?? null)) {
                    return 'Champ invalide pour le chien ' . ($index + 1);
                }
            }

            $icad = strtoupper(preg_replace('/[\s.-]+/', '', trim($dogData['icadNumber'])) ?? '');
            $name = trim($dogData['nom']);
            $sex = strtoupper(trim($dogData['sexe']));
            $breed = trim($dogData['race']);
            $birthDate = \DateTimeImmutable::createFromFormat('!Y-m-d', trim($dogData['dateNaissance']));
            $dateErrors = \DateTimeImmutable::getLastErrors();

            if (preg_match('/^(?:\d{15}|[A-Z]{3}\d{3}|\d{6}[A-Z]{3})$/', $icad) !== 1) {
                return 'Numéro ICAD invalide pour le chien ' . ($index + 1);
            }
            if (isset($seenIcad[$icad]) || $dogRepository->findOneBy(['icadNumber' => $icad])) {
                return 'Numéro ICAD déjà utilisé : ' . $icad;
            }
            if (mb_strlen($name) < 2 || mb_strlen($name) > 100 || !in_array($sex, ['M', 'F'], true)) {
                return 'Nom ou sexe invalide pour le chien ' . ($index + 1);
            }
            if ($breed === '' || mb_strlen($breed) > 50) {
                return 'Race invalide pour le chien ' . ($index + 1);
            }
            if (!$birthDate || ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0))
                || $birthDate->format('Y-m-d') !== trim($dogData['dateNaissance']) || $birthDate > new \DateTimeImmutable('today')) {
                return 'Date de naissance invalide pour le chien ' . ($index + 1);
            }

            $seenIcad[$icad] = true;
            $normalized[] = [
                'icadNumber' => $icad,
                'icadType' => ctype_digit($icad) ? 'microchip' : 'tattoo',
                'nom' => $name,
                'sexe' => $sex,
                'race' => $breed,
                'dateNaissance' => $birthDate,
            ];
        }

        return $normalized;
    }

    private function normalizeSitterData(Request $request): array|string
    {
        $bioRaw = $request->request->get('bio');
        $servicesRaw = $request->request->get('services');
        $priceRaw = $request->request->get('price_per_hour');
        $availabilityRaw = $request->request->get('is_available');
        $experienceRaw = $request->request->get('experience_years');

        if (!is_string($bioRaw) || !is_string($servicesRaw) || !is_string($priceRaw)) {
            return 'Les informations professionnelles sont invalides';
        }

        $bio = trim($bioRaw);
        if (mb_strlen($bio) < 30 || mb_strlen($bio) > 500) {
            return 'La présentation doit contenir entre 30 et 500 caractères';
        }

        $services = json_decode($servicesRaw, true);
        if (!is_array($services) || $services === [] || count($services) > 20) {
            return 'La liste de services est invalide';
        }
        $cleanedServices = [];
        foreach ($services as $service) {
            if (!is_string($service) || ($service = trim($service)) === '' || mb_strlen($service) > 100) {
                return 'La liste de services est invalide';
            }
            $cleanedServices[] = $service;
        }

        if (!is_numeric($priceRaw) || !is_finite((float) $priceRaw) || (float) $priceRaw <= 0 || (float) $priceRaw > 99999.99) {
            return 'Le tarif horaire est invalide';
        }

        $availability = $availabilityRaw === null
            ? true
            : (is_string($availabilityRaw) ? filter_var($availabilityRaw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null);
        if ($availability === null) {
            return 'La disponibilité est invalide';
        }

        $experience = null;
        if ($experienceRaw !== null && $experienceRaw !== '') {
            if (!is_string($experienceRaw)) {
                return "Le nombre d'années d'expérience est invalide";
            }
            $experience = filter_var($experienceRaw, FILTER_VALIDATE_INT);
            if ($experience === false || $experience < 0 || $experience > 100) {
                return "Le nombre d'années d'expérience est invalide";
            }
        }

        return [
            'bio' => $bio,
            'services' => array_values(array_unique($cleanedServices)),
            'pricePerHour' => number_format((float) $priceRaw, 2, '.', ''),
            'isAvailable' => $availability,
            'experienceYears' => $experience,
        ];
    }

    private function removeUploadedFiles(array $paths): void
    {
        $publicDir = (string) $this->getParameter('kernel.project_dir') . '/public';
        foreach ($paths as $path) {
            if (is_string($path) && str_starts_with($path, '/uploads/')) {
                @unlink($publicDir . $path);
            }
        }
    }
}
