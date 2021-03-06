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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const page_service_1 = require("../page/page.service");
const response_1 = require("../lib/response");
let ObservatoryController = class ObservatoryController {
    constructor(pageService) {
        this.pageService = pageService;
    }
    async getData() {
        return response_1.success(await this.pageService.getObservatoryData());
    }
};
__decorate([
    common_1.Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ObservatoryController.prototype, "getData", null);
ObservatoryController = __decorate([
    common_1.Controller('observatory'),
    __metadata("design:paramtypes", [page_service_1.PageService])
], ObservatoryController);
exports.ObservatoryController = ObservatoryController;
//# sourceMappingURL=observatory.controller.js.map