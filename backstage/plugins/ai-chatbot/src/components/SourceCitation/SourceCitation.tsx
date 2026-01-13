import React from 'react';
import { makeStyles, Chip, Tooltip, Box, Typography, Link } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Source } from '../../api';

const useStyles = makeStyles(theme => ({
  container: {
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  title: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  sourceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
  },
  sourceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
  },
  sourceNumber: {
    minWidth: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  sourceContent: {
    flex: 1,
    minWidth: 0,
  },
  sourceLink: {
    fontSize: '0.8rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  sourceSnippet: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.25),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  linkIcon: {
    fontSize: '0.9rem',
    opacity: 0.7,
  },
  relevanceChip: {
    height: 16,
    fontSize: '0.65rem',
    marginLeft: theme.spacing(0.5),
  },
}));

interface SourceCitationProps {
  sources: Source[];
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ sources }) => {
  const classes = useStyles();

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Box className={classes.container}>
      <Typography className={classes.title}>Sources</Typography>
      <Box className={classes.sourceList}>
        {sources.map((source, index) => (
          <Box key={`${source.url}-${index}`} className={classes.sourceItem}>
            <span className={classes.sourceNumber}>{index + 1}</span>
            <Box className={classes.sourceContent}>
              <Link
                href={source.url}
                className={classes.sourceLink}
                color="primary"
              >
                {source.title}
                <OpenInNewIcon className={classes.linkIcon} />
              </Link>
              {source.snippet && (
                <Typography className={classes.sourceSnippet}>
                  {source.snippet}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
