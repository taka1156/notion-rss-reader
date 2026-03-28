import { NotionRepositoriesDependencies } from "../../types/interface";
import { NotionDataSourceIds } from "../../types/notion";

export abstract class BaseNotionRepository {
    protected nc: NotionRepositoriesDependencies["nc"];
    protected qb: NotionRepositoriesDependencies["qb"];

    constructor(repositoryDependencies: NotionRepositoriesDependencies) {
        this.nc = repositoryDependencies.nc;
        this.qb = repositoryDependencies.qb;
    }
}
