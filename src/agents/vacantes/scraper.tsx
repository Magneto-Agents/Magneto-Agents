
import { chromium, Page } from 'playwright';

async function scrapeJobs() {
  console.log("Iniciando scraper con estrategia de Sitemap...");

  // 1. Lanzamos el navegador viéndolo en pantalla para depurar
  const browser = await chromium.launch({ headless: true });
  
  // 2. Aplicamos un "Disfraz" (User-Agent de un humano común)
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO', // Simulamos que estamos en Colombia
  });

  const page = await context.newPage();

  try {
    // 3. Vamos al Sitemap que vimos que está permitido en el robots.txt
    console.log("Obteniendo lista de URLs desde el Sitemap...");
    await page.goto('https://sitemaps.magneto365.com/sitemap-jobs.xml', { waitUntil: 'domcontentloaded' });

    // 4. Extraemos todas las URLs (<loc>) del archivo XML
    const jobUrls = await page.evaluate(() => {
      const locElements = Array.from(document.querySelectorAll('loc'));
      return locElements.map(el => el.textContent).filter(url => url !== null) as string[];
    });

    console.log(`¡Se encontraron ${jobUrls.length} vacantes activas!`);

    // 5. Tomamos solo los primeros 3 para hacer una prueba rápida y no bloquearnos
    const urlsToScrape = jobUrls.slice(0, 3);
    console.log(`\n Visitando los primeros ${urlsToScrape.length} enlaces...\n`);

    const extractedJobs = [];

    for (const url of urlsToScrape) {
      console.log(`Navegando a: ${url}`);
      
      try {
        // Esperamos a que la red esté inactiva o la página haya completado lo básico
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        // El selector de 'h1' está fallando (probablemente el framework frontend carga el HTML de forma asíncrona o no usa h1)
        // Extraemos los datos usando el título de la página (document.title), que SIEMPRE está presente
        const pageTitle = await page.title();
        
        const jobData = await page.evaluate((fullTitle) => {
          let title = 'Sin título';
          let company = 'Empresa no detectada';
          
          // Magneto suele usar el formato: "Empleo como [Cargo] en [Empresa] | Magneto" o "[Cargo] | Magneto"
          const matchCompleto = fullTitle.match(/Empleo como (.*?) en (.*?) \| Magneto/);
          if (matchCompleto) {
            title = matchCompleto[1].trim();
            company = matchCompleto[2].trim();
          } else {
            const matchCorto = fullTitle.match(/Empleo como (.*?) \| Magneto/);
            if (matchCorto) {
              title = matchCorto[1].trim();
            } else {
              // Si no coincide con el formato, intentamos limpiar el title
              title = fullTitle.replace('| Magneto', '').trim();
            }
          }
          
          // Extraemos información adicional usando el innerText estructurado de la página
          const htmlText = document.body.innerText;
          const reqKeyword = "Requisitos para aplicar a la vacante:";
          const reqStart = htmlText.indexOf(reqKeyword);
          
          let experiencia = 'No especificado';
          let salario = 'No especificado';
          let ubicacion = 'No especificado';
          let descripcion = 'No especificado';

          if (reqStart !== -1) {
            // Partimos el texto que sigue a la palabra clave por saltos de línea y quitamos los vacíos
            const block = htmlText.substring(reqStart).split('\n').map(s => s.trim()).filter(Boolean);
            
            // block[0] = "Requisitos para aplicar a la vacante:"
            // block[1] = Experiencia (ej: "2 años de experiencia, Bachillerato completo")
            // block[2] = Salario (ej: "$ 1.750.000 a $ 2.000.000")
            // block[3] = Ubicación (ej: "Bogotá, D.C.")
            // block[4] = Título repetido
            // block[5]+ = Descripción y palabras clave
            if (block.length > 3) {
              experiencia = block[1];
              salario = block[2];
              ubicacion = block[3];
              
              // Buscamos dónde terminan las "Palabras clave:" si existe
              const descLines = [];
              for (let i = 5; i < block.length; i++) {
                if (block[i].includes('¡Únete') || block[i].length > 50) {
                  // A menudo la descripción de verdad son los párrafos largos
                  descLines.push(block[i]);
                }
                if (descLines.length > 4) break; // Traemos solo unos cuantos párrafos para no saturar
              }
              descripcion = descLines.join('\n');
            }
          }
          
          return { title, company, experiencia, salario, ubicacion, descripcion };
        }, pageTitle);

        // Generamos el ID extrayendo los números finales de la URL (ej: redes-secas-892165 -> 892165)
        const urlSegments = url.split('-');
        const idStr = urlSegments[urlSegments.length - 1];
        const id = idStr.match(/\d+/) ? idStr.replace(/\D/g, '') : Date.now().toString();

        console.log(`   -> Extraído exitosamente: [ID: ${id}] ${jobData.title} | Salario: ${jobData.salario}`);
        extractedJobs.push({ id, url, ...jobData });
        
        // Pausa humana de 2 segundos para no asustar al servidor
        await page.waitForTimeout(2000); 

      } catch (error: any) {
        console.log(`Error al cargar esta vacante: ${error.message}`);
      }
    }

    // 6. Guardamos los resultados en data/vacantes.json
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    const filePath = path.join(dataDir, 'vacantes.json');
    fs.writeFileSync(filePath, JSON.stringify(extractedJobs, null, 2), 'utf-8');

    console.log(`\n Proceso terminado con éxito. ${extractedJobs.length} vacantes guardadas en: ${filePath}`);

  } catch (error) {
    console.error("Hubo un error general:", error);
  } finally {
    await browser.close();
  }
}

// Ejecutamos la función
scrapeJobs();