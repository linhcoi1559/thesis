import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

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

  @IsString({ message: 'Vai trò không hợp lệ' })
  @IsOptional()
  role?: 'TENANT' | 'LANDLORD' | 'ADMIN';

  // Landlord Business Entity Info (Chỉ bắt buộc nếu role là LANDLORD)
  @IsString({ message: 'Tên nhà trọ / Thương hiệu phải là chuỗi ký tự' })
  @IsOptional()
  landlordName?: string;

  @IsString({ message: 'Số điện thoại nhà trọ phải là chuỗi ký tự' })
  @IsOptional()
  landlordPhone?: string;

  @IsString({ message: 'Địa chỉ nhà trọ phải là chuỗi ký tự' })
  @IsOptional()
  landlordAddress?: string;

  @IsString({ message: 'Tên Ngân hàng phải là chuỗi ký tự (VD: MBBank)' })
  @IsOptional()
  bankName?: string;

  @IsString({ message: 'Số tài khoản phải là chuỗi ký tự' })
  @IsOptional()
  bankAccountNumber?: string;

  @IsString({ message: 'Tên tài khoản phải là chuỗi ký tự' })
  @IsOptional()
  bankAccountName?: string;
}
