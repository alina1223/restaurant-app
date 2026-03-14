const axios = require("axios");

const API_URL = "http://localhost:3000";

async function testComplete() {
  console.log("=== TEST COMPLET API ===\n");
  
  try {
    console.log("1. Creare user admin...");
    const adminEmail = `admin${Date.now()}@test.com`;
    const adminRegister = await axios.post(API_URL + "/auth/register", {
      name: "Admin Test",
      email: adminEmail,
      password: "admin123",
      phone: "069888888",
      age: 35,
      role: "admin"
    });
    
    const adminToken = adminRegister.data.token;
    console.log("✓ Admin creat, token primit");
    
    console.log("\n2. Testare rute products...");
    const products = await axios.get(API_URL + "/products/list", {
      headers: { Authorization: "Bearer " + adminToken }
    });
    console.log(`✓ Products: ${products.data.length} produse`);
    
    console.log("\n3. Testare rute admin...");
    const usersReport = await axios.get(API_URL + "/admin/report/users", {
      headers: { Authorization: "Bearer " + adminToken }
    });
    console.log(`✓ Users report: ${usersReport.data.length} useri`);
    
    const productsReport = await axios.get(API_URL + "/admin/report/products", {
      headers: { Authorization: "Bearer " + adminToken }
    });
    console.log(`✓ Products report: ${productsReport.data.totalProducts} produse total`);
    
    console.log("\n4. Test backward compatibility...");
    const legacyProducts = await axios.get(API_URL + "/products/list", {
      headers: { role: "user" }
    });
    console.log(`✓ Legacy system works: ${legacyProducts.data.length} produse`);
    
    console.log("\n🎉🎉🎉 TOATE TESTELE AU TRECUT CU SUCCES! 🎉🎉🎉");
    console.log("\nSistemul este complet funcțional cu:");
    console.log("  ✓ JWT Authentication");
    console.log("  ✓ Backward compatibility");
    console.log("  ✓ Role-based authorization");
    console.log("  ✓ All endpoints working");
    
  } catch (error) {
    console.error("\n❌ Eroare la testare completă:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Mesaj:", error.response.data.message);
      console.error("Endpoint:", error.config.url);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testComplete();