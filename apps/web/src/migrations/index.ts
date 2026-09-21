import * as migration_20260914_155552_inicial from './20260914_155552_inicial';

export const migrations = [
  {
    up: migration_20260914_155552_inicial.up,
    down: migration_20260914_155552_inicial.down,
    name: '20260914_155552_inicial'
  },
];
