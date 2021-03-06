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
const passport_1 = require("@nestjs/passport");
const page_service_1 = require("./page.service");
const response_1 = require("../lib/response");
let PageController = class PageController {
    constructor(pageService) {
        this.pageService = pageService;
    }
    async reEvaluatePage(req) {
        const page = decodeURIComponent(req.body.page);
        return response_1.success(await this.pageService.addPageToEvaluate(page));
    }
    async getNumberOfPagesWaitingForEvaluation() {
        return response_1.success(await this.pageService.findAllInEvaluationList());
    }
    async getAllPages() {
        return response_1.success(await this.pageService.findAll());
    }
    async getAllMyMonitorUserWebsitePages(req, website) {
        return response_1.success(await this.pageService.findAllFromMyMonitorUserWebsite(req.user.userId, website));
    }
    async createMyMonitorUserWebsitePages(req) {
        const website = req.body.website;
        const domain = req.body.domain;
        const uris = JSON.parse(req.body.pages);
        return response_1.success(await this.pageService.createMyMonitorUserWebsitePages(req.user.userId, website, domain, uris));
    }
    async removeMyMonitorUserWebsitePages(req) {
        const website = req.body.website;
        const ids = JSON.parse(req.body.pagesId);
        return response_1.success(await this.pageService.removeMyMonitorUserWebsitePages(req.user.userId, website, ids));
    }
    async getStudyMonitorUserTagWebsitePages(req, tag, website) {
        return response_1.success(await this.pageService.findStudyMonitorUserTagWebsitePages(req.user.userId, tag, website));
    }
    async addPages(req) {
        const domainId = req.body.domainId;
        const uris = JSON.parse(req.body.uris).map((uri) => decodeURIComponent(uri));
        const observatory = JSON.parse(req.body.observatory).map((uri) => decodeURIComponent(uri));
        return response_1.success(await this.pageService.addPages(domainId, uris, observatory));
    }
    async evaluatePage(req) {
        const url = decodeURIComponent(req.body.url);
        const page = await this.pageService.findPageFromUrl(url);
        if (page) {
            return response_1.success(await this.pageService.addPageToEvaluate(url, '10'));
        }
        else {
            throw new common_1.UnauthorizedException();
        }
    }
    async evaluateMyMonitorWebsitePage(req) {
        const userId = req.user.userId;
        const url = decodeURIComponent(req.body.url);
        const page = await this.pageService.findPageFromUrl(url);
        const isUserPage = await this.pageService.isPageFromMyMonitorUser(userId, page.PageId);
        if (isUserPage) {
            return response_1.success(await this.pageService.addPageToEvaluate(url, '01', userId));
        }
        else {
            throw new common_1.UnauthorizedException();
        }
    }
    async evaluateStudyMonitorTagWebsitePage(req) {
        const userId = req.user.userId;
        const tag = req.body.tag;
        const website = req.body.website;
        const url = decodeURIComponent(req.body.url);
        const page = await this.pageService.findPageFromUrl(url);
        const isUserPage = await this.pageService.isPageFromStudyMonitorUser(userId, tag, website, page.PageId);
        if (isUserPage) {
            return response_1.success(await this.pageService.addPageToEvaluate(url, '00', userId));
        }
        else {
            throw new common_1.UnauthorizedException();
        }
    }
    async createStudyMonitorUserTagWebsitePages(req) {
        const tag = req.body.tag;
        const website = req.body.website;
        const domain = req.body.domain;
        const uris = JSON.parse(req.body.pages).map(page => decodeURIComponent(page));
        return response_1.success(await this.pageService.createStudyMonitorUserTagWebsitePages(req.user.userId, tag, website, domain, uris));
    }
    async removeStudyMonitorUserTagWebsitePages(req) {
        const tag = req.body.tag;
        const website = req.body.website;
        const pagesId = JSON.parse(req.body.pagesId);
        return response_1.success(await this.pageService.removeStudyMonitorUserTagWebsitePages(req.user.userId, tag, website, pagesId));
    }
    async update(req) {
        const pageId = req.body.pageId;
        const checked = req.body.checked;
        return response_1.success(await this.pageService.update(pageId, checked));
    }
    async delete(req) {
        const pages = req.body.pages;
        return response_1.success(await this.pageService.delete(pages));
    }
    async importPage(req) {
        const pageId = req.body.pageId;
        const username = req.body.user;
        const tag = req.body.tag;
        const website = req.body.website;
        const type = await this.pageService.findUserType(username);
        let successImport = await this.pageService.import(pageId, type);
        if (type === 'studies') {
            successImport = await this.pageService.importStudy(pageId, username, tag, website);
        }
        return response_1.success(successImport);
    }
};
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('reEvaluate'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "reEvaluatePage", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('evaluationList'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PageController.prototype, "getNumberOfPagesWaitingForEvaluation", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Get('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PageController.prototype, "getAllPages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Get('myMonitor/website/:website'),
    __param(0, common_1.Request()), __param(1, common_1.Param('website')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "getAllMyMonitorUserWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Post('myMonitor/create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "createMyMonitorUserWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Post('myMonitor/remove'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "removeMyMonitorUserWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Get('studyMonitor/tag/:tag/website/:website'),
    __param(0, common_1.Request()), __param(1, common_1.Param('tag')), __param(2, common_1.Param('website')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "getStudyMonitorUserTagWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('add'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "addPages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('page/evaluate'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "evaluatePage", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-monitor')),
    common_1.Post('myMonitor/evaluate'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "evaluateMyMonitorWebsitePage", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/evaluate'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "evaluateStudyMonitorTagWebsitePage", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/create'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "createStudyMonitorUserTagWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-study')),
    common_1.Post('studyMonitor/remove'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "removeStudyMonitorUserTagWebsitePages", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('update'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "update", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('delete'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "delete", null);
__decorate([
    common_1.UseGuards(passport_1.AuthGuard('jwt-admin')),
    common_1.Post('import'),
    __param(0, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PageController.prototype, "importPage", null);
PageController = __decorate([
    common_1.Controller('page'),
    __metadata("design:paramtypes", [page_service_1.PageService])
], PageController);
exports.PageController = PageController;
//# sourceMappingURL=page.controller.js.map