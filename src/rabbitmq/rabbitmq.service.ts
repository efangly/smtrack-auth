import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  constructor(@Inject('DEVICE_SERVICE') private readonly device: ClientProxy) {}

  async sendToDevice<T>(queue: string, payload: T) {
    this.device.emit(queue, payload);
  }
}
