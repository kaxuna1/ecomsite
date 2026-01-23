# Elasticsearch Patterns Reference

## Contents
- Index Design Patterns
- Query Patterns
- Bulk Operations
- Error Handling
- Anti-Patterns

---

## Index Design Patterns

### Time-Based Indices

**When:** Audit logs, events, metrics—any data with time component.

```typescript
// GOOD - Monthly rollover prevents unbounded indices
const indexName = `audit-logs-${new Date().toISOString().slice(0, 7)}`;

// Search across all months
const results = await client.search({ index: 'audit-logs-*' });
```

### Mapping Best Practices

```typescript
// GOOD - Explicit mappings prevent mapping explosion
const mappings = {
  properties: {
    // Exact match fields
    status: { type: 'keyword' },
    user_id: { type: 'keyword' },
    
    // Searchable text
    description: { type: 'text', analyzer: 'english' },
    
    // Both exact and searchable
    product_name: {
      type: 'text',
      fields: { keyword: { type: 'keyword' } }
    },
    
    // Disable indexing for large objects
    raw_payload: { type: 'object', enabled: false }
  }
};
```

---

## Query Patterns

### Compound Boolean Query

```typescript
// Search with multiple conditions
async function searchProducts(params: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Product[]> {
  const must: any[] = [];
  const filter: any[] = [];

  // Full-text search goes in must
  if (params.query) {
    must.push({
      multi_match: {
        query: params.query,
        fields: ['name^2', 'description', 'highlights'],
        fuzziness: 'AUTO'
      }
    });
  }

  // Exact filters go in filter (cached, no scoring)
  if (params.category) {
    filter.push({ term: { 'categories.keyword': params.category } });
  }
  
  if (params.minPrice || params.maxPrice) {
    filter.push({
      range: {
        price: {
          ...(params.minPrice && { gte: params.minPrice }),
          ...(params.maxPrice && { lte: params.maxPrice })
        }
      }
    });
  }

  const response = await client.search({
    index: 'products',
    query: {
      bool: {
        must: must.length ? must : [{ match_all: {} }],
        filter
      }
    }
  });

  return response.hits.hits.map(h => h._source as Product);
}
```

### Pagination with Search After

```typescript
// GOOD - Use search_after for deep pagination
async function* paginateResults(index: string, query: object) {
  let searchAfter: any[] | undefined;
  
  while (true) {
    const response = await client.search({
      index,
      query,
      size: 1000,
      sort: [{ '@timestamp': 'desc' }, { _id: 'asc' }],
      ...(searchAfter && { search_after: searchAfter })
    });

    if (response.hits.hits.length === 0) break;
    
    yield response.hits.hits;
    
    const lastHit = response.hits.hits[response.hits.hits.length - 1];
    searchAfter = lastHit.sort;
  }
}

// BAD - from/size fails past 10,000 results
const response = await client.search({
  index: 'audit-logs-*',
  from: 50000, // FAILS - max_result_window exceeded
  size: 100
});
```

---

## Bulk Operations

### Efficient Bulk Indexing

```typescript
// GOOD - Batch operations
async function bulkIndex(documents: AuditEvent[]): Promise<void> {
  const operations = documents.flatMap(doc => [
    { index: { _index: `audit-logs-${doc.timestamp.slice(0, 7)}` } },
    { ...doc, '@timestamp': doc.timestamp }
  ]);

  const response = await client.bulk({ operations, refresh: false });

  if (response.errors) {
    const errors = response.items
      .filter(item => item.index?.error)
      .map(item => item.index!.error);
    console.error('Bulk indexing errors:', errors);
  }
}

// BAD - Individual index calls in a loop
for (const doc of documents) {
  await client.index({ index: 'audit-logs', document: doc }); // N network calls
}
```

---

## Error Handling

```typescript
import { errors } from '@elastic/elasticsearch';

async function safeSearch(index: string, query: object) {
  try {
    return await client.search({ index, query });
  } catch (err) {
    if (err instanceof errors.ResponseError) {
      if (err.statusCode === 404) {
        // Index doesn't exist yet
        return { hits: { hits: [], total: { value: 0 } } };
      }
      if (err.statusCode === 400) {
        console.error('Bad query:', err.meta.body.error);
        throw new Error('Invalid search query');
      }
    }
    throw err;
  }
}
```

---

## Anti-Patterns

### WARNING: Dynamic Mapping Explosion

**The Problem:**

```typescript
// BAD - Arbitrary keys create mapping entries
await client.index({
  index: 'events',
  document: {
    metadata: {
      [userId]: { lastSeen: new Date() }, // Dynamic key!
      [sessionId]: { duration: 123 }      // Another dynamic key!
    }
  }
});
```

**Why This Breaks:**
1. Each unique key creates a new mapping field
2. Elasticsearch has a 1000 field limit by default
3. Cluster becomes unstable with mapping explosion

**The Fix:**

```typescript
// GOOD - Use arrays or nested objects with fixed schema
await client.index({
  index: 'events',
  document: {
    metadata: [
      { key: 'user_id', value: userId, timestamp: new Date() },
      { key: 'session_id', value: sessionId, duration: 123 }
    ]
  }
});
```

### WARNING: Missing Keyword Suffix

**The Problem:**

```typescript
// BAD - Text field for exact match
const response = await client.search({
  query: { term: { status: 'active' } } // Fails on text field
});
```

**Why This Breaks:**
1. Text fields are analyzed (lowercased, tokenized)
2. `term` query expects exact match against stored value
3. "Active" ≠ "active" after analysis

**The Fix:**

```typescript
// GOOD - Use .keyword for exact match
const response = await client.search({
  query: { term: { 'status.keyword': 'active' } }
});