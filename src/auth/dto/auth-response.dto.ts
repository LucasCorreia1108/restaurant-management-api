import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}
