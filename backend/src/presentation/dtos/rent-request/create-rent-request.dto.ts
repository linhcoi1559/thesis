import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRentRequestDto {
  @IsString({ message: 'Tên khách hàng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  name: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @IsString({ message: 'Nội dung tin nhắn phải là chuỗi ký tự' })
  @IsOptional()
  message?: string;

  @IsUUID('4', { message: 'Mã chủ trọ (landlordId) không đúng định dạng UUID' })
  @IsNotEmpty({ message: 'Mã chủ trọ không được để trống' })
  landlordId: string;

  @IsUUID('4', { message: 'Mã phòng (roomId) không đúng định dạng UUID' })
  @IsOptional()
  roomId?: string;
}
