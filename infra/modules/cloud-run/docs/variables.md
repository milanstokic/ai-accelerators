# Variables

Input variables for the Cloud Run module.

## Required Variables

| Variable | Description | Type |
|----------|-------------|------|
| `project_id` | GCP project ID | `string` |
| `service_name` | Cloud Run service name | `string` |
| `image` | Container image URL | `string` |

## Optional Variables

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `region` | GCP region | `string` | `"us-central1"` |
| `env_vars` | Environment variables | `map(string)` | `{}` |
| `secrets` | Secret references | `map(string)` | `{}` |
| `min_instances` | Minimum instances | `number` | `0` |
| `max_instances` | Maximum instances | `number` | `10` |

## Next Steps

- [Outputs](outputs.md)
- [Examples](examples.md)

