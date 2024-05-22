import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import getConfig from '../config/configuration';

@Injectable()
export class DeliveryCertificate {
  constructor(private httpService: HttpService) {}

  async htmlContent(assets, person, responsible, location) {
    const { name: nameResponsible, lastName: lastNameResponsible } = responsible;
    const { name: namePerson, lastName, charge } = person;
    let cargo
    try {
      const res = await this.httpService.get(`${getConfig().api_personal}api/charge/${charge}`).toPromise()
      cargo = res.data
    } catch (error) {
      throw error.response?.data
    }
    const length = assets?.asset?.length ?? assets.length;

    const generateAssetRows = (assets.asset ? assets.asset : assets).map(
      (asset) => {
        const { name } = asset.assetId? asset.assetId: asset.name;
        const position = cargo.name;
        const { price } = asset.assetId ? asset.assetId.informationCountable : asset.informationCountable;
        const { name: locationName } = location;
        const date = asset.date.toISOString().split('T')[0];
        return `
      <tr>
        <td>${name}</td>
        <td>${asset.observation}</td>
        <td>${position}</td>
        <td>${locationName}</td>
        <td>${price}</td>
        <td>${date}</td>
      </tr>
    `;
      },
    );

    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acta de Entrega de Activo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ccc;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 28px;
            margin: 0;
        }

        .header p {
            font-size: 16px;
            margin: 0;
        }

        .table-container {
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: left;
        }

        th {
            background-color: #f2f2f2;
        }

        .signature {
            margin-top: 40px;
            text-align: center;
        }

        .signature p {
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Acta de Entrega de Activo</h1>
        </div>

        <div class="table-container">
            <table>
                <tr>
                    <th>Activo</th>
                    <th>Descripción</th>
                    <th>Cargo</th>
                    <th>Ubicación</th>
                    <th>Valor Unitario</th>
                    <th>Fecha de Entrega</th>
                </tr>

                ${generateAssetRows.join('') }
                
                <tr>
                  <td colspan="3"><b> Total de activos asignados ${length} </b></td>
                </tr>
                
            </table>
        </div>

        <div class="signature">
            <p>___________________________</p>
            <p>Firma del entregador ${nameResponsible} ${lastNameResponsible}</p>
        </div>

        <div class="signature">
            <p>___________________________</p>
            <p>Firma del receptor ${namePerson} ${lastName}</p>
        </div>
    </div>
</body>
</html>

`;
    return htmlContent;
  }
}
