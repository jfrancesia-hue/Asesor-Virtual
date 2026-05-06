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
        margin: { top: '25mm', right: '20mm', bottom: '32mm', left: '20mm' },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size:9px; color:#666; width:100%; text-align:center; padding-top:5px;">
            ${this.escapeHtml(title)}
          </div>`,
        footerTemplate: `
          <div style="font-size:8px; color:#666; width:100%; padding: 0 20mm 4mm 20mm; line-height:1.4;">
            <div style="border-top:1px solid #ccc; padding-top:4px; display:flex; justify-content:space-between;">
              <span><strong>Documento generado por inteligencia artificial.</strong> No constituye asesoramiento legal. Antes de firmar, recomendamos revisión por un abogado matriculado en su jurisdicción.</span>
            </div>
            <div style="text-align:center; margin-top:2px; color:#999;">
              TuAsesor — Página <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>
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

  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private wrapContractHtml(content: string, title: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(title)}</title>
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
    .ai-disclaimer {
      margin-top: 40px;
      padding: 14px 18px;
      border: 1px solid #c1121f;
      border-left: 4px solid #c1121f;
      background: #fdf4f5;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a1a;
      page-break-inside: avoid;
    }
    .ai-disclaimer strong { color: #c1121f; }
  </style>
</head>
<body>
  <div class="contract-wrapper">
    ${content}
    <div class="ai-disclaimer">
      <strong>AVISO IMPORTANTE — DOCUMENTO GENERADO POR INTELIGENCIA ARTIFICIAL</strong><br>
      Este documento fue producido por un modelo de IA generativa de TuAsesor. No constituye asesoramiento legal ni opinión profesional. Antes de firmar, presentar ante una autoridad o utilizarlo en cualquier acto con efectos jurídicos, debe ser revisado por un abogado matriculado en su jurisdicción. TuAsesor no se responsabiliza por daños derivados del uso del documento sin verificación profesional.
    </div>
  </div>
  <div class="watermark">TuAsesor — Generado con IA</div>
</body>
</html>`;
  }
}
