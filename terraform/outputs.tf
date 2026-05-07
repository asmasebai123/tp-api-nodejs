# ============================================
# OUTPUTS — Informations affichées après terraform apply
# ============================================

output "alb_dns_name" {
  description = "DNS de l'ALB — URL publique de l'application"
  value       = "http://${aws_lb.alb.dns_name}"
}

output "frontend_public_ip" {
  description = "IP publique de l'EC2 frontend"
  value       = aws_instance.frontend.public_ip
}

output "frontend_url" {
  description = "URL du frontend (interface HTML)"
  value       = "http://${aws_instance.frontend.public_ip}"
}

output "ssh_frontend" {
  description = "Commande SSH pour se connecter au frontend"
  value       = "ssh -i ${var.private_key_path} ec2-user@${aws_instance.frontend.public_ip}"
}

output "rds_endpoint" {
  description = "Endpoint RDS MySQL (base relationnelle provisionnée)"
  value       = aws_db_instance.main.address
}

output "rds_connection_info" {
  description = "Infos de connexion à la base RDS MySQL"
  value       = "Host: ${aws_db_instance.main.address} | DB: ${var.db_name} | User: ${var.db_username}"
}

output "mongodb_note" {
  description = "Base de données utilisée par l'application"
  value       = "L'application Node.js utilise MongoDB Atlas (URI injectée via MONGODB_URI)"
}
