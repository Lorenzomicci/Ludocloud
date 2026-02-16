# Kubernetes manifest LudoCloud

Ordine applicazione manuale:
1. `kubectl apply -f infra/k8s/namespace.yaml`
2. `kubectl apply -f infra/k8s/configmap.yaml -f infra/k8s/secret.yaml`
3. `kubectl apply -f infra/k8s/postgres.yaml`
4. attesa postgres ready
5. `kubectl apply -f infra/k8s/migrate-job.yaml`
6. `kubectl apply -f infra/k8s/backend.yaml -f infra/k8s/frontend.yaml`
7. `kubectl apply -f infra/k8s/ingress.yaml -f infra/k8s/hpa.yaml`

Namespace: `ludocloud`