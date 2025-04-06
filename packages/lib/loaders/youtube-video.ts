import { AppDocument } from '@chaindesk/lib/types/document';
import { DatasourceSchema } from '@chaindesk/lib/types/models';
import prisma from '@chaindesk/prisma/client';
import YoutubeApi from '../youtube-api';
import { DatasourceLoaderBase } from './base';

type DatasourceYoutubeVideo = Extract<
  DatasourceSchema,
  { type: 'youtube_video' }
>;

export class YoutubeVideoLoader extends DatasourceLoaderBase<DatasourceYoutubeVideo> {
  async getSize(text: string) {
    return 0;
  }

  async load() {
    const url = this.datasource.config['source_url'];

    if (!url) {
      throw new Error('Fatal: missing youtube url.');
    }

    let docs = [];
    try {
      const transcripts = await YoutubeApi.transcribeVideo(url);
      const videoId = YoutubeApi.extractVideoId(url) as string;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      if (!this.datasource?.groupId) {
        const metadata = await YoutubeApi.getVideoMetadataWithoutApiKeys(videoId);

        await prisma.appDatasource.update({
          where: {
            id: this.datasource.id,
          },
          data: {
            name: metadata?.title,
          },
        });

        this.datasource.name = metadata?.title;
      }

      const groupedTranscripts = YoutubeApi.groupTranscriptsBySeconds({
        nbSeconds: 60,
        transcripts,
      });

      docs = groupedTranscripts.map(({ text, offset }, index) => {
        const timeStampUrl = `${videoUrl}&t=${Math.ceil(offset / 1000)}`;

        const contentWithLink = index === 0
          ? `Ver este contenido en YouTube en video con el siguiente enlace: ${videoUrl}\n\n${text}`
          : text;

        return new AppDocument<any>({
          pageContent: contentWithLink,
          metadata: {
            source_url: timeStampUrl,
          },
        });
      });
    } catch (err) {
      docs = [
        new AppDocument<any>({
          pageContent: 'FAILED: Captions Are Disabled on this Video.',
          metadata: {
            source_url: url,
          },
        }),
      ];
    }

    return docs.map(({ pageContent, metadata }) => {
      return {
        pageContent,
        metadata: {
          ...metadata,
          datastore_id: this.datasource.datastoreId!,
          datasource_id: this.datasource.id,
          datasource_name: this.datasource.name,
          datasource_type: this.datasource.type,
          custom_id: this.datasource?.config?.custom_id,
          tags: this.datasource?.config?.tags || [],
        },
      };
    });
  }
}