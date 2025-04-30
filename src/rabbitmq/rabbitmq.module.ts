import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitmqService } from './rabbitmq.service';

@Global()
@Module({
  imports: [ 
    ClientsModule.register([
      {
        name: 'DEVICE_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ],
          queue: 'log_device_queue',
          queueOptions: { durable: true }
        }
      }
    ]),
    ClientsModule.register([
      {
        name: 'LEGACY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ],
          queue: 'templog_queue',
          queueOptions: { durable: true }
        }
      }
    ])
  ],
  providers: [RabbitmqService],
  exports: [RabbitmqService]
})
export class RabbitmqModule {}
