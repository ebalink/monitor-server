import { Connection } from 'typeorm';
import { Evaluation } from './evaluation.entity';
export declare class EvaluationService {
    private readonly connection;
    private isEvaluatingInstance1;
    private isEvaluatingInstance2;
    private isEvaluatingInstance3;
    private isEvaluatingUserInstance4;
    private isEvaluatingUserInstance5;
    private isEvaluatingUserInstance6;
    constructor(connection: Connection);
    instance1EvaluatePageList(): Promise<void>;
    instance2EvaluatePageListevaluatePageList(): Promise<void>;
    instance3EvaluatePageListevaluatePageList(): Promise<void>;
    instance4EvaluateUserPageList(): Promise<void>;
    instance5EvaluateUserPageListevaluatePageList(): Promise<void>;
    instance6EvaluateUserPageListevaluatePageList(): Promise<void>;
    private evaluateInBackground;
    evaluateUrl(url: string): Promise<any>;
    createOne(evaluation: Evaluation): Promise<any>;
    evaluatePageAndSave(pageId: number, url: string, showTo: string): Promise<any>;
    savePageEvaluation(queryRunner: any, pageId: number, evaluation: any, showTo: string): Promise<any>;
    findMyMonitorUserWebsitePageNewestEvaluation(userId: number, website: string, url: string): Promise<any>;
    findStudyMonitorUserTagWebsitePageNewestEvaluation(userId: number, tag: string, website: string, url: string): Promise<any>;
    findAllEvaluationsFromPage(type: string, page: string): Promise<any>;
    findEvaluationById(url: string, id: number): Promise<any>;
    findUserPageEvaluation(url: string, type: string): Promise<any>;
}
