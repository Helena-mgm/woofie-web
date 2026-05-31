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
        // Parse FormData (multipart/form-data)
        $email = $request->request->get('email');
        $password = $request->request->get('password');
        $type = $request->request->get('type');
        
        // Basic validation
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

        try {
            // Create User entity
            $user = new User();
            $user->setEmail($email);
            $user->setType($type);
            $hashed = $hasher->hashPassword($user, $password);
            $user->setPassword($hashed);

            // Validate user entity
            $errors = $validator->validate($user);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse(['error' => implode(', ', $errorMessages)], 400);
            }

            $em->persist($user);
            $em->flush(); // Flush to get user ID

            // Create Owner or Sitter based on type
            if ($type === 'owner') {
                $nom = $request->request->get('nom');
                $prenom = $request->request->get('prenom');
                $telephoneRaw = $request->request->get('telephone');
                $telephone = $telephoneRaw ? preg_replace('/\s+/', '', $telephoneRaw) : null;
                $ville = $request->request->get('ville');
                $dogsJson = $request->request->get('dogs');

                if (!$nom || !$prenom || !$telephone || !$ville) {
                    return new JsonResponse(['error' => 'nom, prenom, telephone and ville are required for owners'], 400);
                }

                if ($ownerRepository->findOneBy(['telephone' => $telephone])) {
                    return new JsonResponse(['error' => 'Ce numéro de téléphone est déjà utilisé'], 400);
                }

                // Validate dogs data
                if (!$dogsJson) {
                    error_log('DEBUG: dogsJson is null or empty');
                    return new JsonResponse(['error' => 'At least one dog is required'], 400);
                }

                error_log('DEBUG: dogsJson = ' . $dogsJson);
                $dogs = json_decode($dogsJson, true);
                error_log('DEBUG: dogs after decode = ' . json_encode($dogs));
                if (!is_array($dogs) || empty($dogs)) {
                    return new JsonResponse(['error' => 'Invalid dogs data or empty. Received: ' . $dogsJson], 400);
                }

                $seenIcadNumbers = [];
                foreach ($dogs as $dogData) {
                    $icadNumber = $dogData['icadNumber'] ?? null;
                    if (!$icadNumber) {
                        continue;
                    }

                    if (in_array($icadNumber, $seenIcadNumbers, true)) {
                        return new JsonResponse(['error' => 'Numéro ICAD en double dans le formulaire: ' . $icadNumber], 400);
                    }
                    $seenIcadNumbers[] = $icadNumber;

                    if ($dogRepository->findOneBy(['icadNumber' => $icadNumber])) {
                        return new JsonResponse(['error' => 'Numéro ICAD déjà utilisé: ' . $icadNumber], 400);
                    }
                }

                $owner = new Owner();
                $owner->setUser($user);
                $owner->setNom($nom);
                $owner->setPrenom($prenom);
                $owner->setTelephone($telephone);
                $owner->setVille($ville);

                // Handle owner photo upload
                $photoFile = $request->files->get('photo');
                if ($photoFile) {
                    $uploadsDir = $this->getParameter('kernel.project_dir') . '/public/uploads/owners';
                    if (!is_dir($uploadsDir)) {
                        mkdir($uploadsDir, 0777, true);
                    }
                    $filename = uniqid() . '.' . $photoFile->guessExtension();
                    $photoFile->move($uploadsDir, $filename);
                    $owner->setPhotoPath('/uploads/owners/' . $filename);
                }

                $em->persist($owner);
                $em->flush();

                // Create dogs with complete information and photos
                foreach ($dogs as $dogIndex => $dogData) {
                    // Validate required fields
                    if (empty($dogData['icadNumber']) || empty($dogData['nom']) || 
                        empty($dogData['sexe']) || empty($dogData['race']) || 
                        empty($dogData['dateNaissance'])) {
                        return new JsonResponse([
                            'error' => 'Missing required fields for dog: ' . ($dogData['nom'] ?? "dog $dogIndex")
                        ], 400);
                    }

                    $dog = new Dog();
                    $dog->setOwner($owner);
                    $dog->setIcadNumber($dogData['icadNumber']);
                    $dog->setNom($dogData['nom']);
                    $dog->setSexe($dogData['sexe']);
                    $dog->setRace($dogData['race']);
                    
                    // Parse and set birth date
                    try {
                        $birthDate = new \DateTime($dogData['dateNaissance']);
                        $dog->setDateNaissance($birthDate);
                    } catch (\Exception $e) {
                        return new JsonResponse([
                            'error' => 'Invalid birth date for ' . $dogData['nom']
                        ], 400);
                    }

                    // Detect ICAD type (microchip or tattoo)
                    $icadType = 'microchip';
                    if (strlen($dogData['icadNumber']) !== 15 || !ctype_digit($dogData['icadNumber'])) {
                        $icadType = 'tattoo';
                    }
                    $dog->setIcadType($icadType);

                    // Handle dog photos (up to 5 photos)
                    $dogPhotosDir = $this->getParameter('kernel.project_dir') . '/public/uploads/dogs';
                    if (!is_dir($dogPhotosDir)) {
                        mkdir($dogPhotosDir, 0777, true);
                    }

                    $photoOrder = 0;
                    for ($photoIndex = 0; $photoIndex < 5; $photoIndex++) {
                        $photoKey = "dogPhoto_{$dogIndex}_{$photoIndex}";
                        $dogPhotoFile = $request->files->get($photoKey);
                        
                        if ($dogPhotoFile) {
                            $dogFilename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $dogData['nom']) . '.' . $dogPhotoFile->guessExtension();
                            $dogPhotoFile->move($dogPhotosDir, $dogFilename);
                            
                            // Create DogPhoto entity
                            $dogPhoto = new DogPhoto();
                            $dogPhoto->setDog($dog);
                            $dogPhoto->setPhotoPath('/uploads/dogs/' . $dogFilename);
                            $dogPhoto->setDisplayOrder($photoOrder);
                            $em->persist($dogPhoto);
                            
                            // Set first photo as main photo path
                            if ($photoOrder === 0) {
                                $dog->setPhotoPath('/uploads/dogs/' . $dogFilename);
                            }
                            
                            $photoOrder++;
                        }
                    }

                    $em->persist($dog);
                }
                
                $em->flush();

            } elseif ($type === 'sitter') {
                $nom = $request->request->get('nom');
                $prenom = $request->request->get('prenom');
                $telephoneRaw = $request->request->get('telephone');
                $telephone = $telephoneRaw ? preg_replace('/\s+/', '', $telephoneRaw) : null;
                $ville = $request->request->get('ville');
                $siretRaw = $request->request->get('siret');
                $siret = $siretRaw ? preg_replace('/\s+/', '', $siretRaw) : null;
                $bio = $request->request->get('bio');
                $servicesRaw = $request->request->get('services');
                $pricePerHour = $request->request->get('price_per_hour');
                $isAvailable = $request->request->get('is_available');
                $experienceYears = $request->request->get('experience_years');

                if (!$nom || !$prenom || !$telephone || !$ville || !$siret) {
                    return new JsonResponse(['error' => 'nom, prenom, telephone, ville and siret are required for sitters'], 400);
                }

                if ($sitterRepository->findOneBy(['telephone' => $telephone])) {
                    return new JsonResponse(['error' => 'Ce numéro de téléphone est déjà utilisé'], 400);
                }

                if ($sitterRepository->findOneBy(['siret' => $siret])) {
                    return new JsonResponse(['error' => 'Ce numéro SIRET est déjà utilisé'], 400);
                }

                $sitter = new Sitter();
                $sitter->setUser($user);
                $sitter->setNom($nom);
                $sitter->setPrenom($prenom);
                $sitter->setTelephone($telephone);
                $sitter->setVille($ville);
                $sitter->setSiret($siret);
                $sitter->setIsVerified(false); // By default, not verified

                if ($bio) {
                    $sitter->setBio($bio);
                }

                if ($servicesRaw) {
                    $decodedServices = json_decode($servicesRaw, true);
                    if (is_array($decodedServices)) {
                        $cleaned = array_values(array_filter(array_map(static function ($service) {
                            return is_string($service) ? trim($service) : null;
                        }, $decodedServices)));
                        $sitter->setServices($cleaned);
                    }
                }

                if ($pricePerHour !== null && $pricePerHour !== '') {
                    $normalizedPrice = number_format((float) $pricePerHour, 2, '.', '');
                    $sitter->setPricePerHour($normalizedPrice);
                }

                if ($isAvailable !== null) {
                    $availability = filter_var($isAvailable, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($availability !== null) {
                        $sitter->setIsAvailable($availability);
                    }
                }

                if ($experienceYears !== null && $experienceYears !== '') {
                    $years = (int) $experienceYears;
                    if ($years < 0) {
                        return new JsonResponse(['error' => 'experience_years must be a positive number'], 400);
                    }
                    $sitter->setExperienceYears($years);
                }

                // Handle photo upload
                $photoFile = $request->files->get('photo');
                if ($photoFile) {
                    $uploadsDir = $this->getParameter('kernel.project_dir') . '/public/uploads';
                    if (!is_dir($uploadsDir)) {
                        mkdir($uploadsDir, 0777, true);
                    }
                    $filename = uniqid() . '.' . $photoFile->guessExtension();
                    $photoFile->move($uploadsDir, $filename);
                    $sitter->setPhotoPath('/uploads/' . $filename);
                }

                $em->persist($sitter);
                $em->flush();
            }

            return new JsonResponse(['success' => true, 'message' => 'User registered successfully'], 201);

        } catch (UniqueConstraintViolationException $e) {
            $message = 'Une donnée unique est déjà utilisée';
            $details = $e->getMessage();

            if (str_contains($details, 'telephone')) {
                $message = 'Ce numéro de téléphone est déjà utilisé';
            } elseif (str_contains($details, 'email')) {
                $message = 'Cet email est déjà utilisé';
            } elseif (str_contains($details, 'siret')) {
                $message = 'Ce numéro SIRET est déjà utilisé';
            } elseif (str_contains($details, 'icad')) {
                $message = 'Ce numéro ICAD est déjà utilisé';
            }

            return new JsonResponse(['error' => $message], 400);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Registration failed: ' . $e->getMessage()], 500);
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
}
