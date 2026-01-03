import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { SearchPage } from '@backstage/plugin-search';
import { TechdocsPage, techdocsPlugin } from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';

const app = createApp({
  apis,
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
    });
  },
});

const AppProvider = app.getProvider();
const AppRouter = app.getRouter();

const routes = (
  <AppRouter>
    <Root>
      <AlertDisplay />
      <OAuthRequestDialog />
      <Navigate key="/" to="catalog" />
      <Route path="/catalog" element={<CatalogIndexPage />} />
      <Route
        path="/catalog/:namespace/:kind/:name"
        element={<CatalogEntityPage />}
      >
        {entityPage}
      </Route>
      <Route path="/docs" element={<TechdocsPage />}>
        <TechDocsAddons>
          <ReportIssue />
        </TechDocsAddons>
      </Route>
      <Route path="/create" element={<ScaffolderPage />} />
      <Route path="/api-docs" element={<ApiExplorerPage />} />
      <Route
        path="/catalog-import"
        element={<CatalogImportPage />}
      />
      <Route path="/search" element={<SearchPage />}>
        {searchPage}
      </Route>
      <Route path="/settings" element={<UserSettingsPage />} />
    </Root>
  </AppRouter>
);

const App = () => (
  <AppProvider>
    {routes}
  </AppProvider>
);

export default App;
