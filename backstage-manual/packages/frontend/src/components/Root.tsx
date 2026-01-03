import React, { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import SearchIcon from '@material-ui/icons/Search';
import {
  Sidebar,
  SidebarPage,
  sidebarConfig,
  SidebarItem,
  SidebarDivider,
  SidebarSpace,
} from '@backstage/core-components';
import { Link } from 'react-router-dom';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
    color: 'white',
    textDecoration: 'none',
    fontSize: '18px',
    fontWeight: 'bold',
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  return (
    <div className={classes.root}>
      <Link to="/" className={classes.link}>
        AI Accelerators
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      <SidebarLogo />
      <SidebarDivider />
      <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
      <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
      <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
      <SidebarItem icon={CreateComponentIcon} to="create" text="Create..." />
      <SidebarDivider />
      <SidebarItem icon={SearchIcon} to="search" text="Search" />
      <SidebarSpace />
      <SidebarDivider />
    </Sidebar>
    {children}
  </SidebarPage>
);
