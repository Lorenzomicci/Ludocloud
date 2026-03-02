#!/usr/bin/env bash

# Deploy to a remote Kubernetes cluster (e.g. Akamai LKE) using kubectl context.
# Requires remote/pullable images (not local k3d images).
#
# Usage:
#   ./scripts/deploy-akamai.sh \
#     --backend-image registry.example.com/ludocloud-backend:tag \
#     --frontend-image registry.example.com/ludocloud-frontend:tag \
#     [--namespace ludocloud]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
START_DIR="$(pwd)"
NAMESPACE="ludocloud"
BACKEND_IMAGE=""
FRONTEND_IMAGE=""
KUBE_CONTEXT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-image)
      BACKEND_IMAGE="${2:-}"
      shift 2
      ;;
    --frontend-image)
      FRONTEND_IMAGE="${2:-}"
      shift 2
      ;;
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --context)
      KUBE_CONTEXT="${2:-}"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 --backend-image <image> --frontend-image <image> [--namespace <ns>] [--context <ctx>]"
      exit 0
      ;;
    *)
      echo "Argomento non riconosciuto: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "${BACKEND_IMAGE}" || -z "${FRONTEND_IMAGE}" ]]; then
  echo "Devi specificare --backend-image e --frontend-image." >&2
  exit 1
fi

assert_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Comando mancante: $1" >&2
    exit 1
  fi
}

assert_command kubectl

normalize_kubeconfig_paths() {
  if [[ -z "${KUBECONFIG:-}" ]]; then
    return
  fi

  local old_ifs="${IFS}"
  IFS=':' read -r -a kube_paths <<< "${KUBECONFIG}"
  IFS="${old_ifs}"

  local i
  for i in "${!kube_paths[@]}"; do
    if [[ -z "${kube_paths[$i]}" ]]; then
      continue
    fi
    if [[ "${kube_paths[$i]}" != /* ]]; then
      kube_paths[$i]="${START_DIR}/${kube_paths[$i]}"
    fi
    if [[ ! -f "${kube_paths[$i]}" ]]; then
      echo "KUBECONFIG file non trovato: ${kube_paths[$i]}" >&2
      exit 1
    fi
  done

  KUBECONFIG="$(IFS=:; echo "${kube_paths[*]}")"
  export KUBECONFIG
}

resolve_context() {
  if [[ -n "${KUBE_CONTEXT}" ]]; then
    if ! kubectl config get-contexts "${KUBE_CONTEXT}" >/dev/null 2>&1; then
      echo "Context non trovato: ${KUBE_CONTEXT}" >&2
      exit 1
    fi
    return
  fi

  local current
  current="$(kubectl config current-context 2>/dev/null || true)"
  if [[ -n "${current}" ]]; then
    KUBE_CONTEXT="${current}"
    return
  fi

  KUBE_CONTEXT="$(kubectl config get-contexts -o name | head -n1 || true)"
  if [[ -z "${KUBE_CONTEXT}" ]]; then
    echo "Nessun context trovato nel kubeconfig corrente." >&2
    echo "Verifica che KUBECONFIG punti a un vero kubeconfig del cluster Akamai LKE." >&2
    exit 1
  fi

  echo "current-context non impostato; uso il primo context disponibile: ${KUBE_CONTEXT}"
}

k() {
  kubectl --context "${KUBE_CONTEXT}" "$@"
}

get_default_storage_class() {
  k get storageclass -o jsonpath='{range .items[*]}{.metadata.name}{"|"}{.metadata.annotations.storageclass\.kubernetes\.io/is-default-class}{"\n"}{end}' \
    | awk -F'|' '$2=="true"{print $1; exit}'
}

print_postgres_debug() {
  echo "Diagnostica PostgreSQL (namespace ${NAMESPACE}):"
  k -n "${NAMESPACE}" get statefulset,pod,pvc -o wide || true
  echo "Revision (statefulset):"
  k -n "${NAMESPACE}" get statefulset postgres -o jsonpath='{.status.currentRevision}{" -> "}{.status.updateRevision}{"\n"}' || true
  echo "Revision (pod):"
  k -n "${NAMESPACE}" get pod postgres-0 -o jsonpath='{.metadata.labels.controller-revision-hash}{"\n"}' || true
  k get storageclass || true
  k -n "${NAMESPACE}" describe statefulset postgres || true
  k -n "${NAMESPACE}" describe pod postgres-0 || true
  k -n "${NAMESPACE}" describe pvc postgres-data-postgres-0 || true
  echo "Log postgres (current):"
  k -n "${NAMESPACE}" logs postgres-0 -c postgres --tail=200 || true
  echo "Log postgres (previous):"
  k -n "${NAMESPACE}" logs postgres-0 -c postgres --previous --tail=200 || true
}

normalize_kubeconfig_paths

cd "${REPO_ROOT}"

if [[ -z "${KUBECONFIG:-}" ]]; then
  echo "KUBECONFIG non impostata: uso il contesto kubectl di default."
else
  echo "Uso KUBECONFIG=${KUBECONFIG}"
fi

resolve_context
echo "Context selezionato: ${KUBE_CONTEXT}"

if ! k get --raw=/version >/dev/null 2>&1; then
  echo "Impossibile contattare l'API Kubernetes con il context selezionato." >&2
  echo "Controlla server/credenziali nel kubeconfig (spesso e' un endpoint Cloud Manager invece del cluster)." >&2
  exit 1
fi

DEFAULT_SC="$(get_default_storage_class || true)"
if [[ -z "${DEFAULT_SC}" ]]; then
  echo "Nessuna StorageClass di default trovata nel cluster." >&2
  echo "PostgreSQL restera' Pending finche' non imposti una storage class valida." >&2
  echo "Esegui: kubectl --context ${KUBE_CONTEXT} get storageclass" >&2
  exit 1
fi
echo "StorageClass di default: ${DEFAULT_SC}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

cp infra/k8s/backend.yaml "${TMP_DIR}/backend.yaml"
cp infra/k8s/frontend.yaml "${TMP_DIR}/frontend.yaml"
cp infra/k8s/migrate-job.yaml "${TMP_DIR}/migrate-job.yaml"

sed -i "s|ludocloud-backend:local|${BACKEND_IMAGE}|g" "${TMP_DIR}/backend.yaml"
sed -i "s|ludocloud-backend:local|${BACKEND_IMAGE}|g" "${TMP_DIR}/migrate-job.yaml"
sed -i "s|ludocloud-frontend:local|${FRONTEND_IMAGE}|g" "${TMP_DIR}/frontend.yaml"

echo "[1/6] Apply manifest base..."
k apply -f infra/k8s/namespace.yaml
k apply -f infra/k8s/configmap.yaml
k apply -f infra/k8s/secret.yaml
k apply -f infra/k8s/postgres.yaml

echo "[2/6] Attesa PostgreSQL..."
if ! k -n "${NAMESPACE}" rollout status statefulset/postgres --timeout=300s; then
  echo "PostgreSQL non e' andato Ready entro il timeout." >&2
  print_postgres_debug
  exit 1
fi

echo "[3/6] Migrazione e seed database..."
k -n "${NAMESPACE}" delete job ludocloud-migrate --ignore-not-found
k apply -f "${TMP_DIR}/migrate-job.yaml"
k -n "${NAMESPACE}" wait --for=condition=complete job/ludocloud-migrate --timeout=300s

echo "[4/6] Deploy backend/frontend..."
k apply -f "${TMP_DIR}/backend.yaml"
k apply -f "${TMP_DIR}/frontend.yaml"

echo "[5/6] Deploy ingress + hpa..."
k apply -f infra/k8s/ingress.yaml
k apply -f infra/k8s/hpa.yaml

echo "[6/6] Rollout check..."
k -n "${NAMESPACE}" rollout status deployment/ludocloud-backend --timeout=300s
k -n "${NAMESPACE}" rollout status deployment/ludocloud-frontend --timeout=300s

echo "Deploy remoto completato."
