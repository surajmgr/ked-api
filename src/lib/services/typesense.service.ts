import { configure } from "typesense-ts";
import { ContentDocument, NoHitQueriesDocument, QuestionDocument, SuggestionDocument } from "../typesense/schema";
import { ContentCollectionService } from "./typesense/content.typesense.service";
import { QuestionCollectionService } from "./typesense/question.typesense.service";
import { NoHitQueriesService, PopularQueriesService } from "./typesense/analytics.typesense.service";
import { noHitAnalyticsRule, popularQueriesAnalyticsRule, contentEventsRule, questionEventsRule } from "../typesense/rules";

export type Client = ReturnType<typeof configure>;

export interface TypesenseConfig {
    apiKey: string;
    nodes: { url: string }[];
}

interface CollectionMap {
    content: {
        service: ContentCollectionService;
        doc: ContentDocument;
    };
    questions: {
        service: QuestionCollectionService;
        doc: QuestionDocument;
    };
    no_hit_queries: {
        service: NoHitQueriesService;
        doc: NoHitQueriesDocument;
    };
    popular_queries: {
        service: PopularQueriesService;
        doc: SuggestionDocument;
    }
}

export const ANALYTICS_RULES = {
    no_hit_queries_aggregation: noHitAnalyticsRule,
    popular_queries_aggregation: popularQueriesAnalyticsRule,
    content_events_aggregation: contentEventsRule,
    question_events_aggregation: questionEventsRule,
} as const;

export type AnalyticsRuleName = keyof typeof ANALYTICS_RULES;

export class TypesenseService {
    private client: Client;
    private config: TypesenseConfig;

    public collections: {
        [K in keyof CollectionMap]: {
            service: CollectionMap[K]['service'];
            type?: new () => CollectionMap[K]['doc'];
        }
    };

    constructor(config: TypesenseConfig) {
        const nodeUrl = new URL(config.nodes[0].url);
        this.config = config;

        this.client = configure({
            apiKey: config.apiKey,
            nodes: [{
                host: nodeUrl.hostname,
                port: parseInt(nodeUrl.port) || (nodeUrl.protocol === 'https:' ? 443 : 80),
                protocol: nodeUrl.protocol.replace(':', '') as "http" | "https"
            }],
            connectionTimeoutSeconds: 5,
            numRetries: 3
        });

        this.collections = {
            content: {
                service: new ContentCollectionService(this.client),
            },
            questions: {
                service: new QuestionCollectionService(this.client),
            },
            no_hit_queries: {
                service: new NoHitQueriesService(this.client),
            },
            popular_queries: {
                service: new PopularQueriesService(this.client),
            }
        }
    }

    public get<K extends keyof typeof this.collections>(collectionName: K): typeof this.collections[K] {
        return this.collections[collectionName];
    }

    async ensureCollections() {
        try {
            await Promise.all(Object.keys(this.collections).map(collectionName => this.ensureCollection(collectionName as keyof typeof this.collections)));
        } catch (error) {
            console.error('Typesense ensureCollections error:', error);
        }
    }

    private async ensureCollection(collectionName: keyof typeof this.collections) {
        try {
            return await this.collections[collectionName].service.collectionSchema.retrieve();
        } catch (e) {
            try {
                return await this.collections[collectionName].service.collectionSchema.create();
            } catch (createError) {
                console.warn(`Failed to create collection ${this.collections[collectionName].service.collectionSchema.schema.name}`, createError);
            }
        }
    }

    async createCollection(collectionName: keyof typeof this.collections, force = false) {
        try {
            const collection = this.collections[collectionName];
            if (force) {
                try {
                    await collection.service.collectionSchema.delete();
                } catch (e) { /* ignore */ }
            }
            return await collection.service.collectionSchema.create();
        } catch (error) {
            console.error(`Typesense createCollection error:`, error);
            throw error;
        }
    }

    async deleteCollection(collectionName: keyof typeof this.collections) {
        try {
            return await this.collections[collectionName].service.collectionSchema.delete();
        } catch (error) {
            console.error(`Typesense deleteCollection error:`, error);
            throw error;
        }
    }

    // --- Analytics Rules Management ---
    async createAnalyticsRule(name: AnalyticsRuleName) {
        try {
            const rule = ANALYTICS_RULES[name];
            const ruleNameReal = rule.rule.name;

            if ('upsert' in rule && typeof rule.upsert === 'function') {
                await rule.upsert();
            } else {
                const response = await fetch(
                    `${this.config.nodes[0].url}/analytics/rules/${ruleNameReal}`,
                    {
                        method: "PUT",
                        headers: {
                            "X-TYPESENSE-API-KEY": this.config.apiKey,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(rule),
                    },
                );

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Failed to create rule ${name}: ${text}`);
                }
            }

            return { success: true, message: `Created rule ${name}` };
        } catch (error) {
            console.error(`Typesense createAnalyticsRule error:`, error);
            throw error;
        }
    }

    async deleteAnalyticsRule(name: AnalyticsRuleName) {
        try {
            const rule = ANALYTICS_RULES[name];
            const ruleNameReal = rule.rule.name;

            const response = await fetch(
                `${this.config.nodes[0].url}/analytics/rules/${ruleNameReal}`,
                {
                    method: "DELETE",
                    headers: {
                        "X-TYPESENSE-API-KEY": this.config.apiKey,
                    },
                },
            );

            if (!response.ok && response.status !== 404) {
                const text = await response.text();
                throw new Error(`Failed to delete rule ${name}: ${text}`);
            }

            return { success: true, message: `Deleted rule ${name}` };
        } catch (error) {
            console.error(`Typesense deleteAnalyticsRule error:`, error);
            throw error;
        }
    }

    async getAnalyticsRules() {
        try {
            const response = await fetch(
                `${this.config.nodes[0].url}/analytics/rules`,
                {
                    headers: {
                        "X-TYPESENSE-API-KEY": this.config.apiKey,
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to fetch analytics rules");
            }
            return await response.json();
        } catch (error) {
            console.error(`Typesense getAnalyticsRules error:`, error);
            throw error;
        }
    }

    async upsertDocuments<K extends keyof CollectionMap>(
        collectionName: K,
        documents: CollectionMap[K]['doc'][]
    ) {
        try {
            const { service } = this.collections[collectionName];
            // biome-ignore lint/suspicious/noExplicitAny: Type is asserted
            await service.collectionSchema.documents.import(documents as any, { action: 'upsert' });
        } catch (error) {
            console.error('Typesense upsertDocuments error:', error);
        }
    }

    async deleteDocument<K extends keyof CollectionMap>(
        collectionName: K,
        documentId: string
    ) {
        try {
            const { service } = this.collections[collectionName];
            await service.collectionSchema.documents.delete({ documentId });
        } catch (error) {
            console.error('Typesense deleteDocument error:', error);
        }
    }

    async deleteDocuments<K extends keyof CollectionMap>(
        collectionName: K,
        documentIds: string[]
    ) {
        try {
            await Promise.all(documentIds.map(id => this.deleteDocument(collectionName, id)));
        } catch (error) {
            console.error('Typesense deleteDocuments error:', error);
        }
    }
}