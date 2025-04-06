import { Datastore } from '@chaindesk/prisma';
import { QdrantManager } from './datastores/qdrant';
import { AppDocument, ChunkMetadataRetrieved } from './types/document';
import { DatastoreManager } from './datastores';
import { azureOpenAI } from './azure_openai';

interface Filters {
  must?: { key: string }[];
  datastore_ids?: string[];
  datasource_ids?: string[];
  custom_ids?: string[];
}

type RetrievalProps = {
  query: string;
  topK?: number;
  datastore?: Datastore;
  filters?: Filters;
  maxTokens?: number;
};

// Ajuste de configuración para queries de catálogo
const DEFAULT_MAX_TOKENS = 2000; // Aumentado para manejar más contenido
const MIN_RESULTS = 5; // Mínimo de resultados para consultas generales
const MAX_RESULTS = 15; // Máximo de resultados para mantener calidad
const QUALITY_THRESHOLD = 0.3; // Más permisivo para consultas generales

interface RankedDocument extends AppDocument<ChunkMetadataRetrieved> {
  tokenCount?: number;
  reranking_scores?: {
    semantic_score: number;
    relevance_score: number;
    combined_score: number;
  };
}

const searchInQdrant = async (
  query: string,
  filters: Filters,
  topK: number
): Promise<AppDocument<ChunkMetadataRetrieved>[]> => {
  try {
    console.log('Starting Qdrant search with:', {
      query,
      filters,
      topK,
      datastoreIds: filters?.datastore_ids,
    });

    // Usar directamente el método _search de QdrantManager
    const results = await QdrantManager._search({
      query,
      topK,
      filters: filters, // Pasar los filtros directamente
    });

    console.log('Qdrant search results:', {
      count: results.length,
      hasResults: results.length > 0,
      firstResult: results[0] ? {
        id: results[0].metadata.chunk_id,
        contentPreview: results[0].pageContent?.substring(0, 100)
      } : null
    });

    return results;
  } catch (error) {
    console.error('Error in Qdrant search:', error);
    return [];
  }
};

const rerankWithLLM = async (
  documents: RankedDocument[],
  query: string
): Promise<RankedDocument[]> => {
  try {
    // Prompt ajustado para consultas de catálogo
    const batchPrompt = documents
      .map((doc, index) => `Documento ${index + 1}: "${doc.pageContent.substring(0, 800)}"\n`)
      .join('\n');

    const response = await azureOpenAI.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Evalúa la relevancia de cada documento para una consulta sobre catálogo.
          Considera:
          1. Si contiene información relevante del catálogo
          2. Qué tan completa es la información
          3. Si incluye detalles importantes como precios, características o disponibilidad
          
          Califica cada documento de 0-100, donde:
          90-100: Información completa y directamente relevante del catálogo
          70-89: Información parcial pero útil del catálogo
          50-69: Información relacionada pero no específica
          0-49: Poco relevante para la consulta
          
          Responde solo con números, un score por línea.`
        },
        {
          role: "user",
          content: `Consulta del usuario: "${query}"\n\n${batchPrompt}`
        }
      ],
      temperature: 0.1
    });

    const scores = response.choices[0].message.content
      ?.split('\n')
      .map(line => parseInt(line.trim()))
      .filter(score => !isNaN(score))
      .map(score => score / 100) || [];

    return documents.map((doc, index) => ({
      ...doc,
      reranking_scores: {
        ...doc.reranking_scores!,
        relevance_score: scores[index] ?? doc.reranking_scores?.semantic_score ?? 0,
        combined_score: (
          ((doc.reranking_scores?.semantic_score || 0) * 0.3) + // Menor peso a similitud semántica
          (scores[index] ?? doc.reranking_scores?.semantic_score ?? 0) * 0.7  // Mayor peso a relevancia
        )
      }
    }));
  } catch (error) {
    console.warn('Error en LLM reranking:', error);
    return documents;
  }
};

const calculateSemanticScores = async (
  documents: RankedDocument[],
  query: string
): Promise<RankedDocument[]> => {
  try {
    const queryEmbedding = await azureOpenAI.createEmbedding({
      model: "text-embedding-3-large",
      input: query,
      encoding_format: "float"
    });

    const documentEmbeddings = await Promise.all(
      documents.map(doc =>
        azureOpenAI.createEmbedding({
          model: "text-embedding-3-large",
          input: doc.pageContent,
          encoding_format: "float"
        })
      )
    );

    return documents.map((doc, index) => {
      const similarity = calculateCosineSimilarity(
        queryEmbedding.data[0].embedding,
        documentEmbeddings[index].data[0].embedding
      );

      return {
        ...doc,
        reranking_scores: {
          semantic_score: similarity,
          relevance_score: 0,
          combined_score: similarity
        }
      };
    });
  } catch (error) {
    console.warn('Error en semantic scoring:', error);
    return documents.map(doc => ({
      ...doc,
      reranking_scores: {
        semantic_score: 1,
        relevance_score: 0,
        combined_score: 1
      }
    }));
  }
};

const calculateCosineSimilarity = (vec1: number[], vec2: number[]): number => {
  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
};

const retrieval = async (props: RetrievalProps) => {
  try {
    let results: AppDocument<ChunkMetadataRetrieved>[] = [];
    const maxTokens = props.maxTokens || DEFAULT_MAX_TOKENS;

    // Usar topK proporcionado o valor por defecto
    const initialTopK = Math.min(props.topK || 20, 50); // Limitar a 50 máximo

    // Manejar la búsqueda basada en los filtros proporcionados
    if (props.filters?.datastore_ids?.length) {
      results = await QdrantManager._search({
        query: props.query,
        topK: initialTopK,
        filters: {
          datastore_ids: props.filters.datastore_ids,
          datasource_ids: props.filters.datasource_ids
        },
        tags: [],
      });
    } else if (props.datastore) {
      const store = new DatastoreManager(props.datastore);
      results = await store.search({
        query: props.query,
        topK: initialTopK,
        filters: props.filters,
        tags: [],
      });
    }

    console.log('Resultados iniciales encontrados:', results.length);

    if (results.length === 0) {
      console.log('No se encontraron resultados para la consulta');
      return [];
    }

    // Proceso de reranking
    let rankedResults = results as RankedDocument[];

    // Calcular scores semánticos
    console.log('Calculando scores semánticos...');
    rankedResults = await calculateSemanticScores(rankedResults, props.query);

    // Reranking con LLM
    console.log('Aplicando reranking con LLM...');
    if (rankedResults.length > 1) {
      rankedResults = await rerankWithLLM(rankedResults, props.query);
    }

    // Ordenar por score combinado
    rankedResults.sort((a, b) =>
      (b.reranking_scores?.combined_score || 0) - (a.reranking_scores?.combined_score || 0)
    );

    // Filtrar por calidad y limitar resultados
    let finalResults = rankedResults
      .filter(doc => (doc.reranking_scores?.combined_score || 0) >= QUALITY_THRESHOLD);

    // Asegurar mínimo de resultados
    if (finalResults.length < MIN_RESULTS && rankedResults.length > 0) {
      finalResults = rankedResults.slice(0, Math.min(MIN_RESULTS, rankedResults.length));
    }

    // Limitar máximo de resultados
    finalResults = finalResults.slice(0, MAX_RESULTS);

    // Logging detallado
    console.log('Métricas de recuperación:', {
      query: props.query,
      datastore_ids: props.filters?.datastore_ids,
      resultadosIniciales: results.length,
      resultadosFinales: finalResults.length,
      scoresPromedio: {
        semantic: mean(finalResults.map(d => d.reranking_scores?.semantic_score || 0)),
        relevance: mean(finalResults.map(d => d.reranking_scores?.relevance_score || 0)),
        combined: mean(finalResults.map(d => d.reranking_scores?.combined_score || 0))
      },
      topScores: finalResults.slice(0, 3).map(doc => ({
        score: doc.reranking_scores?.combined_score.toFixed(3),
        content: doc.pageContent.substring(0, 100) + '...'
      }))
    });

    return finalResults;
  } catch (error) {
    console.error('Error en retrieval:', error);
    // En caso de error, intentar retornar resultados sin reranking
    if (props.filters?.datastore_ids?.length) {
      return QdrantManager._search({
        query: props.query,
        topK: Math.min(props.topK || 10, 20),
        filters: props.filters,
        tags: [],
      });
    }
    throw error;
  }
};

const mean = (numbers: number[]): number =>
  numbers.reduce((acc, val) => acc + val, 0) / numbers.length;

export default retrieval;