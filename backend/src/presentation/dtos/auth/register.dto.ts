import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsNumber } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải dài ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  name: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'ID Phòng không hợp lệ' })
  @IsOptional()
  desiredRoomId?: string;

  @IsNumber({}, { message: 'Số lượng thành viên phải là số' })
  @IsOptional()
  memberCount?: number;
}
