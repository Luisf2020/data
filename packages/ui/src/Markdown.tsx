import 'property-information'; // Para evitar bugs con react-markdown

import clsx from 'clsx';
import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark as theme } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import Stack from '@mui/joy/Stack';
import CopyButton from './CopyButton';

type Props = any & {
  chunkSize?: number; // Tamaño del fragmento (chunk) que se mostrará cada vez
};

function Markdown({
  children,
  className,
  chunkSize = 3000, // Tamaño del fragmento predeterminado
  ...otherProps
}: Props) {
  const [visibleChunks, setVisibleChunks] = useState(1); // Estado para el número de fragmentos visibles

  // Dividimos el contenido en fragmentos de acuerdo al chunkSize
  const chunks = useMemo(() => {
    const content = children || '';
    const chunked = [];
    let i = 0;

    while (i < content.length) {
      chunked.push(content.slice(i, i + chunkSize));
      i += chunkSize;
    }

    return chunked;
  }, [children, chunkSize]);

  const displayContent = chunks.slice(0, visibleChunks).join(''); // Solo mostramos los fragmentos visibles

  const handleShowMore = () => {
    if (visibleChunks < chunks.length) {
      setVisibleChunks(visibleChunks + 1); // Muestra el siguiente fragmento
    }
  };

  const Render = useMemo(() => {
    return (
      <div>
        <ReactMarkdown
          {...otherProps}
          className={clsx(
            'prose-sm prose dark:prose-invert',
            'text-sm break-words prose-p:leading-relaxed prose-pre:p-0 prose-code:before:hidden prose-code:after:hidden prose-hr:my-4',
            'max-w-full',
            className
          )}
          components={{
            code({ className, ...props }) {
              const lang = className?.replace?.('language-', '');

              const codeChunk = (props?.children as string) || '';

              return !!lang || (props as any)?.fromPre ? (
                <Stack
                  sx={{
                    p: 0,
                  }}
                >
                  <Stack
                    direction={'row'}
                    sx={(t) => ({
                      alignItems: 'center',
                      background: t.colorSchemes.dark.palette.background.level1,
                      justifyContent: 'space-evenly',
                    })}
                  >
                    <p
                      className="mx-auto"
                      style={{ opacity: 0.5, lineHeight: 0 }}
                    >
                      {lang || ''}
                    </p>
                    <CopyButton text={codeChunk} className="mr-2" />
                  </Stack>
                  <SyntaxHighlighter
                    style={theme}
                    language={lang || 'bash'}
                    PreTag="div"
                    className="w-full"
                    showLineNumbers={
                      (props as any)?.children?.includes('\n') ? true : false
                    }
                    useInlineStyles={true}
                    customStyle={{
                      lineHeight: '1.5',
                      fontSize: '1em',
                      borderTopRightRadius: '0px',
                      borderTopLeftRadius: '0px',
                      marginTop: '0px',
                    }}
                    codeTagProps={{
                      style: {
                        lineHeight: 'inherit',
                        fontSize: 'inherit',
                      },
                    }}
                  >
                    {String(props.children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </Stack>
              ) : (
                <code
                  className={clsx(
                    className,
                    'bg-purple-200 dark:bg-purple-900 py-0.5 px-1 rounded-md font-thin'
                  )}
                  {...props}
                  style={{ width: '100%' }}
                />
              );
            },
            pre: ({ children, ...pre }) => {
              return (
                <Stack component="div" className="relative overflow-x-hidden">
                  <pre {...pre} style={{ margin: 0 }}>
                    {React.cloneElement(children as any, {
                      fromPre: true,
                    })}
                  </pre>
                </Stack>
              );
            },
            img: (props) => (
              <img
                {...props}
                style={{
                  opacity: 1,
                  scale: 1,
                  transition: 'opacity 0.2s, transform 0.2s',
                }}
              />
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {displayContent}
        </ReactMarkdown>

        {visibleChunks < chunks.length && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={handleShowMore}
              style={{
                backgroundColor: '#1f7a1f',
                color: 'white',
                fontWeight: 'bold',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                marginBottom: '10px',
              }}
            >
              Mostrar más
            </button>
          </div>
        )}
      </div>
    );
  }, [displayContent, className, visibleChunks, chunks.length]);

  if (!children) {
    return null;
  }

  return Render;
}

export default Markdown;
