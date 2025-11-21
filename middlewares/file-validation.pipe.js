const { BadRequestException } = require('./exceptions');

class FileValidationPipe {
  static validateCSV(file, options = {}) {
    const {
      maxSize = 2 * 1024 * 1024, 
      allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel']
    } = options;

   
    if (!file) {
      throw new BadRequestException('Fișierul este obligatoriu');
    }

   
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipul fișierului trebuie să fie CSV');
    }

  
    if (file.size > maxSize) {
      throw new BadRequestException(`Fișierul nu poate depăși ${maxSize / 1024 / 1024}MB`);
    }

 
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Fișierul trebuie să aibă extensia .csv');
    }

    return true;
  }
}

module.exports = FileValidationPipe;