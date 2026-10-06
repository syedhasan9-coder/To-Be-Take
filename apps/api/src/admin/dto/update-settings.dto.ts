import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatePlatformSettingsInput } from '@tobetake/shared-types';

export class SettingKeyValueDto {
  @IsNotEmpty({ message: 'Key is required' })
  @IsString()
  key!: string;

  @IsNotEmpty({ message: 'Value is required' })
  @IsString()
  value!: string;
}

export class UpdateSettingsDto implements UpdatePlatformSettingsInput {
  @IsArray({ message: 'Settings must be an array' })
  @ArrayNotEmpty({ message: 'Settings array cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => SettingKeyValueDto)
  settings!: SettingKeyValueDto[];
}
