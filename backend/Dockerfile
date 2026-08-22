FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias del backend
COPY package*.json ./

RUN npm install

# Copiar el resto del código del backend
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]