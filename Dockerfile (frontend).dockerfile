# Menggunakan Node.js sebagai base image
FROM node:16

# Tentukan direktori kerja di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy seluruh kode aplikasi ke dalam container
COPY . .

# Build aplikasi React
RUN npm run build

# Install serve untuk menserve aplikasi build
RUN npm install -g serve

# Ekspose port yang akan digunakan
EXPOSE 3000

# Jalankan aplikasi menggunakan 'serve'
CMD ["serve", "-s", "build", "-l", "3000"]
