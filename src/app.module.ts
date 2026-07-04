import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import mikroOrmConfig from './mikro-orm.config';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig), OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
