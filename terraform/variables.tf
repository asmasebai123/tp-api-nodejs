# ============================================
# VARIABLES — Paramètres de l'infrastructure
# ============================================

variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Préfixe pour nommer toutes les ressources AWS"
  type        = string
  default     = "projet-cloud"
}

variable "instance_type" {
  description = "Type d'instance EC2 pour le backend"
  type        = string
  default     = "t2.micro"
}

variable "key_pair_name" {
  description = "Nom de la paire de clés SSH dans AWS"
  type        = string
  default     = "projet-cloud-key"
}

variable "public_key_path" {
  description = "Chemin vers la clé publique SSH (Windows)"
  type        = string
}

variable "private_key_path" {
  description = "Chemin vers la clé privée SSH (pour la commande SSH en output)"
  type        = string
}

variable "my_ip" {
  description = "Votre IP publique pour SSH (format x.x.x.x/32)"
  type        = string
}

variable "app_port" {
  description = "Port de l'API Node.js"
  type        = number
  default     = 3000
}

variable "github_repo_url" {
  description = "URL HTTPS de votre dépôt GitHub"
  type        = string
}

# ── MongoDB Atlas ────────────────────────────────────────────
# URI de connexion MongoDB Atlas.
# L'application Node.js/Mongoose se connecte à cette base.
# Format : mongodb+srv://user:password@cluster.mongodb.net/dbname
variable "mongodb_uri" {
  description = "URI MongoDB Atlas (base de données principale de l'application)"
  type        = string
  sensitive   = true   # masquée dans les logs terraform
}

# ── RDS MySQL ────────────────────────────────────────────────
# Variables pour la base RDS MySQL provisionnée dans l'infrastructure.
# La RDS illustre la maîtrise des bases relationnelles managées sur AWS.
variable "db_name" {
  description = "Nom de la base de données MySQL (RDS)"
  type        = string
  default     = "gestinotes"
}

variable "db_username" {
  description = "Nom d'utilisateur MySQL (RDS)"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Mot de passe MySQL (RDS)"
  type        = string
  sensitive   = true
}
