import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { createItems } from './embeddings';
dotenv.config();

export async function main(upsert: boolean = false, q?: string) {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index('test-1');

  const toEmbed = ['Dog', 'Cat', 'Bear'];
  const { items, query } = await createItems(toEmbed, upsert, q);

  if (upsert) {
    const upsertData: {
      id: string;
      values: number[];
    }[] = [];

    for (let i = 0; i < items.length; i++) {
      upsertData.push({
        id: i.toString(),
        values: items[i][1],
      });
    }

    const res = await index.namespace('sqlite_vec_comp').upsert(upsertData);
    console.log('upserted data', res);
  }

  const search = await index.namespace('sqlite_vec_comp').query({
    topK: 3,
    vector: query,
  });

  return search;
}

main()
  .catch((e) => {
    console.warn('some error e: ', e);
  });
