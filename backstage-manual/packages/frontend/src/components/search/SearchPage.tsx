import React from 'react';
import { makeStyles, Theme, Grid, List, Paper } from '@material-ui/core';
import { CatalogSearchResultListItem } from '@backstage/plugin-catalog';
import { TechDocsSearchResultListItem } from '@backstage/plugin-techdocs';
import {
  SearchBar,
  SearchResult,
  SearchResultPager,
} from '@backstage/plugin-search';
import {
  Content,
  Header,
  Page,
} from '@backstage/core-components';

const useStyles = makeStyles((theme: Theme) => ({
  bar: {
    maxWidth: '85vw',
    [theme.breakpoints.down('md')]: {
      maxWidth: '95vw',
    },
  },
  filters: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}));

const SearchPage = () => {
  const classes = useStyles();

  return (
    <Page themeId="home">
      <Header title="Search" />
      <Content>
        <Grid container direction="row">
          <Grid item xs={12}>
            <Paper className={classes.bar}>
              <SearchBar />
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper className={classes.filters}>
              Filters
            </Paper>
          </Grid>
          <Grid item xs={9}>
            <SearchResult>
              {({ results }) => (
                <List>
                  {results.map(({ type, document }) => {
                    switch (type) {
                      case 'software-catalog':
                        return (
                          <CatalogSearchResultListItem
                            key={document.location}
                            result={document}
                          />
                        );
                      case 'techdocs':
                        return (
                          <TechDocsSearchResultListItem
                            key={document.location}
                            result={document}
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                </List>
              )}
            </SearchResult>
            <SearchResultPager />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};

export const searchPage = <SearchPage />;
