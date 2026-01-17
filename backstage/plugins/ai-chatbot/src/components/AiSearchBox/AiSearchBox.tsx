import React, { useState, useRef, useEffect } from 'react';
import {
  makeStyles,
  Box,
  InputBase,
  IconButton,
  Typography,
  CircularProgress,
  Collapse,
  Paper,
  Chip,
  Link,
  Tooltip,
  Fade,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import SendIcon from '@material-ui/icons/Send';
import SmartToyIcon from '@material-ui/icons/EmojiObjects';
import CloseIcon from '@material-ui/icons/Close';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../../hooks/useChat';
import { Source } from '../../api';

const useStyles = makeStyles(theme => ({
  container: {
    maxWidth: '700px',
    width: '100%',
    margin: theme.spacing(2, 'auto'),
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[2],
    padding: '12px 20px',
    borderRadius: '50px',
    transition: 'box-shadow 0.2s ease-in-out, border-radius 0.2s ease-in-out',
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  searchBarActive: {
    borderRadius: '24px 24px 0 0',
    boxShadow: theme.shadows[4],
  },
  searchIcon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(1.5),
  },
  aiIcon: {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1.5),
    animation: '$pulse 2s infinite',
  },
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.6 },
    '100%': { opacity: 1 },
  },
  searchInput: {
    flex: 1,
    fontSize: '1rem',
    color: theme.palette.text.primary,
    '&::placeholder': {
      color: theme.palette.text.secondary,
    },
  },
  sendButton: {
    marginLeft: theme.spacing(1),
    color: theme.palette.primary.main,
    '&:disabled': {
      color: theme.palette.action.disabled,
    },
  },
  resultPanel: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: '0 0 24px 24px',
    boxShadow: theme.shadows[4],
    overflow: 'hidden',
    marginTop: -1,
  },
  resultContent: {
    padding: theme.spacing(2, 3),
    maxHeight: '400px',
    overflow: 'auto',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1.5),
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  resultHeaderTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
  markdown: {
    '& p': {
      margin: 0,
      marginBottom: theme.spacing(1.5),
      lineHeight: 1.6,
      '&:last-child': {
        marginBottom: 0,
      },
    },
    '& ul, & ol': {
      margin: 0,
      marginBottom: theme.spacing(1.5),
      paddingLeft: theme.spacing(3),
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
      marginBottom: theme.spacing(1.5),
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
  sourcesContainer: {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  sourcesTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  sourceChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  sourceChip: {
    height: 'auto',
    padding: theme.spacing(0.5, 0),
    '& .MuiChip-label': {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.5),
    },
  },
  sourceIcon: {
    fontSize: '0.875rem',
  },
  suggestedQueries: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  suggestedChip: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  betaChip: {
    marginLeft: theme.spacing(0.5),
    height: 18,
    fontSize: '0.6rem',
  },
}));

const SUGGESTED_QUERIES = [
  'How do I get started?',
  'What templates are available?',
  'How to deploy to Cloud Run?',
];

interface AiSearchBoxProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Show suggested queries below the search box */
  showSuggestions?: boolean;
}

/**
 * AI-powered search box component for the homepage
 * Provides inline AI responses with source citations
 */
export const AiSearchBox: React.FC<AiSearchBoxProps> = ({
  placeholder = 'Ask AI anything about the platform...',
  showSuggestions = true,
}) => {
  const classes = useStyles();
  const [query, setQuery] = useState('');
  const [showResult, setShowResult] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the latest assistant message
  const latestResponse = messages.filter(m => m.role === 'assistant').slice(-1)[0];

  const handleSubmit = async (searchQuery?: string) => {
    const queryToSend = searchQuery || query;
    if (!queryToSend.trim() || isLoading) return;
    
    clearMessages();
    setShowResult(true);
    await sendMessage(queryToSend);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowResult(false);
    setQuery('');
    clearMessages();
  };

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
    handleSubmit(suggestedQuery);
  };

  // Focus input when clicking on search bar
  const handleSearchBarClick = () => {
    inputRef.current?.focus();
  };

  return (
    <Box className={classes.container}>
      {/* Search Bar */}
      <Box
        className={`${classes.searchBar} ${showResult ? classes.searchBarActive : ''}`}
        onClick={handleSearchBarClick}
        role="search"
      >
        {isLoading ? (
          <CircularProgress size={20} className={classes.aiIcon} />
        ) : (
          <Tooltip title="AI-powered search">
            <SmartToyIcon className={classes.aiIcon} />
          </Tooltip>
        )}
        <InputBase
          ref={inputRef}
          placeholder={placeholder}
          className={classes.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Tooltip title="Search">
          <span>
            <IconButton
              className={classes.sendButton}
              onClick={() => handleSubmit()}
              disabled={!query.trim() || isLoading}
              size="small"
              aria-label="Search"
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Result Panel */}
      <Collapse in={showResult}>
        <Paper className={classes.resultPanel} elevation={0}>
          <Box className={classes.resultContent}>
            {/* Header */}
            <Box className={classes.resultHeader}>
              <Box className={classes.resultHeaderTitle}>
                <SmartToyIcon fontSize="small" />
                <Typography variant="subtitle2">AI Response</Typography>
                <Chip label="Beta" size="small" className={classes.betaChip} color="primary" variant="outlined" />
              </Box>
              <IconButton
                className={classes.closeButton}
                onClick={handleClose}
                size="small"
                aria-label="Close"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Content */}
            {isLoading || latestResponse?.isLoading ? (
              <Box className={classes.loadingContainer}>
                <CircularProgress size={24} />
                <Typography variant="body2">Searching and analyzing...</Typography>
              </Box>
            ) : latestResponse ? (
              <>
                <Box className={classes.markdown}>
                  <ReactMarkdown>{latestResponse.content}</ReactMarkdown>
                </Box>

                {/* Sources */}
                {latestResponse.sources && latestResponse.sources.length > 0 && (
                  <Box className={classes.sourcesContainer}>
                    <Typography className={classes.sourcesTitle}>Sources</Typography>
                    <Box className={classes.sourceChips}>
                      {latestResponse.sources.map((source: Source, index: number) => (
                        <Chip
                          key={index}
                          className={classes.sourceChip}
                          label={
                            <>
                              {source.title}
                              <OpenInNewIcon className={classes.sourceIcon} />
                            </>
                          }
                          variant="outlined"
                          size="small"
                          component={Link}
                          href={source.url}
                          clickable
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            ) : null}
          </Box>
        </Paper>
      </Collapse>

      {/* Suggested Queries */}
      {showSuggestions && !showResult && (
        <Fade in>
          <Box className={classes.suggestedQueries}>
            {SUGGESTED_QUERIES.map((suggestedQuery) => (
              <Chip
                key={suggestedQuery}
                label={suggestedQuery}
                variant="outlined"
                size="small"
                className={classes.suggestedChip}
                onClick={() => handleSuggestedQuery(suggestedQuery)}
              />
            ))}
          </Box>
        </Fade>
      )}
    </Box>
  );
};
