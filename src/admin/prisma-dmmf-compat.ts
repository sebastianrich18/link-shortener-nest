/**
 * Prisma 7 removed Prisma.dmmf which @adminjs/prisma relies on.
 *
 * This module parses the Prisma schema file at runtime to derive
 * DMMF-compatible model definitions, keeping schema.prisma as the
 * single source of truth.
 *
 * Pass `clientModule` into each AdminJS resource config.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface DmmfField {
    name: string;
    kind: string;
    type: string;
    isId: boolean;
    isList: boolean;
    isRequired: boolean;
    isUnique: boolean;
    isReadOnly: boolean;
    hasDefaultValue: boolean;
    default?: unknown;
    relationName?: string;
    relationFromFields?: string[];
    relationToFields?: string[];
}

interface DmmfModel {
    name: string;
    dbName: string | null;
    fields: DmmfField[];
    primaryKey: null;
    uniqueFields: string[][];
    uniqueIndexes: { name: string; fields: string[] }[];
    isGenerated: boolean;
}

interface DmmfEnum {
    name: string;
    values: { name: string; dbName: string | null }[];
}

const SCALAR_TYPES = new Set(['String', 'Int', 'Float', 'Boolean', 'DateTime', 'BigInt', 'Decimal', 'Json', 'Bytes']);

function parseDefault(attrs: string): unknown {
    const match = attrs.match(/@default\(([^)]+)\)/);
    if (!match) return undefined;
    const val = match[1];
    if (val === 'now()') return { name: 'now', args: [] };
    if (val === 'autoincrement()') return { name: 'autoincrement', args: [] };
    if (val === 'uuid()') return { name: 'uuid', args: [] };
    if (val === 'cuid()') return { name: 'cuid', args: [] };
    if (val === 'true' || val === 'false') return val === 'true';
    if (/^\d+$/.test(val)) return parseInt(val);
    return val;
}

function parseRelation(attrs: string): { name?: string; fields?: string[]; references?: string[] } {
    const match = attrs.match(/@relation\(([^)]+)\)/);
    if (!match) return {};

    const inner = match[1];
    const nameMatch = inner.match(/(?:name:\s*)?["']([^"']+)["']/);
    const fieldsMatch = inner.match(/fields:\s*\[([^\]]+)\]/);
    const refsMatch = inner.match(/references:\s*\[([^\]]+)\]/);

    return {
        name: nameMatch?.[1],
        fields: fieldsMatch?.[1].split(',').map((s) => s.trim()),
        references: refsMatch?.[1].split(',').map((s) => s.trim()),
    };
}

function parseField(line: string, enumNames: Set<string>): DmmfField | null {
    // Match: fieldName Type[]? @attributes...
    const match = line.match(/^(\w+)\s+(\w+)(\[\])?\??(.*)$/);
    if (!match) return null;

    const [, name, type, listSuffix, rest] = match;
    const isOptional = line.match(new RegExp(`${type}(\\[\\])?\\?`)) !== null;
    const isList = !!listSuffix;
    const attrs = rest ?? '';

    let kind: string;
    if (enumNames.has(type)) {
        kind = 'enum';
    } else if (SCALAR_TYPES.has(type)) {
        kind = 'scalar';
    } else {
        kind = 'object';
    }

    const relation = kind === 'object' ? parseRelation(attrs) : {};
    const defaultValue = parseDefault(attrs);

    return {
        name,
        kind,
        type,
        isId: attrs.includes('@id'),
        isList,
        isRequired: !isOptional,
        isUnique: attrs.includes('@unique'),
        isReadOnly: false,
        hasDefaultValue: defaultValue !== undefined,
        ...(defaultValue !== undefined && { default: defaultValue }),
        ...(relation.name && { relationName: relation.name }),
        ...(relation.fields && { relationFromFields: relation.fields }),
        ...(relation.references && { relationToFields: relation.references }),
    };
}

function parseSchema(schema: string): { models: DmmfModel[]; enums: DmmfEnum[] } {
    const enums: DmmfEnum[] = [];
    const enumNames = new Set<string>();

    // Parse enums first (needed to determine field kinds)
    const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
    let enumMatch;
    while ((enumMatch = enumRegex.exec(schema)) !== null) {
        const name = enumMatch[1];
        const body = enumMatch[2];
        const values = body
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith('//'))
            .map((v) => ({ name: v, dbName: null }));
        enums.push({ name, values });
        enumNames.add(name);
    }

    // Parse models
    const models: DmmfModel[] = [];
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
    let modelMatch;
    while ((modelMatch = modelRegex.exec(schema)) !== null) {
        const name = modelMatch[1];
        const body = modelMatch[2];
        const lines = body
            .split('\n')
            .map((l) => l.replace(/\/\/.*$/, '').trim())
            .filter((l) => l && !l.startsWith('@@'));

        const fields = lines.map((line) => parseField(line, enumNames)).filter((f): f is DmmfField => f !== null);

        // Infer relation names for relations without explicit @relation(name)
        for (const field of fields) {
            if (field.kind === 'object' && !field.relationName) {
                const sorted = [name, field.type].sort();
                field.relationName = `${sorted[0]}To${sorted[1]}`;
            }
        }

        models.push({
            name,
            dbName: null,
            fields,
            primaryKey: null,
            uniqueFields: [],
            uniqueIndexes: [],
            isGenerated: false,
        });
    }

    return { models, enums };
}

const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
const schemaContent = readFileSync(schemaPath, 'utf-8');
const { models, enums } = parseSchema(schemaContent);

export const dmmfModels = Object.fromEntries(models.map((m) => [m.name, m]));

export const clientModule = {
    Prisma: {
        dmmf: {
            datamodel: {
                models,
                enums,
                types: [],
            },
        },
    },
};
