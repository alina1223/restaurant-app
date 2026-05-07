# Hardware Store - Implementare

## Ce s-a schimbat

Aplicația a fost transformată din "Restaurant" în "Hardware Store" cu 4 categorii de produse și filtre specifice pentru fiecare categorie.

### Categorii și Filtre:

#### 1. **Firewall**
- Brand
- RAM
- Ports
- Throughput
- VPN
- Rackmount

#### 2. **Router**
- Brand
- Wi-Fi Standard
- RAM
- Ports
- VPN Support

#### 3. **Camera de supraveghere**
- Brand
- Resolution
- Connectivity
- Weatherproof

#### 4. **NAS**
- Brand
- Bays
- RAM
- RAID

## Fișiere Modificate

### Backend

1. **[models/Product.js](models/Product.js)**
   - Schimbate categoriile din restaurant în hardware
   - Adăugate coloane pentru atributele specifice fiecărei categorii

2. **[products/dto/create-product.dto.js](products/dto/create-product.dto.js)**
   - Actualizate validări pentru noi categorii
   - Adăugată validare pentru atributele hardware

3. **[products/dto/update-product.dto.js](products/dto/update-product.dto.js)**
   - Actualizate pentru a suporta atributele hardware

4. **[products/dto/export-products.dto.js](products/dto/export-products.dto.js)**
   - Schimbate categoriile în export

5. **[products/products.js](products/products.js)**
   - Actualizate rutele GET, POST, PUT pentru a returna și accepta atributele hardware

6. **[admin/admin.js](admin/admin.js)**
   - Actualizate rutele admin pentru creare, editare, și export de produse
   - Funcția `generateExportCSV()` include toate atributele hardware

7. **[scripts/seed-hardware-products.js](scripts/seed-hardware-products.js)**
   - Script nou pentru a popula baza de date cu 20 produse realiste (5 pe categorie)
   - Produse de la branduri cunoscute: Fortinet, Cisco, ASUS, TP-Link, Hikvision, Synology, QNAP

### Frontend

1. **[src/App.jsx](frontend/src/App.jsx)**
   - Înlocuit MenuPage cu CatalogPage
   - Redirecționări de la /menu la /catalog

2. **[src/ui/Layout.jsx](frontend/src/ui/Layout.jsx)**
   - Brand schimbat de la "Restaurant" la "Hardware Store"
   - Link de meniu schimbat de la "/menu" la "/catalog"

3. **[src/ui/pages/CatalogPage.jsx](frontend/src/ui/pages/CatalogPage.jsx)** (NOU)
   - Nouă pagină de catalog cu:
     - Carusel de categorii pentru ușor switch între categorii
     - Filtre dinamice bazate pe categoria selectată
     - Grid de produse cu toți atributele afișate
     - Editare și ștergere pentru admin
     - Suport pentru imagine și detalii complete

4. **[src/ui/components/ProductFormHelper.jsx](frontend/src/ui/components/ProductFormHelper.jsx)** (NOU)
   - Componentă helper pentru formulare dinamice de produse
   - Generează formulare cu câmpuri specifice categoriei
   - Reutilizabilă în AdminPage și alte componente

5. **[src/ui/pages/AdminPage.jsx](frontend/src/ui/pages/AdminPage.jsx)**
   - Importat ProductFormHelper
   - Actualizate categoriile și constantele
   - Adăugați atributele hardware în stări

## Cum să pornești

### Backend

```bash
cd backend

# Instalează dependențe (dacă nu sunt instalate)
npm install

# Sincronizează baza de date și populate cu produse
node scripts/seed-hardware-products.js

# Pornește serverul
npm start
```

### Frontend

```bash
cd frontend

# Instalează dependențe (dacă nu sunt instalate)
npm install

# Pornește dev server
npm run dev
```

## Cum să testezi

### 1. Vizualizare Catalog
- Accesează `http://localhost:5173/catalog`
- Ar trebui să vezi 4 butoane de categorie: Firewall, Router, Camera, NAS
- Fiecare categorie ar trebui să arate 5 produse
- Filtrele ar trebui să se schimbe în funcție de categoria selectată

### 2. Filtrare de Produse
- Selectează o categorie
- Observe filtrele care apar (diferite pentru fiecare categorie)
- Filtrele ar trebui să funcționeze dinamic

### 3. Admin Panel
- Autentifică-te cu contul de admin
- Accesează `/admin`
- În secțiunea "Creare produs":
  - Selectează o categorie
  - Observe câmpurile care apar pentru acea categorie
  - Completează formularul și creeaza un produs nou
  - Produsul ar trebui să apară în catalog

### 4. Export de Produse
- În Admin Panel, secțiunea "Export produse (CSV)"
- Filtrele ar trebui să funcționeze corect
- Export-ul ar trebui să includă toți atributele hardware

### 5. Edit și Delete
- În Catalog, pentru admin, butoanele "Editează" și "Șterge" ar trebui să apară
- Editarea ar trebui să arate câmpurile specifice categoriei
- Delete ar trebui să șteargă produsul

## Produse seed

Scriptul de seed-are populează baza de date cu:

**Firewall (5 produse):**
- Fortinet FortiGate 100D
- Fortinet FortiGate 60F
- Cisco Firepower 2130
- Cisco Firepower 1150
- Palo Alto Networks PA-3220

**Router (5 produse):**
- ASUS AXE300 WiFi 6E Router
- ASUS RT-AXE7800 Dual Band Router
- TP-Link Archer AXE200 WiFi 6E
- TP-Link Archer AX6000
- Netgear Nighthawk WiFi 6E Router

**Cameră de supraveghere (5 produse):**
- Hikvision DS-2CD2143G2-I 4MP
- Hikvision DS-2CD2447G2-L 4MP Turret
- Dahua IPC-HDBW2433E-ZS 4MP
- Uniview IPC322SR-VSP28 2MP
- Axis M3065-V 3MP

**NAS (5 produse):**
- Synology DS920+ 4-Bay
- Synology DS720+ 2-Bay
- QNAP TS-432PX 4-Bay
- QNAP TS-264C2 2-Bay
- Asustor AS6404T 4-Bay

## Note

- Schimbările sunt retrocompatibile cu codul existent
- MenuPage-ul rămâne în codebase și redirecționează la Catalog
- Toate rutele de API acceptă și returnează atributele hardware
- Validarea din backend asigură că doar atributele relevante pentru categorie sunt salvate
