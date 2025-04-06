import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import { zodResolver } from '@hookform/resolvers/zod';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';

import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';

import UnfoldLessOutlinedIcon from '@mui/icons-material/UnfoldLessOutlined';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import ArticleTwoToneIcon from '@mui/icons-material/ArticleTwoTone';
import Alert from '@mui/joy/Alert';

import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import ChipDelete from '@mui/joy/ChipDelete';
import IconButton from '@mui/joy/IconButton';

import Skeleton from '@mui/joy/Skeleton';
import Stack from '@mui/joy/Stack';
import Textarea from '@mui/joy/Textarea';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import InfiniteScroll from 'react-infinite-scroller';
import { z } from 'zod';
import { zIndex } from '@chaindesk/ui/embeds/common/utils';
import { transcribeAudio } from '@chaindesk/lib/TranscribeAudio';

import { AcceptedMimeTypes } from '@chaindesk/lib/accepted-mime-types';

import { ChatMessage, MessageEvalUnion } from '@chaindesk/lib/types';
import type { Source } from '@chaindesk/lib/types/document';
import debounce from 'p-debounce';

import AnimateMessagesOneByOne from '@chaindesk/ui/Chatbox/AnimateMessagesOneByOne';
import Message from '@chaindesk/ui/Chatbox/ChatMessage';

import PoweredBy from '@chaindesk/ui/PoweredBy';

import FileUploader from '@chaindesk/ui/FileUploader';
import TraditionalForm from '@chaindesk/ui/embeds/forms/traditional';
import Bubbles from './Bubbles';
import useStateReducer from '../hooks/useStateReducer';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import type { Attachment, ConversationChannel } from '@chaindesk/prisma';
import useFileUpload from '../hooks/useFileUpload';
import Typography from '@mui/joy/Typography';
import { Card } from '@mui/joy';
import Loader from '../Loader';
import { MicrophoneIcon } from '@heroicons/react/20/solid';
import Avatar from '@mui/joy/Avatar';

export type ChatBoxProps = {
  messages: ChatMessage[];
  onSubmit: (props: {
    query?: string;
    files?: File[];
    isDraft?: boolean;
    attachmentsForAI?: string[];
  }) => Promise<any>;
  messageTemplates?: string[];
  initialMessage?: string;
  initialMessages?: ChatMessage[];
  readOnly?: boolean;
  disableWatermark?: boolean;
  renderAfterMessages?: JSX.Element | null;
  renderBottom?: JSX.Element | null;
  agentIconUrl?: string;
  isLoadingConversation?: boolean;
  hasMoreMessages?: boolean;
  handleLoadMoreMessages?: () => void;
  handleEvalAnswer?: (props: {
    messageId: string;
    value: MessageEvalUnion;
  }) => any;
  handleImprove?: (message: ChatMessage, msgIndex: number) => any;
  topSettings?: JSX.Element | null;
  handleSourceClick?: (source: Source) => any;
  handleAbort?: any;
  emptyComponent?: JSX.Element | null;
  hideInternalSources?: boolean;
  userImgUrl?: string;
  organizationId?: string | null;
  refreshConversation?: () => any;
  metadata?: Record<string, unknown>;
  withFileUpload?: boolean;
  draftReplyInput?: JSX.Element | null;
  withSources?: boolean;
  isAiEnabled?: boolean;
  autoFocus?: boolean;
  agentIconStyle?: React.CSSProperties;
  fromInbox?: boolean;
  isStreaming?: boolean;
  isOpen?: boolean;
  fromDashboard?: boolean;
  conversationAttachments?: Attachment[];
  actions?: JSX.Element;
  channel?: ConversationChannel
};

const Schema = z.object({
  query: z.string().optional(),
});

function ChatBox({
  messages,
  onSubmit,
  messageTemplates,
  initialMessage,
  initialMessages,
  readOnly,
  renderAfterMessages,
  disableWatermark,
  agentIconUrl,
  isLoadingConversation,
  hasMoreMessages,
  topSettings,
  emptyComponent,
  handleLoadMoreMessages,
  handleEvalAnswer,
  handleImprove,
  handleSourceClick,
  handleAbort,
  hideInternalSources,
  renderBottom,
  userImgUrl,
  organizationId,
  refreshConversation,
  metadata,
  withFileUpload,
  draftReplyInput,
  withSources,
  isAiEnabled,
  autoFocus,
  agentIconStyle,
  fromInbox,
  isStreaming,
  conversationAttachments,
  fromDashboard,
  isOpen,
  actions,
  channel
}: ChatBoxProps) {
  const chatboxRef = React.useRef<HTMLDivElement>(null);
  const scrollableRef = React.useRef<HTMLDivElement>(null);
  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = React.useCallback(
    debounce(async () => {
      requestAnimationFrame(() => {
        scrollableRef?.current?.scrollTo({
          top: scrollableRef?.current?.scrollHeight + 100,
          behavior: 'smooth',
        });
      });
    }, 50),
    []
  );

  const [state, setState] = useStateReducer({
    isLoading: false,
    isInKeyboadComposition: false,
    isLastMsgInView: true,
    firstMsgs: [] as ChatMessage[],
    files: [] as File[],
    isTextAreaExpanded: false,
    hideTemplateMessages: false,
    wordCount: 0,
    attachmentsForAI: [] as string[],
    showAgentTyping: false,
  });

  const setFiles = useCallback((files: File[]) => {
    return setState({ files });
  }, []);

  const { isDragOver } = useFileUpload({
    ref: chatboxRef,
    changeCallback: setFiles,
  });

  const methods = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {},
  });

  const toogleKeyboardComposition = useCallback(() => {
    setState({ isInKeyboadComposition: !state.isInKeyboadComposition });
  }, [state.isInKeyboadComposition]);

  const submit = async ({ query }: z.infer<typeof Schema>) => {

    if (state.isLoading || state.isInKeyboadComposition) {
      return;
    }
    if (!query && state.files.length === 0 && !query && state?.attachmentsForAI.length === 0) {
      return;
    }


    try {
      setState({
        isLoading: true,
        hideTemplateMessages: true,
        isTextAreaExpanded: false,
      });

      if (isAiEnabled || isAiEnabled == undefined) {
        setTimeout(() => {
          setState({
            showAgentTyping: true,
          });
          scrollToBottom();
        }, 300);
      }

      methods.reset();

      await onSubmit({
        query: query || '',
        files: state.files,
        attachmentsForAI: state.attachmentsForAI || [],
      });

      setState({
        files: [],
        attachmentsForAI: []
      });
    } catch (err) {
      console.log(err)
    } finally {
      setState({ isLoading: false, showAgentTyping: false });
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      const msgs = (initialMessages || []).map(
        (each) =>
        ({
          from: 'agent',
          message: each?.message?.trim?.(),
          iconUrl: agentIconUrl,
          component: each?.component,
          approvals: [],
        } as ChatMessage)
      );

      setState({ firstMsgs: msgs });
    }, 0);

    return () => {
      clearTimeout(t);
    };
  }, [initialMessages, agentIconUrl]);

  useEffect(() => {
    if (
      messages?.[messages?.length - 1]?.message?.length - state.wordCount >
      45
    ) {
      scrollableRef.current?.scrollTo({
        // behavior: 'smooth',
        top: scrollableRef.current?.scrollHeight + 100,
      });
      setState({
        wordCount: messages?.[messages?.length - 1]?.message?.length,
      });
    }
  }, [messages?.[messages?.length - 1]?.message?.length]);

  const conversationId = messages?.[0]?.conversationId;

  useEffect(() => {
    scrollableRef.current?.scrollTo({
      behavior: 'smooth',
      top: scrollableRef.current?.scrollHeight + 100,
    });
    setState({ wordCount: 0 });
  }, [messages.length, isStreaming]);

  useEffect(() => {
    scrollableRef.current?.scrollTo({
      top: scrollableRef.current?.scrollHeight + 100,
    });

    setState({ isLastMsgInView: true, wordCount: 0 });
  }, [conversationId, isOpen]);

  useEffect(() => {
    const t = setTimeout(() => {
      const msgs = (initialMessages || []).map(
        (each) =>
        ({
          from: 'agent',
          message: each?.message?.trim?.(),
          iconUrl: agentIconUrl,
          component: each?.component,
          approvals: [],
        } as ChatMessage)
      );

      setState({ firstMsgs: msgs });
    }, 0);

    return () => {
      clearTimeout(t);
    };
  }, [initialMessages, agentIconUrl]);

  const handleOnDraftReply = useCallback(
    (query: string) => {
      methods.setValue('query', query, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [methods.setValue]
  );

  const isLastMessageInViewport = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current!;

    if (scrollHeight === clientHeight) {
      setState({ isLastMsgInView: true });
    } else {
      const scrollPercentage =
        (scrollTop / (scrollHeight - clientHeight)) * 100;

      setState({ isLastMsgInView: scrollPercentage > 85 ? true : false });
    }
  }, []);

  useEffect(() => {
    const scrollableDiv = scrollableRef.current;

    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', isLastMessageInViewport);
    }

    return () => {
      if (scrollableDiv) {
        scrollableDiv.removeEventListener('scroll', isLastMessageInViewport);
      }
    };
  }, [scrollableRef.current?.ownerDocument]);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm; codecs=opus',
      });

      let tempAudioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          tempAudioChunks.push(event.data);
          console.log('Fragmento de audio recibido: ', event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(tempAudioChunks, { type: 'audio/webm' });

        if (audioBlob.size > 0) {
          console.log('Blob de audio creado: ', audioBlob);

          const audioFile = new File([audioBlob], `record-${Date.now()}.webm`, {
            type: 'audio/webm',
          });

          const nonAudioFiles = state.files.filter(
            (file) => !file.type.startsWith('audio/')
          );

          setState({
            files: [...nonAudioFiles],
          });

          try {
            setIsUploading(true);

            const transcription = await transcribeAudio(audioBlob);

            setTimeout(() => {
              setState({
                showAgentTyping: true,
              });
              scrollToBottom();
            }, 300);

            setState({
              isLoading: true,
              hideTemplateMessages: true,
              isTextAreaExpanded: false,
            });

            methods.reset();

            await onSubmit({
              query: transcription,
              files: [...nonAudioFiles, audioFile],
              attachmentsForAI: state.attachmentsForAI,
            });
            setIsUploading(false);
            setState({
              files: [],
              attachmentsForAI: []
            });
          } catch (error) {
            console.error('Error en la transcripción o envío:', error);
          } finally {
            setState({ isLoading: false, showAgentTyping: false });
          }
        } else {
          console.error('El tamaño del blob es 0, no se puede transcribir.');
        }

        setIsRecording(false);
      };
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  return (
    <Stack
      ref={chatboxRef}
      className="chatsappai-chatbox"
      direction={'column'}
      gap={2}
      sx={{
        display: 'flex',
        flex: 1,
        flexBasis: '100%',
        maxWidth: '700px',
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        minHeight: '100%',

        paddingRight: '0.5rem',
        paddingLeft: '0.5rem',
        mx: 'auto',
        gap: 0,
        position: 'relative',
      }}
    >
      {isDragOver && (
        <Stack
          sx={(t) => ({
            position: 'absolute',
            pointerEvents: 'none',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
          })}
          className="bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/80"
        >
          <Card color="primary">
            <Stack
              sx={{ justifyContent: 'center', alignItems: 'center' }}
              gap={1}
            >
              <ImageRoundedIcon sx={{ opacity: 0.5, fontSize: 32 }} />

              <Typography component="label" level="body-sm" color="neutral">
                Suelte los archivos aquí
              </Typography>
            </Stack>
          </Card>
        </Stack>
      )}
      {typeof isAiEnabled === 'boolean' &&
        !isAiEnabled &&
        messages?.length > 0 && (
          <Chip
            color="danger"
            sx={{
              left: '50%',
              transform: 'translateX(-50%)',
              top: 10,
              position: 'absolute',
              zIndex: 1,
              px: 3,
              py: 1,
            }}
            variant="soft"
            size="sm"
            startDecorator={<SmartToyRoundedIcon />}
          >
            Apagado
          </Chip>
        )}

      <Stack
        ref={scrollableRef}
        direction={'column'}
        sx={{
          boxSizing: 'border-box',
          maxWidth: '100%',
          width: '100%',
          mx: 'auto',
          flex: 1,
          maxHeight: '100%',
          overflowY: 'auto',
          pb: 4,
          pt: 2,
          mb: -2,

          // Scrollbar
          scrollbarColor: 'rgba(0,0,0,.1) transparent',
          '&::-webkit-scrollbar': {
            width: '0.4em',
          },
          '&::-webkit-scrollbar-track': {
            display: 'none',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,.0)',
            borderRadius: '20px',
          },
        }}
      >
        <InfiniteScroll
          isReverse
          useWindow={false}
          getScrollParent={() => scrollableRef.current}
          loadMore={handleLoadMoreMessages ? handleLoadMoreMessages : () => { }}
          hasMore={hasMoreMessages}
          loader={
            Array(1)
              .fill(0)
              .map((_, index) => (
                <Stack key={index} direction={'row'} gap={2} mb={2}>
                  <Skeleton variant="circular" width={34} height={34} />
                  <Stack gap={1} sx={{ width: '100%' }}>
                    <Skeleton variant="text" width={'97%'} />
                    <Skeleton variant="text" width={'92%'} />
                    <Skeleton variant="text" width={'95%'} />
                  </Stack>
                </Stack>
              )) as any
          }
        >
          <Stack gap={2}>
            <AnimateMessagesOneByOne
              messages={state.firstMsgs}
              shouldAnimate={messages.length < 2}
            />

            {isLoadingConversation && messages?.length <= 0 && (
              <Stack gap={2}>
                {Array(1)
                  .fill(0)
                  .map((_, index) => (
                    <Stack key={index} direction={'row'} gap={2}>
                      <Skeleton variant="circular" width={34} height={34} />
                      <Stack gap={1} sx={{ width: '100%' }}>
                        <Skeleton variant="text" width={'97%'} />
                        <Skeleton variant="text" width={'92%'} />
                        <Skeleton variant="text" width={'95%'} />
                      </Stack>
                    </Stack>
                  ))}
              </Stack>
            )}

            {messages?.length <= 0 && !isLoadingConversation && emptyComponent}

            {(!isLoadingConversation || messages?.length > 0) &&
              messages?.map((each, index) => (
                <div key={index}>
                  {each.attachments?.some((attachment) =>
                    attachment.mimeType.startsWith('audio/')
                  ) ? (
                    <Stack
                      sx={{
                        width: '100%',
                        maxWidth: '100%',
                        alignItems: 'center',
                      }}
                      direction={'row'}
                      gap={1}
                    >
                      <Avatar
                        size="sm"
                        variant="outlined"
                        src={
                          each.from === 'agent'
                            ? agentIconUrl
                            : userImgUrl || each.iconUrl
                        }
                      ></Avatar>
                      <audio controls>
                        <source
                          src={
                            each.attachments.find((attachment) =>
                              attachment.mimeType.startsWith('audio/')
                            )?.url
                          }
                          type="audio/webm"
                        />
                        Tu navegador no soporta la reproducción de audio.
                      </audio>
                    </Stack>
                  ) : (
                    <Message
                      index={index}
                      message={{
                        ...each,
                        iconUrl:
                          each.from === 'agent'
                            ? agentIconUrl
                            : userImgUrl || each.iconUrl,
                      }}
                      withSources={withSources}
                      hideInternalSources={hideInternalSources}
                      handleEvalAnswer={handleEvalAnswer}
                      handleImprove={handleImprove}
                      handleSourceClick={handleSourceClick}
                      organizationId={organizationId!}
                    />
                  )}
                </div>
              ))}

            {isAiEnabled &&
              !isStreaming &&
              !state.isLoading &&
              messages[messages.length - 1]?.from === 'agent' &&
              actions}

            {/* Show loader when file uploading (otherwise agent typing ) */}
            {!isAiEnabled &&
              state.files?.length > 0 &&
              state.isLoading &&
              state.showAgentTyping && <Loader />}

            {(isAiEnabled || isAiEnabled == undefined) &&
              state.showAgentTyping &&
              messages?.[messages?.length - 1]?.from === 'human' && (
                <Message
                  cardProps={{
                    variant: 'plain',
                    sx: {
                      background: 'none',
                      p: 0,
                    },
                  }}
                  message={{
                    from: 'agent',
                    message: '',
                    component: <Bubbles />,
                    approvals: [],
                  }}
                />
              )}
          </Stack>
        </InfiniteScroll>
      </Stack>

      {renderAfterMessages}

      {readOnly && !state.isLastMsgInView && (
        <IconButton
          variant="soft"
          color="neutral"
          size="sm"
          className="absolute rounded-full right-1 bottom-2 z-99"
          onClick={() =>
            scrollableRef.current?.scrollTo({
              behavior: 'smooth',
              top: scrollableRef.current?.scrollHeight + 110,
            })
          }
        >
          <KeyboardDoubleArrowDownIcon />
        </IconButton>
      )}
      {!readOnly && (
        <form
          style={{
            maxWidth: '100%',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',

            marginTop: 'auto',
            overflow: 'visible',
            background: 'none',
            justifyContent: 'center',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
          onCompositionStart={toogleKeyboardComposition}
          onCompositionEnd={toogleKeyboardComposition}
          onSubmit={(e) => {
            e.stopPropagation();

            methods.handleSubmit(submit)(e);
          }}
        >
          <Stack gap={1}>
            {isAiEnabled &&
              conversationAttachments &&
              conversationAttachments?.length > 0 && (
                <Select
                  size="sm"
                  slotProps={{
                    listbox: {
                      sx: {
                        zIndex: zIndex + 1,
                      },
                    },
                  }}
                  sx={{ mr: 'auto', mb: 0.5 }}
                  startDecorator={<ArticleTwoToneIcon />}
                  placeholder="Usar archivo subido"
                  className="max-w-full truncate font-bold text-xs"
                  multiple
                  color={
                    state.attachmentsForAI?.length > 0 ? 'warning' : 'neutral'
                  }
                  variant={
                    state.attachmentsForAI?.length > 0 ? 'soft' : 'plain'
                  }
                  onChange={(_, values) => {
                    setState({ attachmentsForAI: values as string[] });
                  }}
                >
                  {conversationAttachments.map((each) => (
                    <Option key={each.id} value={each.id}>
                      {each.name}
                    </Option>
                  ))}
                </Select>
              )}

            {(messageTemplates?.length || 0) > 0 &&
              state.files?.length <= 0 && (
                <Stack
                  direction="row"
                  gap={1}
                  sx={{
                    flexWrap: 'nowrap',
                    mb: 1,
                    overflowX: 'auto',
                    maxWidth: '100%',

                    scrollbarColor: 'rgba(0,0,0,.1) transparent',
                    '&::-webkit-scrollbar': {
                      height: '0.4em',
                    },
                    '&::-webkit-scrollbar-track': {
                      display: 'none',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,.0)',
                      borderRadius: '20px',
                    },
                  }}
                >
                  {messageTemplates?.map((each, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant="soft"
                      onClick={() => submit({ query: each })}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {each}
                    </Button>
                  ))}
                </Stack>
              )}
          </Stack>
          <Stack width="100%" gap={0.5}>
            {topSettings}
            {state.files?.length > 0 && (
              <Stack gap={1} sx={{ mb: 1 }}>
                <Stack direction="row" sx={{ flexWrap: 'wrap' }} gap={1}>
                  {state.files.map((each, index) => (
                    <Chip
                      size="lg"
                      key={each.name}
                      variant="soft"
                      color="primary"
                      endDecorator={
                        <ChipDelete
                          disabled={state.isLoading}
                          onDelete={() =>
                            setState({
                              files: state.files.filter((_, i) => i !== index),
                            })
                          }
                        />
                      }
                    >
                      {each.name}
                    </Chip>
                  ))}
                </Stack>
                {/* <Stack gap={1}>
                  {fromDashboard && (
                    <Alert
                      color="primary"
                      size="sm"
                      startDecorator={<ErrorRoundedIcon />}
                    >
                      To support image processing, use a vision compatible LLM
                      (GPT-4 Turbo, Claude 3)
                    </Alert>
                  )}
                </Stack> */}
              </Stack>
            )}

            {
              !['api', 'dashboard'].includes(channel ?? '') && (
                <Stack sx={{ position: 'relative' }} mb={2}>
                  {!state.isLastMsgInView && (
                    <IconButton
                      variant="soft"
                      color="neutral"
                      size="sm"
                      sx={{
                        position: 'absolute',
                        right: 0,
                        borderRadius: '50%',
                        maxWidth: '12px',
                        maxHeight: '12px',
                        top: '-36px',
                        zIndex: 99,
                      }}
                      onClick={() =>
                        scrollableRef.current?.scrollTo({
                          behavior: 'smooth',
                          top: scrollableRef.current?.scrollHeight + 110,
                        })
                      }
                    >
                      <KeyboardDoubleArrowDownIcon />
                    </IconButton>
                  )}
                  <Textarea
                    variant="outlined"
                    autoFocus={!!autoFocus}
                    slotProps={{
                      textarea: {
                        id: 'chatbox-input',
                        ref: textAreaRef,
                        sx: {
                          my: 'auto',
                        },
                      },
                    }}
                    maxRows={24}
                    minRows={state.isTextAreaExpanded ? 18 : 1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        methods.handleSubmit(submit)(e);
                      }
                    }}
                    sx={(t) => ({
                      ...(state.isTextAreaExpanded
                        ? {
                          position: 'absolute',
                          bottom: 0,
                          zIndex: 1,
                        }
                        : {}),
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      '.MuiTextarea-endDecorator': {
                        marginBlock: 0,
                        marginTop: 'auto',
                      },
                      '.MuiTextarea-startDecorator': {
                        marginBlockEnd: 0,
                        marginTop: 'auto',
                      },
                    })}
                    startDecorator={
                      <Stack
                        direction={'row'}
                        justifyContent={'space-between'}
                        sx={{ width: '100%' }}
                      >
                        <IconButton
                          variant="plain"
                          sx={{ maxHeight: '100%' }}
                          size="sm"
                          onClick={() =>
                            setState({
                              isTextAreaExpanded: !state.isTextAreaExpanded,
                            })
                          }
                        >
                          {state.isTextAreaExpanded ? (
                            <UnfoldLessOutlinedIcon />
                          ) : (
                            <UnfoldMoreOutlinedIcon />
                          )}
                        </IconButton>
                      </Stack>
                    }
                    endDecorator={
                      <Stack
                        direction={'row'}
                        justifyContent={'space-between'}
                        sx={{ width: '100%' }}
                        spacing={1}
                      >
                        {draftReplyInput &&
                          React.cloneElement(draftReplyInput, {
                            onReply: handleOnDraftReply,
                            inputRef: textAreaRef,
                          })}

                        {withFileUpload && (
                          <FileUploader
                            changeCallback={async (files) => {
                              // Capturo el archivo de audio.
                              const audioFile = files.find((file) => {
                                const fileType = file.type || '';
                                return fileType.startsWith('audio/');
                              });

                              if (audioFile) {
                                const transcription = await transcribeAudio(
                                  audioFile
                                );

                                methods.setValue('query', transcription, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              } else {
                                console.log(
                                  'No se detectó ningún archivo de audio'
                                );
                              }
                              setState({ files });
                            }}
                            accept={AcceptedMimeTypes}
                          />
                        )}

                        <Stack direction="row" sx={{ ml: 'auto' }}>
                          {isUploading ? (
                            <IconButton
                              size="sm"
                              sx={{ maxHeight: '100%' }}
                              disabled
                            >
                              <Loader rootProps={{ style: { width: '24px' } }} />
                            </IconButton>
                          ) : !isRecording ? (
                            <IconButton
                              size="sm"
                              sx={{ maxHeight: '90%' }}
                              color="neutral"
                              variant="soft"
                              onClick={handleStartRecording}
                            >
                              <MicrophoneIcon width={20} color="gray" />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="sm"
                              sx={{ maxHeight: '100%' }}
                              color="danger"
                              variant="soft"
                              onClick={handleStopRecording}
                            >
                              <StopRoundedIcon />
                            </IconButton>
                          )}
                        </Stack>

                        <Stack direction="row" sx={{ ml: 'auto' }}>
                          {!state.isLoading && (
                            <IconButton
                              size="sm"
                              type="submit"
                              disabled={
                                state.isLoading ||
                                (!methods.formState.isValid && state.files.length === 0)
                              }
                              sx={{ maxHeight: '100%' }}
                              color="primary"
                              variant="soft"
                            >
                              <SendRoundedIcon />
                            </IconButton>
                          )}

                          {state.isLoading && handleAbort && (
                            <IconButton
                              size="sm"
                              color="danger"
                              sx={{ maxHeight: '100%' }}
                              variant={'soft'}
                              onClick={() => {
                                handleAbort?.();
                              }}
                            >
                              <StopRoundedIcon />
                            </IconButton>
                          )}
                        </Stack>
                      </Stack>
                    }
                    {...methods.register('query')}
                    onBlur={(e) => { }}
                  />
                </Stack>
              )
            }


            <Stack>
              <Stack
                direction="row"
                sx={{
                  position: 'relative',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: '100%',
                  overflowX: 'auto',
                  // Scrollbar
                  '&::-webkit-scrollbar': {
                    height: '0',
                  },
                }}
              >
                {renderBottom}
              </Stack>
              {!disableWatermark && (
                <Stack sx={{ mt: 1 }}>
                  <PoweredBy />
                </Stack>
              )}
            </Stack>
          </Stack>
        </form>
      )
      }
    </Stack >
  );
}

export default ChatBox;
