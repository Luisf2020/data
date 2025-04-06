import Head from 'next/head';
import React from 'react';

type Props = {
  title: string;
  description: string;
  image?: string;
  keywords?: string;
  faviconUrl?: string;
  url?: string;
  uri?: string;
  baseUrl?: string;
  ogImage?: string;
};

function SEO(props: Props) {
  const baseUrl = props.baseUrl || 'https://www.chatsappai.com';
  const url =
    props.url ||
    (props.uri &&
      `${baseUrl}${props?.uri?.startsWith('/') ? '' : '/'}${props.uri}`) ||
    undefined;

  const defaultOgImage = `${baseUrl}/og-cs.png`;

  return (
    <Head>
      <meta charSet="utf-8" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="robots" content="index, follow" />

      <link rel="icon" href={props.faviconUrl || '/logo.png'} sizes="any" />

      <title>{props.title}</title>
      <meta key="title" name="title" content={props.title} />
      <meta key="og:title" property="og:title" content={props.title} />
      <meta key="og:type" property="og:type" content="website" />
      <meta property="og:image:type" content="image/jpeg" />

      <meta key="description" name="description" content={props.description} />
      <meta
        key="og:description"
        property="og:description"
        content={props.description}
      />
      <meta
        key="twitter:description"
        property="twitter:description"
        content={props.description}
      />

      <meta
        key="keywords"
        name="keywords"
        content={`"Chatbot de IA, Plataforma sin código, Soporte al cliente, Incorporación, Chatbot de Slack IA, Automatización, ChatsappAI, Plugin de ChatGPT, Chat PDF, Chatear con cualquier documento, Bot personalizado de ChatGPT, Chatbot GPT, Chatbot, Chatbot de ChatGPT" ${props.keywords || ''
          }`}
      />

      <meta
        key="og:image"
        property="og:image"
        itemProp="image"
        content={props.ogImage ? props.ogImage : defaultOgImage}
      />
      <meta
        key="og:image:url"
        property="og:image:url"
        content={props.ogImage ? props.ogImage : defaultOgImage}
      />
      <meta
        key="og:image:secure_url"
        property="og:image:secure_url"
        content={props.ogImage ? props.ogImage : defaultOgImage}
      />
      <meta
        key="twitter:image"
        property="twitter:image"
        content={props.ogImage ? props.ogImage : defaultOgImage}
      />

      <meta
        key="twitter:card"
        property="twitter:card"
        content="summary_large_image"
      />

      <meta name="twitter:site" content="@chatsappai" />

      {url && (
        <>
          <link rel="canonical" href={url} />
          <meta property="og:url" content={url} />
          <meta property="twitter:url" content={url} />
        </>
      )}
    </Head>
  );
}

export default SEO;
