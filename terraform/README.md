# AWS EKS infrastructure

This creates an EKS control plane and managed node group in the account's default VPC. It does not create a VPC, NAT gateway, or load balancer. EKS, EC2 nodes, storage, data transfer, and any Kubernetes `LoadBalancer` services can incur charges.

## Create and verify

1. Authenticate with AWS using a named profile or GitHub OIDC. Never put credentials in tfvars.
2. Copy `terraform.tfvars.example` to `terraform.tfvars` and replace the documentation IP with your public IP `/32`.
3. Run `terraform init`, `terraform fmt -check -recursive`, `terraform validate`, and `terraform plan -out=tfplan`.
4. After explicit cost approval, run `terraform apply tfplan`.
5. Run the `configure_kubectl` output, then `kubectl get nodes`.

## Destroy and recreate demonstration

Export evidence before deletion, then run `terraform plan -destroy -out=destroy.tfplan` and, after approval, `terraform apply destroy.tfplan`. Confirm the cluster is absent with `aws eks describe-cluster`. Recreate by repeating plan/apply from the same committed code. Terraform state must be stored securely; for team use, configure an encrypted S3 backend with locking before apply.

No apply or destroy was performed while preparing this repository.
