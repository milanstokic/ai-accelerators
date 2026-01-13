import React from 'react';
import { makeStyles, Box, Typography, Avatar, CircularProgress } from '@material-ui/core';
import PersonIcon from '@material-ui/icons/Person';
import SmartToyIcon from '@material-ui/icons/EmojiObjects';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../../api';
import { SourceCitation } from '../SourceCitation';

const useStyles = makeStyles(theme => ({
  messageContainer: {
    display: 'flex',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(0.5),
  },
  userMessage: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  userAvatar: {
    backgroundColor: theme.palette.primary.main,
  },
  assistantAvatar: {
    backgroundColor: theme.palette.secondary.main,
  },
  messageContent: {
    maxWidth: '85%',
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
  },
  userContent: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderTopRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderTopLeftRadius: 4,
  },
  markdown: {
    '& p': {
      margin: 0,
      marginBottom: theme.spacing(1),
      '&:last-child': {
        marginBottom: 0,
      },
    },
    '& ul, & ol': {
      margin: 0,
      marginBottom: theme.spacing(1),
      paddingLeft: theme.spacing(2.5),
    },
    '& li': {
      marginBottom: theme.spacing(0.5),
    },
    '& code': {
      backgroundColor: theme.palette.action.hover,
      padding: '2px 6px',
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: '0.85em',
    },
    '& pre': {
      backgroundColor: theme.palette.action.hover,
      padding: theme.spacing(1.5),
      borderRadius: theme.shape.borderRadius,
      overflow: 'auto',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
      },
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& strong': {
      fontWeight: 600,
    },
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  timestamp: {
    fontSize: '0.7rem',
    color: theme.palette.text.hint,
    marginTop: theme.spacing(0.5),
  },
}));

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const classes = useStyles();
  const isUser = message.role === 'user';

  return (
    <Box
      className={`${classes.messageContainer} ${isUser ? classes.userMessage : ''}`}
    >
      <Avatar
        className={`${classes.avatar} ${isUser ? classes.userAvatar : classes.assistantAvatar}`}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
      </Avatar>
      
      <Box
        className={`${classes.messageContent} ${isUser ? classes.userContent : classes.assistantContent}`}
      >
        {message.isLoading ? (
          <Box className={classes.loadingContainer}>
            <CircularProgress size={16} />
            <Typography variant="body2">Thinking...</Typography>
          </Box>
        ) : (
          <>
            <Box className={classes.markdown}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
            
            {!isUser && message.sources && message.sources.length > 0 && (
              <SourceCitation sources={message.sources} />
            )}
          </>
        )}
      </Box>
    </Box>
  );
};
