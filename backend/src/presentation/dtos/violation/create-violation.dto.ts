import { IsNotEmpty, IsString } from 'class-validator';

export class CreateViolationDto {
  @IsString({ message: 'Nội dung vi phạm phải là chuỗi' })
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung vi phạm' })
  description: string;

  @IsString({ message: 'ID người thuê không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn người thuê' })
  tenantId: string;
}
