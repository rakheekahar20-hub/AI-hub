#!/usr/bin/env bash
set -e

echo "Deploying application..."

# Attempt git push if github.com is reachable; fallback if resolution fails
if getent hosts github.com >/dev/null 2>&1 || ping -c 1 -W 2 github.com >/dev/null 2>&1; then
  echo "GitHub is reachable. Attempting git push..."
  git push origin main || echo "Git push failed, proceeding to Vercel deployment..."
else
  echo "GitHub host cannot be resolved. Bypassing git push..."
fi

echo "Deploying to Vercel production..."
vercel deploy --prod
