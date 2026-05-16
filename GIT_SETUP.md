# Git Setup for Multiple Users

This guide helps you switch between Davie Nyirongo and Beatrice Malunguza when committing to different branches.

## Global Configuration (Default)

Set your default Git identity:

```powershell
git config --global user.name "Davie Nyirongo"
git config --global user.email "davienyirongo97@gmail.com"
```

## Per-Branch Configuration

### For Davie's Branch (dev-devops)

```powershell
git checkout dev-devops
git config --local user.name "Davie Nyirongo"
git config --local user.email "davienyirongo97@gmail.com"
```

### For Beatrice's Branch (jms-matungura-dev)

```powershell
git checkout jms-matungura-dev
git config --local user.name "Beatrice Malunguza"
git config --local user.email "malunguzabeatrice@gmail.com"
```

## Quick Switch Commands

**Switch to Davie's branch:**
```powershell
git checkout dev-devops
git config --local user.name "Davie Nyirongo"
git config --local user.email "davienyirongo97@gmail.com"
```

**Switch to Beatrice's branch:**
```powershell
git checkout jms-matungura-dev
git config --local user.name "Beatrice Malunguza"
git config --local user.email "malunguzabeatrice@gmail.com"
```

## Verify Current Configuration

```powershell
git config user.name
git config user.email
```

## Making Commits

After switching branches and configuring the author:

```powershell
# Make your changes
git add .
git commit -m "Your commit message"
git push origin <branch-name>
```

The commit will show the correct author on GitHub!
