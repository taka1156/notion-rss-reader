import { X2jOptions, XMLParser } from "fast-xml-parser";

export class XMLParserClient {
    parser: XMLParser;

    constructor(options?: X2jOptions | undefined) {
        this.parser = new XMLParser(options);
    }
}