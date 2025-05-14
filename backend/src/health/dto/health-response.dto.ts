import { ApiProperty } from '@nestjs/swagger';

class AppInfoDto {
  @ApiProperty({ example: 'Mon Projet Fullstack API' })
  name: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ example: 'v18.15.0' })
  nodeVersion: string;

  @ApiProperty({ example: 'development' })
  environment: string;
}

class UptimeDto {
  @ApiProperty({ example: 3600 })
  seconds: number;

  @ApiProperty({ example: '0j 1h 0m 0s' })
  formattedUptime: string;
}

class CpuInfoDto {
  @ApiProperty({ example: 8 })
  count: number;

  @ApiProperty({ example: 'Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz' })
  model: string;
}

class SystemInfoDto {
  @ApiProperty()
  uptime: UptimeDto;

  @ApiProperty({ example: 'hostname' })
  hostname: string;

  @ApiProperty({ example: 'win32' })
  platform: string;

  @ApiProperty()
  cpus: CpuInfoDto;
}

class MemoryInfoDto {
  @ApiProperty({ example: '150.5 MB' })
  rss: string;

  @ApiProperty({ example: '70.2 MB' })
  heapTotal: string;

  @ApiProperty({ example: '62.8 MB' })
  heapUsed: string;

  @ApiProperty({ example: '1.2 MB' })
  external: string;

  @ApiProperty({ example: '16.0 GB' })
  systemTotal: string;

  @ApiProperty({ example: '8.5 GB' })
  systemFree: string;

  @ApiProperty({ example: '47%' })
  systemUsage: string;
}

class DatabaseStatusDto {
  @ApiProperty({ example: 'connected' })
  status: string;

  @ApiProperty({ example: 12, required: false })
  responseTime?: number;

  @ApiProperty({ example: 'Connection refused', required: false })
  error?: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2023-07-14T12:34:56.789Z' })
  timestamp: string;

  @ApiProperty()
  app: AppInfoDto;

  @ApiProperty()
  system: SystemInfoDto;

  @ApiProperty()
  memory: MemoryInfoDto;

  @ApiProperty()
  database: DatabaseStatusDto;
}

export class HealthErrorResponseDto {
  @ApiProperty({ example: 'error' })
  status: string;

  @ApiProperty({ example: 'Impossible de récupérer les données de santé' })
  message: string;

  @ApiProperty({ example: 'Error details...' })
  error: string;
}
