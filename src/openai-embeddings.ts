import * as sqliteVec from 'sqlite-vec';
import Database from 'better-sqlite3';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createEmbedding(text) {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return embedding.data[0].embedding;
  } catch (err) {
    console.log(err);
  }
}

const db = new Database(':memory:');
sqliteVec.load(db);

db.prepare(
  'select sqlite_version() as sqlite_version, vec_version() as vec_version;'
);

const toEmbed = [
  'Dog',
  'Cat',
  'Bear',
];

async function createItems() {
  const items = [];
  for (let i = 1; i <= toEmbed.length; i++) {
    const emb = await createEmbedding(toEmbed[i - 1]);
    items.push([i, emb]);
  }

  const query = await createEmbedding('An animal that is not a bear');
  
  return { items, query };
}

async function main() {
  const { items, query } = await createItems();

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

  console.log(rows);
}

main().catch(console.error);
