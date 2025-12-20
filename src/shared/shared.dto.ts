export class SuccessResDTO {
  statusCode: number;
  data: any;

  constructor(partial: Partial<SuccessResDTO>) {
    Object.assign(this, partial);
  }
}
