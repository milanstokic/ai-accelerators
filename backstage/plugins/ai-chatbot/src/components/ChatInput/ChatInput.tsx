import React, { useState, useCallback, KeyboardEvent } from 'react';
import { makeStyles, Box, TextField, IconButton, Tooltip } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 20,
      backgroundColor: theme.palette.background.default,
    },
    '& .MuiOutlinedInput-input': {
      padding: '12px 16px',
    },
  },
  sendButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
    },
  },
  charCount: {
    fontSize: '0.7rem',
    color: theme.palette.text.hint,
    textAlign: 'right',
    marginTop: theme.spacing(0.5),
  },
  charCountWarning: {
    color: theme.palette.warning.main,
  },
  charCountError: {
    color: theme.palette.error.main,
  },
}));

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Ask a question about the platform...',
  maxLength = 500,
}) => {
  const classes = useStyles();
  const [message, setMessage] = useState('');

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled && message.length <= maxLength) {
      onSend(message.trim());
      setMessage('');
    }
  }, [message, disabled, maxLength, onSend]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const charCount = message.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isOverLimit = charCount > maxLength;

  return (
    <Box className={classes.container}>
      <Box className={classes.inputWrapper}>
        <TextField
          className={classes.input}
          variant="outlined"
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          size="small"
          InputProps={{
            'aria-label': 'Chat message input',
          }}
        />
        <div
          className={`${classes.charCount} ${
            isOverLimit ? classes.charCountError : isNearLimit ? classes.charCountWarning : ''
          }`}
        >
          {charCount}/{maxLength}
        </div>
      </Box>
      <Tooltip title={isOverLimit ? 'Message too long' : 'Send message (Enter)'}>
        <span>
          <IconButton
            className={classes.sendButton}
            onClick={handleSend}
            disabled={disabled || !message.trim() || isOverLimit}
            size="small"
            aria-label="Send message"
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};
