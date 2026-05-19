# Railway monorepo entry — builds ONLY backend/ (Express API).
# Do not use this for local Expo development.
FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ .

EXPOSE 3001

CMD ["npm", "start"]
