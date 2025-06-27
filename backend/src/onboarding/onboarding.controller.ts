import { Body, Controller, HttpCode, HttpStatus, Post, Session } from '@nestjs/common';
import { Step1Dto, Step2Dto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
     constructor(
            private readonly onboardingservice: OnboardingService
        ) { };
    
    @Post('step1')
    @HttpCode(HttpStatus.ACCEPTED)
    async step1(@Body() step1dto: Step1Dto){
        return await this.onboardingservice.step1(step1dto);
    }

    @Post('step2')
    @HttpCode(HttpStatus.ACCEPTED)
    async step2(@Body() step2dto: Step2Dto){
        //todo add user id created at step-1
        return await this.onboardingservice.step2(step2dto, '_id');
    }

}
