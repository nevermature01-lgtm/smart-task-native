#!/bin/bash

# The remote repository URL
REPO_URL="https://github.com/nevermature01-lgtm/smart-task-native"

# Check if a commit message is provided
if [ -z "$1" ]; then
  echo "Error: Commit message is required."
  echo "Usage: ./git_deploy.sh "Your commit message""
  exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo "Initializing new git repository."
  git init
  git branch -M main
fi

# Check if remote 'origin' is configured
if ! git remote | grep -q "origin"; then
  echo "Adding remote origin: $REPO_URL"
  git remote add origin $REPO_URL
else
  # Optional: Update URL if it's different
  git remote set-url origin $REPO_URL
fi

# Add all changes to staging
echo "Adding files to commit..."
git add .

# Commit with the provided message
echo "Committing changes..."
git commit -m "$1"

# Push to the main branch on origin
echo "Pushing to GitHub..."
if git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
    git push
else
    git push -u origin main
fi

echo "Deployment script finished."
