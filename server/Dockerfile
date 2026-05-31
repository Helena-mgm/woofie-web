# ===============================
# 🧱 STAGE 1 : build des vendors
# ===============================
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
# Install all dependencies including firebase/php-jwt
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --no-scripts

# ===============================
# 🐘 STAGE 2 : PHP-FPM (runtime)
# ===============================
FROM php:8.3-fpm
WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libpq-dev libzip-dev libonig-dev libcurl4-openssl-dev \
 && docker-php-ext-install intl pdo pdo_pgsql zip opcache curl

COPY . .
COPY --from=vendor /app/vendor ./vendor

# ⚡ Exécution manuelle du cache une fois tout copié
RUN php bin/console cache:clear --env=prod || true

# 📁 Créer les dossiers d'uploads avec permissions
RUN mkdir -p public/uploads/owners public/uploads/dogs public/uploads/posts \
 && chown -R www-data:www-data public/uploads \
 && chmod -R 775 public/uploads

RUN chown -R www-data:www-data var
EXPOSE 9000

ENV POI_BBOXES="48.70,2.20,48.95,2.50 45.60,4.60,45.85,4.95"

CMD ["sh", "-c", "php bin/console doctrine:migrations:migrate --no-interaction || true && php bin/console app:pois:refresh $POI_BBOXES || true && php bin/console cache:clear --env=prod || true && php-fpm"]
