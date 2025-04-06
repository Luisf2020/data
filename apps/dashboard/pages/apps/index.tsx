import { useRouter } from 'next/router';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useSession } from 'next-auth/react';
import { ReactElement, useState, useEffect, useRef, useMemo } from 'react';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import Layout from '@app/components/Layout';
import { FilterTools } from '@app/components/composio/FilterTools';
import { CardComposio } from '@app/components/composio/Card';
import {
  Breadcrumbs,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/joy';
import Link from 'next/link';
import { FaHome } from 'react-icons/fa';
import { Grid } from '@mui/material';
import { composioClient } from '@app/lib/api/composio-client';

type App = {
  appId: string;
  categories: string[];
  createdAt: string;
  description: string;
  enabled: boolean;
  key: string;
  logo: string;
  meta: {
    is_custom_app: boolean;
    triggersCount: number;
    actionsCount: number;
    documentation_doc_text: string | null;
    configuration_docs_text: string | null;
  };
  name: string;
  no_auth: boolean;
  tags: string[];
  updatedAt: string;
};
const ITEMS_PER_PAGE = 12;

export default function AppsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const allAppsRef = useRef<App[]>([]);

  const filteredAndPaginatedApps = useMemo(() => {
    if (!initialDataLoaded) return { apps: [], hasMore: false };

    let filtered = allAppsRef.current;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(searchLower) ||
        app.description.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      filtered = filtered.filter(app =>
        app.categories.includes(category)
      );
    }

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const hasMore = page < totalPages;

    const paginatedApps = filtered.slice(0, page * ITEMS_PER_PAGE);

    return {
      apps: paginatedApps,
      hasMore
    };
  }, [search, category, page, initialDataLoaded]);

  useEffect(() => {
    async function fetchInitialApps() {
      if (allAppsRef.current.length > 0) return;

      setLoading(true);
      try {
        const data = await composioClient.listApps();
        allAppsRef.current = data;
        console.log('Apps loaded:', allAppsRef.current);
        setInitialDataLoaded(true);
        setPage(1);
      } catch (error) {
        console.error('Error fetching apps:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialApps();
  }, []);

  // Configurar el observer para infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && filteredAndPaginatedApps.hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    const element = document.querySelector('#scroll-anchor');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [filteredAndPaginatedApps.hasMore, loading]);

  return (
    <Box
      component="main"
      sx={{
        px: { xs: 2, md: 6 },
        pb: { xs: 2, md: 3 },
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        width: '100%',
        gap: 1,
      }}
    >
      <Breadcrumbs
        size="sm"
        separator={<ChevronRightRoundedIcon />}
        sx={{ '--Breadcrumbs-gap': '1rem', fontWeight: 'lg', color: 'neutral.400', px: 0 }}
      >
        <Link href="/">
          <FaHome />
        </Link>
        <Typography>Apps / Herramientas 🛠️</Typography>
      </Breadcrumbs>

      <Typography level="h1" fontSize="xl4" sx={{ mb: 2 }}>
        Apps / Herramientas
      </Typography>

      {session?.organization?.isPremium ? (
        <>
          <FilterTools
            filters={{ search, category }}
            setFilters={({ search, category }) => {
              setSearch(search);
              setCategory(category);
              setPage(1);
            }}
          />

          <Grid container spacing={2}>
            {filteredAndPaginatedApps.apps.map((app: App) => (
              <Grid item xs={12} sm={6} md={4} key={app?.key}>
                <CardComposio
                  app={app}
                  onAppClick={(id: string) => router.push(`/apps/${id}`)}
                />
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <Alert color="warning" component="div">Active el plan premium para acceder a esta funcionalidad.</Alert>
      )}

      {loading && (
        <CircularProgress
          size="sm"
          variant="soft"
          sx={{ mx: 'auto' }}
        />
      )}

      {!filteredAndPaginatedApps.hasMore && !loading && (
        <Alert>No hay más aplicaciones.</Alert>
      )}

      <div id="scroll-anchor" style={{ height: '1px' }}></div>
    </Box>
  );
}

AppsPage.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};