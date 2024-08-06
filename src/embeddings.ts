import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbedding(text: string) {
  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return embedding.data[0].embedding;
  } catch (err) {
    console.log(err);
  }
}

export async function createItems(
  toEmbed?: string[],
  createUpsertItems: boolean = false,
  query: string = 'An animal that is not a bear'
) {
  const items = [];

  if (createUpsertItems) {
    for (let i = 1; i <= toEmbed.length; i++) {
      const emb = await createEmbedding(toEmbed[i - 1]);
      items.push([i, emb]);
    }
  }

  const res = await createEmbedding(query);

  return { items, query: res };
}
