const csv = require('csv-parser');
const { Readable } = require('stream');
const { validationResult } = require('express-validator');
const createProductDto = require('../products/dto/create-product.dto');

class CSVProcessorService {
  static parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer.toString());
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(new Error('Eroare la parsarea CSV: ' + error.message)));
    });
  }

  static async validateProductData(productData) {
    const validatedProducts = [];
    const errors = [];

    for (let i = 0; i < productData.length; i++) {
      const row = productData[i];
      const rowNumber = i + 2; 

      try {
   
        const expectedColumns = ['name', 'price', 'description', 'stock', 'category'];
        const actualColumns = Object.keys(row);
        
        if (actualColumns.length !== expectedColumns.length) {
          errors.push({
            row: rowNumber,
            error: `Număr incorect de coloane. Așteptat: ${expectedColumns.length}, primit: ${actualColumns.length}`
          });
          continue;
        }

        
        const mockRequest = {
          body: {
            name: row.name,
            price: parseFloat(row.price),
            description: row.description,
            stock: parseInt(row.stock),
            category: row.category
          }
        };

        const mockResponse = {
          status: () => ({
            json: () => {}
          })
        };

       
        await Promise.all(
          createProductDto.map(validation => validation(mockRequest, mockResponse, () => {}))
        );

        const validationErrors = validationResult(mockRequest);
        if (!validationErrors.isEmpty()) {
          errors.push({
            row: rowNumber,
            error: `Erori de validare: ${validationErrors.array().map(err => `${err.param}: ${err.msg}`).join(', ')}`,
            data: row
          });
          continue;
        }

       
        validatedProducts.push({
          name: row.name,
          price: parseFloat(row.price),
          description: row.description,
          stock: parseInt(row.stock),
          category: row.category
        });

      } catch (error) {
        errors.push({
          row: rowNumber,
          error: `Eroare la procesarea rândului: ${error.message}`,
          data: row
        });
      }
    }

    return { validatedProducts, errors };
  }

  static generateCSV(products) {
    const headers = ['id', 'name', 'price', 'description', 'stock', 'category'];
    let csvContent = headers.join(',') + '\n';
    
    products.forEach(product => {
      const row = headers.map(header => {
        let value = product[header];

        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
  }
}

module.exports = CSVProcessorService;