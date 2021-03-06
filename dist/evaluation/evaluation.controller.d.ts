import { EvaluationService } from './evaluation.service';
export declare class EvaluationController {
    private readonly evaluationService;
    constructor(evaluationService: EvaluationService);
    getMyMonitorWebsitePageEvaluation(req: any, website: string, url: string): Promise<any>;
    getStudyMonitorTagWebsitePageEvaluation(req: any, tag: string, website: string, url: string): Promise<any>;
    getListOfPageEvaluations(req: any, type: string, page: string): Promise<any>;
    getPageEvaluation(url: string, evaluationId: number): Promise<any>;
    getUserPageEvaluation(type: string, url: string): Promise<any>;
}
