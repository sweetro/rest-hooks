import {
  isImmutable,
  denormalizeImmutable,
} from '@rest-hooks/normalizr/schemas/ImmutableUtils';

export const normalize = (
  schema: any,
  input: any,
  parent: any,
  key: any,
  visit: any,
  addEntity: any,
  visitedEntities: any,
) => {
  const object = { ...input };
  Object.keys(schema).forEach(key => {
    const localSchema = schema[key];
    const value = visit(
      input[key],
      input,
      key,
      localSchema,
      addEntity,
      visitedEntities,
    );
    if (value === undefined || value === null) {
      delete object[key];
    } else {
      object[key] = value;
    }
  });
  return object;
};

export const denormalize = (
  schema: any,
  input: any,
  unvisit: any,
): [denormalized: any, found: boolean, deleted: boolean] => {
  if (isImmutable(input)) {
    return denormalizeImmutable(schema, input, unvisit);
  }

  const object = { ...input };
  let found = true;
  let deleted = false;
  Object.keys(schema).forEach(key => {
    const [item, foundItem, deletedItem] = unvisit(object[key], schema[key]);
    if (object[key] !== undefined) {
      object[key] = item;
    }
    if (deletedItem) {
      deleted = true;
    }
    if (!foundItem) {
      found = false;
    }
  });
  return [object, found, deleted];
};

export function infer(
  schema: any,
  args: readonly any[],
  indexes: any,
  recurse: any,
) {
  const resultObject: any = {};
  for (const k of Object.keys(schema)) {
    resultObject[k] = recurse(schema[k], args, indexes);
  }
  return resultObject;
}

/**
 * Represents fixed objects
 * @see https://resthooks.io/docs/api/Object
 */
export default class ObjectSchema {
  protected schema: any;

  constructor(definition) {
    this.define(definition);
  }

  define(definition) {
    this.schema = Object.keys(definition).reduce((entitySchema, key) => {
      const schema = definition[key];
      return { ...entitySchema, [key]: schema };
    }, this.schema || {});
  }

  normalize(
    ...args: readonly [
      input: any,
      parent: any,
      key: any,
      visit: any,
      addEntity: any,
      visitedEntities: any,
    ]
  ) {
    return normalize(this.schema, ...args);
  }

  denormalize(...args: readonly [input: any, unvisit: any]) {
    return denormalize(this.schema, ...args);
  }

  infer(args: any, indexes: any, recurse: any) {
    return infer(this.schema, args, indexes, recurse);
  }
}
