# Menggunakan Go sebagai base image
FROM golang:1.20-alpine

# Install dependencies tambahan jika diperlukan
RUN apk add --no-cache git

# Membuat direktori aplikasi
WORKDIR /app

# Copy go mod dan go sum, lalu install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy semua kode ke dalam container
COPY . .

# Build aplikasi
RUN go build -o app .

# Ekspose port yang akan digunakan
EXPOSE 8000

# Jalankan aplikasi
CMD ["./app"]
