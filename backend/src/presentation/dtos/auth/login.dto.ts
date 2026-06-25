import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Tài khoản phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tài khoản không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải dài ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
