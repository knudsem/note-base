# Note Base

Base de connaissances pour équipes. Un utilisateur crée des workspaces, invite d'autres membres, et chacun peut y créer, lire, éditer et supprimer des notes.

Le point central du test étant le scoping multi-tenant (qui voit quoi), le code a été pensé pour rendre cette logique facile à auditer.

## Lancer le projet

Prérequis : Node.js 18+ et Python 3.10+.

```bash
npm install   # détecte python, crée le venv, applique les migrations
npm start     # lance front (5173) et back (3000) en parallèle
```

L'app s'ouvre sur **http://localhost:5173**. Pour lancer les tests : `npm test`.

## Stack

**Backend** : Django 5 + DRF + SQLite. SQLite suffit pour le scope : il a tout ce dont j'ai besoin (contrainte UNIQUE composite, transactions, `select_for_update`), et zéro infra à installer pour le reviewer.

**Frontend** : Vite + React 18 + TypeScript strict + Redux Toolkit + RTK Query + Tailwind. Redux est explicitement valorisé par le brief, RTK Query est la solution officielle de l'écosystème pour gérer cache et invalidation.

## Les deux points qui comptent

**Le scoping multi-tenant** est centralisé dans une seule classe DRF, `workspaces/permissions.py::IsWorkspaceMember`. Elle vérifie l'existence du workspace puis l'appartenance, dans l'ordre 404 puis 403, et attache le workspace à la view pour éviter une seconde requête. Aucune view ne refait cette logique : tout passe par cette permission. Les 4 anti-pièges (403 vs 404 dans les différents cas) ont chacun leur test nommé dans `tests/test_scoping.py`.

**L'unicité du titre sous concurrence** est protégée à deux niveaux : une contrainte `UniqueConstraint(fields=['workspace', 'title'])` en base, et un `try/except IntegrityError` dans le service qui renvoie 409. Le test `test_concurrent_creates_with_same_title_produce_one_note` lance 8 threads en parallèle sur le même titre : un seul réussit, les 7 autres reçoivent 409.

## Côté front

J'ai mis une recherche debouncée 300ms avec highlight des termes dans titre et contenu, un compteur de résultats inline, l'édition inline (pas de modal qui interrompt le flow), une confirmation de suppression intégrée à la card (pas de `window.confirm`), des optimistic updates sur l'édition et la suppression (la note disparaît immédiatement, rollback automatique si l'API échoue), et un layout responsive avec sidebar en drawer sur mobile.

Pour tester le multi-tenant en local, un champ dans la barre du haut permet de switcher l'identité (`X-User-Id`) à la volée.

## Tests

27 tests pytest, exécution en ~0.6 seconde. Ils couvrent les 4 anti-pièges 403/404, l'unicité concurrente sous 8 threads, le format `{error, message}` sur tous les codes (y compris les 404 d'URLs malformées), et un test E2E qui exerce les 7 endpoints en simulant un flow complet de collaboration entre deux users.

## Ce qui n'est pas fait, et pourquoi

Pas d'authentification réelle : le brief précise `X-User-Id` en header, je n'invente pas de feature au-delà.

Pas de drag-and-drop pour réordonner : le contrat impose `ordre createdAt DESC`. Ajouter un champ `position` aurait divergé de la spec, j'ai préféré rester aligné.

Pas de FTS5 : `icontains` reste instantané sur la volumétrie cible. Un index full-text aurait imposé une migration SQL custom sans bénéfice mesurable ici.

## Méthodologie

Projet développé en pair-programming avec Claude (Anthropic) comme assistant. Itérations sur l'architecture, génération de boilerplate, revues croisées. Les décisions structurantes (modèle de données, ordre 404/403, stratégie de concurrence, séparation services/views, format des erreurs) ont été prises et validées par moi. Les 27 tests servent de filet de sécurité contre toute régression.