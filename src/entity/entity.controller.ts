import { Controller, InternalServerErrorException, Get, Post, Request, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EntityService } from './entity.service';
import { EntityTable } from './entity.entity';
import { success } from '../lib/response';

@Controller('entity')
export class EntityController {

  constructor(private readonly entityService: EntityService) { }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('reEvaluate')
  async reEvaluateWebsitePages(@Request() req: any): Promise<any> {
    const entityId = req.body.entityId;
    const option = req.body.option;

    return success(await this.entityService.addPagesToEvaluate(entityId, option));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('all')
  async getAllEntities(): Promise<any> {
    return success(await this.entityService.findAll());
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('info/:entityId')
  async getEntityInfo(@Param('entityId') entityId: number): Promise<any> {
    return success(await this.entityService.findInfo(entityId));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('create')
  async createEntity(@Request() req: any): Promise<any> {
    const entity = new EntityTable();
    entity.Short_Name = req.body.shortName;
    entity.Long_Name = req.body.longName;
    entity.Creation_Date = new Date();

    const websites = JSON.parse(req.body.websites);

    const createSuccess = await this.entityService.createOne(entity, websites);
    if (!createSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('update')
  async updateEntity(@Request() req: any): Promise<any> {
    const entityId = req.body.entityId;
    const shortName = req.body.shortName;
    const longName = req.body.longName;

    const defaultWebsites = JSON.parse(req.body.defaultWebsites);
    const websites = JSON.parse(req.body.websites);

    const updateSuccess = await this.entityService.update(entityId, shortName, longName, websites, defaultWebsites);
    if (!updateSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Post('delete')
  async deleteEntity(@Request() req: any): Promise<any> {
    const entityId = req.body.entityId;

    const deleteSuccess = await this.entityService.delete(entityId);
    if (!deleteSuccess) {
      throw new InternalServerErrorException();
    }

    return success(true);
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('exists/shortName/:shortName')
  async checkIfShortNameExists(@Param('shortName') shortName: string): Promise<any> {
    return success(!!await this.entityService.findByShortName(shortName));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('exists/longName/:longName')
  async checkIfLongNameExists(@Param('longName') longName: string): Promise<any> {
    return success(!!await this.entityService.findByLongName(longName));
  }

  @UseGuards(AuthGuard('jwt-admin'))
  @Get('websites/:entity')
  async getListOfEntityWebsites(@Param('entity') entity: string): Promise<any> {
    return success(await this.entityService.findAllWebsites(entity));
  }
}
