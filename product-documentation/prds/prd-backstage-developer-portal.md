# Spotify Backstage Developer Portal - Product Requirements Document

**Version:** 1.0  
**Author:** Milan Stokic  
**Last Updated:** January 2026  
**Status:** Draft

---

## 1. Executive Summary

This PRD defines the requirements for implementing Spotify Backstage as the developer portal for the AI Accelerators platform. The portal will serve as the central hub for developers to discover, understand, and use the AI Accelerators SDK, templates, and infrastructure modules. It will integrate all existing documentation, provide service cataloging, and enable self-service discovery of AI application patterns and components.

The goal is to reduce time-to-productivity for developers by providing a single, searchable, interactive portal that consolidates all platform documentation, examples, and tooling.

---

## 2. Problem Statement

### Current Pain Points

1. **Documentation fragmentation**: Documentation exists across multiple markdown files in the `docs/` directory, making it difficult to find relevant information
2. **No service discovery**: Developers cannot easily discover available templates, SDK modules, or infrastructure components
3. **Limited interactivity**: Static markdown documentation doesn't provide interactive examples or live API exploration
4. **No centralized catalog**: No single source of truth for what components are available, their status, ownership, and dependencies
5. **Difficult onboarding**: New developers must navigate multiple documentation sources to understand the platform
6. **No API documentation integration**: API documentation is separate from the developer experience
7. **Missing metadata**: Documentation lacks structured metadata (ownership, lifecycle, dependencies, health status)

### Target Outcome

A unified developer portal powered by Spotify Backstage that:
- Provides a single entry point for all AI Accelerators documentation
- Enables service cataloging for templates, SDK modules, and infrastructure components
- Offers interactive API documentation and examples
- Supports self-service discovery and onboarding
- Integrates with existing documentation structure
- Provides searchable, filterable content with rich metadata

---

## 3. Goals and Non-Goals

### Goals

| Priority | Goal |
|----------|------|
| P0 | Provide single portal for all AI Accelerators documentation |
| P0 | Enable service cataloging for templates, SDK modules, and infrastructure |
| P0 | Integrate existing markdown documentation seamlessly |
| P1 | Provide interactive API documentation (OpenAPI/Swagger integration) |
| P1 | Enable service ownership and lifecycle management |
| P1 | Support search and filtering across all documentation |
| P2 | Integrate with CI/CD for automated documentation updates |
| P2 | Provide plugin ecosystem for custom integrations |
| P2 | Enable documentation analytics and usage tracking |

### Non-Goals

- Replacing existing documentation format (markdown will remain the source of truth)
- Building custom documentation platform (using Backstage instead)
- Migrating all documentation to Backstage-specific format
- Replacing GitHub as the primary code repository
- Building custom authentication (using existing SSO/identity provider)

---

## 4. Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Developer onboarding time | 2-4 weeks | < 1 week | Developer surveys |
| Documentation discovery time | 15-30 min | < 5 min | Portal analytics |
| Portal adoption rate | N/A | 80% of developers | Usage analytics |
| Documentation page views | N/A | 500/month | Portal analytics |
| Search query success rate | N/A | > 80% | Search analytics |
| Service catalog completeness | N/A | 100% of templates/SDK modules | Manual audit |

---

## 5. User Personas

### 5.1 New Developer

**Context**: First time using AI Accelerators platform  
**Needs**: Quick onboarding, clear navigation, getting started guides  
**Uses**: Getting started docs, quickstart guides, service catalog  
**Pain Points**: Don't know where to start, overwhelmed by options

### 5.2 Experienced Developer

**Context**: Regular user of the platform  
**Needs**: API reference, advanced guides, troubleshooting  
**Uses**: API docs, customization guides, service details  
**Pain Points**: Need to find specific information quickly

### 5.3 Platform Engineer

**Context**: Maintaining infrastructure and templates  
**Needs**: Service ownership, dependency tracking, health monitoring  
**Uses**: Service catalog, ownership info, dependency graphs  
**Pain Points**: Need to understand service relationships and ownership

### 5.4 Technical Lead

**Context**: Making architecture decisions  
**Needs**: Architecture docs, ADRs, technology choices  
**Uses**: Architecture documentation, ADRs, system overview  
**Pain Points**: Need to understand design decisions and trade-offs

---

## 6. Documentation Inventory

### 6.1 Existing Documentation Structure

The following documentation exists and must be integrated:

#### Getting Started Documentation
- `docs/getting-started/index.md` - Overview and navigation
- `docs/getting-started/prerequisites.md` - Required tools and accounts
- `docs/getting-started/installation.md` - SDK installation
- `docs/getting-started/quickstart.md` - 15-minute tutorial
- `docs/getting-started/first-rag-app.md` - Step-by-step RAG app guide
- `docs/getting-started/local-development.md` - Development environment setup
- `docs/getting-started/faq.md` - Frequently asked questions

#### Template Documentation
- `docs/templates/rag-api/index.md` - RAG API overview
- `docs/templates/rag-api/quickstart.md` - RAG API quickstart
- `docs/templates/rag-api/configuration.md` - Configuration guide
- `docs/templates/rag-api/customization.md` - Customization guide
- `docs/templates/rag-api/api-reference.md` - API reference
- `docs/templates/rag-api/deployment.md` - Deployment guide
- `docs/templates/rag-api/troubleshooting.md` - Troubleshooting guide

#### Planned Documentation (from PRD)
- SDK Reference (`docs/sdk/`)
- Architecture Documentation (`docs/architecture/`)
- Infrastructure Documentation (`docs/infrastructure/`)
- Operations Documentation (`docs/operations/`)
- Contributing Documentation (`docs/contributing/`)
- ADRs (`docs/adr/`)

### 6.2 Documentation Metadata Requirements

Each documentation entity should have:
- **Title**: Clear, descriptive title
- **Description**: Brief summary
- **Category**: Getting Started, Templates, SDK, Infrastructure, etc.
- **Tags**: Searchable tags (e.g., "rag", "llm", "vector-store")
- **Owner**: Team or individual responsible
- **Last Updated**: Timestamp
- **Related Services**: Links to related templates/SDK modules
- **Dependencies**: What this depends on
- **Lifecycle**: Status (active, deprecated, experimental)

---

## 7. Backstage Implementation Requirements

### 7.1 Core Components

#### 7.1.1 Service Catalog

**Purpose**: Catalog all services, templates, and SDK modules

**Entities to Catalog**:
- **Templates**: RAG API, Chat Agent, Document Processor, Voice Assistant, React Chat UI
- **SDK Modules**: LLM, Vector Store, Embeddings, Observability, Config, Auth, Evals
- **Infrastructure Modules**: Cloud Run, Cloud SQL, Qdrant, Redis, Networking, Secrets, Observability

**Entity Schema**:
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: rag-api-template
  description: RAG API template for document Q&A
  tags:
    - rag
    - template
    - fastapi
  annotations:
    backstage.io/techdocs-ref: dir:.
    backstage.io/source-location: url:https://github.com/htec/ai-accelerators/tree/main/templates/rag-api
spec:
  type: template
  lifecycle: production
  owner: ai-platform-team
  system: ai-accelerators
  providesApis:
    - rag-api
```

#### 7.1.2 TechDocs Integration

**Purpose**: Render markdown documentation in Backstage

**Requirements**:
- Integrate with existing `docs/` directory structure
- Support markdown with frontmatter
- Enable cross-referencing between docs
- Support code examples with syntax highlighting
- Support Mermaid diagrams
- Enable search within documentation

**Configuration**:
- Use `mkdocs` or `techdocs-cli` for documentation generation
- Store generated docs in object storage (GCS/S3)
- Enable versioning of documentation

#### 7.1.3 API Documentation

**Purpose**: Interactive API documentation for templates

**Requirements**:
- Integrate OpenAPI/Swagger specs from FastAPI templates
- Enable interactive API exploration
- Show request/response examples
- Support authentication testing
- Link to service catalog entries

**Implementation**:
- Extract OpenAPI specs from FastAPI apps
- Use Backstage API Explorer plugin
- Link APIs to service catalog components

#### 7.1.4 Software Templates

**Purpose**: Enable self-service creation of new projects from templates

**Requirements**:
- Create Backstage templates for each accelerator template
- Enable parameterized template instantiation
- Support scaffolding with pre-filled configurations
- Integrate with repository creation

**Templates to Create**:
- RAG API from template
- Chat Agent from template
- New SDK module scaffold
- New infrastructure module scaffold

### 7.2 Custom Plugins

#### 7.2.1 SDK Module Explorer

**Purpose**: Interactive exploration of SDK modules

**Features**:
- Browse SDK modules by category
- View module dependencies
- See usage examples
- Link to API reference
- Show version information

#### 7.2.2 Infrastructure Module Catalog

**Purpose**: Catalog and explore Terraform modules

**Features**:
- List all infrastructure modules
- Show module inputs/outputs
- Display example usage
- Link to Terraform registry
- Show module dependencies

#### 7.2.3 Documentation Search

**Purpose**: Enhanced search across all documentation

**Features**:
- Full-text search across all docs
- Filter by category, tags, owner
- Search within code examples
- Search API documentation
- Recent searches and suggestions

### 7.3 Integration Requirements

#### 7.3.1 Source Control Integration

**Requirements**:
- Link to GitHub repositories
- Show repository structure
- Display README files
- Link to source code
- Show commit history

#### 7.3.2 CI/CD Integration

**Requirements**:
- Display build status
- Show test coverage
- Link to CI/CD pipelines
- Display deployment status
- Show release information

#### 7.3.3 Monitoring Integration

**Requirements**:
- Link to observability dashboards (Langfuse)
- Show service health status
- Display metrics and alerts
- Link to logs

---

## 8. Technical Architecture

### 8.1 Deployment Architecture

```
┌─────────────────┐
│   Backstage     │
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
┌────────▼────────┐
│   Backstage     │
│   Backend       │
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│  GCS  │ │ GitHub│
│ Docs  │ │  API  │
└───────┘ └───────┘
```

### 8.2 Infrastructure Requirements

**Compute**:
- Cloud Run service for Backstage backend
- Cloud Run service for Backstage frontend (or static hosting)
- Optional: GKE for more complex deployments

**Storage**:
- Cloud Storage bucket for TechDocs generated content
- Cloud SQL or Firestore for Backstage database
- Secret Manager for API keys and credentials

**Networking**:
- Load balancer for public access
- VPC connector for private resources
- Cloud CDN for static assets

**Authentication**:
- Integration with existing SSO/identity provider
- OAuth 2.0 / OIDC support
- GitHub authentication option

### 8.3 Data Flow

1. **Documentation Updates**:
   - Developer updates markdown in `docs/` directory
   - CI/CD pipeline triggers on merge
   - TechDocs generator processes markdown
   - Generated HTML stored in Cloud Storage
   - Backstage catalog updated via API

2. **Service Catalog Updates**:
   - Service catalog YAML files in repository
   - Changes trigger catalog refresh
   - Backstage backend updates catalog
   - Frontend reflects changes

3. **API Documentation Updates**:
   - FastAPI apps generate OpenAPI specs
   - Specs stored in repository or object storage
   - Backstage API Explorer reads specs
   - Interactive docs updated

---

## 9. Content Organization

### 9.1 Navigation Structure

```
Home
├── Getting Started
│   ├── Overview
│   ├── Prerequisites
│   ├── Installation
│   ├── Quickstart
│   ├── First RAG App
│   ├── Local Development
│   └── FAQ
├── Templates
│   ├── RAG API
│   │   ├── Overview
│   │   ├── Quickstart
│   │   ├── Configuration
│   │   ├── API Reference
│   │   ├── Customization
│   │   ├── Deployment
│   │   └── Troubleshooting
│   ├── Chat Agent (coming soon)
│   ├── Document Processor (coming soon)
│   └── Voice Assistant (coming soon)
├── SDK
│   ├── Overview
│   ├── LLM Module
│   ├── Vector Store Module
│   ├── Embeddings Module
│   ├── Observability Module
│   ├── Config Module
│   ├── Auth Module
│   └── Evals Module
├── Infrastructure
│   ├── Overview
│   ├── GCP Setup
│   ├── Terraform Guide
│   ├── Modules
│   │   ├── Cloud Run
│   │   ├── Cloud SQL
│   │   ├── Qdrant
│   │   └── Redis
│   └── Environments
├── Architecture
│   ├── System Overview
│   ├── SDK Architecture
│   ├── Template Architecture
│   ├── Security Architecture
│   └── Technology Choices
├── Operations
│   ├── Monitoring
│   ├── Logging
│   ├── Alerting
│   └── Runbooks
├── Contributing
│   ├── Development Setup
│   ├── Coding Standards
│   ├── Testing Guide
│   └── Release Process
└── ADRs
    ├── ADR-001: Monorepo Structure
    ├── ADR-002: Python SDK Architecture
    └── ...
```

### 9.2 Service Catalog Organization

**Categories**:
- **Templates**: Application templates
- **SDK Modules**: Python SDK components
- **Infrastructure**: Terraform modules
- **APIs**: Exposed APIs from templates

**Tags**:
- `rag`, `agent`, `document-processing`, `voice`
- `llm`, `vector-store`, `embeddings`, `observability`
- `gcp`, `terraform`, `cloud-run`, `qdrant`
- `production`, `experimental`, `deprecated`

---

## 10. Implementation Phases

### Phase 1: Foundation (P0)

**Goal**: Basic Backstage setup with core documentation

**Tasks**:
- [ ] Deploy Backstage instance (Cloud Run)
- [ ] Configure authentication (SSO/OIDC)
- [ ] Set up TechDocs integration
- [ ] Migrate Getting Started documentation
- [ ] Create service catalog entries for templates
- [ ] Basic navigation structure

**Deliverables**:
- Working Backstage instance
- Getting Started docs accessible
- Basic service catalog

### Phase 2: Full Documentation Integration (P0)

**Goal**: Integrate all existing documentation

**Tasks**:
- [ ] Migrate all template documentation
- [ ] Set up SDK module documentation structure
- [ ] Create infrastructure documentation pages
- [ ] Integrate architecture documentation
- [ ] Add ADRs to catalog
- [ ] Enable search functionality

**Deliverables**:
- All documentation accessible in Backstage
- Search working across all content
- Complete navigation structure

### Phase 3: Enhanced Features (P1)

**Goal**: Add interactive features and integrations

**Tasks**:
- [ ] Integrate OpenAPI/Swagger for API docs
- [ ] Create software templates for scaffolding
- [ ] Add CI/CD integration (build status, test coverage)
- [ ] Integrate monitoring/observability links
- [ ] Create custom plugins (SDK explorer, infrastructure catalog)
- [ ] Add documentation analytics

**Deliverables**:
- Interactive API documentation
- Software templates functional
- CI/CD integration working
- Custom plugins available

### Phase 4: Advanced Features (P2)

**Goal**: Advanced features and optimizations

**Tasks**:
- [ ] Documentation versioning
- [ ] Multi-language support (if needed)
- [ ] Advanced search with filters
- [ ] Documentation feedback mechanism
- [ ] Integration with internal tools
- [ ] Performance optimization

**Deliverables**:
- Production-ready portal
- All advanced features functional
- Optimized performance

---

## 11. Content Migration Strategy

### 11.1 Markdown to TechDocs

**Approach**:
- Keep markdown files as source of truth
- Use TechDocs generator to process markdown
- Add frontmatter for metadata
- Maintain existing directory structure
- Enable automatic regeneration on changes

**Frontmatter Format**:
```yaml
---
title: RAG API Quickstart
description: Get the RAG API running in 15 minutes
tags:
  - rag
  - quickstart
  - template
category: Templates
owner: ai-platform-team
lastUpdated: 2026-01-15
relatedServices:
  - rag-api-template
---
```

### 11.2 Service Catalog YAML

**Location**: `catalog-info.yaml` files in each service directory

**Example Structure**:
```
templates/rag-api/catalog-info.yaml
sdk/src/accelerators/llm/catalog-info.yaml
infra/modules/cloud-run/catalog-info.yaml
```

### 11.3 API Documentation

**Approach**:
- Extract OpenAPI specs from FastAPI apps
- Store in repository or object storage
- Use Backstage API Explorer plugin
- Link to service catalog entries

---

## 12. User Experience Requirements

### 12.1 Homepage

**Required Elements**:
- Platform overview
- Quick links to getting started
- Featured templates
- Recent documentation updates
- Search bar (prominent)
- Service catalog overview

### 12.2 Documentation Pages

**Required Elements**:
- Clear navigation breadcrumbs
- Table of contents (auto-generated)
- Search within page
- Related documentation links
- Edit on GitHub link
- Last updated timestamp
- Tags and categories
- Code examples with copy button

### 12.3 Service Catalog Pages

**Required Elements**:
- Service overview and description
- Owner and lifecycle information
- Dependencies graph
- Related documentation
- API documentation (if applicable)
- Source code links
- CI/CD status
- Monitoring links

### 12.4 Search Experience

**Required Features**:
- Full-text search across all content
- Filter by category, tags, owner
- Search suggestions
- Recent searches
- Search result previews
- Highlighted search terms

---

## 13. Technical Requirements

### 13.1 Backstage Version

- **Version**: Latest stable (v1.x)
- **Deployment**: Containerized (Docker)
- **Database**: PostgreSQL (Cloud SQL)
- **Object Storage**: Cloud Storage for TechDocs

### 13.2 Dependencies

**Required Integrations**:
- GitHub API (for source code links)
- Cloud Storage (for TechDocs)
- Secret Manager (for API keys)
- Identity Provider (for authentication)

**Optional Integrations**:
- CI/CD systems (GitHub Actions, Cloud Build)
- Monitoring systems (Cloud Monitoring, Langfuse)
- Issue tracking (GitHub Issues)

### 13.3 Performance Requirements

- Page load time: < 2 seconds
- Search response time: < 500ms
- Documentation generation: < 5 minutes
- Uptime: 99.9%

### 13.4 Security Requirements

- Authentication required for access
- Role-based access control (RBAC)
- Secure storage of API keys
- HTTPS only
- Regular security updates
- Audit logging

---

## 14. Success Criteria

### Phase 1 Success
- [ ] Backstage instance deployed and accessible
- [ ] Getting Started documentation migrated
- [ ] Basic service catalog functional
- [ ] Authentication working

### Phase 2 Success
- [ ] All existing documentation accessible
- [ ] Search working across all content
- [ ] Navigation structure complete
- [ ] 80% of developers can find needed information in < 5 minutes

### Phase 3 Success
- [ ] Interactive API documentation available
- [ ] Software templates functional
- [ ] CI/CD integration working
- [ ] Custom plugins available

### Phase 4 Success
- [ ] Portal adoption rate > 80%
- [ ] Documentation discovery time < 5 minutes
- [ ] All success metrics met
- [ ] Production-ready and optimized

---

## 15. Risks and Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backstage complexity | High | Start with basic setup, iterate |
| Documentation migration effort | Medium | Automated migration scripts |
| Performance issues | Medium | CDN, caching, optimization |
| Maintenance burden | Medium | Automated updates, clear ownership |

### Organizational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption | High | Strong onboarding, clear value prop |
| Documentation drift | Medium | Automated sync, clear ownership |
| Resource constraints | Medium | Phased approach, prioritize P0 |

---

## 16. Dependencies

### External Dependencies
- Spotify Backstage (open source)
- GitHub API access
- Cloud Storage
- Identity Provider (SSO)
- CI/CD systems

### Internal Dependencies
- Existing documentation structure
- Service catalog YAML files
- OpenAPI specs from templates
- Infrastructure for deployment

---

## 17. Appendix

### 17.1 Glossary

| Term | Definition |
|------|------------|
| Backstage | Spotify's open-source developer portal platform |
| TechDocs | Backstage's documentation system |
| Service Catalog | Backstage's catalog of services and components |
| Software Template | Backstage's templating system for scaffolding |
| Entity | A cataloged item (service, component, API, etc.) |

### 17.2 References

- [Backstage Documentation](https://backstage.io/docs)
- [TechDocs Documentation](https://backstage.io/docs/features/techdocs/)
- [Service Catalog Documentation](https://backstage.io/docs/features/software-catalog/)
- [Software Templates Documentation](https://backstage.io/docs/features/software-templates/)

### 17.3 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Milan Stokic | Initial draft |

---

## 18. Open Questions

1. **Authentication**: Which identity provider will be used? (Google Workspace, Okta, etc.)
2. **Hosting**: Cloud Run vs GKE for Backstage deployment?
3. **Documentation Updates**: Real-time vs scheduled regeneration?
4. **Access Control**: Public vs internal-only access?
5. **Custom Domain**: What domain will be used? (e.g., backstage.company.com)
6. **Team Ownership**: Which team will own and maintain Backstage?

---

**Next Steps**:
1. Review and approve this PRD
2. Answer open questions
3. Create implementation plan
4. Begin Phase 1 implementation

