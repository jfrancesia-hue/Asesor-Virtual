import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generatePdf(htmlContent: string, title: string): Promise<Buffer> {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      });

      const page = await browser.newPage();
      const fullHtml = this.wrapContractHtml(htmlContent, title);
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size:9px; color:#666; width:100%; text-align:center; padding-top:5px;">
            ${title}
          </div>`,
        footerTemplate: `
          <div style="font-size:9px; color:#666; width:100%; text-align:center; padding-bottom:5px;">
            Generado por Asesor Virtual — <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>`,
      });

      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error('PDF generation failed', error.message);
      throw error;
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  }

  private wrapContractHtml(content: string, title: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }
    .contract-wrapper {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { font-size: 18pt; text-align: center; margin-bottom: 20px; text-transform: uppercase; }
    h2 { font-size: 14pt; margin: 20px 0 10px; }
    h3 { font-size: 12pt; margin: 15px 0 8px; }
    p { margin-bottom: 10px; text-align: justify; }
    .parties-section {
      border: 1px solid #ddd;
      padding: 15px;
      margin: 20px 0;
      background: #f9f9f9;
    }
    .clause {
      margin-bottom: 15px;
      padding-left: 15px;
    }
    .clause-title { font-weight: bold; margin-bottom: 5px; }
    .signature-section {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature-block {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-bottom: 5px;
      padding-top: 5px;
    }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td, th { border: 1px solid #ddd; padding: 8px; }
    th { background: #f5f5f5; font-weight: bold; }
    .watermark {
      position: fixed;
      bottom: 40px;
      right: 20px;
      font-size: 8pt;
      color: #ccc;
    }
  </style>
</head>
<body>
  <div class="contract-wrapper">
    ${content}
  </div>
  <div class="watermark">Asesor Virtual — Generado con IA</div>
</body>
</html>`;
  }
}
