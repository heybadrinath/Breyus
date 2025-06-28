import { Module } from '@nestjs/common';
import { Company, CompanySchema } from './company.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
 imports: [MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),],

})
export class CompanyModule {}
