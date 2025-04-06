#!/bin/bash
rm -rf ChatsappAIchaindesk.zip && \
mkdir -p ChatsappAI&& \
cp -r assets chaindesk.php LICENSE readme.txt uploads.ini ChatsappAI&& \
zip -r chaindesk.zip ChatsappAI&& \
rm -rf chaindesk