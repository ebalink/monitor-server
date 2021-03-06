import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository, getManager } from 'typeorm';
import { EntityTable } from './entity.entity';
import { Website } from '../website/website.entity';

@Injectable()
export class EntityService {

  constructor(
    @InjectRepository(EntityTable)
    private readonly entityRepository: Repository<EntityTable>,
    private readonly connection: Connection
  ) {}

  async addPagesToEvaluate(entityId: number, option: string): Promise<boolean> {
    const pages = await this.entityRepository.query(`
      SELECT
        p.PageId, 
        p.Uri
      FROM
        Website as w,
        Domain as d,
        DomainPage as dp,
        Page as p
      WHERE
        w.EntityId = ? AND
        d.WebsiteId = w.WebsiteId AND
        d.Active = 1 AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ?
    `, [entityId, option === 'all' ? '1__' : '1_1']);

    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    
    await queryRunner.startTransaction();

    let error = false;
    try {
      for (const page of pages || []) {
        await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?)`, [page.PageId, page.Uri, '10', new Date()]);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      console.log(err);
      error = true;
    } finally {
      await queryRunner.release();
    }

    return !error;
  }

  async findAll(): Promise<any> {
    const manager = getManager();
    const entities = await manager.query(`SELECT e.*, COUNT(distinct w.WebsiteId) as Websites 
      FROM 
        Entity as e 
        LEFT OUTER JOIN Website as w ON w.EntityId = e.EntityId
      GROUP BY e.EntityId`);
    return entities;
  }

  async findInfo(entityId: number): Promise<any> {
    const entity = await this.entityRepository.findOne({ where: { EntityId: entityId } });

    if (entity) {
      entity['websites'] = await this.entityRepository.query(`SELECT * FROM Website WHERE EntityId = ?`, [entityId]);
      return entity;
    } else {
      throw new InternalServerErrorException();
    }
  }

  async findByShortName(shortName: string): Promise<any> {
    return this.entityRepository.findOne({ where: { Short_Name: shortName } });
  }

  async findByLongName(longName: string): Promise<any> {
    return this.entityRepository.findOne({ where: { Long_Name: longName } });
  }

  async findAllWebsites(entity: string): Promise<any> {
    const manager = getManager();

    const websites = await manager.query(`SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User 
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId,
        Entity as e
      WHERE
        e.EntityId = w.EntityId AND
        LOWER(e.Long_Name) = ?
      GROUP BY w.WebsiteId`, [entity.toLowerCase()]);

    return websites;
  }

  async createOne(entity: EntityTable, websites: string[]): Promise<boolean> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      const insertEntity = await queryRunner.manager.save(entity);

      for (const websiteId of websites || []) {
        await queryRunner.manager.update(Website, { WebsiteId: websiteId }, { EntityId: insertEntity.EntityId });
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async update(entityId: number, shortName: string, longName: string, websites: number[], defaultWebsites: number[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(EntityTable, { EntityId: entityId }, { Short_Name: shortName, Long_Name: longName });

      for (const id of defaultWebsites || []) {
        if (!websites.includes(id)) {
          await queryRunner.manager.query(`UPDATE Website SET EntityId = NULL WHERE WebsiteId = ?`, [id]);
        }
      }
  
      for (const id of websites || []) {
        if (!defaultWebsites.includes(id)) {
          await queryRunner.manager.query(`UPDATE Website SET EntityId = ? WHERE WebsiteId = ?`, [entityId, id]);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }

  async delete(entityId: number): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let hasError = false;
    try {
      await queryRunner.manager.update(Website, { EntityId: entityId }, { EntityId: null });

      await queryRunner.manager.delete(EntityTable, { where: { EntityId: entityId } });

      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction();
      hasError = true;
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release();
    }

    return !hasError;
  }
}
