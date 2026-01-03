# Outputs

Module outputs.

## Outputs

| Output | Description |
|--------|-------------|
| `service_url` | Cloud Run service URL |
| `service_id` | Service ID |
| `service_name` | Service name |

## Usage

```hcl
output "service_url" {
  value = module.rag_api.service_url
}
```

## Next Steps

- [Examples](examples.md)

