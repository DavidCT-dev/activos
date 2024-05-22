import { HttpException, Injectable } from '@nestjs/common';
import { CreateGetUfvDto } from './dto/create-get-ufv.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ufv, UfvDocument } from './schema/ufvs.schema';
import { FilterQuery, Model } from 'mongoose';
import puppeteer from 'puppeteer';
import { Cron } from '@nestjs/schedule';
import { FindUfvDto } from './dto/find-ufv.dto';
import { FilterUfvDto } from './dto/filter.ufv.dto';

@Injectable()
export class GetUfvService {

  constructor(@InjectModel(Ufv.name) private ufvModel: Model<UfvDocument>) {}

  async getUfvFromBcb(createGetUfvDto: CreateGetUfvDto) {
   
    const { dateInitial, dateCurrent } = createGetUfvDto;
    const formatedDate = await this.formatDate(new Date(dateInitial))
    const formatedDateCurrent = await this.formatDate(dateCurrent);
    
    const browser = await puppeteer.launch({
      headless: true,
      // executablePath: '/usr/bin/chromium',
      // args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    await page.goto(
      'https://www.bcb.gob.bo/?q=servicios/ufv/datos_estadisticos',
    );

    await page.waitForSelector('#combos1_5');
    await page.select('#combos1_5', '4');
    await page.click('.form-button');

    const frame = page.frames().find((frame) => frame.name() === 'indiframe');
    await frame.waitForSelector('#sdd');
    await frame.select('#sdd', `${formatedDate.day}`);
    await frame.waitForSelector('#smm');
    await frame.select('#smm', `${formatedDate.month}`);
    await frame.waitForSelector('#saa');
    await frame.select('#saa', `${formatedDate.year}`);

    await frame.waitForSelector('#edd');
    await frame.select('#edd', `${formatedDateCurrent.day}`);
    await frame.waitForSelector('#emm');
    await frame.select('#emm', `${formatedDateCurrent.month}`);
    await frame.waitForSelector('#eaa');
    await frame.select('#eaa', `${formatedDateCurrent.year}`);

    await frame.click('input[type="submit"]');

    await frame.waitForSelector('table.tablaborde tr');
    const rows = await frame.$$('table.tablaborde tr');

    const creationPromises = [];
    for (let i = 1; i < rows.length; i++) {
      const columns = await rows[i].$$('td');
      const fecha = await columns[1].$eval('div', (div) => div.innerText);
      const valorUFV = parseFloat((await columns[2].$eval('div', (div) => div.innerText)).replace(',','.',));

      const [dia, _, mesTexto, año] = fecha.split(' ');
      const meses = new Map([
        ['Enero', '01'],
        ['Febrero', '02'],
        ['Marzo', '03'],
        ['Abril', '04'],
        ['Mayo', '05'],
        ['Junio', '06'],
        ['Julio', '07'],
        ['Agosto', '08'],
        ['Septiembre', '09'],
        ['Octubre', '10'],
        ['Noviembre', '11'],
        ['Diciembre', '12'],
      ]);
      const mes = meses.get(mesTexto);

      const diaFormateado = dia.padStart(2, '0');
      const mesFormateado = mes.padStart(2, '0');

      const dateFormated = `${año}-${mesFormateado}-${diaFormateado}`;
      const existingUfv = await this.ufvModel.findOne({ fecha: dateFormated });
      if (!existingUfv) {
        const creationPromise = this.ufvModel.create({ fecha: dateFormated, ufv: valorUFV });
        creationPromises.push(creationPromise);     
      }
    }
    
    const data = await Promise.all(creationPromises);
    await browser.close();
    return data;
  }


  async findAll(params?: FilterUfvDto){
    const filters: FilterQuery<Ufv> = {};
    const { page,limit } = params;
    const pageSize= limit || 10;
    if (limit<=0){
      throw new HttpException(
        'El valor de la cantidad de paginas no es válido. Debe ser mayor que 0.',
        400,
      );
    }
    if (page<=0){
      throw new HttpException(
        'El valor de la página no es válido. Debe ser mayor que 0.',
        400,
      );
    }
    const countQuery= this.ufvModel.find(filters);
    const totalUFv = await  this.ufvModel.countDocuments({});
    const totalUfvs= await countQuery.countDocuments();
    const totalPages=Math.ceil(totalUfvs/pageSize);
    const skip=(page - 1)*pageSize || 0;
    const [ufvs] = await Promise.all([
      this.ufvModel
        .find(filters)
        .sort({ _id: -1 })
        .limit(limit)
        .skip(skip) 
        .exec(),
    ]);
    if (ufvs.length > 0) {    
      return  {totalUFv,totalPages,ufvs}
  } else {
    return { message: 'No se encontraron ufvs que coincidan con la búsqueda.' };
  }
  }

  @Cron('0 3 * * *')
  async ExtractUfvCurrent() {
    const browser = await puppeteer.launch({
      // headless:false,
      // executablePath: '/usr/bin/chromium',
      // args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://www.bcb.gob.bo/');

    const value = await page.evaluate(() => {
      const element = document.querySelector(
        '.col-md-24 .col-lg-5 .f3-con > div > div:nth-child(3) strong',
      );
      return element ? element.textContent.trim().split('\u00A0')[0] : null;
    });
    
    if (value == null) {
      throw new HttpException('ufv actual no encotrada', 404);
    }
    const ufvNumber = parseFloat(value.match(/[\d.,]+/)[0].replace(',', '.'));

    const dateFull = new Date()
    const date = dateFull.toISOString().split("T")[0];
    
    const existingUfv = await this.ufvModel.findOne({ fecha: date });
    
    if (!existingUfv) {
      await this.ufvModel.create({ fecha: date, ufv: ufvNumber });  
    }
    await browser.close();
    return ufvNumber;
  }

  async formatDate(date) {
    const formattedDate = new Date(date);
    const day = formattedDate.getDate() + 1;  // en el servidor borrar +1
    const month = formattedDate.getMonth() + 1;
    const year = formattedDate.getFullYear();
    return { day, month, year };
  }

  async findDate(findUfvDto:FindUfvDto){
    const{dateFromUFV} = findUfvDto

    const findUfvCurrent= await this.ufvModel.findOne({fecha:dateFromUFV})
    
    if(!findUfvCurrent){
      throw new HttpException('no se encontro la UFV actual', 404)
    }
    return findUfvCurrent;
  }
}
