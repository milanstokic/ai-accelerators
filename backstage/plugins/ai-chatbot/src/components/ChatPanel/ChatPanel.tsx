import React, { useState, useRef, useEffect } from 'react';
import {
  makeStyles,
  Box,
  Drawer,
  IconButton,
  Typography,
  Tooltip,
  Fab,
  Chip,
  Fade,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ChatIcon from '@material-ui/icons/Chat';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import SmartToyIcon from '@material-ui/icons/EmojiObjects';
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from '../ChatMessage';
import { ChatInput } from '../ChatInput';

const DRAWER_WIDTH = 400;

const useStyles = makeStyles(theme => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: theme.zIndex.drawer - 1,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
    },
  },
  fabIcon: {
    marginRight: theme.spacing(0.5),
  },
  drawer: {
    width: DRAWER_WIDTH,
    flexShrink: 0,
  },
  drawerPaper: {
    width: DRAWER_WIDTH,
    boxShadow: theme.shadows[16],
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    color: theme.palette.primary.contrastText,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  headerIcon: {
    fontSize: '1.5rem',
  },
  headerActions: {
    display: 'flex',
    gap: theme.spacing(0.5),
  },
  headerButton: {
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
  },
  welcomeContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: theme.spacing(3),
  },
  welcomeIcon: {
    fontSize: '4rem',
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
    opacity: 0.8,
  },
  welcomeTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  welcomeText: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    maxWidth: 280,
  },
  suggestedQueries: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    width: '100%',
    maxWidth: 300,
  },
  suggestedChip: {
    justifyContent: 'flex-start',
    height: 'auto',
    padding: theme.spacing(1, 1.5),
    '& .MuiChip-label': {
      whiteSpace: 'normal',
      textAlign: 'left',
    },
  },
  messagesContainer: {
    flex: 1,
  },
  messagesEnd: {
    float: 'left',
    clear: 'both',
  },
  betaChip: {
    marginLeft: theme.spacing(1),
    height: 20,
    fontSize: '0.65rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'inherit',
  },
}));

const SUGGESTED_QUERIES = [
  'What templates are available?',
  'How do I get started with RAG?',
  'What SDK modules can I use?',
  'How do I deploy to Cloud Run?',
];

export const ChatPanel: React.FC = () => {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSuggestedQuery = (query: string) => {
    sendMessage(query);
  };

  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Floating Action Button */}
      <Fade in={!isOpen}>
        <Fab
          className={classes.fab}
          color="primary"
          variant="extended"
          onClick={handleToggle}
          aria-label="Open AI Assistant"
        >
          <ChatIcon className={classes.fabIcon} />
          Ask AI
        </Fab>
      </Fade>

      {/* Chat Drawer */}
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="right"
        open={isOpen}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        {/* Header */}
        <Box className={classes.header}>
          <Box className={classes.headerTitle}>
            <SmartToyIcon className={classes.headerIcon} />
            <Typography variant="h6">AI Assistant</Typography>
            <Chip label="Beta" size="small" className={classes.betaChip} />
          </Box>
          <Box className={classes.headerActions}>
            {messages.length > 0 && (
              <Tooltip title="Clear conversation">
                <IconButton
                  className={classes.headerButton}
                  onClick={clearMessages}
                  size="small"
                  aria-label="Clear conversation"
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Close">
              <IconButton
                className={classes.headerButton}
                onClick={handleToggle}
                size="small"
                aria-label="Close chat"
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Content */}
        <Box className={classes.content}>
          {showWelcome ? (
            <Box className={classes.welcomeContainer}>
              <SmartToyIcon className={classes.welcomeIcon} />
              <Typography variant="h6" className={classes.welcomeTitle}>
                How can I help you?
              </Typography>
              <Typography variant="body2" className={classes.welcomeText}>
                Ask me anything about the AI Accelerators platform. I can help
                you find documentation, understand components, and get started
                quickly.
              </Typography>
              <Box className={classes.suggestedQueries}>
                <Typography variant="caption" color="textSecondary">
                  Try asking:
                </Typography>
                {SUGGESTED_QUERIES.map((query) => (
                  <Chip
                    key={query}
                    label={query}
                    variant="outlined"
                    className={classes.suggestedChip}
                    onClick={() => handleSuggestedQuery(query)}
                    clickable
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Box className={classes.messagesContainer}>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} className={classes.messagesEnd} />
            </Box>
          )}
        </Box>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </Drawer>
    </>
  );
};

/**
 * Sidebar component to be added to the Backstage root
 */
export const AiChatbotSidebar: React.FC = () => {
  return <ChatPanel />;
};
