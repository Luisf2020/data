import { zodResolver } from '@hookform/resolvers/zod';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import {
  Alert,
  AspectRatio,
  Box,
  Button,
  Card,
  CardContent,
  CardOverflow,
  Chip,
  Divider,
  Stack,
  Typography,
  useColorScheme,
} from '@mui/joy';
import { LLMTaskOutputType } from '@prisma/client';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import superjson from 'superjson';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { z } from 'zod';

import { Footer } from '@app/components/landing-page/Footer';
import PoweredByCard from '@app/components/PoweredByCard';
import SEO from '@app/components/SEO';
import TopBar from '@app/components/TopBar';

import { youtubeSummaryTool } from '@chaindesk/lib/config';
import slugify from '@chaindesk/lib/slugify';
import {
  fetcher,
  generateActionFetcher,
  HTTP_METHOD,
} from '@chaindesk/lib/swr-fetcher';
import { SummaryPageProps } from '@chaindesk/lib/types';
import { YoutubeSummarySchema } from '@chaindesk/lib/types/dtos';
import { YOUTUBE_VIDEO_URL_RE } from '@chaindesk/lib/youtube-api/lib';
import { LLMTaskOutput, Prisma } from '@chaindesk/prisma';
import prisma from '@chaindesk/prisma/client';
import Input from '@chaindesk/ui/Input';

type FormType = z.infer<typeof YoutubeSummarySchema>;

export default function Youtube(props: {
  items: LLMTaskOutput[];
  total: number;
}) {
  const { mode, systemMode, setMode } = useColorScheme();
  const router = useRouter();
  const page = Number(router.query.page as string);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { control, register, handleSubmit, formState } = useForm<FormType>({
    mode: 'onChange',
    resolver: zodResolver(YoutubeSummarySchema),
  });

  const apiUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  const summaryMutation = useSWRMutation(
    `${apiUrl}/api/tools/youtube-summary`,
    generateActionFetcher(HTTP_METHOD.POST)
  );

  const onSubmit = async (payload: FormType) => {
    try {
      const response = await summaryMutation.trigger({
        ...payload,
      });

      const videoId = payload.url.match(YOUTUBE_VIDEO_URL_RE)?.[1];

      const videoUrl = `https://dashboard.chatsappai.com/tools/youtube-summarizer/${videoId}`;

      if (response?.externalId) {
        router.push(videoUrl);
      } else {
        setIsProcessing(true);

        await new Promise((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              const res = await axios.get(
                `${apiUrl}/api/tools/youtube-summary/${videoId}`
              );

              if (res.data) {
                router.push(videoUrl);
                resolve(true);
                clearInterval(interval);
              }
            } catch (err) {
              console.log(err);
              reject(err);
            }
          }, 1000 * 10);
        });
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const msg = err?.response?.data;

        if (msg) {
          let text = msg;

          if (msg?.includes?.('RATE_LIMIT')) {
            text = 'Rate limit exceeded! Please try again in few minutes.';
          }
          return toast.error(JSON.stringify(text));
        }
      }

      toast.error('An error occurred. Please try again in few minutes.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = summaryMutation.isMutating || isProcessing;

  return (
    <>
      <SEO
        title="Free AI Youtube Video Summarizer"
        description="Generate YouTube video summaries instantly for free with AI"
        uri={router.asPath}
        ogImage={`https://www.chatsappai.com/api/og/youtube-summary`}
      />
      <Stack sx={{ width: '100vw', minHeight: '100vh' }}>
        <TopBar href="/tools/youtube-summarizer" />

        <Stack
          sx={{
            flex: 1,
            width: '100%',
            height: '100%',
            overflowX: 'hidden',
            p: 2,
            alignItems: 'center',
          }}
        >
          <Stack sx={{ width: 'md', maxWidth: '100%', mt: 20 }} spacing={4}>
            <Stack spacing={1}>
              <Typography
                sx={{ textAlign: 'center', fontStyle: 'italic' }}
                level="h2"
                color="neutral"
              >
                Free
              </Typography>
              <Typography
                sx={{ textAlign: 'center', fontWeight: 'bold' }}
                level="display1"
                color="primary"
              >
                AI YouTube Summarizer
              </Typography>
            </Stack>
            {/* <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-wrap items-center space-y-2 min-w-full md:flex md:space-y-0 md:space-x-2"
            >
              <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
                <Stack sx={{ width: '100%' }} spacing={1}>
                  <Input
                    control={control}
                    // className="flex-1 w-full"
                    {...register('url')}
                    // Otherwise got error when submiting with return key 🤷
                    onBlur={(e) => {}}
                    placeholder="Paste your youtube video link here"
                    disabled={isLoading}
                    startDecorator={<YouTubeIcon />}
                    size="lg"
                    sx={{ borderRadius: '20px' }}
                    endDecorator={
                      formState.isValid && (
                        <Button
                          type="submit"
                          variant="solid"
                          color="primary"
                          disabled={!formState.isValid}
                          loading={isLoading}
                          size="lg"
                          sx={{ borderRadius: '20px' }}
                          endDecorator={<EastRoundedIcon fontSize="md" />}
                        >
                          Summarize
                        </Button>
                      )
                    }
                  />
                  <a
                    href="https://chatsappai.com"
                    target="_blank"
                    style={{
                      textDecoration: 'none',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      marginBottom: '2px',
                    }}
                  >
                    <Chip variant="outlined" size="sm" color="neutral">
                      <Box className="truncate" sx={{ whiteSpace: 'nowrap' }}>
                        <Typography level="body-xs" fontSize={'10px'}>
                          Powered by{' '}
                          <Typography color="primary" fontWeight={'bold'}>
                            ⚡️ ChatsappAI
                          </Typography>
                        </Typography>
                      </Box>
                    </Chip>
                  </a>
                </Stack>
                {isLoading && (
                  <Alert sx={{ mx: 'auto' }} color="warning">
                    Please do not close the window while we process the video.
                    It can take 1-2mins.
                  </Alert>
                )}
              </Stack>
            </form> */}
          </Stack>

          {(props.items?.length || 0) > 0 && (
            <Stack sx={{ mt: 10, width: '100%' }} spacing={2}>
              <Typography level="body-lg" sx={{ textAlign: 'center' }}>
                🎬 All Summaries
              </Typography>
              <Stack
                flexWrap="wrap"
                useFlexGap
                sx={(theme) => ({
                  maxWidth: '100%',
                  width: 'lg',
                  justifyContent: 'center',
                  gap: 2,

                  [theme.breakpoints.up('sm')]: {
                    flexDirection: 'row',
                  },
                })}
              >
                {props.items?.map((each) => (
                  <Box
                    key={each.id}
                    sx={(theme) => ({
                      width: '100%',
                      [theme.breakpoints.up('sm')]: {
                        maxWidth: '350px',
                        width: '30%',
                      },
                    })}
                  >
                    <Link
                      href={`/tools/youtube-summarizer/${slugify(
                        (each as SummaryPageProps)?.output?.metadata?.title
                      )}-${each.externalId}`}
                      className="w-full"
                    >
                      <Card sx={{ width: '100%' }}>
                        <CardOverflow>
                          <AspectRatio ratio="2">
                            <img
                              src={
                                (each as SummaryPageProps)?.output?.metadata
                                  ?.thumbnails?.high?.url
                              }
                              alt=""
                            />
                          </AspectRatio>
                        </CardOverflow>
                        <CardContent>
                          <Typography level="h4" noWrap>
                            {
                              (each as SummaryPageProps)?.output?.metadata
                                ?.title
                            }
                          </Typography>
                          <Typography level="body-md" noWrap>
                            {
                              (each as SummaryPageProps)?.output?.metadata
                                ?.description
                            }
                          </Typography>
                        </CardContent>
                      </Card>
                    </Link>
                  </Box>
                ))}
              </Stack>

              <Stack sx={{ justifyContent: 'center' }} direction="row" gap={1}>
                {page > 0 && (
                  <Link
                    href={`/tools/youtube-summarizer/all/${page - 1}`}
                    // style={{ marginLeft: 'auto', marginRight: 'auto' }}
                  >
                    <Button
                      startDecorator={<ArrowBackRoundedIcon />}
                      variant="solid"
                    >
                      Prev
                    </Button>
                  </Link>
                )}
                {Math.ceil(props.total / youtubeSummaryTool.paginationLimit) >
                  page + 1 && (
                  <Link
                    href={`/tools/youtube-summarizer/all/${page + 1}`}
                    // style={{ marginLeft: 'auto', marginRight: 'auto' }}
                  >
                    <Button
                      endDecorator={<ArrowForwardRoundedIcon />}
                      variant="solid"
                    >
                      Next
                    </Button>
                  </Link>
                )}
              </Stack>
            </Stack>
          )}

          <PoweredByCard
            sx={{
              mt: 10,
              py: 8,
              width: '100%',
              maxWidth: 'md',
              mb: 20,
            }}
          />
        </Stack>
        <Footer />
      </Stack>
    </>
  );
}

export async function getStaticPaths() {
  const all: string[] = [];

  return {
    paths: all.map((path) => {
      return { params: { site: path } };
    }),
    fallback: 'blocking',
  };
}

export async function getStaticProps({
  params: { page },
}: {
  params: {
    page: string;
  };
}) {
  const [total, items] = await Promise.all([
    prisma.lLMTaskOutput.count({
      where: {
        type: 'youtube_summary',
        output: {
          path: ['metadata', 'title'],
          not: Prisma.AnyNull,
        },
      },
    }),
    prisma.lLMTaskOutput.findMany({
      where: {
        type: 'youtube_summary',
        output: {
          path: ['metadata', 'title'],
          not: Prisma.AnyNull,
        },
      },
      skip: Number(page) * youtubeSummaryTool.paginationLimit,
      take: youtubeSummaryTool.paginationLimit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    props: {
      total,
      items: superjson.serialize(items).json || null,
    },
    revalidate: 60,
  };
}
