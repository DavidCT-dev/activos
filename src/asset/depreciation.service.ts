import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Asset, AssetDocument } from './schema/asset.schema';
import { Model } from 'mongoose';
import {
  DepreciationAssetList,
  DepreciationAssetListDocument,
} from 'src/depreciation-asset-list/schema/depreciation-asset';
import { GetUfvService } from 'src/get-ufv/get-ufv.service';
import { Ufv, UfvDocument } from 'src/get-ufv/schema/ufvs.schema';

@Injectable()
export class DepreciationService {
  constructor(
    private httpService: HttpService,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(DepreciationAssetList.name)
    private depreciationAssetListModel: Model<DepreciationAssetListDocument>,
    private ufvService:GetUfvService,
    @InjectModel(Ufv.name) private ufvmodel: Model<UfvDocument>,
  ) {}

  @Cron('30 3 * * *')
  async calculateAndStoreDepreciation(asset = null, dateCurrent = null) {
    if (!asset) {
      // const ufvCurrent = await this.ufvService.ExtractUfvCurrent()
      const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const ufvCurrent = await this.ufvmodel.findOne({ fecha: formattedDate });
    if (!ufvCurrent) {
      throw new HttpException('ufv actual no encontrada',HttpStatus.NOT_FOUND)
    }
      const assets = await this.assetModel.find({});
      
      for (const asset of assets) {
        const elapsedSeconds = this.calculateElapsedSeconds(
          asset.informationCountable.dateAcquisition,dateCurrent
        );
        const lifespan = await this.lifeSpan(asset.typeCategoryAsset);
        const depreciation = this.calculateDepreciationValue(
          asset.informationCountable.price,
          lifespan,
          elapsedSeconds,
        ).toFixed(5);
        asset.depreciatedValue = Number(depreciation);

        const dateFull = new Date(asset.informationCountable.dateAcquisition)

        const date = dateFull.toISOString().split("T")[0];

        const findUfv = await this.ufvmodel.findOne({fecha:date})
        asset.ufv3 = (asset.informationCountable.price*(ufvCurrent.ufv/findUfv.ufv)-asset.informationCountable.price).toFixed(2)
        asset.ufv4 = ((asset.informationCountable.price*(ufvCurrent.ufv/findUfv.ufv)-asset.informationCountable.price)+asset.informationCountable.price).toFixed(2)
        asset.save();
      }
    } else {

      const elapsedSeconds = this.calculateElapsedSeconds(asset.informationCountable.dateAcquisition,dateCurrent);
      const lifespan = await this.lifeSpan(asset.typeCategoryAsset);

      const depreciation = this.calculateDepreciationValue(
        asset.informationCountable.price,
        lifespan,
        elapsedSeconds,
      ).toFixed(5);
      asset.depreciatedValue = Number(depreciation);
      return asset;
    }
  }

  private calculateElapsedSeconds(dateOfAcquisition: Date, dateCurrent): number {
    let currentDate = new Date();
    if(dateCurrent) {
      currentDate = new Date(dateCurrent)
    }else {
      currentDate = new Date()
    }
    dateOfAcquisition = new Date(dateOfAcquisition)
    const elapsedMilliseconds = currentDate.getTime() - dateOfAcquisition.getTime();
    const elapsedSeconds = elapsedMilliseconds / 1000;
    return Math.floor(elapsedSeconds);
  }

  private async lifeSpan(typeCategoryAsset): Promise<number> {
    const findUsefulLife = await this.depreciationAssetListModel.findOne({
      _id: typeCategoryAsset,
    });
    const usefulLifeInYears = findUsefulLife.usefulLife;
    const usefulLifeInSeconds = usefulLifeInYears * 360 * 24 * 60 * 60;
    return usefulLifeInSeconds;
  }

  private calculateDepreciationValue(
    initialValue: number,
    lifespan: number,
    elapsedSeconds: number,
  ): number {
    const remainingSeconds = lifespan - elapsedSeconds;
    const depreciationPerSecond = initialValue / lifespan;
    const depreciation =
      remainingSeconds > 0 ? remainingSeconds * depreciationPerSecond : 0;
    return depreciation;
  }
}
