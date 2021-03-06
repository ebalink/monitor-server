"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const website_entity_1 = require("./website.entity");
const domain_entity_1 = require("../domain/domain.entity");
const tag_entity_1 = require("../tag/tag.entity");
const page_entity_1 = require("../page/page.entity");
const evaluation_service_1 = require("../evaluation/evaluation.service");
let WebsiteService = class WebsiteService {
    constructor(websiteRepository, tagRepository, domainRepository, connection, evaluationService) {
        this.websiteRepository = websiteRepository;
        this.tagRepository = tagRepository;
        this.domainRepository = domainRepository;
        this.connection = connection;
        this.evaluationService = evaluationService;
    }
    async addPagesToEvaluate(domainId, option) {
        const pages = await this.websiteRepository.query(`
      SELECT 
        p.PageId, 
        p.Uri 
      FROM 
        DomainPage as dp, 
        Page as p
      WHERE
        dp.DomainId = ? AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE ?`, [domainId, option === 'all' ? '1__' : '1_1']);
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let error = false;
        try {
            for (const page of pages || []) {
                await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?)`, [page.PageId, page.Uri, '10', new Date()]);
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            console.log(err);
            error = true;
        }
        finally {
            await queryRunner.release();
        }
        return !error;
    }
    async findAll() {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT w.*, e.Short_Name as Entity, e.Long_Name as Entity2, u.Username as User, u.Type as Type, d.DomainId, d.Url as Domain, COUNT(t.TagId) as Observatory
      FROM Website as w
      LEFT OUTER JOIN TagWebsite as tw ON tw.WebsiteId = w.WebsiteId
      LEFT OUTER JOIN Tag as t ON t.TagId = tw.TagId AND t.Show_in_Observatorio = 1
      LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
      LEFT OUTER JOIN User as u ON u.UserId = w.UserId
      LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = "1"
      WHERE 
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"
      GROUP BY w.WebsiteId, d.DomainId`);
        return websites;
    }
    async findInfo(websiteId) {
        const websites = await this.websiteRepository.query(`SELECT w.*, u.Username as User, e.Long_Name as Entity, d.Url as Domain
      FROM 
        Website as w
        LEFT OUTER JOIN User as u ON u.UserId = w.UserId
        LEFT OUTER JOIN Entity as e ON e.EntityId = w.EntityId
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = ? AND d.Active = 1
      WHERE 
        w.WebsiteId = ?
      GROUP BY w.WebsiteId, d.Url 
      LIMIT 1`, [websiteId, websiteId]);
        if (websites) {
            const website = websites[0];
            website.tags = await this.websiteRepository.query(`SELECT t.* FROM Tag as t, TagWebsite as tw WHERE tw.WebsiteId = ? AND t.TagId = tw.TagId`, [websiteId]);
            return website;
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async findUserType(username) {
        if (username === 'admin') {
            return 'nimda';
        }
        const user = await typeorm_2.getManager().query(`SELECT * FROM User WHERE Username = ? LIMIT 1`, [username]);
        if (user) {
            return user[0].Type;
        }
        else {
            return null;
        }
    }
    async findAllDomains(user, type, website, flags) {
        const manager = typeorm_2.getManager();
        if (type === 'nimda') {
            const domains = await manager.query(`SELECT
          d.*,
          COUNT(distinct p.PageId) as Pages,
          u2.Username as User
        FROM
          Domain as d
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Website as w2 ON w2.WebsiteId = d.WebsiteId
          LEFT OUTER JOIN User as u2 ON u2.UserId = w2.UserId
          LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND p.Show_In LIKE "1__",
          Website as w,
          User as u
        WHERE
          w.WebsiteId = d.WebsiteId AND
          LOWER(w.Name) = ? AND
          (
            w.UserId IS NULL OR
            (
              u.UserId = w.UserId AND
              LOWER(u.Type) != 'studies'
            )
          )
        GROUP BY d.DomainId`, [website.toLowerCase()]);
            return domains;
        }
        else {
            const domains = await manager.query(`SELECT d.*, SUM(CASE WHEN(p.Show_In LIKE ?) THEN 1 ELSE 0 END) as Pages, u.Username as User
        FROM
          Domain as d
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId,
          User as u,
          Website as w
        WHERE
          LOWER(u.Username) = ? AND
          w.UserId = u.UserId AND
          LOWER(w.Name) = ? AND
          d.WebsiteId = w.WebsiteId
        GROUP BY d.DomainId`, [flags, user.toLowerCase(), website.toLowerCase()]);
            return domains;
        }
    }
    async findAllPages(websiteId) {
        const manager = typeorm_2.getManager();
        const pages = await manager.query(`SELECT p.PageId, p.Uri, p.Show_In
      FROM
        Domain as d,
        DomainPage as dp,
        Page as p
      WHERE
        d.WebsiteId = ? AND
        d.Active = "1" AND
        dp.DomainId = d.DomainId AND
        p.PageId = dp.PageId AND
        p.Show_In LIKE "1__"`, [websiteId]);
        return pages;
    }
    async findAllOfficial() {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT distinct w.* 
      FROM 
        Website as w, 
        User as u 
      WHERE 
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies')) AND
        w.Deleted = "0"`);
        return websites;
    }
    async findByName(name) {
        return this.websiteRepository.findOne({ where: { Name: name } });
    }
    async findAllWithoutUser() {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT * FROM Website WHERE UserId IS NULL AND Deleted = "0"`);
        return websites;
    }
    async findAllWithoutEntity() {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT distinct w.* 
      FROM 
        Website as w, 
        User as u 
      WHERE 
        w.EntityId IS NULL AND
        w.Deleted = "0" AND
        (w.UserId IS NULL OR (u.UserId = w.UserId AND LOWER(u.Type) != 'studies'))`);
        return websites;
    }
    async findAllFromMyMonitorUser(userId) {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT w.*, d.Url as Domain, COUNT(distinct p.PageId) as Pages
      FROM
        Website as w
        LEFT OUTER JOIN Domain as d ON d.WebsiteId = w.WebsiteId AND d.Active = 1
        LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
        LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId AND LOWER(p.Show_In) LIKE '_1%'
      WHERE
        w.UserId = ?
      GROUP BY w.WebsiteId, d.Url`, [userId]);
        return websites;
    }
    async findAllFromStudyMonitorUserTag(userId, tagName) {
        const tag = await this.tagRepository.findOne({ where: { UserId: userId, Name: tagName } });
        if (tag) {
            return await this.websiteRepository.query(`SELECT 
          w.WebsiteId,
          w.Name,
          d.Url,
          COUNT(distinct p.PageId) as Pages,
          AVG(distinct e.Score) as Score
        FROM
          Tag as t,
          TagWebsite as tw,
          Website as w,
          Domain as d
          LEFT OUTER JOIN DomainPage as dp ON dp.DomainId = d.DomainId
          LEFT OUTER JOIN Page as p ON p.PageId = dp.PageId
          LEFT OUTER JOIN Evaluation as e ON e.Evaluation_Date IN (
            SELECT max(Evaluation_Date) FROM Evaluation WHERE PageId = p.PageId
          )
        WHERE
          LOWER(t.Name) = ? AND
          t.UserId = ? AND
          tw.TagId = t.TagId AND
          w.WebsiteId = tw.WebsiteId AND
          w.UserId = ? AND
          d.WebsiteId = w.WebsiteId
        GROUP BY w.WebsiteId, d.Url`, [tagName.toLowerCase(), userId, userId]);
        }
        else {
            throw new common_1.InternalServerErrorException();
        }
    }
    async findAllFromStudyMonitorUserOtherTagsWebsites(userId, tagName) {
        const manager = typeorm_2.getManager();
        const websites = await manager.query(`SELECT
        distinct w.*,
        d.Url,
        t.Name as TagName
      FROM
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        LOWER(t.Name) != ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        w.Name NOT IN (
          SELECT 
            w2.Name 
          FROM
            Tag as t2,
            TagWebsite as tw2,
            Website as w2
          WHERE
            LOWER(t2.Name) = ? AND
            t2.UserId = ? AND
            tw2.TagId = t2.TagId AND
            w2.WebsiteId = tw2.WebsiteId AND
            w2.UserId = ?
        ) AND
        d.WebsiteId = w.WebsiteId AND
        d.Url NOT IN (
          SELECT 
            d2.Url 
          FROM
            Tag as t2,
            TagWebsite as tw2,
            Website as w2,
            Domain as d2
          WHERE
            LOWER(t2.Name) = ? AND
            t2.UserId = ? AND
            tw2.TagId = t2.TagId AND
            w2.WebsiteId = tw2.WebsiteId AND
            w2.UserId = ? AND
            d2.WebsiteId = w2.WebsiteId
        )`, [tagName.toLowerCase(), userId, userId, tagName.toLowerCase(), userId, userId, tagName.toLowerCase(), userId, userId]);
        return websites;
    }
    async findStudyMonitorUserTagWebsiteByName(userId, tag, websiteName) {
        const manager = typeorm_2.getManager();
        const website = await manager.query(`SELECT * FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        LOWER(w.Name) = ?
      LIMIT 1`, [tag.toLowerCase(), userId, userId, websiteName.toLowerCase()]);
        return website[0];
    }
    async findStudyMonitorUserTagWebsiteByDomain(userId, tag, domain) {
        const manager = typeorm_2.getManager();
        const website = await manager.query(`SELECT * FROM 
        Tag as t,
        TagWebsite as tw,
        Website as w,
        Domain as d
      WHERE
        LOWER(t.Name) = ? AND
        t.UserId = ? AND
        tw.TagId = t.TagId AND
        w.WebsiteId = tw.WebsiteId AND
        w.UserId = ? AND
        d.DomainId = w.WebsiteId AND
        LOWER(d.Url) = ?
      LIMIT 1`, [tag.toLowerCase(), userId, userId, domain]);
        return website[0];
    }
    async linkStudyMonitorUserTagWebsite(userId, tag, websitesId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            for (const id of websitesId || []) {
                await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) 
          SELECT TagId, ? FROM Tag WHERE LOWER(Name) = ? AND UserId = ?`, [id, tag.toLowerCase(), userId]);
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async createStudyMonitorUserTagWebsite(userId, tag, websiteName, domain, pages) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const newWebsite = new website_entity_1.Website();
            newWebsite.UserId = userId;
            newWebsite.Name = websiteName;
            newWebsite.Creation_Date = new Date();
            const insertWebsite = await queryRunner.manager.save(newWebsite);
            await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) SELECT TagId, ? FROM Tag WHERE Name = ?`, [insertWebsite.WebsiteId, tag]);
            const newDomain = new domain_entity_1.Domain();
            newDomain.WebsiteId = insertWebsite.WebsiteId;
            newDomain.Url = domain;
            newDomain.Start_Date = insertWebsite.Creation_Date;
            newDomain.Active = 1;
            const insertDomain = await queryRunner.manager.save(newDomain);
            for (const url of pages || []) {
                const page = await queryRunner.manager.findOne(page_entity_1.Page, { where: { Uri: url } });
                if (page) {
                    await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [insertDomain.DomainId, page.PageId]);
                }
                else {
                    const newPage = new page_entity_1.Page();
                    newPage.Uri = url;
                    newPage.Show_In = '000';
                    newPage.Creation_Date = newWebsite.Creation_Date;
                    const insertPage = await queryRunner.manager.save(newPage);
                    await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [insertDomain.DomainId, insertPage.PageId]);
                    const existingDomain = await queryRunner.manager.query(`SELECT distinct d.DomainId, d.Url 
            FROM
              User as u,
              Website as w,
              Domain as d
            WHERE
              LOWER(d.Url) = ? AND
              d.WebsiteId = w.WebsiteId AND
              (
                w.UserId IS NULL OR
                (
                  u.UserId = w.UserId AND
                  u.Type = 'monitor'
                )
              )
            LIMIT 1`, [domain.toLowerCase()]);
                    if (existingDomain.length > 0) {
                        await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [existingDomain[0].DomainId, newPage.PageId]);
                    }
                    await queryRunner.manager.query(`INSERT INTO Evaluation_List (PageId, UserId, Url, Show_To, Creation_Date) VALUES (?, ?, ?, ?, ?)`, [page.PageId, userId, page.Uri, '00', page.Creation_Date]);
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async removeStudyMonitorUserTagWebsite(userId, tag, websitesId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            for (const id of websitesId || []) {
                const relations = await queryRunner.manager.query(`SELECT tw.* FROM TagWebsite as tw, Website as w
          WHERE 
            tw.WebsiteId = ? AND 
            tw.TagId <> -1 AND
            w.WebsiteId = tw.WebsiteId AND
            w.UserId = ?`, [id, userId]);
                if (relations) {
                    await queryRunner.manager.query(`
            DELETE tw FROM Tag as t, TagWebsite as tw 
            WHERE 
              LOWER(t.Name) = ? AND
              tw.TagId = t.TagId AND
              tw.WebsiteId = ?`, [tag.toLowerCase(), id]);
                }
                else {
                    await queryRunner.manager.delete(website_entity_1.Website, { WebsiteId: id });
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async findNumberOfStudyMonitor() {
        const manager = typeorm_2.getManager();
        return (await manager.query(`SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, User as u WHERE LOWER(u.Type) = "studies" AND w.UserId = u.UserId`))[0].Websites;
    }
    async findNumberOfMyMonitor() {
        const manager = typeorm_2.getManager();
        return (await manager.query(`SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, User as u WHERE LOWER(u.Type) = "monitor" AND w.UserId = u.UserId`))[0].Websites;
    }
    async findNumberOfObservatory() {
        const manager = typeorm_2.getManager();
        return (await manager.query(`SELECT COUNT(w.WebsiteId) as Websites FROM Website as w, Tag as t, TagWebsite as tw 
      WHERE t.Show_in_Observatorio = "1" AND tw.TagId = t.TagId AND w.WebsiteId = tw.WebsiteId`))[0].Websites;
    }
    async findCurrentDomain(websiteId) {
        const domain = await this.domainRepository.findOne({ where: { WebsiteId: websiteId } });
        if (domain) {
            return domain.Url;
        }
        else {
            return null;
        }
    }
    async createOne(website, domain, tags) {
        if (domain.endsWith('/')) {
            domain = domain.substring(0, domain.length - 1);
        }
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const websites = await queryRunner.manager.query(`
        SELECT 
          w.*, d.Active 
        FROM 
          Website as w,
          Domain as d
        WHERE
          d.Url = ? AND
          w.WebsiteId = d.WebsiteId AND
          w.Deleted = "1"
        LIMIT 1
        `, [domain]);
            let websiteId = -1;
            if (websites.length > 0) {
                websiteId = websites[0].WebsiteId;
                const values = { Name: website.Name, Deleted: 0 };
                if (website.EntityId !== null) {
                    values['EntityId'] = website.EntityId;
                }
                if (website.UserId !== null) {
                    values['UserId'] = website.UserId;
                }
                await queryRunner.manager.update(website_entity_1.Website, { WebsiteId: websiteId }, values);
                if (websites[0].Active === 0) {
                    await queryRunner.manager.update(domain_entity_1.Domain, { WebsiteId: websiteId, Active: 1 }, { Active: 0, End_Date: website.Creation_Date });
                    await queryRunner.manager.update(domain_entity_1.Domain, { WebsiteId: websiteId, Url: domain }, { Active: 1, End_Date: null });
                }
            }
            else {
                const insertWebsite = await queryRunner.manager.save(website);
                websiteId = insertWebsite.WebsiteId;
                const newDomain = new domain_entity_1.Domain();
                newDomain.WebsiteId = websiteId;
                newDomain.Url = domain;
                newDomain.Start_Date = website.Creation_Date;
                newDomain.Active = 1;
                await queryRunner.manager.save(newDomain);
            }
            for (const tag of tags || []) {
                await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [tag, websiteId]);
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async update(websiteId, name, entityId, userId, oldUserId, transfer, defaultTags, tags) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.update(website_entity_1.Website, { WebsiteId: websiteId }, { Name: name, EntityId: entityId, UserId: userId });
            if (oldUserId === null && userId !== null) {
                if (transfer) {
                    await queryRunner.manager.query(`
            UPDATE
              Domain as d, 
              DomainPage as dp, 
              Page as p,
              Evaluation as e
            SET 
              p.Show_In = "111",
              e.Show_To = "11" 
            WHERE
              d.WebsiteId = ? AND
              dp.DomainId = d.DomainId AND
              p.PageId = dp.PageId AND
              p.Show_In LIKE "101" AND
              e.PageId = p.PageId`, [websiteId]);
                }
            }
            else if ((oldUserId !== null && userId !== null && oldUserId !== userId) || oldUserId !== null && userId === null) {
                if (!transfer || (oldUserId && !userId)) {
                    await queryRunner.manager.query(`
            UPDATE
              Domain as d, 
              DomainPage as dp, 
              Page as p,
              Evaluation as e
            SET 
              p.Show_In = "101",
              e.Show_To = "10" 
            WHERE
              d.WebsiteId = ? AND
              dp.DomainId = d.DomainId AND
              p.PageId = dp.PageId AND
              p.Show_In = "111" AND
              e.PageId = p.PageId`, [websiteId]);
                }
                await queryRunner.manager.query(`
          UPDATE 
            Domain as d, 
            DomainPage as dp, 
            Page as p,
            Evaluation as e
          SET 
            p.Show_In = "100",
            e.Show_To = "10"
          WHERE
            d.WebsiteId = ? AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In = "110" AND
            e.PageId = p.PageId`, [websiteId]);
                await queryRunner.manager.query(`
          UPDATE 
            Domain as d, 
            DomainPage as dp, 
            Page as p,
            Evaluation as e
          SET 
            p.Show_In = "000",
            e.Show_To = "10"
          WHERE
            d.WebsiteId = ? AND
            dp.DomainId = d.DomainId AND
            p.PageId = dp.PageId AND
            p.Show_In = "010" AND
            e.PageId = p.PageId`, [websiteId]);
            }
            for (const id of defaultTags || []) {
                if (!tags.includes(id)) {
                    await queryRunner.manager.query(`DELETE FROM TagWebsite WHERE TagId = ? AND WebsiteId = ?`, [id, websiteId]);
                }
            }
            for (const id of tags || []) {
                if (!defaultTags.includes(id)) {
                    await queryRunner.manager.query(`INSERT INTO TagWebsite (TagId, WebsiteId) VALUES (?, ?)`, [id, websiteId]);
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async updatePagesObservatory(pages, pagesId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            for (const page of pages || []) {
                let show = null;
                if (!pagesId.includes(page.PageId)) {
                    show = page.Show_In[0] + page.Show_In[2] + '0';
                }
                else {
                    show = page.Show_In[0] + page.Show_In[2] + '1';
                }
                await queryRunner.manager.update(page_entity_1.Page, { PageId: page.PageId }, { Show_In: show });
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return !hasError;
    }
    async delete(websiteId) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            await queryRunner.manager.query(`DELETE FROM TagWebsite WHERE WebsiteId = ? AND TagId <> 0`, [websiteId]);
            await queryRunner.manager.query(`
        UPDATE 
          Domain as d, 
          DomainPage as dp, 
          Page as p
        SET 
          p.Show_In = "000"
        WHERE
          d.WebsiteId = ? AND
          dp.DomainId = d.DomainId AND
          p.PageId = dp.PageId
      `, [websiteId]);
            await queryRunner.manager.query(`UPDATE Website SET UserId = NULL, EntityId = NULL, Deleted = 1 WHERE WebsiteId = ?`, [websiteId]);
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return websiteId;
    }
    async import(websiteId, websiteName) {
        let returnWebsiteId = websiteId;
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let hasError = false;
        try {
            const webDomain = await queryRunner.manager.query(`SELECT distinct w.*, d.*
        FROM 
          Page as p, 
          Domain as d, 
          Website as w,
          DomainPage as dp 
        WHERE 
          w.WebsiteId = ? AND
          d.WebsiteId = w.WebsiteId AND 
          d.Active = "1"`, [websiteId]);
            const domDate = webDomain[0].Start_Date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const webDate = webDomain[0].Creation_Date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const pages = await queryRunner.manager.query(`SELECT p.*
        FROM 
          Page as p, 
          Domain as d, 
          Website as w,
          DomainPage as dp 
        WHERE 
          w.WebsiteId = ? AND
          d.WebsiteId = w.WebsiteId AND 
          dp.domainId = d.DomainId AND
          dp.PageId = p.PageId`, [websiteId]);
            const domainP = (await queryRunner.manager.query(`SELECT distinct d.DomainId, w.*
        FROM  
          Domain as d,
          Website as w,
          User as u
        WHERE 
          d.Url = ? AND
          w.WebsiteId = d.WebsiteId AND
          (w.UserId IS NULL OR (u.UserId = w.UserId AND u.Type = "monitor"))
        LIMIT 1
        `, [webDomain[0].Url]))[0];
            const domainUrl = webDomain[0].Url;
            if (webDomain.length > 0) {
                if (domainP) {
                    for (const page of pages || []) {
                        if (page.Show_In[0] === '0') {
                            await this.importPage(queryRunner, page.PageId);
                            try {
                                await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES (?, ?)`, [domainP.DomainId, page.PageId]);
                            }
                            catch (err) {
                            }
                        }
                    }
                    if (domainP.Deleted === 1) {
                        await queryRunner.manager.query(`UPDATE Website SET Name = ?, Creation_Date = ?, Deleted = "0" WHERE WebsiteId = ?`, [websiteName || domainP.Name, webDate, domainP.WebsiteId]);
                    }
                    else {
                        await queryRunner.manager.query(`UPDATE Website SET Creation_Date = ? WHERE WebsiteId = ?`, [webDate, domainP.DomainId]);
                    }
                }
                else {
                    const insertWebsite = await queryRunner.manager.query(`INSERT INTO Website (Name, Creation_Date) VALUES (?, ?)`, [websiteName, webDate]);
                    returnWebsiteId = insertWebsite.WebsiteId;
                    const domain = await queryRunner.manager.query(`INSERT INTO Domain ( WebsiteId,Url, Start_Date, Active) VALUES (?, ?, ?, "1")`, [insertWebsite.websiteId, domainUrl, domDate]);
                    for (const page of pages || []) {
                        if (page.Show_In[0] === '0') {
                            await this.importPage(queryRunner, page.PageId);
                            await queryRunner.manager.query(`INSERT INTO DomainPage (DomainId, PageId) VALUES ("${domain.insertId}", "${page.PageId}")`, [domain.DomainId, page.PageId]);
                        }
                    }
                }
            }
            await queryRunner.commitTransaction();
        }
        catch (err) {
            console.log(err);
            await queryRunner.rollbackTransaction();
            hasError = true;
        }
        finally {
            await queryRunner.release();
        }
        return returnWebsiteId;
    }
    async importPage(queryRunner, pageId) {
        const page = await queryRunner.manager.query(`SELECT Show_In FROM Page WHERE PageId = ? LIMIT 1`, [pageId]);
        if (page.length > 0) {
            const show = "1" + page[0].Show_In[1] + page[0].Show_In[2];
            await queryRunner.manager.query(`UPDATE Page SET Show_In = ? WHERE PageId = ?`, [show, pageId]);
            const evaluation = await queryRunner.manager.query(`SELECT  e.EvaluationId, e.Show_To FROM Evaluation as e WHERE e.PageId = ? AND e.Show_To LIKE "_1" ORDER BY e.Evaluation_Date  DESC LIMIT 1`, [pageId]);
            const evalId = evaluation[0].EvaluationId;
            const showTo = evaluation[0].Show_To;
            if (evaluation.length > 0) {
                const newShowTo = "1" + showTo[1];
                await queryRunner.manager.query(`UPDATE Evaluation SET Show_To = ? WHERE EvaluationId = ?`, [newShowTo, evalId]);
            }
        }
    }
};
WebsiteService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(website_entity_1.Website)),
    __param(1, typeorm_1.InjectRepository(tag_entity_1.Tag)),
    __param(2, typeorm_1.InjectRepository(domain_entity_1.Domain)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Connection,
        evaluation_service_1.EvaluationService])
], WebsiteService);
exports.WebsiteService = WebsiteService;
//# sourceMappingURL=website.service.js.map