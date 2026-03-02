#!/usr/bin/env bash

# Deploy cloud-native locale completo:
# - build immagini
# - import su k3d
# - apply manifest
# - migration+seed
# - rollout check

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CLUSTER_NAME="${1:-ludocloud}"

cd "${REPO_ROOT}"

assert_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Comando mancante: $1" >&2
    exit 1
  fi
}

assert_command docker
assert_command kubectl
assert_command k3d

echo "[1/7] Verifica cluster k3d..."
if ! k3d cluster list --no-headers | awk '{print $1}' | grep -Fxq "${CLUSTER_NAME}"; then
  k3d cluster create "${CLUSTER_NAME}" -p "8080:80@loadbalancer"
fi

echo "[2/7] Build immagini Docker..."
docker build -t ludocloud-backend:local -f infra/docker/backend.Dockerfile .
docker build -t ludocloud-frontend:local -f infra/docker/frontend.Dockerfile .

echo "[3/7] Import immagini nel cluster..."
k3d image import ludocloud-backend:local -c "${CLUSTER_NAME}"
k3d image import ludocloud-frontend:local -c "${CLUSTER_NAME}"

echo "[4/7] Apply manifest base..."
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/secret.yaml
kubectl apply -f infra/k8s/postgres.yaml

echo "[5/7] Attesa PostgreSQL..."
kubectl -n ludocloud rollout status statefulset/postgres --timeout=180s

echo "[6/7] Migrazione e seed database..."
kubectl -n ludocloud delete job ludocloud-migrate --ignore-not-found
kubectl apply -f infra/k8s/migrate-job.yaml
kubectl -n ludocloud wait --for=condition=complete job/ludocloud-migrate --timeout=180s

echo "[7/7] Deploy backend/frontend + ingress + hpa..."
kubectl apply -f infra/k8s/backend.yaml
kubectl apply -f infra/k8s/frontend.yaml
kubectl apply -f infra/k8s/ingress.yaml
kubectl apply -f infra/k8s/hpa.yaml

kubectl -n ludocloud rollout status deployment/ludocloud-backend --timeout=180s
kubectl -n ludocloud rollout status deployment/ludocloud-frontend --timeout=180s

echo "Deploy completato."
echo "Frontend: http://localhost:8080"
echo "Health API: http://localhost:8080/api/v1/health/ready"
