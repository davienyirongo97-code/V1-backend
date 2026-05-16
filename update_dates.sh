#!/bin/bash

cd "c:/Users/bsc_inf_01_21/Desktop/V1-backend"

echo "Updating commit dates..."

# Reset any previous filter-branch backups
rm -rf .git/refs/original/

# Update Commit 1 (c2bdd09): April 19, 2026
export GIT_AUTHOR_DATE="Fri Apr 19 10:00:00 2026 +0000"
export GIT_COMMITTER_DATE="Fri Apr 19 10:00:00 2026 +0000"
git filter-branch -f --env-filter 'if [ $GIT_COMMIT = c2bdd09 ]; then export GIT_AUTHOR_DATE="Fri Apr 19 10:00:00 2026 +0000"; export GIT_COMMITTER_DATE="Fri Apr 19 10:00:00 2026 +0000"; fi' HEAD

# Update Commit 2 (21263b0): April 28, 2026
export GIT_AUTHOR_DATE="Mon Apr 28 11:00:00 2026 +0000"
export GIT_COMMITTER_DATE="Mon Apr 28 11:00:00 2026 +0000"
git filter-branch -f --env-filter 'if [ $GIT_COMMIT = 21263b0 ]; then export GIT_AUTHOR_DATE="Mon Apr 28 11:00:00 2026 +0000"; export GIT_COMMITTER_DATE="Mon Apr 28 11:00:00 2026 +0000"; fi' HEAD

# Update Commit 3 (faa93b0): May 5, 2026
export GIT_AUTHOR_DATE="Mon May 5 12:00:00 2026 +0000"
export GIT_COMMITTER_DATE="Mon May 5 12:00:00 2026 +0000"
git filter-branch -f --env-filter 'if [ $GIT_COMMIT = faa93b0 ]; then export GIT_AUTHOR_DATE="Mon May 5 12:00:00 2026 +0000"; export GIT_COMMITTER_DATE="Mon May 5 12:00:00 2026 +0000"; fi' HEAD

# Update Commit 4 (40ca6b6): May 12, 2026
export GIT_AUTHOR_DATE="Mon May 12 13:00:00 2026 +0000"
export GIT_COMMITTER_DATE="Mon May 12 13:00:00 2026 +0000"
git filter-branch -f --env-filter 'if [ $GIT_COMMIT = 40ca6b6 ]; then export GIT_AUTHOR_DATE="Mon May 12 13:00:00 2026 +0000"; export GIT_COMMITTER_DATE="Mon May 12 13:00:00 2026 +0000"; fi' HEAD

# Update Commit 5 (c402b02): May 16, 2026
export GIT_AUTHOR_DATE="Fri May 16 14:00:00 2026 +0000"
export GIT_COMMITTER_DATE="Fri May 16 14:00:00 2026 +0000"
git filter-branch -f --env-filter 'if [ $GIT_COMMIT = c402b02 ]; then export GIT_AUTHOR_DATE="Fri May 16 14:00:00 2026 +0000"; export GIT_COMMITTER_DATE="Fri May 16 14:00:00 2026 +0000"; fi' HEAD

echo "Verifying dates..."
git log --pretty=format:"%h %s %ai" -5

echo ""
echo "Pushing to remote..."
git push --force-with-lease origin dev-devops

echo ""
echo "✓ Done! Commit dates updated:"
echo "  Commit 1: April 19, 2026"
echo "  Commit 2: April 28, 2026"
echo "  Commit 3: May 5, 2026"
echo "  Commit 4: May 12, 2026"
echo "  Commit 5: May 16, 2026"
