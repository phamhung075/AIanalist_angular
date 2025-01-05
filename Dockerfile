# Étape 1 : Utiliser une image Node de base
FROM node:18.19.1 AS builder

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json, package-lock.json et .npmrc dans le répertoire de travail
COPY package*.json ./

# Installer les dépendances du projet (forçage sans cache)
RUN npm install

# Copier tout le reste du projet dans le conteneur
COPY . .

# Sélectionner le script de build en fonction de PROJECT_NAME_QUERY
RUN npm run build && mv dist/aianalist /app/dist/build;

# Étape 2 : Construire l'image finale avec une image Nginx de base
FROM nginx:stable-alpine

# Copier le build final (dossier fixe) vers le répertoire de service de Nginx
COPY --from=builder /app/dist/build /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Commande pour démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
