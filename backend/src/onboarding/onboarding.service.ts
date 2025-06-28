import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Step1Dto, Step2Dto, Step3Dto, Step4Dto, Step5Dto } from 'src/onboarding/dto/onboarding.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company } from 'src/company/company.schema';
import { User } from 'src/users/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { NotFoundError } from 'rxjs';



@Injectable()
export class OnboardingService {
    constructor(
        @InjectModel(Company.name) private readonly companySchema: Model<Company>,
        @InjectModel(User.name) private readonly userSchema: Model<User>,
        private readonly mailService: MailService
    ) { }


    // step 1 Getting your business onboard
    async step1(step1Dto: Step1Dto) {
        const {name, location, mail, contactNumber, taxId} = step1Dto;
        try{
            let user = await this.userSchema.findOne({ mail }).exec();
            let company = await this.companySchema.findOne({name}).exec();
            let onboardingStatus = await company?.isOnboardingCompleted
            
            if(user && company){
               console.log("company and user exists");
               console.log("company object id: " + company._id);
            }
            if(onboardingStatus){
                console.log("onboarding completed");
            }else{
                console.log("onboarding in progress");
            }

        }catch(error){
            if(error instanceof NotFoundError ){
                throw error;
            }

            if(error instanceof UnauthorizedException){
                throw error;
            }

            if(error instanceof BadRequestException){
                throw error;
            }

            if(error instanceof InternalServerErrorException){
                throw error;
            }
        }
    }


    // // step2 Verification and Confirmation
    // async step2(step2Dto: Step2Dto, userId): Promise<boolean> {
    //     const { password, confirmPassword, mobileOtp, mailOtp } = step2Dto;


    //     // verify the email otp
    //     const user = await this.userSchema.findById(userId).select('mail company').populate<{ company: Company }>('company', 'number');
    //     if (!user || !user.mail) {
    //         throw new HttpException('User email not found', HttpStatus.NOT_FOUND);
    //     }
    //     const mail: string = user.mail;

    //     const isOtpValid = this.mailService.validateOtp(mail, mailOtp);
    //     if (!isOtpValid) {
    //         throw new HttpException('Invalid OTP or OTP expired.', HttpStatus.UNAUTHORIZED);
    //     }

    //     //verify the mobile otp
    //     const mobileNumber = user.company.number;
    //     // Todo implement mobile number otp either through whatsapp or sms verification for now it's 123456
    //     const mobileotp = '123456'; // remove this in production and implement otp verification using sms or what's app
    //     if (mobileOtp !== mobileotp) {
    //         throw new HttpException('Invalid OTP or OTP expired', HttpStatus.UNAUTHORIZED);
    //     }

    //     // verify if password and confirm password matches
    //     if (password !== confirmPassword) {
    //         throw new HttpException(
    //             'Password and confirm password should be same',
    //             HttpStatus.BAD_REQUEST
    //         )
    //     }

    //     const salt = await bcrypt.gensalt(12)
    //     const hashedPassword = await bcrypt.hash(password, salt);

    //     try {
    //         const updatedUser = await this.userSchema.findByIdAndUpdate(
    //             userId,
    //             { password: hashedPassword },
    //             { new: true }
    //         );
    //         if (!updatedUser) {
    //             throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    //         }
    //         return true;
    //     } catch (e) {
    //         throw new HttpException(
    //             e,
    //             HttpStatus.INTERNAL_SERVER_ERROR
    //         );

    //     }

    // }

    // step3 Tell us about your Business
    async step3(step3Dto: Step3Dto, userId: string): Promise<boolean> {
        const { mainLineBusiness, meanMonthlyRevenue } = step3Dto


        return true;
    }


}



// temp code for reference 

// try {
//             // Check if a user with the given email already exists
//             const existingUser = await this.userSchema.findOne({ mail: step1Dto.mail });
//             if (existingUser) {
//                 throw new HttpException(
//                     'A user with this email already exists.',
//                     HttpStatus.CONFLICT
//                 );
//             }

//             // Check if a company with the given name already exists (case and space insensitive)
//             const normalizedName = step1Dto.name.replace(/\s+/g, '').toLowerCase();
//             const existingCompany = await this.companySchema.findOne({
//                 $expr: {
//                     $eq: [
//                         { $replaceAll: { input: { $toLower: "$name" }, find: " ", replacement: "" } },
//                         normalizedName
//                     ]
//                 }
//             });
//             if (existingCompany) {
//                 throw new HttpException(
//                     'A company with this name already exists.',
//                     HttpStatus.CONFLICT
//                 );
//             }

//             const company = new this.companySchema({
//                 name: step1Dto.name,
//                 location: step1Dto.location,
//                 number: step1Dto.contactNumber,
//                 taxId: step1Dto.taxId,
//                 onboardingProgress: 1,
//             });
//             const savedCompany = await company.save() as Company & { _id: string };


//             const user = new this.userSchema({
//                 mail: step1Dto.mail,
//                 company: savedCompany._id,
//             });

//             const savedUser = await user.save() as User & { _id: string };


//             await this.companySchema.findByIdAndUpdate(
//                 savedCompany._id,
//                 { $set: { "users.0": savedUser._id } },
//                 { new: true }
//             );

//             return { userId: savedUser._id, companyId: savedCompany._id };

//         }
//         catch (e) {
//             throw new HttpException(
//                 e,
//                 HttpStatus.BAD_REQUEST
//             );
//         }