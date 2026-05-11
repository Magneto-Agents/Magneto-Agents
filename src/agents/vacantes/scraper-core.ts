// src/agents/vacantes/scraper-core.ts
// Core scraper logic — usable from CLI and API routes
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export interface ScraperLog {
  time: string;
  msg: string;
  type: 'ok' | 'warn' | 'error' | 'info';
}

export interface ScrapedJob {
  id: string;
  url: string;
  title: string;
  company: string;
  experiencia: string;
  salario: string;
  ubicacion: string;
  descripcion: string;
}

export interface ScraperResult {
  jobs: ScrapedJob[];
  logs: ScraperLog[];
  totalFound: number;
  totalScraped: number;
}

function timestamp(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Ejecuta el scraper de Magneto365.
 * @param limit Cuántas vacantes scrapear (default 5)
 * @param onLog Callback opcional para streaming de logs en tiempo real
 */
export async function runScraper(
  limit: number = 5,
  onLog?: (log: ScraperLog) => void
): Promise<ScraperResult> {
  const logs: ScraperLog[] = [];
  const jobs: ScrapedJob[] = [];

  function log(msg: string, type: ScraperLog['type'] = 'info') {
    const entry: ScraperLog = { time: timestamp(), msg, type };
    logs.push(entry);
    onLog?.(entry);
  }

  log('Iniciando scraper con estrategia de Sitemap...', 'info');

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO',
  });

  const page = await context.newPage();

  try {
    log('Obteniendo lista de URLs desde el Sitemap...', 'info');
    await page.goto('https://sitemaps.magneto365.com/sitemap-jobs.xml', {
      waitUntil: 'domcontentloaded',
    });

    const jobUrls = await page.evaluate(() => {
      const locElements = Array.from(document.querySelectorAll('loc'));
      return locElements
        .map((el) => el.textContent)
        .filter((url) => url !== null) as string[];
    });

    log(`Se encontraron ${jobUrls.length} vacantes activas en el sitemap`, 'ok');

    const urlsToScrape = jobUrls.slice(0, limit);
    log(`Visitando los primeros ${urlsToScrape.length} enlaces...`, 'info');

    for (let i = 0; i < urlsToScrape.length; i++) {
      const url = urlsToScrape[i];
      log(`[${i + 1}/${urlsToScrape.length}] Navegando a: ${url}`, 'info');

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const pageTitle = await page.title();

        const jobData = await page.evaluate((fullTitle) => {
          let title = 'Sin título';
          let company = 'Empresa no detectada';

          const matchCompleto = fullTitle.match(
            /Empleo como (.*?) en (.*?) \| Magneto/
          );
          if (matchCompleto) {
            title = matchCompleto[1].trim();
            company = matchCompleto[2].trim();
          } else {
            const matchCorto = fullTitle.match(
              /Empleo como (.*?) \| Magneto/
            );
            if (matchCorto) {
              title = matchCorto[1].trim();
            } else {
              title = fullTitle.replace('| Magneto', '').trim();
            }
          }

          const htmlText = document.body.innerText;
          const reqKeyword = 'Requisitos para aplicar a la vacante:';
          const reqStart = htmlText.indexOf(reqKeyword);

          let experiencia = 'No especificado';
          let salario = 'No especificado';
          let ubicacion = 'No especificado';
          let descripcion = 'No especificado';

          if (reqStart !== -1) {
            const block = htmlText
              .substring(reqStart)
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean);

            if (block.length > 3) {
              experiencia = block[1];
              salario = block[2];
              ubicacion = block[3];

              const descLines = [];
              for (let i = 5; i < block.length; i++) {
                if (block[i].includes('¡Únete') || block[i].length > 50) {
                  descLines.push(block[i]);
                }
                if (descLines.length > 4) break;
              }
              descripcion = descLines.join('\n');
            }
          }

          return { title, company, experiencia, salario, ubicacion, descripcion };
        }, pageTitle);

        // Extraer ID numérico del final de la URL
        const urlSegments = url.split('-');
        const idStr = urlSegments[urlSegments.length - 1];
        const id = idStr.match(/\d+/)
          ? idStr.replace(/\D/g, '')
          : Date.now().toString();

        const job: ScrapedJob = { id, url, ...jobData };
        jobs.push(job);

        log(
          `Extraído: [ID: ${id}] ${jobData.title} | ${jobData.company} | Salario: ${jobData.salario}`,
          'ok'
        );

        // Pausa humana
        await page.waitForTimeout(2000);
      } catch (error: any) {
        log(`Error al cargar vacante: ${error.message}`, 'error');
      }
    }

    // Guardar resultados en data/vacantes.json
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const filePath = path.join(dataDir, 'vacantes.json');
    fs.writeFileSync(filePath, JSON.stringify(jobs, null, 2), 'utf-8');

    log(
      `Proceso terminado. ${jobs.length} vacantes guardadas en vacantes.json`,
      'ok'
    );

    return {
      jobs,
      logs,
      totalFound: jobUrls.length,
      totalScraped: jobs.length,
    };
  } catch (error: any) {
    log(`Error general del scraper: ${error.message}`, 'error');
    return { jobs, logs, totalFound: 0, totalScraped: jobs.length };
  } finally {
    await browser.close();
  }
}
