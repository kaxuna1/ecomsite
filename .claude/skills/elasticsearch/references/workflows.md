# Elasticsearch Workflows Reference

## Contents
- Initial Setup
- Index Lifecycle Management
- Monitoring and Health Checks
- Debugging Queries
- Integration with PostgreSQL

---

## Initial Setup

### Docker Compose Configuration

See the **docker** skill for container orchestration patterns.

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false # Dev only
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    healthcheck:
      test: curl -s http://localhost:9200/_cluster/health | grep -q '"status":"green\|yellow"'
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  elasticsearch-data:
```

### Setup Checklist

Copy this checklist and track progress:
- [ ] Add Elasticsearch to docker-compose.yml
- [ ] Set ELASTICSEARCH_URL in .env
- [ ] Create index template for audit logs
- [ ] Verify connection with health check endpoint
- [ ] Test sample index and search operations

---

## Index Lifecycle Management

### Create ILM Policy

```typescript
// Run once during setup
async function createILMPolicy(): Promise<void> {
  await client.ilm.putLifecycle({
    name: 'audit-logs-policy',
    policy: {
      phases: {
        hot: {
          actions: {
            rollover: {
              max_size: '5GB',
              max_age: '30d'
            }
          }
        },
        warm: {
          min_age: '30d',
          actions: {
            shrink: { number_of_shards: 1 },
            forcemerge: { max_num_segments: 1 }
          }
        },
        delete: {
          min_age: '90d',
          actions: { delete: {} }
        }
      }
    }
  });
}
```

### Rollover Workflow

```typescript
// Migration script: src/scripts/setupElasticsearch.ts
async function setupAuditLogIndices(): Promise<void> {
  // 1. Create ILM policy
  await createILMPolicy();
  
  // 2. Create index template
  await client.indices.putIndexTemplate({
    name: 'audit-logs',
    index_patterns: ['audit-logs-*'],
    template: {
      settings: {
        'index.lifecycle.name': 'audit-logs-policy',
        'index.lifecycle.rollover_alias': 'audit-logs'
      },
      mappings: { /* ... */ }
    }
  });
  
  // 3. Create initial index with alias
  const initialIndex = `audit-logs-${new Date().toISOString().slice(0, 10)}-000001`;
  await client.indices.create({
    index: initialIndex,
    aliases: { 'audit-logs': { is_write_index: true } }
  });
}
```

---

## Monitoring and Health Checks

### Health Check Endpoint

```typescript
// src/routes/healthRoutes.ts
router.get('/health/elasticsearch', async (req, res) => {
  try {
    const health = await client.cluster.health();
    
    if (health.status === 'red') {
      return res.status(503).json({
        status: 'unhealthy',
        details: health
      });
    }
    
    res.json({
      status: health.status === 'green' ? 'healthy' : 'degraded',
      cluster_name: health.cluster_name,
      number_of_nodes: health.number_of_nodes,
      active_shards: health.active_shards
    });
  } catch (err) {
    res.status(503).json({ status: 'unreachable', error: err.message });
  }
});
```

### Index Statistics

```typescript
async function getIndexStats(): Promise<IndexStats[]> {
  const response = await client.cat.indices({
    index: 'audit-logs-*',
    format: 'json',
    h: 'index,docs.count,store.size,pri.store.size'
  });

  return response.map(idx => ({
    index: idx.index,
    documentCount: parseInt(idx['docs.count'] || '0'),
    size: idx['store.size'],
    primarySize: idx['pri.store.size']
  }));
}
```

---

## Debugging Queries

### Explain API

```typescript
// Debug why a document doesn't match
async function explainMatch(index: string, id: string, query: object) {
  const explanation = await client.explain({
    index,
    id,
    query
  });

  console.log('Match:', explanation.matched);
  console.log('Explanation:', JSON.stringify(explanation.explanation, null, 2));
}
```

### Profile Slow Queries

```typescript
const response = await client.search({
  index: 'products',
  profile: true, // Enable query profiling
  query: {
    multi_match: {
      query: 'scalp serum',
      fields: ['name^2', 'description']
    }
  }
});

// Analyze timing breakdown
response.profile?.shards.forEach(shard => {
  shard.searches.forEach(search => {
    console.log('Query time:', search.query[0].time_in_nanos / 1_000_000, 'ms');
    console.log('Breakdown:', search.query[0].breakdown);
  });
});
```

### Debug Iteration Loop

1. Write query
2. Run with `profile: true`
3. If slow (>100ms), check breakdown for bottlenecks
4. Optimize (add filters, reduce fields, use keyword)
5. Repeat until acceptable performance

---

## Integration with PostgreSQL

See the **postgresql** skill for database patterns.

### Hybrid Search Strategy

```typescript
// Use PostgreSQL for transactions, Elasticsearch for search
async function searchProducts(query: string): Promise<Product[]> {
  // 1. Get IDs from Elasticsearch (fast full-text)
  const esResponse = await esClient.search({
    index: 'products',
    query: { match: { name: query } },
    _source: false, // Only need IDs
    size: 100
  });

  const ids = esResponse.hits.hits.map(h => parseInt(h._id));
  
  if (ids.length === 0) return [];

  // 2. Fetch full data from PostgreSQL (source of truth)
  const result = await pool.query(
    `SELECT * FROM products WHERE id = ANY($1) ORDER BY array_position($1, id)`,
    [ids]
  );

  return result.rows;
}
```

### Sync Pattern with Outbox

```typescript
// After PostgreSQL write, queue for Elasticsearch sync
async function createProduct(data: ProductInput): Promise<Product> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Insert into PostgreSQL
    const result = await client.query(
      'INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING *',
      [data.name, data.description, data.price]
    );
    
    // 2. Write to outbox for async sync
    await client.query(
      'INSERT INTO outbox (event_type, payload) VALUES ($1, $2)',
      ['product_created', JSON.stringify(result.rows[0])]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Worker processes outbox and syncs to Elasticsearch
async function processOutbox(): Promise<void> {
  const events = await pool.query(
    'SELECT * FROM outbox WHERE processed = false ORDER BY created_at LIMIT 100'
  );

  for (const event of events.rows) {
    if (event.event_type === 'product_created') {
      await esClient.index({
        index: 'products',
        id: event.payload.id.toString(),
        document: event.payload
      });
    }
    
    await pool.query('UPDATE outbox SET processed = true WHERE id = $1', [event.id]);
  }
}