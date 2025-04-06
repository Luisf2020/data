#!/bin/bash
composer install && \
php vendor/bin/autoindex prestashop:add:index && \
php vendor/bin/php-cs-fixer fix && \
# _PS_ROOT_DIR_=. vendor/bin/phpstan analyse --configuration=tests/phpstan/phpstan.neon && \
rm -rf ChatsappAIchaindesk.zip && \
mkdir -p ChatsappAI&& \
cp -r chaindesk.php controllers docker-compose.yml entrypoint.sh index.php logo.png views ChatsappAI&& \
zip -r chaindesk.zip ChatsappAI&& \
rm -rf chaindesk