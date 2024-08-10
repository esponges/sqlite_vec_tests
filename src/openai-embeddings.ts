import * as sqliteVec from 'sqlite-vec';
import Database from 'better-sqlite3';
import { createItems } from './embeddings';

export async function main(q?: string) {
  const db = new Database(':memory:');
  sqliteVec.load(db);

  db.prepare(
    'select sqlite_version() as sqlite_version, vec_version() as vec_version;'
  );

  const toEmbed = ['Dog', 'Cat', 'Bear'];

  const { items, query } = await createItems(toEmbed, true, q);

  db.exec('CREATE VIRTUAL TABLE vec_items USING vec0(embedding float[1536])');

  const insertStmt = db.prepare(
    'INSERT INTO vec_items(rowid, embedding) VALUES (?, ?)'
  );

  const insertVectors = db.transaction((items) => {
    for (const [id, vector] of items) {
      insertStmt.run(BigInt(id), new Float32Array(vector));
    }
  });

  insertVectors(items);

  const rows = db
    .prepare(
      `
    SELECT
      rowid,
      distance
    FROM vec_items
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT 3
  `
    )
    .all(new Float32Array(query));

    return rows;
  }

main().catch(console.error);
