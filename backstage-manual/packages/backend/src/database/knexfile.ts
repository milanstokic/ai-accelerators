import { Config } from '@backstage/config';

export default function createKnexConfig(config: Config) {
  return {
    client: config.getOptionalString('backend.database.client') || 'better-sqlite3',
    connection: config.getOptional('backend.database.connection') || {
      filename: './dev.db',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
    },
  };
}
