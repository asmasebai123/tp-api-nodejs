#!/bin/bash
# ============================================
# userdata-backend.sh
# Exécuté automatiquement au démarrage de chaque
# instance EC2 backend créée par l'ASG.
# ============================================

set -e
exec > /var/log/user-data.log 2>&1

echo "====== Démarrage user-data $(date) ======"

# ── 1. Mise à jour système ──
dnf update -y

# ── 2. Installation Node.js 20 ──
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs git

# ── 3. Installation PM2 ──
npm install -g pm2

# ── 4. Cloner le dépôt GitHub ──
cd /home/ec2-user
git clone ${repo_url} app
cd app

# ── 5. Installer les dépendances ──
npm install --production

# ── 6. Créer le fichier .env ──
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=${app_port}
USE_MEMORY_DB=false
MONGODB_URI=${mongodb_uri}

# RDS MySQL — provisionné pour démonstration infrastructure
RDS_HOST=${rds_endpoint}
RDS_DB=${db_name}
RDS_USER=${db_user}
RDS_PASSWORD=${db_password}
ENVEOF

# ── 7. Démarrer l'application avec PM2 ──
pm2 start server.js --name "gestinotes-api"
pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

echo "====== Application démarrée sur le port ${app_port} ======"
echo "====== MongoDB Atlas : ${mongodb_uri} ======"
echo "====== RDS endpoint  : ${rds_endpoint} ======"
