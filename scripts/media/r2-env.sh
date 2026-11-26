#!/usr/bin/env bash
# Accès R2 « bstrdz-r2 » (Cloudflare R2, compatible S3) : identifiants pris dans les secrets
# Codespaces R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, transmis à rclone par
# variables d'environnement uniquement — jamais écrits ni affichés. Le remote lui-même est
# décrit sans secret dans scripts/media/rclone.conf. À sourcer : `source scripts/media/r2-env.sh`.
for v in R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_ENDPOINT; do
  if [ -z "${!v:-}" ]; then
    echo "[media] secret Codespaces manquant : $v (GitHub → Settings → Codespaces → Secrets)" >&2
    return 1 2>/dev/null || exit 1
  fi
done
# Remote « bstrdz-r2 » : scripts/media/rclone.conf (sans secret) ; identifiants par env_auth
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export RCLONE_CONFIG="$ROOT_DIR/scripts/media/rclone.conf"
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_S3_ENDPOINT="$R2_ENDPOINT"
export BSTRDZ_BUCKET="${BSTRDZ_BUCKET:-bstrdz-media}"
export PATH="$HOME/.local/bin:$PATH"
