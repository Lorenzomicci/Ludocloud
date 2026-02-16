param(
  [string]$ClusterName = "ludocloud"
)

# Deploy cloud-native locale completo:
# - build immagini
# - import su k3d
# - apply manifest
# - migration+seed
# - rollout check
$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Comando mancante: $name"
  }
}

Assert-Command "docker"
Assert-Command "kubectl"
Assert-Command "k3d"

Write-Host "[1/7] Verifica cluster k3d..."
$clusterExists = (k3d cluster list --no-headers | Select-String "^$ClusterName\s") -ne $null
if (-not $clusterExists) {
  k3d cluster create $ClusterName -p "8080:80@loadbalancer"
}

Write-Host "[2/7] Build immagini Docker..."
docker build -t ludocloud-backend:local -f infra/docker/backend.Dockerfile .
docker build -t ludocloud-frontend:local -f infra/docker/frontend.Dockerfile .

Write-Host "[3/7] Import immagini nel cluster..."
k3d image import ludocloud-backend:local -c $ClusterName
k3d image import ludocloud-frontend:local -c $ClusterName

Write-Host "[4/7] Apply manifest base..."
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/secret.yaml
kubectl apply -f infra/k8s/postgres.yaml

Write-Host "[5/7] Attesa PostgreSQL..."
kubectl -n ludocloud rollout status statefulset/postgres --timeout=180s

Write-Host "[6/7] Migrazione e seed database..."
kubectl -n ludocloud delete job ludocloud-migrate --ignore-not-found
kubectl apply -f infra/k8s/migrate-job.yaml
kubectl -n ludocloud wait --for=condition=complete job/ludocloud-migrate --timeout=180s

Write-Host "[7/7] Deploy backend/frontend + ingress + hpa..."
kubectl apply -f infra/k8s/backend.yaml
kubectl apply -f infra/k8s/frontend.yaml
kubectl apply -f infra/k8s/ingress.yaml
kubectl apply -f infra/k8s/hpa.yaml

kubectl -n ludocloud rollout status deployment/ludocloud-backend --timeout=180s
kubectl -n ludocloud rollout status deployment/ludocloud-frontend --timeout=180s

Write-Host "Deploy completato."
Write-Host "Frontend: http://localhost:8080"
Write-Host "Health API: http://localhost:8080/api/v1/health/ready"
