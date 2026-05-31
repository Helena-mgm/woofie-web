-- Insérer des posts de test pour le forum
-- Assure-toi qu'il y a au moins un utilisateur dans la base

DO $$
DECLARE
    user_id INTEGER;
BEGIN
    SELECT id INTO user_id FROM users LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        -- Insert sample posts
        INSERT INTO posts (user_id, content, created_at, updated_at) VALUES
        (user_id, 'Mon premier post sur Woofie! 🐕 Tellement heureux d''être ici avec Max!', NOW(), NOW()),
        (user_id, 'Belle balade au parc aujourd''hui avec mon toutou ☀️🌳', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
        (user_id, 'Quelqu''un a des recommandations pour un bon vétérinaire ? 🏥', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours');
        
        RAISE NOTICE 'Posts de test créés avec succès!';
    ELSE
        RAISE NOTICE 'Aucun utilisateur trouvé. Créez d''abord un compte.';
    END IF;
END $$;
