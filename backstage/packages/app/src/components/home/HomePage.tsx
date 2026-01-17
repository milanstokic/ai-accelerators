import React from 'react';
import { makeStyles, Grid, Typography, Card, CardContent, CardActions, Button, Chip, Box } from '@material-ui/core';
import { Page, Content, InfoCard, Header } from '@backstage/core-components';

import MenuBookIcon from '@material-ui/icons/MenuBook';
import CategoryIcon from '@material-ui/icons/Category';
import CodeIcon from '@material-ui/icons/Code';
import BuildIcon from '@material-ui/icons/Build';
import StorageIcon from '@material-ui/icons/Storage';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import GroupIcon from '@material-ui/icons/Group';

import { AiSearchBox } from '@internal/plugin-ai-chatbot';

const useStyles = makeStyles(theme => ({
  welcomeContainer: {
    textAlign: 'center',
    marginBottom: theme.spacing(4),
  },
  welcomeTitle: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 700,
    marginBottom: theme.spacing(2),
  },
  welcomeSubtitle: {
    color: theme.palette.text.secondary,
    maxWidth: '700px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  featureCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: theme.spacing(1),
  },
  catalogIcon: {
    color: '#4CAF50',
  },
  docsIcon: {
    color: '#2196F3',
  },
  apiIcon: {
    color: '#FF9800',
  },
  templatesIcon: {
    color: '#9C27B0',
  },
  sdkIcon: {
    color: '#E91E63',
  },
  infraIcon: {
    color: '#00BCD4',
  },
  cardContent: {
    flexGrow: 1,
  },
  cardTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  chip: {
    marginRight: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
  },
  quickLinksSection: {
    marginTop: theme.spacing(4),
  },
  highlightBox: {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    color: theme.palette.primary.contrastText,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
  highlightTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
}));

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  tags?: string[];
}

const FeatureCard = ({ title, description, icon, link, tags }: FeatureCardProps) => {
  const classes = useStyles();
  
  return (
    <Card className={classes.featureCard}>
      <CardContent className={classes.cardContent}>
        {icon}
        <Typography variant="h6" className={classes.cardTitle}>
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          {description}
        </Typography>
        {tags && (
          <Box>
            {tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                className={classes.chip}
              />
            ))}
          </Box>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" color="primary" href={link}>
          Explore →
        </Button>
      </CardActions>
    </Card>
  );
};

export const HomePage = () => {
  const classes = useStyles();

  const features: FeatureCardProps[] = [
    {
      title: 'Service Catalog',
      description: 'Discover and explore all AI Accelerators components, templates, SDK modules, and infrastructure. Find what you need with powerful filtering and search.',
      icon: <CategoryIcon className={`${classes.featureIcon} ${classes.catalogIcon}`} />,
      link: '/catalog',
      tags: ['Components', 'APIs', 'Resources'],
    },
    {
      title: 'TechDocs',
      description: 'Access comprehensive documentation for all platform components. From getting started guides to advanced customization, find everything in one place.',
      icon: <MenuBookIcon className={`${classes.featureIcon} ${classes.docsIcon}`} />,
      link: '/docs',
      tags: ['Guides', 'Tutorials', 'References'],
    },
    {
      title: 'API Documentation',
      description: 'Explore interactive API documentation with OpenAPI/Swagger integration. Test endpoints, view request/response schemas, and understand API contracts.',
      icon: <CodeIcon className={`${classes.featureIcon} ${classes.apiIcon}`} />,
      link: '/api-docs',
      tags: ['OpenAPI', 'REST', 'Interactive'],
    },
    {
      title: 'Software Templates',
      description: 'Bootstrap new AI applications instantly with pre-built templates. Choose from RAG APIs, Chat Agents, Document Processors, and more.',
      icon: <BuildIcon className={`${classes.featureIcon} ${classes.templatesIcon}`} />,
      link: '/create',
      tags: ['RAG', 'Agents', 'Scaffolding'],
    },
    {
      title: 'AI Accelerators SDK',
      description: 'Python SDK modules for building AI applications. Includes LLM integrations, vector stores, embeddings, observability, and configuration management.',
      icon: <FlashOnIcon className={`${classes.featureIcon} ${classes.sdkIcon}`} />,
      link: '/catalog?filters[kind]=component&filters[type]=library',
      tags: ['Python', 'LLM', 'VectorStore'],
    },
    {
      title: 'Infrastructure Modules',
      description: 'Production-ready Terraform modules for GCP deployment. Cloud Run, Cloud SQL, Qdrant, Redis, and comprehensive networking setups included.',
      icon: <StorageIcon className={`${classes.featureIcon} ${classes.infraIcon}`} />,
      link: '/catalog?filters[kind]=resource',
      tags: ['Terraform', 'GCP', 'Cloud Run'],
    },
  ];

  return (
    <Page themeId="home">
      <Header title="HTEC AI Platform" subtitle="Your gateway to building intelligent applications faster" />
      <Content>
        {/* Welcome Section */}
        <div className={classes.welcomeContainer}>
          <Typography variant="h3" className={classes.welcomeTitle}>
            Welcome to the HTEC AI Platform
          </Typography>
          <Typography variant="body1" className={classes.welcomeSubtitle}>
            Build production-ready AI applications in days, not months. Discover templates, SDK modules, 
            and infrastructure components designed to accelerate your AI journey. Whether you're building 
            RAG systems, chat agents, or custom AI pipelines, we've got you covered.
          </Typography>
        </div>

        {/* AI-Powered Search */}
        <AiSearchBox 
          placeholder="Ask AI anything about the platform..."
          showSuggestions
        />

          {/* Getting Started Highlight */}
          <Box className={classes.highlightBox}>
            <Typography variant="h5" className={classes.highlightTitle}>
              🚀 New Here? Get Started in 15 Minutes!
            </Typography>
            <Typography variant="body1" paragraph>
              Follow our quickstart guide to deploy your first RAG application. No prior AI experience required.
            </Typography>
            <Button 
              variant="contained" 
              color="secondary" 
              href="/docs/default/component/rag-api-template"
              style={{ marginRight: '12px' }}
            >
              Start Tutorial
            </Button>
            <Button 
              variant="outlined" 
              style={{ color: 'white', borderColor: 'white' }}
              href="/create"
            >
              Create New Project
            </Button>
          </Box>

          {/* Feature Cards */}
          <Typography variant="h5" gutterBottom style={{ fontWeight: 600, marginBottom: '24px' }}>
            Platform Features
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.title}>
                <FeatureCard {...feature} />
              </Grid>
            ))}
          </Grid>

          {/* Team Section */}
          <Box className={classes.quickLinksSection}>
            <InfoCard title="About the Platform" icon={<GroupIcon />}>
              <Typography variant="body1" paragraph>
                The HTEC AI Platform is maintained by the <strong>AI Platform Team</strong>. 
                Our mission is to democratize AI development by providing production-ready components, 
                best practices, and comprehensive documentation.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>What's Included:</strong>
              </Typography>
              <ul>
                <li>
                  <Typography variant="body2" color="textSecondary">
                    <strong>5+ Application Templates</strong> — RAG API, Chat Agent, Document Processor, Voice Assistant, React Chat UI
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="textSecondary">
                    <strong>7 SDK Modules</strong> — LLM, Vector Store, Embeddings, Observability, Config, Auth, Evals
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="textSecondary">
                    <strong>8+ Terraform Modules</strong> — Cloud Run, Cloud SQL, Qdrant, Redis, Networking, Secrets, Monitoring
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Complete Documentation</strong> — Getting started, API references, deployment guides, and troubleshooting
                  </Typography>
                </li>
              </ul>
              <Box mt={2}>
                <Button size="small" color="primary" href="/catalog?filters[kind]=group">
                  Meet the Team
                </Button>
              </Box>
            </InfoCard>
          </Box>
        </Content>
      </Page>
  );
};
