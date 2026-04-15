# Jenkins CI/CD Pipeline Documentation

## Pipeline Overview

Ce Jenkinsfile configure un pipeline CI/CD complet pour l'application Todo App avec les étapes suivantes :

### 📋 Étapes du Pipeline

1. **Checkout** - Récupération du code source
2. **Setup Environment** - Configuration de Node.js 
3. **Install Dependencies** - Installation des dépendances NPM et navigateurs Playwright
4. **Code Quality** (Parallèle) - Vérification de la qualité du code et audit de sécurité
5. **Unit Tests** - Tests unitaires avec couverture de code
6. **Integration Tests** - Tests d'intégration
7. **End-to-End Tests** - Tests E2E avec Playwright
8. **Code Coverage** - Génération et publication des rapports de couverture
9. **Build Artifacts** - Création des artefacts de déploiement
10. **Deploy** - Déploiement automatique (branches main/develop uniquement)

## 🔧 Configuration Requise

### Plugins Jenkins Nécessaires

```bash
# Plugins de base requis
- NodeJS Plugin
- HTML Publisher Plugin
- JUnit Plugin
- Pipeline Plugin
- Git Plugin
- Workspace Cleanup Plugin

# Installation via Jenkins CLI
jenkins-cli.exe -s http://jenkins-url install-plugin nodejs
jenkins-cli.exe -s http://jenkins-url install-plugin htmlpublisher
jenkins-cli.exe -s http://jenkins-url install-plugin junit
```

### Configuration Node.js dans Jenkins

1. Aller à **Manage Jenkins** → **Global Tool Configuration**
2. Ajouter une installation Node.js :
   - **Name**: `Node 18`
   - **Version**: `18.x.x`
   - ✅ **Install automatically**

### Variables d'Environnement

```bash
NODE_VERSION = '18'        # Version de Node.js
APP_NAME = 'todo-app'      # Nom de l'application  
DEPLOY_PORT = '3000'       # Port de déploiement
```

## 📊 Rapports et Artefacts

### Rapports Générés

| Type | Emplacement | Description |
|------|-------------|-------------|
| **Test Results** | `junit.xml` | Résultats des tests Jest |
| **Coverage Report** | `coverage/lcov-report/index.html` | Couverture de code |
| **Playwright Report** | `test-results/playwright-report/index.html` | Rapports E2E |
| **Build Artifacts** | `${APP_NAME}-build-${BUILD_NUMBER}.tar.gz` | Package de déploiement |

### Artefacts Archivés

- Package de déploiement compressé
- Rapports de tests Playwright
- Rapports de couverture de code
- Fichier de version avec métadonnées de build

## 🚀 Déploiement Automatique

### Stratégie de Branches

```bash
main/master → Production   # Déploiement automatique en production
develop     → Staging      # Déploiement automatique en staging  
autres      → Tests only   # Pas de déploiement, tests uniquement
```

### Pipeline de Déploiement

1. **Staging** (branche `develop`)
   - Tests complets
   - Déploiement automatique
   - Tests d'intégration post-déploiement

2. **Production** (branche `main`/`master`)
   - Tests complets
   - Déploiement automatique
   - Tests de fumée
   - Monitoring activé

## 🛠️ Configuration des Tests

### Tests Unitaires
```bash
# Commande exécutée
npm run test:unit -- --coverage --ci --testResultsProcessor=jest-junit

# Génère
- junit.xml (résultats)
- coverage/ (couverture)
```

### Tests d'Intégration
```bash
# Commande exécutée  
npm run test:integration -- --ci --testResultsProcessor=jest-junit

# Génère
- junit.xml (résultats)
```

### Tests E2E
```bash
# Processus
1. npm start & (demo en arrière-plan)
2. sleep 10 (attente serveur)
3. curl check (vérification)
4. npm run test:e2e --reporter=junit
5. kill server

# Génère
- test-results/playwright-report/
- test-results/junit.xml
```

## ⚙️ Configuration Avancée

### Timeouts et Limites

```groovy
timeout(time: 20, unit: 'MINUTES')           # Timeout global
buildDiscarder(daysToKeepStr: '30', numToKeepStr: '10')  # Rétention builds
```

### Exécution Parallèle

Le pipeline utilise l'exécution parallèle pour :
- Code Quality checks (Lint + Security Audit)
- Optimise le temps d'exécution global

### Nettoyage Automatique

```groovy
cleanWs(
    cleanWhenAborted: true,
    cleanWhenFailure: true,
    cleanWhenNotBuilt: true,
    cleanWhenSuccess: true,
    cleanWhenUnstable: true,
    deleteDirs: true
)
```

## 📧 Notifications (À Configurer)

Le pipeline inclut des hooks pour notifications :

- **Success** : Déploiement réussi
- **Failure** : Échec du pipeline  
- **Unstable** : Tests avec avertissements
- **Aborted** : Pipeline interrompu

### Canaux de Notification Supportés

- Slack
- Microsoft Teams  
- Email
- Webhooks personnalisés

## 🐛 Dépannage

### Problèmes Courants

#### 1. Node.js non trouvé
```bash
# Solution : Vérifier la configuration Node.js dans Jenkins
Manage Jenkins → Global Tool Configuration → NodeJS
```

#### 2. Playwright browsers manquants
```bash
# Solution : Le pipeline installe automatiquement
npm run install:browsers
```

#### 3. Tests E2E échouent
```bash
# Vérifications :
1. Le serveur démarre-t-il (port 3000) ?
2. curl http://localhost:3000 fonctionne ?
3. Les navigateurs Playwright sont installés ?
```

#### 4. Permissions de déploiement
```bash
# Solutions :
1. Configurer les credentials Jenkins
2. Vérifier les permissions SSH/deployment keys
3. Tester la connectivité vers les serveurs cibles
```

### Logs de Debug

```bash
# Activer le debug pour Node.js
NODE_ENV=development

# Debug des tests Playwright
npm run test:e2e:debug
```

## 📈 Métriques et Monitoring

### KPIs de Pipeline

- **Temps d'exécution** : ~15-20 minutes
- **Couverture de code** : > 80%
- **Taux de réussite** : > 95%
- **Temps de feedback** : < 5 minutes (tests unitaires)

### Dashboard Recommandé

1. **Build Status** : Statut des derniers builds
2. **Test Trends** : Évolution des résultats de tests
3. **Coverage Trends** : Évolution de la couverture
4. **Deployment Frequency** : Fréquence des déploiements

## 🔐 Sécurité

### Bonnes Pratiques Implémentées

- ✅ `npm audit` à chaque build
- ✅ Credentials sécurisés via Jenkins
- ✅ Isolation des environnements  
- ✅ Nettoyage du workspace
- ✅ Timeout protection

### Recommandations de Sécurité

1. Configurer les secrets via Jenkins Credentials
2. Utiliser HTTPS pour tous les endpoints
3. Scanner les dépendances avec `npm audit`
4. Implémenter des tests de sécurité
5. Rotation régulière des clés de déploiement