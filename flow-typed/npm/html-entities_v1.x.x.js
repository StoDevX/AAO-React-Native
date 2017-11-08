// flow-typed signature: 56da6c56d38d4ce8f2bb8cfa700a5fb5
// flow-typed version: <<STUB>>/html-entities_v1.2.1/flow_v0.56.0

declare module 'html-entities' {
    declare class Entities {
        encode: (text: string) => string;
        encodeNonUTF: (text: string) => string;
        encodeNonASCII: (text: string) => string;
        decode: (text: string) => string;
    }

    declare module.exports: {
        XmlEntities: Class<Entities>,
        Html4Entities: Class<Entities>,
        Html5Entities: Class<Entities>,
        AllHtmlEntities: Class<Entities>,
    }
}
