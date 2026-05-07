#!/bin/bash
# ============================================
# userdata-frontend.sh
# Script exécuté au démarrage de l'EC2 frontend.
#
# Ce script :
#   1. Installe nginx
#   2. Clone le dépôt GitHub
#   3. Configure nginx pour servir les fichiers statiques
#   4. Met à jour l'URL de l'API dans app.js
#      (pointe vers l'ALB au lieu de localhost)
# ============================================

set -e
exec > /var/log/user-data-frontend.log 2>&1

# ── 1. Mise à jour + installation nginx ──
dnf update -y
dnf install -y nginx git

# ── 2. Cloner le dépôt ──
cd /home/ec2-user
git clone ${repo_url} app

# ── 3. Remplacer l'URL de l'API dans app.js ──
# En local : http://localhost:3000
# En production : http://<DNS de l'ALB>
sed -i 's|http://localhost:3000|http://${alb_dns_name}|g' /home/ec2-user/app/frontend/app.js

# ── 4. Copier les fichiers frontend dans le dossier nginx ──
cp -r /home/ec2-user/app/frontend/* /usr/share/nginx/html/

# ── 5. Configuration nginx ──
cat > /etc/nginx/conf.d/gestinotes.conf << 'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Servir les fichiers statiques
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy vers l'ALB pour les appels API
    # (optionnel si le frontend appelle l'ALB directement)
    location /api/ {
        proxy_pass http://${alb_dns_name}/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# ── 6. Démarrer nginx ──
systemctl enable nginx
systemctl start nginx

echo "✅ Frontend servi par nginx sur le port 80"
echo "✅ API pointée vers l'ALB : http://${alb_dns_name}"
