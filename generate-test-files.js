const fs = require('fs');
const path = require('path');

const testDir = './test-csv-files';
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

const validCSV = `name,price,description,stock,category
Pizza Margherita,250,Pizza clasica cu mozzarella si busuioc,20,Pizza
Burger Classic,200,Burger cu carne vita si branza cheddar,15,Burger
Salata Caesar,180,Salata cu pui, crutoane si sos caesar,25,Salată
Paste Carbonara,220,Paste cu sos cremos, bacon si parmezan,18,Paste
Limonada,15,Bautura racoritoare cu lamaie si menta,50,Băutură
Tiramisu,120,Desert italian cu mascarpone si cafea,30,Desert`;

const invalidCSV = `name,price,description,stock,category
Pizza Prosciutto,280,Pizza cu sunca si ciuperci,22,Pizza
Suc Portocale,-25,Pret negativ - INVALID,40,Băutură
Salata Greceasca,160,,35,Salată
Burger Vegetarian,190,Burger cu legume si halloumi,12,Burger
Cappuccino,,Bautura fara pret - INVALID,60,Băutură`;

const textFile = `Acesta este un fisier text invalid
Nu are format CSV corect
Nume, Pret, Descriere
Produs Test, 100, Descriere test`;

const exportDataCSV = `name,price,description,stock,category
Pizza Quattro Formaggi,320,Pizza cu 4 tipuri de branza,15,Pizza
Pizza Diavola,290,Pizza picanta cu salam,18,Pizza
Burger BBQ,230,Burger cu sos barbecue si ceapa caramelizata,20,Burger
Burger Crispy,210,Burger cu pui crispy si sos special,25,Burger
Salata Tonno,170,Salata cu ton si masline,30,Salată
Salata Mediteraneana,190,Salata cu falafel si hummus,22,Salată
Paste Alfredo,240,Paste cu sos cremos de parmezan,16,Paste
Lasagna,260,Lasagna cu carne si sos bechamel,14,Paste
Cola,12,Bautura carbogazoasa,100,Băutură
Apa Minerala,8,Apa plata naturala,150,Băutură
Cheesecake,140,Desert cu branza si fructe de padure,40,Desert
Brownie,110,Brownie cu ciocolata si alune,35,Desert`;

let largeCSV = 'name,price,description,stock,category\n';
for (let i = 0; i < 10000; i++) {
  largeCSV += `Product${i},${100 + (i % 300)},Description for product ${i},${i % 100},${['Pizza', 'Burger', 'Salată', 'Paste', 'Băutură', 'Desert'][i % 6]}\n`;
}

fs.writeFileSync(path.join(testDir, 'import-valid.csv'), validCSV);
fs.writeFileSync(path.join(testDir, 'import-invalid-5-rows.csv'), invalidCSV);
fs.writeFileSync(path.join(testDir, 'import-invalid.txt'), textFile);
fs.writeFileSync(path.join(testDir, 'export-test-data.csv'), exportDataCSV);
fs.writeFileSync(path.join(testDir, 'import-large-2mb.csv'), largeCSV);

console.log('✅ Toate fișierele de test au fost create:');
console.log('📁 test-csv-files/');
console.log('   ├── import-valid.csv           - Pentru import valid');
console.log('   ├── import-invalid-5-rows.csv  - 5 rânduri (3✓ + 2✗)');
console.log('   ├── import-invalid.txt         - Fișier .txt invalid');
console.log('   ├── import-large-2mb.csv       - Fișier >2MB');
console.log('   └── export-test-data.csv       - Date pentru export cu filtre');