# Git Cheat Sheet — Golgotha

## Vérifier l’historique
```bash
git log --oneline --graph --decorate --all
```
👉 Affiche les commits sous forme condensée.

---

## Annuler un fichier avant commit
```bash
git restore <fichier>
```

---

## Annuler un `git add` (unstage)
```bash
git restore --staged <fichier>
```

---

## Revenir à l’état du dernier commit
⚠️ Supprime les modifs non sauvegardées.
```bash
git reset --hard HEAD
```

---

## Créer une branche de test
Toujours utile avant d’expérimenter :
```bash
git checkout -b test-experiment
```

---

## Revenir à un commit précis (lecture seule)
```bash
git checkout <commit_hash>
```

---

## Revenir à un commit précis (et écraser la suite)
⚠️ Les commits après `<commit_hash>` disparaîtront si tu forces le push.
```bash
git reset --hard <commit_hash>
```
Puis :
```bash
git push origin main --force
```

---

## Annuler le dernier commit (mais garder les fichiers modifiés)
```bash
git reset --soft HEAD~1
```

---

## Créer un tag avant une grosse bascule
```bash
git tag sauvegarde-experiment
git push origin sauvegarde-experiment
```
👉 Tu pourras toujours revenir à cet état :
```bash
git checkout sauvegarde-experiment
```

---

## Astuce pratique
Lister les différences entre deux commits :
```bash
git diff <commit1> <commit2>
```

---

👉 Ce doc est pensé pour :  
- tester en **sécurité** (branche de test, tags),  
- basculer entre **manual/auto** facilement,  
- savoir **annuler sans paniquer**.
