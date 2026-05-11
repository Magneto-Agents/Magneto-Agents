import asyncio
import json
import os
import re
from datetime import datetime
from playwright.async_api import async_playwright

def timestamp():
    return datetime.now().strftime("%H:%M")

class VacantesScraper:
    def __init__(self, limit=5):
        self.limit = limit
        self.jobs = []
        self.logs = []
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_dir = os.path.join(base_dir, 'data')

    def log(self, msg, log_type='info'):
        entry = {"time": timestamp(), "msg": msg, "type": log_type}
        self.logs.append(entry)
        print(f"[{entry['time']}] {log_type.upper()}: {msg}")

    async def run(self):
        self.log(f"Iniciando scraper...", "info")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                locale='es-CO'
            )
            page = await context.new_page()
            try:
                await page.goto('https://sitemaps.magneto365.com/sitemap-jobs.xml', wait_until='domcontentloaded')
                job_urls = await page.evaluate("""() => {
                    const locElements = Array.from(document.querySelectorAll('loc'));
                    return locElements.map((el) => el.textContent).filter((url) => url !== null);
                }""")
                self.log(f"Encontradas {len(job_urls)} vacantes", "ok")
                urls_to_scrape = job_urls[:self.limit]
                for i, url in enumerate(urls_to_scrape):
                    try:
                        await page.goto(url, wait_until='domcontentloaded', timeout=15000)
                        page_title = await page.title()
                        job_data = await page.evaluate(r"""(fullTitle) => {
                            let title = 'Sin título', company = 'Empresa no detectada';
                            const matchCompleto = fullTitle.match(/Empleo como (.*?) en (.*?) \| Magneto/);
                            if (matchCompleto) {
                                title = matchCompleto[1].trim(); company = matchCompleto[2].trim();
                            } else {
                                const matchCorto = fullTitle.match(/Empleo como (.*?) \| Magneto/);
                                if (matchCorto) title = matchCorto[1].trim();
                                else title = fullTitle.replace('| Magneto', '').trim();
                            }
                            const htmlText = document.body.innerText;
                            const reqKeyword = 'Requisitos para aplicar a la vacante:';
                            const reqStart = htmlText.indexOf(reqKeyword);
                            let experiencia = 'No especificado', salario = 'No especificado', ubicacion = 'No especificado', descripcion = 'No especificado';
                            if (reqStart !== -1) {
                                const block = htmlText.substring(reqStart).split('\n').map((s) => s.trim()).filter(Boolean);
                                if (block.length > 3) {
                                    experiencia = block[1]; salario = block[2]; ubicacion = block[3];
                                    const descLines = [];
                                    for (let i = 5; i < block.length; i++) {
                                        if (block[i].includes('¡Únete') || block[i].length > 50) descLines.push(block[i]);
                                        if (descLines.length > 4) break;
                                    }
                                    descripcion = descLines.join('\n');
                                }
                            }
                            return { title, company, experiencia, salario, ubicacion, descripcion };
                        }""", page_title)
                        url_segments = url.split('-')
                        id_str = url_segments[-1]
                        match_id = re.search(r'\d+', id_str)
                        job_id = match_id.group(0) if match_id else str(int(datetime.now().timestamp()))
                        job = {"id": job_id, "url": url, **job_data}
                        self.jobs.append(job)
                        self.log(f"Extraído: [ID: {job_id}] {job_data['title']}", "ok")
                        await asyncio.sleep(2)
                    except Exception as e:
                        self.log(f"Error: {str(e)}", "error")
                if not os.path.exists(self.data_dir): os.makedirs(self.data_dir)
                with open(os.path.join(self.data_dir, 'vacantes.json'), 'w', encoding='utf-8') as f:
                    json.dump(self.jobs, f, ensure_ascii=False, indent=2)
                return {"jobs": self.jobs, "logs": self.logs, "totalFound": len(job_urls), "totalScraped": len(self.jobs)}
            except Exception as e:
                self.log(f"Error general: {str(e)}", "error")
                return {"jobs": self.jobs, "logs": self.logs, "totalFound": 0, "totalScraped": len(self.jobs)}
            finally:
                await browser.close()

if __name__ == "__main__":
    scraper = VacantesScraper(limit=3)
    asyncio.run(scraper.run())
