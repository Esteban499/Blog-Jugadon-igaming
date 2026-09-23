import * as migration_20260914_155552_inicial from './20260914_155552_inicial';
import * as migration_20260923_174202_quitar_prefix_de_media from './20260923_174202_quitar_prefix_de_media';

export const migrations = [
  {
    up: migration_20260914_155552_inicial.up,
    down: migration_20260914_155552_inicial.down,
    name: '20260914_155552_inicial',
  },
  {
    up: migration_20260923_174202_quitar_prefix_de_media.up,
    down: migration_20260923_174202_quitar_prefix_de_media.down,
    name: '20260923_174202_quitar_prefix_de_media'
  },
];
