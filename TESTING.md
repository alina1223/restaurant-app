# Testing Guide - Hardware Store

## Pregătire

### 1. Verifică variabilele de mediu
Asigură-te că backend `.env` are configurația corectă pentru baza de date:
```
DATABASE_URL=...
JWT_SECRET=...
EMAIL_SERVICE=...
```

### 2. Sincronizează baza de date
```bash
cd backend
node scripts/seed-hardware-products.js
```

Ar trebui să vezi:
```
✓ Conectat la baza de date
✓ Modelele au fost sincronizate
✓ Produsele existente au fost șterse
✓ 20 produse au fost create cu succes!

Rezumat categorii:
  - Firewall: 5 produse
  - Router: 5 produse
  - Camera: 5 produse
  - NAS: 5 produse
```

### 3. Pornește backend și frontend
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Test Cases

### Test 1: Home Page
**Pasul 1:** Accesează `http://localhost:5173/`
**Verificare:**
- ✅ Titlul: "Binevenit la Hardware Store"
- ✅ Text descriptiv despre echipamente hardware
- ✅ Link "Vezi catalogul" merge la `/catalog`
- ✅ Link "Contul meu" merge la `/account`

### Test 2: Catalog Page - Loading
**Pasul 1:** Accesează `http://localhost:5173/catalog`
**Verificare:**
- ✅ Se încarcă lista de produse
- ✅ 4 butoane de categorie: Firewall, Router, Camera, NAS
- ✅ Categoria "Firewall" este selectată implicit
- ✅ Se afișează 5 produse Firewall
- ✅ Filtru section cu filtre generale: Nume, Preț minim, Preț maxim, "Doar în stoc"

### Test 3: Category Carousel
**Pasul 1:** Pe pagina /catalog, clică pe butoanele de categorie
**Verificare:**
- ✅ Clicând pe "Router" → Se afișează 5 routere, filtrele se schimbă
- ✅ Clicând pe "Camera" → Se afișează 5 camere, filtre diferite
- ✅ Clicând pe "NAS" → Se afișează 5 NAS-uri, filtre diferite
- ✅ Clicând din nou pe "Firewall" → Se revine la firewall-uri

### Test 4: Dynamic Filters - Firewall
**Pasul 1:** Rămâi pe Firewall
**Verificare:**
- ✅ Filtre specifice: Brand, RAM, Ports, Throughput, VPN, Rackmount
- ✅ Filtrele se populate cu valori unice din produse
- ✅ Filtrele funcționează (filtrează corect produsele)

### Test 5: Dynamic Filters - Router
**Pasul 1:** Schimbă la Router
**Verificare:**
- ✅ Filtre specifice: Brand, Wi-Fi Standard, RAM, Ports, VPN Support
- ✅ NU apar filtre: Throughput, Rackmount, Resolution, etc.

### Test 6: Dynamic Filters - Camera
**Pasul 1:** Schimbă la Camera
**Verificare:**
- ✅ Filtre specifice: Brand, Resolution, Connectivity, Weatherproof
- ✅ Weatherproof este checkbox (boolean)

### Test 7: Dynamic Filters - NAS
**Pasul 1:** Schimbă la NAS
**Verificare:**
- ✅ Filtre specifice: Brand, Bays, RAM, RAID
- ✅ Bays ar trebui să accepte numere

### Test 8: Product Cards
**Pasul 1:** Pe pagina /catalog, observă cardurile de produse
**Verificare:**
- ✅ Fiecare card arată: Nume, Imagine (dacă exists), Descriere
- ✅ Atributele categoria sunt afișate (ex: RAM: 8GB, Ports: 10x Gigabit)
- ✅ Preț și stoc sunt afișate
- ✅ Butoane: "Detalii", "Coș"
- ✅ Pentru admin: Butoane suplimentare "Editează", "Șterge"

### Test 9: Search & Filter
**Pasul 1:** În filtru "Căutare după nume", scrie "Fortinet"
**Verificare:**
- ✅ Se afișează doar produse cu "Fortinet" în nume
- ✅ Alte filtre continuă să funcționeze

### Test 10: Price Filter
**Pasul 1:** Setează "Preț minim: 500"
**Verificare:**
- ✅ Se afișează doar produse peste 500 MDL

### Test 11: Add to Cart
**Pasul 1:** Autentifică-te ca utilizator normal
**Pasul 2:** Clică "Coș" pe un produs
**Verificare:**
- ✅ Apare mesajul "Produs adăugat în coș"
- ✅ Contorul coșului crește (dacă e afișat)

### Test 12: Admin Create Product
**Pasul 1:** Autentifică-te ca admin
**Pasul 2:** Accesează `/admin`
**Pasul 3:** Caută secțiunea "Creare produs"
**Verificare:**
- ✅ Câmpurile de bază: Nume, Preț, Stoc, Categorie, Descriere, Imagine
- ✅ Selectând "Router" → Apar câmpuri: Brand, Wi-Fi Standard, RAM, Ports, VPN Support
- ✅ Completează formularul și clică "Creează produs"
- ✅ Produsul apare imediat în Catalog

### Test 13: Admin Edit Product
**Pasul 1:** Pe Catalog, pentru un produs, clică "Editează"
**Pasul 2:** Schimbă câteva câmpuri (ex: Preț)
**Verificare:**
- ✅ Apare modalul de editare cu toate câmpurile
- ✅ Câmpurile specifice categoriei sunt corecte
- ✅ Clicând "Salvează" → Produsul se actualizează

### Test 14: Admin Delete Product
**Pasul 1:** Pe Catalog, pentru un produs, clică "Șterge"
**Pasul 2:** Confirmă ștergerea
**Verificare:**
- ✅ Produsul dispare din Catalog

### Test 15: Export CSV
**Pasul 1:** În Admin Panel, secțiunea "Export produse (CSV)"
**Pasul 2:** Setează filtre (ex: Category = "Router")
**Pasul 3:** Clică "Export"
**Verificare:**
- ✅ Se descarcă un fișier CSV
- ✅ CSV-ul conține produsele filtrate
- ✅ CSV-ul include toți atributele hardware (brand, ram, ports, etc.)

### Test 16: Import CSV
**Pasul 1:** Pregătește un CSV cu produse noi (format: id, name, price, stock, category, brand, etc.)
**Pasul 2:** În Admin Panel, secțiunea "Import produse (CSV)", selectează fișierul
**Verificare:**
- ✅ Se afișează rezumatul import-ului
- ✅ Produsele noi apar în Catalog

### Test 17: Product Details
**Pasul 1:** Pe Catalog, clică "Detalii" pe un produs
**Verificare:**
- ✅ Se accesează pagina `/products/:id`
- ✅ Se afișează toate detaliile produsului (inclusiv atributele hardware)
- ✅ Se pot citi recenzii (dacă exists)

### Test 18: Checkout
**Pasul 1:** Adaugă produse în coș
**Pasul 2:** Accesează `/cart`
**Pasul 3:** Clică "Finalizează comanda"
**Verificare:**
- ✅ Se accesează checkout page
- ✅ Se pot introduce date de livrare
- ✅ Se finalizează comanda cu succes

### Test 19: Stock Management
**Pasul 1:** Observă produsele cu stoc 0
**Verificare:**
- ✅ Butonul "Coș" este dezactivat
- ✅ Se afișează "Epuizat"
- ✅ Culoarea se schimbă (roșu)

### Test 20: Responsive Design
**Pasul 1:** Redimensionează browser-ul
**Verificare:**
- ✅ Pe mobile (< 768px): Grid-ul se adapteaza
- ✅ Filtrele rămân accesibile
- ✅ Categoriile se pot scrolla orizontal

## Expected Results

### Numerar de Produse
- Total: 20 produse
- Firewall: 5 (Fortinet x2, Cisco x2, Palo Alto x1)
- Router: 5 (ASUS x2, TP-Link x2, Netgear x1)
- Camera: 5 (Hikvision x2, Dahua, Uniview, Axis)
- NAS: 5 (Synology x2, QNAP x2, Asustor)

### Branduri
- Firewall: Fortinet, Cisco, Palo Alto
- Router: ASUS, TP-Link, Netgear
- Camera: Hikvision, Dahua, Uniview, Axis
- NAS: Synology, QNAP, Asustor

## Troubleshooting

### Produsele nu se afișează
```bash
# Verifică dacă seed-ul a rulat cu succes
cd backend
node scripts/seed-hardware-products.js
```

### Filtrele nu funcționează
- Verifică că categoria este selectată corect
- Verifică console pentru erori
- Reîncarcă pagina (Ctrl+F5)

### Admin buttons nu apar
- Verifică că ești autentificat ca admin
- Verifică `auth.user?.role === 'admin'` în browser console

### Imaginile nu se afișează
- Verifică că path-ul imaginii este corect
- Verifică că folderul `backend/uploads/products/` există

## Notes

- Seed script-ul șterge produsele existente și adaugă 20 noi
- Pentru a resetui, rulează din nou seed script-ul
- CSV export include toți atributele, indiferent de categorie
- CSV import validează atributele bazat pe categorie
