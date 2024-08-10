import { main as sqlite } from './openai-embeddings';
import { main as pinecone } from './pinecone';

export async function comparison(query: string) {
  const sqliteRes = await sqlite(query);
  const pineconeRes = await pinecone(false, query);
  return { sqlite: sqliteRes, pinecone: pineconeRes.matches };
}

comparison('An animal that is not a bear')
  .then((res) => {
    console.log(res);
  })
  .catch((e) => {
    console.warn('some error e: ', e);
  });
