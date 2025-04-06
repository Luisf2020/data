import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import React, { memo } from 'react';
import dayjs from '@chaindesk/lib/date';
import SchoolTwoToneIcon from '@mui/icons-material/SchoolTwoTone';
import filterInternalSources from '@chaindesk/lib/filter-internal-sources';
import ChatMessageApproval from './ChatMessageApproval';
import ChatMessageAttachment from './ChatMessageAttachment';
import CopyButton from '@chaindesk/ui/CopyButton';
import SourceComponent from './Source';
import { ChatMessage } from '@chaindesk/lib/types';
import Markdown from '@chaindesk/ui/Markdown';
import ChatMessageCard from './ChatMessageCard';
import { cn } from '../utils/cn';
import EvalButton from './EvalButton';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import { motion } from 'framer-motion';
import BubblesLoading from './Bubbles';
import { CardProps, useColorScheme } from '@mui/joy';

type Props = {
  index?: number;
  message: ChatMessage;
  withSources?: boolean;
  hideInternalSources?: boolean;
  handleEvalAnswer?: any;
  handleImprove?: any;
  handleSourceClick?: any;
  refreshConversation?: any;
  organizationId?: string;
  withTextAnimation?: boolean;
  onTextAnimationComplete?: any;
  shouldAnimate?: boolean;
  cardProps?: CardProps;
};

function ChatMessageComponent({
  index = 0,
  message,
  withSources,
  hideInternalSources,
  withTextAnimation,
  onTextAnimationComplete,
  shouldAnimate = true,
  cardProps,
  ...props
}: Props) {
  const { mode, setMode } = useColorScheme();

  return (
    <Stack
      component={motion.div}
      sx={{
        width: '100%',
        maxWidth: '100%',
        justifyContent: message?.from === 'human' ? 'flex-end' : 'flex-start',
        ml: message?.from === 'human' ? 'auto' : '0',
        mr: message?.from === 'agent' ? 'auto' : '0',
      }}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
    >
      <Stack
        sx={{
          width: '100%',
          maxWidth: '100%',
        }}
        direction={'row'}
        justifyContent={message?.from === 'human' ? 'flex-end' : 'flex-start'}
        gap={1}
      >
        {/* Mensaje principal */}
        <Stack gap={1} sx={{ maxWidth: '100%', overflow: 'hidden' }}>
          {message?.step?.type === 'tool_call' && <BubblesLoading />}

          {message?.approvals?.length > 0 && (
            <Stack gap={1}>
              {message?.approvals?.map((approval) => (
                <ChatMessageApproval
                  key={approval.id}
                  approval={approval}
                  showApproveButton={!!props.organizationId}
                  onSumitSuccess={props.refreshConversation}
                />
              ))}
            </Stack>
          )}

          {(message?.message || message?.component) && (
            <Stack gap={0.7}>
              <ChatMessageCard
                className={cn(
                  message?.from === 'agent' ? 'message-agent' : 'message-human'
                )}
                sx={{
                  ml: message?.from === 'human' ? 'auto' : '0',
                  mr: message?.from === 'agent' ? 'auto' : '0',
                  backgroundColor:
                    message?.from === 'human'
                      ? mode === 'light'
                        ? 'rgba(76, 175, 80, 0.3)'
                        : 'rgba(76, 175, 80, 0.3)'
                      : mode === 'light'
                        ? 'rgba(200, 200, 200, 0.5)'
                        : 'rgba(97, 97, 97, 0.3)',
                  color:
                    message?.from === 'human'
                      ? mode === 'light'
                        ? '#4caf50'
                        : '#4caf50'
                      : '#e0e0e0',
                  borderRadius: '8px',
                  padding: '10px',
                  ...cardProps?.sx,
                }}
                {...cardProps}
              >
                <Markdown
                  animated={withTextAnimation}
                  onAnimateComplete={onTextAnimationComplete}
                >
                  {message?.message}
                </Markdown>

                {message?.component}

                {withSources && (
                  <Stack direction="row" justifyContent={'space-between'}>
                    {((hideInternalSources
                      ? filterInternalSources(message?.sources!)
                      : message?.sources
                    )?.length || 0) > 0 && (
                        <Box
                          sx={{
                            mt: 2,
                            width: '100%',
                            maxWidth: '100%',
                          }}
                        >
                          <details>
                            <summary
                              className="cursor-pointer"
                              style={{
                                color: mode === 'light' ? '#000' : '#e0e0e0',
                              }}
                            >
                              Fuentes
                            </summary>
                            <Stack direction={'column'} gap={1} sx={{ pt: 1 }}>
                              {(hideInternalSources
                                ? filterInternalSources(message?.sources!)
                                : message?.sources
                              )?.map((source) => (
                                <SourceComponent
                                  key={source.chunk_id}
                                  source={source}
                                  onClick={props.handleSourceClick}
                                />
                              ))}
                            </Stack>
                          </details>
                        </Box>
                      )}
                  </Stack>
                )}
              </ChatMessageCard>

              <Stack gap={1}>
                <Stack
                  gap={1}
                  direction="row"
                  sx={{
                    pl: 1,
                  }}
                >
                  {message?.fromName && (
                    <Typography level="body-xs" sx={{ opacity: '0.8' }}>
                      {message?.fromName}
                    </Typography>
                  )}
                  {message?.createdAt && (
                    <Typography
                      level="body-xs"
                      sx={{ opacity: '0.8', fontStyle: 'italic' }}
                    >
                      {`${dayjs((message as any)?.createdAt).fromNow()}`}
                    </Typography>
                  )}

                  {message?.from === 'agent' &&
                    message?.id &&
                    !message?.disableActions &&
                    !!message?.message && (
                      <Stack
                        direction="row"
                        sx={{
                          marginLeft: 'auto',
                          mt: -0.5,
                        }}
                      >
                        <CopyButton text={message?.message} />

                        <EvalButton
                          messageId={message?.id!}
                          handleEvalAnswer={props.handleEvalAnswer}
                          eval={message?.eval}
                        />

                        {props.handleImprove && (
                          <Button
                            size="sm"
                            variant="plain"
                            color="neutral"
                            startDecorator={<SchoolTwoToneIcon />}
                            onClick={() =>
                              props.handleImprove?.(message, index)
                            }
                          >
                            Mejorar
                          </Button>
                        )}
                      </Stack>
                    )}
                </Stack>
              </Stack>
            </Stack>
          )}

          {(message?.attachments?.length || 0) > 0 && (
            <Stack gap={1}>
              {message?.attachments?.map((each) => (
                <ChatMessageAttachment key={message?.id} attachment={each} />
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

export default memo(ChatMessageComponent);