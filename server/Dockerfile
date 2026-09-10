FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
# GD is compiled in the final PHP image below; the Composer-only builder does
# not ship PHP extensions, so ignore this single platform check in this stage.
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --no-scripts --ignore-platform-req=ext-gd

FROM php:8.3-fpm
WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libpq-dev libzip-dev libonig-dev libcurl4-openssl-dev libjpeg-dev libpng-dev libwebp-dev \
 && docker-php-ext-configure gd --with-jpeg --with-webp \
 && docker-php-ext-install intl pdo pdo_pgsql zip opcache curl gd

COPY . .
COPY --from=vendor /app/vendor ./vendor

RUN printf 'APP_ENV=prod\nAPP_DEBUG=0\n' > .env

RUN mkdir -p public/uploads/owners public/uploads/dogs public/uploads/posts public/uploads/sitters \
 && chown -R www-data:www-data public/uploads \
 && chmod -R 775 public/uploads

RUN mkdir -p var/cache var/log \
 && chown -R www-data:www-data var
EXPOSE 9000

CMD ["php-fpm"]
