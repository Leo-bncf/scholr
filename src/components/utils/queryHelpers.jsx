/**
 * Generic query helpers for table-agnostic screens.
 *
 * Prefer a domain module from `src/data` — these exist for the few places that
 * genuinely take an entity name as a parameter.
 */
import * as tables from '@/data/tables';

export const DEFAULT_PAGE_SIZE = 20;
export const DASHBOARD_PAGE_SIZE = 10;

/** Parse base44's sort syntax ('-updated_at' desc, 'name' asc). */
function parseSort(sort) {
  if (!sort) return { order: 'created_at', ascending: false };
  const descending = sort.startsWith('-');
  return { order: descending ? sort.slice(1) : sort, ascending: !descending };
}

export async function paginatedQuery(
  entityName,
  filter = {},
  pageSize = DEFAULT_PAGE_SIZE,
  page = 0,
  sort = '-updated_at',
) {
  const { order, ascending } = parseSort(sort);
  const items = await tables.select(entityName, filter, {
    order,
    ascending,
    limit: pageSize,
    offset: page * pageSize,
  });

  return { items, page, pageSize, hasMore: items.length === pageSize };
}

export async function batchQueries(queries) {
  return Promise.all(
    queries.map(({ entity, filter, sort, limit }) => {
      const { order, ascending } = parseSort(sort);
      return tables.select(entity, filter, { order, ascending, limit });
    }),
  );
}

/**
 * Row counts per entity for a school.
 *
 * Counted in Postgres rather than by fetching rows and reading `.length`, which
 * is what this did before — for a large school that meant transferring
 * thousands of records to display a handful of numbers.
 */
export async function getDashboardMetrics(schoolId, entityNames) {
  const counts = await Promise.all(
    entityNames.map((entity) => tables.countRows(entity, { school_id: schoolId })),
  );
  return Object.fromEntries(entityNames.map((entity, i) => [entity, counts[i]]));
}
