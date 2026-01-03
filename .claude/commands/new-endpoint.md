# Add New API Endpoint

## Context
This command helps add a new API endpoint to a FastAPI template.

## Steps
1. Identify the template (rag-api, chat-agent, etc.)
2. Add route handler in the appropriate router file
3. Create request/response models using Pydantic
4. Add business logic (use SDK modules where applicable)
5. Add error handling
6. Add unit tests
7. Add integration tests
8. Update API documentation (OpenAPI will auto-generate)
9. Update template documentation if needed

## Output Format
- Code changes in appropriate files
- Test files with comprehensive coverage
- Documentation updates if needed

## Validation
- Endpoint is accessible and functional
- Tests pass
- OpenAPI spec includes new endpoint
- Documentation is updated
