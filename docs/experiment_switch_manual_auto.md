# Experiment — switch MANUAL / AUTO

## Pré-requis (one-shot)
- Script générateur : `scripts/generate-experiment-md.cjs`
- Fichiers de données :
  - **AUTO cible** : `public/data/infinite-grid.md`
  - **MANUAL backup** : `public/data/infinite-grid.manual.md` (copie de ta version à la main)

Ajoute ces scripts dans `package.json` (facultatif mais pratique) :

```json
{
  "scripts": {
    "regen:experiment": "node scripts/generate-experiment-md.cjs --dir=public/images/video --out=public/data/infinite-grid.md",
    "use:manual": "cp public/data/infinite-grid.manual.md public/data/infinite-grid.md"
  }
}
```

---

## Basculer en mode **AUTO** (généré)
But : scanner `public/images/video/` → produire un nouveau `infinite-grid.md`.

```bash
npm run regen:experiment
# (équivalent direct)
node scripts/generate-experiment-md.cjs --dir=public/images/video --out=public/data/infinite-grid.md
```

### Vérifs
- Ouvre le MD servi par Next : [http://localhost:3000/data/infinite-grid.md](http://localhost:3000/data/infinite-grid.md)
- Recharge `/experiment` (Cmd+Shift+R).

---

## Basculer en mode **MANUAL** (à la main)
But : rétablir ton front-matter “fait main”.

```bash
npm run use:manual
# (équivalent direct)
cp public/data/infinite-grid.manual.md public/data/infinite-grid.md
```

### Vérifs
- `http://localhost:3000/data/infinite-grid.md` doit redevenir ta version manuelle.
- Recharge `/experiment`.

---

## Workflow conseillé
1. **Ajoute/renomme** des visuels dans `public/images/video/`.
2. **AUTO** : `npm run regen:experiment` → test.
3. Si besoin revenir : **MANUAL** : `npm run use:manual`.

---

## Checks rapides
- Voir les 20 1ères lignes du MD :
  ```bash
  head -n 20 public/data/infinite-grid.md
  ```
- Chercher un nouveau fichier :
  ```bash
  grep -i "echo" public/data/infinite-grid.md || true
  ```

---

## Dépannage
- Le MD ne change pas ?
  - Vérifie que tu lances la commande depuis la racine du projet.
  - Forcer le rafraîchissement : `Cmd+Shift+R` sur `/experiment`.
- Tu ne vois pas certaines images ?
  - Sensible à la **casse** en prod (Vercel) : `Image.png` ≠ `image.png`.
  - Le script inclut **toutes** les images (posters compris).  
    Si tu veux exclure les posters, modifie dans le script :
    ```js
    const imagePool = imgs.filter(n => !usedPosters.has(path.posix.join("/images/video", n)));
    ```

---

## Rappel important
L’app **ne lit que** `public/data/infinite-grid.md`.  
Le script **ne s’exécute jamais automatiquement** : tu le lances quand tu veux régénérer.
