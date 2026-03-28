import { XMLParserClientType, XMLRepositoriesDependencies } from "../../types/interface";


export abstract class BaseXMLRepository {
    xmlc: XMLParserClientType;

    constructor(repositoryDependencies: XMLRepositoriesDependencies) {
        this.xmlc = repositoryDependencies.xmlc;
    }
}
