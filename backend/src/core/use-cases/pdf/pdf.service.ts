import { Injectable } from '@nestjs/common';
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  async generateInvoicePdf(invoiceData: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Add Header
        doc.fontSize(20).text('HOA DON TIEN PHONG', { align: 'center' });
        doc.moveDown();

        // Add details
        doc.fontSize(12)
           .text(`Ma hoa don: ${invoiceData.invoiceNumber}`)
           .text(`Phong: ${invoiceData.contract.room.roomNumber}`)
           .text(`Nguoi thue: ${invoiceData.contract.tenant.name}`);
        doc.moveDown();

        doc.text(`Ngay den han: ${new Date(invoiceData.dueDate).toLocaleDateString('vi-VN')}`)
           .text(`Trang thai: ${invoiceData.status}`);
        doc.moveDown();

        doc.fontSize(16).text(`Tong cong: ${invoiceData.amount.toString()} VND`, { align: 'right' });
        doc.moveDown(2);

        // Fetch VietQR and draw it if landlord has bank info
        const addQr = async () => {
          const { landlord, amount, invoiceNumber } = invoiceData;
          if (landlord.bankName && landlord.bankAccountNumber) {
            try {
              const accountName = landlord.bankAccountName ? `&accountName=${encodeURIComponent(landlord.bankAccountName)}` : '';
              const addInfo = encodeURIComponent(`Thanh toan hoa don ${invoiceNumber}`);
              const qrUrl = `https://img.vietqr.io/image/${landlord.bankName}-${landlord.bankAccountNumber}-compact2.jpg?amount=${amount}&addInfo=${addInfo}${accountName}`;
              
              const qrResponse = await fetch(qrUrl);
              const arrayBuffer = await qrResponse.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              
              doc.fontSize(12).text('Quet ma QR de thanh toan:', { align: 'center' });
              doc.moveDown();
              doc.image(buffer, {
                fit: [250, 250],
                align: 'center',
                valign: 'center'
              });
            } catch (err) {
              console.error('Failed to generate VietQR:', err);
            }
          }
        };

        addQr().then(() => doc.end());
      } catch (err) {
        reject(err);
      }
    });
  }
}
