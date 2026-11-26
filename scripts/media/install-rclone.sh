#!/usr/bin/env bash
# Installation reproductible de rclone (BSTRDZ 7.1) — binaire officiel, somme SHA-256 vérifiée,
# installé pour l'utilisateur (~/.local/bin, sans sudo). Idempotent : rien à faire s'il est présent.
# Usage : bash scripts/media/install-rclone.sh   (ou npm run media:setup)
set -euo pipefail

if command -v rclone >/dev/null 2>&1; then
  echo "[media] rclone déjà installé : $(rclone version | head -1)"
  exit 0
fi

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) ARCH=amd64 ;;
  aarch64 | arm64) ARCH=arm64 ;;
  *) echo "[media] architecture non prise en charge : $ARCH" >&2; exit 1 ;;
esac

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
BASE="https://downloads.rclone.org/rclone-current-linux-${ARCH}"
curl -fsSL "${BASE}.zip" -o "$TMP/rclone.zip"
curl -fsSL "https://downloads.rclone.org/rclone-current-linux-${ARCH}.zip.sha256sum" -o "$TMP/sum" 2>/dev/null || true
if [ -s "$TMP/sum" ]; then
  (cd "$TMP" && echo "$(cut -d' ' -f1 sum)  rclone.zip" | sha256sum -c --quiet)
  echo "[media] somme SHA-256 vérifiée"
else
  # Repli : somme publiée dans SHA256SUMS de la version courante
  VER="$(curl -fsSL https://downloads.rclone.org/version.txt | sed 's/rclone //')"
  curl -fsSL "https://downloads.rclone.org/${VER}/SHA256SUMS" -o "$TMP/SUMS"
  EXPECTED="$(grep "rclone-${VER}-linux-${ARCH}.zip" "$TMP/SUMS" | awk '{print $1}')"
  echo "${EXPECTED}  $TMP/rclone.zip" | sha256sum -c --quiet
  echo "[media] somme SHA-256 vérifiée (${VER})"
fi

(cd "$TMP" && unzip -q rclone.zip)
mkdir -p "$HOME/.local/bin"
install -m 0755 "$TMP"/rclone-*/rclone "$HOME/.local/bin/rclone"
echo "[media] rclone installé : $("$HOME/.local/bin/rclone" version | head -1)"
case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) echo "[media] ajouter ~/.local/bin au PATH" ;; esac
