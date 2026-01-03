import React from 'react';
import { EntityLayout } from '@backstage/plugin-catalog';
import { Grid } from '@material-ui/core';
import {
  EntityAboutCard,
  EntityLinksCard,
  EntitySystemDiagramCard,
} from '@backstage/plugin-catalog';
import { EntityTechdocsContent } from '@backstage/plugin-techdocs';

export const entityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      <Grid container spacing={3} alignItems="stretch">
        <Grid item md={6}>
          <EntityAboutCard />
        </Grid>
        <Grid item md={6}>
          <EntityLinksCard />
        </Grid>
        <Grid item md={12}>
          <EntitySystemDiagramCard />
        </Grid>
      </Grid>
    </EntityLayout.Route>
    <EntityLayout.Route path="/docs" title="Docs">
      <EntityTechdocsContent />
    </EntityLayout.Route>
  </EntityLayout>
);
