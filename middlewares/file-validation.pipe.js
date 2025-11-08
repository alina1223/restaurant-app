const { BadRequestException } = require('./exceptions');

class FileValidationPipe {
  static validateCSV(file, options = {}) {
    const {
      maxSize = 2 * 1024 * 1024, // 2MB default
      allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel']
    } = options;

    // Verifică existența fișierului
    if (!file) {
      throw new BadRequestException('Fișierul este obligatoriu');
    }

    // Verifică tipul MIME
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipul fișierului trebuie să fie CSV');
    }

    // Verifică dimensiunea
    if (file.size > maxSize) {
      throw new BadRequestException(`Fișierul nu poate depăși ${maxSize / 1024 / 1024}MB`);
    }

    // Verifică extensia
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Fișierul trebuie să aibă extensia .csv');
    }

    return true;
  }
}

module.exports = FileValidationPipe;