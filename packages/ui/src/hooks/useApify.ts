import useSWR from 'swr';

type Filters = {
  limit: number;
  offset: number;
  search: string;
  sortBy: 'relevance' | 'popularity' | 'newest' | 'lastUpdate';
  category: string;
  username: string;
  pricingModel: 'FREE' | 'FLAT_PRICE_PER_MONTH' | 'PRICE_PER_DATASET_ITEM' | '';
};


const API_URL = 'https://api.apify.com/v2/store';

function useApify(filters: Filters) {
  const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    return res.json();
  };

  const queryParams = new URLSearchParams({
    token: 'apify_api_MOn3eqqpqMMIaWH4yymBbRg9USyfam4i4pW3'
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value) queryParams.append(key, value.toString());
  });

  const { data, error, isLoading } = useSWR(
    `${API_URL}?${queryParams.toString()}`,
    fetcher
  );

  return {
    tools: data?.data?.items || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
  };
}
export default useApify;