#!/usr/bin/env bash
set -euo pipefail

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null) || {
  echo "Error: gh CLI not installed or not authenticated. Run: gh auth login"
  exit 1
}

usage() {
  echo "Usage: ./scripts/promote.sh <command>"
  echo ""
  echo "Commands:"
  echo "  sync      Sync main → staging → develop (fix drift)"
  echo "  staging   Create PR develop → staging"
  echo "  main      Create PR staging → main"
  echo "  all       Create both PRs (develop → staging, then staging → main)"
  exit 1
}

create_pr() {
  local from=$1 to=$2
  existing=$(gh pr list --base "$to" --head "$from" --json number -q '.[0].number' 2>/dev/null || true)
  if [ -n "$existing" ]; then
    echo "PR #$existing already exists ($from → $to)"
    echo "  https://github.com/$REPO/pull/$existing"
    return 0
  fi

  diff_count=$(git rev-list --count "$to".."$from" 2>/dev/null || echo "0")
  if [ "$diff_count" = "0" ]; then
    echo "Nothing to promote: $from and $to are in sync"
    return 0
  fi

  echo "Creating PR: $from → $to ($diff_count commits)"
  gh pr create \
    --base "$to" \
    --head "$from" \
    --title "promote: $from → $to" \
    --body "Automated promotion of \`$from\` into \`$to\` ($diff_count commits)."
}

sync_branches() {
  echo "Fetching latest..."
  git fetch origin main staging develop

  echo ""
  echo "Syncing staging with main..."
  git checkout staging
  git merge origin/main --no-edit
  git push origin staging

  echo ""
  echo "Syncing develop with staging..."
  git checkout develop
  git merge origin/staging --no-edit
  git push origin develop

  echo ""
  echo "Sync complete. All branches are up to date."
}

[ $# -lt 1 ] && usage

case "$1" in
  sync)
    sync_branches
    ;;
  staging)
    create_pr develop staging
    ;;
  main)
    create_pr staging main
    ;;
  all)
    create_pr develop staging
    echo ""
    create_pr staging main
    ;;
  *)
    usage
    ;;
esac
